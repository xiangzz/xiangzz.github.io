// animation.js - 动画控制逻辑

// 类与对象动画控制
function initClassObjectAnimation() {
    const startBtn = document.getElementById('startAnimation');
    const resetBtn = document.getElementById('resetAnimation');
    const objectInstances = document.querySelectorAll('.object-instance');

    if (!startBtn || !resetBtn || objectInstances.length === 0) {
        return; // 如果元素不存在，直接返回
    }

    function startAnimation() {
        // 重置所有对象实例和箭头
        objectInstances.forEach(instance => {
            instance.classList.remove('active');
        });
        const instantiationArrow = document.querySelector('.instantiation-arrow');
        if (instantiationArrow) {
            instantiationArrow.classList.remove('active');
        }

        // 首先显示箭头
        setTimeout(() => {
            if (instantiationArrow) {
                instantiationArrow.classList.add('active');
            }
        }, 300);

        // 延迟添加动画类，创建依次出现的效果
        objectInstances.forEach((instance, index) => {
            setTimeout(() => {
                instance.classList.add('active');
            }, index * 600 + 500); // 每个对象间隔600ms，首个延迟500ms
        });

        // 禁用开始按钮，防止重复点击
        startBtn.disabled = true;
        setTimeout(() => {
            startBtn.disabled = false;
        }, objectInstances.length * 600 + 1000);
    }

    function resetAnimation() {
        objectInstances.forEach(instance => {
            instance.classList.remove('active');
        });
        const instantiationArrow = document.querySelector('.instantiation-arrow');
        if (instantiationArrow) {
            instantiationArrow.classList.remove('active');
        }
        startBtn.disabled = false;
    }

    // 绑定事件监听器
    startBtn.addEventListener('click', startAnimation);
    resetBtn.addEventListener('click', resetAnimation);

    // 当切换到包含动画的幻灯片时，自动重置动画状态
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const slide = mutation.target;
                if (slide.classList.contains('active') && slide.querySelector('.class-object-animation')) {
                    // 延迟重置，确保幻灯片切换动画完成
                    setTimeout(resetAnimation, 100);
                }
            }
        });
    });

    // 观察所有幻灯片的class变化
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => {
        observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
    });
}

// 内存模型动画控制
function initMemoryModelAnimation() {
    const startBtn = document.getElementById('startMemoryAnimation');
    const resetBtn = document.getElementById('resetMemoryAnimation');
    
    if (!startBtn || !resetBtn) return;
    
    let currentStep = 0;
    let animationTimeout;
    
    function resetAnimation() {
        clearTimeout(animationTimeout);
        currentStep = 0;
        
        // 重置所有元素状态
        document.querySelectorAll('.variable-box, .object-box, .step-indicator').forEach(el => {
            el.classList.remove('active');
        });
    }
    
    function startAnimation() {
        resetAnimation();
        
        const steps = [
            () => {
                // 步骤1: 创建基本类型变量 a
                document.querySelector('[data-step="1"].primitive-var').classList.add('active');
                document.querySelector('[data-step="1"].step-indicator').classList.add('active');
            },
            () => {
                // 步骤2: 基本类型赋值 b = a
                document.querySelector('[data-step="2"].primitive-var').classList.add('active');
                document.querySelector('[data-step="2"].step-indicator').classList.add('active');
            },
            () => {
                // 步骤3: 创建对象 p1
                document.querySelector('[data-step="3"].reference-var').classList.add('active');
                document.querySelector('[data-step="3"].object-box').classList.add('active');
                document.querySelector('[data-step="3"].step-indicator').classList.add('active');
            },
            () => {
                // 步骤4: 引用赋值 p2 = p1
                document.querySelector('[data-step="4"].reference-var').classList.add('active');
                document.querySelector('[data-step="4"].step-indicator').classList.add('active');
            }
        ];
        
        function executeStep(stepIndex) {
            if (stepIndex < steps.length) {
                steps[stepIndex]();
                currentStep = stepIndex + 1;
                
                if (stepIndex < steps.length - 1) {
                    animationTimeout = setTimeout(() => {
                        executeStep(stepIndex + 1);
                    }, 1500);
                }
            }
        }
        
        executeStep(0);
    }
    
    startBtn.addEventListener('click', startAnimation);
    resetBtn.addEventListener('click', resetAnimation);
    
    // 幻灯片切换时重置动画
    const originalShowSlide = window.showSlide;
    window.showSlide = function(n) {
        resetAnimation();
        return originalShowSlide ? originalShowSlide(n) : null;
    };
}

// 导出函数供外部使用
window.initClassObjectAnimation = initClassObjectAnimation;
window.initMemoryModelAnimation = initMemoryModelAnimation;