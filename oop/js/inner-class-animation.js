/**
 * Java内部类动效演示脚本
 * 提供交互式的内部类概念可视化演示
 */

class InnerClassAnimation {
    constructor() {
        this.currentSlide = 0;
        this.animationStates = {};
        this.init();
    }

    /**
     * 初始化动效系统
     */
    init() {
        // 监听幻灯片切换事件
        document.addEventListener('slidechange', (e) => {
            this.currentSlide = e.detail.index;
            this.resetAllAnimations();
            this.initSlideAnimations();
        });

        // 初始化当前幻灯片的动效
        this.initSlideAnimations();

        // 如果不是在PPT环境中，直接初始化所有动效
        if (!document.querySelector('.slide')) {
            this.initAllAnimations();
        }
    }

    /**
     * 重置所有动效
     */
    resetAllAnimations() {
        // 清理现有的动效容器
        document.querySelectorAll('.animation-container').forEach(container => {
            container.remove();
        });

        // 重置动效状态
        this.animationStates = {};
    }

    /**
     * 初始化所有动效（用于非PPT环境）
     */
    initAllAnimations() {
        const body = document.body;

        // 检查页面内容并添加相应动效
        const bodyContent = body.textContent;

        if (bodyContent.includes('成员内部类的使用')) {
            this.addMemberInnerClassAnimation(body);
        }
        if (bodyContent.includes('静态内部类的使用')) {
            this.addStaticInnerClassAnimation(body);
        }
        if (bodyContent.includes('this关键字')) {
            this.addThisKeywordAnimation(body);
        }
        if (bodyContent.includes('访问外部成员')) {
            this.addAccessOuterMembersAnimation(body);
        }
        if (bodyContent.includes('匿名内部类的使用')) {
            this.addAnonymousInnerClassAnimation(body);
        }
    }

    /**
     * 初始化当前幻灯片的动效
     */
    initSlideAnimations() {
        const slides = document.querySelectorAll('.slide');
        if (!slides[this.currentSlide]) return;

        const currentSlideElement = slides[this.currentSlide];

        // 根据幻灯片内容决定添加哪种动效
        const slideContent = currentSlideElement.textContent;

        if (slideContent.includes('成员内部类的使用')) {
            this.addMemberInnerClassAnimation(currentSlideElement);
        } else if (slideContent.includes('静态内部类的使用')) {
            this.addStaticInnerClassAnimation(currentSlideElement);
        } else if (slideContent.includes('this关键字')) {
            this.addThisKeywordAnimation(currentSlideElement);
        } else if (slideContent.includes('访问外部成员')) {
            this.addAccessOuterMembersAnimation(currentSlideElement);
        } else if (slideContent.includes('匿名内部类的使用')) {
            this.addAnonymousInnerClassAnimation(currentSlideElement);
        }
    }

    /**
     * 成员内部类对象创建动效
     */
    addMemberInnerClassAnimation(slideElement) {
        const container = this.createAnimationContainer(slideElement);

        // 创建动效控制按钮
        const controls = this.createAnimationControls('memberInnerClass');
        container.appendChild(controls);

        // 创建步骤指示器
        const stepIndicator = this.createStepIndicator(3);
        container.appendChild(stepIndicator);

        // 创建对象可视化区域
        const visualArea = document.createElement('div');
        visualArea.className = 'visual-area';
        visualArea.innerHTML = `
            <div style="text-align: center; margin: 20px 0;">
                <div id="step1" class="animation-step" style="display: none;">
                    <div class="object-box outer-class fade-in">
                        <div class="object-title">Test 对象</div>
                        <div class="object-member">name: "外部类"</div>
                        <div class="object-member">Inner 内部类定义</div>
                    </div>
                    <div class="step-description">第1步：创建外部类对象</div>
                </div>

                <div id="step2" class="animation-step" style="display: none;">
                    <div class="arrow-container">
                        <div class="arrow dependency"></div>
                    </div>
                </div>

                <div id="step3" class="animation-step" style="display: none;">
                    <div class="object-box inner-class slide-in-right">
                        <div class="object-title">Inner 对象</div>
                        <div class="object-member">依附于Test对象</div>
                        <div class="permission-badge allowed">可访问外部成员</div>
                    </div>
                    <div class="step-description">第3步：通过外部对象创建内部对象</div>
                </div>
            </div>
        `;

        container.appendChild(visualArea);

        // 初始化动效状态
        this.animationStates.memberInnerClass = {
            currentStep: 0,
            totalSteps: 3,
            container: container
        };
    }

    /**
     * 静态内部类 vs 成员内部类对比动效
     */
    addStaticInnerClassAnimation(slideElement) {
        const container = this.createAnimationContainer(slideElement);

        // 创建动效控制按钮
        const controls = this.createAnimationControls('staticComparison');
        container.appendChild(controls);

        // 创建对比布局
        const comparisonArea = document.createElement('div');
        comparisonArea.className = 'comparison-container';
        comparisonArea.innerHTML = `
            <div class="comparison-column member">
                <div class="comparison-title">成员内部类</div>
                <div id="member-step1" class="animation-step" style="display: none;">
                    <div class="object-box outer-class">
                        <div class="object-title">Test 对象</div>
                        <div class="object-member">必须先创建</div>
                    </div>
                </div>
                <div id="member-step2" class="animation-step" style="display: none;">
                    <div class="arrow dependency"></div>
                </div>
                <div id="member-step3" class="animation-step" style="display: none;">
                    <div class="object-box inner-class">
                        <div class="object-title">Inner 对象</div>
                        <div class="permission-badge allowed">可访问所有成员</div>
                    </div>
                </div>
                <div style="margin-top: 10px; font-family: monospace; font-size: 12px;">
                    test.new Inner()
                </div>
            </div>

            <div class="comparison-column static">
                <div class="comparison-title">静态内部类</div>
                <div id="static-step1" class="animation-step" style="display: none;">
                    <div class="object-box static-class">
                        <div class="object-title">StaticInner 对象</div>
                        <div class="object-member">直接创建</div>
                        <div class="permission-badge allowed">只能访问静态成员</div>
                    </div>
                </div>
                <div style="margin-top: 10px; font-family: monospace; font-size: 12px;">
                    new Test.Inner()
                </div>
            </div>
        `;

        container.appendChild(comparisonArea);

        // 初始化动效状态
        this.animationStates.staticComparison = {
            currentStep: 0,
            totalSteps: 3,
            container: container
        };
    }

    /**
     * this关键字区分动效
     */
    addThisKeywordAnimation(slideElement) {
        const container = this.createAnimationContainer(slideElement);

        // 创建动效控制按钮
        const controls = this.createAnimationControls('thisKeyword');
        container.appendChild(controls);

        // 创建this演示区域
        const thisDemoArea = document.createElement('div');
        thisDemoArea.className = 'this-demo-area';
        thisDemoArea.innerHTML = `
            <div style="display: flex; justify-content: space-around; align-items: center; margin: 20px 0;">
                <div id="outer-object" class="object-box outer-class" style="display: none;">
                    <div class="object-title">Test 对象</div>
                    <div class="object-member" id="outer-name">name: "外部类"</div>
                    <div style="margin-top: 10px; font-size: 11px; color: #666;">
                        Test.this.name
                    </div>
                </div>

                <div id="inner-object" class="object-box inner-class" style="display: none;">
                    <div class="object-title">Inner 对象</div>
                    <div class="object-member" id="inner-name">name: "内部类"</div>
                    <div style="margin-top: 10px; font-size: 11px; color: #666;">
                        this.name
                    </div>
                </div>

                <div id="param-object" class="object-box" style="display: none;">
                    <div class="object-title">方法参数</div>
                    <div class="object-member" id="param-name">name: "参数"</div>
                    <div style="margin-top: 10px; font-size: 11px; color: #666;">
                        name
                    </div>
                </div>
            </div>

            <div id="code-demo" style="margin: 20px 0; display: none;">
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px;">
System.out.println("方法参数的name = " + <span id="code-param" class="code-highlight">name</span>);    // 就近原则，参数
System.out.println("成员内部类的name = " + <span id="code-this" class="code-highlight">this.name</span>);   // 内部类对象
System.out.println("外部类的name = " + <span id="code-outer" class="code-highlight">Test.this.name</span>); // 外部类对象
                </pre>
            </div>
        `;

        container.appendChild(thisDemoArea);

        // 初始化动效状态
        this.animationStates.thisKeyword = {
            currentStep: 0,
            totalSteps: 4,
            container: container
        };
    }

    /**
     * 内部类访问外部成员动效
     */
    addAccessOuterMembersAnimation(slideElement) {
        const container = this.createAnimationContainer(slideElement);

        // 创建动效控制按钮
        const controls = this.createAnimationControls('accessOuter');
        container.appendChild(controls);

        // 创建访问演示区域
        const accessDemoArea = document.createElement('div');
        accessDemoArea.className = 'access-demo-area';
        accessDemoArea.innerHTML = `
            <div style="text-align: center; margin: 20px 0;">
                <div id="outer-class-access" class="object-box outer-class" style="display: none;">
                    <div class="object-title">Test 对象</div>
                    <div class="object-member">private String name</div>
                    <div class="object-member">private int age</div>
                    <div class="object-member">public void method()</div>
                    <div style="margin-top: 10px;">
                        <span class="permission-badge allowed">私有成员可访问</span>
                    </div>
                </div>

                <div id="access-arrow" style="display: none; margin: 20px 0;">
                    <div class="arrow access"></div>
                    <div style="font-size: 12px; color: #28a745; margin-top: 5px;">
                        内部类可访问外部类所有成员
                    </div>
                </div>

                <div id="inner-class-access" class="object-box inner-class" style="display: none;">
                    <div class="object-title">Inner 对象</div>
                    <div class="object-member">可以访问外部类的 name</div>
                    <div class="object-member">可以访问外部类的 age</div>
                    <div class="object-member">可以调用外部类的 method()</div>
                </div>
            </div>

            <div id="memory-layout-access" class="memory-layout" style="display: none;">
                <div class="memory-block heap">
                    <strong>堆内存</strong>
                    <div style="margin-top: 10px;">
                        Test对象 [地址: 0x1234]
                        <div style="margin-left: 20px;">name: "外部类"</div>
                        <div style="margin-left: 20px;">Inner对象 [地址: 0x5678]</div>
                        <div style="margin-left: 40px;">→ 引用外部Test对象</div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(accessDemoArea);

        // 初始化动效状态
        this.animationStates.accessOuter = {
            currentStep: 0,
            totalSteps: 4,
            container: container
        };
    }

    /**
     * 匿名内部类创建动效
     */
    addAnonymousInnerClassAnimation(slideElement) {
        const container = this.createAnimationContainer(slideElement);

        // 创建动效控制按钮
        const controls = this.createAnimationControls('anonymous');
        container.appendChild(controls);

        // 创建匿名内部类演示区域
        const anonymousDemoArea = document.createElement('div');
        anonymousDemoArea.className = 'anonymous-demo-area';
        anonymousDemoArea.innerHTML = `
            <div id="abstract-template" class="animation-step" style="display: none;">
                <div class="object-box" style="border-style: dashed; opacity: 0.7;">
                    <div class="object-title">Student (抽象类模板)</div>
                    <div class="object-member">+ abstract void test()</div>
                    <div style="margin-top: 10px; color: #666; font-size: 12px;">
                        不能直接创建实例
                    </div>
                </div>
            </div>

            <div id="creation-process" class="animation-step" style="display: none;">
                <div style="margin: 20px 0; text-align: center;">
                    <div class="arrow" style="transform: rotate(90deg); margin: 20px auto;"></div>
                    <div style="font-family: monospace; font-size: 14px; color: #007bff;">
                        new Student() { ... }
                    </div>
                </div>
            </div>

            <div id="anonymous-implementation" class="animation-step" style="display: none;">
                <div class="object-box anonymous-class">
                    <div class="object-title">Student$1 (匿名内部类)</div>
                    <div class="object-member">+ void test() [已实现]</div>
                    <div class="object-member">+ int a [新增成员]</div>
                    <div style="margin-top: 10px;">
                        <span class="permission-badge allowed">具体实现</span>
                    </div>
                </div>
            </div>

            <div id="code-generation" class="animation-step" style="display: none;">
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px;">
                    <div class="typewriter">
Student student = new Student() {<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-highlight">@Override</span><br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-highlight">public void test() {</span><br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;System.out.println("我是匿名内部类的实现!");<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="code-highlight">}</span><br>
};
                    </div>
                </div>
            </div>
        `;

        container.appendChild(anonymousDemoArea);

        // 初始化动效状态
        this.animationStates.anonymous = {
            currentStep: 0,
            totalSteps: 4,
            container: container
        };
    }

    /**
     * 创建动效容器
     */
    createAnimationContainer(slideElement) {
        const container = document.createElement('div');
        container.className = 'animation-container';

        // 找到合适的位置插入容器（在代码块之后）
        const codeBlock = slideElement.querySelector('pre');
        if (codeBlock && codeBlock.nextSibling) {
            slideElement.insertBefore(container, codeBlock.nextSibling);
        } else {
            slideElement.appendChild(container);
        }

        return container;
    }

    /**
     * 创建动效控制按钮
     */
    createAnimationControls(animationType) {
        const controls = document.createElement('div');
        controls.className = 'animation-controls';
        controls.innerHTML = `
            <button onclick="innerClassAnimation.previousStep('${animationType}')" id="prev-${animationType}">上一步</button>
            <button onclick="innerClassAnimation.nextStep('${animationType}')" id="next-${animationType}">下一步</button>
            <button onclick="innerClassAnimation.resetAnimation('${animationType}')" id="reset-${animationType}">重置</button>
        `;
        return controls;
    }

    /**
     * 创建步骤指示器
     */
    createStepIndicator(totalSteps) {
        const indicator = document.createElement('div');
        indicator.className = 'step-indicator';

        for (let i = 1; i <= totalSteps; i++) {
            const step = document.createElement('span');
            step.className = 'step-number';
            step.textContent = i;
            step.id = `step-indicator-${i}`;
            indicator.appendChild(step);
        }

        return indicator;
    }

    /**
     * 下一步
     */
    nextStep(animationType) {
        const state = this.animationStates[animationType];
        if (!state || state.currentStep >= state.totalSteps) return;

        state.currentStep++;
        this.updateAnimation(animationType);
    }

    /**
     * 上一步
     */
    previousStep(animationType) {
        const state = this.animationStates[animationType];
        if (!state || state.currentStep <= 0) return;

        state.currentStep--;
        this.updateAnimation(animationType);
    }

    /**
     * 重置动效
     */
    resetAnimation(animationType) {
        const state = this.animationStates[animationType];
        if (!state) return;

        state.currentStep = 0;
        this.updateAnimation(animationType);
    }

    /**
     * 更新动效显示
     */
    updateAnimation(animationType) {
        const state = this.animationStates[animationType];
        if (!state) return;

        // 更新按钮状态
        const prevBtn = document.getElementById(`prev-${animationType}`);
        const nextBtn = document.getElementById(`next-${animationType}`);

        if (prevBtn) prevBtn.disabled = state.currentStep === 0;
        if (nextBtn) nextBtn.disabled = state.currentStep >= state.totalSteps;

        // 根据动画类型执行特定的更新逻辑
        switch (animationType) {
            case 'memberInnerClass':
                this.updateMemberInnerClassAnimation(state);
                break;
            case 'staticComparison':
                this.updateStaticComparisonAnimation(state);
                break;
            case 'thisKeyword':
                this.updateThisKeywordAnimation(state);
                break;
            case 'accessOuter':
                this.updateAccessOuterAnimation(state);
                break;
            case 'anonymous':
                this.updateAnonymousAnimation(state);
                break;
        }

        // 更新步骤指示器
        this.updateStepIndicator(state);
    }

    /**
     * 更新成员内部类动效
     */
    updateMemberInnerClassAnimation(state) {
        // 隐藏所有步骤
        for (let i = 1; i <= state.totalSteps; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) step.style.display = 'none';
        }

        // 显示当前步骤及之前的步骤
        for (let i = 1; i <= state.currentStep; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                step.style.display = 'block';
                if (i === state.currentStep) {
                    step.classList.add('highlight');
                    setTimeout(() => step.classList.remove('highlight'), 1000);
                }
            }
        }
    }

    /**
     * 更新静态内部类对比动效
     */
    updateStaticComparisonAnimation(state) {
        // 成员内部类步骤
        for (let i = 1; i <= state.totalSteps; i++) {
            const memberStep = document.getElementById(`member-step${i}`);
            if (memberStep) {
                memberStep.style.display = i <= state.currentStep ? 'block' : 'none';
                if (i === state.currentStep && state.currentStep <= state.totalSteps) {
                    memberStep.classList.add('highlight');
                    setTimeout(() => memberStep.classList.remove('highlight'), 1000);
                }
            }
        }

        // 静态内部类（在第2步时显示）
        const staticStep1 = document.getElementById('static-step1');
        if (staticStep1) {
            staticStep1.style.display = state.currentStep >= 2 ? 'block' : 'none';
            if (state.currentStep === 2) {
                staticStep1.classList.add('highlight');
                setTimeout(() => staticStep1.classList.remove('highlight'), 1000);
            }
        }
    }

    /**
     * 更新this关键字动效
     */
    updateThisKeywordAnimation(state) {
        const objects = ['outer-object', 'inner-object', 'param-object'];
        const codeHighlights = ['code-outer', 'code-this', 'code-param'];

        // 根据步骤显示对象和代码高亮
        if (state.currentStep >= 1) {
            document.getElementById('outer-object').style.display = 'block';
            document.getElementById('code-demo').style.display = 'block';
        }
        if (state.currentStep >= 2) {
            document.getElementById('inner-object').style.display = 'block';
        }
        if (state.currentStep >= 3) {
            document.getElementById('param-object').style.display = 'block';
        }

        // 代码高亮
        codeHighlights.forEach((id, index) => {
            const element = document.getElementById(id);
            if (element) {
                if (state.currentStep === index + 1) {
                    element.classList.add('highlight');
                    setTimeout(() => element.classList.remove('highlight'), 1000);
                }
            }
        });
    }

    /**
     * 更新访问外部成员动效
     */
    updateAccessOuterAnimation(state) {
        const elements = ['outer-class-access', 'access-arrow', 'inner-class-access', 'memory-layout-access'];

        elements.forEach((id, index) => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = index < state.currentStep ? 'block' : 'none';
                if (index === state.currentStep - 1) {
                    element.classList.add('highlight');
                    setTimeout(() => element.classList.remove('highlight'), 1000);
                }
            }
        });
    }

    /**
     * 更新匿名内部类动效
     */
    updateAnonymousAnimation(state) {
        const elements = ['abstract-template', 'creation-process', 'anonymous-implementation', 'code-generation'];

        elements.forEach((id, index) => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = index < state.currentStep ? 'block' : 'none';
                if (index === state.currentStep - 1) {
                    element.classList.add('highlight');
                    setTimeout(() => element.classList.remove('highlight'), 1000);
                }
            }
        });
    }

    /**
     * 更新步骤指示器
     */
    updateStepIndicator(state) {
        for (let i = 1; i <= state.totalSteps; i++) {
            const indicator = document.getElementById(`step-indicator-${i}`);
            if (indicator) {
                indicator.classList.remove('active', 'completed');
                if (i === state.currentStep) {
                    indicator.classList.add('active');
                } else if (i < state.currentStep) {
                    indicator.classList.add('completed');
                }
            }
        }
    }
}

// 创建全局实例
let innerClassAnimation;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    innerClassAnimation = new InnerClassAnimation();
});

// 导出类供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InnerClassAnimation;
}