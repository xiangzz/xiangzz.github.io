/**
 * 对应章节：第03章 - 高级工作流模式
 * 知识点：Agent 工具调用循环、ToolNode、shouldContinue
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你想做一个"能算数学的计算器 Agent"——           │
 * │  用户说"算一下 3+5 乘以 2"，Agent 需要：             │
 * │  1. 理解意图，决定调哪个工具                          │
 * │  2. 调用工具拿到结果                                 │
 * │  3. 如果还需要进一步计算，继续调工具                  │
 * │  4. 直到没有更多计算需求，给出最终回答                │
 * │  怎么实现这个"思考→调用→再思考"的循环？               │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：agent ↔ toolNode 的循环 + shouldContinue 条件边判断何时停止
 */

import { StateGraph, StateSchema, MessagesValue, START, END } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

// ── 定义工具 ──
const add = tool(async ({ a, b }) => `${a} + ${b} = ${a + b}`, {
  name: "add", description: "两数相加",
  schema: z.object({ a: z.number(), b: z.number() }),
});

const multiply = tool(async ({ a, b }) => `${a} × ${b} = ${a * b}`, {
  name: "multiply", description: "两数相乘",
  schema: z.object({ a: z.number(), b: z.number() }),
});

const search = tool(async ({ query }) => `搜索 "${query}"：找到 3 条结果`, {
  name: "search", description: "搜索信息",
  schema: z.object({ query: z.string() }),
});

const toolsMap = { add, multiply, search };

const State = new StateSchema({ messages: MessagesValue });

// ── Mock LLM：根据消息决定调哪个工具 ──
function mockModel(messages: any[]): AIMessage {
  const hasToolResult = messages.some((m: any) => m instanceof ToolMessage);
  if (hasToolResult) {
    const lastTool = messages.filter((m: any) => m instanceof ToolMessage).pop();
    return new AIMessage(`计算完成！${lastTool?.content}`);
  }

  const lastUser = messages.filter((m: any) => m instanceof HumanMessage).pop();
  const text = (lastUser?.content as string) || "";

  if (text.includes("+") || text.includes("加")) {
    const nums = text.match(/\d+/g)?.map(Number) || [1, 2];
    return new AIMessage({ content: "算加法", tool_calls: [{ name: "add", args: { a: nums[0], b: nums[1] }, id: "tc1" }] });
  }
  if (text.includes("×") || text.includes("*") || text.includes("乘")) {
    const nums = text.match(/\d+/g)?.map(Number) || [2, 3];
    return new AIMessage({ content: "算乘法", tool_calls: [{ name: "multiply", args: { a: nums[0], b: nums[1] }, id: "tc2" }] });
  }
  return new AIMessage("我是计算器 Agent，可以帮你做加法和乘法。");
}

// ── 节点 ──
async function agentNode(state: typeof State.State) {
  return { messages: [mockModel(state.messages)] };
}

async function toolNode(state: typeof State.State) {
  const last = state.messages[state.messages.length - 1] as AIMessage;
  if (!last.tool_calls?.length) return {};
  const results: ToolMessage[] = [];
  for (const tc of last.tool_calls) {
    const fn = toolsMap[tc.name as keyof typeof toolsMap];
    if (fn) {
      const out = await fn.invoke(tc.args);
      results.push(new ToolMessage({ content: out, tool_call_id: tc.id, name: tc.name }));
    }
  }
  return { messages: results };
}

/** 条件边：还有工具调用就继续，否则结束 */
function shouldContinue(state: typeof State.State): string {
  const last = state.messages[state.messages.length - 1];
  return (last instanceof AIMessage && last.tool_calls?.length) ? "toolNode" : END;
}

const graph = new StateGraph(State)
  .addNode("agent", agentNode)
  .addNode("toolNode", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, { toolNode: "toolNode" })
  .addEdge("toolNode", "agent")
  .compile();

async function main() {
  const tests = ["算一下 3 + 5", "帮我算 4 × 7", "你好"];
  for (const input of tests) {
    console.log(`\n── 用户: "${input}" ──`);
    const r = await graph.invoke({ messages: [new HumanMessage(input)] });
    console.log(`AI: ${r.messages.at(-1).content}`);
  }
}

main().catch(console.error);
