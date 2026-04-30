# 面试考点对照：8-generic-programming

- 课程页面：../8-generic-programming.html
- 主要目标：把“泛型是什么/解决什么问题/怎么用”讲成可背诵的问答

## 泛型（摘录）

### 什么是泛型？有什么作用？

Java 泛型（Generics）是 JDK 5 引入的重要特性。

它的主要作用：

- 增强代码可读性
- 提升类型安全
- 减少强制类型转换

### 泛型的使用方式有哪几种？

一般有三种：

- 泛型类
- 泛型接口
- 泛型方法

### 泛型类

```java
public class Generic<T> {

    private T key;

    public Generic(T key) {
        this.key = key;
    }

    public T getKey() {
        return key;
    }
}
```

### 泛型接口

```java
public interface Generator<T> {
    public T method();
}
```

### 项目中哪里用到了泛型？

常见场景：

- 通用返回结果：`CommonResult<T>`
- 集合工具方法
- DAO / Service / Repository 抽象层设计

