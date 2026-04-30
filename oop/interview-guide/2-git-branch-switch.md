# 面试考点对照：2-git-branch-switch

- 课程页面：../2-git-branch-switch.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 Git 主题。

## 补充面试题（分支切换）

### 1) 切分支前为什么建议先保证工作区干净？

- 未提交改动在切换时可能引发冲突或被覆盖风险。
- 常用做法：先提交、或 `git stash` 暂存后再切换。

### 2) `switch` 和 `checkout` 如何选择？

- 新命令里 `git switch` 更聚焦“分支切换”，语义更清晰。
- `checkout` 兼顾分支与文件恢复，功能更杂，误操作概率更高。
