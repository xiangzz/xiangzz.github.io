/**
 * 对应章节：第04章 - 快速上手
 * 知识点：工具定义、StateGraph 构建、ToolNode、条件边、完整 Agent
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你想做一个"计算器 Agent"——                      │
 * │  用户说"算一下 15+27"，Agent 理解意图后调用加法工具，  │
 * │  拿到结果再告诉用户。如果用户接着问"再乘 2"，           │
 * │  Agent 要记得上一轮的对话上下文。                       │
 * │  怎么把工具、记忆、循环组合起来？                       │
 * └──────────────────────────────────────────────────────┘
 */

import { StateGraph, StateSchema, MessagesValue, ReducedValue, START, END, MemorySaver } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";

// ── 工具定义 ──
const addTool = tool(async ({ a, b }) => `${a} + ${b} = ${a + b}`, {
  name: "add", description: "计算两数之和",
  schema: z.object({ a: z.number().describe("第一个数"), b: z.number().describe("第二个数") }),
});
const multiplyTool = tool(async ({ a, b }) => `${a} × ${b} = ${a * b}`, {
  name: "multiply", description: "计算两数之积",
  schema: z.object({ a: z.number(), b: z.number() }),
});
const divideTool = tool(async ({ a, b }) => b === 0 ? "错误：除数不能为零" : `${a} ÷ ${b} = ${(a / b).toFixed(2)}`, {
  name: "divide", description: "计算两数之商",
  schema: z.object({ a: z.number(), b: z.number() }),
});

const toolsByName = { add: addTool, multiply: multiplyTool, divide: divideTool };

const State = new StateSchema({
  messages: MessagesValue,
  llmCalls: new ReducedValue(z.number().default(() => 0), { inputSchema: z.number(), reducer: (t, n) => (t ?? 0) + n }),
});

// ── Mock LLM ──
function mockModel(messages: any[]): AIMessage {
  const hasTool = messages.some((m: any) => m instanceof ToolMessage);
  if (hasTool) {
    const last = messages.filter((m: any) => m instanceof ToolMessage).pop();
    return new AIMessage(`计算完成！${last?.content}`);
  }
  const lastUser = messages.filter((m: any) => m instanceof HumanMessage).pop();
  const text = (lastUser?.content as string) || "";
  const nums = text.match(/\d+/g)?.map(Number) || [1, 2];
  if (text.includes("加") || text.includes("+"))
    return new AIMessage({ content: "算加法", tool_calls: [{ name: "add", args: { a: nums[0], b: nums[1] }, id: "tc1" }] });
  if (text.includes("乘") || text.includes("×"))
    return new AIMessage({ content: "算乘法", tool_calls: [{ name: "multiply", args: { a: nums[0], b: nums[1] }, id: "tc2" }] });
  if (text.includes("除") || text.includes("÷"))
    return new AIMessage({ content: "算除法", tool_calls: [{ name: "divide", args: { a: nums[0], b: nums[1] }, id: "tc3" }] });
  return new AIMessage("我是计算器助手，可以帮你做加法、乘法和除法。");
}

async function llmCall(state: typeof State.State) {
  return { messages: [mockModel(state.messages)], llmCalls: 1 };
}

async function toolNode(state: typeof State.State) {
  const last = state.messages[state.messages.length - 1] as AIMessage;
  if (!AIMessage.isInstance(last) || !last.tool_calls?.length) return {};
  const results: ToolMessage[] = [];
  for (const tc of last.tool_calls) {
    const fn = toolsByName[tc.name as keyof typeof toolsByName];
    if (fn) {
      const out = await fn.invoke(tc.args);
      results.push(new ToolMessage({ content: out, tool_call_id: tc.id, name: tc.name }));
    }
  }
  return { messages: results };
}

function shouldContinue(state: typeof State.State): string {
  const last = state.messages[state.messages.length - 1];
  return (last instanceof AIMessage && last.tool_calls?.length) ? "toolNode" : END;
}

const graph = new StateGraph(State)
  .addNode("llmCall", llmCall).addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, { toolNode: "toolNode" })
  .addEdge("toolNode", "llmCall")
  .compile({ checkpointer: new MemorySaver() });

async function main() {
  const config = { configurable: { thread_id: "calc-1" } };

  console.log("── 第1轮 ──");
  let r = await graph.invoke({ messages: [new HumanMessage("算一下 15+27")], llmCalls: 0 }, config);
  console.log(`AI: ${r.messages.at(-1).content}\n`);

  console.log("── 第2轮（记得上下文）──");
  r = await graph.invoke({ messages: [new HumanMessage("再算 8×9")], llmCalls: 0 }, config);
  console.log(`AI: ${r.messages.at(-1).content}`);
  console.log(`共 ${r.messages.length} 条消息，LLM 调用 ${r.llmCalls} 次`);
}

main().catch(console.error);
