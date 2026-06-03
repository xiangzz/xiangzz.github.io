/**
 * 对应章节：第09章 - 时间旅行
 * 知识点：中断与时间旅行结合、回放到中断点、Fork 绕过中断
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的审批图有个 interrupt 节点。你回放到那个     │
 * │  检查点想重试，但 interrupt 又弹出来了。能不能：       │
 * │  (a) 重新回答中断问题？ (b) 直接跳过中断？            │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：(a) Replay → interrupt 会被重新触发 → 需要 resume
 *       (b) Fork + asNode → 模拟 interrupt 节点的输出 → 跳过中断
 */

import {
  StateGraph, StateSchema, START, END,
  MemorySaver, Command, interrupt,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  question: z.string(),
  answer: z.string(),
  confirmed: z.boolean(),
});

async function generateAnswer(state: typeof State.State) {
  return { answer: `关于「${state.question}」的回答：这是一个模拟回答。` };
}

async function confirmAnswer(state: typeof State.State) {
  const confirmed = interrupt({
    message: "回答是否满意？",
    answer: state.answer,
  });
  return { confirmed: confirmed === "yes" };
}

async function finalize(state: typeof State.State) {
  if (state.confirmed) {
    return { answer: `${state.answer} (已确认 ✅)` };
  }
  return { answer: "用户对回答不满意，需要重新生成" };
}

const checkpointer = new MemorySaver();
const graph = new StateGraph(State)
  .addNode("generateAnswer", generateAnswer)
  .addNode("confirmAnswer", confirmAnswer)
  .addNode("finalize", finalize)
  .addEdge(START, "generateAnswer")
  .addEdge("generateAnswer", "confirmAnswer")
  .addEdge("confirmAnswer", "finalize")
  .addEdge("finalize", END)
  .compile({ checkpointer });

async function main() {
  console.log("── 中断与时间旅行 ──\n");

  const config = { configurable: { thread_id: "interrupt-timetravel" } };

  // 原始执行：触发中断
  console.log("--- 原始执行（触发中断）---");
  let result = await graph.invoke(
    { question: "LangGraph 是什么", answer: "", confirmed: false },
    config
  );
  console.log("中断:", result.__interrupt__?.[0]?.value?.message);

  // 恢复中断
  console.log("\n--- 恢复中断（确认满意）---");
  result = await graph.invoke(new Command({ resume: "yes" }), config);
  console.log(`最终回答: ${result.answer}`);

  // 回放到中断点 → interrupt 会重新触发
  console.log("\n\n--- 回放到中断检查点 ---");
  const history: any[] = [];
  for await (const state of graph.getStateHistory(config)) {
    history.push(state);
  }

  const beforeConfirm = history.find(cp => cp.next?.includes("confirmAnswer"));

  if (beforeConfirm) {
    console.log("找到检查点，准备回放...");
    console.log("⚠️ 回放会重新执行节点，中断会被再次触发");
    console.log("需要再次提供 resume 值");
    console.log(`
    // 回放到 confirmAnswer 之前
    const replayResult = await graph.invoke(null, beforeConfirm.config);
    // 会重新触发 interrupt，需要再次 resume
    // const final = await graph.invoke(new Command({ resume: "no" }), config);
    `);
  }

  // Fork 绕过中断
  console.log("\n--- Fork 绕过中断 ---");
  if (beforeConfirm) {
    console.log("通过 Fork + asNode 可以跳过中断确认步骤：");
    console.log(`
    // 1. 修改状态，模拟 confirmAnswer 的输出
    await graph.updateState(
      beforeConfirm.config,
      { confirmed: true },
      { asNode: "confirmAnswer" }
    );

    // 2. 用新 thread_id 执行
    const forkConfig = { configurable: { thread_id: "fork-bypass" } };
    const result = await graph.invoke(null, forkConfig);
    // 直接进入 finalize，不再触发中断
    `);
  }

  console.log("\n── 总结 ──");
  console.log("  Replay 到中断点 → 中断重新触发 → 需要新的 resume");
  console.log("  Fork + asNode → 跳过中断 → 直接模拟节点输出");
}

main().catch(console.error);
