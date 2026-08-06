# MiniMind 大语言模型 学习路线图

> 本路线图面向零基础新手，按照**从易到难、从基础到前沿**的顺序，带你逐步理解 MiniMind 项目中的每一个模块和概念。
> 每个阶段都包含：学习目标、前置知识、需要阅读的代码文件、核心概念解析、实践建议。

---

## 项目全景概览

MiniMind 是一个**从零手写的小型大语言模型（LLM）训练框架**，仅约 4600 行代码，却完整覆盖了现代 LLM 的全部核心流程：

```
Tokenizer训练 → 预训练(Pretrain) → 监督微调(SFT) → LoRA微调
    → 知识蒸馏(Distillation) → DPO → GRPO → PPO → Agent RL → 模型部署
```

### 项目文件结构总览

```
minimind/
├── model/
│   ├── model_minimind.py      # 核心：模型架构（Transformer + MoE）
│   ├── model_lora.py           # LoRA 低秩适配器
│   ├── tokenizer.json          # 分词器词汇表
│   └── tokenizer_config.json   # 分词器配置（含chat模板）
│
├── dataset/
│   ├── lm_dataset.py           # 所有数据集类（Pretrain/SFT/DPO/RL/Agent）
│   └── dataset.md              # 数据集说明
│
├── trainer/
│   ├── train_tokenizer.py      # 第0步：训练BPE分词器
│   ├── train_pretrain.py       # 第1步：预训练（Next Token Prediction）
│   ├── train_full_sft.py       # 第2步：全参数监督微调
│   ├── train_lora.py           # 第3步：LoRA参数高效微调
│   ├── train_distillation.py   # 第4步：知识蒸馏
│   ├── train_dpo.py            # 第5步：DPO对齐训练
│   ├── train_grpo.py           # 第6步：GRPO强化学习
│   ├── train_ppo.py            # 第7步：PPO强化学习
│   ├── train_agent.py          # 第8步：Agent工具调用强化学习
│   ├── rollout_engine.py       # RL推理引擎（PyTorch/SGLang）
│   └── trainer_utils.py        # 训练工具函数（优化器、检查点、分布式等）
│
├── scripts/
│   ├── eval_llm.py             # 命令行对话推理
│   ├── serve_openai_api.py     # OpenAI兼容API服务
│   ├── web_demo.py             # Streamlit网页聊天界面
│   ├── chat_api.py             # OpenAI API客户端调用示例
│   ├── eval_toolcall.py        # 工具调用能力评估
│   └── convert_model.py        # 模型格式转换（torch ↔ transformers）
│
└── eval_llm.py                 # 命令行推理入口
```

---

## 阶段 0：Python 与深度学习基础（前置准备）

> 如果你已经熟悉 Python 和 PyTorch，可以跳过本阶段。

### 学习目标
掌握阅读本项目代码所需的 Python 和深度学习基础知识。

### 0.1 Python 基础
- **变量与数据类型**：`int`, `float`, `str`, `list`, `dict`, `tuple`, `set`
- **控制流**：`if/else`, `for/while`, `break/continue`
- **函数**：`def`, 参数默认值, `*args/**kwargs`, `lambda`
- **面向对象**：`class`, `__init__`, `self`, 继承 (`class Child(Parent)`)
- **模块与包**：`import`, `from...import`, `__name__ == "__main__"`
- **文件操作**：`open()`, `json.loads()`, `json.dumps()`
- **装饰器基础**：`@torch.no_grad()`, `@abstractmethod`
- **生成器**：`yield`（在 `train_tokenizer.py` 中 `get_texts()` 用到）
- **字符串格式化**：f-string (`f"loss: {loss:.4f}"`)

### 0.2 PyTorch 基础
- **Tensor 操作**：
  - 创建：`torch.tensor()`, `torch.zeros()`, `torch.ones()`, `torch.randn()`
  - 形状：`.shape`, `.view()`, `.reshape()`, `.unsqueeze()`, `.squeeze()`, `.transpose()`
  - 计算：`+`, `-`, `*`, `/`, `@`（矩阵乘法）, `.sum()`, `.mean()`, `.norm()`
  - 索引：`x[0]`, `x[:, :3]`, `x.masked_fill()`, `torch.where()`, `.gather()`, `.scatter()`
  - 设备：`.to("cuda")`, `.cpu()`, `.half()`, `.float()`
- **自动求导**：
  - `requires_grad=True`, `.backward()`, `.grad`
  - `torch.no_grad()`, `with torch.inference_mode()`
- **神经网络模块**：
  - `nn.Module`, `__init__()`, `forward()`
  - `nn.Linear`, `nn.Embedding`, `nn.Dropout`, `nn.Parameter`
  - `model.parameters()`, `model.state_dict()`, `model.load_state_dict()`
- **优化器**：
  - `optim.AdamW()`, `optimizer.step()`, `optimizer.zero_grad()`
  - 学习率调度：手动调LR（本项目的 `get_lr()` 函数）
- **数据加载**：
  - `Dataset`, `DataLoader`, `__len__()`, `__getitem__()`
  - `batch_size`, `num_workers`, `pin_memory`
- **混合精度训练**：
  - `torch.cuda.amp.autocast()`, `GradScaler`
  - `scaler.scale(loss).backward()`, `scaler.step(optimizer)`

### 0.3 数学基础（最低限度）
- **线性代数**：矩阵乘法、向量点积
- **概率论**：概率分布、条件概率、似然
- **微积分**：导数、偏导数、梯度、链式法则
- **信息论**：交叉熵 (Cross Entropy)、KL散度 (KL Divergence)

### 推荐学习资源
- Python：廖雪峰 Python 教程 / 菜鸟教程
- PyTorch：PyTorch 官方 60 分钟入门教程
- 数学：3Blue1Brown 线性代数/微积分系列视频

---

## 阶段 1：理解 Tokenizer（分词器）

### 学习目标
理解"文本如何变成数字"——这是所有语言模型的第一步。

### 需要阅读的文件
- `trainer/train_tokenizer.py` —— BPE分词器训练
- `model/tokenizer.json` —— 词汇表（不用全看，了解结构即可）
- `model/tokenizer_config.json` —— 分词器配置

### 核心概念

#### 1.1 什么是 Tokenizer？
计算机不认识"你好"这样的文字，需要把文字转换成数字序列。Tokenizer 就是这个"翻译器"：
```
"你好世界" → [102, 587, 392]  (每个数字代表一个token)
```

#### 1.2 BPE（Byte Pair Encoding）算法
MiniMind 使用 BPE 算法训练分词器：
1. 从字符级别开始（每个字节/字符是一个token）
2. 统计相邻字符对出现的频率
3. 把最高频的字符对合并成新token
4. 重复步骤2-3，直到达到目标词汇表大小（MiniMind 设为 6400）

**为什么词汇表只有 6400？** 因为 MiniMind 是小模型，小词汇表可以让嵌入层参数更少，降低整体参数量。

#### 1.3 特殊 Token
```
<|im_start|>    # 消息开始标记
<|im_end|>      # 消息结束标记（也是EOS token）
```
这些特殊标记用于区分对话中的不同角色（system/user/assistant/tool）。

#### 1.4 Chat Template（聊天模板）
`tokenizer_config.json` 中的 `chat_template` 字段定义了对话格式：
```
<|im_start|>system
你是一个AI助手
<|im_end|>
<|im_start|>user
你好
<|im_end|>
<|im_start|>assistant
```
这就是你看到的对话被"模板化"后的样子。

#### 1.5 代码精读指南
打开 `train_tokenizer.py`，重点理解：
- **第25-48行**：BPE训练器的配置，包括特殊token列表
- **第49-51行**：`train_from_iterator()` 执行训练
- **第78-101行**：保存配置文件，包括chat模板的Jinja2格式
- **第108-165行**：`eval_tokenizer()` 函数，验证分词器的编码-解码一致性

### 实践建议
- 运行 `python trainer/train_tokenizer.py` 观察训练过程
- 修改 `VOCAB_SIZE` 参数，观察不同词汇表大小对编码效率的影响

---

## 阶段 2：理解模型架构（最重要的一步）

### 学习目标
深入理解 Transformer 架构的每一个组件，这是整个项目最核心的代码。

### 需要阅读的文件
- `model/model_minimind.py` —— **核心中的核心**，287行，务必逐行读懂

### 核心概念与代码对应

#### 2.1 整体架构：MiniMindForCausalLM
```
输入文本 → Tokenizer → Token IDs → Embedding → [Transformer Block × N] → RMSNorm → lm_head → 预测下一个Token
```

代码中的类层次结构：
```
MiniMindForCausalLM          # 顶层模型（包含language modeling head）
  └── MiniMindModel          # Transformer主体（不含输出头）
        ├── embed_tokens     # 词嵌入层：token ID → 向量
        ├── layers           # N个Transformer Block
        │     └── MiniMindBlock
        │           ├── self_attn (Attention)
        │           ├── mlp (FeedForward 或 MOEFeedForward)
        │           ├── input_layernorm (RMSNorm)
        │           └── post_attention_layernorm (RMSNorm)
        └── norm (RMSNorm)   # 最终归一化
```

#### 2.2 配置类 MiniMindConfig（第10-45行）
控制模型大小和行为的关键参数：
| 参数 | 默认值 | 含义 |
|------|--------|------|
| `hidden_size` | 768 | 隐藏层维度（模型"宽度"） |
| `num_hidden_layers` | 8 | Transformer层数（模型"深度"） |
| `num_attention_heads` | 8 | 注意力头数 |
| `num_key_value_heads` | 4 | KV头数（GQA，见下文） |
| `head_dim` | 96 | 每个注意力头的维度 |
| `vocab_size` | 6400 | 词汇表大小 |
| `use_moe` | False | 是否使用MoE |
| `rope_theta` | 1e6 | RoPE频率基数 |

**模型参数量估算**：
- 768维 × 8层 ≈ **64M参数**（dense版本，即 minimind-3）
- 768维 × 8层 MoE（4专家）≈ **198M参数**（MoE版本）

#### 2.3 RMSNorm（第50-60行）—— 归一化层
```
RMSNorm(x) = x * weight / sqrt(mean(x²) + eps)
```
比 LayerNorm 更高效，不需要计算均值，只计算均方根。用在每一层的输入处（Pre-Norm结构）。

#### 2.4 RoPE 旋转位置编码（第62-84行）—— 位置信息注入

**为什么需要位置编码？** 注意力机制本身是"位置无关"的——它不知道"我爱吃苹果"和"苹果吃爱我"有什么区别。位置编码给每个位置一个独特的"标签"。

**RoPE 的核心思想**：用旋转矩阵编码位置信息，使得 q·k 的点积自然包含相对位置关系。

关键函数：
- `precompute_freqs_cis()`：预计算 cos/sin 缓冲区（第62-78行）
- `apply_rotary_pos_emb()`：将RoPE应用到query和key上（第80-84行）
- `rotate_half()`：旋转操作——把向量切成两半并交叉（第81行）

**YaRN 扩展**（第64-73行）：当需要处理比训练时更长的序列时，通过调整频率实现位置编码外推。

#### 2.5 Attention 注意力机制（第91-134行）—— 模型的"注意力"

**核心公式**：
```
Attention(Q, K, V) = softmax(Q·K^T / √d) · V
```

代码实现要点：
| 行号 | 代码 | 作用 |
|------|------|------|
| 100-103 | `q_proj`, `k_proj`, `v_proj`, `o_proj` | Q/K/V/Output 线性投影 |
| 104-105 | `q_norm`, `k_norm` | QK-Norm（稳定训练） |
| 113-116 | `view(bsz, seq_len, heads, head_dim)` | 拆分多头 |
| 119 | `apply_rotary_pos_emb()` | 注入位置信息 |
| 120-123 | KV-Cache 拼接 | 加速推理 |
| 124 | `repeat_kv()` | GQA 扩展KV头 |
| 126 | `scaled_dot_product_attention` | Flash Attention加速 |
| 128-131 | 手动注意力计算 | Flash Attention不可用时的备选方案 |

**GQA（Grouped Query Attention）**（第86-89行）：
- `num_attention_heads=8`（Query头数），`num_key_value_heads=4`（Key/Value头数）
- 每2个Query头共享1组KV头 → 节省KV-Cache显存
- `repeat_kv()` 将KV头复制到与Query头数匹配

**KV-Cache**（第120-123行）：
- 推理时缓存之前的 Key 和 Value，每步只计算新token
- `past_key_value` 存储历史KV，`use_cache` 控制是否启用

**Flash Attention**（第109, 125-126行）：
- PyTorch 2.0+ 提供的高效注意力实现
- 比手动计算快2-4倍，显存占用更少

**因果注意力掩码**（第129行）：
- `.triu(1)` 生成上三角矩阵，确保token只能看到它之前的token
- 防止"偷看"未来信息

#### 2.6 FeedForward 前馈网络（第136-146行）—— 层内的"记忆"
```
FFN(x) = down_proj(SiLU(gate_proj(x)) * up_proj(x))
```
采用 SwiGLU 结构（Llama系列使用的激活函数组合）：
- `gate_proj` 和 `up_proj` 将维度从 `hidden_size` 扩展到 `intermediate_size`
- SiLU 激活函数（Sigmoid Linear Unit）
- `down_proj` 将维度压缩回 `hidden_size`

#### 2.7 MoE（Mixture of Experts）混合专家系统（第148-176行）

**核心思想**：不是所有token都需要同样的计算，让不同的token由不同的"专家"处理。

```
MoE(x) = Σ(weight_i × Expert_i(x))  # 只激活top-k个专家
```

代码实现：
| 行号 | 组件 | 作用 |
|------|------|------|
| 152 | `gate` | 路由器：决定每个token由哪个专家处理 |
| 153 | `experts` | 4个并行的FeedForward网络（"专家"） |
| 159 | `softmax + topk` | 选择得分最高的 `num_experts_per_tok`(=1) 个专家 |
| 163-168 | 循环遍历专家 | 只处理被选中的token |
| 169-170 | 空专家处理 | 保证所有专家参数参与梯度计算 |
| 171-175 | `aux_loss` | 负载均衡损失，防止所有token都涌向同一个专家 |

**为什么用 MoE？** 增加参数量但不等比例增加计算量——每次推理只激活部分专家。

#### 2.8 Transformer Block（第178-194行）
```
x = x + Attention(RMSNorm(x))         # 残差连接 + 注意力
x = x + FFN/MoE(RMSNorm(x))           # 残差连接 + 前馈
```
这是 Pre-Norm 结构：先归一化，再计算，再加残差。

#### 2.9 语言模型头 MiniMindForCausalLM（第234-288行）

**forward()**（第245-253行）：
- 将隐藏状态映射回词汇表维度：`lm_head(hidden_states)` → logits
- 计算交叉熵损失：预测下一个token的概率分布与真实token的交叉熵
- `labels[..., 1:]` 是真实答案，`logits[..., :-1, :]` 是预测值（左移一位）

**generate()**（第256-288行）—— 自回归生成：
1. 将输入编码为token IDs
2. 循环生成：模型预测下一个token的概率分布
3. 采样策略：
   - **Temperature**（温度）：控制随机性，越高越随机
   - **Top-K**：只从概率最高的K个token中采样
   - **Top-P**（Nucleus Sampling）：只从累积概率达到P的最小token集合中采样
   - **Repetition Penalty**：惩罚已出现过的token，防止重复
4. 遇到 `<|im_end|>`（EOS）则停止生成

### 实践建议
- 在纸上画出 MiniMind 的架构图，标注每一层的维度变化
- 尝试修改 `hidden_size` 和 `num_hidden_layers`，观察参数量变化
- 手动计算一个简单示例：输入 `[1, 2, 3]`，跟踪维度在每一步的变化

---

## 阶段 3：预训练（Pretrain）—— 让模型学会"说人话"

### 学习目标
理解语言模型的第一个训练阶段：通过"预测下一个token"学习语言的统计规律。

### 需要阅读的文件
- `trainer/train_pretrain.py` —— 预训练主循环
- `dataset/lm_dataset.py` 第37-55行 —— `PretrainDataset` 类

### 核心概念

#### 3.1 训练目标：Next Token Prediction
给定文本 `"人工智能是"`，模型要学会预测下一个字可能是 `"一"` 或 `"一门"` 等。
- 输入 `[人, 工, 智, 能, 是]` → 预测 `[工, 智, 能, 是, ?]`
- 损失函数：**交叉熵损失 (Cross Entropy Loss)**

#### 3.2 数据集：PretrainDataset
```
原始文本 → Tokenizer编码 → 添加BOS/EOS → 截断/填充到max_length → input_ids + labels
```
- `input_ids`：模型输入的token序列
- `labels`：与 input_ids 相同（预测下一个token时通过移位实现）
- `pad_token_id` 对应的 label 设为 `-100`（忽略不计入损失）

#### 3.3 训练循环（train_epoch函数，第23-79行）
每个训练步骤：
1. **数据加载**：取一个batch的 `(input_ids, labels)`
2. **前向传播**：`model(input_ids, labels=labels)` → 计算loss
3. **反向传播**：`loss.backward()` → 计算梯度
4. **梯度裁剪**：`clip_grad_norm_(max_norm=1.0)` → 防止梯度爆炸
5. **参数更新**：`optimizer.step()` → 更新权重
6. **梯度清零**：`optimizer.zero_grad()` → 准备下一步

#### 3.4 关键训练技巧

**余弦学习率调度**（`get_lr()` 函数）：
```python
lr = base_lr * (0.1 + 0.45 * (1 + cos(π * step / total_steps)))
```
先warmup（从0.1×base_lr开始），再余弦退火。这是训练稳定的保障。

**梯度累积**（`accumulation_steps`）：
- 实际batch_size = batch_size × accumulation_steps
- 多步累积梯度后再更新参数 → 小显存也能用大batch

**混合精度训练**（AMP）：
- `bfloat16` 精度计算前向/反向（速度翻倍，显存减半）
- `GradScaler` 防止梯度下溢

**模型保存**：
- 每隔 `save_interval` 步保存一次权重
- `lm_checkpoint()` 同时保存模型、优化器、epoch等状态，支持断点续训

#### 3.5 分布式训练（DDP）
- `init_distributed_mode()`：初始化NCCL后端
- `DistributedDataParallel`：数据并行，多卡各训练一部分数据
- `DistributedSampler`：确保每卡看到不同的数据子集

### 实践建议
- 阅读完整训练流程：从参数解析 → 模型初始化 → 数据加载 → 训练循环 → 保存检查点
- 理解 args 中每个参数的含义和作用

---

## 阶段 4：监督微调（SFT）—— 让模型学会"对话"

### 学习目标
理解如何将预训练模型微调为对话模型。

### 需要阅读的文件
- `trainer/train_full_sft.py` —— SFT训练
- `dataset/lm_dataset.py` 第58-119行 —— `SFTDataset` 类

### 核心概念

#### 4.1 SFT 与 Pretrain 的区别
| 方面 | 预训练 | SFT |
|------|--------|-----|
| 数据 | 纯文本 | 问答对话（instruction-response） |
| 目标 | 学语言规律 | 学会听指令回答问题 |
| 学习率 | 较高 (5e-4) | 很低 (1e-5) |
| 序列长度 | 较短 (340) | 较长 (768) |

#### 4.2 Label Masking —— 只训练"回答部分"
SFT 的关键技巧：**只在assistant回答的部分计算loss**。

```
<|im_start|>user\n你好<|im_end|>          → label = -100（不训练）
<|im_start|>assistant\n你好呀！有什么可以帮助你的？<|im_end|>  → label = 实际token（训练）
```

代码中的 `generate_labels()` 函数（第88-104行）实现了这个逻辑：
- 找到 `<|im_start|>assistant\n` 的位置 → 从这里开始计算loss
- 找到 `<|im_end|>\n` 的位置 → 到这里结束

#### 4.3 Chat Template 的作用
SFTDataset 使用 `apply_chat_template()` 将对话格式化为模型能理解的文本：
```
[
  {"role": "user", "content": "你好"},
  {"role": "assistant", "content": "你好呀！"}
]
↓
<|im_start|>system\n你是minimind<|im_end|>
<|im_start|>user\n你好<|im_end|>
<|im_start|>assistant\n你好呀！<|im_end|>
```

#### 4.4 Thinking（思考）模式
- 以一定概率（`empty_think_ratio=0.2`）移除空的思考标签
- 思考格式：`<think\n思考内容\n</think\n\n回答内容`
- 这是让模型具备"内心独白"能力的关键

### 实践建议
- 构造一个简单的SFT数据集，理解数据格式
- 对比 `PretrainDataset` 和 `SFTDataset` 的 `__getitem__` 方法的区别

---

## 阶段 5：LoRA 微调 —— 参数高效微调

### 学习目标
理解 LoRA（Low-Rank Adaptation）的原理和实现。

### 需要阅读的文件
- `model/model_lora.py` —— LoRA 实现（仅65行，非常精简）
- `trainer/train_lora.py` —— LoRA 训练

### 核心概念

#### 5.1 LoRA 的核心思想
不修改原始权重 W，而是添加一个低秩分解的旁路：
```
W' = W + B·A
其中 B 是 (d×r) 矩阵，A 是 (r×d) 矩阵，r << d
```
- **原始参数量**：d × d = 768 × 768 = 589,824
- **LoRA参数量**：d × r + r × d = 768 × 16 + 16 × 768 = 24,576
- **参数量仅为原始的 ~4%**

#### 5.2 代码实现详解

**LoRA 类**（第6-18行）：
```python
class LoRA(nn.Module):
    A = nn.Linear(in_features, rank)     # (d, r) 降维
    B = nn.Linear(rank, out_features)    # (r, d) 升维
    # A初始化为高斯分布，B初始化为0 → 训练开始时 LoRA(x) ≈ 0
```

**apply_lora()**（第21-32行）—— 注入LoRA：
```python
def apply_lora(model, rank=16):
    for name, module in model.named_modules():
        if isinstance(module, nn.Linear) and module.weight.shape[0] == module.weight.shape[1]:
            lora = LoRA(...)
            module.forward = lambda x: original_forward(x) + lora(x)
```
- 遍历所有方形 Linear 层（即 Q/K/V/O 投影和 FFN 层）
- Monkey-patch 它们的 forward 方法，加上 LoRA 旁路

**save_lora() / load_lora()** —— 只保存/加载 LoRA 参数，非常小

**merge_lora()**（第56-65行）—— 合并权重：
```python
W_merged = W + B @ A  # 将LoRA权重合并到原始权重中，推理时无额外开销
```

#### 5.3 LoRA 训练的特殊处理
- **冻结原始参数**：只训练 LoRA 的 A 和 B 矩阵
- **优化器只包含 LoRA 参数**：`optimizer = AdamW(lora_params, lr=1e-4)`
- **不使用 torch.compile**：monkey-patch forward 与 compile 不兼容

### 实践建议
- 计算：你的模型有多少参数？LoRA 参数占比多少？
- 思考：为什么 LoRA 的 A 用高斯初始化，B 用零初始化？

---

## 阶段 6：知识蒸馏（Distillation）—— 大模型教小模型

### 学习目标
理解如何用大模型（教师）的知识来指导小模型（学生）的训练。

### 需要阅读的文件
- `trainer/train_distillation.py` —— 蒸馏训练

### 核心概念

#### 6.1 为什么需要蒸馏？
- 教师模型（如 MoE 版本）参数多、能力强，但推理慢
- 学生模型（如 Dense 版本）参数少、推理快，但能力弱
- 蒸馏让学生学教师的"输出分布"，而非只学标签

#### 6.2 蒸馏损失函数（第24-35行）
```
总损失 = α × CE_Loss + (1-α) × Distillation_Loss
```

**CE Loss**：标准交叉熵，学生预测 vs 真实标签
**Distillation Loss**：KL散度，学生输出分布 vs 教师输出分布（经过温度缩放）

```
KL(Student_logits/T || Teacher_logits/T) × T²
```

**温度 T 的作用**：T 越高，概率分布越"平滑"，暴露更多教师模型的"暗知识"——比如教师认为"猫"和"狗"比"猫"和"汽车"更相似。

### 实践建议
- 尝试不同的 α 和 temperature 参数，观察对学生模型性能的影响

---

## 阶段 7：DPO（Direct Preference Optimization）—— 直接偏好优化

### 学习目标
理解 DPO 如何让模型学会"什么是好回答"。

### 需要阅读的文件
- `trainer/train_dpo.py` —— DPO训练
- `dataset/lm_dataset.py` 第122-192行 —— `DPODataset` 类

### 核心概念

#### 7.1 DPO 的直觉
给模型看同一问题的两个回答：
- **chosen**（好的回答）：详细的、准确的
- **rejected**（差的回答）：简陋的、错误的

训练模型增加生成 chosen 的概率，降低生成 rejected 的概率。

#### 7.2 DPO 损失函数（第33-49行）
```python
loss = -log_sigmoid(β × (log π_chosen/π_rejected - log π_ref_chosen/π_ref_rejected))
```
其中：
- `π` 是当前策略模型，`π_ref` 是冻结的参考模型
- `β` 控制对齐强度（默认 0.15）
- 目标：让策略模型相比参考模型更偏好 chosen

#### 7.3 关键组件
| 组件 | 作用 |
|------|------|
| 策略模型 (model) | 正在训练的模型 |
| 参考模型 (ref_model) | 冻结的SFT模型，提供基准 |
| DPO Dataset | 包含 (prompt, chosen, rejected) 三元组 |
| `logits_to_log_probs()` | 将logits转为每个token的对数概率 |
| `generate_loss_mask()` | 只在回答部分计算loss |

### 实践建议
- 理解为什么需要参考模型（没有它模型可能会偏离原始能力）
- DPO 的学习率非常低（4e-8），思考为什么

---

## 阶段 8：强化学习基础 —— GRPO 与 PPO

### 学习目标
理解 RLHF（基于人类反馈的强化学习）的两种主流算法。

### 前置知识
- 强化学习基础概念：策略 (Policy)、奖励 (Reward)、优势函数 (Advantage)
- 了解 PPO 论文的基本思想

### 需要阅读的文件
- `trainer/train_grpo.py` —— GRPO训练（推荐先读这个，更简洁）
- `trainer/train_ppo.py` —— PPO训练（更复杂，含Critic模型）
- `trainer/rollout_engine.py` —— RL推理引擎
- `dataset/lm_dataset.py` 第195-224行 —— `RLAIFDataset` 类

### 核心概念

#### 8.1 RL训练的整体流程
```
1. 从数据集取一批prompt
2. 让模型生成多个回答（rollout）
3. 用奖励模型给每个回答打分
4. 计算策略梯度loss，更新模型
```

#### 8.2 奖励计算（calculate_rewards 函数）
MiniMind 的奖励来自多个信号：
| 信号 | 分值 | 含义 |
|------|------|------|
| 回答长度 | ±0.5 | 20-800字之间加分 |
| 思考长度 | ±1.0 | 思考部分20-300字加分 |
| 思考闭合 | ±0.25 | 只有一个`</think`标签加分 |
| 重复惩罚 | 0~-0.5 | 三元组重复率越高扣分越多 |
| RM评分 | -3~+3 | 外部Reward Model打分 |

#### 8.3 GRPO（Group Relative Policy Optimization）
**核心思想**：同一prompt生成多个回答，用组内相对表现计算优势。

```
advantage_i = (reward_i - mean(rewards)) / std(rewards)
```

**GRPO 损失**（第134-137行）：
- **GRPO模式**：PPO式裁剪 `min(ratio × advantage, clip(ratio) × advantage)`
- **CISPO模式**（默认）：只裁剪上界 `clamp(ratio, max=ε_high) × advantage`
- 加上 KL 散度惩罚，防止策略偏离参考模型太远

#### 8.4 PPO（Proximal Policy Optimization）
PPO 比 GRPO 更复杂，多了：
- **Critic模型**（第36-48行）：预测每个状态的价值函数，用于计算GAE（广义优势估计）
- **GAE**（第139-146行）：
  ```
  δ_t = reward_t + γ × V(s_{t+1}) - V(s_t)
  A_t = Σ (γλ)^l × δ_{t+l}
  ```
- **Value Loss**：训练Critic更好地估计状态价值
- **Early Stop**：当 KL 散度超过阈值时停止更新

#### 8.5 Rollout Engine（推理引擎）
```
RolloutEngine (抽象基类)
├── TorchRolloutEngine     # PyTorch原生推理
└── SGLangRolloutEngine    # SGLang加速推理（通过HTTP API）
```
- 负责生成回答并计算每个token的对数概率
- 支持 PyTorch 原生推理和 SGLang 高性能推理两种模式
- `update_policy()` 在每步训练后同步最新权重到推理引擎

### 实践建议
- 先读懂 GRPO（代码更简洁），再读 PPO
- 理解"为什么RL能提升模型能力"：它让模型学会生成"更好的"回答
- 尝试调整 `num_generations`、`beta`、`epsilon` 等参数

---

## 阶段 9：Agent RL —— 工具调用强化学习

### 学习目标
理解如何训练模型使用外部工具（Agent能力）。

### 需要阅读的文件
- `trainer/train_agent.py` —— Agent RL训练
- `dataset/lm_dataset.py` 第226-252行 —— `AgentRLDataset` 类
- `scripts/eval_toolcall.py` —— 工具调用评估

### 核心概念

#### 9.1 什么是 Agent？
让 LLM 能够"使用工具"：调用计算器、查询天气、翻译等。

```
用户: "北京今天天气怎么样？"
LLM: 我来帮你查一下天气。
<tool_call
{"name": "get_current_weather", "arguments": {"location": "北京"}}
</tool_call
系统: {"temperature": "28°C", "condition": "晴"}
LLM: 北京今天天气晴朗，气温28°C，适合出行！
```

#### 9.2 多轮 Rollout（rollout_single 函数，第97-156行）
Agent RL 的核心是**多轮交互**：
1. 用户提问 → 模型生成回答
2. 解析工具调用 → 模拟执行工具 → 返回结果
3. 模型继续生成 → 直到不再调用工具或达到最大轮数

#### 9.3 Agent 的奖励计算
| 信号 | 分值 | 含义 |
|------|------|------|
| 工具对齐 | ±0.5×gap | 调用工具数量与GT的差距 |
| GT匹配 | 0~2.5 | 最终回答包含正确结果 |
| 标签格式 | -0.5×count | `<tool_call`/`</tool_call` 标签不匹配 |
| 未完成 | -0.5 | 达到最大轮数仍未完成 |

#### 9.4 工具定义
MiniMind 定义了6个模拟工具：
- `calculate_math`：数学计算
- `unit_converter`：单位换算
- `get_current_weather`：天气查询
- `get_current_time`：时间查询
- `get_exchange_rate`：汇率查询
- `translate_text`：文本翻译

### 实践建议
- 阅读 TOOLS 列表和 MOCK_RESULTS，理解工具的接口设计
- 思考：如何扩展新的工具？

---

## 阶段 10：模型推理与部署

### 学习目标
理解训练好的模型如何被使用和部署。

### 需要阅读的文件
- `eval_llm.py` —— 命令行推理
- `scripts/serve_openai_api.py` —— OpenAI兼容API服务
- `scripts/web_demo.py` —— Web聊天界面
- `scripts/chat_api.py` —— API客户端
- `scripts/convert_model.py` —— 模型格式转换

### 核心概念

#### 10.1 推理流程
```
1. 加载模型权重 → model.eval()
2. 用户输入 → tokenizer编码 → token IDs
3. model.generate() → 自回归生成
4. tokenizer解码 → 输出文本
```

#### 10.2 OpenAI 兼容 API（serve_openai_api.py）
使用 FastAPI 搭建一个兼容 OpenAI API 格式的服务：
- 端点：`POST /v1/chat/completions`
- 支持：流式输出（SSE）、工具调用、思考模式
- 可以直接用 OpenAI SDK 调用

#### 10.3 流式输出
- 使用 `TextStreamer` 实现逐token输出
- 自定义 `CustomStreamer` 将token推入队列
- 前端通过 SSE（Server-Sent Events）实时接收

#### 10.4 模型格式转换
- `convert_torch2transformers()`：将 MiniMind 的 `.pth` 权重转为 HuggingFace transformers 格式
- `convert_torch2transformers_minimind()`：转为自定义的 MiniMind transformers 格式
- `convert_merge_base_lora()`：合并 LoRA 权重到基础模型
- 支持 Qwen3 架构兼容，可以使用 vLLM 等推理框架加速

### 实践建议
- 运行 `python eval_llm.py` 与模型对话
- 启动 `serve_openai_api.py` 服务，用 `chat_api.py` 测试

---

## 阶段 11：训练工具与工程实践

### 学习目标
理解支撑训练的基础设施代码。

### 需要阅读的文件
- `trainer/trainer_utils.py` —— 训练工具函数

### 核心概念

#### 11.1 检查点管理（lm_checkpoint）
- **保存**：模型权重、优化器状态、epoch/step、scaler状态
- **加载**：自动检测最新检查点，恢复训练状态
- **GPU数量变化**：自动调整step数（适配从8卡切到1卡等场景）
- **原子写入**：先写 `.tmp` 文件，完成后 rename，防止中途崩溃导致损坏

#### 11.2 分布式训练（init_distributed_mode）
- 检测环境变量 `RANK` 判断是否进入DDP模式
- `NCCL` 后端用于GPU间通信
- `all_reduce` 同步梯度，`barrier` 同步进度

#### 11.3 奖励模型封装（LMForRewardModel）
```python
class LMForRewardModel:
    def get_score(self, messages, response):
        # 使用外部RM模型（如internlm2-1_8b-reward）给回答打分
        return score  # 范围 [-3.0, 3.0]
```

#### 11.4 SkipBatchSampler
支持从断点恢复训练时跳过已处理的batch。

### 实践建议
- 理解每个训练器共享的代码模式（9步流程：初始化→配置→模型→数据→优化器→恢复→编译→训练→清理）

---

## 附录 A：完整训练流程命令参考

```bash
# 第0步：训练分词器（可选，已提供）
python trainer/train_tokenizer.py

# 第1步：预训练
python trainer/train_pretrain.py

# 第2步：SFT微调
python trainer/train_full_sft.py --from_weight pretrain

# 第3步：LoRA微调（特定领域）
python trainer/train_lora.py --from_weight full_sft --data_path ../dataset/lora_medical.jsonl

# 第4步：知识蒸馏（可选）
python trainer/train_distillation.py --from_student_weight full_sft --from_teacher_weight full_sft --teacher_use_moe 1

# 第5步：DPO对齐
python trainer/train_dpo.py --from_weight full_sft

# 第6步：GRPO强化学习
python trainer/train_grpo.py --from_weight full_sft

# 第7步：PPO强化学习
python trainer/train_ppo.py --from_weight full_sft

# 第8步：Agent RL
python trainer/train_agent.py --from_weight full_sft

# 推理测试
python eval_llm.py --weight full_sft

# 启动API服务
python scripts/serve_openai_api.py --weight full_sft
```

---

## 附录 B：关键算法概念速查表

| 概念 | 通俗解释 | 项目中的位置 |
|------|----------|-------------|
| Transformer | 一种用注意力机制处理序列的神经网络 | `model_minimind.py` |
| Attention | 让模型关注输入中最重要的部分 | `model_minimind.py:91-134` |
| RoPE | 用旋转编码位置信息 | `model_minimind.py:62-84` |
| GQA | 多个Query头共享KV头，省显存 | `model_minimind.py:86-89` |
| MoE | 多个专家网络，每次只激活部分 | `model_minimind.py:148-176` |
| KV-Cache | 缓存之前的Key/Value加速推理 | `model_minimind.py:120-123` |
| RMSNorm | 比LayerNorm更高效的归一化 | `model_minimind.py:50-60` |
| LoRA | 低秩旁路，只训练极少参数 | `model_lora.py` |
| DPO | 直接用偏好数据训练，不需要RL | `train_dpo.py` |
| GRPO | 用组内相对奖励做RL，不需要Critic | `train_grpo.py` |
| PPO | 经典RL算法，需要Critic模型 | `train_ppo.py` |
| KL散度 | 衡量两个概率分布的差异 | 多处使用 |
| 交叉熵 | 衡量预测与真实的差异 | `model_minimind.py:252` |
| BPE | 字节对编码，一种分词算法 | `train_tokenizer.py` |

---

## 附录 C：推荐学习顺序总结

```
阶段0: Python + PyTorch基础
  ↓
阶段1: Tokenizer（文本→数字）
  ↓
阶段2: 模型架构（Transformer核心，最重要！）
  ↓
阶段3: 预训练（Next Token Prediction）
  ↓
阶段4: SFT（监督微调→对话能力）
  ↓
阶段5: LoRA（参数高效微调）
  ↓
阶段6: 知识蒸馏（大模型→小模型）
  ↓
阶段7: DPO（偏好对齐）
  ↓
阶段8: GRPO/PPO（强化学习）
  ↓
阶段9: Agent RL（工具调用）
  ↓
阶段10: 推理与部署
  ↓
阶段11: 工程实践（分布式、检查点等）
```

**给新手的建议**：
1. **不要一次读完所有代码**，按阶段循序渐进
2. **阶段2是重中之重**，花足够的时间理解模型架构
3. **动手实践**：修改参数、运行训练、观察变化
4. **遇到不懂的数学**，先记住结论，后面慢慢理解
5. **善用 print/断点**：在关键位置打印 tensor 的 shape，理解数据流动
