/**
 * 对应章节：第11章 - 子图
 * 知识点：查看子图状态、getState({ subgraphs: true })、流式输出
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：主图把子图当节点用，运行完了你想看子图内部的   │
 * │  中间状态——比如子图的 step1 输出了什么、step2 又改了  │
 * │  什么。默认 getState 只能看到主图层面，子图是黑盒。   │
 * │  怎么透视子图内部？                                   │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：子图设置 checkpointer: true，主图用
 *       getState(config, { subgraphs: true }) 查看子图内部状态，
 *       stream({ subgraphs: true }) 流式获取子图更新。
 */

import {
  StateGraph, StateSchema, MessagesValue, START, END, MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// 子图：两个步骤
const ChildState = new StateSchema({
  messages: MessagesValue,
  innerStep: z.string(),
});

async function childStep1(state: typeof ChildState.State) {
  console.log("  [子图 step1] 执行...");
  return { innerStep: "step1完成" };
}

async function childStep2(state: typeof ChildState.State) {
  console.log("  [子图 step2] 执行...");
  return {
    messages: [new AIMessage("子图处理完毕")],
    innerStep: "step2完成",
  };
}

const childGraph = new StateGraph(ChildState)
  .addNode("step1", childStep1)
  .addNode("step2", childStep2)
  .addEdge(START, "step1")
  .addEdge("step1", "step2")
  .addEdge("step2", END)
  .compile({ checkpointer: true }); // 子图开启独立 checkpointer

// 主图
const ParentState = new StateSchema({ messages: MessagesValue });

async function parentProcess(state: typeof ParentState.State) {
  console.log("[主图] 处理中...");
  return { messages: [new AIMessage("主图处理完毕")] };
}

const parentGraph = new StateGraph(ParentState)
  .addNode("child", childGraph)       // 子图直接作为节点
  .addNode("parentProcess", parentProcess)
  .addEdge(START, "child")
  .addEdge("child", "parentProcess")
  .addEdge("parentProcess", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 查看子图内部状态 ──\n");

  const config = { configurable: { thread_id: "subgraph-state" } };

  await parentGraph.invoke(
    { messages: [new HumanMessage("测试子图状态")] },
    config
  );

  // 查看主图 + 子图状态
  console.log("--- 主图 + 子图状态 ---");
  const state = await parentGraph.getState(config, { subgraphs: true });

  console.log("主图状态:");
  console.log(`  messages: ${state.values.messages.length} 条`);

  if (state.tasks?.length) {
    console.log("\n子图状态:");
    state.tasks.forEach((task: any) => {
      console.log(`  节点: ${task.name}`);
      if (task.state) {
        console.log(`  innerStep: ${task.state.values?.innerStep}`);
        console.log(`  messages: ${task.state.values?.messages?.length || 0} 条`);
      }
    });
  }

  // 流式输出子图更新
  console.log("\n--- 流式输出子图更新 ---");
  const config2 = { configurable: { thread_id: "subgraph-stream" } };

  for await (const chunk of await parentGraph.stream(
    { messages: [new HumanMessage("流式测试")] },
    { ...config2, subgraphs: true, streamMode: "updates" }
  )) {
    console.log("流更新:", JSON.stringify(chunk));
  }

  console.log("\n── 子图透视 API ──");
  console.log("  getState(config, { subgraphs: true })  → 查看子图内部状态");
  console.log("  stream(input, { subgraphs: true })      → 流式获取子图更新");
  console.log("  前提：子图需要设置 checkpointer: true");
}

main().catch(console.error);
