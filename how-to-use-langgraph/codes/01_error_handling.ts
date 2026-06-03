/**
 * 对应章节：第01章 - LangGraph 概览
 * 知识点：四种错误处理策略
 *
 * ┌───────────────────────────────────────────────────────┐
 * │  问题：你的 Agent 在运行中可能遇到各种错误：            │
 * │  - 网络偶尔超时         → 重试几次就好了               │
 * │  - LLM 返回格式不对     → 让它自己修正                 │
 * │  - 需要用户提供信息     → 暂停下来，问人               │
 * │  - 服务器直接崩了       → 没办法，向上报告             │
 * │  每种错误的处理方式不同，怎么区分和应对？               │
 * └───────────────────────────────────────────────────────┘
 *
 * 思路：按错误的性质分四类，每类一个处理策略
 */

import {
  StateGraph,
  StateSchema,
  START,
  END,
} from "@langchain/langgraph";
import { z } from "zod";

// ═══════════════════════════════════════════════════
// 策略 1：自动重试 —— 临时性错误（网络超时、限流）
// ═══════════════════════════════════════════════════

const RetryState = new StateSchema({
  data: z.string(),
  attempts: z.number(),
});

let mockCallCount = 0;

/** 模拟一个不稳定的 API：前两次失败，第三次成功 */
async function unstableApi(state: typeof RetryState.State) {
  mockCallCount++;
  if (mockCallCount <= 2) {
    throw new Error(`网络超时（第 ${mockCallCount} 次）`);
  }
  return { data: "获取成功！", attempts: state.attempts + 1 };
}

/** 条件边：拿到数据就结束，否则重试 */
function shouldRetry(state: typeof RetryState.State): string {
  if (state.data) return END;
  if (state.attempts >= 3) return END;
  return "unstableApi";
}

// ═══════════════════════════════════════════════════
// 策略 2：LLM 自修复 —— 输出格式不符合预期
// ═══════════════════════════════════════════════════

const HealState = new StateSchema({
  rawOutput: z.string(),
  parsed: z.string(),
});

let healAttempt = 0;

/** 模拟 LLM 第一次输出坏 JSON，第二次修正 */
async function generateJson(state: typeof HealState.State) {
  healAttempt++;
  if (healAttempt === 1) {
    return { rawOutput: '{ answer: 42 ' }; // 故意少个括号
  }
  return { rawOutput: '{ "answer": 42 }' }; // 修正后
}

async function validateJson(state: typeof HealState.State) {
  try {
    const obj = JSON.parse(state.rawOutput);
    return { parsed: `解析成功: ${JSON.stringify(obj)}` };
  } catch {
    return { parsed: "" }; // 解析失败 → 触发重新生成
  }
}

function routeByValidation(state: typeof HealState.State): string {
  return state.parsed ? END : "generateJson";
}

// ═══════════════════════════════════════════════════
// 策略 3 & 4 说明（完整实现见第08章）
// ═══════════════════════════════════════════════════
// 策略 3（人工干预）：用 interrupt() 暂停，等用户回复 → 详见 08_basic_interrupt.ts
// 策略 4（上抛异常）：节点内 throw，外层 try/catch → 简单但需要调用方处理

// ═══════════════════════════════════════════════════
// 运行演示
// ═══════════════════════════════════════════════════

async function demoRetry() {
  console.log("── 策略 1：自动重试 ──");
  mockCallCount = 0;
  const graph = new StateGraph(RetryState)
    .addNode("unstableApi", unstableApi)
    .addEdge(START, "unstableApi")
    .addConditionalEdges("unstableApi", shouldRetry, { unstableApi: "unstableApi" })
    .compile();

  try {
    const r = await graph.invoke({ data: "", attempts: 0 });
    console.log(`  结果: ${r.data}\n`);
  } catch (e: any) {
    console.log(`  失败: ${e.message}\n`);
  }
}

async function demoSelfHeal() {
  console.log("── 策略 2：LLM 自修复 ──");
  healAttempt = 0;
  const graph = new StateGraph(HealState)
    .addNode("generateJson", generateJson)
    .addNode("validateJson", validateJson)
    .addEdge(START, "generateJson")
    .addConditionalEdges("generateJson", routeByValidation, { generateJson: "generateJson" })
    .compile();

  const r = await graph.invoke({ rawOutput: "", parsed: "" });
  console.log(`  结果: ${r.parsed}\n`);
}

async function main() {
  await demoRetry();
  await demoSelfHeal();

  console.log("── 策略 3 & 4 ──");
  console.log("  策略3（人工干预）: 用 interrupt() 暂停等用户 → 详见 08_basic_interrupt.ts");
  console.log("  策略4（上抛异常）: 节点内 throw → 外层 try/catch 捕获处理");
}

main().catch(console.error);
