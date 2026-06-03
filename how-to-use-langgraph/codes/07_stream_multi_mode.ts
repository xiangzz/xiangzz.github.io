/**
 * 对应章节：第07章 - 流式输出
 * 知识点：多模式组合流
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你既想看每步的状态更新（updates），又想看       │
 * │  自定义进度（custom）。两种数据混在一起怎么区分？     │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：streamMode 传入数组 → 输出变为 [mode, data] 元组
 */

import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({ value: z.string(), progress: z.number() });

async function step1(state: typeof State.State, config: any) {
  config?.writer?.({ phase: "步骤1", detail: "加载数据" });
  return { value: "步骤1完成", progress: 33 };
}
async function step2(state: typeof State.State, config: any) {
  config?.writer?.({ phase: "步骤2", detail: "处理数据" });
  return { value: "步骤2完成", progress: 66 };
}
async function step3(state: typeof State.State, config: any) {
  config?.writer?.({ phase: "步骤3", detail: "生成报告" });
  return { value: "步骤3完成", progress: 100 };
}

const graph = new StateGraph(State)
  .addNode("step1", step1).addNode("step2", step2).addNode("step3", step3)
  .addEdge(START, "step1").addEdge("step1", "step2").addEdge("step2", "step3").addEdge("step3", END)
  .compile();

async function main() {
  console.log("── 多模式组合: ['updates', 'custom'] ──\n");

  for await (const chunk of await graph.stream(
    { value: "", progress: 0 },
    { streamMode: ["updates", "custom"] }
  )) {
    const [mode, data] = chunk as [string, any];
    if (mode === "updates") {
      for (const [node, update] of Object.entries(data)) {
        console.log(`[状态] 节点 ${node}: ${JSON.stringify(update)}`);
      }
    } else if (mode === "custom") {
      console.log(`[进度] ${data.phase} - ${data.detail}`);
    }
  }
}

main().catch(console.error);
