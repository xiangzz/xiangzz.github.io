# 面试考点对照：15-multithread-critical-section

- 课程页面：../15-multithread-critical-section.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖多线程/临界区主题。

## 补充高频面试题（临界区）

### 1) 什么是临界区（Critical Section）？

- 多线程并发访问共享可变资源的代码片段。
- 若不加同步保护，容易出现竞态条件和数据不一致。

### 2) `synchronized` 锁住的到底是什么？

- 锁住的是监视器对象（monitor），不是“代码块本身”。
- 实例同步方法锁当前对象，静态同步方法锁 `Class` 对象。

### 3) `synchronized` 和 `Lock`（如 `ReentrantLock`）如何比较？

- `synchronized` 语法简洁、由 JVM 管理锁释放。
- `Lock` 提供可中断、可定时、可轮询获取、公平锁等更细粒度能力。

### 4) 为什么“缩小锁粒度”通常能提升并发性能？

- 临界区越小，线程竞争越轻，阻塞时间越短。
- 但不能为追求性能破坏正确性，先保证线程安全再优化。
