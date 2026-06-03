/**
 * 对应章节：第11章 - 子图
 * 知识点：三种子图持久化模式
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：子图需要 checkpointer 吗？如果你的子图是纯    │
 * │  计算（输入→输出），加了 checkpointer 反而浪费性能。  │
 * │  如果子图需要记忆跨调用状态，不加又不行。三种模式     │
 * │  该选哪个？                                          │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：三种模式按需选择：
 *   per-call（默认）→ 纯函数，不保存状态
 *   per-thread      → 需要记忆，子图独立 checkpointer
 *   stateless       → 显式声明无状态，代码意图更清晰
 */

import {
  StateGraph, StateSchema, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";

const ChildState = new StateSchema({
  value: z.string(),
  callCount: z.number(),
});

let childCallCounter = 0;

async function childNode(state: typeof ChildState.State) {
  childCallCounter++;
  console.log(`  [子图] 第 ${childCallCounter} 次调用，callCount=${state.callCount}`);
  return {
    value: `处理后: ${state.value}`,
    callCount: state.callCount + 1,
  };
}

// 模式1：Per-call（默认）— 不传 checkpointer
function mode1PerCall() {
  console.log("=== 模式1：Per-call（默认）===\n");

  const childGraph = new StateGraph(ChildState)
    .addNode("process", childNode)
    .addEdge(START, "process")
    .addEdge("process", END)
    .compile(); // 无 checkpointer

  console.log("行为：每次调用子图都从初始状态开始");
  console.log("适用：子图是纯函数（输入→输出，不需要记忆）");
  console.log("检查点：父图记录子图最终输出\n");
}

// 模式2：Per-thread — 子图有自己的 checkpointer
function mode2PerThread() {
  console.log("=== 模式2：Per-thread ===\n");

  const childGraph = new StateGraph(ChildState)
    .addNode("process", childNode)
    .addEdge(START, "process")
    .addEdge("process", END)
    .compile({ checkpointer: new MemorySaver() }); // 子图自己的 checkpointer

  console.log("行为：子图在相同 thread_id 下状态累积");
  console.log("适用：子图需要跨调用记忆（如多轮对话子模块）");
  console.log("检查点：子图和父图各自独立管理\n");
}

// 模式3：Stateless — 显式禁用
function mode3Stateless() {
  console.log("=== 模式3：Stateless ===\n");
  console.log("行为：与 per-call 类似，但显式声明为无状态");
  console.log("适用：明确表示子图是纯计算的");
  console.log("配置：checkpointer: false\n");
}

function comparisonTable() {
  console.log("=== 功能对比 ===\n");
  console.log("┌──────────────┬──────────┬────────────┬───────────┐");
  console.log("│ 功能         │ Per-call │ Per-thread │ Stateless │");
  console.log("├──────────────┼──────────┼────────────┼───────────┤");
  console.log("│ HITL 中断    │ ❌       │ ✅         │ ❌        │");
  console.log("│ 多轮记忆     │ ❌       │ ✅         │ ❌        │");
  console.log("│ 多次调用累积 │ ❌       │ ✅         │ ❌        │");
  console.log("│ 状态检查     │ 父图级别 │ 子图级别   │ 无        │");
  console.log("│ 性能         │ 快       │ 较慢       │ 最快      │");
  console.log("└──────────────┴──────────┴────────────┴───────────┘");
}

async function main() {
  mode1PerCall();
  mode2PerThread();
  mode3Stateless();
  comparisonTable();

  console.log("选择建议：");
  console.log("  不确定时 → 用默认（per-call）");
  console.log("  子图需要记忆 → per-thread");
  console.log("  子图是纯计算 → stateless");
}

main().catch(console.error);
