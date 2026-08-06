# 阶段六：理解推理与评估

> 目标文件：`eval_omni.py`（约 244 行）
> 理解模型如何从磁盘加载到生成输出的完整流程。

---

## 6.1 评估脚本总体结构

```mermaid
graph TD
    A["eval_omni.py"] --> B["init_model()<br>加载模型和分词器"]
    B --> C["根据 mode 参数<br>选择评估模式"]

    C --> D["mode 0: 文本 → {文本, 音频}"]
    C --> E["mode 1: 多轮对话"]
    C --> F["mode 2: 音频 → {文本, 音频}"]
    C --> G["mode 3: 声音克隆"]
    C --> H["mode 4: 图像 → {文本, 音频}"]
    C --> I["mode 5: 混合输入"]

    style B fill:#e3f2fd
    style C fill:#fff3e0
```

---

## 6.2 模型加载流程

**位置**：`eval_omni.py:init_model()` 第 17-40 行

```mermaid
graph TD
    A["init_model(args)"] --> B{"load_from 路径包含<br>'model'?"}

    B -->|"是: 原生 PyTorch 格式"| C["创建 OmniConfig"]
    C --> D["创建 MiniMindOmni 实例"]
    D --> E["load_state_dict(.pth 文件)"]
    E --> F["加载 SenseVoice 编码器"]
    F --> G["加载 SigLIP2 编码器"]

    B -->|"否: HuggingFace 格式"| H["AutoModelForCausalLM<br>.from_pretrained()"]
    H --> I["加载 SenseVoice 编码器"]
    I --> J["加载 SigLIP2 编码器"]

    G --> K["加载 Mimi 解码器"]
    J --> K
    K --> L["model.half().eval().to(device)"]

    style L fill:#e8f5e9
```

> 支持 PyTorch 原生格式和 HuggingFace Transformers 格式两种加载方式。

---

## 6.3 六种评估模式详解

### Mode 0：文本对话

```mermaid
sequenceDiagram
    participant User as 用户
    participant Model as MiniMind-O
    participant Mimi as Mimi 解码器
    participant File as 文件系统

    User->>Model: "告诉我一个关于太空的有趣事实。"
    Model->>Model: Thinker 理解文本
    Model->>Model: Thinker 生成文本 token
    Model->>Model: Talker 生成音频码
    Model-->>User: 流式文本: "太阳的体积..."
    Model-->>Mimi: 8 层音频码
    Mimi-->>File: 24kHz WAV → MP3

    Note over User,File: 同时输出文本和音频
```

**代码**：`eval_omni.py` 第 116-129 行

```python
# 文本输入不需要特殊处理
eval_sample(model, tokenizer, args, idx, prompt, None, f"text-{idx:02d}.mp3")
#                                                    ↑ 无音频输入    ↑ 输出文件名
```

### Mode 1：多轮对话

```mermaid
sequenceDiagram
    participant H as 对话历史
    participant Model as MiniMind-O

    Note over H: history = [<br>  {user: "你好"},<br>  {assistant: "你好！"}<br>]
    H->>Model: prompt = "我想找点事做"
    Model->>Model: 组装完整对话上下文
    Note over Model: <|im_start|>user<br>你好<|im_end|><br><|im_start|>assistant<br>你好！<|im_end|><br><|im_start|>user<br>我想找点事做<|im_end|><br><|im_start|>assistant
    Model-->>H: "可以听听音乐或者看看书"
```

### Mode 2：音频输入（语音对话）

```mermaid
graph TD
    A["audio-zh-01.mp3"] --> B["OmniDataset.process_audio()"]
    B --> C["重采样到 16kHz"]
    C --> D["SenseVoice 提取 fbank"]
    D --> E["mel (T, 560)"]
    E --> F["unsqueze(0) → (1, T, 560)"]
    F --> G["送入模型"]

    H["prompt = audio_pad × valid_len"] --> G

    G --> I["Thinker 理解音频"]
    I --> J["生成文本 + 音频回复"]

    style E fill:#f3e5f5
    style H fill:#e3f2fd
```

### Mode 3：声音克隆

```mermaid
graph TD
    A["voices_unseen.pt"] --> B["加载预置音色"]
    B --> C["每个音色包含:<br>ref_codes (1, 8, T_ref)<br>spk_emb (1, 192)"]

    C --> D["eval_sample()"]
    D --> E["ref_codes 放在音频缓冲区<br>目标区域之前"]
    D --> F["spk_emb 注入到<br>audio_spk_token 位置"]

    E --> G["Talker 参考克隆音色<br>生成对应风格的音频"]
    F --> G

    style C fill:#f3e5f5
    style G fill:#e8f5e9
```

### Mode 4：图像理解

```mermaid
graph TD
    A["image-01.jpg"] --> B["PIL.Image.open()"]
    B --> C["SigLIP2 处理器<br>缩放 + 归一化"]
    C --> D["pixel_values<br>(1, 3, 256, 256)"]

    E["prompt = '请描述这张图片\\n\\n'<br>+ image_pad × 64"] --> F["Tokenizer 编码"]

    D --> G["送入模型"]
    F --> G
    G --> H["SigLIP2 编码 → 64 个 patch token"]
    H --> I["VisionProj 投影"]
    I --> J["替换 image_pad 位置"]
    J --> K["Thinker 理解图像内容"]
    K --> L["生成描述文本 + 音频"]

    style H fill:#f3e5f5
```

### Mode 5：混合输入（音频 + 图像）

```mermaid
graph TD
    A["音频文件"] --> B["SenseVoice 编码"]
    B --> C["audio_pad × N"]

    D["图像文件"] --> E["SigLIP2 编码"]
    E --> F["image_pad × 64"]

    G["文本提示"] --> H["'Please answer me: '"]

    C & F & H --> I["拼接为完整 prompt:<br>text + audio_pads + '\\n\\n' + image_pads"]
    I --> J["送入模型"]
    J --> K["同时处理文本 + 音频 + 图像"]
    K --> L["生成综合回复"]

    style K fill:#e8f5e9
```

---

## 6.4 推理核心：eval_sample()

**位置**：`eval_omni.py:eval_sample()` 第 43-87 行

```mermaid
graph TD
    A["构造 messages"] --> B["apply_chat_template<br>生成完整 prompt"]
    B --> C["Tokenizer 编码<br>→ input_ids"]
    C --> D["model.generate()<br>stream=True"]
    D --> E["stream_generate()"]

    E --> F["循环 yield"]
    F --> G{"y is not None?"}
    G -->|是| H["decode → 打印文本<br>（逐字流式输出）"]
    G -->|否| I["跳过"]

    F --> J{"有 audio_frame?"}
    J -->|是| K["收集到 audio_frames 列表"]
    J -->|否| L["跳过"]

    K --> M["循环结束"]
    H --> M
    M --> N{"有音频帧?<br>且 decode_audio=True?"}
    N -->|是| O["Mimi 解码音频"]
    N -->|否| P["结束"]

    O --> Q["过滤特殊 token (≥2049)"]
    Q --> R["mimi_model.decode()"]
    R --> S["24kHz 波形"]
    S --> T["保存 WAV → 转 MP3"]

    style O fill:#f3e5f5
    style T fill:#e8f5e9
```

---

## 6.5 音频解码流程

```mermaid
graph LR
    subgraph "模型输出"
        A["8 层码本序列<br>每层: [120, 450, 890, ..., 2050]"]
    end

    subgraph "过滤"
        B["移除特殊 token<br>(id ≥ 2049 → 0)"]
    end

    subgraph "Mimi 解码"
        C["codes shape: (1, 8, T)"]
        D["mimi.decode()"]
        E["24kHz 波形<br>shape: (1, samples)"]
    end

    subgraph "保存"
        F["sf.write → WAV"]
        G["pydub → MP3<br>(64kbps)"]
    end

    A --> B --> C --> D --> E --> F --> G
```

---

## 6.6 流式输出的用户体验

```mermaid
sequenceDiagram
    participant CLI as 命令行终端
    participant Eval as eval_omni.py
    participant Model as stream_generate()

    Note over CLI: 📒 [Thinker]:
    Model->>Eval: yield (text_ids_1, None)
    Eval->>CLI: 打印 "你"
    Model->>Eval: yield (text_ids_2, None)
    Eval->>CLI: 打印 "好"
    Model->>Eval: yield (text_ids_3, audio_frame_1)
    Eval->>CLI: 打印 "！"
    Model->>Eval: yield (text_ids_4, audio_frame_2)
    Eval->>CLI: 打印 "有"
    Note over CLI: ...
    Model->>Eval: yield (EOS, audio_frame_N)
    Note over CLI: 🎹 [Talker]: 45 frames | Audio decoded to: output.mp3

    Note over CLI: 最终效果:<br>文本逐字打印<br>音频在后台生成完成后保存
```

---

## 6.7 命令行参数速查

```mermaid
graph TD
    subgraph "模型配置"
        A["--load_from: 模型路径"]
        B["--hidden_size: 768"]
        C["--num_hidden_layers: 8"]
        D["--use_moe: 0 或 1"]
    end

    subgraph "生成参数"
        E["--temperature: 0.7<br>（越高越随机）"]
        F["--top_p: 0.85<br>（核采样阈值）"]
        G["--max_new_tokens: 512<br>（最大生成长度）"]
    end

    subgraph "评估控制"
        H["--mode: '0,2,4'<br>（组合多个模式）"]
        I["--prompt_lang: 0/1/2<br>（英/中/混合）"]
        J["--decode_audio: 0/1<br>（是否解码音频）"]
        K["--open_thinking: 0/1<br>（是否开启思考模式）"]
    end

    subgraph "路径"
        L["--audio_dir: 测试音频目录"]
        M["--image_dir: 测试图像目录"]
        N["--output_dir: 输出保存目录"]
    end
```

---

## 学习检查清单

- [ ] 你能说出 6 种评估模式分别做什么吗？
- [ ] 模型支持哪两种加载格式？
- [ ] 音频输入时，prompt 中为什么要用 `audio_pad × N`？
- [ ] 声音克隆时 `ref_codes` 和 `spk_emb` 分别起什么作用？
- [ ] Mimi 解码前为什么要过滤掉 `id ≥ 2049` 的 token？
- [ ] 流式生成中，文本和音频是如何同步输出的？

> 完成后进入阶段七，看看 Web 演示界面！
