# 面试考点对照：7-maven

- 课程页面：../7-maven.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 Maven 主题。

建议把课程知识点整理成可问可答的形式：

- `groupId/artifactId/version` 的含义
- 依赖传递与版本冲突（nearest-wins/依赖管理）
- 常用生命周期：`compile/test/package/install`

## 高频面试题

### 1) `groupId`、`artifactId`、`version` 分别表示什么？

- `groupId`：组织或项目域（通常反向域名）。
- `artifactId`：模块名/产物名。
- `version`：版本号（发布版本或快照版本）。
- 三者共同确定一个 Maven 坐标。

### 2) Maven 依赖冲突如何决策版本？

- 默认采用依赖调解（dependency mediation）的“nearest definition”规则。
- 如果同深度冲突，通常以声明顺序等规则继续决策。
- 工程实践中建议在 `dependencyManagement` 明确锁版本，避免隐式漂移。

### 3) `dependencyManagement` 和 `dependencies` 有什么区别？

- `dependencies`：真正引入依赖参与编译/运行。
- `dependencyManagement`：只做“版本和策略管理”，本模块不自动引入。

### 4) 常见生命周期里 `compile/test/package/install` 分别做什么？

- `compile`：编译主代码。
- `test`：运行单元测试（不含部署）。
- `package`：打包成 JAR/WAR 等分发产物。
- `install`：把产物安装到本地仓库，供本机其他项目依赖。

### 5) 你如何排查依赖冲突导致的 `NoSuchMethodError`？

- 先看异常类与方法签名，定位期望版本。
- 使用 `mvn dependency:tree` 找到冲突路径。
- 通过显式声明版本或排除传递依赖（`exclusions`）修复。

## 参考来源

- Maven 生命周期官方文档：<https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html>
- Maven 依赖机制官方文档：<https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism>
