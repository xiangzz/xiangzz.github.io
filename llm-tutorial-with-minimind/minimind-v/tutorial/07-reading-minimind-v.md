# 第七阶段：阅读 MiniMind-V 源码

> 🎯 **目标**：按正确顺序阅读 VLM 扩展部分的全部代码
> ⏰ **预计时间**：1 周
> 📌 **前提**：已完成第一至第六阶段

---

## 7.1 代码阅读路线

```mermaid
flowchart TD
    A["1. model_vlm.py<br/>VLM 核心代码"] --> B["2. lm_dataset.py<br/>数据处理"]
    B --> C["3. trainer_utils.py<br/>训练工具"]
    C --> D["4. train_sft_vlm.py<br/>SFT 训练脚本"]
    D --> E["5. eval_vlm.py<br/>推理脚本"]
    E --> F["6. web_demo_vlm.py<br/>Web 界面"]
    F --> G["7. convert_vlm.py<br/>模型转换"]

    style A fill:#e3f2fd
    style B fill:#e8f5e9
    style C fill:#fff3e0
    style D fill:#fce4ec
```

---

## 7.2 精读 model_vlm.py

### VLMConfig（第13-21行）

```python
class VLMConfig(MiniMindConfig):      # 继承 LLM 的配置
    model_type = "minimind-v"

    def __init__(self,
        image_special_token='<|image_pad|>',   # 图片占位符
        image_ids=[12],                         # 占位符的 token ID
        image_hidden_size=768,                  # 视觉特征维度
        image_token_len=64,                     # 每张图的 token 数
        **kwargs):
        self.image_special_token = image_special_token
        self.image_ids = image_ids
        self.image_hidden_size = image_hidden_size
        self.image_token_len = image_token_len
        super().__init__(**kwargs)              # 传递其余参数给父类
```

### MiniMindVLM 类（第36-172行）

```python
class MiniMindVLM(MiniMindForCausalLM):    # 继承 LLM！
    config_class = VLMConfig

    def __init__(self, config, vision_model_path="./model/siglip2-base-p32-256-ve"):
        self.config = config or VLMConfig()
        super().__init__(self.config)                     # 初始化 LLM 部分
        self.vision_encoder, self.processor = \           # 加载视觉编码器
            self.__class__.get_vision_model(vision_model_path)
        self.vision_proj = MMVisionProjector(             # 创建投影层
            self.config.image_hidden_size,                # 输入: 768 (视觉特征)
            self.config.hidden_size)                      # 输出: 768 (LLM 隐藏维度)
```

```mermaid
flowchart TD
    A["MiniMindVLM.__init__()"] --> B["super().__init__()<br/>初始化 LLM 部分"]
    A --> C["加载视觉编码器<br/>SigLIP2 (冻结)"]
    A --> D["创建投影层<br/>MMVisionProjector"]
    B --> E["拥有 LLM 的所有能力"]
    C --> F["能提取图片特征"]
    D --> G["能翻译视觉特征"]
    E & F & G --> H["完整的 VLM！"]
```

### forward() 方法（第98-163行）

逐段解析：

```python
def forward(self, input_ids, labels=None, pixel_values=None, **args):
    batch_size, seq_length = input_ids.shape

    # === Step 1: 文本嵌入 ===
    hidden_states = self.model.dropout(self.model.embed_tokens(input_ids))
    # [batch, seq, 768]

    # === Step 2: 处理视觉输入 ===
    if pixel_values is not None and start_pos == 0:
        # 2a: 提取视觉特征
        if hasattr(pixel_values, 'keys'):  # 字典格式 (SigLIP 输出)
            vision_tensors = self.vision_proj(
                MiniMindVLM.get_image_embeddings(pixel_values, self.vision_encoder))
        # 2b: Token 替换
        hidden_states = self.count_vision_proj(
            tokens=input_ids, h=hidden_states,
            vision_tensors=vision_tensors, seqlen=seq_length)

    # === Step 3: Transformer 处理 ===
    for layer_idx, (layer, past_key_value) in enumerate(
            zip(self.model.layers, past_key_values)):
        hidden_states, present = layer(
            hidden_states, position_embeddings,
            past_key_value=past_key_value, use_cache=use_cache)
        presents.append(present)

    # === Step 4: 输出 ===
    hidden_states = self.model.norm(hidden_states)
    logits = self.lm_head(hidden_states[:, slice_indices, :])

    # === Step 5: 计算损失 ===
    if labels is not None:
        loss = F.cross_entropy(
            logits[..., :-1, :].contiguous(),
            labels[..., 1:].contiguous(),
            ignore_index=-100)
```

### generate() 方法（第165-172行）

```python
def generate(self, *args, num_return_sequences=1, **kwargs):
    # 支持多图：如果有 pixel_values，复制多份
    if num_return_sequences > 1 and 'pixel_values' in kwargs:
        pv = kwargs['pixel_values']
        kwargs['pixel_values'] = {k: v.repeat(num_return_sequences, ...)
                                  for k, v in pv.items()}
    # 调用父类 (LLM) 的 generate 方法
    return super().generate(*args, num_return_sequences=num_return_sequences, **kwargs)
```

---

## 7.3 精读 lm_dataset.py

### 数据处理流程

```mermaid
flowchart TD
    A["Parquet 文件中的一条记录"] --> B["读取 conversations JSON"]
    A --> C["读取 image_bytes 二进制"]

    B --> D["pre_processing_chat()<br/>20% 概率加系统提示"]
    D --> E["create_chat_prompt()<br/>替换 &lt;image&gt; 为 64个占位符<br/>应用 ChatML 模板"]
    E --> F["tokenize()<br/>分词 + 截断/填充到 max_length"]
    F --> G["generate_labels()<br/>标记 assistant 部分的 label"]

    C --> H["Image.open(BytesIO())<br/>解码 JPEG"]
    H --> I["image2tensor()<br/>SigLIP 预处理"]
    I --> J["pixel_values dict"]

    G & J --> K["返回 (input_ids, labels, pixel_values)"]
```

```python
# lm_dataset.py 第92-115行 (简化版)
def __getitem__(self, index):
    # 1. 读取数据
    conversations = json.loads(self.table['conversations'][index].as_py())
    image_bytes = self.table['image_bytes'][index].as_py()

    # 2. 处理文本
    conversations = pre_processing_chat(conversations)  # 随机加系统提示
    prompt = self.create_chat_prompt(conversations)      # 应用模板
    input_ids = self.tokenizer(prompt).input_ids[:768]   # 分词 + 截断
    input_ids += [pad_token_id] * (768 - len(input_ids)) # 填充
    labels = self.generate_labels(input_ids)             # 生成标签

    # 3. 处理图片
    image = Image.open(io.BytesIO(image_bytes))
    image_data = MiniMindVLM.image2tensor(image, self.preprocess)

    return torch.tensor(input_ids), torch.tensor(labels), image_data
```

---

## 7.4 精读 trainer_utils.py

### init_vlm_model（第66-97行）

```mermaid
flowchart TD
    A["创建 MiniMindVLM"] --> B["加载预训练权重"]
    B --> C["冻结策略选择"]

    C --> D{"freeze_llm = ?"}

    D -->|"= 0"| E["全部可训练<br/>（除了视觉编码器）"]
    D -->|"= 1"| F["投影层 + LLM 首末层"]
    D -->|"= 2"| G["仅投影层"]

    E --> H["返回 model, tokenizer, preprocess"]
    F --> H
    G --> H
```

```python
def init_vlm_model(vlm_config, from_weight='pretrain_vlm', freeze_llm=0):
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_path)
    model = MiniMindVLM(vlm_config)

    # 加载权重
    if from_weight != 'none':
        weights = torch.load(weight_path)
        model.load_state_dict(weights, strict=False)

    # Step 1: 先冻结一切（除了 vision_proj）
    for name, param in model.named_parameters():
        if 'vision_proj' not in name:
            param.requires_grad = False

    # Step 2: 根据 freeze_llm 策略解冻
    if freeze_llm == 0:      # 全参训练
        for name, param in model.named_parameters():
            if 'vision_encoder' not in name:
                param.requires_grad = True
    elif freeze_llm == 1:    # 首末层
        for name, param in model.model.named_parameters():
            if 'layers.0.' in name or f'layers.{last_idx}.' in name:
                param.requires_grad = True
    elif freeze_llm == 2:    # 仅投影层
        pass  # 已经只有 vision_proj 是可训练的

    return model.to(device), tokenizer, preprocess
```

### vlm_checkpoint（第100-155行）

```mermaid
flowchart TD
    A["保存检查点"] --> B["提取 state_dict"]
    B --> C["移除视觉编码器参数<br/>（不需要保存）"]
    C --> D["转为半精度<br/>（节省空间）"]
    D --> E["写入 .tmp 临时文件"]
    E --> F["os.replace 原子替换<br/>（防止中断导致损坏）"]

    G["加载检查点"] --> H["检查 .pth 文件是否存在"]
    H --> I["加载 state_dict"]
    I --> J["适配 GPU 数量变化<br/>自动转换 step"]
    J --> K["返回 epoch, step, optimizer 状态"]
```

---

## 7.5 精读 train_sft_vlm.py

### 训练入口（第89-178行）

```mermaid
flowchart TD
    A["1. 初始化环境和种子"] --> B["2. 配置模型参数"]
    B --> C["3. 设置混合精度"]
    C --> D["4. 配置日志工具"]
    D --> E["5. 加载模型和数据"]
    E --> F["6. 恢复检查点"]
    F --> G["7. 编译和分布式包装"]
    G --> H["8. 训练循环"]
    H --> I["9. 清理"]
```

### 训练循环详解（第24-86行）

```python
def train_epoch(epoch, loader, iters, start_step=0):
    for step, (input_ids, labels, pixel_values) in enumerate(loader):
        # 1. 数据移到 GPU
        input_ids = input_ids.to(device)
        labels = labels.to(device)
        pixel_values = pixel_values.to(device)

        # 2. 更新学习率（余弦退火）
        lr = get_lr(epoch * iters + step, total_steps, learning_rate)

        # 3. 前向传播（混合精度）
        with autocast_ctx:
            res = model(input_ids, labels=labels, pixel_values=pixel_values)
            loss = (res.loss + res.aux_loss) / accumulation_steps

        # 4. 反向传播
        scaler.scale(loss).backward()

        # 5. 梯度累积 + 裁剪 + 更新
        if step % accumulation_steps == 0:
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()
            optimizer.zero_grad(set_to_none=True)

        # 6. 定期保存
        if step % save_interval == 0:
            torch.save(model.state_dict(), ckp_path)
```

---

## 7.6 精读 eval_vlm.py

```python
# eval_vlm.py 完整流程
# 1. 加载模型
model = MiniMindVLM(VLMConfig())
model.load_state_dict(torch.load(weight_path))

# 2. 对每张评估图片
for image_path in eval_images:
    image = Image.open(image_path)
    pixel_values = MiniMindVLM.image2tensor(image, processor)

    # 3. 构造 prompt
    prompt = "<|image_pad|>" * 64 + "\n请描述这张图中的主要物体和场景。"

    # 4. 应用对话模板 + 分词
    input_ids = tokenizer(apply_chat_template(prompt))

    # 5. 自回归生成
    output_ids = model.generate(input_ids, pixel_values=pixel_values,
                                 max_new_tokens=500, temperature=0.7)

    # 6. 解码输出
    response = tokenizer.decode(output_ids)
    print(response)
```

---

## 7.7 文件功能速查

```mermaid
graph TD
    subgraph "模型定义"
        A["model_minimind.py<br/>LLM 基础架构"]
        B["model_vlm.py<br/>VLM 扩展"]
    end
    subgraph "数据处理"
        C["lm_dataset.py<br/>数据集类"]
    end
    subgraph "训练"
        D["train_pretrain_vlm.py<br/>Pretrain (可选)"]
        E["train_sft_vlm.py<br/>SFT (必需)"]
        F["trainer_utils.py<br/>工具函数"]
    end
    subgraph "推理"
        G["eval_vlm.py<br/>命令行推理"]
        H["web_demo_vlm.py<br/>Web 推理"]
    end
    subgraph "工具"
        I["convert_vlm.py<br/>格式转换"]
    end

    B --> A
    C --> B
    D --> F
    E --> F
    F --> B
```

---

## 7.8 自我检测

1. ✅ `MiniMindVLM` 继承了哪个类？新增了哪些组件？（MiniMindForCausalLM，新增视觉编码器和投影层）
2. ✅ `count_vision_proj()` 做了什么？（用视觉特征替换文本中的图片占位符嵌入）
3. ✅ `generate_labels()` 如何标记训练标签？（assistant 部分用真实 token ID，其他用 -100）
4. ✅ 三种冻结策略各适合什么场景？（0=数据足够多，1=SFT默认，2=Pretrain默认）
5. ✅ 为什么检查点保存要用 `.tmp + os.replace`？（原子操作，防止中断导致文件损坏）
