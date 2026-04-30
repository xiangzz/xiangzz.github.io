# 面试考点对照：0-preliminary

- 课程页面：../0-preliminary.html
- 主要目标：把“Java 是什么、怎么跑起来、平台体系怎么理解”说清楚

## 基础概念与常识

### Java 语言有哪些特点？

Java 的常见特点包括：

- 简单易学
- 面向对象
- 平台无关性
- 支持多线程
- 可靠性
- 安全性
- 支持网络编程且比较方便
- 编译与解释并存

一个很重要的延伸理解是：

- “一次编写，到处运行”很经典
- 但跨平台已经不是今天 Java 最大的卖点
- Java 更强的竞争力，其实更多来自强大的生态系统

### JVM vs JDK vs JRE

#### JVM

JVM（Java Virtual Machine）是运行 Java 字节码的虚拟机。

特点：

- 不同平台有不同 JVM 实现
- 但同样的字节码在不同平台的 JVM 上应得到相同结果
- 这正是 Java “一次编译，到处运行”的关键

#### JRE

JRE（Java Runtime Environment）是 Java 运行环境，主要包含：

- JVM
- Java 基础类库

#### JDK

JDK（Java Development Kit）是完整的 Java 开发工具包。

它包含：

- JRE
- `javac`
- `javadoc`
- `jdb`
- `jconsole`
- `javap`

简单来说：

- JRE 负责运行
- JDK 负责开发 + 运行

