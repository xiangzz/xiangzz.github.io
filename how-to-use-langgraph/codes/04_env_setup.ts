/**
 * 对应章节：第04章 - 快速上手
 * 知识点：项目初始化、依赖安装、配置文件
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你第一次用 LangGraph.js，完全不知道怎么建项目。 │
 * │  需要安装哪些依赖？tsconfig 怎么配？怎么运行 .ts 文件？│
 * └──────────────────────────────────────────────────────┘
 */

// ═══════ 步骤1：创建项目 ═══════
// $ mkdir my-agent && cd my-agent
// $ npm init -y

// ═══════ 步骤2：安装依赖 ═══════
// $ npm install @langchain/langgraph @langchain/core zod
// $ npm install -D typescript tsx @types/node
//
// 可选（选一个 LLM 提供商）：
// $ npm install @langchain/deepseek

// ═══════ 步骤3：tsconfig.json ═══════
/*
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  }
}
*/

// ═══════ 步骤4：.env 文件 ═══════
/*
DEEPSEEK_API_KEY=sk-your-key-here
*/

// ═══════ 步骤5：运行 ═══════
// $ npx tsx your-file.ts

// ═══════ 步骤6：验证安装 ═══════

import { StateGraph, StateSchema, START, END } from "@langchain/langgraph";
import { z } from "zod";

const State = new StateSchema({ message: z.string() });

async function hello(state: typeof State.State) {
  return { message: "环境配置成功！可以开始开发 LangGraph 应用了。" };
}

const graph = new StateGraph(State)
  .addNode("hello", hello)
  .addEdge(START, "hello")
  .addEdge("hello", END)
  .compile();

graph.invoke({ message: "" }).then((r) => console.log(r.message));
