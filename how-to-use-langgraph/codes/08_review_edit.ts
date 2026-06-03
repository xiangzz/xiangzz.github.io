/**
 * 对应章节：第08章 - 中断与人机交互
 * 知识点：审阅编辑模式、interrupt 发送内容、resume 返回编辑后内容
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：AI 生成的文章草稿总是差点意思，你想在发布前   │
 * │  人工润色一下。但润色结果怎么传回图中继续后续流程？   │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：interrupt() 把草稿发给前端 → 用户编辑 → Command({ resume })
 *       把编辑后的内容传回来 → 图用编辑结果替代草稿继续执行
 */

import {
  StateGraph, StateSchema, START, END,
  MemorySaver, Command, interrupt,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  topic: z.string(),
  draft: z.string(),
  finalContent: z.string(),
});

async function generateDraft(state: typeof State.State) {
  const draft = `关于「${state.topic}」的文章草稿：

LangGraph 是一个强大的框架，它允许开发者构建复杂的有状态 AI 应用。
通过图的方式组织节点和边，可以清晰地定义工作流。

（这段内容比较粗糙，需要人工润色）`;
  return { draft };
}

async function humanReview(state: typeof State.State) {
  // interrupt 发送草稿，等待用户编辑后返回
  const editedContent = interrupt({
    message: "请审阅并编辑以下草稿",
    draft: state.draft,
    instructions: "可以直接修改文本，或回复 'ok' 表示通过",
  });

  const finalContent = editedContent === "ok" ? state.draft : editedContent;
  return { finalContent };
}

async function publishContent(state: typeof State.State) {
  console.log("[发布] 最终内容已保存");
  return {};
}

const graph = new StateGraph(State)
  .addNode("generateDraft", generateDraft)
  .addNode("humanReview", humanReview)
  .addNode("publishContent", publishContent)
  .addEdge(START, "generateDraft")
  .addEdge("generateDraft", "humanReview")
  .addEdge("humanReview", "publishContent")
  .addEdge("publishContent", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 审阅编辑模式 ──\n");

  const config = { configurable: { thread_id: "review-edit-demo" } };

  // 第一次：生成草稿并中断
  console.log("--- 第一次调用（生成草稿并中断）---");
  const result1 = await graph.invoke(
    { topic: "LangGraph 入门", draft: "", finalContent: "" },
    config
  );
  console.log("草稿内容:");
  console.log(result1.__interrupt__?.[0]?.value?.draft);

  // 模拟用户编辑后的内容
  const editedContent = `关于「LangGraph 入门」：

LangGraph 是一个强大的低级编排框架，让开发者能够构建复杂的、
有状态的 AI 应用。通过图（Graph）的方式组织节点（Node）和边（Edge），
开发者可以清晰地定义工作流，实现从简单的链式调用到复杂的多 Agent 协作。

核心特性包括：
- 持久化执行（Durable Execution）
- 人机交互（Human-in-the-Loop）
- 流式输出（Streaming）
- 时间旅行调试（Time Travel）`;

  // 第二次：提交编辑后的内容
  console.log("\n--- 第二次调用（提交编辑后的内容）---");
  const result2 = await graph.invoke(
    new Command({ resume: editedContent }),
    config
  );

  console.log("\n最终发布内容:");
  console.log(result2.finalContent);

  console.log("\n── 审阅编辑要点 ──");
  console.log("  interrupt() 发送草稿 → 用户编辑 → resume 传回编辑结果");
  console.log("  图不关心用户怎么编辑，只接收最终文本继续流程");
}

main().catch(console.error);
