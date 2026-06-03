/**
 * 对应章节：第03章 - 高级工作流模式
 * 知识点：Orchestrator-Worker 模式、Send API 动态创建 Worker
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你要写一份关于"AI Agent 发展"的报告，          │
 * │  报告有 4 个章节，每章需要独立研究。                  │
 * │  章节数量在运行时才确定（LLM 规划的），               │
 * │  你不能预先写好 4 个固定节点。                        │
 * │  怎么让"一个编排者动态分配 N 个任务"？                 │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：Orchestrator 规划章节 → Send API 为每章创建一个 Worker 实例
 *       Worker 数量由 LLM 的输出决定，运行时才知道
 */

import { StateGraph, StateSchema, ReducedValue, START, END, Send } from "@langchain/langgraph";
import { z } from "zod";

// 主图 State
const State = new StateSchema({
  topic: z.string(),
  sections: z.array(z.object({ title: z.string(), desc: z.string() })),
  completed: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (a, b) => [...(a ?? []), ...b],
  }),
  report: z.string(),
});

// Worker 独立 State（每个 Worker 收到一段任务）
const WorkerState = new StateSchema({
  section: z.object({ title: z.string(), desc: z.string() }),
  completed: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (a, b) => [...(a ?? []), ...b],
  }),
});

/** 编排者：根据主题规划章节 */
async function orchestrator(state: typeof State.State) {
  console.log(`[orchestrator] 为 "${state.topic}" 规划章节...`);
  const sections = [
    { title: "背景", desc: `${state.topic} 的历史与起因` },
    { title: "现状", desc: `${state.topic} 的当前格局` },
    { title: "挑战", desc: `${state.topic} 面临的核心难题` },
    { title: "展望", desc: `${state.topic} 的未来趋势` },
  ];
  console.log(`  规划了 ${sections.length} 个章节`);
  return { sections };
}

/** Worker：每个实例写一个章节 */
async function worker(state: typeof WorkerState.State) {
  console.log(`  [Worker] 撰写: ${state.section.title}`);
  return { completed: [`## ${state.section.title}\n${state.section.desc}（模拟内容）`] };
}

/** 合成最终报告 */
async function synthesizer(state: typeof State.State) {
  console.log(`[synthesizer] 合成报告，共 ${state.completed.length} 章`);
  return { report: `# ${state.topic}\n\n${state.completed.join("\n\n")}` };
}

/** 条件边：为每个章节创建一个 Send → 动态 Worker */
function assignWorkers(state: typeof State.State) {
  console.log(`  创建 ${state.sections.length} 个 Worker`);
  return state.sections.map((s) => new Send("worker", { section: s }));
}

const graph = new StateGraph(State)
  .addNode("orchestrator", orchestrator)
  .addNode("worker", worker)
  .addNode("synthesizer", synthesizer)
  .addEdge(START, "orchestrator")
  .addConditionalEdges("orchestrator", assignWorkers, ["worker"])
  .addEdge("worker", "synthesizer")
  .addEdge("synthesizer", END)
  .compile();

async function main() {
  const r = await graph.invoke({ topic: "AI Agent 发展", sections: [], completed: [], report: "" });
  console.log(`\n── 最终报告 ──\n${r.report}`);
}

main().catch(console.error);
