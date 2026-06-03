/**
 * 对应章节：第02章 - 基础工作流模式
 * 知识点：路由模式、分类 + 条件分发
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你在做一个智能客服，用户的问题有不同类型：      │
 * │  技术问题、生活问题、健身问题。                       │
 * │  你需要先判断类型，再把问题转给对应的专家处理。       │
 * │  怎么实现"一个入口，多条出路"？                       │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：router 节点分类 → addConditionalEdges 根据分类结果分发
 */

import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  question: z.string(),
  category: z.string(),
  answer: z.string(),
});

// ── Router：根据关键词判断分类 ──
async function router(state: typeof State.State) {
  const q = state.question;
  let category = "tech";
  if (/做菜|食谱|烹饪/.test(q)) category = "cooking";
  if (/健身|跑步|锻炼/.test(q)) category = "fitness";
  console.log(`[router] "${q}" → ${category}`);
  return { category };
}

// ── 三个专家 ──
async function techExpert(state: typeof State.State) {
  return { answer: "💡 建议打开 Chrome DevTools，先看 Console 有没有报错。" };
}
async function cookingExpert(state: typeof State.State) {
  return { answer: "🍳 新手建议从番茄炒蛋练起，重点是火候和盐量。" };
}
async function fitnessExpert(state: typeof State.State) {
  return { answer: "🏃 每周 3 次有氧 + 2 次力量，循序渐进，别一开始就猛练。" };
}

function routeByCategory(state: typeof State.State): string {
  const map: Record<string, string> = { tech: "techExpert", cooking: "cookingExpert", fitness: "fitnessExpert" };
  return map[state.category] || "techExpert";
}

const graph = new StateGraph(State)
  .addNode("router", router)
  .addNode("techExpert", techExpert)
  .addNode("cookingExpert", cookingExpert)
  .addNode("fitnessExpert", fitnessExpert)
  .addEdge(START, "router")
  .addConditionalEdges("router", routeByCategory, {
    techExpert: "techExpert",
    cookingExpert: "cookingExpert",
    fitnessExpert: "fitnessExpert",
  })
  .addEdge("techExpert", END)
  .addEdge("cookingExpert", END)
  .addEdge("fitnessExpert", END)
  .compile();

async function main() {
  const questions = [
    "我的代码有 bug 怎么排查？",
    "红烧肉怎么做才好吃？",
    "跑步膝盖疼怎么办？",
  ];

  for (const q of questions) {
    const r = await graph.invoke({ question: q, category: "", answer: "" });
    console.log(`问: ${q}\n答: ${r.answer}\n`);
  }
}

main().catch(console.error);
