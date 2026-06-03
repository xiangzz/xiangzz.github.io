/**
 * 对应章节：第06章 - 持久执行
 * 知识点：崩溃恢复模拟
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的 Agent 有 3 个步骤。运行到第 2 步时，      │
 * │  服务器突然崩了。你想在恢复后从第 2 步继续，          │
 * │  而不是从头开始。怎么做？                             │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：MemorySaver 在每步完成后保存检查点
 *       崩溃后用同一 thread_id 重新 invoke → 自动从检查点恢复
 */

import { StateGraph, StateSchema, START, END, MemorySaver } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  currentStep: z.number(),
  results: z.array(z.string()),
  status: z.string(),
});

let runCount = 0;

async function step1(state: typeof State.State) {
  console.log("[step1] 执行...");
  return { currentStep: 1, results: [...state.results, "步骤1完成"] };
}

async function step2(state: typeof State.State) {
  console.log("[step2] 执行...");
  runCount++;
  if (runCount === 1) {
    console.log("  💥 模拟崩溃！");
    throw new Error("服务器断电");
  }
  return { currentStep: 2, results: [...state.results, "步骤2完成"] };
}

async function step3(state: typeof State.State) {
  console.log("[step3] 执行...");
  return { currentStep: 3, results: [...state.results, "步骤3完成"], status: "全部完成 ✅" };
}

const graph = new StateGraph(State)
  .addNode("step1", step1).addNode("step2", step2).addNode("step3", step3)
  .addEdge(START, "step1").addEdge("step1", "step2").addEdge("step2", "step3").addEdge("step3", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  const config = { configurable: { thread_id: "recovery-demo" } };
  const initial = { currentStep: 0, results: [], status: "进行中" };

  // 第一次运行：在 step2 崩溃
  console.log("── 第一次运行（step2 崩溃）──");
  try { await graph.invoke(initial, config); } catch (e: any) { console.log(`  捕获: ${e.message}\n`); }

  // 看检查点
  const snap = await graph.getState(config);
  console.log(`检查点: step=${snap.values.currentStep}, results=${JSON.stringify(snap.values.results)}`);
  console.log(`  step1 已完成，step2 是下一步\n`);

  // 恢复：同一 thread_id 再 invoke
  console.log("── 恢复执行（从检查点继续）──");
  const r = await graph.invoke(initial, config);
  console.log(`\n最终: step=${r.currentStep}, results=${r.results}, status=${r.status}`);
}

main().catch(console.error);
