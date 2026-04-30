# 面试考点对照：6-adv-4-exception

- 课程页面：../6-adv-4-exception.html
- 主要目标：围绕异常体系、受检/非受检、资源释放与最佳实践组织问答

## 异常（摘录）

### Java 异常类层次结构图概览

Java 中，所有异常和错误的共同祖先都是 `java.lang.Throwable`。

`Throwable` 下面最重要的两个子类是：

- `Exception`
- `Error`

### Exception 和 Error 有什么区别？

- `Exception`：程序本身可以处理的异常，可以通过 `catch` 捕获。
- `Error`：程序无法处理的错误，不建议业务代码通过 `catch` 去恢复。

### Checked Exception 和 Unchecked Exception 有什么区别？

#### Checked Exception

编译期间必须处理（`catch` 或 `throws`）。

#### Unchecked Exception

编译期间不强制处理，通常是 `RuntimeException` 及其子类。

### try-catch-finally 如何使用？

```java
try {
    System.out.println("Try to do something");
    throw new RuntimeException("RuntimeException");
} catch (Exception e) {
    System.out.println("Catch Exception -> " + e.getMessage());
} finally {
    System.out.println("Finally");
}
```

### finally 中的代码一定会执行吗？

不一定，例如 JVM 被终止（`System.exit(1)`）时 `finally` 可能不执行。

### 为什么不建议在 finally 中写 return？

因为它会覆盖 `try` 中原本的返回值，导致行为反直觉。

### 如何使用 try-with-resources 代替 try-catch-finally？

适用资源：

- 任何实现了 `AutoCloseable`
- 或者 `Closeable`

### 异常使用有哪些需要注意的地方？

- 避免把异常定义为静态变量（可能导致栈信息错乱）
- 抛出的异常信息要具体、可读
- 优先抛出语义更准确的异常类型
- 避免重复记录同一异常日志

