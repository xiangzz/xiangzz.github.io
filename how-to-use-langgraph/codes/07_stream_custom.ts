/**
 * 对应章节：第07章 - 流式输出
 * 知识点：custom 模式 config.writer() 自定义进度
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的分析任务有多个阶段，前端需要展示进度条。    │
 * │  但你不想让这些"进度信息"污染 State。                 │
 * │  能不能在不修改状态的情况下，推送自定义数据给前端？    │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：config.writer() 推送自定义数据，streamMode: "custom" 接收
 *       writer() 的数据不影响 State，纯进度报告
 */

import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({ topic: z.string(), analysis: z.string() });

async function analyze(state: typeof State.State, config: any) {
  // 推送自定义进度（不影响 State）
  config?.writer?.({ phase: "数据收集", progress: 25 });
  config?.writer?.({ phase: "模型推理", progress: 50 });
  config?.writer?.({ phase: "报告生成", progress: 100 });
  return { analysis: `分析完成: ${state.topic}` };
}

const graph = new StateGraph(State)
  .addNode("analyze", analyze)
  .addEdge(START, "analyze").addEdge("analyze", END)
  .compile();

async function main() {
  console.log("── streamMode: 'custom' ──\n");

  for await (const chunk of await graph.stream(
    { topic: "LangGraph 性能", analysis: "" },
    { streamMode: "custom" }
  )) {
    console.log(`进度: ${chunk.phase} (${chunk.progress}%)`);
  }

  console.log("\n── 多模式组合 ──");
  console.log("可以同时用 updates + custom：");
  console.log("  streamMode: ['updates', 'custom']");
  console.log("  输出变为 [mode, data] 元组，按 mode 分发处理");
}

main().catch(console.error);
