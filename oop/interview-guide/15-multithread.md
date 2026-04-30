# 面试考点对照：15-multithread

- 课程页面：../15-multithread.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖多线程主题。

## 补充高频面试题（总览，已核对）

### 1) 进程和线程的区别是什么？

- 进程是资源分配基本单位，线程是 CPU 调度基本单位。
- 同一进程内线程共享堆和方法区等资源，但有各自线程栈与程序计数器。

### 2) 创建线程有哪些常见方式？

- 继承 `Thread`、实现 `Runnable`、实现 `Callable` + `FutureTask`。
- 工程中更推荐线程池（`ExecutorService`）管理线程生命周期。

### 3) `sleep()` 和 `wait()` 的关键区别？

- `sleep()` 是 `Thread` 静态方法，不会释放监视器锁。
- `wait()` 是 `Object` 方法，必须在同步块中调用，调用后会释放当前监视器锁。

### 4) 什么是线程安全问题的三个维度？

- 原子性：操作不可被中断到中间状态。
- 可见性：一个线程写入对其他线程可见。
- 有序性：执行结果符合内存模型允许的顺序约束。

### 5) `synchronized` 和 `volatile` 如何取舍？

- `volatile` 保证可见性与有序性（一定程度），不保证复合操作原子性。
- `synchronized` 同时提供互斥与可见性，适合保护临界区复合逻辑。

## 参考来源

- JLS 第 17 章（Threads and Locks）：<https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html>
