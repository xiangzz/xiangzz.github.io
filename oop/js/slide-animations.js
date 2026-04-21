/**
 * 幻灯片动效控制器
 * 为每个动画幻灯片提供独立的动效控制
 */

// 成员内部类创建动画
class MemberInnerAnimation {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 3;
        this.init();
    }

    init() {
        this.updateControls();
        this.showStep(0);
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStep();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStep();
        }
    }

    reset() {
        this.currentStep = 0;
        this.updateStep();
    }

    updateStep() {
        this.showStep(this.currentStep);
        this.updateControls();
        this.updateStepIndicator();
    }

    showStep(step) {
        // 隐藏所有步骤
        document.getElementById('outer-object-creation').style.display = 'none';
        document.getElementById('dependency-show').style.display = 'none';
        document.getElementById('inner-object-creation').style.display = 'none';

        // 显示当前步骤
        if (step >= 1) {
            const outerStep = document.getElementById('outer-object-creation');
            outerStep.style.display = 'block';
            outerStep.querySelector('.object-box').classList.add('fade-in');
        }

        if (step >= 2) {
            const depStep = document.getElementById('dependency-show');
            depStep.style.display = 'block';
            depStep.querySelector('.arrow').classList.add('highlight');
        }

        if (step >= 3) {
            const innerStep = document.getElementById('inner-object-creation');
            innerStep.style.display = 'block';
            innerStep.querySelector('.object-box').classList.add('slide-in');
        }
    }

    updateControls() {
        const container = document.getElementById('member-inner-demo');
        if (!container) return;

        const prevBtn = container.querySelector('button:nth-child(1)');
        const nextBtn = container.querySelector('button:nth-child(2)');

        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) nextBtn.disabled = this.currentStep >= this.totalSteps;
    }

    updateStepIndicator() {
        for (let i = 1; i <= this.totalSteps; i++) {
            const indicator = document.getElementById(`step-${i}`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');
                if (i === this.currentStep) {
                    indicator.classList.add('active');
                } else if (i < this.currentStep) {
                    indicator.classList.add('completed');
                }
            }
        }
    }
}

// 静态内部类对比动画
class ComparisonAnimation {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 3;
        this.init();
    }

    init() {
        this.updateControls();
        this.showStep(0);
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStep();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStep();
        }
    }

    reset() {
        this.currentStep = 0;
        this.updateStep();
    }

    updateStep() {
        this.showStep(this.currentStep);
        this.updateControls();
        this.updateStepIndicator();
    }

    showStep(step) {
        // 隐藏所有步骤
        ['member-step-1', 'member-step-2', 'member-step-3'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        ['static-step-1', 'static-step-2', 'static-step-3'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });

        // 显示成员内部类步骤
        if (step >= 1) {
            document.getElementById('member-step-1').style.display = 'block';
        }
        if (step >= 2) {
            document.getElementById('member-step-2').style.display = 'block';
        }
        if (step >= 3) {
            document.getElementById('member-step-3').style.display = 'block';
        }

        // 显示静态内部类步骤（从第2步开始）
        if (step >= 2) {
            document.getElementById('static-step-1').style.display = 'block';
        }
        if (step >= 3) {
            document.getElementById('static-step-2').style.display = 'block';
            document.getElementById('static-step-3').style.display = 'block';
        }
    }

    updateControls() {
        const container = document.getElementById('comparison-demo');
        if (!container) return;

        const prevBtn = container.querySelector('button:nth-child(1)');
        const nextBtn = container.querySelector('button:nth-child(2)');

        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) nextBtn.disabled = this.currentStep >= this.totalSteps;
    }

    updateStepIndicator() {
        for (let i = 1; i <= this.totalSteps; i++) {
            const indicator = document.getElementById(`comp-step-${i}`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');
                if (i === this.currentStep) {
                    indicator.classList.add('active');
                } else if (i < this.currentStep) {
                    indicator.classList.add('completed');
                }
            }
        }
    }
}

// this关键字区分动画
class ThisKeywordAnimation {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 4;
        this.init();
    }

    init() {
        this.updateControls();
        this.showStep(0);
        this.setupInteractions();
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStep();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStep();
        }
    }

    reset() {
        this.currentStep = 0;
        this.updateStep();
    }

    updateStep() {
        this.showStep(this.currentStep);
        this.updateControls();
        this.updateStepIndicator();
    }

    showStep(step) {
        // 隐藏所有步骤
        document.getElementById('outer-obj-show').style.display = 'none';
        document.getElementById('inner-obj-show').style.display = 'none';
        document.getElementById('param-obj-show').style.display = 'none';
        document.getElementById('code-show').style.display = 'none';
        document.getElementById('interactive-show').style.display = 'none';

        // 逐步显示
        if (step >= 1) {
            document.getElementById('outer-obj-show').style.display = 'block';
            document.getElementById('code-show').style.display = 'block';
        }
        if (step >= 2) {
            document.getElementById('inner-obj-show').style.display = 'block';
        }
        if (step >= 3) {
            document.getElementById('param-obj-show').style.display = 'block';
        }
        if (step >= 4) {
            document.getElementById('interactive-show').style.display = 'block';
        }
    }

    setupInteractions() {
        // 设置代码高亮交互
        const codeParam = document.getElementById('code-param');
        const codeThis = document.getElementById('code-this');
        const codeOuter = document.getElementById('code-outer');

        const outerObj = document.getElementById('outer-obj');
        const innerObj = document.getElementById('inner-obj');
        const paramObj = document.getElementById('param-obj');

        if (codeParam && paramObj) {
            codeParam.addEventListener('mouseenter', () => {
                paramObj.querySelector('.object-box').classList.add('highlight');
            });
            codeParam.addEventListener('mouseleave', () => {
                paramObj.querySelector('.object-box').classList.remove('highlight');
            });
        }

        if (codeThis && innerObj) {
            codeThis.addEventListener('mouseenter', () => {
                innerObj.querySelector('.object-box').classList.add('highlight');
            });
            codeThis.addEventListener('mouseleave', () => {
                innerObj.querySelector('.object-box').classList.remove('highlight');
            });
        }

        if (codeOuter && outerObj) {
            codeOuter.addEventListener('mouseenter', () => {
                outerObj.querySelector('.object-box').classList.add('highlight');
            });
            codeOuter.addEventListener('mouseleave', () => {
                outerObj.querySelector('.object-box').classList.remove('highlight');
            });
        }
    }

    updateControls() {
        const container = document.getElementById('this-keyword-demo');
        if (!container) return;

        const prevBtn = container.querySelector('button:nth-child(1)');
        const nextBtn = container.querySelector('button:nth-child(2)');

        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) nextBtn.disabled = this.currentStep >= this.totalSteps;
    }

    updateStepIndicator() {
        for (let i = 1; i <= this.totalSteps; i++) {
            const indicator = document.getElementById(`this-step-${i}`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');
                if (i === this.currentStep) {
                    indicator.classList.add('active');
                } else if (i < this.currentStep) {
                    indicator.classList.add('completed');
                }
            }
        }
    }
}

// 内部类访问外部成员动画
class AccessAnimation {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 4;
        this.init();
    }

    init() {
        this.updateControls();
        this.showStep(0);
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStep();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStep();
        }
    }

    reset() {
        this.currentStep = 0;
        this.updateStep();
    }

    updateStep() {
        this.showStep(this.currentStep);
        this.updateControls();
        this.updateStepIndicator();
    }

    showStep(step) {
        // 隐藏所有步骤
        document.getElementById('external-class-show').style.display = 'none';
        document.getElementById('access-path-show').style.display = 'none';
        document.getElementById('permission-granted').style.display = 'none';
        document.getElementById('memory-layout').style.display = 'none';

        // 显示当前步骤
        const steps = ['external-class-show', 'access-path-show', 'permission-granted', 'memory-layout'];
        if (step > 0 && step <= steps.length) {
            const currentStepElement = document.getElementById(steps[step - 1]);
            currentStepElement.style.display = 'block';

            // 添加进入动画
            const objectBox = currentStepElement.querySelector('.object-box');
            if (objectBox) {
                objectBox.classList.add('fade-in');
            }
        }
    }

    updateControls() {
        const container = document.getElementById('access-demo');
        if (!container) return;

        const prevBtn = container.querySelector('button:nth-child(1)');
        const nextBtn = container.querySelector('button:nth-child(2)');

        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) nextBtn.disabled = this.currentStep >= this.totalSteps;
    }

    updateStepIndicator() {
        for (let i = 1; i <= this.totalSteps; i++) {
            const indicator = document.getElementById(`access-step-${i}`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');
                if (i === this.currentStep) {
                    indicator.classList.add('active');
                } else if (i < this.currentStep) {
                    indicator.classList.add('completed');
                }
            }
        }
    }
}

// 匿名内部类创建动画
class AnonymousAnimation {
    constructor() {
        this.currentStep = 0;
        this.totalSteps = 4;
        this.init();
    }

    init() {
        this.updateControls();
        this.showStep(0);
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStep();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStep();
        }
    }

    reset() {
        this.currentStep = 0;
        this.updateStep();
    }

    updateStep() {
        this.showStep(this.currentStep);
        this.updateControls();
        this.updateStepIndicator();
    }

    showStep(step) {
        // 隐藏所有步骤
        document.getElementById('abstract-template').style.display = 'none';
        document.getElementById('traditional-way').style.display = 'none';
        document.getElementById('anonymous-intro').style.display = 'none';
        document.getElementById('final-object').style.display = 'none';

        // 显示当前步骤
        const steps = ['abstract-template', 'traditional-way', 'anonymous-intro', 'final-object'];
        if (step > 0 && step <= steps.length) {
            const currentStepElement = document.getElementById(steps[step - 1]);
            currentStepElement.style.display = 'block';

            // 添加进入动画
            const objectBox = currentStepElement.querySelector('.object-box');
            if (objectBox) {
                objectBox.classList.add('fade-in');
            }
        }
    }

    updateControls() {
        const container = document.getElementById('anonymous-demo');
        if (!container) return;

        const prevBtn = container.querySelector('button:nth-child(1)');
        const nextBtn = container.querySelector('button:nth-child(2)');

        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) nextBtn.disabled = this.currentStep >= this.totalSteps;
    }

    updateStepIndicator() {
        for (let i = 1; i <= this.totalSteps; i++) {
            const indicator = document.getElementById(`anon-step-${i}`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');
                if (i === this.currentStep) {
                    indicator.classList.add('active');
                } else if (i < this.currentStep) {
                    indicator.classList.add('completed');
                }
            }
        }
    }
}

// 全局动画控制器
class SlideAnimationController {
    constructor() {
        this.animations = {};
        this.currentSlide = 0;
        this.init();
    }

    init() {
        // 监听幻灯片切换
        document.addEventListener('slidechange', (e) => {
            this.currentSlide = e.detail.index;
            this.initSlideAnimations();
        });

        // 初始化当前幻灯片
        this.initSlideAnimations();
    }

    initSlideAnimations() {
        const slides = document.querySelectorAll('.slide');
        if (!slides[this.currentSlide]) return;

        const currentSlideElement = slides[this.currentSlide];
        const slideContent = currentSlideElement.textContent;

        // 初始化相应的动画
        if (slideContent.includes('成员内部类创建动画演示')) {
            if (!this.animations.memberInner) {
                this.animations.memberInner = new MemberInnerAnimation();
                // 绑定到全局作用域
                window.memberInnerAnimation = this.animations.memberInner;
            }
        } else if (slideContent.includes('静态内部类 vs 成员内部类对比')) {
            if (!this.animations.comparison) {
                this.animations.comparison = new ComparisonAnimation();
                window.comparisonAnimation = this.animations.comparison;
            }
        } else if (slideContent.includes('this关键字区分动画演示')) {
            if (!this.animations.thisKeyword) {
                this.animations.thisKeyword = new ThisKeywordAnimation();
                window.thisKeywordAnimation = this.animations.thisKeyword;
            }
        } else if (slideContent.includes('内部类访问外部成员动画演示')) {
            if (!this.animations.access) {
                this.animations.access = new AccessAnimation();
                window.accessAnimation = this.animations.access;
            }
        } else if (slideContent.includes('匿名内部类创建动画演示')) {
            if (!this.animations.anonymous) {
                this.animations.anonymous = new AnonymousAnimation();
                window.anonymousAnimation = this.animations.anonymous;
            }
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.slideAnimationController = new SlideAnimationController();
});

// 练习题答案切换功能
function toggleSolution(solutionId) {
    const solutionElement = document.getElementById(solutionId);
    const toggleElement = event.target;
    
    if (solutionElement.style.display === 'none') {
        solutionElement.style.display = 'block';
        toggleElement.textContent = '隐藏答案';
        toggleElement.classList.add('solution-visible');
    } else {
        solutionElement.style.display = 'none';
        toggleElement.textContent = '查看答案';
        toggleElement.classList.remove('solution-visible');
    }
}

// 导出供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MemberInnerAnimation,
        ComparisonAnimation,
        ThisKeywordAnimation,
        AccessAnimation,
        AnonymousAnimation,
        SlideAnimationController,
        toggleSolution
    };
}