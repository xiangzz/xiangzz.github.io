/**
 * 对应章节：第01章 - LangGraph 概览
 * 知识点：Command 对象、goto 跳转、update + goto、resume 恢复
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你写了一个「审批流程」图，有三个出口：          │
 * │  - 通过 → 进入 publish 节点                          │
 * │  - 驳回 → 进入 reject 节点                           │
 * │  - 需要修改 → 同时更新状态并跳回 review 节点         │
 * │  你不想在条件边里写一堆 if-else，能不能在节点内部     │
 * │  直接决定"下一步去哪"？                               │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：用 Command 对象，在节点内部同时控制「去哪」和「更新什么」
 */

import {
  StateGraph,
  StateSchema,
  START,
  END,
  MemorySaver,
  Command,
  interrupt,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  document: z.string(),
  score: z.number(),
  result: z.string(),
});

// ── 场景：AI 给文档打分，根据分数走不同路径 ──

/** AI 评估文档质量 */
async function evaluate(state: typeof State.State) {
  console.log(`[evaluate] 文档得分: ${state.score}`);

  if (state.score >= 80) {
    // 用法1: Command({ goto }) — 纯跳转
    console.log("  → 分数达标，跳到 publish");
    return new Command({ goto: "publish" });
  }
  if (state.score >= 50) {
    // 用法2: Command({ update, goto }) — 同时更新状态再跳转
    console.log("  → 分数一般，打上标记后跳回自己重试");
    return new Command({
      update: { document: `${state.document}（标记需改进）` },
      goto: "reject",
    });
  }
  console.log("  → 分数太低，直接驳回");
  return new Command({ goto: "reject" });
}

async function publish(state: typeof State.State) {
  return { result: `已发布 ✅: ${state.document}` };
}

async function reject(state: typeof State.State) {
  return { result: `已驳回 ❌: ${state.document}` };
}

// ── 用法3: Command({ resume }) 恢复中断 ──

async function askScore(state: typeof State.State) {
  // interrupt 暂停执行，等待外部传入分数
  const score = interrupt("请输入文档分数 (0-100)：");
  return { score: Number(score) || 0 };
}

// ── 构建图 ──
const graph = new StateGraph(State)
  .addNode("askScore", askScore)
  .addNode("evaluate", evaluate)
  .addNode("publish", publish)
  .addNode("reject", reject)
  .addEdge(START, "askScore")
  .addEdge("askScore", "evaluate")
  .addEdge("publish", END)
  .addEdge("reject", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  const config = { configurable: { thread_id: "cmd-demo" } };

  // 第一次调用：触发中断，等待输入分数
  console.log("── 高分场景 ──");
  await graph.invoke({ document: "项目报告", score: 0, result: "" }, config);
  const r1 = await graph.invoke(new Command({ resume: 92 }), config);
  console.log(`结果: ${r1.result}\n`);

  // 低分场景
  console.log("── 低分场景 ──");
  const config2 = { configurable: { thread_id: "cmd-demo-2" } };
  await graph.invoke({ document: "项目报告", score: 0, result: "" }, config2);
  const r2 = await graph.invoke(new Command({ resume: 30 }), config2);
  console.log(`结果: ${r2.result}`);
}

main().catch(console.error);
