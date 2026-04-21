// exception-animation.js
// 异常处理流程动画演示脚本

document.addEventListener('DOMContentLoaded', () => {
    // 检查当前页面是否包含异常处理动画
    const codeContainer = document.getElementById('code-container');
    const startBtn = document.getElementById('startAnimation');
    const resetBtn = document.getElementById('resetAnimation');
    const stepDescription = document.getElementById('step-description');
    const stepProgress = document.getElementById('step-progress');

    if (!codeContainer || !startBtn) return;

    let animationRunning = false;
    let currentStep = 0;
    let isStepMode = false; // 标记是否为单步模式
    let animationInterval = null; // 保存动画定时器

    // 保存原始样式
    const originalStyles = new Map();

    const steps = [
        {
            lines: [2], // 开始执行 main 方法
            description: "🚀 程序开始执行...",
            detail: 0,
            highlightClass: 'highlighted'
        },
        {
            lines: [3], // 进入 try 块
            description: "📥 进入 try 块：准备执行可能抛出异常的代码",
            detail: 1,
            highlightClass: 'highlighted'
        },
        {
            lines: [4], // 调用 divide 方法
            description: "🔢 执行 divide(10, 0) 方法调用",
            detail: 2,
            highlightClass: 'highlighted'
        },
        {
            lines: [4], // 异常产生（同一行，不同样式）
            description: "❌ 异常产生！divide 方法检测到除数为0，抛出 IllegalArgumentException",
            detail: 2,
            highlightClass: 'error-highlighted'
        },
        {
            lines: [5], // 跳过这行（不执行）
            description: "⏭️ 程序跳过未执行的代码：System.out.println(result)",
            detail: null,
            highlightClass: ''
        },
        {
            lines: [6], // 进入 catch 块
            description: "🎯 异常捕获！程序跳转到匹配的 catch 块",
            detail: 3,
            highlightClass: 'catch-highlighted'
        },
        {
            lines: [7], // 异常处理
            description: "🔧 执行异常处理代码：打印异常信息",
            detail: 3,
            highlightClass: 'catch-highlighted'
        },
        {
            lines: [8], // 异常再抛出
            description: "🔄 异常再抛出：将异常包装成 RuntimeException 向上层传播",
            detail: 4,
            highlightClass: 'throw-highlighted'
        },
        {
            lines: [9], // 进入 finally 块
            description: "✅ 进入 finally 块：即使异常被重新抛出，finally 仍会执行",
            detail: 5,
            highlightClass: 'finally-highlighted'
        },
        {
            lines: [10], // 资源清理
            description: "🧹 执行资源清理：确保资源正确释放，然后异常继续向上传播",
            detail: 6,
            highlightClass: 'success-highlighted'
        },
        {
            lines: [11], // 代码块结束
            description: "📋 try-catch-finally 块执行完毕",
            detail: null,
            highlightClass: 'finally-highlighted'
        },
        {
            lines: [12], // 程序继续执行（这里会跳过，因为异常已重新抛出）
            description: "⚠️ 程序跳过此行：由于新异常未被捕获，这是不可达语句",
            detail: 7,
            highlightClass: ''
        },
        {
            lines: [13], // main 方法结束（不会执行到这里）
            description: "🏁 main 方法结束：由于异常传播，这里不会执行",
            detail: null,
            highlightClass: ''
        },
        {
            lines: [], // 程序结束
            description: "🏁 异常传播完成：新的 RuntimeException 将在 JVM 中处理并终止程序",
            detail: 7,
            highlightClass: 'error-highlighted'
        }
    ];

    function clearHighlights() {
        const codeLines = codeContainer.querySelectorAll('.code-line');
        codeLines.forEach((line, index) => {
            line.classList.remove('highlighted', 'error-highlighted', 'success-highlighted',
                                 'catch-highlighted', 'throw-highlighted', 'finally-highlighted');
            // 重置内联样式
            line.style.opacity = '';
            line.style.borderLeft = '';
            line.style.marginLeft = '';

            // 恢复原始的 padding-left 值
            const originalStyle = originalStyles.get(index);
            if (originalStyle) {
                line.style.paddingLeft = originalStyle.paddingLeft;
            }
        });

        // 隐藏所有步骤详情
        const stepDetails = document.querySelectorAll('.step-detail');
        stepDetails.forEach(detail => {
            detail.classList.remove('active');
            detail.style.display = 'none';
        });
    }

    function highlightLines(lineNumbers, highlightClass) {
        clearHighlights();

        lineNumbers.forEach(lineNum => {
            const codeLine = codeContainer.querySelector(`.code-line:nth-child(${lineNum})`);
            if (codeLine && highlightClass) {
                codeLine.classList.add(highlightClass);
            } else if (codeLine && !highlightClass) {
                // 如果没有指定高亮类，只添加一个基本的灰色高亮
                codeLine.style.opacity = '0.5';
                codeLine.style.borderLeft = '3px solid #6b7280';
            }
        });
    }

    function showStepDetail(stepNumber) {
        // 隐藏所有详情
        const stepDetails = document.querySelectorAll('.step-detail');
        stepDetails.forEach(detail => {
            detail.classList.remove('active');
            detail.style.display = 'none';
        });

        // 显示当前步骤详情
        const currentDetail = document.querySelector(`.step-detail[data-step="${stepNumber}"]`);
        if (currentDetail) {
            currentDetail.style.display = 'block';
            setTimeout(() => {
                currentDetail.classList.add('active');
            }, 100);
        }
    }

    function executeStep(stepIndex) {
        if (stepIndex >= steps.length) {
            finishAnimation();
            return;
        }

        const step = steps[stepIndex];

        // 更新描述
        stepDescription.textContent = step.description;

        // 高亮代码行
        if (step.lines.length > 0) {
            highlightLines(step.lines, step.highlightClass);
        }

        // 显示步骤详情
        if (step.detail !== null) {
            showStepDetail(step.detail);
        }

        // 更新边框颜色
        const explanation = document.getElementById('explanation');
        explanation.style.borderLeftColor = getStepColor(stepIndex);

        currentStep = stepIndex + 1;

        // 更新按钮状态
        updateButtonState();
    }

    function finishAnimation() {
        animationRunning = false;
        isStepMode = false;
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        startBtn.disabled = false;
        startBtn.textContent = "单步执行";
        stepDescription.textContent = "✨ 动画演示完成！点击'重置'可以重新观看。";
    }

    function updateButtonState() {
        if (isStepMode) {
            startBtn.classList.add('step-mode');

            if (currentStep >= steps.length) {
                startBtn.textContent = "演示完成";
                startBtn.disabled = true;
                startBtn.classList.remove('step-mode');
                stepProgress.textContent = `演示完成 (${steps.length}/${steps.length})`;
            } else {
                startBtn.textContent = `执行下一步 (${currentStep}/${steps.length})`;
                startBtn.disabled = false;
                stepProgress.textContent = `执行进度: ${currentStep}/${steps.length}`;
            }
        } else {
            startBtn.classList.remove('step-mode');
            stepProgress.textContent = '';
        }
    }

    function getStepColor(stepIndex) {
        const colors = [
            '#fbbf24', // 黄色 - 正常执行
            '#fbbf24', // 黄色 - 进入try
            '#fbbf24', // 黄色 - 方法调用
            '#ef4444', // 红色 - 异常产生
            '#6b7280', // 灰色 - 跳过
            '#3b82f6', // 蓝色 - 异常捕获
            '#3b82f6', // 蓝色 - 异常处理
            '#fb923c', // 橙色 - 异常再抛出
            '#a78bfa', // 紫色 - 进入finally
            '#22c55e', // 绿色 - 资源清理
            '#a78bfa', // 紫色 - 块结束
            '#6b7280', // 灰色 - 不可达语句
            '#6b7280', // 灰色 - 方法结束不执行
            '#ef4444'  // 红色 - 异常传播
        ];
        return colors[stepIndex] || '#3b82f6';
    }

    function startAnimation() {
        if (animationRunning && !isStepMode) return;

        if (!animationRunning) {
            // 开始新的单步执行
            animationRunning = true;
            isStepMode = true;
            currentStep = 0;
            stepDescription.textContent = "🚀 开始异常处理流程演示...";

            // 初始清空
            clearHighlights();

            // 执行第一步
            executeStep(0);
        } else if (isStepMode) {
            // 继续执行下一步
            executeStep(currentStep);
        }
    }

    function resetAnimation() {
        animationRunning = false;
        isStepMode = false;
        currentStep = 0;

        // 清理自动执行的定时器（如果有的话）
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }

        clearHighlights();

        startBtn.disabled = false;
        startBtn.textContent = "单步执行";
        startBtn.classList.remove('step-mode');

        stepDescription.textContent = "点击'单步执行'按钮，逐步观察异常的产生、捕获、处理和再抛出流程。";
        stepProgress.textContent = '';

        const explanation = document.getElementById('explanation');
        explanation.style.borderLeftColor = '#3b82f6';
    }

    // 初始化：保存原始样式
    function initOriginalStyles() {
        const codeLines = codeContainer.querySelectorAll('.code-line');
        codeLines.forEach((line, index) => {
            originalStyles.set(index, {
                paddingLeft: line.style.paddingLeft || window.getComputedStyle(line).paddingLeft
            });
        });
    }

    // 绑定事件
    startBtn.addEventListener('click', startAnimation);
    resetBtn.addEventListener('click', resetAnimation);

    // 监听页面切换事件，自动重置动画
    document.addEventListener('slidechange', (e) => {
        // 重置动画状态
        resetAnimation();
    });

    // 初始化原始样式
    initOriginalStyles();
});