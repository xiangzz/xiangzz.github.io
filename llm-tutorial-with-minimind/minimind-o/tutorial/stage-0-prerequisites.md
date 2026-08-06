# 阶段零：前置知识准备

> 在阅读 MiniMind-O 代码之前，你需要掌握以下基础。每个知识点都标注了本项目中的对应位置，方便你学完后回来验证。

---

## 0.1 Python 编程基础

### 类与继承

本项目大量使用了类的继承。核心继承链如下：

```mermaid
classDiagram
    class PretrainedConfig {
        +model_type: str
    }
    class MiniMindConfig {
        +hidden_size: int
        +num_hidden_layers: int
        +use_moe: bool
        +vocab_size: int
    }
    class OmniConfig {
        +num_talker_hidden_layers: int
        +audio_vocab_size: int
        +image_token_len: int
        +bridge_layer: int
    }

    PretrainedConfig <|-- MiniMindConfig : 继承
    MiniMindConfig <|-- OmniConfig : 继承

    note for MiniMindConfig "model/model_minimind.py"
    note for OmniConfig "model/model_omni.py"
```

```mermaid
classDiagram
    class PreTrainedModel {
        +save_pretrained()
        +from_pretrained()
    }
    class GenerationMixin {
        +generate()
    }
    class MiniMindForCausalLM {
        +forward()
        +generate()
        +model: MiniMindModel
        +lm_head: Linear
    }
    class MiniMindOmni {
        +thinker: MiniMindModel
        +talker: TalkerModule
        +audio_proj: MMAudioProjector
        +vision_proj: MMVisionProjector
        +stream_generate()
    }

    PreTrainedModel <|-- MiniMindForCausalLM : 继承
    GenerationMixin <|.. MiniMindForCausalLM : 混入
    MiniMindForCausalLM <|-- MiniMindOmni : 继承
```

**关键概念**：
- `super().__init__()` — 调用父类的初始化方法
- `MiniMindOmni` 继承了 `MiniMindForCausalLM`，自动拥有 `forward()` 和 `generate()` 方法
- `OmniConfig` 继承了 `MiniMindConfig`，自动拥有 `hidden_size` 等属性

### 生成器 `yield`

本项目使用 `yield` 实现流式生成（逐 token 输出），这是推理的核心机制：

```python
# 简化的示例（类似 stream_generate 的逻辑）
def simple_generate():
    tokens = ["你", "好", "，", "世", "界"]
    for token in tokens:
        yield token  # 每次返回一个，不退出函数

# 调用方式
for token in simple_generate():
    print(token, end="")  # 逐字打印：你好，世界
```

```mermaid
sequenceDiagram
    participant Caller as 调用者（eval_omni.py）
    participant Gen as stream_generate()

    Caller->>Gen: 启动生成
    Gen-->>Caller: yield (token_1, audio_frame_1)
    Note over Caller: 打印"你"
    Caller->>Gen: next()
    Gen-->>Caller: yield (token_2, audio_frame_2)
    Note over Caller: 打印"好"
    Caller->>Gen: next()
    Gen-->>Caller: yield (token_3, None)
    Note over Caller: 打印"，"
    Caller->>Gen: 继续请求...
    Gen-->>Caller: return（结束）
```

**本项目位置**：`model/model_omni.py:stream_generate()` 第 326-395 行

### 上下文管理器 `with`

用于资源管理，在本项目中常见于：

```python
# 禁用梯度计算（推理时节省内存）
with torch.no_grad():
    output = model(input_ids)

# 混合精度训练
with torch.cuda.amp.autocast(dtype=torch.bfloat16):
    output = model(input_ids)
    loss = compute_loss(output)
```

---

## 0.2 深度学习核心概念

### 什么是神经网络？

```mermaid
graph LR
    subgraph 输入层
        I1[x₁]
        I2[x₂]
        I3[x₃]
    end
    subgraph 隐藏层
        H1((h₁))
        H2((h₂))
        H3((h₃))
        H4((h₄))
    end
    subgraph 输出层
        O1[y]
    end

    I1 --> H1 & H2 & H3 & H4
    I2 --> H1 & H2 & H3 & H4
    I3 --> H1 & H2 & H3 & H4
    H1 --> O1
    H2 --> O1
    H3 --> O1
    H4 --> O1
```

每个连接都有一个**权重（weight）**，训练的过程就是不断调整这些权重。

### 训练循环

深度学习的训练是一个反复的循环过程：

```mermaid
graph TD
    A[输入数据] --> B[前向传播 Forward]
    B --> C[计算损失 Loss]
    C --> D[反向传播 Backward]
    D --> E[计算梯度]
    E --> F[更新参数 Optimizer Step]
    F --> G{还有数据吗？}
    G -->|是| A
    G -->|否| H[训练完成]

    style A fill:#e1f5fe
    style C fill:#fff3e0
    style D fill:#fce4ec
    style F fill:#e8f5e9
```

**本项目对应**（`trainer/train_sft_omni.py:train_epoch()`）：

```python
# 简化的训练循环
for step, batch in enumerate(loader):
    # 1. 前向传播
    output = model(batch.input_ids)
    # 2. 计算损失
    loss = compute_loss(output, batch.labels)
    # 3. 反向传播（自动计算梯度）
    loss.backward()
    # 4. 更新参数
    optimizer.step()
    optimizer.zero_grad()
```

### 张量（Tensor）

张量是 PyTorch 中的基本数据结构，可以理解为多维数组：

```mermaid
graph TD
    subgraph "标量 Scalar (0维)"
        S["5"]
    end
    subgraph "向量 Vector (1维)"
        V["[1, 2, 3]"]
    end
    subgraph "矩阵 Matrix (2维)"
        M["[[1, 2],<br>[3, 4]]"]
    end
    subgraph "张量 Tensor (3维+)"
        T["shape: (batch, seq_len, dim)<br>例: (2, 10, 768)"]
    end

    S --> V --> M --> T
```

**本项目中常见的张量形状**：

| 张量 | 形状 | 含义 |
|------|------|------|
| `input_ids` | `(B, T)` | B 个样本，每个 T 个 token |
| `hidden_states` | `(B, T, 768)` | B 个样本，每个 T 个位置，每个 768 维 |
| `logits` | `(B, T, 6400)` | B 个样本，每个 T 个位置，6400 个词的概率 |
| `audio_logits[i]` | `(B, T, 2112)` | 第 i 层音频码本预测 |

> `B` = Batch Size（批次大小），`T` = Sequence Length（序列长度）

### 损失函数

损失函数衡量模型预测与真实答案的差距：

```mermaid
graph LR
    A[模型预测] --> C[损失函数]
    B[真实标签] --> C
    C --> D[损失值 Loss]

    D -->|越小越好| E[梯度下降更新参数]

    style D fill:#ffcdd2
    style E fill:#c8e6c9
```

**本项目使用的损失**：交叉熵损失（CrossEntropyLoss），用于分类问题——"从 N 个选项中选正确的那个"。

```python
# 本项目的文本损失
text_loss = CrossEntropyLoss(predicted_logits, true_token_ids)
# predicted_logits: (B*T, 6400) — 每个位置预测 6400 个词的概率
# true_token_ids:   (B*T,)      — 每个位置的正确词 ID
```

---

## 0.3 PyTorch 框架

### 核心模块对应关系

```mermaid
graph TD
    subgraph "nn.Module（模型基类）"
        A[所有模型组件都继承此类]
        B[定义 forward 方法]
        C[自动管理参数]
    end

    subgraph "nn.Linear（全连接层）"
        D["y = x @ W^T + b"]
        E["例: Linear(768, 6400)"]
        F["将 768 维映射到 6400 维"]
    end

    subgraph "nn.Embedding（嵌入层）"
        G["将整数 ID 映射为向量"]
        H["例: Embedding(6400, 768)"]
        I["token_id=5 → 768维向量"]
    end

    subgraph "nn.ModuleList（模块列表）"
        J["存储多个相同结构的层"]
        K["例: 8 个 Transformer Block"]
    end

    A --> D
    A --> G
    A --> J
```

### 本项目的模块层次

```mermaid
graph TD
    A[nn.Module] --> B[MiniMindForCausalLM]
    B --> C[MiniMindModel]
    C --> D[nn.Embedding: 6400×768]
    C --> E["nn.ModuleList: 8×MiniMindBlock"]
    C --> F[RMSNorm]
    E --> G[MiniMindBlock × 8]
    G --> H[RMSNorm: input_layernorm]
    G --> I[Attention]
    G --> J[RMSNorm: post_attention_layernorm]
    G --> K[FeedForward 或 MOEFeedForward]

    I --> L[nn.Linear: q_proj 768→768]
    I --> M[nn.Linear: k_proj 768→384]
    I --> N[nn.Linear: v_proj 768→384]
    I --> O[nn.Linear: o_proj 768→768]

    K --> P[nn.Linear: gate_proj 768→2432]
    K --> Q[nn.Linear: up_proj 768→2432]
    K --> R[nn.Linear: down_proj 2432→768]
```

### GPU 加速

```mermaid
graph LR
    subgraph CPU
        A[数据在内存]
        B[计算较慢]
    end
    subgraph GPU
        C["数据在显存 (.to('cuda'))"]
        D[并行计算，快很多]
    end

    A -->|".to(device)"| C
```

```python
# 本项目中的设备管理
device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)
input_ids = input_ids.to(device)
```

---

## 0.4 自然语言处理（NLP）基础

### Tokenizer（分词器）

分词器将人类可读的文本转换为模型能理解的数字 ID：

```mermaid
graph LR
    A["你好，世界"] --> B[Tokenizer]
    B --> C["[1, 256, 789, 45, 1023, 2]"]
    C --> |"每个数字是一个 token_id"| D[Embedding 层]
    D --> E["(6, 768) 的浮点矩阵"]
```

**本项目的分词器**（`model/tokenizer.json`）：
- 词汇表大小：6400
- 使用 BPE（字节对编码）算法
- 特殊 token：`<|im_start|>`(1), `<|im_end|>`(2), `<|audio_pad|>`(16), `<|image_pad|>`(12)

### Chat 格式（对话模板）

本项目使用 ChatML 格式组织对话：

```mermaid
graph TD
    subgraph "对话结构"
        A["<|im_start|>system<br>你是一个有用的AI助手。<|im_end|>"]
        B["<|im_start|>user<br>你好<|im_end|>"]
        C["<|im_start|>assistant<br>你好！有什么可以帮你的？<|im_end|>"]
    end

    A --> B --> C

    style A fill:#e8eaf6
    style B fill:#e3f2fd
    style C fill:#e8f5e9
```

**训练时**：模型学习根据 `<|im_start|>user` 的内容，生成 `<|im_start|>assistant` 后面的回复。

### 特殊 Token 的作用

```mermaid
graph LR
    subgraph "文本特殊 Token"
        T1["<|im_start|> 开始标记"]
        T2["<|im_end|> 结束标记"]
    end
    subgraph "音频特殊 Token"
        A1["<|audio_pad|> 音频占位符 (id=16)"]
        A2["<|audio_stop|> 音频停止 (id=2050)"]
        A3["<|audio_spk|> 说话人标记 (id=2051)"]
    end
    subgraph "图像特殊 Token"
        V1["<|image_pad|> 图像占位符 (id=12)"]
    end

    T1 --> D["告诉模型<br>这里是什么内容"]
    A1 --> D
    V1 --> D
```

---

## 0.5 音频处理基础

### 音频信号

```mermaid
graph LR
    subgraph "模拟信号（连续波形）"
        A["～～～～～♪～～～"]
    end
    subgraph "数字化（采样）"
        B["采样率: 16000 Hz<br>每秒采集 16000 个点"]
    end
    subgraph "张量表示"
        C["shape: (samples,)<br>例: (16000,) = 1秒音频"]
    end

    A -->|采样| B --> C
```

### 音频处理流水线

```mermaid
graph TD
    A[原始音频 WAV] --> B[重采样到 16kHz]
    B --> C[数据增强 augment_wav]
    C --> D[提取 Fbank 特征]
    D --> E[频谱增强 augment_mel]
    E --> F["fbank 特征 (T, 560)"]
    F --> G[SenseVoice 编码器]
    G --> H["音频特征 (T, 512)"]

    style C fill:#fff3e0
    style E fill:#fff3e0
```

### Mimi 音频编解码

Mimi 是本项目使用的神经音频编解码器，将连续音频转换为 8 层离散码本：

```mermaid
graph LR
    subgraph "编码"
        A["音频波形 24kHz"] --> B["Mimi Encoder"]
        B --> C["8 层码本<br>每层一个整数 ID"]
    end
    subgraph "解码"
        C --> D["Mimi Decoder"]
        D --> E["重建音频波形 24kHz"]
    end

    C -.- F["例: 第1帧 = [120, 450, 890, 23, 567, 334, 12, 789]<br>8个整数，每层一个"]
```

**为什么需要 8 层？** 每一层捕捉音频的不同层次信息（低层=基本音调，高层=语义细节），多层叠加可以更精确地重建音频。

---

## 0.6 计算机视觉基础

### 图像编码流水线

```mermaid
graph TD
    A["原始图像<br>(H, W, 3)"] --> B["缩放到 256×256"]
    B --> C["SigLIP2 编码器<br>(frozen, 94.5M params)"]
    C --> D["64 个 patch token<br>每个 768 维"]
    D --> E["MMVisionProjector<br>768→768"]
    E --> F["投影后的视觉特征<br>(64, 768)"]

    style C fill:#f3e5f5
```

**什么是 Patch？** 将 256×256 的图片切分成 8×8=64 个小块（每块 32×32 像素），每块变成一个 token。

### 多模态融合直觉

```mermaid
graph TD
    subgraph "不同模态的特征"
        A["文本: (T_text, 768)"]
        B["音频: (T_audio, 512) → 投影 → (T_audio, 768)"]
        C["图像: (64, 768) → 投影 → (64, 768)"]
    end

    subgraph "统一到同一空间"
        D["所有模态都变成 768 维向量"]
    end

    A --> D
    B --> D
    C --> D

    D --> E["拼接成一个长序列<br>送入 Transformer"]

    style D fill:#e8f5e9
```

---

## 0.7 推荐学习资源

### 视频
- **3Blue1Brown《神经网络》** — 建立直觉
- **李沐《动手学深度学习》** — PyTorch 实践

### 文档
- **PyTorch 官方教程** — https://pytorch.org/tutorials/
- **HuggingFace Transformers 文档** — https://huggingface.co/docs/transformers

### 书籍
- **《动手学深度学习》（d2l.ai）** — 从零实现每个组件
- **《深度学习》（花书）** — 理论基础（选读）

### 练习平台
- 在本项目目录下创建 `playground/` 文件夹，写实验代码

---

## 学习检查清单

完成本阶段后，你应该能回答以下问题：

- [ ] 什么是张量？`(B, T, 768)` 中每个维度代表什么？
- [ ] `nn.Linear(768, 2432)` 做了什么操作？有多少参数？
- [ ] `loss.backward()` 和 `optimizer.step()` 分别做什么？
- [ ] 为什么推理时要用 `torch.no_grad()`？
- [ ] Tokenizer 的输入和输出分别是什么？
- [ ] `<|audio_pad|>` 在模型中的作用是什么？
- [ ] Mimi 编码器的输出为什么是 8 层码本？

> 如果以上问题你都能回答，恭喜你，可以进入阶段一了！
