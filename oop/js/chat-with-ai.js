(function() {
    // 防止重复初始化
    if (document.getElementById('ai-helper-bubble')) return;

    // 0. 加载外部依赖 (Marked.js, Highlight.js)
    function loadResource(type, url) {
        return new Promise((resolve, reject) => {
            let element;
            if (type === 'script') {
                element = document.createElement('script');
                element.src = url;
                element.onload = resolve;
                element.onerror = reject;
            } else if (type === 'css') {
                element = document.createElement('link');
                element.rel = 'stylesheet';
                element.href = url;
                element.onload = resolve;
                element.onerror = reject;
            }
            document.head.appendChild(element);
        });
    }

    Promise.all([
        loadResource('script', 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'),
        loadResource('script', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'),
        loadResource('css', 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css')
    ]).then(() => {
        // 配置 Marked 使用 Highlight.js
        if (window.marked && window.hljs) {
            window.marked.setOptions({
                highlight: function(code, lang) {
                    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language }).value;
                },
                langPrefix: 'hljs language-'
            });
        }
    }).catch(err => console.error('Failed to load AI Chat dependencies:', err));

    // 1. 注入样式
    const style = document.createElement('style');
    style.textContent = `
        /* AI 气泡 */
        #ai-helper-bubble {
            position: fixed;
            background-color: #333;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            z-index: 2147483647; /* Max z-index */
            display: none;
            transition: transform 0.2s, opacity 0.2s;
            pointer-events: auto;
        }

        #ai-helper-bubble:hover {
            transform: scale(1.1);
            background-color: #000;
        }

        #ai-helper-bubble::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #333 transparent transparent transparent;
        }

        /* 侧边栏对话框 */
        #ai-chat-sidebar {
            position: fixed;
            top: 0;
            right: -400px; /* 初始状态，会被 js 动态修改 */
            width: 400px;  /* 默认宽度 */
            min-width: 300px;
            max-width: 80vw;
            height: 100vh;
            background-color: #ffffff;
            box-shadow: -4px 0 20px rgba(0,0,0,0.1);
            z-index: 2147483647;
            transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 只过渡 right 属性，避免影响 resize */
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            box-sizing: border-box;
        }

        #ai-chat-sidebar * {
            box-sizing: border-box;
        }

        #ai-chat-sidebar.open {
            right: 0;
        }
        
        /* 拖拽把手 */
        #ai-chat-resizer {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 5px;
            cursor: w-resize;
            background: transparent;
            z-index: 2147483648;
        }
        
        #ai-chat-resizer:hover, #ai-chat-resizer.resizing {
            background: rgba(0, 123, 255, 0.2);
        }

        /* 头部 */
        .ai-chat-header {
            padding: 16px 20px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #eaeaea;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .ai-chat-header h3 {
            margin: 0;
            font-size: 16px;
            color: #333;
            font-weight: 600;
        }

        .ai-close-btn {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.5;
            cursor: pointer;
            color: #666;
            padding: 4px 12px;
            transition: all 0.2s;
        }

        .ai-close-btn:hover {
            background-color: #f5f5f5;
            color: #333;
            border-color: #ccc;
        }

        /* 消息区域 */
        .ai-chat-body {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
        }

        .ai-message {
            padding: 12px 16px;
            border-radius: 12px;
            max-width: 85%;
            line-height: 1.5;
            font-size: 14px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            width: fit-content;
        }

        .ai-message.user {
            background-color: #007bff;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
        }

        .ai-message.ai {
            background-color: #f1f3f5;
            color: #333;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
        }

        /* Markdown 样式增强 */
        .ai-message.ai p {
            margin: 0 0 10px 0;
        }
        .ai-message.ai p:last-child {
            margin-bottom: 0;
        }
        .ai-message.ai ul, .ai-message.ai ol {
            margin: 5px 0 10px 20px;
            padding: 0;
        }
        .ai-message.ai pre {
            background: #2d2d2d;
            color: #ccc;
            padding: 10px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 10px 0;
            font-family: Consolas, Monaco, 'Courier New', monospace;
            font-size: 13px;
        }
        .ai-message.ai code {
            font-family: Consolas, Monaco, 'Courier New', monospace;
            background-color: rgba(0,0,0,0.05);
            padding: 2px 4px;
            border-radius: 3px;
        }
        .ai-message.ai pre code {
            background-color: transparent;
            padding: 0;
            color: inherit;
        }

        /* 底部输入框 */
        .ai-chat-footer {
            padding: 15px 20px;
            border-top: 1px solid #eaeaea;
            background-color: #fff;
        }

        .ai-chat-input-wrapper {
            display: flex;
            gap: 10px;
            background: #f8f9fa;
            padding: 5px;
            border-radius: 8px;
            border: 1px solid #eaeaea;
        }

        #ai-chat-input {
            flex: 1;
            padding: 8px 12px;
            border: none;
            background: transparent;
            outline: none;
            font-size: 14px;
            resize: none;
            height: 40px; /* simple fixed height for now */
            line-height: 20px;
        }

        #ai-chat-send {
            padding: 0 15px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            transition: background-color 0.2s;
        }

        #ai-chat-send:hover {
            background-color: #0056b3;
        }
    `;
    document.head.appendChild(style);

    // 2. 创建 DOM 元素
    // 气泡
    const bubble = document.createElement('div');
    bubble.id = 'ai-helper-bubble';
    bubble.innerText = 'AI';
    document.body.appendChild(bubble);

    // 侧边栏
    const sidebar = document.createElement('div');
    sidebar.id = 'ai-chat-sidebar';
    sidebar.style.right = '-400px'; // 初始内联样式
    sidebar.innerHTML = `
        <div id="ai-chat-resizer"></div>
        <div class="ai-chat-header">
            <h3>AI 学习助手</h3>
            <button class="ai-close-btn" title="关闭">关闭</button>
        </div>
        <div class="ai-chat-body" id="ai-chat-body">
            <div class="ai-message ai">你好！我是你的 AI 助手。选中页面上的文字点击“AI”气泡，我可以为你解释代码、回答问题。</div>
        </div>
        <div class="ai-chat-footer">
            <div class="ai-chat-input-wrapper">
                <textarea id="ai-chat-input" placeholder="输入问题... (Enter 发送)"></textarea>
                <button id="ai-chat-send">发送</button>
            </div>
        </div>
    `;
    document.body.appendChild(sidebar);

    // 3. 事件逻辑
    let selectedText = '';
    
    // 拖拽调整宽度逻辑
    const resizer = document.getElementById('ai-chat-resizer');
    let isResizing = false;
    let startX, startWidth;

    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
        resizer.classList.add('resizing');
        document.body.style.cursor = 'w-resize'; // 强制鼠标样式
        document.body.style.userSelect = 'none'; // 防止拖拽时选中文字
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        const width = startWidth + (startX - e.clientX);
        // 限制最小最大宽度 (CSS 中也有限制，这里做双重保障)
        if (width > 300 && width < window.innerWidth * 0.8) {
            sidebar.style.width = width + 'px';
            // 如果侧边栏是关闭状态，需要保持 hidden 的 right 值同步
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

    // 监听文本选择
    document.addEventListener('mouseup', function(e) {
        // 如果正在调整大小，不处理文本选择
        if (isResizing) return;

        // 如果点击的是气泡或侧边栏内部，不处理
        if (bubble.contains(e.target) || sidebar.contains(e.target)) {
            return;
        }

        // 稍微延迟以获取最新的 selection
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text) {
                selectedText = text;
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                // 计算气泡位置：在选区正上方
                const bubbleWidth = 40; // 预估宽度
                const bubbleHeight = 30; // 预估高度
                
                let top = rect.top - bubbleHeight - 10;
                let left = rect.left + (rect.width / 2) - (bubbleWidth / 2);

                // 边界检查
                if (top < 0) top = rect.bottom + 10; // 如果上方没空间，显示在下方
                if (left < 0) left = 10;
                if (left + bubbleWidth > window.innerWidth) left = window.innerWidth - bubbleWidth - 10;

                bubble.style.top = `${top}px`;
                bubble.style.left = `${left}px`;
                bubble.style.display = 'block';
                
                // 简单的入场动画重置
                bubble.style.opacity = '0';
                setTimeout(() => bubble.style.opacity = '1', 10);
            } else {
                bubble.style.display = 'none';
            }
        }, 10);
    });

    // 气泡点击事件
    bubble.addEventListener('mousedown', (e) => {
        e.preventDefault(); // 防止点击气泡时选区消失
    });

    bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        openChat(selectedText);
        bubble.style.display = 'none';
    });

    // 关闭侧边栏
    sidebar.querySelector('.ai-close-btn').addEventListener('click', () => {
        closeChat();
    });

    // 发送消息逻辑
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const chatBody = document.getElementById('ai-chat-body');

    function openChat(text) {
        sidebar.classList.add('open');
        sidebar.style.right = '0'; // 确保打开时位置正确
        
        if (text) {
            // 自动发送用户选中的文本作为提问
            addMessage(`"${text}"`, 'user');
            
            // 模拟 AI 回复
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                const shortText = text.substring(0, 15) + (text.length > 15 ? '...' : '');
                // Markdown 格式回复示例
                const reply = `你选中了 "**${shortText}**"。
                
这里有一些可能的**学习建议**：

1.  尝试分析这段代码的**时间复杂度**。
2.  思考是否有更优的实现方式。

以下是一个简单的示例代码：

\`\`\`java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello AI!");
    }
}
\`\`\`
`;
                addMessage(reply, 'ai');
            }, 800);
        }
        // 聚焦输入框
        input.focus();
    }
    
    function closeChat() {
        sidebar.classList.remove('open');
        // 关闭时，将 right 设置为负的当前宽度
        const currentWidth = sidebar.offsetWidth;
        sidebar.style.right = `-${currentWidth}px`;
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${sender}`;
        
        if (sender === 'ai' && window.marked) {
            // AI 消息使用 Markdown 渲染
            try {
                msgDiv.innerHTML = window.marked.parse(text);
            } catch (e) {
                console.error('Markdown parse error:', e);
                msgDiv.innerText = text;
            }
        } else {
            // 用户消息纯文本显示
            msgDiv.innerText = text;
        }
        
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
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

    function handleSend() {
        const text = input.value.trim();
        if (text) {
            addMessage(text, 'user');
            input.value = '';
            
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                // 模拟更复杂的 Markdown 回复
                const reply = `我收到了你的问题：**${text}**。

这涉及到一个很棒的编程概念！

> 编程不仅仅是写代码，更是解决问题的艺术。

你可以参考这个列表：
-   [x] 理解问题
-   [ ] 设计算法
-   [ ] 编写代码

\`\`\`javascript
console.log('Keep coding!');
\`\`\`
`;
                addMessage(reply, 'ai');
            }, 1000);
        }
    }

    sendBtn.addEventListener('click', handleSend);
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

})();
