# 面试考点对照：3-introduction

- 课程页面：../3-introduction.html
- 主要目标：把“Java 平台体系 + 字节码执行模型 + 发行版差异”讲清楚

## 平台体系（摘录）

### Java SE vs Java EE

#### Java SE

Java 标准版，是 Java 平台的基础，包含：

- 核心类库
- JVM
- 基本开发与运行能力

#### Java EE

Java 企业版，建立在 Java SE 之上，包含大量企业级开发规范，例如：

- Servlet
- JSP
- EJB
- JDBC
- JPA
- JTA
- JavaMail
- JMS

### JVM vs JDK vs JRE

#### JVM

JVM（Java Virtual Machine）是运行 Java 字节码的虚拟机。

#### JRE

JRE（Java Runtime Environment）是 Java 运行环境，主要包含 JVM 与 Java 基础类库。

#### JDK

JDK（Java Development Kit）是完整的 Java 开发工具包，包含 JRE 与 `javac`、`javadoc`、`javap` 等工具链。

## 字节码与执行模型（摘录）

### 什么是字节码？采用字节码的好处是什么？

在 Java 中，JVM 可以理解的代码叫字节码，也就是 `.class` 文件。

字节码的特点：

- 不面向具体处理器
- 只面向 JVM

采用字节码的好处：

- 保留了解释型语言的可移植性
- 又比传统纯解释型语言效率更高
- Java 程序无需重新编译即可在不同操作系统上运行

### 为什么说 Java 语言“编译与解释并存”？

Java 程序的执行过程通常是：

1. 源码先被编译成字节码
2. JVM 加载字节码
3. 解释器先逐行解释执行
4. 热点代码再交给 JIT 编译成机器码

因此 Java 既有编译型语言特征，也有解释型语言特征。

### AOT 有什么优点？为什么不全部使用 AOT？

AOT（Ahead Of Time Compilation）是提前编译。

与 JIT 相比，它的优势包括：

- 启动更快
- 无需预热
- 内存占用更低
- 更适合云原生、Serverless、CLI 场景

但 AOT 也有明显限制：

- 反射支持受限
- 动态代理支持受限
- 动态类加载支持受限

## 发行版选择（摘录）

### Oracle JDK vs OpenJDK

#### OpenJDK

- 开源
- 是 Java 的参考实现基础

#### Oracle JDK

- 基于 OpenJDK 构建
- Java 11 之后，两者功能差异已大幅缩小

## 对比题（摘录）

### Java 和 C++ 的区别？

常见区别包括：

- Java 不提供裸指针，内存更安全
- Java 的类只能单继承，C++ 支持多继承
- Java 有自动垃圾回收机制
- Java 支持方法重载，但不支持运算符重载

