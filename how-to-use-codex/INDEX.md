# Codex CLI 教程 - 索引

这份文档是 Codex CLI 教程的全部章节索引。

## 概览

- **总文件数**：13 个 HTML（12 章 + 首页）
- **幻灯片总数**：约 405 张
- **公共资源**：references/style.css, references/slide-nav.js, references/slide-toc.js
- **作者**：向正哲
- **版本**：基于 Codex CLI 0.146.0（2026-07-29）

## 章节列表

| 文件 | 章节 | 幻灯片 | 内容 |
|------|------|--------|------|
| [01-install.html](01-install.html) | 安装与首次运行 | 34 | 安装、启动、首次对话、快捷键、GPT-5.6 模型选择、Code Mode、图片输入、IDE集成、退出恢复 |
| [02-agents-md.html](02-agents-md.html) | AGENTS.md | 23 | 文件规范、发现机制、作用域、优先级、/初始化、/memories管理 |
| [03-slash-commands.html](03-slash-commands.html) | Slash Commands | 36 | 高频命令详解、完整30+命令速查表、/new与/clear命名、/import迁移、自定义命令、实战示例 |
| [04-skills.html](04-skills.html) | Skills | 36 | SKILL.md结构、目录发现、16个内置System Skills、skill-creator、渐进式披露 |
| [05-mcp.html](05-mcp.html) | MCP 外部工具 | 31 | .mcp.json、stdio/HTTP transport、CLI管理命令、认证刷新与重连、codex mcp-server反向暴露、安全 |
| [06-plugins.html](06-plugins.html) | Plugins 与迁移 | 27 | Plugin manifest、工作区发布、插件市场、/import迁移、Code Mode远程托管、Web搜索、Bedrock |
| [07-subagents.html](07-subagents.html) | Subagents 多代理 | 37 | spawn/agent_type/fork_context、model切换、并发配置、并行审查实战 |
| [08-hooks.html](08-hooks.html) | Hooks 事件驱动 | 38 | 10种生命周期事件、TOML/JSON双格式、trust模型、5个实战场景 |
| [09-sandbox.html](09-sandbox.html) | 沙箱与权限 | 34 | 三种沙箱模式、三种审批策略、危险命令拦截、代理配置统一、approvals_reviewer、Config Profiles |
| [10-thread-management.html](10-thread-management.html) | 线程管理 | 32 | thread生命周期、fork/resume/compact/archive/pin、分页历史、从历史fork、编辑建分支、SDK完整示例 |
| [11-review.html](11-review.html) | Review 与协作 | 27 | /review命令、四种target type、inline/detached、RPC参数、Subagents联动 |
| [12-cli-scripting.html](12-cli-scripting.html) | CLI 与脚本化 | 36 | codex exec、Python/TypeScript SDK、OSS本地模型、CI/CD集成、mcp-server SDK |

## 学习路径

### 第 1 周：入门
1. 01 安装与首次运行
2. 02 AGENTS.md
3. 03 Skills
4. 04 Slash Commands
5. 05 Plugins 与迁移
6. 06 MCP 外部工具
7. 07 Subagents 多代理

### 第 2 周：安全与自动化
8. 08 Hooks 事件驱动
9. 09 沙箱与权限

### 第 3 周：工程化
10. 10 线程管理
11. 11 Review 与协作
12. 12 CLI 与脚本化

## 与 Claude Code 教程的对照

| Codex CLI | Claude Code | 说明 |
|-----------|------------|------|
| 01 安装与首次运行 | _(新增)_ | CC 无单独安装章 |
| 02 AGENTS.md | 02 Memory (CLAUDE.md) | 文件名不同，机制类似 |
| 03 Skills | 03 Skills | 几乎一致 + System Skills |
| 04 Slash Commands | 01 Slash Commands | 命令集不同 |
| 05 Plugins 与迁移 | _(新增)_ | CC 无独立 Plugins 章；含 /import 跨工具迁移 |
| 06 MCP | 05 MCP | 基本相同 |
| 07 Subagents | 04 Subagents | 更复杂（model切换、reasoning_effort） |
| 08 Hooks | 06 Hooks | 10种事件 vs 更少 |
| 09 沙箱与权限 | _(新增)_ | CC 无独立沙箱章 |
| 10 线程管理 | _(新增)_ | CC 用 Checkpoints 替代 |
| 11 Review | _(新增)_ | CC 无独立 Review 章 |
| 12 CLI 与脚本化 | 10 CLI + 11 Workflow | 合并 + 增加 OSS |

## 本次更新（v0.29+ → 0.146.0）要点

本次更新将教程基线从早期 Rust 重写版（v0.29+）全面升级到 0.146.0，并新增第 05 章。

- **新增第 05 章「Plugins 与生态迁移」**：覆盖 0.146 的 Agent Plugins 体系、/import 跨工具迁移、Code Mode 远程托管、独立 Web 搜索、Bedrock 接入
- **04 Slash Commands**：补充 `/new` / `/clear` 会话命名、`/import` 迁移命令
- **06 MCP**：补充认证变化时刷新、不中断健康连接的重连机制
- **09 沙箱与权限**：补充危险命令检测强化（0.144.5）、代理配置严格化（0.146）
- **10 线程管理**：补充线程固定 pin、分页历史、从历史 fork、编辑早期提示词自动建分支
- **模型名全局更新**：o1 / o3 / o4-mini / gpt-4o → GPT-5.6 系列（gpt-5.6、gpt-5.6-mini，272K 上下文）
- **01 安装**：补充 GPT-5.6 模型选择、Code Mode 远程执行说明

## 设计规范

- 模板：slide-to-slide 翻页 HTML
- CSS：复用 tutorial-writer 内置 style.css
- JS：slide-nav.js（翻页）+ slide-toc.js（目录侧边栏）
- 文风：冷静 + 热情（tutorial-writer skill 规范）
- 语言：zh-CN（简体中文）
- 标题限制：h2/h3 ≤ 8 中文字（适配目录侧边栏）
