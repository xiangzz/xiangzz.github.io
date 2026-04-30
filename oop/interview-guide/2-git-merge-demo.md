# 面试考点对照：2-git-merge-demo

- 课程页面：../2-git-merge-demo.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 Git 主题。

## 补充面试题（merge）

### 1) 快进合并（fast-forward）和三方合并有什么区别？

- 快进合并：目标分支指针直接前移，不产生新 merge commit。
- 三方合并：存在分叉历史时生成新的合并提交。

### 2) 如何减少 merge 冲突？

- 小步提交、尽早同步主干分支。
- 对高冲突文件建立明确的修改边界与代码所有权。
