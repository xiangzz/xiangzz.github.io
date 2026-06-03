/**
 * 对应章节：第10章 - 记忆管理
 * 知识点：语义搜索记忆、embeddings 配置
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：用户存了一条"学习 LangGraph 的工作流模式"，    │
 * │  后来说"怎么保存状态"——关键词完全不同，Store 怎么     │
 * │  找到相关的记忆？按关键词匹配肯定搜不到。             │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：给 Store 配置 embeddings，存储时自动生成向量，
 *       搜索时用语义相似度匹配。"保存状态"能匹配"持久化执行"。
 */

import { InMemoryStore } from "@langchain/langgraph";

async function basicOperations() {
  console.log("--- InMemoryStore 基本操作 ---");
  const store = new InMemoryStore();

  // 用 namespace 按用户组织数据
  await store.put(["users", "alice"], "profile", {
    name: "Alice",
    role: "前端工程师",
    skills: ["React", "TypeScript", "Node.js"],
  });

  await store.put(["users", "alice", "notes"], "note-1", {
    content: "学习 LangGraph 的工作流模式",
    date: "2024-01-15",
  });

  // 获取特定记录
  const profile = await store.get(["users", "alice"], "profile");
  console.log("get 结果:", profile?.value);

  // 基本搜索（无 embeddings 时为关键词匹配）
  const results = await store.search(["users", "alice"], { query: "前端" });
  console.log(`搜索 "前端" 返回 ${results.length} 条结果`);
}

function semanticSearchConfig() {
  console.log("\n--- 语义搜索配置 ---");
  console.log("要启用语义搜索，配置 embeddings：\n");
  console.log(`
  import { OpenAIEmbeddings } from "@langchain/openai";

  const store = new InMemoryStore({
    index: {
      embeddings: new OpenAIEmbeddings({
        model: "text-embedding-3-small",
      }),
      dims: 1536,  // embedding 维度
    },
  });

  // 存储时自动生成 embedding
  await store.put(["knowledge"], "doc1", {
    content: "LangGraph 支持持久化执行",
    category: "framework",
  });

  // 语义搜索："保存状态" 也能匹配 "持久化执行"
  const results = await store.search(["knowledge"], {
    query: "如何保存状态",
  });
  `);

  console.log("\n── 语义搜索 vs 关键词搜索 ──");
  console.log("  关键词搜索: '保存' 只能匹配包含 '保存' 的记录");
  console.log("  语义搜索: '保存' 也能匹配 '持久化'、'存储'、'数据保留'");
}

function usageInNode() {
  console.log("\n--- 在图节点中使用 Store ---");
  console.log(`
  const chatNode = async (state, runtime) => {
    const store = runtime.store;
    const userId = runtime.context?.userId;

    // 存储新记忆
    await store.put(["users", userId, "memories"], \`mem-\${Date.now()}\`, {
      fact: extractFact(state.messages),
      timestamp: Date.now(),
    });

    // 搜索相关记忆（注入到系统提示）
    const memories = await store.search(["users", userId, "memories"], {
      query: state.messages.at(-1).content,
    });

    const memoryContext = memories.map(m => m.value.fact).join("\\n");
    // 将记忆注入到 LLM 的系统提示中...
  };

  const graph = builder.compile({ checkpointer, store });
  `);
}

async function main() {
  console.log("── 语义搜索记忆 ──\n");
  await basicOperations();
  semanticSearchConfig();
  usageInNode();
}

main().catch(console.error);
