/**
 * 对应章节：第06章 - 持久执行
 * 知识点：task() 包裹副作用
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的 Agent 在执行过程中会调用外部 API、         │
 * │  写数据库。如果中途崩溃重启，所有操作会重新执行一遍：  │
 * │  - API 被重复调用                                    │
 * │  - 数据库被重复写入                                  │
 * │  怎么让重启后跳过已经执行过的副作用？                  │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：用 task("唯一名称", fn) 包裹副作用
 *       重放时 LangGraph 会跳过 task() 内的操作，直接使用缓存结果
 */

import { StateGraph, StateSchema, START, END, MemorySaver } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({ data: z.string(), savedAt: z.string() });

let apiCallCount = 0;
let dbWriteCount = 0;

/** 模拟外部 API */
async function callExternalApi(): Promise<string> {
  apiCallCount++;
  console.log(`  [API 调用 #${apiCallCount}] GET /data`);
  return "来自 API 的数据";
}

/** 模拟数据库写入 */
async function writeToDb(data: string): Promise<void> {
  dbWriteCount++;
  console.log(`  [DB 写入 #${dbWriteCount}] 保存: ${data}`);
}

// ── 正确做法：用 task() 标记副作用 ──
async function processNode(state: typeof State.State) {
  console.log("[processNode] 处理中...");

  // 在实际 LangGraph.js 中用 task() 包裹：
  // const data = await task("fetch-api", () => callExternalApi());
  // await task("save-db", () => writeToDb(data));
  //
  // 重放时：这两个 task 会被跳过，使用缓存结果

  const data = await callExternalApi();
  await writeToDb(data);

  return { data, savedAt: new Date().toISOString() };
}

const graph = new StateGraph(State)
  .addNode("process", processNode)
  .addEdge(START, "process").addEdge("process", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 首次执行 ──");
  await graph.invoke({ data: "", savedAt: "" }, { configurable: { thread_id: "task-demo" } });
  console.log(`  API 调用 ${apiCallCount} 次, DB 写入 ${dbWriteCount} 次`);

  console.log("\n── 如果崩溃重启，不用 task() 会怎样？ ──");
  console.log("  ❌ API 被重复调用，邮件被重复发送");
  console.log("  ✅ 用 task() 包裹后，重放时直接跳过，用缓存结果");

  console.log("\n── task() 使用规则 ──");
  console.log("  1. 名称在同一节点内必须唯一");
  console.log("  2. 纯计算不需要 task()（不产生副作用）");
  console.log("  3. task() 不能嵌套");
}

main().catch(console.error);
