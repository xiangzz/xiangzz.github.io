/**
 * 对应章节：第02章 - 基础工作流模式
 * 知识点：Prompt Chaining 模式、质量门控、addConditionalEdges
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你想让 AI 写一个笑话，但要求质量过关：         │
 * │  1. 先根据话题写初稿                                 │
 * │  2. 检查初稿质量——如果太烂就不浪费时间改进了         │
 * │  3. 质量过关才继续改进和抛光                          │
 * │  中间有一步不通过就"短路"结束，怎么实现？             │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：Prompt Chaining + 质量门控节点 + 条件边
 *       checkQuality 不通过 → 直接 END，不继续后续步骤
 */

import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  topic: z.string(),
  joke: z.string(),
  improved: z.string(),
  final: z.string(),
  passed: z.boolean(),
});

// ── 三个创作节点 ──

async function generate(state: typeof State.State) {
  console.log("[generate] 写初稿...");
  const joke = "程序员最讨厌两件事：别人的代码没注释，自己的代码要写注释。";
  return { joke };
}

async function improve(state: typeof State.State) {
  console.log("[improve] 改进笑话...");
  return { improved: `${state.joke} —— 因为全靠 AI 写的，谁也看不懂。` };
}

async function polish(state: typeof State.State) {
  console.log("[polish] 最终抛光...");
  return { final: `🌟 ${state.improved} —— 这可能是唯一一个被自己创造物取代还偷着乐的职业。` };
}

// ── 质量门控 ──

async function checkQuality(state: typeof State.State) {
  const passed = state.joke.length > 10;
  console.log(`[checkQuality] 笑话长度=${state.joke.length}, 通过=${passed}`);
  return { passed };
}

/** 条件边：通过 → 继续改进，不通过 → 直接结束 */
function routeByQuality(state: typeof State.State): string {
  return state.passed ? "improve" : END;
}

const graph = new StateGraph(State)
  .addNode("generate", generate)
  .addNode("checkQuality", checkQuality)
  .addNode("improve", improve)
  .addNode("polish", polish)
  .addEdge(START, "generate")
  .addEdge("generate", "checkQuality")
  .addConditionalEdges("checkQuality", routeByQuality, { improve: "improve" })
  .addEdge("improve", "polish")
  .addEdge("polish", END)
  .compile();

async function main() {
  console.log("── 正常流程（笑话够长，通过门控）──\n");
  const r1 = await graph.invoke({ topic: "程序员", joke: "", improved: "", final: "", passed: false });
  console.log(`\n最终笑话: ${r1.final}`);

  console.log("\n\n── 质量门控失败场景 ──");
  console.log("如果 generate 只返回 '哈'（2个字），checkQuality 判定不通过，");
  console.log("图直接跳到 END，不会执行 improve 和 polish —— 这就是「短路」。\n");
}

main().catch(console.error);
