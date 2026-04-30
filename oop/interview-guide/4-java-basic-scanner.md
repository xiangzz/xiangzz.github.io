# 面试考点对照：4-java-basic-scanner

- 课程页面：../4-java-basic-scanner.html

## 本节对应的面试考点（补充摘录）

当前 interview-guide 原始资料没有专门围绕 `Scanner` 做问答，但在异常章节里给了 `try-with-resources` 的典型用法，可用于回答“如何安全关闭 Scanner/流”。

### 如何使用 try-with-resources 代替 try-catch-finally？

适用资源：

- 任何实现了 `AutoCloseable`
- 或者 `Closeable`

`try-with-resources` 写法：

```java
try (Scanner scanner = new Scanner(new File("test.txt"))) {
    while (scanner.hasNext()) {
        System.out.println(scanner.nextLine());
    }
} catch (FileNotFoundException fnfe) {
    fnfe.printStackTrace();
}
```

## 补充高频面试题（输入与资源管理）

### 1) `Scanner` 为什么在读取大文本时可能比较慢？

- `Scanner` 以“正则分隔 + 解析”为主要能力，便利性高但开销通常也更大。
- 面试回答要点：按场景选工具，性能敏感时更倾向使用更底层/更专用的读取方式。

### 2) `hasNext()`/`next()` 和 `hasNextLine()`/`nextLine()` 有什么区别？

- 前者以“token（默认按空白分隔）”为单位读取。
- 后者以“整行”为单位读取。
- 常见坑：`nextInt()` 读取数字后，紧跟 `nextLine()` 会读到残留换行，需要处理输入缓冲的边界。
