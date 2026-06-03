/**
 * 对应章节：第06章 - 持久执行
 * 知识点：三种持久化模式
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的图在运行时，每一步都会产生中间结果。        │
 * │  你需要决定：什么时候把这些中间结果保存到检查点？      │
 * │  - 每步都保存？太慢。                                │
 * │  - 全部跑完再保存？中途崩了就全丢。                   │
 * │  有没有折中方案？                                     │
 * └──────────────────────────────────────────────────────┘
 *
 * 三种模式：
 *   exit  → 跑完才保存（最快，但中途崩了全丢）
 *   async → 每步后台保存（平衡，默认推荐）
 *   sync  → 每步同步等待保存完成（最安全，但最慢）
 */

console.log("── 三种持久化模式 ──\n");

console.log("exit（完成后保存）");
console.log("  compile({ checkpointer, durability: 'exit' })");
console.log("  图完全执行完才保存 → 快，但中途崩了白跑\n");

console.log("async（后台保存，默认）");
console.log("  compile({ checkpointer, durability: 'async' })");
console.log("  每步完成后后台保存 → 性能和安全兼顾\n");

console.log("sync（同步保存）");
console.log("  compile({ checkpointer, durability: 'sync' })");
console.log("  每步完成后等保存成功才继续 → 最安全，但最慢\n");

console.log("── 选择建议 ──");
console.log("  短任务、能重来 → exit");
console.log("  大多数场景   → async（默认）");
console.log("  关键任务     → sync");
