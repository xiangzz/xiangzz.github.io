# 面试考点对照：2-git-rebase-demo

- 课程页面：../2-git-rebase-demo.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 Git 主题。

## 补充面试题（rebase）

### 1) `rebase` 的本质是什么？

- 把当前分支提交按顺序“重放”到新的基底提交上，形成线性历史。

### 2) 什么时候适合 `interactive rebase`？

- 合并前整理提交历史：压缩碎片提交、改写提交信息、调整提交顺序。
- 注意：不要改写已经共享给团队的公共历史。
