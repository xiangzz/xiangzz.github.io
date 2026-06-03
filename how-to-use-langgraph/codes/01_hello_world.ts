/**
 * 对应章节：第01章 - LangGraph 概览
 * 知识点：StateGraph 基本构建、StateSchema、节点、边、编译与调用
 *
 * ┌─────────────────────────────────────────────────┐
 * │  问题：你想让 AI 自动生成一个笑话，步骤是：       │
 * │  1. 先随机选一个话题                              │
 * │  2. 再根据这个话题写一个笑话                      │
 * │  这两个步骤有先后顺序，怎么用代码表达？           │
 * └─────────────────────────────────────────────────┘
 *
 * 思路：
 * - 每个步骤 → 一个「节点」（Node）
 * - 步骤之间的先后关系 → 一条「边」（Edge）
 * - 两个步骤共享的数据 → 「状态」（State）
 * - 整个流程 → 一个「状态图」（StateGraph）
 */

import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
} from "@langchain/langgraph";

// ── 第一步：定义状态 ──
// 话题和笑话需要在两个节点之间传递，所以放到 State 里
const State = new StateSchema({
  messages: MessagesValue,  // 消息会自动追加，不会覆盖
  topic: { value: String, default: () => "" },
});

// ── 第二步：写节点函数 ──
// 每个节点接收当前状态，返回需要更新的字段

/** 随机选一个话题 */
async function pickTopic(state: typeof State.State) {
  const topics = [
    "为什么程序员分不清万圣节和圣诞节",
    "世界上最远的距离",
    "一个 SQL 语句走进酒吧",
  ];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  console.log(`  选到话题: ${topic}`);
  return {
    messages: [{ role: "assistant", content: `话题: ${topic}` }],
    topic,
  };
}

/** 根据话题写笑话 */
async function writeJoke(state: typeof State.State) {
  const joke = `${state.topic} —— 因为 Oct 31 == Dec 25（八进制31 = 十进制25）`;
  return {
    messages: [{ role: "assistant", content: joke }],
  };
}

// ── 第三步：拼装状态图 ──
// START → pickTopic → writeJoke → END
const graph = new StateGraph(State)
  .addNode("pickTopic", pickTopic)
  .addNode("writeJoke", writeJoke)
  .addEdge(START, "pickTopic")
  .addEdge("pickTopic", "writeJoke")
  .addEdge("writeJoke", END)
  .compile();

// ── 第四步：运行 ──
async function main() {
  const result = await graph.invoke({ messages: [], topic: "" });

  console.log("话题:", result.topic);
  console.log("消息:");
  result.messages.forEach((msg: any, i: number) =>
    console.log(`  [${i}] ${msg.content}`)
  );
}

main().catch(console.error);
