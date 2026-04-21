/**
 * 游戏管理器类
 * 负责整体游戏状态管理、用户界面更新和游戏流程控制
 */
class GameManager {
    constructor() {
        this.vfs = new VirtualFileSystem();
        this.commandParser = null; // 将在初始化时设置
        this.levelManager = null; // 将在初始化时设置
        
        this.currentUser = '学生';
        this.score = 0;
        this.commandCount = 0;
        this.gameStartTime = Date.now();
        
        // UI 元素引用
        this.elements = {};
        
        // 游戏状态
        this.isGameActive = true;
        this.currentLevel = 1;
        
        // 事件监听器
        this.eventListeners = new Map();
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateUI();
    }

    /**
     * 初始化UI元素引用
     */
    initializeElements() {
        this.elements = {
            // 头部元素
            levelDisplay: document.getElementById('level-display'),
            userDisplay: document.getElementById('user-display'),
            
            // 关卡面板元素
            levelTitle: document.getElementById('level-title'),
            levelDesc: document.getElementById('level-desc'),
            taskItems: document.getElementById('task-items'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            
            // 终端元素
            terminal: document.getElementById('terminal'),
            terminalOutput: document.getElementById('terminal-output'),
            terminalPrompt: document.getElementById('terminal-prompt'),
            terminalInput: document.getElementById('terminal-input'),
            
            // 状态栏元素
            currentPath: document.getElementById('current-path'),
            commandCount: document.getElementById('command-count'),
            score: document.getElementById('score'),
            
            // 控制按钮
            helpBtn: document.getElementById('help-btn'),
            resetBtn: document.getElementById('reset-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            
            // 模态对话框
            helpModal: document.getElementById('help-modal'),
            closeHelp: document.getElementById('close-help')
        };
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 终端输入事件
        if (this.elements.terminalInput) {
            this.elements.terminalInput.addEventListener('keydown', (e) => {
                this.handleTerminalInput(e);
            });
            
            // 自动聚焦到输入框
            this.elements.terminalInput.focus();
        }

        // 控制按钮事件
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', () => {
                this.showHelp();
            });
        }

        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => {
                this.resetGame();
            });
        }

        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // 模态对话框事件
        if (this.elements.closeHelp) {
            this.elements.closeHelp.addEventListener('click', () => {
                this.hideHelp();
            });
        }

        if (this.elements.helpModal) {
            this.elements.helpModal.addEventListener('click', (e) => {
                if (e.target === this.elements.helpModal) {
                    this.hideHelp();
                }
            });
        }

        // 全局键盘事件
        document.addEventListener('keydown', (e) => {
            // F1 显示帮助
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
            // Escape 关闭模态对话框
            if (e.key === 'Escape') {
                this.hideHelp();
            }
            // 点击任何地方都聚焦到输入框
            if (e.target !== this.elements.terminalInput) {
                this.elements.terminalInput.focus();
            }
        });

        // 点击终端区域聚焦输入框
        if (this.elements.terminal) {
            this.elements.terminal.addEventListener('click', () => {
                this.elements.terminalInput.focus();
            });
        }
    }

    /**
     * 处理终端输入
     */
    handleTerminalInput(event) {
        if (event.key === 'Enter') {
            const command = this.elements.terminalInput.value.trim();
            if (command) {
                this.executeCommand(command);
                this.elements.terminalInput.value = '';
            }
        } else if (event.key === 'ArrowUp') {
            // 显示上一个命令
            event.preventDefault();
            this.showPreviousCommand();
        } else if (event.key === 'ArrowDown') {
            // 显示下一个命令
            event.preventDefault();
            this.showNextCommand();
        } else if (event.key === 'Tab') {
            // 自动完成
            event.preventDefault();
            this.autoComplete();
        }
    }

    /**
     * 执行命令
     */
    executeCommand(command) {
        // 添加命令到历史
        this.vfs.addToHistory(command);
        this.commandCount++;
        
        // 显示命令行
        this.addToTerminal(`${this.vfs.getDisplayPath()}>${command}`, 'command-line');
        
        // 解析并执行命令
        let result = null;
        if (this.commandParser) {
            result = this.commandParser.parseAndExecute(command);
            this.handleCommandResult(result);
        } else {
            this.addToTerminal('错误：命令解析器未初始化', 'error');
            result = { success: false, message: '命令解析器未初始化' };
        }
        
        // 更新UI
        this.updateUI();
        
        // 检查关卡进度，传递命令和执行结果
        if (this.levelManager) {
            this.levelManager.checkProgress(command, result);
        }
        
        // 滚动到底部
        this.scrollToBottom();
    }

    /**
     * 处理命令执行结果
     */
    handleCommandResult(result) {
        if (result.output) {
            this.addToTerminal(result.output, result.type || 'output');
        }
        
        if (result.score) {
            this.score += result.score;
        }
        
        if (result.error) {
            this.addToTerminal(result.error, 'error');
        }
    }

    /**
     * 添加内容到终端
     */
    addToTerminal(content, className = '') {
        const div = document.createElement('div');
        div.className = `command-output ${className}`;
        
        if (typeof content === 'string') {
            div.textContent = content;
        } else {
            div.appendChild(content);
        }
        
        this.elements.terminalOutput.appendChild(div);
    }

    /**
     * 添加HTML内容到终端
     */
    addHTMLToTerminal(htmlContent, className = '') {
        const div = document.createElement('div');
        div.className = `command-output ${className}`;
        div.innerHTML = htmlContent;
        this.elements.terminalOutput.appendChild(div);
    }

    /**
     * 清空终端
     */
    clearTerminal() {
        this.elements.terminalOutput.innerHTML = `
            <div class="welcome-message">
                <p>Microsoft Windows [版本 10.0.19041.1]</p>
                <p>(c) Microsoft Corporation. 保留所有权利。</p>
                <p></p>
                <p>欢迎来到Windows命令行学习游戏！</p>
                <p>输入命令开始学习，输入 'help' 获取帮助。</p>
                <p></p>
            </div>
        `;
    }

    /**
     * 滚动到终端底部
     */
    scrollToBottom() {
        this.elements.terminalOutput.scrollTop = this.elements.terminalOutput.scrollHeight;
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        // 更新头部信息
        if (this.elements.levelDisplay) {
            this.elements.levelDisplay.textContent = this.currentLevel;
        }
        if (this.elements.userDisplay) {
            this.elements.userDisplay.textContent = this.currentUser;
        }
        
        // 更新状态栏
        if (this.elements.currentPath) {
            this.elements.currentPath.textContent = this.vfs.getDisplayPath();
        }
        if (this.elements.commandCount) {
            this.elements.commandCount.textContent = this.commandCount;
        }
        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }
        
        // 更新终端提示符
        if (this.elements.terminalPrompt) {
            this.elements.terminalPrompt.textContent = `${this.vfs.getDisplayPath()}>`;
        }
    }

    /**
     * 更新关卡信息
     */
    updateLevelInfo(levelData) {
        if (this.elements.levelTitle) {
            this.elements.levelTitle.textContent = levelData.title;
        }
        if (this.elements.levelDesc) {
            this.elements.levelDesc.textContent = levelData.description;
        }
        
        this.updateTaskList(levelData.tasks);
        this.currentLevel = levelData.level;
        
        // 更新UI显示，包括左上角的关卡数字
        this.updateUI();
    }

    /**
     * 更新任务列表
     */
    updateTaskList(tasks) {
        if (!this.elements.taskItems) return;
        
        this.elements.taskItems.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            // 适配LevelManager的任务对象格式：text -> description, completed -> status
            const status = task.completed ? 'completed' : 'pending';
            const description = task.text || task.description || '';
            
            li.className = `task-item ${status}`;
            li.textContent = description;
            this.elements.taskItems.appendChild(li);
        });
        
        this.updateProgress(tasks);
    }

    /**
     * 更新进度条
     */
    updateProgress(tasks) {
        // 适配LevelManager的任务对象格式：completed布尔值而非status字符串
        const completed = tasks.filter(task => task.completed === true || task.status === 'completed').length;
        const total = tasks.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percentage}%`;
        }
        if (this.elements.progressText) {
            this.elements.progressText.textContent = `进度: ${completed}/${total}`;
        }
    }

    /**
     * 显示帮助
     */
    showHelp() {
        if (this.elements.helpModal) {
            this.elements.helpModal.style.display = 'block';
        }
    }

    /**
     * 隐藏帮助
     */
    hideHelp() {
        if (this.elements.helpModal) {
            this.elements.helpModal.style.display = 'none';
        }
    }

    /**
     * 显示设置
     */
    showSettings() {
        this.addToTerminal('设置功能正在开发中...', 'info');
    }

    /**
     * 重置游戏
     */
    resetGame() {
        if (confirm('确定要重置游戏吗？这将清除所有进度。')) {
            this.vfs.reset();
            this.score = 0;
            this.commandCount = 0;
            this.currentLevel = 1;
            this.gameStartTime = Date.now();
            
            // 清理localStorage中的任何保存数据
            try {
                localStorage.removeItem('cmdGameData');
                localStorage.removeItem('cmdGameState');
                console.log('已清理localStorage中的游戏数据');
            } catch (e) {
                console.warn('清理localStorage失败:', e);
            }
            
            this.clearTerminal();
            this.updateUI();
            
            if (this.levelManager) {
                this.levelManager.resetToLevel(1);
            }
            
            this.addToTerminal('游戏已重置！', 'success');
        }
    }

    /**
     * 显示上一个命令
     */
    showPreviousCommand() {
        const history = this.vfs.getHistory();
        if (history.length > 0) {
            // 简单实现：显示最后一个命令
            this.elements.terminalInput.value = history[history.length - 1];
        }
    }

    /**
     * 显示下一个命令
     */
    showNextCommand() {
        // 简单实现：清空输入
        this.elements.terminalInput.value = '';
    }

    /**
     * 自动完成
     */
    autoComplete() {
        const input = this.elements.terminalInput.value;
        const suggestions = this.getAutoCompleteSuggestions(input);
        
        if (suggestions.length === 1) {
            this.elements.terminalInput.value = suggestions[0];
        } else if (suggestions.length > 1) {
            this.addToTerminal(`可能的命令: ${suggestions.join(', ')}`, 'info');
        }
    }

    /**
     * 获取自动完成建议
     */
    getAutoCompleteSuggestions(input) {
        const commands = ['dir', 'cd', 'type', 'cls', 'help', 'mkdir', 'del', 'copy', 'move'];
        return commands.filter(cmd => cmd.startsWith(input.toLowerCase()));
    }

    /**
     * 设置命令解析器
     */
    setCommandParser(parser) {
        this.commandParser = parser;
    }

    /**
     * 设置关卡管理器
     */
    setLevelManager(manager) {
        this.levelManager = manager;
    }

    /**
     * 获取虚拟文件系统
     */
    getVFS() {
        return this.vfs;
    }

    /**
     * 获取当前分数
     */
    getScore() {
        return this.score;
    }

    /**
     * 获取游戏进行时间（秒）
     */
    getGameTime() {
        const playTime = Date.now() - this.gameStartTime;
        return Math.floor(playTime / 1000); // 返回秒数
    }

    /**
     * 添加分数
     */
    addScore(points) {
        this.score += points;
        this.updateUI();
    }

    /**
     * 获取游戏统计
     */
    getGameStats() {
        const playTime = Date.now() - this.gameStartTime;
        return {
            level: this.currentLevel,
            score: this.score,
            commandCount: this.commandCount,
            playTime: Math.floor(playTime / 1000), // 秒
            user: this.currentUser
        };
    }

    /**
     * 显示关卡完成消息
     */
    showLevelComplete(levelData) {
        const message = `
            <div class="completion-message">
                <h3>🎉 恭喜！关卡 ${levelData.level} 完成！</h3>
                <p>${levelData.completionMessage}</p>
                <p>获得分数: +${levelData.score}</p>
            </div>
        `;
        this.addHTMLToTerminal(message, 'success');
        this.addScore(levelData.score);
    }

    /**
     * 显示游戏完成消息
     */
    showGameComplete() {
        const stats = this.getGameStats();
        const message = `
            <div class="completion-message">
                <h2>🏆 游戏完成！</h2>
                <p>恭喜您完成了所有关卡！</p>
                <p>最终分数: ${stats.score}</p>
                <p>执行命令: ${stats.commandCount}</p>
                <p>游戏时间: ${Math.floor(stats.playTime / 60)}分${stats.playTime % 60}秒</p>
            </div>
        `;
        this.addHTMLToTerminal(message, 'success');
    }

    /**
     * 保存游戏状态到本地存储 - 已禁用保存功能
     */
    saveGameState() {
        // 保存功能已禁用，不执行任何保存操作
        console.log('保存功能已禁用，不保存游戏状态');
    }

    /**
     * 从本地存储加载游戏状态 - 已禁用保存功能
     */
    loadGameState() {
        // 保存功能已禁用，不加载任何游戏状态
        console.log('保存功能已禁用，不加载游戏状态');
        return false;
    }

    /**
     * 显示欢迎消息
     */
    showWelcome() {
        this.showModal('welcome');
    }

    /**
     * 重置当前关卡
     */
    resetLevel() {
        if (this.levelManager) {
            this.levelManager.resetCurrentLevel();
            this.clearTerminal();
            this.addToTerminal('关卡已重置。', 'info');
            this.updateUI();
        }
    }

    /**
     * 下一关卡
     */
    nextLevel() {
        if (this.levelManager && this.levelManager.canAdvanceToNext()) {
            this.levelManager.nextLevel();
            this.clearTerminal();
            this.addToTerminal('进入下一关卡！', 'success');
            this.updateUI();
        } else {
            this.addToTerminal('请先完成当前关卡的所有任务。', 'error');
        }
    }

    /**
     * 显示模态对话框
     */
    showModal(type) {
        // 根据类型显示不同的模态对话框
        if (type === 'welcome') {
            this.addToTerminal('欢迎来到Windows命令行学习游戏！', 'info');
        }
    }
}