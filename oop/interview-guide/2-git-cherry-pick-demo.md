# 面试考点对照：2-git-cherry-pick-demo

- 课程页面：../2-git-cherry-pick-demo.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 Git 主题。

## 补充面试题（cherry-pick）

### 1) `cherry-pick` 和 `merge` 的主要差别是什么？

- `merge` 是合并整个分支历史。
- `cherry-pick` 是“按提交粒度”挑选变更，适合精准移植修复。

### 2) cherry-pick 冲突时怎么做？

- 先手动解决冲突并本地验证。
- 然后 `git add` 冲突文件并继续流程（`git cherry-pick --continue`）。
