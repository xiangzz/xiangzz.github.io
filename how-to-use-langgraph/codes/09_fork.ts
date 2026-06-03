/**
 * 对应章节：第09章 - 时间旅行
 * 知识点：Fork（分叉）、updateState 修改历史、创建新时间线
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的笑话图跑完了，主题是"程序员"。现在你想    │
 * │  看看如果主题换成"数学老师"，笑话会怎样——但原始结果  │
 * │  不能丢。怎么在不影响原时间线的情况下，分叉出一条新路径？│
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：找到历史检查点 → updateState() 修改状态 → 用新 thread_id
 *       invoke → 原时间线不动，新线程从修改后的状态继续执行。
 */

import {
  StateGraph, StateSchema, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  topic: z.string(),
  joke: z.string(),
  rating: z.string(),
});

async function generateTopic(state: typeof State.State) {
  return { topic: state.topic || "默认话题" };
}

async function writeJoke(state: typeof State.State) {
  return { joke: `${state.topic}？这是一个笑话。` };
}

async function rateJoke(state: typeof State.State) {
  return { rating: "⭐⭐⭐" };
}

const checkpointer = new MemorySaver();
const graph = new StateGraph(State)
  .addNode("generateTopic", generateTopic)
  .addNode("writeJoke", writeJoke)
  .addNode("rateJoke", rateJoke)
  .addEdge(START, "generateTopic")
  .addEdge("generateTopic", "writeJoke")
  .addEdge("writeJoke", "rateJoke")
  .addEdge("rateJoke", END)
  .compile({ checkpointer });

async function main() {
  console.log("── Fork（分叉）──\n");

  const config = { configurable: { thread_id: "fork-original" } };

  // 原始时间线
  console.log("--- 原始时间线 ---");
  const original = await graph.invoke({ topic: "程序员", joke: "", rating: "" }, config);
  console.log(`原始结果: topic="${original.topic}", joke="${original.joke}"\n`);

  // 找到 generateTopic 完成后的检查点
  const checkpoints: any[] = [];
  for await (const state of graph.getStateHistory(config)) {
    checkpoints.push(state);
  }

  const beforeJoke = checkpoints.find(cp => cp.next?.includes("writeJoke"));
  if (!beforeJoke) { console.log("未找到目标检查点"); return; }

  console.log(`找到检查点: next=${JSON.stringify(beforeJoke.next)}`);
  console.log(`当前 topic: "${beforeJoke.values.topic}"`);

  // Fork：修改 topic，创建新时间线
  console.log("\n--- Fork：修改 topic 为 '数学老师' ---");
  await graph.updateState(beforeJoke.config, { topic: "数学老师" });

  // 用新 thread_id 执行
  const forkConfig = { configurable: { thread_id: "fork-branch-1" } };
  const forked = await graph.invoke(null, forkConfig);

  console.log(`\nFork 结果: topic="${forked.topic}", joke="${forked.joke}"`);

  // 两条时间线对比
  console.log("\n── 两条时间线对比 ──");
  console.log(`原始: topic="${original.topic}" → joke="${original.joke}"`);
  console.log(`Fork: topic="${forked.topic}" → joke="${forked.joke}"`);

  console.log("\n── Fork 关键步骤 ──");
  console.log("  1. getStateHistory() 找到目标检查点");
  console.log("  2. updateState(targetConfig, { 修改的数据 })");
  console.log("  3. invoke(null, forkConfig) 用新 thread_id 执行");
  console.log("  4. 原始时间线完全不受影响");
}

main().catch(console.error);
