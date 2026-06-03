/**
 * 对应章节：第08章 - 中断与人机交互
 * 知识点：工具内部中断、高风险操作确认
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的 AI Agent 有一个"发送邮件"工具。          │
 * │  用户说"帮我发邮件"，Agent 立刻调用工具发出去——     │
 * │  但万一理解错了收件人，邮件已经发出去了。             │
 * │  怎么在工具真正执行前加一道人工确认？                 │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：在 tool() 函数内部调用 interrupt()，工具执行到一半暂停，
 *       用户确认后才真正发送。不需要改图的结构。
 */

import {
  StateGraph, StateSchema, MessagesValue, START, END,
  MemorySaver, Command, interrupt,
} from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

// 发送邮件前暂停，等待人工确认
const sendEmailTool = tool(
  async ({ to, subject, body }) => {
    // 在工具内部使用 interrupt 暂停！
    const approval = interrupt({
      action: "send_email",
      to,
      subject,
      body,
      message: `确认发送邮件？\n  收件人: ${to}\n  主题: ${subject}\n  正文: ${body.substring(0, 50)}...`,
    });

    if (approval === "approve") {
      return `邮件已成功发送至 ${to}，主题: "${subject}"`;
    }
    return "邮件发送已取消";
  },
  {
    name: "send_email",
    description: "发送电子邮件（需要人工确认）",
    schema: z.object({
      to: z.string().describe("收件人邮箱"),
      subject: z.string().describe("邮件主题"),
      body: z.string().describe("邮件正文"),
    }),
  }
);

const State = new StateSchema({ messages: MessagesValue });

async function agentNode(state: typeof State.State) {
  const hasToolResult = state.messages.some((m: any) => m instanceof ToolMessage);
  if (hasToolResult) {
    const lastTool = state.messages.filter((m: any) => m instanceof ToolMessage).pop();
    return { messages: [new AIMessage(lastTool?.content as string)] };
  }

  // 模拟 LLM 决定调用工具
  return {
    messages: [new AIMessage({
      content: "我将为您发送邮件",
      tool_calls: [{
        name: "send_email",
        args: { to: "boss@company.com", subject: "项目周报", body: "本周完成了 LangGraph 教程的编写工作。" },
        id: "tc1",
      }],
    })],
  };
}

async function toolNode(state: typeof State.State) {
  const lastMsg = state.messages[state.messages.length - 1] as AIMessage;
  if (!lastMsg.tool_calls?.length) return {};

  const results: ToolMessage[] = [];
  for (const tc of lastMsg.tool_calls) {
    if (tc.name === "send_email") {
      const output = await sendEmailTool.invoke(tc.args);
      results.push(new ToolMessage({ content: output, tool_call_id: tc.id, name: tc.name }));
    }
  }
  return { messages: results };
}

function shouldContinue(state: typeof State.State): string {
  const lastMsg = state.messages[state.messages.length - 1];
  if (lastMsg instanceof AIMessage && lastMsg.tool_calls?.length) return "toolNode";
  return END;
}

const graph = new StateGraph(State)
  .addNode("agent", agentNode)
  .addNode("toolNode", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, { toolNode: "toolNode" })
  .addEdge("toolNode", "agent")
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  console.log("── 工具内部中断 ──\n");

  const config = { configurable: { thread_id: "tool-interrupt" } };

  // 第一次调用：Agent 决定发邮件 → 工具内 interrupt 暂停
  console.log("--- 第一次调用（触发工具中断）---");
  const result1 = await graph.invoke(
    { messages: [new HumanMessage("帮我发一封项目周报邮件")] },
    config
  );
  console.log("\n中断信息:", JSON.stringify(result1.__interrupt__?.[0]?.value, null, 2));

  // 恢复并批准
  console.log("\n--- 恢复并批准发送 ---");
  const result2 = await graph.invoke(
    new Command({ resume: "approve" }),
    config
  );
  console.log(`AI: ${result2.messages.at(-1).content}`);

  // 演示取消
  console.log("\n--- 另一次调用（取消发送）---");
  const config2 = { configurable: { thread_id: "tool-interrupt-cancel" } };
  await graph.invoke({ messages: [new HumanMessage("发邮件")] }, config2);
  const result3 = await graph.invoke(new Command({ resume: "reject" }), config2);
  console.log(`AI: ${result3.messages.at(-1).content}`);

  console.log("\n── 工具中断要点 ──");
  console.log("  interrupt() 可以写在 tool() 函数内部");
  console.log("  不需要改图结构，图自动处理工具中的中断");
  console.log("  适合高风险操作：发邮件、转账、删除数据等");
}

main().catch(console.error);
