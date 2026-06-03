/**
 * 对应章节：第08章 - 中断与人机交互
 * 知识点：审批模式、interrupt + Command({ goto }) 路由
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你有一个文档审批流程。经理审批通过后直接发布， │
 * │  驳回则需要退回修改。两条路径的逻辑完全不同。        │
 * │  怎么在 interrupt 恢复后，根据用户决策走不同的分支？  │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：interrupt() 获取审批结果，在节点中用 Command({ goto })
 *       动态路由到不同节点（发布 / 驳回），一条边实现两条路。
 */

import {
  StateGraph, StateSchema, START, END,
  MemorySaver, Command, interrupt,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  document: z.string(),
  approved: z.boolean(),
  result: z.string(),
});

async function generateDoc(state: typeof State.State) {
  return {
    document: "## 项目计划\n\n1. 需求分析（2周）\n2. 技术设计（1周）\n3. 开发实现（4周）\n4. 测试上线（1周）",
  };
}

async function reviewDoc(state: typeof State.State) {
  console.log(`文档内容:\n${state.document.split("\n").map((l: string) => "  " + l).join("\n")}`);

  // 中断等待审批
  const decision = interrupt({
    message: "请审批以上项目计划",
    document: state.document,
  });

  // 根据审批结果，Command 路由到不同节点
  if (decision === "approved") {
    return new Command({ goto: "publish", update: { approved: true } });
  }
  return new Command({ goto: "reject", update: { approved: false } });
}

async function publish(state: typeof State.State) {
  return { result: `文档已发布: "${state.document.substring(0, 20)}..." ✅` };
}

async function reject(state: typeof State.State) {
  return { result: "文档审批未通过，已退回修改 ❌" };
}

const graph = new StateGraph(State)
  .addNode("generateDoc", generateDoc)
  .addNode("reviewDoc", reviewDoc)
  .addNode("publish", publish)
  .addNode("reject", reject)
  .addEdge(START, "generateDoc")
  .addEdge("generateDoc", "reviewDoc")
  .addEdge("publish", END)
  .addEdge("reject", END)
  .compile({ checkpointer: new MemorySaver() });

async function demoApproval() {
  console.log("=== 审批通过路径 ===\n");
  const config = { configurable: { thread_id: "approval-pass" } };
  await graph.invoke({ document: "", approved: false, result: "" }, config);
  const result = await graph.invoke(new Command({ resume: "approved" }), config);
  console.log(`结果: ${result.result}\n`);
}

async function demoRejection() {
  console.log("=== 审批拒绝路径 ===\n");
  const config = { configurable: { thread_id: "approval-reject" } };
  await graph.invoke({ document: "", approved: false, result: "" }, config);
  const result = await graph.invoke(new Command({ resume: "rejected" }), config);
  console.log(`结果: ${result.result}`);
}

async function main() {
  await demoApproval();
  await demoRejection();

  console.log("\n── Command({ goto }) 审批模式 ──");
  console.log("  interrupt() 获取决策 → Command({ goto, update }) 路由");
  console.log("  不需要 addConditionalEdges，节点内部直接决定去向");
}

main().catch(console.error);
