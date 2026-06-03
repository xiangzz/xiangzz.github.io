/**
 * 对应章节：第11章 - 子图
 * 知识点：多层嵌套子图、State 传递
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的系统有三层结构：主图调度 → 分析子图 →     │
 * │  文本处理子图。每层的 State 都不一样，需要逐层映射。  │
 * │  多层嵌套子图怎么组织？有什么注意事项？               │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：每层子图有独立 State，wrapper 节点负责层间映射。
 *       调用链：主图 → 中间子图 → 内层子图，逐层 invoke。
 *       嵌套层数建议不超过 3 层。
 */

import {
  StateGraph, StateSchema, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";

// 最内层子图（Level 2）：文本处理
const InnerState = new StateSchema({
  text: z.string(),
  processedText: z.string(),
});

async function innerProcess(state: typeof InnerState.State) {
  console.log("    [内层子图] 处理文本");
  return { processedText: `[已处理] ${state.text}` };
}

const innerGraph = new StateGraph(InnerState)
  .addNode("process", innerProcess)
  .addEdge(START, "process")
  .addEdge("process", END)
  .compile();

// 中间层子图（Level 1）：数据分析
const MiddleState = new StateSchema({
  data: z.string(),
  result: z.string(),
});

async function middleWrapper(state: typeof MiddleState.State) {
  console.log("  [中间子图] 调用内层子图");
  const innerResult = await innerGraph.invoke({ text: state.data, processedText: "" });
  return { result: innerResult.processedText };
}

const middleGraph = new StateGraph(MiddleState)
  .addNode("callInner", middleWrapper)
  .addEdge(START, "callInner")
  .addEdge("callInner", END)
  .compile();

// 主图（Level 0）：调度
const RootState = new StateSchema({
  input: z.string(),
  output: z.string(),
});

async function rootCallMiddle(state: typeof RootState.State) {
  console.log("[主图] 调用中间层子图");
  const middleResult = await middleGraph.invoke({ data: state.input, result: "" });
  return { output: middleResult.result };
}

async function rootFinalize(state: typeof RootState.State) {
  console.log("[主图] 最终处理");
  return { output: `${state.output} (最终版)` };
}

const rootGraph = new StateGraph(RootState)
  .addNode("callMiddle", rootCallMiddle)
  .addNode("finalize", rootFinalize)
  .addEdge(START, "callMiddle")
  .addEdge("callMiddle", "finalize")
  .addEdge("finalize", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 多层嵌套子图 ──\n");
  console.log("结构：主图 → 中间子图 → 内层子图\n");
  console.log("调用链：\n");

  const result = await rootGraph.invoke(
    { input: "原始数据", output: "" },
    { configurable: { thread_id: "nested-subgraph" } }
  );

  console.log(`\n=== 最终结果 ===`);
  console.log(`输入: ${result.input}`);
  console.log(`输出: ${result.output}`);

  console.log("\n── 嵌套子图要点 ──");
  console.log("  1. 每层子图有独立的 State");
  console.log("  2. 层间通信需要 wrapper 节点手动映射 State");
  console.log("  3. 如果共享 State keys，可以用直接作为节点的方式减少映射");
  console.log("  4. 嵌套层数建议不超过 3 层");
  console.log("  5. 各层可以独立开启/关闭 checkpointer");
}

main().catch(console.error);
