/**
 * 对应章节：第04章 - 快速上手
 * 知识点：tool() 函数、Zod schema、错误处理、返回值
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你要给 Agent 提供几个工具，但工具可能会出错：    │
 * │  - 除法工具遇到除数为零怎么办？                       │
 * │  - 搜索工具需要可选参数（排序方式）怎么定义？         │
 * │  - 工具的参数描述怎么写，LLM 才能正确调用？           │
 * └──────────────────────────────────────────────────────┘
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

// ── 基本工具：参数描述帮助 LLM 理解 ──
const addTool = tool(
  async ({ a, b }) => `${a} + ${b} = ${a + b}`,
  {
    name: "add",
    description: "计算两个数字的和",
    schema: z.object({
      a: z.number().describe("第一个加数"),
      b: z.number().describe("第二个加数"),
    }),
  }
);

// ── 带错误处理的工具 ──
const divideTool = tool(
  async ({ a, b }) => {
    // 工具内部处理错误，返回错误信息而非抛出异常
    if (b === 0) return "错误：除数不能为零，请提供一个非零的除数";
    return `${a} ÷ ${b} = ${(a / b).toFixed(4)}`;
  },
  {
    name: "divide",
    description: "安全除法计算",
    schema: z.object({ a: z.number().describe("被除数"), b: z.number().describe("除数") }),
  }
);

// ── 带可选参数的工具 ──
const searchTool = tool(
  async ({ query, limit }) => {
    const max = limit ?? 5;
    return `搜索 "${query}"，返回 ${max} 条结果`;
  },
  {
    name: "search",
    description: "搜索信息",
    schema: z.object({
      query: z.string().describe("搜索关键词"),
      limit: z.number().optional().describe("结果数量上限，默认5"),
    }),
  }
);

async function main() {
  console.log("── 基本调用 ──");
  console.log(await addTool.invoke({ a: 3, b: 5 }));

  console.log("\n── 除零错误 ──");
  console.log(await divideTool.invoke({ a: 10, b: 0 })); // 不会崩溃
  console.log(await divideTool.invoke({ a: 10, b: 3 })); // 正常

  console.log("\n── 可选参数 ──");
  console.log(await searchTool.invoke({ query: "LangGraph" }));        // 不传 limit
  console.log(await searchTool.invoke({ query: "LangGraph", limit: 10 })); // 传 limit
}

main().catch(console.error);
