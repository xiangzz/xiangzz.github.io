# 阶段四：理解数据处理

> 目标文件：`dataset/omni_dataset.py`（约 345 行）
> 理解训练数据的格式和如何被处理成模型输入。

---

## 4.1 训练数据格式

数据存储在 Parquet 文件中，每条样本包含：

```mermaid
graph TD
    subgraph "一条训练样本"
        A["conversations<br>对话历史<br> [{role: user, content: '你好'},<br>  {role: assistant, content: '你好！'}]"]
        B["question_audios<br>用户语音（字节）<br> [bytes_1, bytes_2, ...]"]
        C["answer_audios<br>助手音频 Mimi 码<br> [code_0, code_1, ...]<br>（8 层交错排列）"]
        D["image_bytes<br>图片（字节）<br> [bytes]"]
        E["ref_audios<br>参考音频 Mimi 码<br>（声音克隆用）"]
        F["spk_emb<br>说话人嵌入<br>（192 维向量）"]
    end

    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style C fill:#f3e5f5
```

### answer_audios 的交错编码

```mermaid
graph LR
    subgraph "answer_audios (一维数组)"
        A["c₀₀, c₁₀, c₂₀, c₃₀, c₄₀, c₅₀, c₆₀, c₇₀,<br>c₀₁, c₁₁, c₂₁, c₃₁, c₄₁, c₅₁, c₆₁, c₇₁,<br>..."]
    end

    subgraph "解析为 8 层"
        B["层0: c₀₀, c₀₁, c₀₂, ..."]
        C["层1: c₁₀, c₁₁, c₁₂, ..."]
        D["层2: c₂₀, c₂₁, c₂₂, ..."]
        E["..."]
        F["层7: c₇₀, c₇₁, c₇₂, ..."]
    end

    A --> B & C & D & E & F
```

> 每 8 个连续整数分别属于 8 个码本层，加上 `audio_stop_token=2050` 作为结束标记。

---

## 4.2 数据处理流水线

```mermaid
graph TD
    A["Parquet 文件"] --> B["随机截断对话轮次"]
    B --> C["加载图像（最后一个 user）"]
    B --> D["加载音频（最后一个 user）"]
    B --> E["获取参考音频和说话人嵌入"]

    D --> D1["augment_wav()<br>音频增强"]
    D1 --> D2["SenseVoice 提取 fbank"]
    D2 --> D3["augment_mel()<br>频谱增强"]

    C --> C1["SigLIP2 预处理"]

    B --> F["create_chat_prompt()<br>生成对话文本"]

    F --> G["Tokenizer 编码"]

    E --> H["解析 8 层音频码"]

    G --> I["generate_text_labels()<br>生成文本标签（mask）"]

    H --> J["填充 8 层音频目标"]

    I & J --> K["构建 9 通道输入张量<br>(9, T) = 8 音频 + 1 文本"]

    K --> L["apply_scheduled_sampling()<br>5% 概率随机替换 token"]

    L --> M["返回: input_ids, text_labels,<br>audio_labels, audio_inputs,<br>audio_len, pixel_values, spk_emb"]

    style D1 fill:#fff3e0
    style D3 fill:#fff3e0
```

---

## 4.3 音频增强详解

**位置**：`omni_dataset.py` 第 89-121 行

```mermaid
graph TD
    A["原始音频波形"] --> B{"随机变速?<br>50%"}
    B -->|是| C["速度 ×0.7~1.6<br>模拟不同语速"]
    B -->|否| D["跳过"]
    C --> E{"加高斯噪声?<br>30%"}
    D --> E
    E -->|是| F["叠加白噪声<br>模拟录音环境"]
    E -->|否| G["跳过"]
    F --> H{"音量缩放?<br>30%"}
    G --> H
    H -->|是| I["振幅 ×0.8~1.2<br>模拟音量变化"]
    H -->|否| J["跳过"]
    I --> K{"时间掩蔽?<br>20%"}
    J --> K
    K -->|是| L["0.25秒片段置零<br>模拟丢包"]
    K -->|否| M["跳过"]
    L --> N{"低通滤波?<br>20%"}
    M --> N
    N -->|是| O["移动平均模糊<br>模拟电话音质"]
    N -->|否| P["跳过"]
    O --> Q{"混响?<br>30%"}
    P --> Q
    Q -->|是| R["指数衰减脉冲响应<br>模拟房间回声"]
    Q -->|否| S["跳过"]
    R --> T{"粉红噪声?<br>20%"}
    S --> T
    T -->|是| U["1/f 噪声叠加<br>模拟环境底噪"]
    T -->|否| V["跳过"]
    U --> W["clip(-1, 1) → 输出"]
    V --> W

    style C fill:#fff3e0
    style F fill:#fff3e0
    style I fill:#fff3e0
    style L fill:#fff3e0
    style O fill:#fff3e0
    style R fill:#fff3e0
    style U fill:#fff3e0
```

**为什么需要数据增强？** 训练数据有限，通过模拟各种真实环境下的音频变化，让模型更鲁棒。

---

## 4.4 频谱增强详解

**位置**：`omni_dataset.py` 第 123-136 行

```mermaid
graph TD
    A["fbank 特征<br>(T, 560)"] --> B{"频率掩蔽?<br>50%"}
    B -->|是| C["随机遮蔽 1~64 个频率 bin<br>防止对特定频段过拟合"]
    B -->|否| D["跳过"]
    C --> E{"时间掩蔽?<br>50%"}
    D --> E
    E -->|是| F["随机遮蔽 1~10 帧<br>提升对不完整输入的容错"]
    E -->|否| G["输出"]
    F --> G

    style C fill:#fff3e0
    style F fill:#fff3e0
```

```mermaid
graph LR
    subgraph "频率掩蔽示例"
        A1["████████████████"] --> A2["████░░░░░░████████<br>遮蔽中间 5 个 bin"]
    end
    subgraph "时间掩蔽示例"
        B1["帧1 帧2 帧3 帧4 帧5"] --> B2["帧1 帧2 ░░░░ 帧5<br>遮蔽中间 3 帧"]
    end
```

---

## 4.5 对话提示构造

**位置**：`omni_dataset.py` 第 155-176 行

```mermaid
graph TD
    A["conversations 列表"] --> B["pre_processing_chat()<br>20% 概率添加系统提示"]
    B --> C["遍历每轮对话"]

    C --> D{"是最后一个 user<br>且有音频?"}
    D -->|"40%<br>只用音频"| E["content = audio_pad × N"]
    D -->|"20%<br>只用文本"| F["content = 原始文本"]
    D -->|"20%<br>音频+文本"| G["content = audio_pad + '\\n\\n' + text"]
    D -->|"20%<br>文本+音频"| H["content = text + '\\n\\n' + audio_pad"]

    C --> I{"文本中有 image?"}
    I -->|"20%"| J["image + '\\n' + text"]
    I -->|"20%"| K["image + '\\n\\n' + text"]
    I -->|"20%"| L["text + '\\n' + image"]
    I -->|"20%"| M["text + '\\n\\n' + image"]

    E & F & G & H --> N["apply_chat_template<br>ChatML 格式化"]
    J & K & L & M --> N
    N --> O["post_processing_chat()<br>20% 概率去除空思考块"]
    O --> P["最终 prompt 字符串"]
```

> 音频和图像的位置随机化是一种数据增强，让模型学会在不同输入排列下都能工作。

---

## 4.6 标签生成

**位置**：`omni_dataset.py` 第 179-197 行

```mermaid
graph TD
    subgraph "输入序列"
        A["<im_start>system...<im_end><im_start>user你好<im_end><im_start>assistant你好！有什么帮你？<im_end>"]
    end

    subgraph "文本标签"
        B["-100  -100  -100  ...  -100  -100  -100  ...  你好！有什么帮你？<im_end>"]
        note["-100 = 不计算损失<br>只有最后一个 assistant 回复参与损失计算"]
    end

    A --> B

    style B fill:#ffcdd2
    note --> B
```

**为什么只训练最后一个 assistant 回复？**
- 前面的轮次是上下文，不是当前要学习的内容
- 只学习"根据对话历史，生成当前回复"的能力

---

## 4.7 9 通道输入张量构造 ★★★

**位置**：`omni_dataset.py` 第 320-329 行

这是最关键的数据构造步骤：

```mermaid
graph TD
    subgraph "9 通道输入 input_ids: (9, T-1)"
        A["通道 0: 码本层 0 的输入（左移 1 位）"]
        B["通道 1: 码本层 1 的输入（左移 1 位）"]
        C["通道 2: 码本层 2 的输入（左移 1 位）"]
        D["通道 3: 码本层 3 的输入（左移 1 位）"]
        E["通道 4: 码本层 4 的输入（左移 1 位）"]
        F["通道 5: 码本层 5 的输入（左移 1 位）"]
        G["通道 6: 码本层 6 的输入（左移 1 位）"]
        H["通道 7: 码本层 7 的输入（左移 1 位）"]
        I["通道 8: 文本 token 的输入（左移 1 位）"]
    end

    subgraph "对应的目标"
        J["audio_labels: (8, T-1)<br>每层码本的下一个 code<br>-100 表示不计算损失"]
        K["text_labels: (T-1,)<br>下一个文本 token<br>-100 表示不计算损失"]
    end

    A --> J
    I --> K
```

### 具体例子

假设对话是：`<user>你好</user><assistant>你好呀！</assistant>`

```mermaid
graph TD
    subgraph "文本通道 (通道 8)"
        direction LR
        T["位置: 0   1   2   3   4   5   6   7   8   9   10"]
        T2["输入: <|im_start|> system 你好 <|im_end|> <|im_start|> asst 你好 呀 ！"]
        T3["标签: -100 -100 -100 -100 -100 -100 你好 呀 ！ <|im_end|>"]
    end

    subgraph "音频通道 (通道 0-7)"
        direction LR
        A["位置: 0~6: pad"]
        A2["位置 7: spk_token (或 ref_codes)"]
        A3["位置 8+: target codes (参与 loss)"]
    end
```

### 音频目标填充细节

```mermaid
graph TD
    subgraph "时间轴（assistant 区域）"
        A["think_end 之前<br>音频 = pad (2049)<br>标签 = -100"]
        B["think_end 位置<br>spk_token (2051)<br>标签 = -100"]
        C["ref_codes 区域<br>参考音频码<br>标签 = -100"]
        D["target 区域<br>实际音频码<br>标签 = 对应的码 ← 参与 loss"]
        E["stop_token<br>2050<br>标签 = 2050 ← 参与 loss"]
    end

    A --> B --> C --> D --> E

    style D fill:#e8f5e9
    style E fill:#e8f5e9
```

> 注意第 i 层码本的 target 从 `assistant_start + i + 1` 位置开始，实现了交错延迟。

---

## 4.8 Scheduled Sampling

**位置**：`omni_dataset.py` 第 199-209 行

```mermaid
graph TD
    A["正常输入: [100, 450, 890, 23, ...]"] --> B{"5% 概率"}
    B -->|"95%"| C["保持不变"]
    B -->|"5%"| D["随机替换: [387, 12, 1500, 2048, ...]"]

    C --> E["模型学习从正确历史预测"]
    D --> F["模型学习从错误历史恢复<br>（提高鲁棒性）"]

    style D fill:#fff3e0
    style F fill:#e8f5e9
```

> 类似于老师偶尔故意写错答案让学生纠正，训练模型"纠错"的能力。

---

## 4.9 collate_fn（批次整理）

**位置**：`trainer/train_sft_omni.py` 第 24-48 行

```mermaid
graph TD
    subgraph "批次中的多个样本"
        S1["样本 1: audio (1, 50, 560)<br>image (1, 3, 256, 256)"]
        S2["样本 2: audio (1, 80, 560)<br>image None"]
        S3["样本 3: audio None<br>image (1, 3, 256, 256)"]
    end

    subgraph "collate 后"
        O1["input_ids: (3, 9, T)<br>已 stack"]
        O2["audio_inputs: (2, max_80, 560)<br>pad 到最长"]
        O3["pixel_values: (2, 3, 256, 256)<br>只拼接有效的"]
    end

    S1 --> O1 & O2 & O3
    S2 --> O1 & O2
    S3 --> O1
```

> 不同样本的音频长度不同，需要 pad 到同一个长度才能组成 batch。

---

## 学习检查清单

- [ ] 你能说出训练数据的 6 个字段分别是什么吗？
- [ ] `augment_wav()` 包含了哪些增强方法？各有何作用？
- [ ] 为什么音频和图像的位置在 prompt 中是随机的？
- [ ] 9 通道输入张量中每个通道代表什么？
- [ ] 为什么音频目标从 `think_end` 之后才开始？
- [ ] Scheduled Sampling 的目的是什么？
- [ ] 为什么只有最后一个 assistant 回复参与损失计算？

> 完成后进入阶段五，理解训练流程！
