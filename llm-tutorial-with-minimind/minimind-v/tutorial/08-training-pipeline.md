# 第八阶段：训练流程详解

> 🎯 **目标**：理解从数据准备到模型训练的完整流程
> ⏰ **预计时间**：1 周
> 📌 **前提**：已完成第一至第七阶段

---

## 8.1 两阶段训练总览

```mermaid
flowchart TD
    Start["开始训练"] --> P{"是否需要 Pretrain？"}

    P -->|"是"| Pre["第一阶段: Pretrain<br/>基础图文对齐"]
    P -->|"否（可跳过）"| SFT

    Pre --> SFT["第二阶段: SFT<br/>指令微调"]
    SFT --> Done["训练完成"]

    subgraph "Pretrain 阶段"
        Pre1["数据: 127万条图文描述"]
        Pre2["冻结: 仅训练投影层 (freeze_llm=2)"]
        Pre3["学习率: 4e-4"]
        Pre4["输出: pretrain_vlm_768.pth"]
    end

    subgraph "SFT 阶段"
        SFT1["数据: 290万条混合数据"]
        SFT2["冻结: 投影层 + LLM首末层 (freeze_llm=1)"]
        SFT3["学习率: 5e-6"]
        SFT4["输出: sft_vlm_768.pth"]
    end
```

### 为什么 SFT 可以跳过 Pretrain？

```mermaid
flowchart LR
    A["SFT 数据 (290万)"] --> B{"包含 Pretrain 数据？"}
    B -->|"是！作为子集"| C["Pretrain 的 127 万条<br/>已包含在 SFT 的 290 万条中"]
    C --> D["所以可以跳过 Pretrain<br/>直接 SFT"]
```

---

## 8.2 数据详解

### 数据来源

所有数据来自 [ALLaVA-4V](https://huggingface.co/datasets/FreedomIntelligence/ALLaVA-4V) 系列：

```mermaid
flowchart TD
    subgraph "Pretrain 数据 (pretrain_i2t.parquet, ~127万条)"
        P1["ALLaVA-Caption-LAION 英/中<br/>~47万 + ~44万"]
        P2["ALLaVA-Caption-VFLAN 英/中<br/>~19万 + ~17万"]
    end
    subgraph "SFT 数据 (sft_i2t.parquet, ~290万条)"
        S1["ALLaVA-Instruct-LAION 英/中<br/>~47万 + ~47万"]
        S2["ALLaVA-Instruct-VFLAN 英/中<br/>~19万 + ~17万"]
        S3["Gemini/Claude 合成指令<br/>~5万"]
        S4["GPT-4o 迭代指令<br/>~5万"]
        S5["纯文本对话<br/>~23万"]
        S6["Pretrain caption 合并<br/>~127万"]
    end
```

### 数据格式

```
Parquet 文件列:
├── conversations: JSON 字符串
│   例: [{"role":"user","content":"<image>\n描述图片"},
│         {"role":"assistant","content":"这是一只金毛..."}]
│
└── image_bytes: 二进制 JPEG 数据
    例: <255, 216, 255, 224, ...>  (JPEG 文件头)
```

### 三种数据类型

```mermaid
flowchart TD
    A["SFT 数据 ~290万条"] --> B["图文问答 ~140万<br/>围绕图片的推理式问答"]
    A --> C["图文描述 ~127万<br/>'请描述这张图片'<br/>(Pretrain 数据合并)"]
    A --> D["纯文本对话 ~23万<br/>图像列填 8×8 黑图占位<br/>保持语言能力"]
```

> 为什么要混入纯文本对话？因为 SFT 数据中 92% 与图像有关，
> 如果没有纯文本数据，模型可能会"忘记"怎么做纯文本对话。

---

## 8.3 冻结策略详解

```mermaid
flowchart TD
    subgraph "MiniMind-V 参数分布"
        A["视觉编码器 SigLIP2<br/>~95M 参数<br/>❄️ 始终冻结"]
        B["投影层<br/>~1M 参数<br/>🔥 始终训练"]
        C["LLM 第0层<br/>🔥 或 ❄️"]
        D["LLM 第1-6层<br/>🔥 或 ❄️"]
        E["LLM 第7层<br/>🔥 或 ❄️"]
    end
```

| 策略 | 投影层 | LLM 首层 | LLM 中间层 | LLM 末层 | 用途 |
|------|--------|---------|-----------|---------|------|
| freeze_llm=0 | 🔥 | 🔥 | 🔥 | 🔥 | 全参训练 |
| freeze_llm=1 | 🔥 | 🔥 | ❄️ | 🔥 | **SFT 默认** |
| freeze_llm=2 | 🔥 | ❄️ | ❄️ | ❄️ | **Pretrain 默认** |

```mermaid
flowchart TD
    subgraph "freeze_llm=2 (Pretrain)"
        direction LR
        P1["投影层 🔥<br/>从零学习翻译"] --> P2["LLM ❄️<br/>完全不动"]
        P3["目标: 让投影层<br/>干净地完成图文对齐"]
    end
    subgraph "freeze_llm=1 (SFT)"
        direction LR
        S1["投影层 🔥<br/>继续优化"] --> S2["首层 🔥<br/>处理视觉融合"]
        S2 --> S3["中间层 ❄️<br/>保留语言知识"]
        S3 --> S4["末层 🔥<br/>优化输出格式"]
        S5["目标: 学会看图问答<br/>同时保留语言能力"]
    end
```

---

## 8.4 训练超参数对比

| 参数 | Pretrain | SFT | 为什么不同 |
|------|----------|-----|-----------|
| **learning_rate** | 4e-4 | 5e-6 | Pretrain 投影层随机初始化，需要大学习率；SFT 微调已有权重，需要小学习率 |
| **batch_size** | 16 | 4 | Pretrain 任务简单，可以大 batch；SFT 任务复杂（问答），需要小 batch |
| **max_seq_len** | 450 | 768 | Pretrain 主要是短描述；SFT 包含长对话 |
| **freeze_llm** | 2 | 1 | Pretrain 只对齐；SFT 需要微调部分 LLM |
| **数据量** | ~127万 | ~290万 | SFT 数据已包含 Pretrain |

---

## 8.5 训练循环逐步解析

```mermaid
stateDiagram-v2
    [*] --> Init: 初始化模型/数据/优化器
    Init --> LoadData: 从 DataLoader 取一个 batch
    LoadData --> MoveGPU: 数据移到 GPU
    MoveGPU --> UpdateLR: 更新学习率 (余弦退火)
    UpdateLR --> Forward: 前向传播 (混合精度)
    Forward --> Loss: 计算损失 = CE损失 + MoE辅助损失
    Loss --> Backward: 反向传播 (自动求导)
    Backward --> AccumGrad: 梯度累积
    AccumGrad --> CheckAccum: 累积够了吗?
    CheckAccum --> ClipGrad: 梯度裁剪 (max_norm=1.0)
    ClipGrad --> StepOptimizer: 更新参数
    StepOptimizer --> ZeroGrad: 清零梯度
    ZeroGrad --> CheckSave: 需要保存吗?
    CheckSave --> SaveModel: 每1000步保存
    SaveModel --> CheckEnd
    CheckSave --> CheckEnd: 继续训练
    CheckEnd --> LoadData: 还有数据
    CheckEnd --> [*]: Epoch 结束
```

### 关键代码对应

```python
# 对应: train_sft_vlm.py 第27-79行
for step, (input_ids, labels, pixel_values) in enumerate(loader):
    # Step 1: 数据 → GPU
    input_ids = input_ids.to(device)                                    # 第28行
    labels = labels.to(device)                                          # 第29行
    pixel_values = pixel_values.to(device)                              # 第30行

    # Step 2: 余弦学习率
    lr = get_lr(epoch * iters + step, args.epochs * iters, learning_rate)
    for param_group in optimizer.param_groups:
        param_group['lr'] = lr                                          # 第33-34行

    # Step 3: 前向传播（混合精度）
    with autocast_ctx:                                                  # 第36行
        res = model(input_ids, labels=labels, pixel_values=pixel_values)
        loss = (res.loss + res.aux_loss) / accumulation_steps           # 第38-39行

    # Step 4: 反向传播
    scaler.scale(loss).backward()                                       # 第41行

    # Step 5: 梯度累积 + 裁剪 + 更新
    if step % accumulation_steps == 0:
        scaler.unscale_(optimizer)                                      # 第44行
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)        # 第45行
        scaler.step(optimizer)                                          # 第47行
        scaler.update()                                                 # 第48行
        optimizer.zero_grad(set_to_none=True)                           # 第50行

    # Step 6: 日志
    if step % log_interval == 0:
        Logger(f'Epoch:[{epoch+1}/{epochs}]({step}/{iters}), loss: {loss:.4f}')

    # Step 7: 保存模型
    if step % save_interval == 0:
        torch.save(model.state_dict(), ckp_path)                        # 第73行
```

---

## 8.6 混合精度训练

```mermaid
flowchart LR
    subgraph "Float32 (传统)"
        A1["每个数: 32 位"]
        A2["精度: 高"]
        A3["速度: 慢"]
        A4["显存: 大"]
    end
    subgraph "BFloat16 (混合精度)"
        B1["每个数: 16 位"]
        B2["精度: 够用"]
        B3["速度: 快 2x"]
        B4["显存: 减半"]
    end
```

工作原理：

```mermaid
flowchart TD
    A["FP32 模型权重<br/>(主副本)"] --> B["BF16 前向传播<br/>(快速计算)"]
    B --> C["BF16 损失值"]
    C --> D["FP32 损失缩放<br/>(防止梯度下溢)"]
    D --> E["BF16 反向传播"]
    E --> F["FP32 梯度更新<br/>(保持精度)"]
    F --> A
```

---

## 8.7 断点续训

```mermaid
flowchart TD
    A["训练中... Step 5000"] --> B["💥 中断!"]
    B --> C["检查点已保存<br/>model + optimizer + epoch + step"]
    C --> D["重新启动训练<br/>--from_resume 1"]
    D --> E["加载检查点"]
    E --> F["恢复模型权重"]
    F --> G["恢复优化器状态"]
    G --> H["恢复 epoch 和 step"]
    H --> I["从 Step 5001 继续训练"]

    subgraph "自动处理 GPU 数量变化"
        J["保存时 4 GPU"] --> K["加载时 2 GPU"]
        K --> L["step 自动转换<br/>5000 × 4/2 = 10000"]
    end
```

---

## 8.8 自我检测

1. ✅ 为什么 Pretrain 的学习率比 SFT 大 80 倍？（投影层随机初始化 vs 微调已有权重）
2. ✅ SFT 数据为什么混入纯文本？（防止图文数据冲掉语言能力）
3. ✅ `freeze_llm=1` 解冻了哪些层？（投影层 + LLM 首末层）
4. ✅ 为什么要梯度裁剪？（防止梯度爆炸导致训练不稳定）
5. ✅ 断点续训保存了什么？（模型权重 + 优化器状态 + epoch/step + scaler）
