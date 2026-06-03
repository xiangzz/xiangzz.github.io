/**
 * 对应章节：第05章 - 持久化
 * 知识点：getState、getStateHistory、updateState
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的 Agent 运行了好几步，现在你想：            │
 * │  - 看看当前的状态是什么                               │
 * │  - 翻看之前每一步的历史记录                           │
 * │  - 直接手动改一下状态里的某个值                       │
 * │  怎么做到？                                           │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：getState() 看当前、getStateHistory() 翻历史、updateState() 手动改
 */

import { StateGraph, StateSchema, MessagesValue, START, END, MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { AIMessage } from "@langchain/core/messages";

const State = new StateSchema({ messages: MessagesValue, counter: z.number() });

async function increment(state: typeof State.State) {
  return { messages: [new AIMessage(`计数: ${state.counter + 1}`)], counter: state.counter + 1 };
}

const graph = new StateGraph(State)
  .addNode("increment", increment)
  .addEdge(START, "increment").addEdge("increment", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  const config = { configurable: { thread_id: "snapshot-demo" } };

  // 执行 3 次
  await graph.invoke({ messages: [], counter: 0 }, config);
  await graph.invoke({ messages: [], counter: 0 }, config);
  await graph.invoke({ messages: [], counter: 0 }, config);

  // 1. getState() 看当前
  console.log("── getState(): 当前快照 ──");
  const snap = await graph.getState(config);
  console.log(`  counter = ${snap.values.counter}, next = ${JSON.stringify(snap.next)}`);

  // 2. getStateHistory() 翻历史
  console.log("\n── getStateHistory(): 历史检查点 ──");
  for await (const h of graph.getStateHistory(config)) {
    console.log(`  counter=${h.values.counter}, next=${JSON.stringify(h.next)}`);
  }

  // 3. updateState() 手动改
  console.log("\n── updateState(): 手动修改 ──");
  await graph.updateState(config, { counter: 999 });
  const updated = await graph.getState(config);
  console.log(`  修改后 counter = ${updated.values.counter}`);
}

main().catch(console.error);
