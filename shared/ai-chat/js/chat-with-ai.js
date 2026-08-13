(function() {
    // 防止重复初始化 - 如果页面已存在AI助手气泡则直接返回
    if (document.getElementById('ai-helper-bubble')) return;

    // 捕获 script 元素引用（必须在同步执行阶段获取，异步回调中 document.currentScript 为 null）
    const currentScriptEl = document.currentScript;
    const scriptUrl = currentScriptEl ? currentScriptEl.src : '';

    // 读取 data-subject 属性，用于动态生成系统提示词
    // 各教程在引入脚本时通过 data-subject 指定课程名称，例如：
    //   <script src="../shared/ai-chat/js/chat-with-ai.js" data-subject="GitHub 使用教程"></script>
    const aiSubject = (currentScriptEl && currentScriptEl.getAttribute('data-subject')) || '';

    // 资源路径探测 - 根据当前脚本路径确定基础路径
    let basePath = '';
    if (scriptUrl) {
        // 从脚本URL中提取基础路径，去掉 js/chat-with-ai.js 部分
        const jsIndex = scriptUrl.lastIndexOf('/js/');
        if (jsIndex !== -1) {
            basePath = scriptUrl.substring(0, jsIndex);
        } else {
            basePath = '.';
        }
    } else {
        basePath = '.';
    }

    // 构造 CSS 和 HTML 模板的路径
    const cssUrl = basePath + '/css/chat-with-ai.css';
    const htmlUrl = basePath + '/templates/chat-with-ai.html';

    // 加载资源的通用辅助函数 - 支持加载CSS、JS脚本和HTML模板
    function loadResource(type, url) {
        return new Promise((resolve, reject) => {
            if (type === 'script') {
                const element = document.createElement('script');
                element.src = url;
                element.onload = resolve;
                element.onerror = reject;
                document.head.appendChild(element);
            } else if (type === 'css') {
                const element = document.createElement('link');
                element.rel = 'stylesheet';
                element.href = url;
                element.onload = resolve;
                element.onerror = reject;
                document.head.appendChild(element);
            } else if (type === 'html') {
                fetch(url)
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return response.text();
                    })
                    .then(text => resolve(text))
                    .catch(reject);
            }
        });
    }

    // 并行加载所有依赖资源
    Promise.all([
        loadResource('css', cssUrl),
        loadResource('html', htmlUrl),
        loadResource('script', 'https://cdnjs.cloudflare.com/ajax/libs/marked/15.0.12/marked.min.js'),
        loadResource('script', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'),
        loadResource('css', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css')
    ]).then(([_, htmlContent]) => {
        // 1. 插入 HTML 模板到页面
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = htmlContent;
        while (tempContainer.firstChild) {
            document.body.appendChild(tempContainer.firstChild);
        }

        // 2. 配置 Markdown 解析器和代码高亮
        if (window.marked && window.hljs) {
            window.marked.setOptions({
                highlight: function(code, lang) {
                    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language }).value;
                },
                langPrefix: 'hljs language-'
            });
        }

        // 3. 初始化核心逻辑
        initApp();

    }).catch(err => console.error('Failed to load AI Chat resources:', err));

    // ==================== 各课程特化系统提示词表 ====================
    // 按 data-subject 属性值匹配，未命中时降级为通用模板。
    // 修改此处即可全局调整某课程的角色定位与回答风格。
    const SUBJECT_PROMPTS = {
        // ---------- 工具 / CLI 类：强调给出可直接执行的命令与配置 ----------
        'Claude Code 使用教程': `你是一个资深的前端开发工具专家，精通 Anthropic Claude Code CLI 的全部功能。
我是正在学习这款工具的开发者。回答时请侧重：slash commands 的用法、CLAUDE.md 记忆机制、Skills/Subagents/Hooks/MCP 的配置方式与实际工作流。
遇到操作类问题，优先给出可直接执行的命令或可直接粘贴的配置示例，再用一两句话解释原理。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        'Codex CLI 使用教程': `你是一个资深的前端开发工具专家，精通 OpenAI Codex CLI 的安装、配置与使用。
我是正在学习这款工具的开发者。回答时请侧重：AGENTS.md 配置、slash commands、skills、MCP/Plugins 接入、sandbox 安全机制与 thread 管理。
遇到操作类问题，优先给出可直接执行的命令或可直接粘贴的配置示例，再用一两句话解释原理。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        'Qoder CLI 使用教程': `你是一个资深的前端开发工具专家，精通 Qoder CLI 的 TUI 交互模式与全部功能模块。
我是正在学习这款工具的开发者。回答时请侧重：TUI 各模式操作、命令与工具集、memory/skills/subagents/MCP/hooks 的配置、permissions 权限管理与 Quest 工作流。
遇到操作类问题，优先给出可直接执行的命令或可直接粘贴的配置示例，再用一两句话解释原理。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        'DeepAgents 框架教程': `你是一个资深的 AI Agent 框架专家，精通 DeepAgents 的架构设计与工程实践。
我是正在学习这个框架的开发者。回答时请侧重：Agent harness 定制、model/provider 配置、context engineering 策略、subagents 编排、human-in-the-loop、沙箱与权限模型。
遇到架构设计类问题，请先讲清核心概念和数据流，再给出最小可运行的代码或配置示例。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        // ---------- GitHub：侧重 Git 命令与协作流程 ----------
        'GitHub 使用教程': `你是一个资深的 Git/GitHub 协作专家，精通版本控制、分支策略、PR/Issue 流程与 GitHub Actions。
我是正在学习 Git 和 GitHub 的开发者。回答时请侧重：Git 命令的用法与参数、分支管理策略（Git Flow / Trunk-based）、Pull Request 协作规范、Actions 工作流编写以及常见冲突的处理。
遇到操作类问题，优先给出可直接执行的命令序列，并说明每条命令做了什么。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        // ---------- LangGraph：侧重状态图概念辨析 ----------
        'LangGraph 框架教程': `你是一个资深的 LangGraph 框架专家，精通状态图（StateGraph）的编排、节点与边的设计、持久化与中断机制。
我是正在学习这个框架的开发者。回答时请侧重：State 定义与 reducer、条件路由、Checkpointer 持久化、Interrupts 人机交互、时间旅行与子图等核心概念的辨析。
概念容易混淆的地方（如 Update vs Replace、Command 路由、Send API），请用对比的方式讲清区别。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        // ---------- 全栈 / 前端：侧重代码实现 ----------
        'Node.js 全栈开发教程': `你是一个资深的 JavaScript/TypeScript 全栈工程师，精通 Node.js 服务端、前端框架与现代工程化体系。
我是正在学习全栈开发的学生。回答时请侧重：JS/TS 语言特性、React/Vue 组件设计、Node 服务端架构（路由/中间件/数据库）、类型安全与测试。
遇到实现类问题，请给出可直接运行的代码片段，标注关键行的注释，并附上简短的调试建议。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        'Web 前端设计教程': `你是一个资深的前端开发与设计工程师，精通 HTML 语义化结构、CSS3 布局与动画、响应式设计与调试排错。
我是正在学习 Web 前端的学生。回答时请侧重：HTML 结构最佳实践、Flexbox/Grid 布局技巧、CSS 动画与过渡的实现、响应式断点策略以及常见浏览器兼容问题。
遇到实现类问题，请给出可直接运行的 HTML/CSS/JS 代码片段，并解释关键属性的作用。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        // ---------- MiniMind 系列：侧重原理推导与 PyTorch 实现 ----------
        'MiniMind 大语言模型从零训练教程': `你是一个资深的深度学习与 NLP 研究者，精通大语言模型从零训练的全流程。
我是正在学习 LLM 训练的学生，具备基础 Python 和 PyTorch 知识。回答时请侧重：Tokenizer 原理、Transformer 架构细节（注意力/RoPE/FFN）、预训练与 SFT 的区别、LoRA/DPO/RLHF 等微调方法。
涉及数学公式时请用通俗语言逐步推导，遇到代码问题请标注 PyTorch 关键 API 和张量形状变化。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        'MiniMind-O 全模态大模型教程': `你是一个资深的深度学习研究者，精通全模态（Omni-modal）大模型的架构设计与训练。
我是正在学习多模态模型的学生，具备基础 LLM 知识。回答时请侧重：统一输入 token 布局、音频/图像/文本的多模态融合机制、多阶段训练流程（base→omni）、VAD 与语音合成模块的作用。
涉及架构图或序列格式时，请用结构化方式拆解数据流向。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,

        'MiniMind-V 视觉语言大模型教程': `你是一个资深的深度学习研究者，精通视觉语言模型（VLM）的架构设计与训练。
我是正在学习 VLM 的学生，具备基础 LLM 知识。回答时请侧重：LLaVA 式视觉编码器+投影层架构、图文对齐的训练策略（预训练→SFT）、image token 插入方式与视觉特征融合机制。
涉及数学或张量运算时，请用通俗语言逐步说明形状变化。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`,
    };

    function initApp() {
        // 获取所有需要的 DOM 元素
        const bubble = document.getElementById('ai-helper-bubble');
        const dockBtn = document.getElementById('ai-chat-dock');
        const sidebar = document.getElementById('ai-chat-sidebar');
        const resizer = document.getElementById('ai-chat-resizer');
        const settingsBtn = sidebar.querySelector('.ai-settings-btn');
        const settingsPanel = document.getElementById('ai-chat-settings');
        const baseUrlInput = document.getElementById('ai-config-base-url');
        const apiKeyInput = document.getElementById('ai-config-api-key');
        const input = document.getElementById('ai-chat-input');
        const sendBtn = document.getElementById('ai-chat-send');
        const chatBody = document.getElementById('ai-chat-body');

        // 构建系统提示词：优先查特化提示词表，未命中则降级为通用模板
        let SYSTEM_PROMPT;
        if (aiSubject && SUBJECT_PROMPTS[aiSubject]) {
            // 命中特化提示词
            SYSTEM_PROMPT = SUBJECT_PROMPTS[aiSubject];
        } else {
            // 降级：用页面标题或通用名称填充通用模板
            const subject = aiSubject || (document.title ? document.title.replace(/\s*[|·\-—]\s*.*/, '') : '') || '编程技术';
            SYSTEM_PROMPT = `你是一个资深的《${subject}》课程的教学助手，我是正在学习这门课的学生。
现在请你回答我的问题，以简练、直白的语言解答我的问题。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`;
        }

        let selectedText = '';
        let chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
        let isResizing = false;
        let startX, startWidth;

        function openChat(text) {
            sidebar.classList.add('open');
            sidebar.style.right = '0';
            dockBtn.style.display = 'none';
            if (text) {
                input.value = text;
            }
            input.focus();
        }

        function closeChat(showDock = false) {
            sidebar.classList.remove('open');
            const currentWidth = sidebar.offsetWidth;
            sidebar.style.right = `-${currentWidth}px`;
            if (showDock) {
                dockBtn.style.display = 'flex';
            } else {
                dockBtn.style.display = 'none';
            }
        }

        function clearAndCloseChat() {
            chatBody.innerHTML = '<div class="ai-message ai">你好！我是你的 AI 助手。选中页面上的文字点击"AI"气泡，我可以为你解释代码、回答问题。</div>';
            input.value = '';
            chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
            closeChat(false);
        }

        function addMessage(text, sender) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `ai-message ${sender}`;
            if (sender === 'ai' && window.marked) {
                try {
                    msgDiv.innerHTML = window.marked.parse(text);
                } catch (e) {
                    console.error('Markdown解析错误:', e);
                    msgDiv.innerText = text;
                }
            } else {
                msgDiv.innerText = text;
            }
            chatBody.appendChild(msgDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
            return msgDiv;
        }

        function showTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.id = 'ai-typing-indicator';
            indicator.className = 'ai-message ai';
            indicator.innerText = '正在思考...';
            chatBody.appendChild(indicator);
            chatBody.scrollTop = chatBody.scrollHeight;
        }

        function removeTypingIndicator() {
            const indicator = document.getElementById('ai-typing-indicator');
            if (indicator) indicator.remove();
        }

        async function handleSend() {
            const text = input.value.trim();
            if (!text) return;

            const baseUrl = baseUrlInput.value.trim();
            const apiKey = apiKeyInput.value.trim();

            if (!baseUrl || !apiKey) {
                alert('请先在设置中填写 Base URL 和 API Key');
                settingsPanel.style.display = 'flex';
                if (!sidebar.classList.contains('open')) {
                    sidebar.classList.add('open');
                    sidebar.style.right = '0';
                }
                return;
            }

            addMessage(text, 'user');
            input.value = '';
            chatHistory.push({ role: "user", content: text });

            showTypingIndicator();

            let aiMessageDiv = null;
            let fullContent = '';

            try {
                const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                const apiUrl = `${cleanBaseUrl}/chat/completions`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-v4-flash",
                        messages: chatHistory,
                        stream: true
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `HTTP Error: ${response.status}`);
                }

                removeTypingIndicator();
                aiMessageDiv = addMessage('', 'ai');

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;

                        const dataStr = trimmed.slice(6);
                        if (dataStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(dataStr);
                            const deltaContent = data.choices[0]?.delta?.content || '';

                            if (deltaContent) {
                                fullContent += deltaContent;
                                if (window.marked) {
                                    aiMessageDiv.innerHTML = window.marked.parse(fullContent);
                                } else {
                                    aiMessageDiv.innerText = fullContent;
                                }
                                chatBody.scrollTop = chatBody.scrollHeight;
                            }
                        } catch (e) {
                            console.error('流式数据解析错误:', e);
                        }
                    }
                }

                chatHistory.push({ role: "assistant", content: fullContent });

            } catch (error) {
                console.error('AI请求失败:', error);
                removeTypingIndicator();

                const errorMsg = `\n\n[请求出错: ${error.message}]`;
                if (aiMessageDiv) {
                    fullContent += errorMsg;
                    if (window.marked) {
                        aiMessageDiv.innerHTML = window.marked.parse(fullContent);
                    } else {
                        aiMessageDiv.innerText = fullContent;
                    }
                    chatHistory.push({ role: "assistant", content: fullContent });
                } else {
                    addMessage(`请求失败: ${error.message}`, 'ai');
                }
            }
        }

        // ==================== 事件监听器绑定 ====================

        // 侧边栏宽度拖拽调整
        resizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX = e.clientX;
            startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
            resizer.classList.add('resizing');
            document.body.style.cursor = 'w-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            const width = startWidth + (startX - e.clientX);
            if (width > 300 && width < window.innerWidth * 0.8) {
                sidebar.style.width = width + 'px';
                if (!sidebar.classList.contains('open')) {
                    sidebar.style.right = `-${width}px`;
                }
            }
        });

        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });

        // 文本选择检测和AI助手气泡显示
        document.addEventListener('mouseup', function(e) {
            if (isResizing) return;
            if (bubble.contains(e.target) || sidebar.contains(e.target)) {
                return;
            }

            setTimeout(() => {
                const selection = window.getSelection();
                const text = selection.toString().trim();

                if (text) {
                    selectedText = text;
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    const bubbleWidth = 40;
                    const bubbleHeight = 30;

                    let top = rect.top - bubbleHeight - 10;
                    let left = rect.left + (rect.width / 2) - (bubbleWidth / 2);

                    if (top < 0) top = rect.bottom + 10;
                    if (left < 0) left = 10;
                    if (left + bubbleWidth > window.innerWidth) left = window.innerWidth - bubbleWidth - 10;

                    bubble.style.top = `${top}px`;
                    bubble.style.left = `${left}px`;
                    bubble.style.display = 'block';
                    bubble.style.opacity = '0';
                    setTimeout(() => bubble.style.opacity = '1', 10);
                } else {
                    bubble.style.display = 'none';
                }
            }, 10);
        });

        bubble.addEventListener('mousedown', (e) => e.preventDefault());
        bubble.addEventListener('click', (e) => {
            e.stopPropagation();
            openChat(selectedText);
            bubble.style.display = 'none';
        });

        dockBtn.addEventListener('click', () => openChat());

        sidebar.querySelector('.ai-collapse-btn').addEventListener('click', () => closeChat(true));
        sidebar.querySelector('.ai-close-btn').addEventListener('click', () => clearAndCloseChat());

        settingsBtn.addEventListener('click', () => {
            const isHidden = getComputedStyle(settingsPanel).display === 'none';
            settingsPanel.style.display = isHidden ? 'flex' : 'none';
        });

        // 从localStorage加载用户配置
        const savedBaseUrl = localStorage.getItem('ai_base_url');
        const savedApiKey = localStorage.getItem('ai_api_key');
        if (savedBaseUrl) baseUrlInput.value = savedBaseUrl;
        if (savedApiKey) apiKeyInput.value = savedApiKey;

        baseUrlInput.addEventListener('change', (e) => localStorage.setItem('ai_base_url', e.target.value));
        apiKeyInput.addEventListener('change', (e) => localStorage.setItem('ai_api_key', e.target.value));

        sendBtn.addEventListener('click', handleSend);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    }
})();
