/**
 * 对应章节：第05章 - 持久化
 * 知识点：Checkpointer 后端切换
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你开发时用 MemorySaver（内存），一切正常。       │
 * │  但部署到生产环境后，服务一重启，所有对话记忆就丢了。  │
 * │  你需要换一个持久化的后端，但不想改业务代码。          │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：所有 Checkpointer 后端共享同一接口
 *       只需改 compile() 里传入的 checkpointer，业务代码完全不动
 */

import { StateGraph, StateSchema, MessagesValue, START, END, MemorySaver } from "@langchain/langgraph";

const builder = new StateGraph({ messages: MessagesValue } as any)
  .addNode("chat", async (s: any) => ({ messages: [{ role: "assistant", content: "OK" }] }))
  .addEdge(START, "chat").addEdge("chat", END);

console.log("── 后端切换只需改一行 ──\n");

// 开发环境：MemorySaver（内存，重启丢失）
const devGraph = builder.compile({ checkpointer: new MemorySaver() });
console.log("开发: compile({ checkpointer: new MemorySaver() })");

// 生产环境：PostgresSaver（持久化到 PostgreSQL）
console.log("生产: compile({ checkpointer: PostgresSaver.fromConnString(url) })");
console.log("  → 需先 npm install @langchain/langgraph-checkpoint-postgres");
console.log("  → 需先 await checkpointer.setup() 初始化表");

// 单机部署：SqliteSaver
console.log("单机: compile({ checkpointer: SqliteSaver.fromConnString('./db.sqlite') })");

console.log("\n业务代码完全不用改，只换 compile 的参数。");
console.log("Store 后端同理：InMemoryStore → PostgresStore");
