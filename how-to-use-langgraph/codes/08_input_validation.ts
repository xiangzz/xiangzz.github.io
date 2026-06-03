/**
 * 对应章节：第08章 - 中断与人机交互
 * 知识点：输入验证循环、while + interrupt、多轮验证
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：注册流程要求用户输入邮箱，但用户可能乱填。     │
 * │  你需要反复提示，直到输入合法或超过最大尝试次数。     │
 * │  interrupt 每次暂停后恢复，怎么保持之前的验证状态？   │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：while 循环 + interrupt() 反复请求输入。
 *       关键：节点恢复时从头重新执行，interrupt() 会返回缓存的
 *       resume 值，所以 while 循环能正确"快进"到上次暂停的位置。
 */

import {
  StateGraph, StateSchema, START, END,
  MemorySaver, Command, interrupt,
} from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({
  email: z.string(),
  validated: z.boolean(),
  result: z.string(),
});

async function collectEmail(state: typeof State.State) {
  let email = state.email;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    if (!email) {
      email = interrupt("请输入您的邮箱地址：");
    }

    console.log(`  收到输入: ${email}`);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      console.log(`  ✅ 邮箱格式正确`);
      return { email, validated: true };
    }

    console.log(`  ❌ 邮箱格式不正确 (尝试 ${attempts + 1}/${maxAttempts})`);
    attempts++;

    if (attempts < maxAttempts) {
      email = interrupt({
        message: `邮箱格式不正确，请重新输入（剩余 ${maxAttempts - attempts} 次机会）：`,
        invalidEmail: email,
      });
    }
  }

  return { result: `验证失败：超过最大尝试次数 (${maxAttempts})`, validated: false };
}

async function sendWelcome(state: typeof State.State) {
  return { result: `欢迎邮件已发送至 ${state.email} ✅` };
}

const graph = new StateGraph(State)
  .addNode("collectEmail", collectEmail)
  .addNode("sendWelcome", sendWelcome)
  .addEdge(START, "collectEmail")
  .addEdge("collectEmail", "sendWelcome")
  .addEdge("sendWelcome", END)
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 输入验证循环 ──\n");

  const config = { configurable: { thread_id: "validation-demo" } };

  // 第1次：请求邮箱
  console.log("--- 请求邮箱输入 ---");
  let result = await graph.invoke({ email: "", validated: false, result: "" }, config);
  console.log("中断:", result.__interrupt__);

  // 第2次：用户输入无效邮箱
  console.log("\n--- 用户输入无效邮箱 ---");
  result = await graph.invoke(new Command({ resume: "not-an-email" }), config);
  console.log("中断:", result.__interrupt__);

  // 第3次：用户输入有效邮箱
  console.log("\n--- 用户输入有效邮箱 ---");
  result = await graph.invoke(new Command({ resume: "user@example.com" }), config);
  console.log(`最终结果: ${result.result}`);

  console.log("\n── while + interrupt 的关键 ──");
  console.log("  节点恢复时从头重新执行，但 interrupt() 会返回缓存的值");
  console.log("  所以 while 循环能正确跳过已验证的轮次");
  console.log("  不要用 try/catch 包裹 interrupt()");
}

main().catch(console.error);
