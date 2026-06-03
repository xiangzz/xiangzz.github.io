/**
 * 对应章节：第02章 - 基础工作流模式
 * 知识点：并行化模式、START 连接多节点、ReducedValue 合并
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你要给用户展示一个话题的三种创作风格：          │
 * │  一段笑话、一篇小故事、一首打油诗。                   │
 * │  如果串行写，得等一个写完再写下一个，太慢了。         │
 * │  能不能三个同时写，最后汇总？                         │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：START 同时连三条边 → 三个节点并行执行 → ReducedValue 合并结果
 */

import { StateGraph, StateSchema, ReducedValue, START, END } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  topic: z.string(),
  // 三个节点都要往 outputs 里写，用 ReducedValue 合并而非覆盖
  outputs: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (existing, update) => [...(existing ?? []), ...update],
  }),
  finalResult: z.string(),
});

async function writeJoke(state: typeof State.State) {
  console.log("[writeJoke] 并行执行...");
  return { outputs: [`笑话: ${state.topic} —— 代码能跑就行，别动它！`] };
}

async function writeStory(state: typeof State.State) {
  console.log("[writeStory] 并行执行...");
  return { outputs: [`故事: 从前有个程序员，写了一段完美的代码，然后醒了`] };
}

async function writePoem(state: typeof State.State) {
  console.log("[writePoem] 并行执行...");
  return { outputs: [`诗歌: 代码如诗行行美，Bug 如星点点明`] };
}

async function aggregate(state: typeof State.State) {
  console.log(`[aggregate] 收到 ${state.outputs.length} 个结果，开始汇总`);
  return { finalResult: state.outputs.join("\n\n") };
}

const graph = new StateGraph(State)
  .addNode("writeJoke", writeJoke)
  .addNode("writeStory", writeStory)
  .addNode("writePoem", writePoem)
  .addNode("aggregate", aggregate)
  // 关键：START 同时连三个节点 → 并行执行
  .addEdge(START, "writeJoke")
  .addEdge(START, "writeStory")
  .addEdge(START, "writePoem")
  // 三个都完成后汇入聚合节点
  .addEdge("writeJoke", "aggregate")
  .addEdge("writeStory", "aggregate")
  .addEdge("writePoem", "aggregate")
  .addEdge("aggregate", END)
  .compile();

async function main() {
  const r = await graph.invoke({ topic: "程序员的一天", outputs: [], finalResult: "" });
  console.log(`\n── 汇总结果 ──\n${r.finalResult}`);
}

main().catch(console.error);
