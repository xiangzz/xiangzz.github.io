# GitHub 使用教程 - 索引

这份文档是 GitHub 使用教程的全部章节索引。

## 概览

- **总文件数**：13 个 HTML（12 章 + 首页）
- **幻灯片总数**：约 262 张
- **公共资源**：references/style.css, references/slide-nav.js, references/slide-toc.js
- **作者**：向正哲
- **受众**：已掌握基本 Git 操作、希望系统学习 GitHub 平台能力的学生

## 设计基调

- **重心**：偏 GitHub 平台（远程仓库、PR、Issues、Actions、Pages、API），Git 本地基本功快速带过不重复
- **账号范围**：仅免费个人账号，不涉及付费/企业特性
- **教学双线**：命令行 + GitHub 网页，不依赖特定 IDE
- **核心主线**：如何合作（04-06）+ 如何自动化（07-09）

## 章节列表

| 文件 | 章节 | 幻灯片 | 内容 |
|------|------|--------|------|
| [01-install-push.html](01-install-push.html) | Git 速通与首次推送 | 30 | 本地 Git 极简回顾、心智模型、建远程仓库、SSH/PAT 认证、首次 push、排错 |
| [02-remote-daily.html](02-remote-daily.html) | 远程仓库日常 | 20 | clone、pull vs fetch、remote 管理、git stash、网页看历史、.gitignore、README 结构 |
| [03-pull-request.html](03-pull-request.html) | Pull Request 全流程 | 34 | feature branch、开 PR、PR 界面、code review、三种合并策略、冲突处理 |
| [04-issues-projects.html](04-issues-projects.html) | Issues 与 Projects | 22 | issue 生命周期、label/milestone、closes #N 联动、Projects 看板与多视图、Discussions |
| [05-team-workflow.html](05-team-workflow.html) | 团队工作流 | 30 | 分支保护、CODEOWNERS、PR/issue 模板、Git Flow vs Trunk Based、review 礼仪 |
| [06-open-source.html](06-open-source.html) | 开源贡献 | 28 | fork 模型、upstream 同步、CONTRIBUTING、good first issue、upstream PR 实战 |
| [07-actions.html](07-actions.html) | GitHub Actions | 38 | workflow yaml、触发器、job/step/runner、matrix、cache/artifact、secrets、实战 |
| [08-pages.html](08-pages.html) | GitHub Pages | 30 | 分支部署 vs Actions 部署、自定义域名、主题、作品集个人主页实战 |
| [09-cli.html](09-cli.html) | GitHub CLI | 24 | gh 认证、repo/pr/issue 操作、脚本化、alias、gh release、Conventional Commits、触发 Actions |
| [10-security.html](10-security.html) | 安全实践 | 30 | SSH/PAT/2FA、分支保护、secret scanning、push protection、Dependabot、审计日志 |
| [11-api.html](11-api.html) | GitHub API 与集成 | 34 | REST vs GraphQL、token scope、OAuth App vs GitHub App、octokit、webhook |
| [12-ai-cloud.html](12-ai-cloud.html) | GitHub AI 与云端 | 21 | Copilot 获取与用法、Codespaces 云端开发、devcontainer、Gist 分享片段 |

## 学习路径

### 第 1 周：接入 GitHub
1. 01 Git 速通与首次推送
2. 02 远程仓库日常
3. 03 Pull Request 全流程

### 第 2 周：学会合作
4. 04 Issues 与 Projects
5. 05 团队工作流
6. 06 开源贡献

### 第 3 周：学会自动化
7. 07 GitHub Actions
8. 08 GitHub Pages
9. 09 GitHub CLI

### 第 4 周：安全与扩展
10. 10 安全实践
11. 11 GitHub API 与集成
12. 12 GitHub AI 与云端

## 与 Codex CLI 教程的对照

| GitHub 教程 | Codex CLI 教程 | 说明 |
|-------------|----------------|------|
| 01 Git 速通与首次推送 | 01 安装与首次运行 | 都是从零到第一次可用 |
| 02 远程仓库日常 | 02 AGENTS.md | 日常核心操作对象 |
| 03 Pull Request 全流程 | _(无对应)_ | GitHub 协作的核心载体 |
| 04 Issues 与 Projects | _(无对应)_ | GitHub 任务跟踪 |
| 05 团队工作流 | _(无对应)_ | GitHub 协作规范 |
| 06 开源贡献 | _(无对应)_ | GitHub 开源生态 |
| 07 GitHub Actions | _(无对应)_ | GitHub CI/CD 自动化 |
| 08 GitHub Pages | _(无对应)_ | GitHub 静态站托管 |
| 09 GitHub CLI | 12 CLI 与脚本化 | 命令行脚本化能力 |
| 10 安全实践 | 09 沙箱与权限 | 安全边界与防护 |
| 11 GitHub API 与集成 | 05 MCP 外部工具 | 外部系统集成 |
| 12 GitHub AI 与云端 | _(无对应)_ | Copilot / Codespaces / Gist |

## 设计规范

- 模板：slide-to-slide 翻页 HTML
- CSS：复用 tutorial-writer 内置 style.css（独立副本）
- JS：slide-nav.js（翻页）+ slide-toc.js（目录侧边栏）
- 文风：冷静 + 热情（tutorial-writer skill 规范）
- 语言：zh-CN（简体中文）
- 标题限制：h2/h3 ≤ 8 中文字（适配目录侧边栏）
- 深度边界：仅免费个人账号，不依赖 IDE，不重复 Git 本地基本功
