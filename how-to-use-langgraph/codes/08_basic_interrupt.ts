/**
 * 对应章节：第08章 - 中断与人机交互
 * 知识点：interrupt() 暂停、Command({ resume }) 恢复、完整中断生命周期
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的自动化脚本要删除服务器上的临时文件。       │
 * │  但删除操作不可逆，你不想让脚本"闷头干完"再告诉你。  │
 * │  能不能在执行危险操作前暂停，等你确认后再继续？       │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：用 interrupt() 在危险操作前暂停，用户通过 Command({ resume })
 *       传入确认结果，图从中断点恢复执行。必须配合 checkpointer。
 */

import {
  StateGraph, StateSchema, START, END,
  MemorySaver, Command, interrupt,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  task: z.string(),
  confirmed: z.boolean(),
  result: z.string(),
});

async function prepareTask(state: typeof State.State) {
  return { task: "删除所有临时文件（共 42 个）" };
}

async function confirmAction(state: typeof State.State) {
  // interrupt() 暂停执行，返回值是 Command({ resume: value }) 传入的值
  const approved = interrupt({
    message: `确认执行：${state.task}`,
    options: ["确认执行", "取消"],
  });
  return { confirmed: approved === "确认执行" };
}

async function executeAction(state: typeof State.State) {
  if (state.confirmed) {
    return { result: `任务已完成: ${state.task}` };
  }
  return { result: "任务已取消" };
}

const graph = new StateGraph(State)
  .addNode("prepareTask", prepareTask)
  .addNode("confirmAction", confirmAction)
  .addNode("executeAction", executeAction)
  .addEdge(START, "prepareTask")
  .addEdge("prepareTask", "confirmAction")
  .addEdge("confirmAction", "executeAction")
  .addEdge("executeAction", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 基本中断与恢复 ──\n");

  const config = { configurable: { thread_id: "interrupt-demo" } };

  // 第一次调用：运行到 interrupt() 暂停
  console.log("--- 第一次调用（触发中断）---");
  const result1 = await graph.invoke(
    { task: "", confirmed: false, result: "" },
    config
  );
  console.log("中断信息:", JSON.stringify(result1.__interrupt__, null, 2));

  // 第二次调用：用 Command({ resume }) 传入用户决策
  console.log("\n--- 第二次调用（恢复执行）---");
  const result2 = await graph.invoke(
    new Command({ resume: "确认执行" }),
    config
  );
  console.log("最终结果:", result2.result);

  // 演示取消
  console.log("\n--- 另一个线程（取消操作）---");
  const config2 = { configurable: { thread_id: "interrupt-cancel" } };
  await graph.invoke({ task: "", confirmed: false, result: "" }, config2);
  const cancelResult = await graph.invoke(
    new Command({ resume: "取消" }),
    config2
  );
  console.log("结果:", cancelResult.result);

  console.log("\n── 中断生命周期 ──");
  console.log("  1. 调用 invoke() → 图运行到 interrupt() 暂停");
  console.log("  2. 返回 __interrupt__ 信息（包含你传给 interrupt 的数据）");
  console.log("  3. 再次 invoke(Command({ resume: value })) → 图恢复执行");
  console.log("  4. interrupt() 的返回值就是 resume 传入的 value");
}

main().catch(console.error);
