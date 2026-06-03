/**
 * 对应章节：第07章 - 流式输出
 * 知识点：values vs updates 两种流模式
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的图有 3 个步骤，你希望每完成一步就能看到     │
 * │  进度，而不是等全部跑完才出结果。                     │
 * │  但 graph.stream() 有两种模式，输出格式不一样：       │
 * │  "values" 每次给完整状态，"updates" 只给增量。        │
 * │  该用哪个？区别在哪？                                 │
 * └──────────────────────────────────────────────────────┘
 */

import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({ topic: z.string(), joke: z.string(), rating: z.string() });

async function genTopic(state: typeof State.State) { return { topic: "程序员" }; }
async function writeJoke(state: typeof State.State) { return { joke: `${state.topic}的笑话：代码能跑就行` }; }
async function rate(state: typeof State.State) { return { rating: "⭐⭐⭐⭐" }; }

const graph = new StateGraph(State)
  .addNode("genTopic", genTopic).addNode("writeJoke", writeJoke).addNode("rate", rate)
  .addEdge(START, "genTopic").addEdge("genTopic", "writeJoke").addEdge("writeJoke", "rate").addEdge("rate", END)
  .compile();

async function main() {
  console.log("── streamMode: 'values'（每步给完整状态）──\n");
  for await (const chunk of await graph.stream({ topic: "", joke: "", rating: "" }, { streamMode: "values" })) {
    console.log("完整状态:", JSON.stringify(chunk));
  }

  console.log("\n── streamMode: 'updates'（每步只给增量）──\n");
  for await (const chunk of await graph.stream({ topic: "", joke: "", rating: "" }, { streamMode: "updates" })) {
    for (const [node, update] of Object.entries(chunk)) {
      console.log(`节点 ${node} 的更新:`, JSON.stringify(update));
    }
  }

  console.log("\n── 区别 ──");
  console.log("values:  每次拿到的是完整状态（包含之前所有步骤的结果）");
  console.log("updates: 每次只有本步骤新增/修改的字段（增量）");
}

main().catch(console.error);
