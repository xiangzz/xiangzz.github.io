/**
 * 对应章节：第09章 - 时间旅行
 * 知识点：子图时间旅行、getState({ subgraphs: true })
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的主图里嵌套了一个子图。主图的检查点能看，   │
 * │  但子图内部哪一步出了问题，你怎么查？默认状态下       │
 * │  子图对主图来说是个"黑盒"。能打开看看吗？            │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：子图设置 checkpointer: true，然后主图用
 *       getState(config, { subgraphs: true }) 就能透视子图内部。
 */

import {
  StateGraph, StateSchema, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";

// 子图
const ChildState = new StateSchema({
  value: z.string(),
  processed: z.string(),
});

async function childProcess(state: typeof ChildState.State) {
  console.log("  [子图 childProcess] 处理中...");
  return { processed: `已处理: ${state.value}` };
}

const childGraph = new StateGraph(ChildState)
  .addNode("childProcess", childProcess)
  .addEdge(START, "childProcess")
  .addEdge("childProcess", END)
  .compile({ checkpointer: true }); // 子图开启独立 checkpointer

// 主图
const ParentState = new StateSchema({
  input: z.string(),
  output: z.string(),
});

async function callChild(state: typeof ParentState.State) {
  console.log("[主图 callChild] 调用子图...");
  return { output: `主图输出（含子图结果）` };
}

const checkpointer = new MemorySaver();
const parentGraph = new StateGraph(ParentState)
  .addNode("callChild", callChild)
  .addEdge(START, "callChild")
  .addEdge("callChild", END)
  .compile({ checkpointer });

async function main() {
  console.log("── 子图时间旅行 ──\n");

  const config = { configurable: { thread_id: "subgraph-timetravel" } };

  await parentGraph.invoke({ input: "测试", output: "" }, config);

  // 查看子图状态
  console.log("--- 查看子图状态 ---");
  const state = await parentGraph.getState(config, { subgraphs: true });

  console.log("主图状态:");
  console.log(`  input: ${state.values.input}`);
  console.log(`  output: ${state.values.output}`);

  if (state.tasks?.length) {
    console.log("\n子图状态:");
    state.tasks.forEach((task: any) => {
      console.log(`  task: ${task.name}`);
      if (task.state) {
        console.log(`  子图 state: ${JSON.stringify(task.state.values)}`);
      }
    });
  }

  console.log("\n── 子图时间旅行说明 ──");
  console.log("  默认：主图把子图当 super-step，看不到子图内部");
  console.log("  子图设置 checkpointer: true 后：");
  console.log("    - getState(config, { subgraphs: true }) 查看子图内部");
  console.log("    - 可以对子图内部进行 replay 和 fork");
  console.log("  流式输出也支持：stream(input, { subgraphs: true })");
}

main().catch(console.error);
