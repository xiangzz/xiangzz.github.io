/**
 * 对应章节：第10章 - 记忆管理
 * 知识点：trimMessages 裁剪消息、控制上下文长度
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：对话越来越长，消息堆积到上百条。发给 LLM 的    │
 * │  token 数暴增，又慢又贵。但最新几轮的对话质量不能降。 │
 * │  怎么自动裁剪旧消息，只保留最近的上下文？             │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：trimMessages() 按 token 数或条数裁剪，保留最近的消息。
 *       策略 strategy: "last" 保留尾部，includeSystem 保留系统消息。
 */

import {
  StateGraph, StateSchema, MessagesValue, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const State = new StateSchema({
  messages: MessagesValue,
  trimmedCount: z.number(),
});

// 模拟 trimMessages：保留最近 N 条消息
// 真实场景使用 @langchain/core/messages 中的 trimMessages 函数
function trimMessagesSimple(messages: any[], maxCount: number): any[] {
  if (messages.length <= maxCount) return messages;
  return messages.slice(-maxCount);
}

async function chatNode(state: typeof State.State) {
  const lastMsg = state.messages[state.messages.length - 1];
  const content = typeof lastMsg.content === "string" ? lastMsg.content : "";

  // 裁剪消息：只保留最近 6 条（3 轮对话）
  const trimmed = trimMessagesSimple(state.messages, 6);
  const trimmedCount = state.messages.length - trimmed.length;

  if (trimmedCount > 0) {
    console.log(`  [trimMessages] 裁剪了 ${trimmedCount} 条旧消息，保留 ${trimmed.length} 条`);
  }

  const reply = `收到！当前上下文包含 ${trimmed.length} 条消息。`;
  return { messages: [new AIMessage(reply)], trimmedCount };
}

const graph = new StateGraph(State)
  .addNode("chat", chatNode)
  .addEdge(START, "chat")
  .addEdge("chat", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── trimMessages：裁剪消息控制上下文长度 ──\n");

  const config = { configurable: { thread_id: "trim-demo" } };

  // 进行多轮对话，展示消息累积和自动裁剪
  for (let i = 1; i <= 5; i++) {
    console.log(`--- 第${i}轮 ---`);
    const result = await graph.invoke(
      { messages: [new HumanMessage(`第${i}条消息`)], trimmedCount: 0 },
      config
    );
    console.log(`  AI: ${result.messages.at(-1).content}`);
    console.log(`  总消息数: ${result.messages.length}\n`);
  }

  console.log("── 真实 trimMessages 用法 ──");
  console.log(`
  import { trimMessages } from "@langchain/core/messages";

  const trimmed = await trimMessages(state.messages, {
    maxTokens: 4000,           // 最大 token 数
    strategy: "last",          // 保留最近的消息
    tokenCounter: (msg) => {   // token 计数函数
      return Math.ceil(msg.content.length / 4);
    },
    includeSystem: true,       // 始终保留系统消息
  });

  return { messages: trimmed };
  `);

  console.log("── 消息管理策略对比 ──");
  console.log("  trimMessages  → 按 token/条数裁剪，适合长期对话");
  console.log("  RemoveMessage → 删除特定消息，适合隐私擦除");
  console.log("  摘要压缩      → 压缩历史为摘要，保留关键信息");
}

main().catch(console.error);
