/**
 * 对应章节：第09章 - 时间旅行
 * 知识点：asNode 参数、控制执行起点
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的图有 step1→step2→step3 三步。你想模拟     │
 * │  "如果 step2 的输出是 X 而不是 Y，后续会怎样"。      │
 * │  updateState 修改了状态，但图怎么知道从哪一步继续？   │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：updateState 的第三个参数 asNode 告诉 LangGraph
 *       " pretend 这个更新是由某个节点输出的"。
 *       不同的 asNode 值决定下一步执行哪个节点。
 */

import {
  StateGraph, StateSchema, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  step1Result: z.string(),
  step2Result: z.string(),
  step3Result: z.string(),
});

async function step1(state: typeof State.State) {
  console.log("[step1] 执行");
  return { step1Result: "步骤1完成" };
}
async function step2(state: typeof State.State) {
  console.log("[step2] 执行");
  return { step2Result: "步骤2完成" };
}
async function step3(state: typeof State.State) {
  console.log("[step3] 执行");
  return { step3Result: "步骤3完成" };
}

const checkpointer = new MemorySaver();
const graph = new StateGraph(State)
  .addNode("step1", step1)
  .addNode("step2", step2)
  .addNode("step3", step3)
  .addEdge(START, "step1")
  .addEdge("step1", "step2")
  .addEdge("step2", "step3")
  .addEdge("step3", END)
  .compile({ checkpointer });

async function main() {
  console.log("── asNode 参数 ──\n");

  const config = { configurable: { thread_id: "asnode-demo" } };
  await graph.invoke({ step1Result: "", step2Result: "", step3Result: "" }, config);

  const checkpoints: any[] = [];
  for await (const state of graph.getStateHistory(config)) {
    checkpoints.push(state);
  }

  // 找到 step2 完成后的检查点（next 是 ["step3"]）
  const afterStep2 = checkpoints.find(cp => cp.next?.includes("step3"));
  if (!afterStep2) { console.log("未找到目标检查点"); return; }

  console.log(`找到检查点: next=${JSON.stringify(afterStep2.next)}\n`);

  // 不指定 asNode：直接修改状态，next 不变
  console.log("--- 不指定 asNode ---");
  await graph.updateState(afterStep2.config, { step2Result: "手动修改的步骤2" });
  let snapshot = await graph.getState(config);
  console.log(`next: ${JSON.stringify(snapshot.next)}`);
  console.log(`step2Result: "${snapshot.values.step2Result}"`);
  console.log("解释：直接修改状态，执行位置不变\n");

  // asNode: "step2" → 模拟 step2 的输出，next 指向 step3
  console.log("--- asNode: 'step2' ---");
  await graph.updateState(
    afterStep2.config,
    { step2Result: "模拟 step2 输出" },
    { asNode: "step2" }
  );
  snapshot = await graph.getState(config);
  console.log(`next: ${JSON.stringify(snapshot.next)}`);
  console.log("解释：假装 step2 刚输出，next 指向 step2 之后（step3）\n");

  // asNode: "step3" → 模拟 step3 的输出，next 指向 END
  console.log("--- asNode: 'step3' ---");
  await graph.updateState(
    afterStep2.config,
    { step3Result: "模拟 step3 输出" },
    { asNode: "step3" }
  );
  snapshot = await graph.getState(config);
  console.log(`next: ${JSON.stringify(snapshot.next)}`);
  console.log("解释：假装 step3 刚输出，next 指向 END\n");

  console.log("── asNode 适用场景 ──");
  console.log("  - Fork 新线程时：控制从哪个节点开始执行");
  console.log("  - 调试时：跳过某个节点，直接模拟它的输出");
  console.log("  - 并行分支中：指定从哪个分支节点继续");
}

main().catch(console.error);
