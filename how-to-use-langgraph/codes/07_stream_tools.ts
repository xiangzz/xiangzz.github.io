/**
 * 对应章节：第07章 - 流式输出
 * 知识点：tools 模式、异步生成器工具
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的搜索工具执行时间较长，你想在工具执行过程中  │
 * │  向前端报告进度（"正在搜索..."、"处理结果..."）。     │
 * │  怎么让工具在执行中推送中间状态？                     │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：用 async function* 定义工具，yield 中间进度
 *       streamMode: "tools" 接收工具生命周期事件
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

// ── 异步生成器工具：可以 yield 中间进度 ──
const searchTool = tool(
  async function* ({ query }) {
    yield { status: "searching", message: `正在搜索 "${query}"...` };
    yield { status: "processing", message: "处理搜索结果..." };
    return `搜索 "${query}" 完成，找到 5 条结果`;
  },
  { name: "search", description: "搜索信息", schema: z.object({ query: z.string() }) }
);

async function main() {
  console.log("── 异步生成器工具演示 ──\n");

  // 手动消费 yield 和 return
  const stream = await searchTool.invoke({ query: "LangGraph" });

  console.log("\n── tools 模式的四种生命周期事件 ──");
  console.log("  on_tool_start  → 工具开始执行");
  console.log("  on_tool_event  → 工具 yield 中间进度");
  console.log("  on_tool_end    → 工具执行完成");
  console.log("  on_tool_error  → 工具执行出错");

  console.log("\n── 真实流式消费代码 ──");
  console.log(`
  for await (const chunk of await graph.stream(input, { streamMode: "tools" })) {
    switch (chunk.event) {
      case "on_tool_start":  console.log("开始:", chunk.name); break;
      case "on_tool_event":  console.log("进度:", chunk.data.message); break;
      case "on_tool_end":    console.log("完成:", chunk.data); break;
    }
  }
  `);
}

main().catch(console.error);
