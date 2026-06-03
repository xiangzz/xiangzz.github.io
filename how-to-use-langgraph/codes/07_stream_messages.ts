/**
 * 对应章节：第07章 - 流式输出
 * 知识点：messages 模式 token 级别流式输出
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你希望 AI 的回复像 ChatGPT 一样逐字打出，      │
 * │  而不是等全部生成完才一次性显示。                     │
 * │  怎么获取 LLM 的 token 级别流？                       │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：streamMode: "messages" 返回 [messageChunk, metadata] 元组
 *       真实场景需要 LLM 支持 streaming
 */

import { StateGraph, StateSchema, MessagesValue, START, END } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const State = new StateSchema({ messages: MessagesValue });

async function chat(state: typeof State.State) {
  // 模拟逐字输出（真实场景 LLM 会自动 streaming）
  let full = "";
  for (const char of "LangGraph 是构建有状态 AI 应用的框架") {
    full += char;
    process.stdout.write(char); // 逐字打印
  }
  console.log();
  return { messages: [new AIMessage(full)] };
}

const graph = new StateGraph(State)
  .addNode("chat", chat)
  .addEdge(START, "chat").addEdge("chat", END)
  .compile();

async function main() {
  console.log("── 真实场景的 messages 流式输出 ──\n");
  console.log("逐字输出效果:\n");
  await graph.invoke({ messages: [new HumanMessage("什么是 LangGraph？")] });

  console.log("\n── 真实代码 ──");
  console.log(`
  for await (const chunk of await graph.stream(input, { streamMode: "messages" })) {
    const [messageChunk, metadata] = chunk;
    if (messageChunk.content) {
      process.stdout.write(messageChunk.content); // 逐字打印
    }
  }
  `);
}

main().catch(console.error);
