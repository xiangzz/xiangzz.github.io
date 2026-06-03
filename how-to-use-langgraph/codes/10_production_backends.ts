/**
 * 对应章节：第10章 - 记忆管理
 * 知识点：生产环境后端配置
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：开发时用 MemorySaver（内存），进程一重启记忆   │
 * │  全丢了。上线后用户每次刷新页面就失忆，这不行。       │
 * │  怎么把记忆持久化到数据库？迁移成本高吗？             │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：所有后端共享相同接口，切换只需改一行 compile 参数。
 *       开发用 MemorySaver，生产用 PostgresSaver / SqliteSaver 等。
 */

import {
  StateGraph, StateSchema, MessagesValue, START, END,
  MemorySaver, InMemoryStore,
} from "@langchain/langgraph";

// 开发环境：纯内存，零依赖，重启丢失
function devConfig() {
  const checkpointer = new MemorySaver();
  const store = new InMemoryStore();

  console.log("[开发] MemorySaver + InMemoryStore");
  console.log("  数据存在内存中，重启丢失");
  console.log("  零依赖，即开即用\n");

  return { checkpointer, store };
}

// 生产环境：持久化到 PostgreSQL
function prodConfig() {
  console.log("[生产] PostgresSaver + PostgresStore\n");

  console.log("安装：");
  console.log("  npm install @langchain/langgraph-checkpoint-postgres\n");

  console.log("Checkpointer 配置：");
  console.log(`
  import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

  const checkpointer = PostgresSaver.fromConnString(
    "postgresql://user:password@localhost:5432/mydb"
  );

  // 首次使用：初始化数据库表（只需执行一次）
  await checkpointer.setup();
  `);

  console.log("Store 配置：");
  console.log(`
  import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres";

  const store = PostgresStore.fromConnString(
    "postgresql://user:password@localhost:5432/mydb"
  );

  // 首次使用：初始化
  await store.setup();

  // 如果需要语义搜索，配置 embeddings
  // const store = new PostgresStore(connString, {
  //   embeddings: new OpenAIEmbeddings({ model: "text-embedding-3-small" }),
  // });
  `);

  console.log("使用（与开发环境完全相同的接口）：");
  console.log(`
  const graph = builder.compile({ checkpointer, store });
  // 之后的代码完全不变！
  `);
}

// 其他后端选项
function otherBackends() {
  console.log("\n[其他后端]\n");

  console.log("SQLite（单机部署）：");
  console.log("  npm install @langchain/langgraph-checkpoint-sqlite");
  console.log("  const checkpointer = SqliteSaver.fromConnString('./data.db')\n");

  console.log("MongoDB / Redis 等也有对应包，接口一致");
}

async function main() {
  console.log("── 从开发到生产的记忆后端迁移 ──\n");
  devConfig();
  prodConfig();
  otherBackends();

  console.log("── 切换只需改一行 ──");
  console.log("  builder.compile({ checkpointer: new MemorySaver() })              // 开发");
  console.log("  builder.compile({ checkpointer: PostgresSaver.fromConnString(url) }) // 生产");
  console.log("  其他代码完全不变");
}

main().catch(console.error);
