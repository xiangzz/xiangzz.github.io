/**
 * 对应章节：第05章 - 持久化
 * 知识点：InMemoryStore 跨线程存储
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你用 thread_id 隔离了每个对话，但发现：         │
 * │  用户在对话A里说"我喜欢深色主题"，                    │
 * │  到了对话B里 AI 就忘了这个偏好了。                    │
 * │  你需要一种跨对话共享的"长期记忆"。                   │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：MemorySaver 按线程隔离 → InMemoryStore 按 namespace 跨线程共享
 *       store.put() 存、store.search() 搜、runtime.store 在节点内访问
 */

import { StateGraph, StateSchema, MessagesValue, START, END, MemorySaver, InMemoryStore } from "@langchain/langgraph";
import { z } from "zod";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const store = new InMemoryStore();
const checkpointer = new MemorySaver();

const State = new StateSchema({ messages: MessagesValue });

async function chatNode(state: typeof State.State, runtime: any) {
  const userId = runtime.context?.userId || "anon";
  const lastMsg = state.messages[state.messages.length - 1];
  const content = typeof lastMsg.content === "string" ? lastMsg.content : "";

  // 保存用户信息到 Store
  if (content.includes("记住")) {
    const fact = content.replace(/.*记住[：:]?/, "").trim();
    await runtime.store?.put(["users", userId, "facts"], `f-${Date.now()}`, { fact });
    console.log(`  [Store] 已记住: ${fact}`);
    return { messages: [new AIMessage(`好的，我记住了：${fact}`)] };
  }

  // 从 Store 检索记忆
  const memories = await runtime.store?.search(["users", userId, "facts"], { query: content });
  const context = memories?.map((m: any) => m.value.fact).join("；") || "";

  if (context) {
    return { messages: [new AIMessage(`我记得你说过：${context}`)] };
  }
  return { messages: [new AIMessage("我还没有你的记录，告诉我吧！")] };
}

const graph = new StateGraph(State)
  .addNode("chat", chatNode)
  .addEdge(START, "chat").addEdge("chat", END)
  .compile({ checkpointer, store }); // 同时传入

async function main() {
  // 对话A（线程1）：告诉 AI 一个偏好
  console.log("── 对话A（线程1）──");
  const cfgA = { configurable: { thread_id: "t1" }, context: { userId: "u1" } };
  let r = await graph.invoke({ messages: [new HumanMessage("记住：我喜欢 TypeScript")] }, cfgA);
  console.log(`AI: ${r.messages.at(-1).content}\n`);

  // 对话B（线程2，不同线程！）：问 AI 我的偏好
  console.log("── 对话B（线程2，跨线程共享）──");
  const cfgB = { configurable: { thread_id: "t2" }, context: { userId: "u1" } };
  r = await graph.invoke({ messages: [new HumanMessage("我喜欢什么语言？")] }, cfgB);
  console.log(`AI: ${r.messages.at(-1).content}`);
}

main().catch(console.error);
