/**
 * 对应章节：第01章 - LangGraph 概览
 * 知识点：重试策略、条件边循环、最大重试保护
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你需要调用一个不稳定的外部 API，               │
 * │  它有时超时、有时限流。你不想一失败就放弃，            │
 * │  但也不能无限重试。怎么设计一个"最多重试 N 次"        │
 * │  的机制？                                             │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：用条件边 + attempts 计数器实现循环重试
 *       有结果 → 结束；没结果且次数没到 → 再来一次
 */

import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  query: z.string(),
  result: z.string(),
  attempts: z.number(),
});

let callCount = 0;

/** 模拟一个不靠谱的 API：前 2 次失败，第 3 次成功 */
function flakyApi(query: string, attempt: number): string {
  callCount++;
  if (callCount <= 2) throw new Error(`API 超时（第 ${callCount} 次）`);
  return `查询 "${query}" 的结果：共 42 条`;
}

async function tryFetch(state: typeof State.State) {
  console.log(`[tryFetch] 第 ${state.attempts + 1} 次尝试...`);
  try {
    const result = flakyApi(state.query, state.attempts);
    console.log("  成功！");
    return { result, attempts: state.attempts + 1 };
  } catch (e: any) {
    console.log(`  失败: ${e.message}`);
    return { attempts: state.attempts + 1 };
  }
}

async function giveUp(state: typeof State.State) {
  return { result: `放弃：重试 ${state.attempts} 次后仍失败` };
}

/** 条件边：拿到数据就结束，否则继续 */
function decideNext(state: typeof State.State): string {
  if (state.result && !state.result.startsWith("放弃")) return END;
  if (state.attempts >= 5) return "giveUp";
  return "tryFetch";
}

const graph = new StateGraph(State)
  .addNode("tryFetch", tryFetch)
  .addNode("giveUp", giveUp)
  .addEdge(START, "tryFetch")
  .addConditionalEdges("tryFetch", decideNext, {
    tryFetch: "tryFetch",
    giveUp: "giveUp",
  })
  .addEdge("giveUp", END)
  .compile();

async function main() {
  console.log("── 场景1：API 第 3 次才成功 ──");
  callCount = 0;
  const r1 = await graph.invoke({ query: "LangGraph", result: "", attempts: 0 });
  console.log(`结果: ${r1.result}`);
  console.log(`尝试: ${r1.attempts} 次\n`);

  console.log("── 场景2：API 持续失败，超过 5 次放弃 ──");
  callCount = -100; // 让它永远失败
  const r2 = await graph.invoke({ query: "不可能的查询", result: "", attempts: 0 });
  console.log(`结果: ${r2.result}`);
}

main().catch(console.error);
