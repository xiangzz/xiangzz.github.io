# 面试考点对照：9-collections

- 课程页面：../9-collections.html

## 本节对应的面试考点

当前 interview-guide 原始资料没有系统覆盖集合框架。

可先复习 [5-oop-5-features.md](./5-oop-5-features.md) 中关于 `equals()/hashCode()` 的内容，因为它是 `HashMap/HashSet` 常见考点的前置条件。

## 补充高频面试题（集合框架总览）

### 1) 集合框架的核心接口有哪些？如何选择？

- `List`：有序、可重复，按下标访问。
- `Set`：不重复，强调“去重语义”。
- `Map`：键值对，按 key 查找 value。

面试追问：你会先按“是否需要 key”“是否允许重复”“是否关注顺序/排序”来选接口，再落到具体实现。

### 2) `Collection` 和 `Collections` 的区别是什么？

- `Collection` 是集合体系的根接口之一。
- `Collections` 是工具类，提供排序、不可变包装、同步包装等静态方法。

### 3) 为什么 `equals()` / `hashCode()` 在哈希类集合里特别关键？

- 哈希类结构通常先用哈希值定位桶/候选范围，再用相等性做精确判定。
- 典型坑：只重写 `equals()` 不重写 `hashCode()`，可能导致“逻辑相等但查不到/去不掉重”的问题。

### 4) 迭代集合时为什么会出现 `ConcurrentModificationException`？

- 常见触发：遍历时直接增删集合结构（结构性修改）。
- 面试回答要点：区分“并发线程修改”与“同线程遍历中修改”，并说明安全修改的做法（如使用迭代器提供的删除能力或使用并发容器）。

## 参考来源

- Java 集合框架概览（Oracle Tutorial）：<https://docs.oracle.com/javase/tutorial/collections/intro/index.html>
