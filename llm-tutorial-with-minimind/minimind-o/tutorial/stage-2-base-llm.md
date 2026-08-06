# 阶段二：理解基础语言模型（Thinker 的骨架）

> 目标文件：`model/model_minimind.py`（约 288 行）
> 这是最重要的基础文件，值得花最多时间反复阅读。

---

## 2.1 总览：MiniMind LLM 的架构

MiniMind 是一个标准的 GPT 风格 Transformer，采用现代 LLM 的最佳实践：

```mermaid
graph TD
    subgraph "MiniMindForCausalLM（完整语言模型）"
        A["input_ids<br>(B, T) 整数序列"] --> B["Embedding<br>6400×768"]
        B --> C["Dropout"]
        C --> D["8 × MiniMindBlock"]
        D --> E["RMSNorm"]
        E --> F["lm_head<br>768→6400"]
        F --> G["logits<br>(B, T, 6400)"]

        H["labels<br>真实 token IDs"] --> I["CrossEntropyLoss"]
        G --> I
        I --> J["loss 标量"]
    end

    style D fill:#e3f2fd,stroke:#1565c0,stroke-width:3px
```

### 模型配置参数速查

```mermaid
graph LR
    subgraph "模型维度"
        A["hidden_size = 768"]
        B["head_dim = 96"]
        C["intermediate_size = 2432"]
    end
    subgraph "结构参数"
        D["num_hidden_layers = 8"]
        E["num_attention_heads = 8 (Q)"]
        F["num_key_value_heads = 4 (K/V)"]
    end
    subgraph "其他"
        G["vocab_size = 6400"]
        H["rope_theta = 1e6"]
        I["max_seq_len = 32768"]
    end

    A -->|"768 / 8 = 96"| B
    A -->|"ceil(768×π/64)×64 = 38×64 = 2432"| C
    A -->|"768 / 96 = 8"| E
    E -->|"8 / 2 = 4"| F
```

---

## 2.2 RMSNorm（根均方归一化）

**位置**：`model_minimind.py` 第 50-60 行

```mermaid
graph LR
    subgraph "LayerNorm（传统）"
        A1["x"] --> B1["减去均值"]
        B1 --> C1["除以标准差"]
        C1 --> D1["乘以 weight"]
        D1 --> E1["加上 bias"]
    end

    subgraph "RMSNorm（本项目）"
        A2["x"] --> B2["除以 RMS"]
        B2 --> C2["乘以 weight"]
    end

    style A2 fill:#e8f5e9
    style C2 fill:#e8f5e9
```

**公式对比**：
```
LayerNorm:  output = (x - mean(x)) / sqrt(var(x) + eps) * weight + bias
RMSNorm:    output = x / sqrt(mean(x²) + eps) * weight
```

**为什么用 RMSNorm？** 更简单、更快，效果与 LayerNorm 相当。省去了均值计算和偏置项。

```python
# 本项目实现
class RMSNorm(torch.nn.Module):
    def __init__(self, dim, eps=1e-5):
        self.weight = nn.Parameter(torch.ones(dim))  # 可学习参数

    def norm(self, x):
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)

    def forward(self, x):
        return (self.weight * self.norm(x.float())).type_as(x)
```

---

## 2.3 RoPE（旋转位置嵌入）

**位置**：`model_minimind.py` 第 62-84 行

### 为什么需要位置编码？

Transformer 的注意力机制本身是"位置无关"的——它不知道词的顺序。位置编码告诉模型"这个词在第几个位置"。

```mermaid
graph LR
    A["'我' 在位置 0"] --> D["带有位置信息的向量"]
    B["'爱' 在位置 1"] --> D
    C["'你' 在位置 2"] --> D

    D --> E["模型能区分<br>'我爱你' vs '你爱我'"]
```

### RoPE 的核心思想

RoPE 通过**旋转** Q 和 K 的向量来编码位置信息：

```mermaid
graph TD
    subgraph "直觉理解"
        A["想象一个二维平面"]
        B["每个位置对应一个旋转角度"]
        C["位置 0 → 旋转 0°"]
        D["位置 1 → 旋转 θ°"]
        E["位置 2 → 旋转 2θ°"]
        F["位置 n → 旋转 nθ°"]
    end

    A --> B --> C & D & E & F

    subgraph "关键性质"
        G["两个位置的内积<br>= 只与相对距离有关"]
        H["位置 m 和位置 n 的关系<br>只取决于 m-n"]
    end

    F --> G
```

### 代码解读

```mermaid
graph TD
    A["precompute_freqs_cis()"] --> B["预计算 cos 和 sin 表"]
    B --> C["shape: (max_seq_len, head_dim)"]

    D["apply_rotary_pos_emb()"] --> E["对 Q 和 K 应用旋转"]
    E --> F["q_new = q * cos + rotate_half(q) * sin"]
    E --> G["k_new = k * cos + rotate_half(k) * sin"]

    H["rotate_half()"] --> I["把向量切成两半互换<br>[a,b,c,d] → [-c,-d,a,b]"]

    style A fill:#e3f2fd
    style D fill:#e3f2fd
```

```python
# 简化的 RoPE 应用过程
def apply_rotary_pos_emb(q, k, cos, sin):
    def rotate_half(x):
        # [1, 2, 3, 4] → [-3, -4, 1, 2]
        half = x.shape[-1] // 2
        return torch.cat((-x[..., half:], x[..., :half]), dim=-1)

    q_new = q * cos + rotate_half(q) * sin
    k_new = k * cos + rotate_half(k) * sin
    return q_new, k_new
```

### YaRN 扩展（可选了解）

本项目支持 YaRN 位置缩放，允许模型处理比训练时更长的序列：

```mermaid
graph LR
    A["训练时最大 2048"] --> B["YaRN 缩放"]
    B --> C["推理时可扩展到 32768"]
    B --> D["通过调整频率实现"]
```

---

## 2.4 Attention（注意力机制）★★★ 最核心

**位置**：`model_minimind.py` 第 91-134 行

### 注意力机制的直觉

想象你在读一句话："小明喜欢打篮球，他经常在**周末**和朋友们一起去球场。"

当你读到"他"时，你的大脑会自动"注意"到"小明"——这就是注意力的本质：**根据当前内容，找到最相关的其他内容**。

### 注意力计算流程

```mermaid
graph TD
    A["输入 x<br>(B, T, 768)"] --> B["Q = q_norm(x @ Wq)<br>(B, T, 8, 96)"]
    A --> C["K = k_norm(x @ Wk)<br>(B, T, 4, 96)"]
    A --> D["V = x @ Wv<br>(B, T, 4, 96)"]

    C --> E["repeat_kv(K, 2)<br>(B, T, 8, 96)"]
    D --> F["repeat_kv(V, 2)<br>(B, T, 8, 96)"]

    B --> G["apply_rotary_pos_emb(Q, K)"]
    E --> G

    G --> H["scores = Q @ K^T / √96<br>(B, 8, T, T)"]
    H --> I["因果掩码（下三角）"]
    I --> J["softmax(scores)<br>→ 注意力权重"]
    F --> K["output = weights @ V<br>(B, 8, T, 96)"]
    J --> K
    K --> L["reshape → o_proj<br>(B, T, 768)"]

    style H fill:#fff3e0
    style J fill:#e8f5e9
```

### 什么是 GQA（分组查询注意力）？

```mermaid
graph TD
    subgraph "标准多头注意力 (MHA)"
        A1["8 个 Q 头"]
        A2["8 个 K 头"]
        A3["8 个 V 头"]
        A1 --- A2 --- A3
        note["每对 Q-KV 一一对应<br>KV Cache 大"]
    end

    subgraph "分组查询注意力 (GQA) ← 本项目"
        B1["8 个 Q 头"]
        B2["4 个 K 头"]
        B3["4 个 V 头"]
        B1 -->|"每 2 个 Q 头共享 1 个 KV"| B2
        B2 --- B3
        note2["KV Cache 减半<br>推理更快"]
    end

    subgraph "多查询注意力 (MQA)"
        C1["8 个 Q 头"]
        C2["1 个 K 头"]
        C3["1 个 V 头"]
        C1 -->|"所有 Q 共享 1 个 KV"| C2
        C2 --- C3
    end

    style B1 fill:#e8f5e9
    style B2 fill:#e8f5e9
    style B3 fill:#e8f5e9
```

### repeat_kv 的作用

```mermaid
graph LR
    subgraph "原始 K (4 个头)"
        A["K0"]
        B["K1"]
        C["K2"]
        D["K3"]
    end

    subgraph "repeat 后 (8 个头)"
        E["K0"]
        F["K0←复制"]
        G["K1"]
        H["K1←复制"]
        I["K2"]
        J["K2←复制"]
        K["K3"]
        L["K3←复制"]
    end

    A --> E & F
    B --> G & H
    C --> I & J
    D --> K & L
```

### 因果掩码（Causal Mask）

确保每个位置只能看到它之前的内容（自回归性质）：

```mermaid
graph TD
    subgraph "因果掩码矩阵（4×4 示例）"
        direction LR
        M["位置→  0  1  2  3<br>位置0 [ ✓  ✗  ✗  ✗ ]<br>位置1 [ ✓  ✓  ✗  ✗ ]<br>位置2 [ ✓  ✓  ✓  ✗ ]<br>位置3 [ ✓  ✓  ✓  ✓ ]<br><br>✓ = 可以看到<br>✗ = 不能看到（-inf）"]
    end

    N["确保生成是自左向右的<br>不会"偷看"未来的 token"]

    M --> N
```

### KV Cache

推理时避免重复计算已处理过的 K 和 V：

```mermaid
sequenceDiagram
    participant Input as 输入序列
    participant Cache as KV Cache
    participant Attn as 注意力计算

    Note over Input: 第1步: 处理 [A, B, C]
    Input->>Attn: [A, B, C]
    Attn->>Cache: 保存 K₁, V₁

    Note over Input: 第2步: 只处理新 token [D]
    Input->>Attn: [D]
    Cache->>Attn: 提供 K₁, V₁
    Attn->>Cache: 追加 K_D, V_D

    Note over Input: 第3步: 只处理新 token [E]
    Input->>Attn: [E]
    Cache->>Attn: 提供 K₁, K_D, V₁, V_D
```

---

## 2.5 FeedForward（前馈网络）与 SwiGLU

**位置**：`model_minimind.py` 第 136-146 行

```mermaid
graph LR
    A["输入 x<br>(B, T, 768)"] --> B["gate_proj(x)<br>(B, T, 2432)"]
    A --> C["up_proj(x)<br>(B, T, 2432)"]
    B --> D["SiLU(gate)"]
    D --> E["逐元素相乘 ⊙"]
    C --> E
    E --> F["down_proj<br>(B, T, 768)"]
    F --> G["输出<br>(B, T, 768)"]

    style D fill:#fff3e0
    style E fill:#e8f5e9
```

**SwiGLU = Swish Gated Linear Unit**：
```
output = down_proj(SiLU(gate_proj(x)) ⊙ up_proj(x))
```

- `gate_proj`：产生"门控"信号，决定哪些信息通过
- `up_proj`：产生"内容"信号
- `SiLU` 激活函数：`silu(x) = x * sigmoid(x)`
- `⊙`：逐元素乘法（门控机制）
- `down_proj`：将维度从 2432 映射回 768

---

## 2.6 MOEFeedForward（混合专家）

**位置**：`model_minimind.py` 第 148-176 行

```mermaid
graph TD
    A["输入 x<br>(B, T, 768)"] --> B["Router 线性层<br>(768 → 4)"]
    B --> C["Softmax → 概率"]
    C --> D["Top-1 选择<br>选概率最高的 1 个专家"]

    A --> E["Expert 0: FFN"]
    A --> F["Expert 1: FFN"]
    A --> G["Expert 2: FFN"]
    A --> H["Expert 3: FFN"]

    D -->|"token A 选 Expert 1"| F
    D -->|"token B 选 Expert 3"| H

    E --> I["加权求和"]
    F --> I
    G --> I
    H --> I

    I --> J["输出<br>(B, T, 768)"]

    style B fill:#fff3e0
    style D fill:#f3e5f5
```

**核心思想**：不同的 token 可能需要不同的处理方式。MoE 让每个 token 选择最合适的"专家"。

```mermaid
graph LR
    subgraph "Dense 模型"
        A["每个 token 经过同一个 FFN<br>参数少，但全部激活"]
    end
    subgraph "MoE 模型"
        B["每个 token 只经过 1 个专家<br>总参数多，但激活参数少<br>计算量不变"]
    end

    A --> C["63.91M 参数<br>全部激活"]
    B --> D["198.42M 总参数<br>115.00M 活跃参数"]
```

---

## 2.7 MiniMindBlock（Transformer 块）

**位置**：`model_minimind.py` 第 178-194 行

```mermaid
graph TD
    A["输入 hidden_states<br>(B, T, 768)"] --> B["保存残差 residual = x"]
    B --> C["RMSNorm (input_layernorm)"]
    C --> D["Attention"]
    D --> E["+ 残差连接"]
    A --> E
    E --> F["保存残差 residual = x"]
    F --> G["RMSNorm (post_attention_layernorm)"]
    G --> H["FeedForward / MOEFeedForward"]
    H --> I["+ 残差连接"]
    F --> I
    I --> J["输出<br>(B, T, 768)"]

    style B fill:#e8f5e9
    style E fill:#e8f5e9
    style F fill:#e8f5e9
    style I fill:#e8f5e9
```

**Pre-Norm 风格**：归一化在子层（Attention/FFN）之前，而不是之后。这是现代 LLM 的标准做法。

**残差连接的作用**：让梯度可以"跳过"子层直接传播，防止梯度消失。想象一条高速公路，信息可以走下面的"主路"（子层），也可以直接走上面的"高架桥"（残差连接）。

---

## 2.8 MiniMindModel（Transformer 堆叠）

**位置**：`model_minimind.py` 第 196-232 行

```mermaid
graph TD
    A["input_ids<br>(B, T)"] --> B["Embedding<br>6400 × 768"]
    B --> C["Dropout"]
    C --> D["+ RoPE 位置编码"]

    D --> E["Block 0"]
    E --> F["Block 1"]
    F --> G["Block 2"]
    G --> H["..."]
    H --> I["Block 7"]

    I --> J["RMSNorm"]
    J --> K["hidden_states<br>(B, T, 768)"]

    L["freqs_cos, freqs_sin<br>(预计算)"] --> D

    style E fill:#e3f2fd
    style F fill:#e3f2fd
    style G fill:#e3f2fd
    style I fill:#e3f2fd
```

---

## 2.9 MiniMindForCausalLM（因果语言模型）

**位置**：`model_minimind.py` 第 234-288 行

### forward() 前向传播

```mermaid
graph TD
    A["input_ids (B, T)"] --> B["MiniMindModel.forward()"]
    B --> C["hidden_states (B, T, 768)"]
    C --> D["lm_head: Linear 768→6400"]
    D --> E["logits (B, T, 6400)"]

    F["labels (B, T)"] --> G["CrossEntropyLoss"]
    E --> G
    G --> H["loss (标量)"]

    style E fill:#fff3e0
    style H fill:#ffcdd2
```

**权重共享（Tied Weights）**：
```python
self.model.embed_tokens.weight = self.lm_head.weight
# Embedding 的权重和 lm_head 的权重是同一份
# 6400×768 的矩阵，省了一半参数
```

### generate() 自回归生成

```mermaid
sequenceDiagram
    participant P as Prompt
    participant M as Model
    participant O as Output

    P->>M: [你, 好, 吗]
    M-->>O: logits → 采样 → "我"
    Note over O: 当前输出: [你, 好, 吗, 我]

    O->>M: [吗, 我] (只有新token，用KV Cache)
    M-->>O: logits → 采样 → "很"
    Note over O: 当前输出: [你, 好, 吗, 我, 很]

    O->>M: [我, 很]
    M-->>O: logits → 采样 → "好"
    Note over O: 当前输出: [你, 好, 吗, 我, 很, 好]

    O->>M: [很, 好]
    M-->>O: logits → 采样 → <EOS>
    Note over O: 结束！最终: "我很好"
```

### 采样策略

```mermaid
graph TD
    A["logits / temperature"] --> B{"top_k > 0?"}
    B -->|是| C["只保留概率最高的 k 个"]
    C --> D{"top_p < 1?"}
    B -->|否| D
    D -->|是| E["只保留累积概率达到 p 的 token"]
    D -->|否| F["softmax → 概率分布"]
    E --> F
    F --> G["multinomial 随机采样"]
    G --> H["选出一个 token"]

    style A fill:#e3f2fd
    style H fill:#e8f5e9
```

- **temperature**：越大越随机（有创意），越小越确定（保守）
- **top_k**：只在概率最高的 k 个中选（如 k=50）
- **top_p**：只在累积概率达到 p 的候选中选（如 p=0.85）
- **repetition_penalty**：降低已出现 token 的概率，避免重复

---

## 2.10 完整参数流

```mermaid
graph TD
    subgraph "可学习参数"
        P1["Embedding: 6400 × 768 = 4.9M"]
        P2["Attention per layer: ~1.8M"]
        P3["FFN per layer: ~5.6M"]
        P4["lm_head: 与 Embedding 共享 = 0"]
    end

    subgraph "每层参数明细"
        Q["q_proj: 768×768 = 0.59M"]
        K["k_proj: 768×384 = 0.30M"]
        V["v_proj: 768×384 = 0.30M"]
        O["o_proj: 768×768 = 0.59M"]
        QN["q_norm: 96"]
        KN["k_norm: 96"]
        FFN1["gate_proj: 768×2432 = 1.87M"]
        FFN2["up_proj: 768×2432 = 1.87M"]
        FFN3["down_proj: 2432×768 = 1.87M"]
    end

    P2 --> Q & K & V & O & QN & KN
    P3 --> FFN1 & FFN2 & FFN3

    subgraph "总参数量"
        TOTAL["8 layers × ~7.4M/layer + 4.9M embedding + 0.8M 归一化 ≈ 63.9M"]
    end

    P1 --> TOTAL
    P2 --> TOTAL
    P3 --> TOTAL
```

---

## 学习检查清单

- [ ] 你能画出 RMSNorm 和 LayerNorm 的区别吗？
- [ ] RoPE 是如何编码位置信息的？（旋转向量）
- [ ] GQA 中 `repeat_kv` 做了什么？为什么要这样做？
- [ ] 因果掩码为什么是下三角的？
- [ ] SwiGLU 中 gate 和 up 的作用分别是什么？
- [ ] MoE 的 Router 是如何选择专家的？
- [ ] 残差连接为什么能帮助训练？
- [ ] `generate()` 中 KV Cache 是如何加速推理的？

> 完成后进入阶段三，看看这些组件如何组成全模态模型！
