/**
 * 综合性大型作业：智能文档审核发布系统 - 示例答案
 *
 * 涵盖知识点：
 * - 第1章：StateGraph + StateSchema（多字段 State、MessagesValue、ReducedValue）
 * - 第2章：Prompt Chaining + 并行化 + 路由
 * - 第3章：Orchestrator-Worker + Evaluator-Optimizer
 * - 第4章：工具定义 + ToolNode
 * - 第5章：MemorySaver + InMemoryStore
 * - 第6章：task() 包裹副作用
 * - 第7章：流式输出（custom + updates）
 * - 第8章：interrupt 人机交互
 * - 第9章：时间旅行 Replay/Fork
 * - 第10章：消息管理 + 长期记忆
 * - 第11章：子图组合
 */
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  ReducedValue,
  START,
  END,
  MemorySaver,
  InMemoryStore,
  Send,
  Command,
  interrupt,
} from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

// ============================================================
// 第一部分：State 定义（第1章）
// ============================================================

const DocumentReviewState = new StateSchema({
  // 文档基本信息
  document: z.string(),                              // 原始文档内容
  docType: z.enum(["tutorial", "api", "blog"]),      // 文档类型
  title: z.string(),                                 // 文档标题

  // 处理结果
  formatPassed: z.boolean(),                         // 格式检查是否通过
  reviews: new ReducedValue(                         // 并行评审结果（合并）
    z.array(z.object({
      dimension: z.string(),
      score: z.number(),
      comment: z.string(),
    })).default(() => []),
    {
      inputSchema: z.array(z.object({
        dimension: z.string(),
        score: z.number(),
        comment: z.string(),
      })),
      reducer: (a, b) => [...(a ?? []), ...b],
    }
  ),

  sections: z.array(z.object({ title: z.string(), content: z.string() })), // 分段
  sectionReviews: new ReducedValue(                  // 分段审核结果
    z.array(z.string()).default(() => []),
    {
      inputSchema: z.array(z.string()),
      reducer: (a, b) => [...(a ?? []), ...b],
    }
  ),

  polishedContent: z.string(),                       // 润色后的内容
  polishAttempts: z.number(),                        // 润色尝试次数
  humanApproved: z.boolean(),                        // 人工审核结果
  humanEdits: z.string(),                            // 人工编辑内容
  publishedAt: z.string(),                           // 发布时间
  status: z.string(),                                // 当前状态

  // 消息和工具调用
  messages: MessagesValue,                           // 消息历史

  // 统计
  wordCount: z.number(),                             // 字数
  keywords: z.array(z.string()),                     // 关键词
});

// ============================================================
// 第二部分：工具定义（第4章）
// ============================================================

const wordCountTool = tool(
  async ({ text }) => {
    const count = text.split(/\s+/).filter(Boolean).length;
    console.log(`  [工具] 字数统计: ${count}`);
    return `字数: ${count}`;
  },
  {
    name: "word_count",
    description: "统计文本字数",
    schema: z.object({ text: z.string() }),
  }
);

const checkPlagiarismTool = tool(
  async ({ text }) => {
    console.log(`  [工具] 查重检测`);
    // 模拟查重
    const score = Math.random() * 15; // 0-15% 相似度
    return `查重率: ${score.toFixed(1)}%（通过）`;
  },
  {
    name: "check_plagiarism",
    description: "检测文本查重率",
    schema: z.object({ text: z.string() }),
  }
);

const extractKeywordsTool = tool(
  async ({ text }) => {
    console.log(`  [工具] 关键词提取`);
    // 模拟关键词提取
    const keywords = ["LangGraph", "Agent", "状态图"];
    return `关键词: ${keywords.join(", ")}`;
  },
  {
    name: "extract_keywords",
    description: "从文本中提取关键词",
    schema: z.object({ text: z.string() }),
  }
);

const toolsByName: Record<string, any> = {
  word_count: wordCountTool,
  check_plagiarism: checkPlagiarismTool,
  extract_keywords: extractKeywordsTool,
};

// ============================================================
// 第三部分：子图定义（第11章）
// ============================================================

// --- 评审子图 ---
const ReviewSubState = new StateSchema({
  document: z.string(),
  reviews: new ReducedValue(
    z.array(z.object({ dimension: z.string(), score: z.number(), comment: z.string() })).default(() => []),
    {
      inputSchema: z.array(z.object({ dimension: z.string(), score: z.number(), comment: z.string() })),
      reducer: (a, b) => [...(a ?? []), ...b],
    }
  ),
});

async function reviewAccuracy(state: typeof ReviewSubState.State) {
  console.log("  [评审] 技术准确性检查...");
  return {
    reviews: [{ dimension: "技术准确性", score: 85, comment: "技术描述基本准确" }],
  };
}

async function reviewReadability(state: typeof ReviewSubState.State) {
  console.log("  [评审] 可读性检查...");
  return {
    reviews: [{ dimension: "可读性", score: 78, comment: "部分段落可以更简洁" }],
  };
}

async function reviewCompleteness(state: typeof ReviewSubState.State) {
  console.log("  [评审] 完整性检查...");
  return {
    reviews: [{ dimension: "完整性", score: 90, comment: "内容覆盖全面" }],
  };
}

const reviewSubgraph = new StateGraph(ReviewSubState)
  .addNode("reviewAccuracy", reviewAccuracy)
  .addNode("reviewReadability", reviewReadability)
  .addNode("reviewCompleteness", reviewCompleteness)
  .addEdge(START, "reviewAccuracy")
  .addEdge(START, "reviewReadability")
  .addEdge(START, "reviewCompleteness")
  .addEdge("reviewAccuracy", END)
  .addEdge("reviewReadability", END)
  .addEdge("reviewCompleteness", END)
  .compile();

// --- 润色子图（Evaluator-Optimizer 模式）---
const PolishSubState = new StateSchema({
  content: z.string(),
  polishedContent: z.string(),
  attempts: z.number(),
  qualityScore: z.number(),
});

async function polishGenerator(state: typeof PolishSubState.State) {
  console.log(`  [润色] 第 ${state.attempts + 1} 次润色...`);
  // 模拟润色
  const polished = state.polishedContent || state.content;
  return {
    polishedContent: `✨ ${polished}（已润色 v${state.attempts + 1}）`,
    attempts: state.attempts + 1,
  };
}

async function polishEvaluator(state: typeof PolishSubState.State) {
  console.log(`  [评估] 润色质量评估...`);
  // 模拟：前两次质量不够，第三次通过
  const score = state.attempts >= 2 ? 85 : 60;
  return { qualityScore: score };
}

function shouldPolishAgain(state: typeof PolishSubState.State): string {
  if (state.qualityScore >= 80) {
    console.log(`  [评估] 质量达标 (${state.qualityScore})`);
    return END;
  }
  if (state.attempts >= 3) {
    console.log(`  [评估] 达到最大次数 (${state.attempts})`);
    return END;
  }
  console.log(`  [评估] 质量不够 (${state.qualityScore})，继续润色`);
  return "polishGenerator";
}

const polishSubgraph = new StateGraph(PolishSubState)
  .addNode("polishGenerator", polishGenerator)
  .addNode("polishEvaluator", polishEvaluator)
  .addEdge(START, "polishGenerator")
  .addEdge("polishGenerator", "polishEvaluator")
  .addConditionalEdges("polishEvaluator", shouldPolishAgain, {
    polishGenerator: "polishGenerator",
  })
  .compile();

// ============================================================
// 第四部分：主图节点（第2-3章 + 第5-10章）
// ============================================================

// --- 节点1：格式检查（Prompt Chaining 第一步）---
async function formatCheck(state: typeof DocumentReviewState.State, config: any) {
  console.log("[格式检查] 检查文档格式...");
  config?.writer?.({ step: "格式检查", progress: 10 });

  const doc = state.document;
  const passed = doc.length > 50 && doc.includes("\n");

  console.log(`  格式检查: ${passed ? "通过 ✅" : "不通过 ❌"}`);
  return { formatPassed: passed, status: passed ? "格式检查通过" : "格式检查失败" };
}

// --- 节点2：内容分析（Prompt Chaining 第二步）---
async function contentAnalysis(state: typeof DocumentReviewState.State, config: any) {
  console.log("[内容分析] 分析文档内容...");
  config?.writer?.({ step: "内容分析", progress: 20 });

  // 确定文档类型
  let docType: "tutorial" | "api" | "blog" = "tutorial";
  if (state.document.includes("API") || state.document.includes("接口")) docType = "api";
  if (state.document.includes("博客") || state.document.includes("随笔")) docType = "blog";

  return { docType };
}

// --- 节点3：路由（第2章）---
function routeByFormat(state: typeof DocumentReviewState.State): string {
  return state.formatPassed ? "runReview" : END;
}

function routeByDocType(state: typeof DocumentReviewState.State): string {
  console.log(`  路由: 文档类型=${state.docType}`);
  const routes: Record<string, string> = {
    tutorial: "processTutorial",
    api: "processApi",
    blog: "processBlog",
  };
  return routes[state.docType] || "processTutorial";
}

// --- 节点4a/4b/4c：类型特定处理（路由目标）---
async function processTutorial(state: typeof DocumentReviewState.State) {
  console.log("[处理] 教程文档处理");
  return { status: "教程处理完成" };
}
async function processApi(state: typeof DocumentReviewState.State) {
  console.log("[处理] API 文档处理");
  return { status: "API文档处理完成" };
}
async function processBlog(state: typeof DocumentReviewState.State) {
  console.log("[处理] 博客文档处理");
  return { status: "博客处理完成" };
}

// --- 节点5：调用评审子图（第11章：节点内调用）---
async function runReview(state: typeof DocumentReviewState.State, config: any) {
  console.log("[评审] 调用评审子图...");
  config?.writer?.({ step: "并行评审", progress: 40 });

  // 调用评审子图（手动映射 State）
  const reviewResult = await reviewSubgraph.invoke({
    document: state.document,
    reviews: [],
  });

  return { reviews: reviewResult.reviews };
}

// --- 节点6：Orchestrator-Worker 分段审核（第3章：Send API）---
async function splitSections(state: typeof DocumentReviewState.State) {
  console.log("[分段] 将文档分为多个段落...");
  // 模拟分段
  const sections = [
    { title: "引言", content: "这是引言部分..." },
    { title: "正文", content: "这是正文部分..." },
    { title: "总结", content: "这是总结部分..." },
  ];
  return { sections };
}

function assignSectionWorkers(state: typeof DocumentReviewState.State) {
  console.log(`[分发] 为 ${state.sections.length} 个段落创建 Worker`);
  return state.sections.map((section) =>
    new Send("reviewSection", { section } as any)
  );
}

// Worker State for section review
const SectionWorkerState = new StateSchema({
  section: z.object({ title: z.string(), content: z.string() }),
  sectionReviews: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (a, b) => [...(a ?? []), ...b],
  }),
});

async function reviewSection(state: typeof SectionWorkerState.State) {
  console.log(`  [Worker] 审核段落: ${state.section.title}`);
  return { sectionReviews: [`段落"${state.section.title}"审核通过`] };
}

// --- 节点7：调用润色子图（Evaluator-Optimizer，第3+11章）---
async function runPolish(state: typeof DocumentReviewState.State, config: any) {
  console.log("[润色] 调用润色子图...");
  config?.writer?.({ step: "自动润色", progress: 60 });

  const polishResult = await polishSubgraph.invoke({
    content: state.document,
    polishedContent: "",
    attempts: 0,
    qualityScore: 0,
  });

  return {
    polishedContent: polishResult.polishedContent,
    polishAttempts: polishResult.attempts,
  };
}

// --- 节点8：人工审核（第8章：interrupt）---
async function humanReview(state: typeof DocumentReviewState.State, config: any) {
  console.log("[人工审核] 请求人工审核...");
  config?.writer?.({ step: "等待人工审核", progress: 80 });

  const decision = interrupt({
    message: "文档已润色完成，请审核",
    polishedContent: state.polishedContent,
    reviews: state.reviews,
    options: ["approve", "edit", "reject"],
  });

  console.log(`[人工审核] 用户决定: ${decision}`);

  if (decision === "approve") {
    return { humanApproved: true, status: "人工审核通过" };
  } else if (decision === "edit") {
    // 用户编辑了内容
    return {
      humanApproved: true,
      humanEdits: `${state.polishedContent}（已人工修改）`,
      status: "人工编辑后通过",
    };
  }
  return { humanApproved: false, status: "人工审核驳回" };
}

// --- 节点9：发布（第6章：task() 幂等操作）---
async function publish(state: typeof DocumentReviewState.State, config: any) {
  if (!state.humanApproved) {
    console.log("[发布] 审核未通过，跳过发布");
    return { status: "未发布（审核未通过）" };
  }

  console.log("[发布] 发布文档...");
  config?.writer?.({ step: "发布中", progress: 95 });

  // 实际场景中用 task() 包裹发布操作
  console.log("  [发布操作] 幂等发布（如果已发布则跳过）");
  const publishedAt = new Date().toISOString();

  return {
    publishedAt,
    status: `已发布 ✅ (${publishedAt})`,
  };
}

// --- 节点10：存储用户偏好（第10章：InMemoryStore）---
async function savePreferences(state: typeof DocumentReviewState.State, runtime: any) {
  if (runtime.store) {
    const userId = runtime.context?.userId || "default";
    await runtime.store.put(["users", userId, "preferences"], "lastDocType", {
      docType: state.docType,
      timestamp: Date.now(),
    });
    console.log(`[偏好] 已保存用户偏好: ${state.docType}`);
  }
  return {};
}

// --- 格式检查失败处理 ---
function formatFailedEnd(state: typeof DocumentReviewState.State) {
  console.log("[结束] 格式检查失败，流程终止");
  return { status: "格式检查失败，请修改后重新提交" };
}

// ============================================================
// 第五部分：构建主图
// ============================================================

const checkpointer = new MemorySaver();
const store = new InMemoryStore();

const mainGraph = new StateGraph(DocumentReviewState)
  // 添加节点
  .addNode("formatCheck", formatCheck)
  .addNode("contentAnalysis", contentAnalysis)
  .addNode("processTutorial", processTutorial)
  .addNode("processApi", processApi)
  .addNode("processBlog", processBlog)
  .addNode("runReview", runReview)
  .addNode("splitSections", splitSections)
  .addNode("reviewSection", reviewSection) // Send 目标节点
  .addNode("runPolish", runPolish)
  .addNode("humanReview", humanReview)
  .addNode("publish", publish)
  .addNode("savePreferences", savePreferences)
  .addNode("formatFailedEnd", formatFailedEnd)

  // 边：格式检查 → 内容分析
  .addEdge(START, "formatCheck")
  .addEdge("formatCheck", "contentAnalysis")

  // 条件路由：格式检查是否通过
  .addConditionalEdges("contentAnalysis", routeByFormat, {
    runReview: "runReview",
    formatFailedEnd: "formatFailedEnd",
  })

  // 格式检查失败分支
  .addEdge("formatFailedEnd", END)

  // 评审后路由到类型处理
  .addConditionalEdges("runReview", routeByDocType, {
    processTutorial: "processTutorial",
    processApi: "processApi",
    processBlog: "processBlog",
  })

  // 类型处理后 → 分段审核
  .addEdge("processTutorial", "splitSections")
  .addEdge("processApi", "splitSections")
  .addEdge("processBlog", "splitSections")

  // Orchestrator-Worker：分段审核（Send API）
  .addConditionalEdges("splitSections", assignSectionWorkers, ["reviewSection"])

  // 所有 Worker 完成 → 润色
  .addEdge("reviewSection", "runPolish")

  // 润色 → 人工审核 → 发布 → 保存偏好 → 结束
  .addEdge("runPolish", "humanReview")
  .addEdge("humanReview", "publish")
  .addEdge("publish", "savePreferences")
  .addEdge("savePreferences", END)

  // 编译（传入 checkpointer 和 store）
  .compile({ checkpointer, store });

// ============================================================
// 第六部分：运行演示
// ============================================================

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   智能文档审核发布系统 - 完整演示         ║");
  console.log("╚══════════════════════════════════════════╝\n");

  const config = {
    configurable: { thread_id: "doc-review-001" },
    context: { userId: "user-alice" },
  };

  const sampleDocument = `
# LangGraph 入门教程

LangGraph 是一个用于构建有状态 AI 应用的框架。

## 核心概念

### 节点（Node）
节点是图中的处理单元，接收状态并返回更新。

### 边（Edge）
边定义节点之间的连接和执行顺序。

### 状态（State）
状态是所有节点共享的数据结构。

## 快速开始

1. 安装依赖：npm install @langchain/langgraph
2. 定义 State
3. 创建节点和边
4. 编译并调用

这个教程涵盖了 LangGraph 的基础知识。
  `.trim();

  // ========== 第一次调用：触发人工审核中断 ==========
  console.log("--- 第一次调用（执行到人工审核时中断）---\n");

  let result = await mainGraph.invoke(
    {
      document: sampleDocument,
      docType: "tutorial",
      title: "LangGraph 入门教程",
      formatPassed: false,
      reviews: [],
      sections: [],
      sectionReviews: [],
      polishedContent: "",
      polishAttempts: 0,
      humanApproved: false,
      humanEdits: "",
      publishedAt: "",
      status: "初始化",
      messages: [],
      wordCount: 0,
      keywords: [],
    },
    config
  );

  // 检查是否触发中断
  if (result.__interrupt__) {
    console.log("\n中断信息:", result.__interrupt__[0].value.message);

    // ========== 第二次调用：恢复中断（批准发布）==========
    console.log("\n--- 第二次调用（批准发布）---\n");
    result = await mainGraph.invoke(
      new Command({ resume: "approve" }),
      config
    );
  }

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   最终结果                                ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`状态: ${result.status}`);
  console.log(`文档类型: ${result.docType}`);
  console.log(`评审结果: ${result.reviews.length} 个维度`);
  console.log(`润色尝试: ${result.polishAttempts} 次`);
  console.log(`人工审核: ${result.humanApproved ? "通过" : "未通过"}`);
  console.log(`发布时间: ${result.publishedAt || "未发布"}`);

  // ========== 时间旅行演示（第9章）==========
  console.log("\n\n--- 时间旅行：查看历史检查点 ---");
  const history: any[] = [];
  for await (const state of mainGraph.getStateHistory(config)) {
    history.push(state);
  }
  console.log(`共 ${history.length} 个检查点：`);
  history.slice(0, 5).forEach((h, i) => {
    console.log(`  [${i}] status="${h.values.status}", next=${JSON.stringify(h.next)}`);
  });

  // ========== 流式输出演示（第7章）==========
  console.log("\n\n--- 流式输出演示 ---");
  const streamConfig = {
    configurable: { thread_id: "doc-review-stream" },
    context: { userId: "user-bob" },
  };

  for await (const chunk of await mainGraph.stream(
    {
      document: sampleDocument,
      docType: "api",
      title: "API 文档示例",
      formatPassed: false,
      reviews: [],
      sections: [],
      sectionReviews: [],
      polishedContent: "",
      polishAttempts: 0,
      humanApproved: false,
      humanEdits: "",
      publishedAt: "",
      status: "初始化",
      messages: [],
      wordCount: 0,
      keywords: [],
    },
    { ...streamConfig, streamMode: "updates" }
  )) {
    for (const [node, update] of Object.entries(chunk)) {
      if (update.status) {
        console.log(`  [${node}] → ${update.status}`);
      }
    }
  }

  console.log("\n✅ 智能文档审核发布系统演示完成！");
}

main().catch(console.error);
