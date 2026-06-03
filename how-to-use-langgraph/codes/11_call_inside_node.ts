/**
 * 对应章节：第11章 - 子图
 * 知识点：在节点内调用子图、不同 State、手动映射
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你有一个"文本处理"子图（输入 text，输出       │
 * │  processedText + wordCount）。主图的 State 是 input + │
 * │  output + stats。两边的字段名完全不同，怎么让它们     │
 * │  互相通信？                                          │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：在主图的 wrapper 节点中手动做 State 映射：
 *       父图 State → 子图 State → 调用子图 → 子图结果 → 父图 State
 */

import {
  StateGraph, StateSchema, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";

// 子图 State（与主图不同）
const ChildState = new StateSchema({
  text: z.string(),
  processedText: z.string(),
  wordCount: z.number(),
});

async function childProcess(state: typeof ChildState.State) {
  console.log("  [子图] 处理文本...");
  return {
    processedText: state.text.toUpperCase(),
    wordCount: state.text.split(/\s+/).length,
  };
}

const childGraph = new StateGraph(ChildState)
  .addNode("process", childProcess)
  .addEdge(START, "process")
  .addEdge("process", END)
  .compile();

// 主图 State
const ParentState = new StateSchema({
  input: z.string(),
  output: z.string(),
  stats: z.string(),
});

// Wrapper 节点：手动映射 State
async function callChildNode(state: typeof ParentState.State) {
  console.log("[父图] 调用子图，手动映射 State...");

  // 1. 父图 State → 子图 State
  const childInput = {
    text: state.input,        // 父图 input → 子图 text
    processedText: "",
    wordCount: 0,
  };

  // 2. 调用子图
  const childResult = await childGraph.invoke(childInput);
  console.log(`  [子图结果] processedText="${childResult.processedText}", wordCount=${childResult.wordCount}`);

  // 3. 子图结果 → 父图 State
  return {
    output: childResult.processedText,  // 子图 processedText → 父图 output
    stats: `词数: ${childResult.wordCount}`,
  };
}

const parentGraph = new StateGraph(ParentState)
  .addNode("callChild", callChildNode)
  .addEdge(START, "callChild")
  .addEdge("callChild", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 在节点内调用子图（不同 State）──\n");

  const result = await parentGraph.invoke({
    input: "hello world from langgraph",
    output: "",
    stats: "",
  });

  console.log("\n=== 父图最终结果 ===");
  console.log(`输入: ${result.input}`);
  console.log(`输出: ${result.output}`);
  console.log(`统计: ${result.stats}`);

  console.log("\n── State 映射三步走 ──");
  console.log("  1. 父图 State → 子图 State（调用前映射）");
  console.log("  2. 调用子图");
  console.log("  3. 子图结果 → 父图 State（返回时映射）");
  console.log("  适合：子图有独立的 State 结构，需要灵活控制");
}

main().catch(console.error);
