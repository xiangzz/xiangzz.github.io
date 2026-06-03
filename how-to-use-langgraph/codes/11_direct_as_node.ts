/**
 * 对应章节：第11章 - 子图
 * 知识点：直接作为节点、共享 State keys、自动映射
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：主图和子图都用 messages 字段。每次都写 wrapper │
 * │  节点手动映射太繁琐了。既然字段名一样，能不能让       │
 * │  LangGraph 自动处理 State 的传入传出？                │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：addNode("name", compiledSubgraph) 直接把子图当节点用。
 *       共享的 State keys 自动映射，不需要 wrapper。
 */

import {
  StateGraph, StateSchema, MessagesValue, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// 共享 State：父图和子图都有 messages 字段
const SharedState = new StateSchema({ messages: MessagesValue });

async function childChat(state: typeof SharedState.State) {
  console.log("  [子图 childChat] 处理消息...");
  const lastMsg = state.messages[state.messages.length - 1];
  return {
    messages: [new AIMessage(`子图回复: ${(lastMsg.content as string).substring(0, 20)}...`)],
  };
}

// 子图
const childGraph = new StateGraph(SharedState)
  .addNode("childChat", childChat)
  .addEdge(START, "childChat")
  .addEdge("childChat", END)
  .compile();

async function parentChat(state: typeof SharedState.State) {
  console.log("[父图 parentChat] 处理消息...");
  return { messages: [new AIMessage("父图处理完毕")] };
}

// 关键：addNode 的第二个参数直接传编译后的子图
const parentGraph = new StateGraph(SharedState)
  .addNode("parentChat", parentChat)
  .addNode("childStep", childGraph)  // 直接传入编译后的子图！
  .addEdge(START, "childStep")
  .addEdge("childStep", "parentChat")
  .addEdge("parentChat", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 直接作为节点添加子图（共享 State）──\n");

  const result = await parentGraph.invoke(
    { messages: [new HumanMessage("你好")] },
    { configurable: { thread_id: "direct-subgraph" } }
  );

  console.log("\n=== 消息历史 ===");
  result.messages.forEach((msg: any, i: number) => {
    const type = msg instanceof HumanMessage ? "用户" : "AI";
    console.log(`[${i}] ${type}: ${msg.content}`);
  });

  console.log("\n── 两种方式对比 ──");
  console.log("  方式1 - 在节点内调用（不同 State）：");
  console.log("    需要手动映射 State，适合子图有独立结构");
  console.log("  方式2 - 直接作为节点（共享 State keys）：");
  console.log("    addNode('name', compiledSubgraph)");
  console.log("    自动映射共享的 State keys，省代码");
}

main().catch(console.error);
