# 阶段三：理解全模态模型（Thinker + Talker）

> 目标文件：`model/model_omni.py`（约 462 行，最核心的文件）
> 建议反复阅读 3 遍以上。

---

## 3.1 总览：Thinker-Talker 双路径架构

```mermaid
graph TD
    subgraph "输入侧"
        I1["文本 Token"]
        I2["音频 Waveform"]
        I3["图像 Image"]
        I4["说话人嵌入"]
    end

    subgraph "编码器（冻结）"
        E1["Tokenizer"]
        E2["SenseVoice<br>234M params"]
        E3["SigLIP2<br>94.5M params"]
        E4["CAM++<br>192 维"]
    end

    subgraph "投影器（可训练）"
        P1["直接 Embedding"]
        P2["MMAudioProjector<br>512→768"]
        P3["MMVisionProjector<br>768→768"]
    end

    subgraph "核心模型（可训练）"
        T1["Thinker<br>8 层 Transformer<br>~63.9M params"]
        T2["Bridge Layer<br>第 3 层隐藏状态"]
        T3["Talker<br>4 层 Transformer<br>~47.0M params"]
    end

    subgraph "输出侧"
        O1["lm_head → 文本 logits<br>(B, T, 6400)"]
        O2["TalkerHead → 8 层音频 logits<br>(B, T, 2112) × 8"]
    end

    I1 --> E1 --> P1 --> T1
    I2 --> E2 --> P2 --> T1
    I3 --> E3 --> P3 --> T1

    T1 --> O1
    T1 -->|"bridge_states"| T2
    T2 -->|"embed_proj"| T3
    I4 -->|"spk_proj"| T3
    T3 --> O2

    style T1 fill:#e3f2fd,stroke:#1565c0,stroke-width:3px
    style T3 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    style T2 fill:#fff3e0,stroke:#e65100,stroke-width:3px
```

---

## 3.2 OmniConfig（全模态配置）

**位置**：`model_omni.py` 第 10-29 行

```mermaid
graph TD
    subgraph "从 MiniMindConfig 继承"
        A["hidden_size = 768"]
        B["num_hidden_layers = 8"]
        C["vocab_size = 6400"]
        D["num_attention_heads = 8"]
    end

    subgraph "OmniConfig 新增"
        E["num_talker_hidden_layers = 4"]
        F["talker_hidden_size = 768"]
        G["audio_vocab_size = 2112"]
        H["audio_hidden_size = 512"]
        I["image_hidden_size = 768"]
        J["image_token_len = 64"]
        K["spk_emb_size = 192"]
        L["bridge_layer = 3"]
        M["audio_pad_token = 2049"]
        N["audio_stop_token = 2050"]
        O["audio_spk_token = 2051"]
    end

    style E fill:#f3e5f5
    style L fill:#fff3e0
```

**`bridge_layer = 3` 的含义**：从 Thinker 的第 3 层（共 8 层，索引 0-7）提取隐藏状态传给 Talker。选中间层是因为：
- 太浅（前几层）：语义信息不足
- 太深（最后层）：信息已过度适配文本生成任务

---

## 3.3 模态投影器

### MMAudioProjector（音频投影器）

**位置**：`model_omni.py` 第 31-41 行

```mermaid
graph LR
    A["SenseVoice 输出<br>(T, 512)"] --> B["LayerNorm(512)"]
    B --> C["Linear(512, 768)"]
    C --> D["GELU 激活"]
    D --> E["Linear(768, 768)"]
    E --> F["投影后特征<br>(T, 768)"]

    style A fill:#e3f2fd
    style F fill:#e8f5e9
```

### MMVisionProjector（视觉投影器）

结构完全相同，只是输入维度不同：SigLIP2 输出 768 维，投影后还是 768 维。

---

## 3.4 TalkerHead（8 码本输出头）

**位置**：`model_omni.py` 第 57-65 行

```mermaid
graph TD
    A["输入 x<br>(B, T, 768)"] --> B["base: Linear(768, 2112)<br>共享基座"]

    A --> C["adapter_0<br>Linear(768,256)→GELU→Linear(256,2112)"]
    A --> D["adapter_1<br>Linear(768,256)→GELU→Linear(256,2112)"]
    A --> E["..."]
    A --> F["adapter_7<br>Linear(768,256)→GELU→Linear(256,2112)"]

    B --> G["base_out"]
    C --> H["+ adapter_0_out"]
    D --> I["+ adapter_1_out"]
    E --> J["..."]
    F --> K["+ adapter_7_out"]

    G --> L["输出: 8 个 logits<br>每个 (B, T, 2112)"]

    style B fill:#e3f2fd
    style C fill:#f3e5f5
```

**为什么要共享 + 适配器？**

```mermaid
graph LR
    subgraph "方案A: 8个独立输出头"
        A["8 × Linear(768, 2112)"]
        B["参数量: 8 × 1.6M = 12.8M"]
    end
    subgraph "方案B: 共享+适配器 ← 本项目"
        C["1 × base(768, 2112) = 1.62M<br>+ 8 × adapter(768,256,2112) = 8 × 0.74M"]
        D["参数量: 1.62M + 5.9M = 7.5M<br>省约40%参数"]
    end
```

8 层码本预测的内容高度相关（都是同一句话的音频），所以大部分参数可以共享。

---

## 3.5 TalkerEmbedding（8 码本输入嵌入）

**位置**：`model_omni.py` 第 68-76 行

```mermaid
graph TD
    A["输入: 8 个码本 ID<br>shape: (B, 8, T)"] --> B["base: Embedding(2112, 768)"]

    A --> C["adapter_0: Embed+GELU+Linear"]
    A --> D["adapter_1: Embed+GELU+Linear"]
    A --> E["..."]
    A --> F["adapter_7: Embed+GELU+Linear"]

    B --> G["base_out_i (per layer)"]
    C --> H["+ adapter_0_out"]
    D --> I["+ adapter_1_out"]
    E --> J["..."]
    F --> K["+ adapter_7_out"]

    G --> L["8 个嵌入向量求平均<br>/ 8"]
    H --> L
    I --> L
    J --> L
    K --> L

    L --> M["输出: (B, T, 768)"]
```

---

## 3.6 TalkerModule（Talker 子模型）

**位置**：`model_omni.py` 第 88-102 行

```mermaid
graph TD
    subgraph "TalkerModule 组件"
        A["4 × MiniMindBlock<br>(Talker 的 Transformer 层)"]
        B["TalkerHead<br>(8 码本输出)"]
        C["TalkerEmbedding<br>(8 码本输入)"]
        D["codec_proj<br>Linear→GELU→Linear→RMSNorm"]
        E["embed_proj<br>Linear→GELU→Linear→RMSNorm"]
        F["text_scale (可学习, 初始 3.0)"]
        G["audio_scale (可学习, 初始 1.0)"]
        H["spk_proj<br>Linear(192, 768)"]
        I["RoPE 频率缓冲"]
    end

    style F fill:#fff3e0
    style G fill:#fff3e0
```

**Talker 初始化策略**：

```mermaid
graph LR
    subgraph "Thinker (8 层)"
        T0["Layer 0"]
        T1["Layer 1"]
        T2["Layer 2"]
        T3["Layer 3 ← bridge"]
        T4["Layer 4"]
        T5["Layer 5"]
        T6["Layer 6"]
        T7["Layer 7"]
    end

    subgraph "Talker (4 层)"
        A0["Layer 0"]
        A1["Layer 1"]
        A2["Layer 2"]
        A3["Layer 3"]
    end

    T4 -->|"复制权重"| A0
    T5 -->|"复制权重"| A1
    T6 -->|"复制权重"| A2
    T7 -->|"复制权重"| A3

    style T4 fill:#e3f2fd
    style T5 fill:#e3f2fd
    style T6 fill:#e3f2fd
    style T7 fill:#e3f2fd
    style A0 fill:#f3e5f5
    style A1 fill:#f3e5f5
    style A2 fill:#f3e5f5
    style A3 fill:#f3e5f5
```

> Thinker 后 4 层已有较强的语言理解能力，直接复制给 Talker 作为初始化，比随机初始化效果好很多。

---

## 3.7 MiniMindOmni.forward() ★★★ 核心中的核心

**位置**：`model_omni.py` 第 245-316 行

### 完整数据流

```mermaid
graph TD
    subgraph "Step 1: 解析输入"
        A["input_ids (9, T)"] --> B["text_ids = input_ids[8]<br>音频 ids = input_ids[0:8]"]
    end

    subgraph "Step 2: Thinker 文本处理"
        C["text_ids → Embedding<br>(B, T, 768)"]
        C --> D{"有音频输入?"}
        D -->|是| E["encode_audio_inputs<br>SenseVoice → AudioProj"]
        D -->|否| F["跳过"]
        E --> G["inject_audio_features<br>替换 audio_pad 位置"]
        F --> G
        G --> H{"有图像输入?"}
        H -->|是| I["encode_image_inputs<br>SigLIP2 → VisionProj"]
        H -->|否| J["跳过"]
        I --> K["count_vision_proj<br>替换 image_pad 位置"]
        J --> K
    end

    subgraph "Step 3: Thinker 前向传播"
        K --> L["8 层 Transformer"]
        L --> M["bridge_states = 第3层输出"]
        L --> N["h_thinker = 最终层输出"]
        N --> O["lm_head → text_logits<br>(B, T, 6400)"]
    end

    subgraph "Step 4: Talker 输入准备"
        P["audio_ids → TalkerEmbedding<br>(B, T, 768)"]
        M --> Q["embed_proj(bridge_states)<br>× text_scale"]
        P --> R["codec_proj(talker_emb)<br>× audio_scale"]
        Q --> S["相加融合"]
        R --> S
        S --> T["注入 speaker embedding<br>到 audio_spk 位置"]
    end

    subgraph "Step 5: Talker 前向传播"
        T --> U["4 层 Transformer"]
        U --> V["TalkerHead → 8 × audio_logits<br>每个 (B, T, 2112)"]
    end

    style L fill:#e3f2fd,stroke:#1565c0,stroke-width:3px
    style U fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    style M fill:#fff3e0,stroke:#e65100,stroke-width:3px
```

### 音频特征注入机制

```mermaid
graph TD
    subgraph "原始隐藏状态序列"
        A["你"] --> B["好"]
        C["audio_pad"] --> D["audio_pad"] --> E["audio_pad"]
        F["吗"]
    end

    subgraph "注入后"
        A2["你"] --> B2["好"]
        C2["音频特征_1"] --> D2["音频特征_2"] --> E2["音频特征_3"]
        F2["吗"]
    end

    C -->|"替换"| C2
    D -->|"替换"| D2
    E -->|"替换"| E2

    style C fill:#ffcdd2
    style D fill:#ffcdd2
    style E fill:#ffcdd2
    style C2 fill:#c8e6c9
    style D2 fill:#c8e6c9
    style E2 fill:#c8e6c9
```

### Talker 输入融合公式

```
talker_input = embed_proj(bridge_states) × text_scale + codec_proj(audio_embeddings) × audio_scale
```

```mermaid
graph LR
    A["bridge_states<br>(Thinker 第3层)"] -->|"embed_proj<br>768→768"| B["× text_scale=3.0"]
    C["audio_embeddings<br>(8 码本嵌入平均)"] -->|"codec_proj<br>768→768"| D["× audio_scale=1.0"]

    B --> E["+ 相加"]
    D --> E
    E --> F["talker_input<br>(B, T, 768)"]

    style B fill:#e3f2fd
    style D fill:#f3e5f5
    style F fill:#e8f5e9
```

> 初始时文本信号更强（3.0），因为语义理解是基础；音频信号辅助（1.0）。这两个 scale 是可学习的，训练过程中模型会自动调整比例。

---

## 3.8 stream_generate() ★★★ 流式生成

**位置**：`model_omni.py` 第 326-395 行

### 生成流程

```mermaid
sequenceDiagram
    participant Prompt as 输入 Prompt
    participant Thinker as Thinker (文本生成)
    participant Talker as Talker (音频生成)
    participant Output as 流式输出

    Prompt->>Thinker: 首次 forward
    Thinker-->>Thinker: 捕获 bridge_states
    Thinker-->>Output: yield (text_token_1, None)

    Note over Thinker: 自回归循环开始
    Thinker->>Thinker: forward (新 token)
    Thinker-->>Talker: bridge_states 更新
    Thinker-->>Output: yield (text_token_2, audio_0)

    Note over Talker: 码本层 0 开始生成
    Thinker->>Thinker: forward
    Thinker-->>Output: yield (text_token_3, [audio_0, audio_1])

    Note over Talker: 码本层 0,1 生成

    Thinker->>Thinker: forward (EOS)
    Thinker-->>Output: yield (EOS, [audio_0,..,audio_7])

    Note over Talker: 所有 8 层都在生成

    Thinker->>Output: text_finished=True
    Output->>Output: 继续输出纯音频帧
    Talker-->>Output: yield (None, audio_frame)

    Note over Output: 所有 8 层发出 stop → 结束
```

### 交错延迟机制（Staggered Delay）

```mermaid
graph TD
    subgraph "时间步 →"
        direction LR
        T["t0   t1   t2   t3   t4   t5   t6   t7   t8   t9"]
    end

    subgraph "文本生成"
        TEXT[" 你    好    吗   我   很   好   EOS  -    -    -"]
    end

    subgraph "码本层 0"
        L0[" -    a₀   a₁   a₂   a₃   a₄   a₅   a₆   a₇   stop"]
    end

    subgraph "码本层 1"
        L1[" -    -    a₀   a₁   a₂   a₃   a₄   a₅   a₆   a₇"]
    end

    subgraph "码本层 2"
        L2[" -    -    -    a₀   a₁   a₂   a₃   a₄   a₅   a₆"]
    end

    subgraph "...  "
        L3[" ...  ...  ...  ...  ...  ...  ...  ...  ...  ..."]
    end

    subgraph "码本层 7"
        L7[" -    -    -    -    -    -    -    -    a₀   a₁"]
    end

    style TEXT fill:#e3f2fd
    style L0 fill:#f3e5f5
    style L1 fill:#f3e5f5
    style L2 fill:#f3e5f5
    style L7 fill:#f3e5f5
```

> 第 i 层码本从第 i 步开始生成。这样低层（基本音调）先开始，高层（细节）后开始，形成自然的延迟结构。

### 完整的一帧音频输出

当 `audio_step >= 7` 时，可以从 8 个码本中各取一个码，组成一帧：

```mermaid
graph LR
    subgraph "一帧音频 (8 层码本)"
        A["层0: code_120"]
        B["层1: code_450"]
        C["层2: code_890"]
        D["层3: code_23"]
        E["层4: code_567"]
        F["层5: code_334"]
        G["层6: code_12"]
        H["层7: code_789"]
    end

    A & B & C & D & E & F & G & H --> I["Mimi Decoder<br>→ 24kHz 波形<br>→ 约 80ms 音频"]
```

---

## 3.9 SileroVAD 与 RealtimeSession

**位置**：`model_omni.py` 第 398-462 行

### 语音活动检测（VAD）

```mermaid
sequenceDiagram
    participant Mic as 麦克风
    participant VAD as SileroVAD
    participant Session as RealtimeSession

    Mic->>VAD: 音频块 (1024 samples)
    VAD->>VAD: 计算语音概率
    VAD-->>Session: prob = 0.92

    Mic->>VAD: 音频块
    VAD-->>Session: prob = 0.05

    Mic->>VAD: 音频块
    VAD-->>Session: prob = 0.88

    Note over Session: speech_samples >= min_speech<br>→ speaking = True
    Note over Session: silence_samples >= min_silence<br>→ 返回 'speech_end'
```

### RealtimeSession 状态机

```mermaid
stateDiagram-v2
    [*] --> Listening
    Listening --> Speaking: 语音概率 > 阈值<br>且持续 >= min_speech
    Speaking --> Speaking: 继续检测到语音
    Speaking --> SpeechEnd: 静音 >= min_silence<br>返回 'speech_end'
    SpeechEnd --> Listening: 重置状态

    Speaking --> Interrupt: generating=True 时<br>检测到新语音<br>返回 'interrupt'

    Listening --> Listening: 无语音，存入环形缓冲
```

---

## 3.10 参数量统计

```mermaid
graph TD
    subgraph "可训练参数 (~113M)"
        A["Thinker: 63.91M"]
        B["Talker: 47.05M"]
        C["AudioProj: 0.99M"]
        D["VisionProj: 1.18M"]
    end

    subgraph "冻结参数 (~425M)"
        E["SenseVoice: 234M"]
        F["SigLIP2: 94.5M"]
        G["Mimi: 96.15M"]
    end

    A --> TOTAL["总可训练: ~113M<br>（可以在单卡 3090 上训练）"]

    style A fill:#e3f2fd
    style B fill:#f3e5f5
```

---

## 学习检查清单

- [ ] 你能画出 Thinker-Talker 双路径的数据流吗？
- [ ] `bridge_layer` 为什么选第 3 层？
- [ ] 音频特征是如何"注入"到文本序列中的？
- [ ] `text_scale` 和 `audio_scale` 的初始值为什么不同？
- [ ] TalkerHead 为什么用共享基座 + 适配器？
- [ ] 交错延迟的码本生成是怎么工作的？
- [ ] 一帧音频由几个码组成？解码后是多长时间的音频？

> 完成后进入阶段四，看看训练数据是如何准备的！
