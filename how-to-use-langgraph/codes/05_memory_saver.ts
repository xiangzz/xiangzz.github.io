/**
 * 对应章节：第05章 - 持久化
 * 知识点：MemorySaver、thread_id、状态累积、线程隔离
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你做了一个聊天机器人，但发现用户每次发消息，    │
 * │  AI 都像失忆了一样——完全不记得之前说过什么。          │
 * │  你需要让对话有"记忆"：同一用户的多次对话保持上下文。  │
 * │  不同用户的对话要互相隔离。                           │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：MemorySaver + thread_id = 按线程隔离的对话记忆
 *       同一 thread_id → 消息自动累积；不同 thread_id → 互相看不到
 */

import { StateGraph, StateSchema, MessagesValue, START, END, MemorySaver } from "@langchain/langgraph";
import { z } from "zod";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const State = new StateSchema({ messages: MessagesValue, turnCount: z.number() });

async function chatBot(state: typeof State.State) {
  const lastMsg = state.messages[state.messages.length - 1];
  const turn = Math.ceil(state.messages.length / 2) + 1;
  return {
    messages: [new AIMessage(`[第${turn}轮] 你说"${(lastMsg.content as string).substring(0, 15)}..."，我记住了。`)],
    turnCount: state.turnCount + 1,
  };
}

const graph = new StateGraph(State)
  .addNode("chatBot", chatBot)
  .addEdge(START, "chatBot").addEdge("chatBot", END)
  .compile({ checkpointer: new MemorySaver() }); // 关键：传入 checkpointer

async function main() {
  // Alice 的对话（thread_id = alice）
  const alice = { configurable: { thread_id: "alice" } };
  console.log("── Alice 的对话 ──");

  let r = await graph.invoke({ messages: [new HumanMessage("我叫 Alice")], turnCount: 0 }, alice);
  console.log(`AI: ${r.messages.at(-1).content} (消息数: ${r.messages.length})`);

  r = await graph.invoke({ messages: [new HumanMessage("你还记得我是谁吗？")], turnCount: 0 }, alice);
  console.log(`AI: ${r.messages.at(-1).content} (消息数: ${r.messages.length})`);

  // Bob 的对话（不同 thread_id = 完全隔离）
  const bob = { configurable: { thread_id: "bob" } };
  console.log("\n── Bob 的对话（隔离的）──");
  r = await graph.invoke({ messages: [new HumanMessage("我是谁？")], turnCount: 0 }, bob);
  console.log(`AI: ${r.messages.at(-1).content} (消息数: ${r.messages.length} — 没有 Alice 的记忆)`);
}

main().catch(console.error);
