# 面试考点对照：14-junit

- 课程页面：../14-junit.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 JUnit/单元测试主题。

## 补充高频面试题（JUnit 5，已核对）

### 1) JUnit 5 和 JUnit 4 的核心差异是什么？

- JUnit 5 由 `Platform + Jupiter + Vintage` 组成，模块化更清晰。
- 日常写测试主要用 Jupiter（`org.junit.jupiter`）。
- 对参数化测试、扩展模型、动态测试支持更完整。

### 2) `@BeforeEach` / `@AfterEach` / `@BeforeAll` / `@AfterAll` 的执行语义？

- `@BeforeEach`、`@AfterEach`：每个测试方法前后执行。
- `@BeforeAll`、`@AfterAll`：当前测试类整体前后各执行一次。
- 默认测试实例生命周期下，`@BeforeAll` 常需 `static` 方法（可通过生命周期配置调整）。

### 3) 为什么推荐使用断言 API，而不是 `System.out.println`？

- 断言可自动判定通过/失败并输出差异信息，适合 CI 自动化。
- 推荐优先使用 `Assertions` 中的 `assertEquals`、`assertThrows`、`assertAll` 等。

### 4) 参数化测试 `@ParameterizedTest` 的价值是什么？

- 用一份测试逻辑覆盖多组输入，减少重复代码。
- 典型场景：边界值、异常值、等价类输入验证。

### 5) 单元测试和集成测试的边界如何回答？

- 单元测试关注单个类/函数的业务行为，依赖通常隔离（mock/stub）。
- 集成测试关注模块协作与外部系统交互（数据库、消息队列、HTTP）。
- 面试回答重点：分层测试策略，而非“只写一种测试”。

## 参考来源

- JUnit 5 User Guide：<https://junit.org/junit5/docs/current/user-guide/>
