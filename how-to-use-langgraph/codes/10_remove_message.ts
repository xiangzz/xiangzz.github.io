/**
 * 对应章节：第10章 - 记忆管理
 * 知识点：RemoveMessage 删除特定消息、通过 updateState 删除
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：用户说"把我刚才发的消息删掉，里面有我的密码"。  │
 * │  对话历史中的敏感信息必须彻底移除。怎么精确删除       │
 * │  某条消息，而不是清空整个对话？                       │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：RemoveMessage({ id: messageId }) 配合 updateState 精确删除。
 *       也可以批量删除（如删除所有 AI 回复）。
 */

import {
  StateGraph, StateSchema, MessagesValue, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";
import { HumanMessage, AIMessage, RemoveMessage } from "@langchain/core/messages";

const State = new StateSchema({ messages: MessagesValue });

async function chatNode(state: typeof State.State) {
  const lastMsg = state.messages[state.messages.length - 1];
  return {
    messages: [new AIMessage(`回复: ${(lastMsg.content as string).substring(0, 20)}...`)],
  };
}

const checkpointer = new MemorySaver();
const graph = new StateGraph(State)
  .addNode("chat", chatNode)
  .addEdge(START, "chat")
  .addEdge("chat", END)
  .compile({ checkpointer });

async function main() {
  console.log("── RemoveMessage：精确删除消息 ──\n");

  const config = { configurable: { thread_id: "remove-msg-demo" } };

  // 建立 3 轮对话
  for (let i = 1; i <= 3; i++) {
    await graph.invoke({ messages: [new HumanMessage(`第${i}条用户消息`)] }, config);
  }

  // 查看当前消息
  let snapshot = await graph.getState(config);
  console.log("--- 删除前 ---");
  console.log(`消息数: ${snapshot.values.messages.length}`);
  snapshot.values.messages.forEach((msg: any, i: number) => {
    const role = msg instanceof HumanMessage ? "用户" : "AI";
    console.log(`  [${i}] ${role}: ${(msg.content as string).substring(0, 30)}`);
  });

  // 删除第 2 条消息（通过 id 精确定位）
  console.log("\n--- 删除第 2 条消息 ---");
  const targetId = snapshot.values.messages[1].id;
  if (targetId) {
    await graph.updateState(config, {
      messages: [new RemoveMessage({ id: targetId })],
    });
  }

  snapshot = await graph.getState(config);
  console.log(`删除后消息数: ${snapshot.values.messages.length}`);
  snapshot.values.messages.forEach((msg: any, i: number) => {
    const role = msg instanceof HumanMessage ? "用户" : "AI";
    console.log(`  [${i}] ${role}: ${(msg.content as string).substring(0, 30)}`);
  });

  // 批量删除所有 AI 回复
  console.log("\n--- 批量删除所有 AI 回复 ---");
  snapshot = await graph.getState(config);
  const aiMessages = snapshot.values.messages.filter((m: any) => m instanceof AIMessage);

  await graph.updateState(config, {
    messages: aiMessages.map((m: any) => new RemoveMessage({ id: m.id })),
  });

  snapshot = await graph.getState(config);
  console.log(`批量删除后消息数: ${snapshot.values.messages.length}`);
  snapshot.values.messages.forEach((msg: any, i: number) => {
    const role = msg instanceof HumanMessage ? "用户" : "AI";
    console.log(`  [${i}] ${role}: ${(msg.content as string).substring(0, 30)}`);
  });

  console.log("\n── RemoveMessage 要点 ──");
  console.log("  通过消息 id 精确定位删除");
  console.log("  配合 updateState 使用，不需要改图结构");
  console.log("  可以单条删除，也可以批量删除");
}

main().catch(console.error);
