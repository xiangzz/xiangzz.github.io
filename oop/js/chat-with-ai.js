(function() {
    // 防止重复初始化 - 如果页面已存在AI助手气泡则直接返回
    if (document.getElementById('ai-helper-bubble')) return;

    // 资源路径探测 - 根据当前脚本路径确定基础路径
    const scriptUrl = document.currentScript ? document.currentScript.src : '';
    let basePath = '';
    if (scriptUrl) {
        // 从脚本URL中提取基础路径，去掉 js/chat-with-ai.js 部分
        // 假设脚本路径以 /js/chat-with-ai.js 结尾
        const jsIndex = scriptUrl.lastIndexOf('/js/');
        if (jsIndex !== -1) {
            basePath = scriptUrl.substring(0, jsIndex);
        } else {
            // 如果不是标准结构，尝试回退到当前目录
            basePath = '.'; 
        }
    } else {
        basePath = '.';
    }
    
    // 构造 CSS 和 HTML 模板的路径
    // 预期的目录结构:
    // root/
    //   css/chat-with-ai.css      - 样式文件
    //   js/chat-with-ai.js        - 主脚本文件（当前文件）
    //   templates/chat-with-ai.html - HTML模板文件
    const cssUrl = basePath + '/css/chat-with-ai.css';
    const htmlUrl = basePath + '/templates/chat-with-ai.html';

    // 加载资源的通用辅助函数 - 支持加载CSS、JS脚本和HTML模板
    function loadResource(type, url) {
        return new Promise((resolve, reject) => {
            if (type === 'script') {
                // 动态加载JavaScript文件
                const element = document.createElement('script');
                element.src = url;
                element.onload = resolve;      // 加载成功时解析Promise
                element.onerror = reject;      // 加载失败时拒绝Promise
                document.head.appendChild(element);
            } else if (type === 'css') {
                // 动态加载CSS样式文件
                const element = document.createElement('link');
                element.rel = 'stylesheet';
                element.href = url;
                element.onload = resolve;      // 加载成功时解析Promise
                element.onerror = reject;      // 加载失败时拒绝Promise
                document.head.appendChild(element);
            } else if (type === 'html') {
                // 通过fetch API加载HTML模板文件
                fetch(url)
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return response.text();
                    })
                    .then(text => resolve(text))  // 返回HTML文本内容
                    .catch(reject);
            }
        });
    }

    // 并行加载所有依赖资源 - 包括本地CSS/HTML模板和外部CDN资源
    Promise.all([
        loadResource('css', cssUrl),                                                                 // 本地CSS样式
        loadResource('html', htmlUrl),                                                               // 本地HTML模板
        loadResource('script', 'https://cdnjs.cloudflare.com/ajax/libs/marked/15.0.12/marked.min.js'),               // Markdown解析库
        loadResource('script', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'), // 代码高亮库
        loadResource('css', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css')    // 代码高亮主题
    ]).then(([_, htmlContent]) => {
        // 1. 插入 HTML 模板到页面
        // 创建一个临时容器来解析 HTML 字符串
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = htmlContent;
        
        // 将模板中的所有元素移动到 body 中
        // 注意：HTML 模板包含三个顶级元素: bubble(气泡), dockBtn(悬浮球), sidebar(聊天侧边栏)
        while (tempContainer.firstChild) {
            document.body.appendChild(tempContainer.firstChild);
        }

        // 2. 配置 Markdown 解析器和代码高亮
        if (window.marked && window.hljs) {
            window.marked.setOptions({
                highlight: function(code, lang) {
                    // 使用highlight.js进行代码语法高亮
                    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language }).value;
                },
                langPrefix: 'hljs language-'  // 设置CSS类名前缀
            });
        }
        
        // 3. 初始化应用的核心逻辑
        initApp();

    }).catch(err => console.error('Failed to load AI Chat resources:', err));

    function initApp() {
        // 获取所有需要的 DOM 元素
        const bubble = document.getElementById('ai-helper-bubble');           // AI助手气泡
        const dockBtn = document.getElementById('ai-chat-dock');               // 悬浮球按钮
        const sidebar = document.getElementById('ai-chat-sidebar');            // 聊天侧边栏
        const resizer = document.getElementById('ai-chat-resizer');            // 侧边栏宽度调节器
        const settingsBtn = sidebar.querySelector('.ai-settings-btn');         // 设置按钮
        const settingsPanel = document.getElementById('ai-chat-settings');      // 设置面板
        const baseUrlInput = document.getElementById('ai-config-base-url');    // API基础URL输入框
        const apiKeyInput = document.getElementById('ai-config-api-key');        // API密钥输入框
        const input = document.getElementById('ai-chat-input');                // 消息输入框
        const sendBtn = document.getElementById('ai-chat-send');                // 发送按钮
        const chatBody = document.getElementById('ai-chat-body');               // 聊天消息容器

        // 应用状态变量定义
        const SYSTEM_PROMPT = `你是一个资深的《Java面向对象程序设计》课程的教师，我是正在自学这门课的学生。
现在请你回答我的问题，以简练、直白的语言解答我的问题。
现在，我会发送一些我在学习过程中摘抄的文字给你（可能含有代码），因为我对句子所描述的内容并不清晰，希望得到你的解答。内容如下：
---`;

        let selectedText = '';               // 用户选中的文本内容
        let chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];  // 聊天历史记录
        let isResizing = false;              // 是否正在调整侧边栏宽度
        let startX, startWidth;               // 拖拽调整宽度时的起始位置和宽度

        // 核心辅助函数定义
        function openChat(text) {
            // 打开聊天侧边栏
            sidebar.classList.add('open');
            sidebar.style.right = '0'; // 确保打开时位置正确（显示在屏幕右侧）
            dockBtn.style.display = 'none'; // 打开对话框时隐藏悬浮球
            
            if (text) {
                // 将选中的文本预先填充到输入框，等待用户编辑后发送
                input.value = text;
            }
            // 自动聚焦到输入框，方便用户直接输入
            input.focus();
        }
        
        function closeChat(showDock = false) {
            // 关闭聊天侧边栏
            sidebar.classList.remove('open');
            // 关闭时，将 right 设置为负的当前宽度，使其隐藏在屏幕右侧外
            const currentWidth = sidebar.offsetWidth;
            sidebar.style.right = `-${currentWidth}px`;
            
            if (showDock) {
                // 如果需要显示悬浮球，则显示
                dockBtn.style.display = 'flex';
            } else {
                // 否则完全隐藏悬浮球
                dockBtn.style.display = 'none';
            }
        }

        function clearAndCloseChat() {
            // 清空所有聊天记录并关闭对话框，恢复到初始状态
            chatBody.innerHTML = '<div class="ai-message ai">你好！我是你的 AI 助手。选中页面上的文字点击“AI”气泡，我可以为你解释代码、回答问题。</div>';
            // 清空输入框内容
            input.value = '';
            // 重置对话历史记录（保留系统提示词）
            chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
            closeChat(false); // 关闭并清空时不显示悬浮球
        }

        function addMessage(text, sender) {
            // 在聊天界面中添加新消息
            const msgDiv = document.createElement('div');
            msgDiv.className = `ai-message ${sender}`;  // 设置消息样式类（ai或user）
            
            if (sender === 'ai' && window.marked) {
                // AI消息使用Markdown渲染，支持代码高亮和格式化
                try {
                    msgDiv.innerHTML = window.marked.parse(text);
                } catch (e) {
                    console.error('Markdown解析错误:', e);
                    msgDiv.innerText = text;  // 解析失败时降级为纯文本
                }
            } else {
                // 用户消息以纯文本形式显示
                msgDiv.innerText = text;
            }
            
            chatBody.appendChild(msgDiv);              // 将消息添加到聊天容器
            chatBody.scrollTop = chatBody.scrollHeight; // 自动滚动到底部显示最新消息
            return msgDiv;                             // 返回消息元素供后续操作
        }

        function showTypingIndicator() {
            // 显示AI正在思考的提示动画
            const indicator = document.createElement('div');
            indicator.id = 'ai-typing-indicator';
            indicator.className = 'ai-message ai';
            indicator.innerText = '正在思考...';
            chatBody.appendChild(indicator);
            chatBody.scrollTop = chatBody.scrollHeight; // 滚动到底部显示提示
        }
    
        function removeTypingIndicator() {
            // 移除AI正在思考的提示
            const indicator = document.getElementById('ai-typing-indicator');
            if (indicator) indicator.remove();
        }

        async function handleSend() {
            // 处理发送消息的核心函数
            const text = input.value.trim();
            if (!text) return;  // 如果输入为空则直接返回
    
            // 1. 检查API配置是否完整
            const baseUrl = baseUrlInput.value.trim();
            const apiKey = apiKeyInput.value.trim();
    
            if (!baseUrl || !apiKey) {
                alert('请先在设置中填写 Base URL 和 API Key');
                settingsPanel.style.display = 'flex';  // 显示设置面板
                if (!sidebar.classList.contains('open')) {
                    sidebar.classList.add('open');
                    sidebar.style.right = '0';
                }
                return;
            }
    
            // 2. 在界面中显示用户发送的消息
            addMessage(text, 'user');
            input.value = '';  // 清空输入框
            
            // 3. 将用户消息添加到对话历史记录
            chatHistory.push({ role: "user", content: text });
    
            showTypingIndicator();  // 显示AI正在思考的提示
    
            let aiMessageDiv = null;     // AI消息容器元素
            let fullContent = '';         // 累积的AI回复完整内容
    
            try {
                // 清理并构建API请求URL
                const cleanBaseUrl = baseUrl.replace(/\/$/, '');  // 移除末尾斜杠
                const apiUrl = `${cleanBaseUrl}/chat/completions`;
    
                // 发送流式API请求
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`  // 使用Bearer token认证
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",     // 使用DeepSeek聊天模型
                        messages: chatHistory,      // 发送完整的对话历史
                        stream: true                // 开启流式输出以获得实时响应
                    })
                });
    
                // 检查HTTP响应状态
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `HTTP Error: ${response.status}`);
                }
    
                // 移除"正在思考..."的提示
                removeTypingIndicator();
    
                // 创建一个空的AI消息框用于流式显示内容
                aiMessageDiv = addMessage('', 'ai');
    
                // 处理流式响应数据
                const reader = response.body.getReader();  // 获取流式读取器
                const decoder = new TextDecoder();         // 文本解码器
                let buffer = '';                            // 数据缓冲区
    
                // 循环读取流式数据
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;  // 读取完成时退出循环
    
                    buffer += decoder.decode(value, { stream: true });  // 解码并累积数据
                    const lines = buffer.split('\n');                    // 按行分割数据
                    buffer = lines.pop(); // 保留最后一个可能不完整的行到下一轮处理
    
                    // 处理每一行数据（Server-Sent Events格式）
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;  // 跳过空行和非数据行
                        
                        const dataStr = trimmed.slice(6);  // 移除"data: "前缀
                        if (dataStr === '[DONE]') continue; // 跳过结束标记
    
                        try {
                            const data = JSON.parse(dataStr);  // 解析JSON数据
                            const deltaContent = data.choices[0]?.delta?.content || '';  // 提取增量内容
                            
                            if (deltaContent) {
                                fullContent += deltaContent;  // 累积完整的AI回复内容
                                // 实时渲染Markdown内容，提供流畅的用户体验
                                if (window.marked) {
                                    aiMessageDiv.innerHTML = window.marked.parse(fullContent);
                                } else {
                                    aiMessageDiv.innerText = fullContent;  // 降级为纯文本
                                }
                                // 自动滚动到底部保持最新内容可见
                                chatBody.scrollTop = chatBody.scrollHeight;
                            }
                        } catch (e) {
                            console.error('流式数据解析错误:', e);
                        }
                    }
                }
    
                // 4. 将完整的AI回复添加到对话历史记录
                chatHistory.push({ role: "assistant", content: fullContent });
    
            } catch (error) {
                // 处理API请求失败的情况
                console.error('AI请求失败:', error);
                removeTypingIndicator(); // 确保移除"正在思考"提示
                
                // 构造错误信息
                const errorMsg = `\n\n[请求出错: ${error.message}]`;
                if (aiMessageDiv) {
                    // 如果已经有部分AI回复，则追加错误信息到现有内容
                    fullContent += errorMsg;
                    if (window.marked) {
                        aiMessageDiv.innerHTML = window.marked.parse(fullContent);
                    } else {
                        aiMessageDiv.innerText = fullContent;
                    }
                    chatHistory.push({ role: "assistant", content: fullContent }); // 保存已有内容和错误信息
                } else {
                    // 如果没有任何AI回复，则创建一个新的错误消息
                    addMessage(`请求失败: ${error.message}`, 'ai');
                }
            }
        }

        // ==================== 事件监听器绑定 ====================
        
        // 侧边栏宽度拖拽调整功能
        resizer.addEventListener('mousedown', function(e) {
            // 开始拖拽调整侧边栏宽度
            isResizing = true;
            startX = e.clientX;  // 记录鼠标起始X坐标
            startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10); // 记录当前宽度
            resizer.classList.add('resizing');  // 添加拖拽状态样式
            document.body.style.cursor = 'w-resize';   // 设置鼠标样式为左右调整
            document.body.style.userSelect = 'none';    // 禁用文本选择
        });

        document.addEventListener('mousemove', function(e) {
            // 处理拖拽过程中的鼠标移动
            if (!isResizing) return;  // 如果不在拖拽状态则直接返回
            
            // 计算新的宽度：起始宽度 + (起始X坐标 - 当前X坐标)
            const width = startWidth + (startX - e.clientX);
            
            // 限制宽度范围：最小300px，最大为窗口宽度的80%
            if (width > 300 && width < window.innerWidth * 0.8) {
                sidebar.style.width = width + 'px';
                if (!sidebar.classList.contains('open')) {
                    // 如果侧边栏未打开，同步调整其隐藏位置
                    sidebar.style.right = `-${width}px`;
                }
            }
        });

        document.addEventListener('mouseup', function() {
            // 处理鼠标释放事件，结束拖拽
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('resizing'); // 移除拖拽状态样式
                document.body.style.cursor = '';      // 恢复默认鼠标样式
                document.body.style.userSelect = '';   // 恢复文本选择功能
            }
        });

        // 文本选择检测和AI助手气泡显示
        document.addEventListener('mouseup', function(e) {
            // 检测用户是否选择了页面文本，如果是则在选择区域附近显示AI助手气泡
            if (isResizing) return;  // 如果正在调整侧边栏宽度则忽略
            if (bubble.contains(e.target) || sidebar.contains(e.target)) {
                return;  // 如果点击的是AI助手界面元素则忽略
            }

            // 使用setTimeout确保文本选择已经完成
            setTimeout(() => {
                const selection = window.getSelection();
                const text = selection.toString().trim();  // 获取选中的文本并去除首尾空格

                if (text) {
                    // 如果有选中文本，保存并显示AI助手气泡
                    selectedText = text;
                    const range = selection.getRangeAt(0);           // 获取选区范围
                    const rect = range.getBoundingClientRect();      // 获取选区的屏幕位置

                    // 气泡尺寸设置
                    const bubbleWidth = 40;
                    const bubbleHeight = 30;
                    
                    // 计算气泡位置：默认在选区上方居中
                    let top = rect.top - bubbleHeight - 10;  // 选区上方10px
                    let left = rect.left + (rect.width / 2) - (bubbleWidth / 2);  // 水平居中

                    // 边界检查和位置调整
                    if (top < 0) top = rect.bottom + 10;  // 如果上方空间不够，显示在选区下方
                    if (left < 0) left = 10;  // 防止超出左边界
                    if (left + bubbleWidth > window.innerWidth) left = window.innerWidth - bubbleWidth - 10;  // 防止超出右边界

                    // 设置气泡位置并显示
                    bubble.style.top = `${top}px`;
                    bubble.style.left = `${left}px`;
                    bubble.style.display = 'block';
                    
                    // 添加淡入动画效果
                    bubble.style.opacity = '0';
                    setTimeout(() => bubble.style.opacity = '1', 10);  // 短暂延迟后显示
                } else {
                    // 如果没有选中文本，隐藏气泡
                    bubble.style.display = 'none';
                }
            }, 10);  // 短暂延迟确保文本选择事件完成
        });

        // AI助手气泡点击事件处理
        bubble.addEventListener('mousedown', (e) => e.preventDefault());  // 防止文本选择被取消
        bubble.addEventListener('click', (e) => {
            e.stopPropagation();  // 防止事件冒泡到document
            openChat(selectedText);  // 打开聊天界面并预填充选中的文本
            bubble.style.display = 'none';  // 隐藏气泡
        });

        // 悬浮球点击事件 - 打开空的聊天界面
        dockBtn.addEventListener('click', () => openChat());

        // 侧边栏控制按钮事件
        sidebar.querySelector('.ai-collapse-btn').addEventListener('click', () => closeChat(true));  // 收起按钮：关闭侧边栏并显示悬浮球
        sidebar.querySelector('.ai-close-btn').addEventListener('click', () => clearAndCloseChat());  // 关闭按钮：清空聊天并关闭侧边栏

        // 设置面板控制
        settingsBtn.addEventListener('click', () => {
            // 切换设置面板的显示/隐藏状态
            const isHidden = getComputedStyle(settingsPanel).display === 'none';
            settingsPanel.style.display = isHidden ? 'flex' : 'none';
        });

        // 从localStorage加载用户配置
        const savedBaseUrl = localStorage.getItem('ai_base_url');
        const savedApiKey = localStorage.getItem('ai_api_key');
        if (savedBaseUrl) baseUrlInput.value = savedBaseUrl;  // 恢复API基础URL
        if (savedApiKey) apiKeyInput.value = savedApiKey;     // 恢复API密钥

        // 实时保存用户配置到localStorage
        baseUrlInput.addEventListener('change', (e) => localStorage.setItem('ai_base_url', e.target.value));  // 保存API基础URL
        apiKeyInput.addEventListener('change', (e) => localStorage.setItem('ai_api_key', e.target.value));    // 保存API密钥

        // 消息发送相关事件
        sendBtn.addEventListener('click', handleSend);  // 点击发送按钮触发发送
        input.addEventListener('keydown', (e) => {
            // 键盘事件处理：Enter发送，Shift+Enter换行
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();  // 阻止默认的换行行为
                handleSend();        // 触发消息发送
            }
        });
    }
})();
