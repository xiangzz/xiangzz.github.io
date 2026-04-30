# 面试考点对照：5-oop-1-string

- 课程页面：../5-oop-1-string.html
- 主要目标：围绕 `String` 的不可变性、拼接、常量池与 `intern()` 组织面试问答

## String（摘录）

### String、StringBuffer、StringBuilder 的区别？

#### 可变性

- `String` 不可变
- `StringBuilder`、`StringBuffer` 可变

#### 线程安全性

- `String` 不可变，因此天然线程安全
- `StringBuffer` 对方法或内部调用加了同步锁，是线程安全的
- `StringBuilder` 没有加锁，因此不是线程安全的

#### 性能

- 少量字符串操作：`String`
- 单线程下大量拼接：`StringBuilder`
- 多线程下大量拼接：`StringBuffer`

### String 为什么是不可变的？

关键原因：

1. 保存字符串内容的数组是私有的，并且没有对外暴露可修改入口
2. `String` 类本身是 `final` 的，无法通过继承破坏其不可变性

### 字符串拼接用 + 还是 StringBuilder？

普通情况下：

- 字符串使用 `+` 拼接，编译器通常会优化成 `StringBuilder.append()`

但是在循环中：

- `+` 会反复创建临时对象
- 性能明显不如手动使用 `StringBuilder`

### 字符串常量池的作用了解吗？

字符串常量池的核心目标：

- 避免重复创建相同内容的字符串对象

### String s1 = new String("abc"); 这句话创建了几个对象？

答案：1 个或 2 个（取决于常量池里当时是否已存在 `"abc"`）。

### String#intern 方法有什么作用？

`intern()` 的作用是确保字符串在常量池中的唯一性：

- 常量池已有：返回池中引用
- 常量池没有：把当前字符串加入常量池并返回其引用

