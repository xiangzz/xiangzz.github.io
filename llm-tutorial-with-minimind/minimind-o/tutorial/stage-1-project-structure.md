# 阶段一：理解项目结构与运行方式

> 目标：能跑通项目，理解每个文件的职责，建立全局观。

---

## 1.1 项目目录全景图

```mermaid
graph TD
    subgraph "模型定义 model/"
        M1["model_minimind.py<br>基础 LLM（Transformer）"]
        M2["model_omni.py<br>全模态模型（Thinker+Talker）"]
        M3["tokenizer.json<br>分词器词表"]
        M4["speaker/<br>预置音色文件"]
        M5["vad/<br>语音活动检测"]
    end

    subgraph "数据处理 dataset/"
        D1["omni_dataset.py<br>数据加载与增强"]
        D2["eval_omni/<br>评估样本"]
    end

    subgraph "训练 trainer/"
        T1["train_sft_omni.py<br>主训练脚本"]
        T2["trainer_utils.py<br>训练工具函数"]
        T3["train.sh<br>训练命令"]
    end

    subgraph "推理与演示"
        E1["eval_omni.py<br>命令行评估"]
        S1["scripts/web_demo_omni.py<br>Gradio 演示"]
        W1["webui/<br>Flask 网页服务"]
        C1["scripts/convert_omni.py<br>模型格式转换"]
    end

    style M1 fill:#e3f2fd
    style M2 fill:#e3f2fd
    style D1 fill:#e8f5e9
    style T1 fill:#fff3e0
    style E1 fill:#f3e5f5
```

---

## 1.2 文件之间的依赖关系

```mermaid
graph TD
    A["eval_omni.py<br>（推理入口）"] --> B["model/model_omni.py<br>（MiniMindOmni 模型）"]
    A --> C["dataset/omni_dataset.py<br>（音频预处理）"]
    A --> D["trainer/trainer_utils.py<br>（工具函数）"]

    B --> E["model/model_minimind.py<br>（基础 Transformer）"]

    F["trainer/train_sft_omni.py<br>（训练入口）"] --> B
    F --> G["dataset/omni_dataset.py<br>（数据集类）"]
    F --> D

    H["scripts/web_demo_omni.py<br>（Gradio 演示）"] --> B

    I["webui/web_demo.py<br>（Flask 服务）"] --> B

    J["scripts/convert_omni.py<br>（格式转换）"] --> B

    style B fill:#e3f2fd,stroke:#1565c0,stroke-width:3px
    style E fill:#e3f2fd,stroke:#1565c0,stroke-width:3px
```

> `model_omni.py` 是最核心的文件，几乎所有其他文件都依赖它。

---

## 1.3 数据流总览

从用户输入到模型输出的完整数据流：

```mermaid
graph TD
    subgraph "用户输入"
        U1["文本"]
        U2["音频"]
        U3["图像"]
    end

    subgraph "预处理"
        P1["Tokenizer<br>文本→token IDs"]
        P2["SenseVoice<br>音频→fbank特征"]
        P3["SigLIP2<br>图像→patch特征"]
    end

    subgraph "模型处理"
        M1["Thinker (8层 Transformer)<br>理解输入，生成文本"]
        M2["Talker (4层 Transformer)<br>生成 8 层音频码"]
    end

    subgraph "输出"
        O1["文本 token → 解码为文字"]
        O2["8 层音频码 → Mimi 解码 → 音频波形"]
    end

    U1 --> P1
    U2 --> P2
    U3 --> P3

    P1 --> M1
    P2 -->|"音频投影器 512→768"| M1
    P3 -->|"视觉投影器 768→768"| M1

    M1 -->|"bridge_states (第3层)"| M2
    M1 --> O1
    M2 --> O2

    style M1 fill:#e3f2fd
    style M2 fill:#f3e5f5
```

---

## 1.4 各文件行数与复杂度

```mermaid
graph LR
    subgraph "按代码量排序"
        A["model_omni.py (~460行) ★★★"]
        B["omni_dataset.py (~345行) ★★★"]
        C["model_minimind.py (~288行) ★★☆"]
        D["train_sft_omni.py (~263行) ★★☆"]
        E["eval_omni.py (~244行) ★★☆"]
        F["trainer_utils.py (~200行) ★☆☆"]
        G["web_demo.py (~500行) ★★☆"]
        H["web_demo_omni.py (~300行) ★★☆"]
    end
```

---

## 1.5 模型参数量

```mermaid
pie title "MiniMind-O 参数分布 (Dense, ~113M)"
    "Thinker (8层 Transformer)" : 63.91
    "Talker (4层 Transformer)" : 47.05
    "音频投影器" : 0.99
    "视觉投影器" : 1.18
```

```mermaid
pie title "冻结的外部模块（不参与训练）"
    "SenseVoice (音频编码器)" : 234
    "SigLIP2 (视觉编码器)" : 94.5
    "Mimi (音频编解码器)" : 96.15
```

---

## 1.6 运行项目

### 安装环境

```bash
# 1. 创建虚拟环境
conda create -n minimind-o python=3.10
conda activate minimind-o

# 2. 安装依赖
pip install -r requirements.txt

# 3. 安装 PyTorch（GPU 版本）
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 下载模型

参照 `README.md` 中的说明，下载预训练权重到 `out/` 目录。

### 运行推理

```bash
# 文本对话（最简单）
python eval_omni.py --mode 0

# 语音对话
python eval_omni.py --mode 2

# 全部模式
python eval_omni.py --mode -1
```

---

## 1.7 建议的阅读路线

```mermaid
graph TD
    A["README.md<br>了解项目目标"] --> B["requirements.txt<br>了解依赖"]
    B --> C["eval_omni.py<br>看模型怎么被调用"]
    C --> D["model_minimind.py<br>基础 LLM 架构"]
    D --> E["model_omni.py<br>全模态模型"]
    E --> F["omni_dataset.py<br>数据处理"]
    F --> G["train_sft_omni.py<br>训练流程"]

    style A fill:#e8f5e9
    style D fill:#e3f2fd
    style E fill:#e3f2fd
    style G fill:#fff3e0
```

---

## 学习检查清单

- [ ] 你能说出每个文件夹的用途吗？
- [ ] 你知道哪个文件是"最核心"的吗？
- [ ] 你能画出从输入到输出的数据流吗？
- [ ] 你能成功运行 `python eval_omni.py --mode 0` 吗？
- [ ] 你知道 Thinker 和 Talker 的区别吗？

> 完成后进入阶段二，深入理解 Transformer 的每一个组件！
