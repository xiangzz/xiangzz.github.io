/**
 * 对应章节：第01章 - LangGraph 概览
 * 知识点：State 设计、StateSchema、多种字段类型、MessagesValue、ReducedValue
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你在写一个「项目评审系统」，多个评审员会        │
 * │  同时给项目打分、写评语。你需要：                      │
 * │  - 记录当前状态（评审中 / 已通过 / 已拒绝）           │
 * │  - 收集所有评审员的标签（不会互相覆盖）               │
 * │  - 累加评审次数的计数器                               │
 * │  怎么设计一个 State 能同时满足这些需求？               │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：
 * - 状态/步骤 → 普通字段（后写的覆盖前值）
 * - 标签 → ReducedValue（用 reducer 合并，不覆盖）
 * - 计数器 → ReducedValue（用 reducer 累加）
 */

import {
  StateGraph,
  StateSchema,
  MessagesValue,
  ReducedValue,
  START,
  END,
} from "@langchain/langgraph";
import { z } from "zod";

// ── State 设计 ──
const ReviewState = new StateSchema({
  // 「普通字段」：后写的覆盖前值 —— 适合表示"当前状态"
  status: z.string(),
  step: z.number(),

  // 「MessagesValue」：消息自动追加 —— 适合对话场景
  messages: MessagesValue,

  // 「ReducedValue」：通过自定义 reducer 合并 —— 适合多节点写入同一字段
  tags: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (existing, update) => [...(existing ?? []), ...update],
  }),

  // 「ReducedValue」累加器 —— 适合计数
  reviewCount: new ReducedValue(z.number().default(() => 0), {
    inputSchema: z.number(),
    reducer: (total, inc) => (total ?? 0) + inc,
  }),
});

// ── 模拟两个评审员节点 ──

async function reviewerA(state: typeof ReviewState.State) {
  console.log("[评审员A] 打标签 +1，投票+1");
  return {
    status: "A 已评审",        // 覆盖
    step: 1,                   // 覆盖
    tags: ["创新性强"],         // 合并
    reviewCount: 1,            // 累加
  };
}

async function reviewerB(state: typeof ReviewState.State) {
  console.log("[评审员B] 打标签 +2，投票+1");
  console.log(`  看到 A 的状态: ${state.status}`);
  console.log(`  看到 A 的标签: ${state.tags}`);
  return {
    status: "B 已评审",        // 覆盖 A 的
    step: 2,                   // 覆盖
    tags: ["技术扎实", "可落地"], // 合并到 A 的标签后面
    reviewCount: 1,            // 累加
  };
}

const graph = new StateGraph(ReviewState)
  .addNode("reviewerA", reviewerA)
  .addNode("reviewerB", reviewerB)
  .addEdge(START, "reviewerA")
  .addEdge("reviewerA", "reviewerB")
  .addEdge("reviewerB", END)
  .compile();

async function main() {
  const result = await graph.invoke({
    status: "待评审",
    step: 0,
    messages: [],
    tags: [],
    reviewCount: 0,
  });

  console.log("\n── 最终状态 ──");
  console.log(`status:      ${result.status}      ← 后写覆盖（B 的）`);
  console.log(`step:        ${result.step}             ← 后写覆盖`);
  console.log(`tags:        ${result.tags}  ← 合并了两个人的标签`);
  console.log(`reviewCount: ${result.reviewCount}             ← 累加了两次`);
}

main().catch(console.error);
