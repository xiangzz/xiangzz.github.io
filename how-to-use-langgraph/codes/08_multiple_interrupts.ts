/**
 * 对应章节：第08章 - 中断与人机交互
 * 知识点：多个中断、逐步恢复
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：注册流程需要收集姓名、年龄、爱好三项信息。     │
 * │  你不想一次弹一个巨大的表单，而是分步询问。           │
 * │  一个节点里有多个 interrupt()，怎么逐个恢复？         │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：同一节点里写多个 interrupt()，它们按顺序触发。
 *       每次调用 Command({ resume }) 恢复一个 interrupt，
 *       节点重新执行时，已恢复的 interrupt 会返回缓存值，
 *       直到遇到下一个未恢复的 interrupt 再次暂停。
 */

import {
  StateGraph, StateSchema, START, END,
  MemorySaver, Command, interrupt,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  name: z.string(),
  age: z.number(),
  hobbies: z.array(z.string()),
  profile: z.string(),
});

async function collectProfile(state: typeof State.State) {
  // 多个连续 interrupt：按顺序触发，每次恢复一个
  const name = interrupt("请输入您的姓名：");
  const age = interrupt("请输入您的年龄：");
  const hobbies = interrupt("请输入您的爱好（逗号分隔）：");

  const hobbiesList = hobbies.split(",").map((h: string) => h.trim());

  return {
    name,
    age: Number(age) || 0,
    hobbies: hobbiesList,
    profile: `${name}，${age}岁，喜欢${hobbiesList.join("、")}`,
  };
}

const graph = new StateGraph(State)
  .addNode("collectProfile", collectProfile)
  .addEdge(START, "collectProfile")
  .addEdge("collectProfile", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 多个中断逐步恢复 ──\n");

  const config = { configurable: { thread_id: "multi-interrupt" } };

  // 第1次：触发第一个 interrupt（姓名）
  console.log("--- 第1次调用：请求姓名 ---");
  let result = await graph.invoke(
    { name: "", age: 0, hobbies: [], profile: "" },
    config
  );
  console.log("中断:", result.__interrupt__?.[0]?.value);

  // 第2次：提交姓名，触发第二个 interrupt（年龄）
  console.log("\n--- 第2次调用：提交姓名，请求年龄 ---");
  result = await graph.invoke(new Command({ resume: "张三" }), config);
  console.log("中断:", result.__interrupt__?.[0]?.value);

  // 第3次：提交年龄，触发第三个 interrupt（爱好）
  console.log("\n--- 第3次调用：提交年龄，请求爱好 ---");
  result = await graph.invoke(new Command({ resume: "25" }), config);
  console.log("中断:", result.__interrupt__?.[0]?.value);

  // 第4次：提交爱好，完成
  console.log("\n--- 第4次调用：提交爱好，完成 ---");
  result = await graph.invoke(new Command({ resume: "编程, 阅读, 游戏" }), config);

  console.log("\n=== 最终档案 ===");
  console.log(`姓名: ${result.name}`);
  console.log(`年龄: ${result.age}`);
  console.log(`爱好: ${result.hobbies.join(", ")}`);
  console.log(`简介: ${result.profile}`);

  console.log("\n── 多中断注意事项 ──");
  console.log("  1. interrupt 按顺序触发，每次 resume 恢复一个");
  console.log("  2. 节点恢复时从头执行，已恢复的 interrupt 返回缓存值");
  console.log("  3. 不要重新排列 interrupt() 调用顺序");
  console.log("  4. 只传 JSON 可序列化的值");
}

main().catch(console.error);
