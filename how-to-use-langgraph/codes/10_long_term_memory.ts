/**
 * 对应章节：第10章 - 记忆管理
 * 知识点：长期记忆、InMemoryStore、namespace、跨线程共享
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：用户在对话A中说"我是前端工程师"，在对话B中     │
 * │  问"我是做什么的"，AI 答不上来——因为 thread_id 不同，│
 * │  短期记忆互不相通。怎么让记忆跨对话持久保存？         │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：InMemoryStore 用 namespace 按用户存储长期记忆，
 *       跨 thread_id 共享。compile 时同时传入 checkpointer 和 store。
 */

import {
  StateGraph, StateSchema, MessagesValue, START, END,
  MemorySaver, InMemoryStore,
} from "@langchain/langgraph";
import { z } from "zod";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const store = new InMemoryStore();
const checkpointer = new MemorySaver();

const State = new StateSchema({ messages: MessagesValue });

async function chatWithMemory(state: typeof State.State, runtime: any) {
  const userId = runtime.context?.userId || "user-001";
  const lastMsg = state.messages[state.messages.length - 1];
  const content = typeof lastMsg.content === "string" ? lastMsg.content : "";

  // 从 Store 检索该用户的长期记忆
  const memories = await runtime.store?.search(["users", userId, "facts"], {
    query: content,
  });

  const memoryContext = memories && memories.length > 0
    ? memories.map((m: any) => m.value.fact).join("；")
    : "";

  console.log(`  [检索记忆] 找到 ${memories?.length || 0} 条长期记忆`);
  if (memoryContext) console.log(`  [记忆内容] ${memoryContext}`);

  let reply = "";
  if (content.includes("记住")) {
    const fact = content.replace(/.*记住[：:]/, "").replace(/记住/, "").trim();
    if (fact) {
      await runtime.store?.put(
        ["users", userId, "facts"],
        `fact-${Date.now()}`,
        { fact, timestamp: Date.now() }
      );
      reply = `好的，我记住了：${fact}`;
    }
  } else if (content.includes("我是什么") || content.includes("我的")) {
    reply = memoryContext
      ? `根据我的记忆：${memoryContext}`
      : "我还没有关于你的记录，请告诉我吧。";
  } else {
    reply = memoryContext
      ? `（基于记忆：${memoryContext}）收到：${content}`
      : `收到：${content}`;
  }

  return { messages: [new AIMessage(reply)] };
}

const graph = new StateGraph(State)
  .addNode("chat", chatWithMemory)
  .addEdge(START, "chat")
  .addEdge("chat", END)
  .compile({ checkpointer, store }); // 同时传入 checkpointer 和 store

async function main() {
  console.log("── 长期记忆：跨对话共享 ──\n");

  // 对话1（线程A，user-001）
  console.log("--- 对话1（线程A，user-001）---");
  const configA = {
    configurable: { thread_id: "thread-a" },
    context: { userId: "user-001" },
  };

  let result = await graph.invoke(
    { messages: [new HumanMessage("记住：我是一名前端开发工程师")] },
    configA
  );
  console.log(`AI: ${result.messages.at(-1).content}\n`);

  result = await graph.invoke(
    { messages: [new HumanMessage("记住：我喜欢喝咖啡")] },
    configA
  );
  console.log(`AI: ${result.messages.at(-1).content}\n`);

  // 对话2（线程B，同一个 user-001）→ Store 跨线程共享！
  console.log("--- 对话2（线程B，同一个 user-001）---");
  const configB = {
    configurable: { thread_id: "thread-b" },
    context: { userId: "user-001" },
  };

  result = await graph.invoke(
    { messages: [new HumanMessage("我是做什么工作的？")] },
    configB
  );
  console.log(`AI: ${result.messages.at(-1).content}\n`);

  // 对话3（线程C，不同 user-002）→ 没有记忆
  console.log("--- 对话3（线程C，不同 user-002）---");
  const configC = {
    configurable: { thread_id: "thread-c" },
    context: { userId: "user-002" },
  };

  result = await graph.invoke(
    { messages: [new HumanMessage("我是做什么工作的？")] },
    configC
  );
  console.log(`AI: ${result.messages.at(-1).content}`);
  console.log("（不同用户没有记忆）");

  console.log("\n── 短期 vs 长期记忆 ──");
  console.log("  短期：MemorySaver + thread_id → 同一对话内");
  console.log("  长期：InMemoryStore + namespace → 跨对话、跨线程");
}

main().catch(console.error);
