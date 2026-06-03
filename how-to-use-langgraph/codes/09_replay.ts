/**
 * 对应章节：第09章 - 时间旅行
 * 知识点：Replay（回放）、getStateHistory、invoke(null, config)
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的笑话生成图已经跑完了，但你发现第二个节点  │
 * │  （写笑话）的输出不太理想。你想看看如果从那一步开始   │
 * │  重新执行，结果会不会不同。怎么"时光倒流"重跑？      │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：checkpointer 保存了每个节点执行后的快照（检查点）。
 *       getStateHistory() 列出所有历史检查点，找到目标检查点后，
 *       用 invoke(null, historicalConfig) 从该点重新执行。
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
  console.log("[generateTopic] 执行中...");
  return { topic: "为什么程序员喜欢黑色主题" };
}

async function writeJoke(state: typeof State.State) {
  console.log("[writeJoke] 执行中...");
  return { joke: `${state.topic}？因为在光明中，bug 无处藏身。` };
}

async function rateJoke(state: typeof State.State) {
  console.log("[rateJoke] 执行中...");
  return { rating: "⭐⭐⭐⭐⭐ (5/5) - 经典！" };
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
  console.log("── Replay（回放）──\n");

  const config = { configurable: { thread_id: "replay-demo" } };

  // 原始执行
  console.log("--- 原始执行 ---");
  const original = await graph.invoke({ topic: "", joke: "", rating: "" }, config);
  console.log(`主题: ${original.topic}`);
  console.log(`笑话: ${original.joke}`);
  console.log(`评分: ${original.rating}\n`);

  // 获取历史检查点
  console.log("--- 检查点历史 ---");
  const checkpoints: any[] = [];
  for await (const state of graph.getStateHistory(config)) {
    checkpoints.push(state);
  }

  console.log(`共 ${checkpoints.length} 个检查点：`);
  checkpoints.forEach((cp, i) => {
    console.log(`  [${i}] next=${JSON.stringify(cp.next)}, topic="${cp.values.topic}"`);
  });

  // 找到 generateTopic 完成后、writeJoke 执行前的检查点
  const beforeJoke = checkpoints.find(cp => cp.next?.includes("writeJoke"));

  if (beforeJoke) {
    console.log("\n--- Replay 到 writeJoke 之前 ---");
    // invoke(null, beforeJoke.config) 从该检查点重新执行
    const replayed = await graph.invoke(null, beforeJoke.config);
    console.log(`回放结果:`);
    console.log(`  主题: ${replayed.topic}`);
    console.log(`  笑话: ${replayed.joke}`);
    console.log(`  评分: ${replayed.rating}`);
  }

  console.log("\n── Replay 注意事项 ──");
  console.log("  1. Replay 会重新执行节点（LLM 调用、API 都会重新触发）");
  console.log("  2. 不是读缓存，是真正重新运行");
  console.log("  3. 如果节点有 interrupt，回放时会重新触发中断");
}

main().catch(console.error);
