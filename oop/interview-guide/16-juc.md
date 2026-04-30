# 面试考点对照：16-juc

- 课程页面：../16-juc.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 JUC 主题。

## 高频面试题

### 1) 为什么工程实践更推荐 `ExecutorService` 而不是手动 `new Thread()`？

- 线程池可复用线程，降低创建销毁开销。
- 可统一限流、排队、拒绝策略与优雅停机（`shutdown`/`shutdownNow`）。
- 更便于监控与治理（线程命名、队列长度、活跃线程数）。

### 2) `submit()` 和 `execute()` 的区别？

- `execute(Runnable)` 无返回值，异常通常交给线程的未捕获异常处理器。
- `submit(...)` 返回 `Future`，可通过 `get()` 获取结果或感知异常。

### 3) `ConcurrentHashMap` 为什么比 `Hashtable` 更适合高并发？

- 读取并发能力更强，更新竞争控制更细粒度。
- 在保证线程安全的前提下，吞吐量通常优于全表粗粒度同步方案。

### 4) `Future` 和 `CompletableFuture` 的区别？

- `Future` 偏“阻塞式结果占位符”，编排能力有限。
- `CompletableFuture` 支持链式编排、组合、异常恢复，适合异步流程。

### 5) 如何优雅关闭线程池？

- 先 `shutdown()`，拒绝新任务并等待已提交任务完成。
- 超时后再考虑 `shutdownNow()`，并处理中断语义。
- 面试加分点：在任务代码中正确响应中断信号。

## 参考来源

- Oracle API：`java.util.concurrent` 包：<https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/package-summary.html>
- Oracle API：`ExecutorService`：<https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ExecutorService.html>
