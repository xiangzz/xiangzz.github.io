/**
 * 对应章节：第07章 - 流式输出
 * 知识点：标签过滤、nostream
 *
 * ┌──────────────────────────────────────────────────────┐
 * │  问题：你的图有两个 LLM 节点：                        │
 * │  1. 主对话 LLM（用户要看到逐字输出）                 │
 * │  2. 内部分类器 LLM（用户不需要看到）                 │
 * │  怎么在 messages 流中只展示主 LLM 的输出？            │
 * └──────────────────────────────────────────────────────┘
 *
 * 思路：给 LLM 打标签，流输出时按 metadata.tags 过滤
 */

console.log("── 标签过滤策略 ──\n");

console.log("1. 给 LLM 实例打标签：");
console.log(`
  const mainModel = new ChatDeepSeek({...}).withConfig({ tags: ['main'] });
  const classifier = new ChatDeepSeek({...}).withConfig({ tags: ['nostream'] });
`);

console.log("2. 在 messages 流中过滤：");
console.log(`
  for await (const chunk of await graph.stream(input, { streamMode: "messages" })) {
    const [messageChunk, metadata] = chunk;
    // 只显示带 'main' 标签的输出
    if (metadata.tags?.includes('main')) {
      process.stdout.write(messageChunk.content);
    }
    // 带有 'nostream' 标签的自动跳过
  }
`);

console.log("── 常用标签 ──");
console.log("  'main'      → 主要 LLM，需要流式输出");
console.log("  'nostream'  → 内部 LLM，不需要出现在消息流中");
