/**
 * 对应章节：第02章 - 基础工作流模式
 * 知识点：ReducedValue 解决并行写入冲突
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：两个节点并行执行，都要往同一个字段写结果。      │
 * │  你发现最终只保留了一个节点的输出，另一个被覆盖了。   │
 * │  怎么让两个节点的结果都保留？                         │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：普通字段后写覆盖前值 → 改用 ReducedValue，通过 reducer 合并
 */

import { StateGraph, StateSchema, ReducedValue, START, END } from "@langchain/langgraph";
import { z } from "zod";

// ═══════ 先看不加 ReducedValue 的问题 ═══════

const BadState = new StateSchema({ result: z.string() }); // 普通字段

async function writerA() {
  console.log("[A] 写入 result = '来自 A'");
  return { result: "来自 A" };
}
async function writerB() {
  console.log("[B] 写入 result = '来自 B'");
  return { result: "来自 B" };
}

const badGraph = new StateGraph(BadState)
  .addNode("A", writerA).addNode("B", writerB)
  .addEdge(START, "A").addEdge(START, "B")
  .addEdge("A", END).addEdge("B", END)
  .compile();

// ═══════ 修复：用 ReducedValue ═══════

const GoodState = new StateSchema({
  results: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (existing, update) => [...(existing ?? []), ...update],
  }),
});

async function writerAFixed() {
  console.log("[A] 写入 results = ['来自 A']");
  return { results: ["来自 A"] };
}
async function writerBFixed() {
  console.log("[B] 写入 results = ['来自 B']");
  return { results: ["来自 B"] };
}

const goodGraph = new StateGraph(GoodState)
  .addNode("A", writerAFixed).addNode("B", writerBFixed)
  .addEdge(START, "A").addEdge(START, "B")
  .addEdge("A", END).addEdge("B", END)
  .compile();

async function main() {
  console.log("── 不用 ReducedValue ──");
  const bad = await badGraph.invoke({ result: "" });
  console.log(`结果: "${bad.result}" ← 只剩一个！\n`);

  console.log("── 使用 ReducedValue ──");
  const good = await goodGraph.invoke({ results: [] });
  console.log(`结果: ${JSON.stringify(good.results)} ← 两个都保留了！`);
}

main().catch(console.error);
