/**
 * 对应章节：第03章 - 高级工作流模式
 * 知识点：Evaluator-Optimizer 循环、最大重试保护
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你让 AI 写了一篇文章，但质量不确定。           │
 * │  你想让它反复修改，直到质量达标。但又怕它陷入死循环。  │
 * │  怎么实现"写 → 评 → 不行就改 → 再评 → 最多改 N 次"？  │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：generator + evaluator 两个节点 + 条件边循环
 *       用 attempts 计数器防止无限循环
 */

import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  topic: z.string(),
  content: z.string(),
  score: z.number(),
  feedback: z.string(),
  attempts: z.number(),
});

let attemptCount = 0;

/** 生成器：根据反馈改进内容 */
async function generator(state: typeof State.State) {
  attemptCount++;
  console.log(`[generator] 第 ${attemptCount} 次生成...`);

  if (state.feedback) {
    console.log(`  参考反馈: ${state.feedback}`);
    return { content: `关于${state.topic}的优质回答：内容详实、结构清晰、观点独到。` };
  }
  // 第一次：质量一般
  return { content: `${state.topic}？嗯...就是那个东西。` };
}

/** 评估器：给内容打分、给反馈 */
async function evaluator(state: typeof State.State) {
  const score = state.content.length > 20 ? 85 : 40;
  const feedback = score >= 80 ? "质量达标" : "内容太短，缺少深度分析";
  console.log(`[evaluator] 分数=${score}, 反馈="${feedback}"`);
  return { score, feedback };
}

/** 条件边：达标 → 结束；不达标 → 回到生成器；超过次数 → 也结束 */
function routeByScore(state: typeof State.State): string {
  if (state.score >= 80) { console.log("  → 达标，结束"); return END; }
  if (state.attempts >= 5) { console.log("  → 超过最大次数，结束"); return END; }
  console.log("  → 不达标，回去重写");
  return "generator";
}

const graph = new StateGraph(State)
  .addNode("generator", generator)
  .addNode("evaluator", evaluator)
  .addEdge(START, "generator")
  .addEdge("generator", "evaluator")
  .addConditionalEdges("evaluator", routeByScore, { generator: "generator" })
  .compile();

async function main() {
  attemptCount = 0;
  const r = await graph.invoke({ topic: "LangGraph", content: "", score: 0, feedback: "", attempts: 0 });
  console.log(`\n最终内容: ${r.content}`);
  console.log(`最终分数: ${r.score}, 尝试: ${attemptCount} 次`);
}

main().catch(console.error);
