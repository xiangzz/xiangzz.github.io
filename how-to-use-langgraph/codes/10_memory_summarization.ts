/**
 * 对应章节：第10章 - 记忆管理
 * 知识点：消息摘要压缩、自动摘要、减少 token 消耗
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：对话有 50 条消息，trimMessages 太粗暴——直接    │
 * │  丢弃旧消息可能丢失关键信息（比如用户在第 3 轮说的    │
 * │  需求）。能不能把旧消息"浓缩"成一段摘要，既节省 token │
 * │  又保留关键信息？                                     │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：当消息超过阈值时，用 LLM 把旧消息压缩成摘要（SystemMessage），
 *       然后用 RemoveMessage 删除已被摘要替代的旧消息。
 *       最近的消息保留原文，确保当前对话质量。
 */

import {
  StateGraph, StateSchema, MessagesValue, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";
import { HumanMessage, AIMessage, SystemMessage, RemoveMessage } from "@langchain/core/messages";

const State = new StateSchema({ messages: MessagesValue });

// 模拟摘要函数（真实场景用 LLM 生成摘要）
function summarizeMessages(messages: any[]): string {
  const topics = new Set<string>();
  messages.forEach((m) => {
    const content = typeof m.content === "string" ? m.content : "";
    if (content.includes("名字") || content.includes("叫")) topics.add("用户姓名");
    if (content.includes("项目")) topics.add("项目讨论");
    if (content.includes("天气")) topics.add("天气查询");
    if (content.includes("代码")) topics.add("编程话题");
  });
  return `之前的对话摘要：用户讨论了${[...topics].join("、")}等话题。`;
}

async function chatWithSummarization(state: typeof State.State) {
  const lastMsg = state.messages[state.messages.length - 1];
  let messages = [...state.messages];

  // 消息超过 6 条时触发摘要压缩
  if (messages.length > 6) {
    console.log(`  [摘要] 消息数 ${messages.length} > 6，开始压缩...`);

    // 生成摘要（保留最近 2 条不压缩）
    const summary = summarizeMessages(messages.slice(0, -2));

    // 删除被摘要替代的旧消息
    const toRemove = messages.slice(0, -2);
    const removeOps = toRemove.map((m: any) => new RemoveMessage({ id: m.id }));

    // 添加摘要作为系统消息
    const summaryMsg = new SystemMessage(`[对话摘要] ${summary}`);

    return { messages: [...removeOps, summaryMsg] };
  }

  return {
    messages: [new AIMessage(`回复: ${(lastMsg.content as string).substring(0, 20)}...`)],
  };
}

const graph = new StateGraph(State)
  .addNode("chat", chatWithSummarization)
  .addEdge(START, "chat")
  .addEdge("chat", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 消息摘要压缩 ──\n");

  const config = { configurable: { thread_id: "summarization-demo" } };

  // 建立多轮对话，观察消息压缩
  const inputs = [
    "你好，我叫小明",
    "今天天气怎么样？",
    "我的项目进展如何？",
    "帮我看看这段代码",
    "明天有什么安排？",
  ];

  for (const input of inputs) {
    const result = await graph.invoke(
      { messages: [new HumanMessage(input)] },
      config
    );
    console.log(`用户: ${input}`);
    console.log(`AI: ${result.messages.at(-1).content}`);
    console.log(`  消息数: ${result.messages.length}\n`);
  }

  console.log("── 真实场景的摘要生成 ──");
  console.log(`
  const summary = await model.invoke([
    new SystemMessage("请将以下对话总结为简洁的摘要，保留关键信息"),
    ...oldMessages,
  ]);
  `);

  console.log("\n── 三种记忆管理策略 ──");
  console.log("  trimMessages  → 裁剪旧消息，简单但可能丢信息");
  console.log("  RemoveMessage → 精确删除特定消息，适合隐私擦除");
  console.log("  摘要压缩      → 压缩为摘要，节省 token 同时保留关键信息");
}

main().catch(console.error);
