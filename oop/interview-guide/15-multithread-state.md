# 面试考点对照：15-multithread-state

- 课程页面：../15-multithread-state.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖线程状态主题。

## 补充高频面试题（线程状态）

### 1) Java 线程有哪些状态？

- `NEW`、`RUNNABLE`、`BLOCKED`、`WAITING`、`TIMED_WAITING`、`TERMINATED`。
- 面试常问：`RUNNABLE` 在 JVM 层面包含“就绪 + 运行中”。

### 2) `BLOCKED` 和 `WAITING` 有何区别？

- `BLOCKED`：等待进入同步块（等监视器锁）。
- `WAITING`：主动等待其他线程显式唤醒（如 `Object.wait()`、`Thread.join()`）。

### 3) 哪些操作会进入 `TIMED_WAITING`？

- `Thread.sleep(...)`
- `Object.wait(timeout)`
- `Thread.join(timeout)`

### 4) 如何在排障中观察线程状态？

- 线上常用 `jstack` 导出线程栈，配合状态判断死锁、锁竞争、长时间等待。
- 监控平台可结合线程池指标与堆栈采样定位热点阻塞点。
