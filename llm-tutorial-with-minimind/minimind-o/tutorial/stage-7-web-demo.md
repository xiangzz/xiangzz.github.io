# 阶段七：Web 演示界面

> 目标文件：`scripts/web_demo_omni.py`（Gradio）和 `webui/`（Flask + WebSocket）
> 理解前后端如何配合实现实时交互。

---

## 7.1 两个 Web 演示版本

```mermaid
graph TD
    subgraph "Gradio 版本<br>scripts/web_demo_omni.py"
        A["简单易用<br>适合演示"]
        B["文本/音频/图片输入"]
        C["流式文本输出"]
        D["语音选择"]
    end

    subgraph "Flask 版本<br>webui/web_demo.py + .html"
        E["功能完整<br>适合生产"]
        F["实时语音通话"]
        G["声音克隆"]
        H["打断（Barge-in）"]
    end

    style A fill:#e3f2fd
    style E fill:#f3e5f5
```

---

## 7.2 Gradio 版本架构

```mermaid
graph TD
    subgraph "前端（Gradio 自动生成）"
        A["MultimodalTextbox<br>支持文本+音频+图片输入"]
        B["文本输出框<br>流式显示"]
        C["音频播放器<br>自动播放"]
        D["语音选择下拉框"]
        E["模型切换按钮"]
    end

    subgraph "后端处理"
        F["接收输入"]
        F --> G["构造 prompt"]
        G --> H["model.generate(stream=True)"]
        H --> I["循环 yield"]
        I --> J["decode 文本 → 更新 UI"]
        I --> K["收集音频帧 → Mimi 解码"]
        K --> L["返回音频波形"]
    end

    A --> F
    D --> F
    J --> B
    L --> C
```

### Gradio 流式输出

```mermaid
sequenceDiagram
    participant UI as Gradio UI
    participant Handler as 事件处理函数
    participant Model as stream_generate()

    UI->>Handler: 用户发送消息
    Handler->>Model: 启动流式生成

    loop 每个 yield
        Model-->>Handler: (text_ids, audio_frame)
        Handler-->>UI: yield 文本更新
    end

    Handler->>Handler: Mimi 解码所有音频帧
    Handler-->>UI: 返回最终音频
```

---

## 7.3 Flask 版本 — Chat 模式

**位置**：`webui/web_demo.py`

```mermaid
sequenceDiagram
    participant Browser as 浏览器
    participant Flask as Flask 服务器
    participant Model as MiniMind-O
    participant Mimi as Mimi 解码器

    Browser->>Flask: POST /chat<br>{prompt, history, voice}

    Flask->>Model: stream_generate()
    Model-->>Flask: yield (text, audio)

    loop 流式响应
        Flask-->>Browser: SSE: data: {text_chunk}
        Note over Browser: 逐字显示文本

        Flask->>Mimi: 解码音频帧
        Mimi-->>Flask: PCM 音频
        Flask-->>Browser: SSE: data: {audio_base64}
        Note over Browser: 播放音频
    end

    Flask-->>Browser: SSE: [DONE]
```

### SSE（Server-Sent Events）数据格式

```mermaid
graph LR
    subgraph "SSE 消息流"
        A["data: {type: text, content: '你'}"]
        B["data: {type: text, content: '好'}"]
        C["data: {type: text, content: '！'}"]
        D["data: {type: audio, data: 'base64...'}"]
        E["data: {type: audio, data: 'base64...'}"]
        F["data: [DONE]"]
    end

    A --> B --> C --> D --> E --> F
```

---

## 7.4 Flask 版本 — Call 模式（实时通话）

```mermaid
sequenceDiagram
    participant Mic as 麦克风
    participant Browser as 浏览器
    participant WS as WebSocket
    participant VAD as RealtimeSession
    participant Model as MiniMind-O
    participant Speaker as 扬声器

    loop 持续采集
        Mic->>Browser: PCM 音频帧
        Browser->>WS: 二进制 WebSocket 帧
        WS->>VAD: push_chunk()
        VAD-->>WS: 'listening'
    end

    Note over VAD: 检测到语音开始
    VAD-->>WS: 'speech_end'
    WS->>Model: 开始推理

    loop 流式回复
        Model-->>WS: yield (text, audio_frame)
        WS-->>Browser: 音频 PCM 帧
        Browser->>Speaker: 播放音频
    end

    Note over Browser,Mic: 用户打断（Barge-in）
    Mic->>Browser: 新的语音
    Browser->>WS: PCM 帧
    WS->>VAD: push_chunk()
    VAD-->>WS: 'interrupt'
    WS->>WS: 停止当前生成
    WS->>Model: 重新推理
```

### Call 模式状态机

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Listening: 用户开始说话
    Listening --> Listening: VAD 检测到语音
    Listening --> Processing: 语音结束<br>(speech_end)

    Processing --> Speaking: 模型开始输出
    Speaking --> Speaking: 流式输出音频
    Speaking --> Interrupted: 用户打断 (interrupt)
    Speaking --> Idle: 输出完成

    Interrupted --> Processing: 用新输入重新推理
    Processing --> Idle: 无新输入
```

---

## 7.5 声音克隆功能

```mermaid
graph TD
    A["用户录制 3-6 秒音频"] --> B["验证质量"]
    B --> C{"检查通过?"}
    C -->|否| D["提示重新录制<br>（音量太小/太大/噪声）"]
    C -->|是| E["Mimi 编码 → ref_codes"]
    E --> F["CAM++ 提取 → spk_emb"]
    F --> G["保存为 voice_clone.pt"]
    G --> H["下次对话时<br>使用克隆的音色"]

    style E fill:#f3e5f5
    style F fill:#f3e5f5
    style H fill:#e8f5e9
```

### 质量验证

```mermaid
graph TD
    A["录制的音频"] --> B{"时长 3-6 秒?"}
    B -->|太短/太长| C["❌ 时长不合适"]
    B -->|合适| D{"音量检查"}
    D -->|太安静| E["❌ 音量过低"]
    D -->|削波| F["❌ 音量过高（削波）"]
    D -->|合适| G{"噪声检查"}
    G -->|噪声大| H["❌ 背景噪声过大"]
    G -->|通过| I["✅ 质量合格"]

    style I fill:#e8f5e9
    style C fill:#ffcdd2
    style E fill:#ffcdd2
    style F fill:#ffcdd2
    style H fill:#ffcdd2
```

---

## 7.6 前端界面（web_demo.html）

### Chat 模式 UI

```mermaid
graph TD
    subgraph "Chat 界面布局"
        A["顶部: 模型选择 + 语音选择"]
        B["中部: 对话历史区<br>用户消息 (右侧蓝色)<br>助手回复 (左侧灰色)"]
        C["底部: 输入框<br>支持文本/音频/图片"]
        D["侧边: 声音克隆按钮"]
    end

    A --> B --> C
    D --> A
```

### Call 模式 UI

```mermaid
graph TD
    subgraph "Call 界面布局"
        A["中央: 动画球体（Orb）"]
        B["Orb 状态:"]
        C["🟢 绿色 = 听你说话"]
        D["🟡 黄色 = 处理中"]
        E["🔵 蓝色 = AI 说话"]
        F["底部: 挂断按钮"]
        G["可选: 摄像头按钮<br>（发送图像）"]
    end

    A --> B
    B --> C & D & E
```

### 动画球体的音频响应

```mermaid
graph LR
    A["PCM 音频流"] --> B["计算音量级别"]
    B --> C["映射到球体动画参数"]
    C --> D["变形幅度 = 音量"]
    C --> E["颜色 = 当前状态"]

    style A fill:#e3f2fd
    style D fill:#f3e5f5
```

---

## 7.7 音频播放机制

### Chat 模式（Base64 传输）

```mermaid
graph LR
    A["服务端: Mimi 解码<br>→ PCM 波形"] --> B["Base64 编码"]
    B --> C["SSE 传输"]
    C --> D["浏览器: Base64 解码"]
    D --> E["AudioContext 播放"]
```

### Call 模式（WebSocket 二进制流）

```mermaid
graph LR
    A["服务端: PCM 片段<br>(每片 ~80ms)"] --> B["WebSocket<br>二进制帧"]
    B --> C["浏览器: 写入<br>AudioBuffer 队列"]
    C --> D["AudioContext<br>连续播放"]
    D --> E["无缝拼接<br>→ 连续语音"]
```

> Call 模式用 WebSocket 二进制帧直接传输 PCM 数据，延迟更低。通过维护一个播放队列，实现音频的无缝拼接。

---

## 7.8 线程安全与并发

```mermaid
graph TD
    A["多个用户请求"] --> B["互斥锁 (Lock)"]
    B --> C{"锁是否被占用?"}
    C -->|是| D["排队等待"]
    C -->|否| E["获取锁"]
    E --> F["模型推理"]
    F --> G["释放锁"]
    G --> H["返回结果"]
    D --> E

    style B fill:#fff3e0
    style F fill:#e3f2fd
```

> 由于模型推理不能并行（单 GPU），使用互斥锁确保同一时间只有一个请求在进行推理。

---

## 学习检查清单

- [ ] 两个 Web 版本的区别是什么？
- [ ] SSE 是如何实现流式传输的？
- [ ] Call 模式中 VAD 如何检测语音结束？
- [ ] Barge-in（打断）是如何实现的？
- [ ] 声音克隆的流程是什么？
- [ ] PCM 音频流如何在浏览器中无缝播放？
- [ ] 为什么需要互斥锁？

> 完成后进入阶段八，开始动手实践！
