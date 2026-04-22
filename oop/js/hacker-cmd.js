document.addEventListener('DOMContentLoaded', () => {
    const terminal = document.getElementById('terminal-animation');
    if (!terminal) return;

    /* 模拟真实 CMD 操作序列 */
    const sequences = [
        { text: 'cd Desktop', type: 'command' },
        { text: '', type: 'output' },

        { text: 'mkdir myproject', type: 'command' },
        { text: '', type: 'output' },

        { text: 'cd myproject', type: 'command' },
        { text: '', type: 'output' },

        { text: 'dir', type: 'command' },
        { text: ' 驱动器 C 中的卷是 Windows\n 卷的序列号是 XXXX-XXXX\n\n C:\\Users\\xzz\\Desktop\\myproject 的目录\n\n2025/08/06  16:57    <DIR>          .\n2025/08/06  16:57    <DIR>          ..\n               0 个文件              0 字节\n               2 个目录  120,384,520,192 可用字节', type: 'output' },

        { text: 'echo Hello, CMD! > hello.txt', type: 'command' },
        { text: '', type: 'output' },

        { text: 'dir', type: 'command' },
        { text: ' 驱动器 C 中的卷是 Windows\n\n C:\\Users\\xzz\\Desktop\\myproject 的目录\n\n2025/08/06  16:58                14 hello.txt\n               1 个文件             14 字节\n               2 个目录  120,384,520,192 可用字节', type: 'output' },

        { text: 'type hello.txt', type: 'command' },
        { text: 'Hello, CMD!', type: 'output' },

        { text: 'copy hello.txt backup.txt', type: 'command' },
        { text: '已复制         1 个文件。', type: 'output' },

        { text: 'cls', type: 'command', clear: true },

        { text: 'echo Welcome to Java OOP!', type: 'command' },
        { text: 'Welcome to Java OOP!', type: 'output' },
    ];

    let sequenceIndex = 0;
    let isRunning = false;

    /* 打字机效果 */
    function typewriter(element, text, callback, speed) {
        speed = speed || 70;
        let i = 0;
        element.innerHTML = '';

        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.innerHTML = '\u2588';
        element.appendChild(cursor);

        function type() {
            if (i < text.length) {
                element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
                i++;
                setTimeout(type, speed);
            } else {
                if (callback) callback();
            }
        }
        type();
    }

    /* 清除终端内所有残留光标 */
    function clearAllCursors() {
        var cursors = terminal.querySelectorAll('.cursor');
        for (var i = 0; i < cursors.length; i++) {
            cursors[i].remove();
        }
    }

    /* 自动滚动到底部 */
    function scrollToBottom() {
        terminal.scrollTop = terminal.scrollHeight;
    }

    /* 运行单步序列 */
    function runSequence() {
        if (sequenceIndex >= sequences.length) {
            clearAllCursors();

            setTimeout(function () {
                terminal.innerHTML = '';
                sequenceIndex = 0;
                setTimeout(runSequence, 600);
            }, 4000);
            return;
        }

        const current = sequences[sequenceIndex];

        if (current.clear) {
            terminal.innerHTML = '';
        }

        var line = document.createElement('div');
        line.className = current.type;

        if (current.type === 'command') {
            clearAllCursors();

            var prompt = document.createElement('span');
            prompt.className = 'prompt';
            prompt.textContent = 'C:\\Users\\xzz> ';
            line.appendChild(prompt);

            var commandText = document.createElement('span');
            line.appendChild(commandText);
            terminal.appendChild(line);
            scrollToBottom();

            typewriter(commandText, current.text, function () {
                sequenceIndex++;
                setTimeout(runSequence, 400);
            }, 55);

        } else {
            if (current.text) {
                /* 使用纯文本渲染，避免 <DIR> 这类内容被当作 HTML 标签解析 */
                line.textContent = current.text;
                terminal.appendChild(line);
                scrollToBottom();
            }
            sequenceIndex++;
            setTimeout(runSequence, 150);
        }
    }

    /* 页面翻回时重新触发动画 */
    function startAnimation() {
        if (isRunning) return;
        isRunning = true;
        terminal.innerHTML = '';
        sequenceIndex = 0;
        setTimeout(runSequence, 400);
    }

    function stopAnimation() {
        isRunning = false;
    }

    /* 监听 slide 切换，进入时启动动画，离开时停止 */
    var observer = new MutationObserver(function (mutationsList) {
        for (var i = 0; i < mutationsList.length; i++) {
            var mutation = mutationsList[i];
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                var target = mutation.target;
                if (target.classList.contains('active') && target.classList.contains('hacker-terminal')) {
                    startAnimation();
                } else if (target.classList.contains('hacker-terminal')) {
                    stopAnimation();
                }
            }
        }
    });

    var titleSlide = document.querySelector('.slide.title-slide.hacker-terminal');
    if (titleSlide) {
        observer.observe(titleSlide, { attributes: true });
        if (titleSlide.classList.contains('active')) {
            startAnimation();
        }
    }
});
