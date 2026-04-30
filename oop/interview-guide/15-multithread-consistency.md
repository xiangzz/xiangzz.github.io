# 面试考点对照：15-multithread-consistency

- 课程页面：../15-multithread-consistency.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖多线程/一致性主题。

## 补充高频面试题（一致性与可见性）

### 1) 什么是 Java 内存模型（JMM）里的 happens-before？

- 如果 A happens-before B，则 A 的结果对 B 可见，且执行顺序在语义上先于 B。
- 它是并发可见性与有序性推理的核心规则。

### 2) `volatile` 能保证什么，不能保证什么？

- 能保证：写后读可见、一定程度的有序性约束。
- 不能保证：复合操作原子性（如 `count++`）。

### 3) 什么场景适合 `volatile`？

- 状态标记位（例如停止标志）这类“单次写、多次读”场景。
- 不涉及多个变量不变式维护时使用更合适。

### 4) 为什么 `final` 字段在并发里也常被提及？

- 正确构造并安全发布后，`final` 字段对其他线程具备更强可见性保证。
- 这也是不可变对象在并发设计中常被推荐的原因之一。

## 参考来源

- JLS 第 17 章（happens-before 规则）：<https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html>
