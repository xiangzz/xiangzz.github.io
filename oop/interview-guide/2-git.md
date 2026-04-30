# 面试考点对照：2-git

- 课程页面：../2-git.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 Git 主题。

建议把课程知识点整理成可问可答的形式：

- `add/commit/push` 的含义与顺序
- `rebase` 与 `merge` 的差异、冲突处理
- `cherry-pick` 的典型使用场景

## 高频面试题

### 1) `git merge` 和 `git rebase` 的核心区别是什么？

- `merge` 会保留分叉历史，产生一个新的合并提交（在需要时）。
- `rebase` 会把当前分支提交“重放”到新基底上，历史更线性。
- 常见团队规范：公共分支（如 `main`）优先保留真实历史，个人功能分支可在合并前 rebase 整理历史。

### 2) 为什么说不要随意 rebase 已共享分支？

- rebase 会改写提交 ID（历史重写）。
- 若分支已被他人拉取，强推会导致他人本地历史分叉，增加协作成本和冲突风险。

### 3) `cherry-pick` 适合什么场景？

- 把某一个修复提交（例如线上 hotfix）精准移植到另一个分支。
- 不想整段合并分支历史时，`cherry-pick` 比 `merge` 更可控。
- 面试追问：连续挑多个提交时建议按原顺序挑，减少语义错位。

### 4) `git add`、`git commit`、`git push` 分别做了什么？

- `git add`：把工作区改动加入暂存区。
- `git commit`：把暂存区快照写入本地仓库历史。
- `git push`：把本地提交同步到远端仓库。

### 5) rebase 冲突里 “ours/theirs” 为什么经常让人困惑？

- 在 rebase 语境下，冲突双方含义与 merge 的直觉可能不同，因为本质是“逐提交重放”。
- 实战建议：冲突时结合 `git status` 和补丁上下文判断，不要机械套用“保留 ours/theirs”口诀。

## 参考来源

- Git 官方文档（`git rebase`）：<https://git-scm.org/docs/git-rebase>
- Pro Git（Rebasing 章节）：<https://git-scm.com/book/en/v2/Git-Branching-Rebasing>
