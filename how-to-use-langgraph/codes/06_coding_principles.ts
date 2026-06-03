/**
 * 对应章节：第06章 - 持久执行
 * 知识点：三大编码原则
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的 Agent 有时重放后行为不一致：               │
 * │  - UUID 每次生成都不同                               │
 * │  - 时间戳每次都变                                    │
 * │  - 数据库 INSERT 导致重复记录                        │
 * │  怎么写出"即使重放也不出问题"的代码？                 │
 * └──────────────────────────────────────────────────────┘
 */

console.log("── 原则1：副作用用 task() 包裹，避免重复执行 ──\n");
console.log("❌ 不包裹 → 重放时 API 重复调用");
console.log("✅ task('fetch', async () => await api.call()) → 重放时跳过");

console.log("\n── 原则2：不确定值用 task() 包裹，确保确定性 ──\n");
// ❌ 每次 UUID 不同
console.log("❌ const id = crypto.randomUUID()");
console.log("   " + crypto.randomUUID());
console.log("   " + crypto.randomUUID()); // 两次不一样！

// ✅ 用 task 包裹
console.log("✅ task('gen-id', () => crypto.randomUUID()) → 重放时用缓存值");

console.log("\n── 原则3：操作设计为幂等，重复执行也不怕 ──\n");
console.log("❌ INSERT INTO logs (user_id, data) VALUES ('u1', 'hello')");
console.log("   执行两次 → 两条重复记录");

console.log("✅ INSERT INTO logs (user_id, data) VALUES ('u1', 'hello')");
console.log("   ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data");
console.log("   执行两次 → 还是同一条记录（幂等）");

console.log("\n── 总结 ──");
console.log("写持久执行的代码，记住三句话：");
console.log("  1. 副作用 → task() 包裹（避免重复执行）");
console.log("  2. 随机值 → task() 包裹（确保确定性）");
console.log("  3. 写操作 → 幂等设计（重复执行无害）");
