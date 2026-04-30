# 面试考点对照：10-stream-api

- 课程页面：../10-stream-api.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 Stream API 主题。

## 高频面试题

### 1) Stream 是什么？和集合（Collection）有什么区别？

- `Collection` 是数据存储结构，关注“持有元素”。
- `Stream` 是计算视图，关注“对元素做声明式处理管道”。
- Stream 通常不修改底层数据源，且一次性消费（终止操作后不可复用）。

### 2) 中间操作（intermediate）和终止操作（terminal）有什么区别？

- 中间操作返回新的 Stream，如 `filter`、`map`、`distinct`。
- 终止操作触发执行并产生结果或副作用，如 `collect`、`count`、`forEach`。
- 没有终止操作时，整条流水线通常不会真正执行（惰性求值）。

### 3) 为什么说 Stream 强调“无状态、无副作用”？

- 并行执行时，带外部可变状态的 Lambda 可能引发竞态条件。
- 官方建议使用无干扰（non-interfering）、无状态（stateless）函数式参数。

### 4) `findFirst` 和 `findAny` 有什么差异？

- `findFirst` 强调遇到顺序，结果更可预测（特别是顺序流）。
- `findAny` 在并行流中可返回任意匹配元素，通常更利于并行优化。

### 5) 什么时候不建议用并行流（parallel stream）？

- 数据量小、任务很轻、或存在阻塞 I/O 时，线程切换与拆分开销可能大于收益。
- 对顺序敏感且副作用明显的逻辑，也不适合直接并行化。

## 参考来源

- Oracle API：`Stream` 接口文档：<https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html>
- Oracle/OpenJDK：`java.util.stream` 包说明：<https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/package-summary.html>
