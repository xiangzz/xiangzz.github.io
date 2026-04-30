# 面试考点对照：2-git-add-commit

- 课程页面：../2-git-add-commit.html

## 本节对应的面试考点

当前 interview-guide 原始资料未覆盖 Git 主题。

## 补充面试题（add/commit）

### 1) 为什么提交前要先 `git add`？

- 因为 Git 提交的是“暂存区快照”，不是工作区全部改动。
- 这允许你把一次修改拆成多个语义清晰的提交。

### 2) 一条高质量 commit message 应包含什么？

- 做了什么（what）+ 为什么做（why）。
- 常见格式：`type(scope): summary`，正文补充背景与影响范围。
