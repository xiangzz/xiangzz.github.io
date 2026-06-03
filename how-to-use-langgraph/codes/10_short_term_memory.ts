/**
 * 对应章节：第10章 - 记忆管理
 * 知识点：短期记忆、MemorySaver + thread_id、消息累积
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你跟 AI 说"我叫小明"，下一轮它就忘了。        │
 * │  每次都像新认识的人一样，用户体验极差。               │
 * │  怎么让 AI 在同一个对话中记住之前说过的话？           │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：MemorySaver + thread_id 实现短期记忆。
 *       同一个 thread_id 下，messages 自动累积。
 *       换一个 thread_id，就是全新对话（隔离的）。
 */

import {
  StateGraph, StateSchema, MessagesValue, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const State = new StateSchema({
  messages: MessagesValue,
  userName: z.string(),
});

async function chatNode(state: typeof State.State) {
  const lastMsg = state.messages[state.messages.length - 1];
  const content = lastMsg.content as string;

  // 模拟 LLM 利用上下文记忆回复
  let reply = "";
  if (content.includes("我叫")) {
    const name = content.replace(/.*我叫/, "").replace(/[。，！？].*/, "").trim();
    reply = `你好 ${name}！很高兴认识你。`;
  } else if (content.includes("我叫什么") || content.includes("我的名字")) {
    const nameMsg = state.messages.find((m: any) =>
      m instanceof HumanMessage && (m.content as string).includes("我叫")
    );
    if (nameMsg) {
      const name = (nameMsg.content as string).replace(/.*我叫/, "").replace(/[。，！？].*/, "").trim();
      reply = `你叫 ${name} 呀！我记得你。`;
    } else {
      reply = "我暂时不知道你的名字，请告诉我吧。";
    }
  } else if (content.includes("我们聊了什么")) {
    const history = state.messages
      .map((m: any) => `${m instanceof HumanMessage ? "你" : "我"}: ${m.content}`)
      .join("\n");
    reply = `我们的对话历史：\n${history}`;
  } else {
    reply = `收到！你说的是："${content}"`;
  }

  return { messages: [new AIMessage(reply)] };
}

const graph = new StateGraph(State)
  .addNode("chat", chatNode)
  .addEdge(START, "chat")
  .addEdge("chat", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 短期记忆：同一对话内的消息累积 ──\n");

  const config = { configurable: { thread_id: "memory-session-1" } };

  // 第1轮：告诉 AI 名字
  console.log("--- 第1轮 ---");
  let result = await graph.invoke(
    { messages: [new HumanMessage("你好，我叫小明")], userName: "" },
    config
  );
  console.log(`AI: ${result.messages.at(-1).content}`);
  console.log(`  消息总数: ${result.messages.length}\n`);

  // 第2轮：AI 记住了名字
  console.log("--- 第2轮 ---");
  result = await graph.invoke(
    { messages: [new HumanMessage("你知道我叫什么吗？")], userName: "" },
    config
  );
  console.log(`AI: ${result.messages.at(-1).content}`);
  console.log(`  消息总数: ${result.messages.length}\n`);

  // 第3轮：能回顾所有对话
  console.log("--- 第3轮 ---");
  result = await graph.invoke(
    { messages: [new HumanMessage("我们之前聊了什么？")], userName: "" },
    config
  );
  console.log(`AI: ${result.messages.at(-1).content}`);
  console.log(`  消息总数: ${result.messages.length}`);

  // 不同 thread_id 完全隔离
  console.log("\n--- 不同线程（隔离的）---");
  const config2 = { configurable: { thread_id: "memory-session-2" } };
  const isolated = await graph.invoke(
    { messages: [new HumanMessage("你知道我是谁吗？")], userName: "" },
    config2
  );
  console.log(`AI: ${isolated.messages.at(-1).content}`);
  console.log("（新线程没有任何记忆）");

  console.log("\n── 短期记忆要点 ──");
  console.log("  同一 thread_id → messages 自动累积 → AI 有上下文");
  console.log("  不同 thread_id → 完全隔离 → 互不影响");
  console.log("  MemorySaver 存在内存中，进程重启后丢失");
}

main().catch(console.error);
