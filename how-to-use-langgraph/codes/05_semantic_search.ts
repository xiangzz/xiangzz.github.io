/**
 * 对应章节：第05章 - 持久化
 * 知识点：语义搜索、embeddings 配置
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：用户问"我爱写代码"，你想从记忆中找到相关的      │
 * │  偏好，但记忆里存的是"我是前端工程师"——               │
 * │  关键词不匹配，搜不到。能不能按"意思"来搜索？         │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：给 InMemoryStore 配置 embeddings，搜索时用向量相似度匹配
 *       （关键词搜 "代码" 找不到 "工程师"，但语义搜可以）
 *
 * 注意：完整语义搜索需要真实 embeddings API，这里展示配置方式
 */

import { InMemoryStore } from "@langchain/langgraph";

async function main() {
  // ── 基本模式（无语义搜索）──
  const basicStore = new InMemoryStore();
  await basicStore.put(["memories"], "m1", { content: "我是前端工程师" });
  await basicStore.put(["memories"], "m2", { content: "我喜欢喝咖啡" });

  const results = await basicStore.search(["memories"], { query: "前端" });
  console.log(`关键词搜 "前端": ${results.length} 条`);
  console.log(`  → ${results[0]?.value?.content}`);

  // ── 语义搜索配置 ──
  console.log("\n── 语义搜索配置方式 ──");
  console.log(`
  import { OpenAIEmbeddings } from "@langchain/openai";

  const store = new InMemoryStore({
    index: {
      embeddings: new OpenAIEmbeddings({ model: "text-embedding-3-small" }),
      dims: 1536,
    },
  });

  // 存储时自动生成 embedding
  await store.put(["memories"], "m1", { content: "我是前端工程师" });

  // 语义搜索："写代码" 也能匹配到 "前端工程师"
  const results = await store.search(["memories"], { query: "写代码" });
  `);

  console.log("语义搜索让模糊匹配成为可能：");
  console.log("  '编程' → 匹配 '工程师'");
  console.log("  '热饮' → 匹配 '咖啡'");
}

main().catch(console.error);
