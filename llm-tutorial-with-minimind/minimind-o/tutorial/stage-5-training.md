# 阶段五：理解训练流程

> 目标文件：`trainer/train_sft_omni.py` + `trainer/trainer_utils.py` + `trainer/train.sh`
> 理解如何从零开始训练一个全模态模型。

---

## 5.1 训练脚本总体结构

```mermaid
graph TD
    A["train_sft_omni.py"] --> B["1. 初始化分布式环境<br>init_distributed_mode()"]
    B --> C["2. 加载配置<br>OmniConfig"]
    C --> D["3. 设置混合精度<br>bfloat16 / float16"]
    D --> E["4. 初始化模型<br>init_omni_model()"]
    E --> F["5. 创建数据集<br>OmniDataset"]
    F --> G["6. 创建优化器<br>AdamW"]
    G --> H["7. 恢复检查点（可选）"]
    H --> I["8. DDP 包装模型"]
    I --> J["9. 训练循环<br>train_epoch()"]

    style E fill:#e3f2fd
    style J fill:#fff3e0
```

---

## 5.2 训练模式详解

```mermaid
graph TD
    subgraph "mode='all'（全量训练）"
        A1["Thinker ✅ 可训练"]
        A2["Talker ✅ 可训练"]
        A3["AudioProj ✅ 可训练"]
        A4["VisionProj ✅ 可训练"]
    end

    subgraph "mode='audio_proj'（只训练音频投影器）"
        B1["Thinker ❌ 冻结"]
        B2["Talker ❌ 冻结"]
        B3["AudioProj ✅ 可训练"]
        B4["VisionProj ❌ 冻结"]
    end

    subgraph "mode='vision_proj'（只训练视觉投影器）"
        C1["Thinker ❌ 冻结"]
        C2["Talker ❌ 冻结"]
        C3["AudioProj ❌ 冻结"]
        C4["VisionProj ✅ 可训练"]
    end

    style A1 fill:#e8f5e9
    style A2 fill:#e8f5e9
    style A3 fill:#e8f5e9
    style A4 fill:#e8f5e9
    style B3 fill:#e8f5e9
    style C4 fill:#e8f5e9
```

### freeze_backbone 冻结策略

```mermaid
graph TD
    subgraph "freeze_backbone='none'"
        A["所有层都可训练"]
    end
    subgraph "freeze_backbone='all'"
        B["Thinker 所有层冻结<br>只训练 Talker 和投影器"]
    end
    subgraph "freeze_backbone='last1'"
        C["Thinker 前 7 层冻结<br>最后 1 层可训练"]
    end

    style A fill:#e8f5e9
    style B fill:#fff3e0
    style C fill:#e3f2fd
```

---

## 5.3 三阶段训练流水线

```mermaid
graph TD
    A["阶段 1: T2A<br>Text-to-Audio"] --> B["阶段 2: A2A Audio Proj<br>音频投影对齐"]
    B --> C["阶段 3: A2A Full<br>全量微调"]

    D["LLM 预训练权重"] --> A

    A -->|"学到什么"| E["Talker 能根据文本<br>生成语音"]
    B -->|"学到什么"| F["音频编码器的输出<br>能被 Thinker 理解"]
    C -->|"学到什么"| G["端到端语音对话<br>听音频 → 说音频"]

    style A fill:#e3f2fd
    style B fill:#fff3e0
    style C fill:#e8f5e9
```

### Mini 版本（单卡 3090，约 2 小时）

```mermaid
graph LR
    subgraph "阶段 1: T2A (~60 min)"
        A1["数据: sft_t2a_mini.parquet"]
        A2["lr: 5e-4"]
        A3["batch: 40"]
        A4["seq_len: 512"]
        A5["epoch: 1"]
    end

    subgraph "阶段 2: A2A Proj (~15 min)"
        B1["数据: sft_a2a_mini.parquet"]
        B2["lr: 5e-4"]
        B3["batch: 40"]
        B4["seq_len: 640"]
        B5["mode: audio_proj"]
    end

    subgraph "阶段 3: A2A Full (~15 min)"
        C1["数据: sft_a2a_mini.parquet"]
        C2["lr: 2e-5"]
        C3["batch: 16"]
        C4["seq_len: 768"]
        C5["mode: all"]
    end
```

### Full 版本（4 卡 GPU）

```mermaid
graph TD
    A["T2A (6 epochs)"] --> B["A2A audio_proj (1 epoch)"]
    B --> C["A2A full (3 epochs)"]
    C --> D["I2T vision_proj (1 epoch)"]
    D --> E["I2T full (1 epoch)"]
    E --> F["A2A full (1 epoch)"]
    F --> G["I2T vision_proj (1 epoch)"]

    style A fill:#e3f2fd
    style B fill:#e8f5e9
    style C fill:#e8f5e9
    style D fill:#f3e5f5
    style E fill:#f3e5f5
    style F fill:#fff3e0
    style G fill:#fff3e0
```

> Full 版本在 A2A 和 I2T 之间交替训练，实现多模态的联合优化。

---

## 5.4 损失函数详解

**位置**：`train_sft_omni.py:train_epoch()` 第 72-95 行

```mermaid
graph TD
    A["模型输出"] --> B["text_logits<br>(B, T, 6400)"]
    A --> C["audio_logits[0..7]<br>(B, T, 2112) × 8"]
    A --> D["aux_loss<br>(MoE 负载均衡)"]

    B --> E["Text Loss"]
    C --> F["Audio Loss"]
    D --> G["Aux Loss"]

    subgraph "Text Loss 计算"
        E1["CrossEntropyLoss(logits, labels)"]
        E2["只计算 labels ≠ -100 的位置<br>（即最后一个 assistant 回复）"]
        E1 --> E2
    end

    subgraph "Audio Loss 计算（每层）"
        F1["CrossEntropyLoss(logits_i, targets_i)"]
        F2["有效位置 mask: targets ≠ -100"]
        F3["stop token 权重 ×10<br>（target == 2050 时）"]
        F1 --> F2 --> F3
    end

    E --> H["total = text_loss + audio_loss/8 + aux_loss"]
    F --> H
    G --> H
    H --> I["÷ accumulation_steps"]

    style F3 fill:#fff3e0
    style H fill:#e8f5e9
```

### 为什么 stop token 权重 ×10？

```mermaid
graph LR
    A["普通音频码: ~2000 个"] --> B["权重 × 1"]
    C["stop token: ~1 个"] --> D["权重 × 10"]

    B --> E["如果不加权，模型可能忽略 stop<br>导致音频无限生成"]
    D --> F["加权后，模型非常重视 stop<br>学会在正确位置停止"]
```

### 为什么 audio_loss 除以 8？

```mermaid
graph LR
    A["8 层码本的损失相加"] --> B["如果不除以 8:<br>audio_loss >> text_loss<br>音频主导训练"]
    C["除以 8 后"] --> D["audio_loss ≈ text_loss<br>两者平衡"]
```

---

## 5.5 学习率调度

**位置**：`trainer_utils.py:get_lr()` 第 25-27 行

```mermaid
graph LR
    subgraph "余弦退火公式"
        A["lr × (0.1 + 0.45 × (1 + cos(π × step/total)))"]
    end
```

```mermaid
graph TD
    A["学习率曲线"] --> B["step=0: lr × 1.0<br>（最大学习率）"]
    B --> C["step=25%: lr × 0.85<br>（缓慢下降）"]
    C --> D["step=50%: lr × 0.55<br>（中期）"]
    D --> E["step=75%: lr × 0.25<br>（快速下降）"]
    E --> F["step=100%: lr × 0.1<br>（最小学习率）"]

    style B fill:#ffcdd2
    style F fill:#c8e6c9
```

> 学习率从 100% 平滑衰减到 10%，让模型在训练初期大胆探索，后期精细调整。

---

## 5.6 混合精度训练

```mermaid
graph LR
    subgraph "传统 FP32"
        A["参数: 4 bytes/个<br>计算慢，占内存多"]
    end
    subgraph "混合精度 BF16/FP16"
        B["参数: 2 bytes/个<br>计算快，省内存<br>用 GradScaler 防止精度丢失"]
    end

    A --> C["113M 模型 ~450MB"]
    B --> D["113M 模型 ~225MB"]
```

```mermaid
graph TD
    A["forward: BF16 计算"] --> B["loss: FP32"]
    B --> C["backward: BF16 梯度"]
    C --> D["GradScaler: 缩放梯度防下溢"]
    D --> E["optimizer.step: FP32 更新"]
```

---

## 5.7 梯度累积

```mermaid
graph TD
    subgraph "不使用累积 (accumulation_steps=1)"
        A1["batch=16 → 更新一次<br>等效 batch=16"]
    end

    subgraph "使用累积 (accumulation_steps=4)"
        B1["batch=16 → 累积梯度"]
        B2["batch=16 → 累积梯度"]
        B3["batch=16 → 累积梯度"]
        B4["batch=16 → 累积梯度"]
        B5["4 步后更新一次<br>等效 batch=64"]
    end

    B1 --> B2 --> B3 --> B4 --> B5

    style B5 fill:#e8f5e9
```

> 显存不够大时，用多次小 batch 模拟大 batch 的效果。

---

## 5.8 检查点保存与恢复

**位置**：`trainer_utils.py:omni_checkpoint()` 第 107-162 行

```mermaid
graph TD
    A["保存检查点"] --> B["排除冻结的 audio_encoder<br>和 vision_encoder"]
    B --> C["转为 half 精度<br>减小文件大小"]
    C --> D["先写临时文件 .tmp"]
    D --> E["重命名为最终文件<br>（原子操作，防中断损坏）"]

    F["保存的内容"] --> G["model 权重<br>optimizer 状态<br>epoch, step<br>scaler 状态<br>wandb_id"]

    style D fill:#fff3e0
    style E fill:#e8f5e9
```

### 恢复训练

```mermaid
graph TD
    A["检测 _resume.pth 文件"] --> B{文件存在？}
    B -->|是| C["加载模型权重"]
    C --> D["加载 optimizer 状态"]
    D --> E["恢复 epoch 和 step"]
    E --> F["从断点继续训练"]
    B -->|否| G["从头开始训练"]

    style F fill:#e8f5e9
```

---

## 5.9 Talker 初始化策略

**位置**：`trainer_utils.py:init_omni_model()` 第 81-89 行

```mermaid
graph TD
    A["加载 LLM 预训练权重"] --> B{"有权重中<br>包含 talker 层？"}
    B -->|是| C["直接加载<br>（已训练过的模型）"]
    B -->|否| D["从 Thinker 复制"]

    D --> E["Thinker Layer 4 → Talker Layer 0"]
    D --> F["Thinker Layer 5 → Talker Layer 1"]
    D --> G["Thinker Layer 6 → Talker Layer 2"]
    D --> H["Thinker Layer 7 → Talker Layer 3"]

    style D fill:#fff3e0
    style E fill:#f3e5f5
    style F fill:#f3e5f5
    style G fill:#f3e5f5
    style H fill:#f3e5f5
```

**为什么要复制后几层？**
- Thinker 的后几层已经学会了"理解语言"
- Talker 需要类似的能力来"理解要说什么"
- 比随机初始化收敛更快、效果更好

---

## 5.10 DDP（分布式数据并行）

```mermaid
graph TD
    subgraph "GPU 0"
        A0["模型副本 0"]
        B0["数据分片 0"]
        C0["梯度 0"]
    end

    subgraph "GPU 1"
        A1["模型副本 1"]
        B1["数据分片 1"]
        C1["梯度 1"]
    end

    subgraph "GPU 2"
        A2["模型副本 2"]
        B2["数据分片 2"]
        C2["梯度 2"]
    end

    subgraph "GPU 3"
        A3["模型副本 3"]
        B3["数据分片 3"]
        C3["梯度 3"]
    end

    C0 & C1 & C2 & C3 --> D["梯度 AllReduce<br>（平均所有 GPU 的梯度）"]
    D --> E["同步更新所有 GPU 的参数"]
```

> 每个 GPU 处理不同的数据分片，但共享同一份模型参数。梯度在所有 GPU 之间同步平均。

---

## 学习检查清单

- [ ] 三阶段训练流水线分别训练什么能力？
- [ ] `mode='audio_proj'` 时哪些参数被冻结？
- [ ] 为什么 audio_loss 要除以 8？
- [ ] stop token 为什么权重 ×10？
- [ ] 余弦退火学习率的变化趋势是什么？
- [ ] 混合精度训练为什么能加速？
- [ ] Talker 为什么从 Thinker 的后几层初始化？
- [ ] 检查点保存时为什么要排除冻结的编码器？

> 完成后进入阶段六，理解推理与评估！
