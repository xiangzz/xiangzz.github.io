/**
 * 应用程序主入口文件
 * 负责初始化所有模块并启动游戏
 */

// 全局变量
let gameManager;
let vfs;
let commandParser;
let levelManager;

/**
 * 初始化应用程序
 */
function initializeApp() {
    try {
        // 创建核心实例
        gameManager = new GameManager();
        vfs = gameManager.getVFS();
        
        // 创建关卡管理器
        levelManager = new LevelManager(gameManager, vfs);
        gameManager.setLevelManager(levelManager);
        
        // 创建命令解析器（传入levelManager）
        commandParser = new CommandParser(vfs, gameManager, levelManager);
        gameManager.setCommandParser(commandParser);
        
        // 显示欢迎消息
        showWelcomeMessage();
        
        // 设置键盘快捷键
        setupKeyboardShortcuts();
        
        console.log('Windows命令行学习游戏初始化完成');
        
    } catch (error) {
        console.error('应用程序初始化失败:', error);
        showErrorMessage('游戏初始化失败，请刷新页面重试。');
    }
}

/**
 * 显示欢迎消息
 */
function showWelcomeMessage() {
    const welcomeHTML = `
        <div class="welcome-message">
            <h2>🎮 欢迎来到 Windows 命令行学习游戏！</h2>
            <p>这是一个交互式的命令行学习工具，帮助你掌握Windows命令行操作。</p>
            <div class="welcome-tips">
                <h3>游戏说明：</h3>
                <ul>
                    <li>📝 按照左侧任务列表完成每个关卡的要求</li>
                    <li>💡 输入 <code>help</code> 获取当前关卡的提示信息</li>
                    <li>🔄 输入 <code>cls</code> 清除屏幕内容</li>
                    <li>❌ 输入 <code>exit</code> 退出游戏</li>
                    <li>⬆️ 使用上下箭头键查看命令历史</li>
                </ul>
            </div>
            <div class="welcome-controls">
                <h3>快捷键：</h3>
                <ul>
                    <li><kbd>Tab</kbd> - 命令自动补全</li>
                    <li><kbd>Ctrl + L</kbd> - 清屏</li>
                    <li><kbd>Ctrl + R</kbd> - 重置游戏</li>
                    <li><kbd>F1</kbd> - 显示帮助</li>
                </ul>
            </div>
            <p class="start-hint">现在开始第一关的学习吧！祝你游戏愉快！ 🚀</p>
        </div>
    `;
    
    gameManager.addHTMLToTerminal(welcomeHTML, 'welcome');
}

/**
 * 显示错误消息
 */
function showErrorMessage(message) {
    const errorHTML = `
        <div class="error-message">
            <h3>❌ 错误</h3>
            <p>${message}</p>
        </div>
    `;
    
    if (gameManager) {
        gameManager.addHTMLToTerminal(errorHTML, 'error');
    } else {
        // 如果gameManager未初始化，直接在页面显示
        const terminal = document.getElementById('terminal-output');
        if (terminal) {
            terminal.innerHTML = errorHTML;
        }
    }
}

/**
 * 设置键盘快捷键
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl + L: 清屏
        if (event.ctrlKey && event.key === 'l') {
            event.preventDefault();
            if (gameManager) {
                gameManager.clearTerminal();
            }
        }
        
        // Ctrl + R: 重置游戏
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            if (gameManager && confirm('确定要重置游戏吗？')) {
                gameManager.resetGame();
            }
        }
        
        // F1: 显示帮助
        if (event.key === 'F1') {
            event.preventDefault();
            if (gameManager) {
                gameManager.showHelp();
            }
        }
        
        // Ctrl+H 显示帮助
        if (event.ctrlKey && event.key === 'h') {
            event.preventDefault();
            if (gameManager) {
                gameManager.showHelp();
            }
        }
        
        // Ctrl+N 下一关卡（如果当前关卡已完成）
        if (event.ctrlKey && event.key === 'n') {
            event.preventDefault();
            if (gameManager) {
                gameManager.nextLevel();
            }
        }
        
        // Escape: 关闭模态框
        if (event.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // 触摸设备支持
    setupTouchSupport();
    
    // 可访问性改进
    setupAccessibility();
    
    // 窗口大小变化处理
    setupResponsiveHandlers();
}

/**
 * 关闭所有模态框
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

/**
 * 处理页面可见性变化
 */
function handleVisibilityChange() {
    if (document.hidden) {
        // 页面隐藏时暂停游戏计时器等
        console.log('游戏暂停');
    } else {
        // 页面显示时恢复游戏
        console.log('游戏恢复');
        // 确保输入框获得焦点
        const input = document.getElementById('terminal-input');
        if (input) {
            input.focus();
        }
    }
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
    // 调整终端显示区域
    if (gameManager) {
        gameManager.scrollToBottom();
    }
}

/**
 * 处理页面卸载前的清理
 */
function handleBeforeUnload(event) {
    // 如果游戏正在进行，提示用户
    if (gameManager && gameManager.isGameActive) {
        const message = '游戏正在进行中，确定要离开吗？进度可能会丢失。';
        event.returnValue = message;
        return message;
    }
}

/**
 * 检查浏览器兼容性
 */
function checkBrowserCompatibility() {
    const features = {
        localStorage: typeof(Storage) !== "undefined",
        es6: typeof Symbol !== "undefined",
        fetch: typeof fetch !== "undefined"
    };
    
    const unsupported = Object.keys(features).filter(key => !features[key]);
    
    if (unsupported.length > 0) {
        const message = `您的浏览器不支持以下功能: ${unsupported.join(', ')}。建议使用现代浏览器以获得最佳体验。`;
        console.warn(message);
        showErrorMessage(message);
        return false;
    }
    
    return true;
}

/**
 * 加载游戏数据 - 已禁用保存功能
 */
function loadGameData() {
    // 保存功能已禁用，每次都从头开始游戏
    console.log('保存功能已禁用，游戏将从头开始');
    return null;
}

/**
 * 保存游戏数据 - 已禁用保存功能
 */
function saveGameData() {
    // 保存功能已禁用，不执行任何保存操作
    console.log('保存功能已禁用，不保存游戏数据');
}

/**
 * 定期自动保存 - 已禁用保存功能
 */
function setupAutoSave() {
    // 保存功能已禁用，不设置自动保存定时器和事件监听
    console.log('自动保存功能已禁用');
}

/**
 * 设置触摸设备支持
 */
function setupTouchSupport() {
    // 检测触摸设备
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
        
        // 添加触摸手势支持
        let touchStartY = 0;
        const terminal = document.getElementById('terminal-output');
        
        if (terminal) {
            terminal.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            });
            
            terminal.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].clientY;
                const diff = touchStartY - touchY;
                
                // 向上滑动显示帮助
                if (diff > 50) {
                    if (gameManager) {
                        gameManager.showHelp();
                    }
                }
            });
        }
    }
}

/**
 * 设置可访问性改进
 */
function setupAccessibility() {
    // 为键盘导航添加焦点指示器
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // 添加ARIA标签
    const terminal = document.getElementById('terminal-output');
    if (terminal) {
        terminal.setAttribute('role', 'log');
        terminal.setAttribute('aria-live', 'polite');
        terminal.setAttribute('aria-label', '命令行输出区域');
    }
    
    const input = document.getElementById('terminal-input');
    if (input) {
        input.setAttribute('aria-label', '命令输入框');
        input.setAttribute('aria-describedby', 'terminal-output');
    }
}

/**
 * 设置响应式处理
 */
function setupResponsiveHandlers() {
    // 监听屏幕方向变化
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            if (gameManager) {
                gameManager.scrollToBottom();
            }
        }, 100);
    });
    
    // 监听窗口大小变化
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleResize();
        }, 250);
    });
}

/**
  * 处理窗口大小变化
  */
 function handleResize() {
     const gameContainer = document.querySelector('.game-container');
     const terminal = document.getElementById('terminal-output');
     
     if (gameContainer && terminal) {
         // 调整终端高度
         const containerHeight = gameContainer.clientHeight;
         const headerHeight = document.querySelector('.game-header')?.clientHeight || 0;
         const statusHeight = document.querySelector('.status-bar')?.clientHeight || 0;
         const inputHeight = document.querySelector('.terminal-input-line')?.clientHeight || 0;
         
         const availableHeight = containerHeight - headerHeight - statusHeight - inputHeight - 40;
         terminal.style.maxHeight = `${availableHeight}px`;
         
         // 检查是否需要切换布局
         const isMobile = window.innerWidth <= 768;
         const gameMain = document.querySelector('.game-main');
         
         if (gameMain) {
             if (isMobile) {
                 gameMain.classList.add('mobile-layout');
             } else {
                 gameMain.classList.remove('mobile-layout');
             }
         }
         
         // 滚动到底部
         if (gameManager) {
             gameManager.scrollToBottom();
         }
     }
 }

 /**
  * 设置性能监控
  */
function setupPerformanceMonitoring() {
    // 监控内存使用
    if (performance.memory) {
        setInterval(() => {
            const memory = performance.memory;
            if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
                console.warn('内存使用过高:', memory.usedJSHeapSize / 1024 / 1024, 'MB');
            }
        }, 60000); // 每分钟检查一次
    }
}

/**
 * 错误处理
 */
function setupErrorHandling() {
    window.addEventListener('error', function(event) {
        console.error('全局错误:', event.error);
        showErrorMessage('发生了一个错误，游戏可能无法正常工作。请刷新页面重试。');
    });
    
    window.addEventListener('unhandledrejection', function(event) {
        console.error('未处理的Promise拒绝:', event.reason);
        event.preventDefault();
    });
}

/**
 * 主初始化函数
 */
function main() {
    console.log('开始初始化Windows命令行学习游戏...');
    
    // 检查浏览器兼容性
    if (!checkBrowserCompatibility()) {
        return;
    }
    
    // 设置错误处理
    setupErrorHandling();
    
    // 设置事件监听器
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 保存功能已禁用，不加载游戏数据
    console.log('保存功能已禁用，游戏将从第一关开始');
    
    // 初始化应用程序
    initializeApp();
    
    // 设置自动保存
    setupAutoSave();
    
    // 设置性能监控
    setupPerformanceMonitoring();
    
    console.log('Windows命令行学习游戏启动完成！');
}

// 等待DOM加载完成后启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

// 导出全局函数供调试使用
window.gameDebug = {
    gameManager: () => gameManager,
    vfs: () => vfs,
    commandParser: () => commandParser,
    levelManager: () => levelManager,
    saveGame: saveGameData,
    loadGame: loadGameData,
    resetGame: () => gameManager && gameManager.resetGame()
};