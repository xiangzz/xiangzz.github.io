/**
 * 对应章节：第03章 - 高级工作流模式
 * 知识点：Send API 详解、动态节点实例
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的系统需要给每个员工生成一份绩效评估，        │
 * │  但每次评估的员工数量不同（有时 3 人，有时 10 人）。   │
 * │  普通的条件边只能选"A节点"或"B节点"，                │
 * │  怎么实现"运行时动态创建 N 个处理节点"？              │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：普通条件边 = 选一个已有节点
 *       Send = 创建同一个节点的 N 个实例，每个传入不同数据
 */

import { StateGraph, StateSchema, ReducedValue, START, END, Send } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  employees: z.array(z.object({ name: z.string(), role: z.string() })),
  reports: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (a, b) => [...(a ?? []), ...b],
  }),
});

const WorkerState = new StateSchema({
  employee: z.object({ name: z.string(), role: z.string() }),
  reports: new ReducedValue(z.array(z.string()).default(() => []), {
    inputSchema: z.array(z.string()),
    reducer: (a, b) => [...(a ?? []), ...b],
  }),
});

/** HR 规划：列出要评估的员工 */
async function hrPlanner(state: typeof State.State) {
  console.log("[HR] 确定评估名单...");
  const employees = [
    { name: "张三", role: "前端" },
    { name: "李四", role: "后端" },
    { name: "王五", role: "测试" },
  ];
  console.log(`  共 ${employees.length} 人需要评估`);
  return { employees };
}

/** 评估节点：每个人生成一份报告 */
async function evaluate(state: typeof WorkerState.State) {
  console.log(`  [评估] ${state.employee.name}（${state.employee.role}）`);
  return { reports: [`${state.employee.name}（${state.employee.role}）：绩效 A，表现优秀`] };
}

/** 关键：条件边返回 Send 数组 → 为每个员工创建一个 evaluate 实例 */
function dispatch(state: typeof State.State) {
  console.log(`  为 ${state.employees.length} 人创建评估任务`);
  return state.employees.map((emp) => new Send("evaluate", { employee: emp }));
}

const graph = new StateGraph(State)
  .addNode("hrPlanner", hrPlanner)
  .addNode("evaluate", evaluate)
  .addEdge(START, "hrPlanner")
  .addConditionalEdges("hrPlanner", dispatch, ["evaluate"])
  .addEdge("evaluate", END)
  .compile();

async function main() {
  const r = await graph.invoke({ employees: [], reports: [] });
  console.log("\n── 评估报告 ──");
  r.reports.forEach((line) => console.log(`  ${line}`));
}

main().catch(console.error);
