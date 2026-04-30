# 面试考点对照：1-cmd

- 课程页面：../1-cmd.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖命令行（cmd/PowerShell）主题。

建议把课程知识点整理成可问可答的形式：

- 常用命令：`cd`、`dir`、`tree`、`type`、`findstr`、重定向与管道
- 环境变量：`PATH`、`JAVA_HOME` 的作用与配置思路
- Java 命令：`javac`、`java`、`jar` 的基本用法与常见报错排查

## 高频面试题

### 1) `PATH` 和 `JAVA_HOME` 有什么区别？

- `JAVA_HOME` 指向 JDK 安装目录，例如 `C:\Program Files\Java\jdk-17`。
- `PATH` 是可执行文件搜索路径，通常把 `%JAVA_HOME%\bin` 加进去，才能在任意目录直接执行 `java`/`javac`。
- 面试追问：只配 `JAVA_HOME` 不配 `PATH`，在新终端里直接敲 `java -version` 往往会提示命令找不到。

### 2) `java` 和 `javac` 的职责分别是什么？

- `javac`：把 `.java` 源码编译成 `.class` 字节码。
- `java`：启动 JVM 执行字节码（类路径模式）或模块（模块路径模式）。
- 常见排障：`Could not find or load main class` 通常是类名/包名/类路径设置不一致。

### 3) `-classpath` 和 `--module-path` 有什么区别？

- `-classpath`（或 `-cp`）用于传统类路径机制。
- `--module-path`（或 `-p`）用于 Java 9+ 模块系统。
- 两者并非简单替换关系：模块化项目通常要结合 `--module`、`--add-modules` 等参数使用。

### 4) 为什么不推荐长期依赖全局 `CLASSPATH` 环境变量？

- 官方更推荐在每次命令中显式使用 `-classpath`，可维护性和可重复性更好。
- 全局 `CLASSPATH` 容易污染不同项目，导致“在我电脑上能跑”的环境耦合问题。

### 5) Windows 下 `javaw` 与 `java` 有什么区别？

- `java` 会附带控制台窗口，适合调试与日志查看。
- `javaw` 常用于 GUI 程序，不附带控制台；启动失败时错误信息可见性较差。

## 参考来源

- Oracle Java 17 `java` 命令手册：<https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html>
- Oracle JDK 工具文档（`javac`）：<https://docs.oracle.com/en/java/javase/17/docs/specs/man/javac.html>
