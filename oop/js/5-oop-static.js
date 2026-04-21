//======= 幻灯片 5: 静态变量动画演示脚本 =======//
let currentStudentCount = 0;
let staticCount = 0;

function createStudent() {
    if (currentStudentCount >= 3) return;

    currentStudentCount++;
    staticCount++;

    // 显示对象
    const student = document.getElementById(`student${currentStudentCount}`);
    if(student) student.classList.add('active');

    // 更新静态计数器
    updateStaticCounter();

    // 延迟更新共享值以显示动画效果
    setTimeout(() => {
        updateSharedValues();
    }, 300);
}

function incrementCount() {
    staticCount++;
    updateStaticCounter();
    updateSharedValues();
}

function updateStaticCounter() {
    const counter = document.getElementById('staticCounter');
    if (!counter) return;
    counter.textContent = staticCount;
    counter.classList.add('highlight');

    setTimeout(() => {
        counter.classList.remove('highlight');
    }, 500);
}

function updateSharedValues() {
    for (let i = 1; i <= currentStudentCount; i++) {
        const sharedValue = document.getElementById(`sharedValue${i}`);
        if(sharedValue) {
            sharedValue.textContent = staticCount;
            sharedValue.classList.add('highlight');

            setTimeout(() => {
                sharedValue.classList.remove('highlight');
            }, 500);
        }
    }
}

function resetDemo() {
    currentStudentCount = 0;
    staticCount = 0;

    // 重置静态计数器
    const staticCounterElem = document.getElementById('staticCounter');
    if(staticCounterElem) staticCounterElem.textContent = '0';

    // 隐藏所有对象
    for (let i = 1; i <= 3; i++) {
        const student = document.getElementById(`student${i}`);
        if(student) {
            student.classList.remove('active');
            const sharedValueElem = document.getElementById(`sharedValue${i}`);
            if(sharedValueElem) sharedValueElem.textContent = '0';
        }
    }
}


//======= 幻灯片 9: 交互式内存分配演示脚本 =======//
class MemoryAnimationDemo {
    constructor() {
        this.currentStep = 0;
        this.isRunning = false;
        this.speed = 3;
        this.steps = [
            { name: '类加载', action: 'loadClass' },
            { name: '静态初始化', action: 'initStatic' },
            { name: 'main方法执行', action: 'startMain' },
            { name: '创建对象1', action: 'createObject1' },
            { name: '创建对象2', action: 'createObject2' }
        ];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startDemo');
        this.resetBtn = document.getElementById('resetDemo');
        this.stepBtn = document.getElementById('stepDemo');
        this.speedControl = document.getElementById('speedControl');
        this.executionLog = document.getElementById('executionLog');
        this.metaspaceContent = document.getElementById('metaspaceContent');
        this.staticContent = document.getElementById('staticContent');
        this.instanceContent = document.getElementById('instanceContent');
        this.timelineProgress = document.getElementById('timelineProgress');
        this.staticCount = document.getElementById('staticCount');
        this.instanceCount = document.getElementById('instanceCount');
        this.memoryUsage = document.getElementById('memoryUsage');
        this.memorySaved = document.getElementById('memorySaved');
    }

    bindEvents() {
        if (this.startBtn) this.startBtn.addEventListener('click', () => this.startAnimation());
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetAnimation());
        if (this.stepBtn) this.stepBtn.addEventListener('click', () => this.stepAnimation());
        if (this.speedControl) this.speedControl.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
        });
    }

    startAnimation() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startBtn.textContent = '执行中...';
        this.startBtn.disabled = true;
        this.runAnimation();
    }

    async runAnimation() {
        for (let i = this.currentStep; i < this.steps.length; i++) {
            if (!this.isRunning) break; // 允许在执行过程中重置
            await this.executeStep(i);
            await this.delay(2000 / this.speed);
        }
        this.isRunning = false;
        if(this.startBtn) {
            this.startBtn.textContent = '重新开始';
            this.startBtn.disabled = false;
        }
    }

    stepAnimation() {
        if (this.currentStep < this.steps.length) {
            this.executeStep(this.currentStep);
        }
    }

    async executeStep(stepIndex) {
        const step = this.steps[stepIndex];
        this.currentStep = stepIndex + 1;
        
        this.updateTimeline(stepIndex);
        
        await this[step.action]();
        
        this.addLog(`${stepIndex + 1}. ${step.name} 完成`);
    }

    async loadClass() {
        if (this.metaspaceContent) {
            const classInfo = `
                <div class="memory-item animate-in">
                    <strong>Student.class</strong><br>
                    类型: Class对象<br>
                    大小: 1.2KB<br>
                    状态: 已加载
                </div>
            `;
            this.metaspaceContent.innerHTML = classInfo;
        }
        
        await this.delay(1000);
    }

    async initStatic() {
        if(this.staticContent) {
            this.staticContent.innerHTML = `
                <div class="memory-item static-var animate-in" style="animation-delay: 0.2s">
                    <strong>staticVar</strong>
                    <span class="value">"静态变量"</span>
                    <span class="shared-badge">共享</span>
                </div>
                <div class="memory-item static-var animate-in" style="animation-delay: 0.4s">
                    <strong>counter</strong>
                    <span class="value">0</span>
                    <span class="shared-badge">共享</span>
                </div>
            `;
        }
        this.updateStats();
    }

    async startMain() {
        this.addLog('main方法开始执行');
    }

    async createObject1() {
        const obj1Html = `
            <div class="memory-item instance-obj animate-in">
                <h6>AnimationDemo@001</h6>
                <div class="instance-fields">
                    <div class="field">instanceVar: "对象1"</div>
                    <div class="field">id: 1</div>
                </div>
                <div class="class-ref">→ AnimationDemo.class</div>
            </div>
        `;
        
        if (this.instanceContent && this.instanceContent.querySelector('.memory-placeholder')) {
            this.instanceContent.innerHTML = obj1Html;
        } else if (this.instanceContent) {
            this.instanceContent.insertAdjacentHTML('beforeend', obj1Html);
        }
        
        const counterElement = this.staticContent.querySelector('.static-var:last-child .value');
        if (counterElement) {
            counterElement.textContent = '1';
            counterElement.classList.add('value-updated');
        }
        
        this.updateStats();
    }

    async createObject2() {
        const obj2Html = `
            <div class="memory-item instance-obj animate-in">
                <h6>AnimationDemo@002</h6>
                <div class="instance-fields">
                    <div class="field">instanceVar: "对象2"</div>
                    <div class="field">id: 2</div>
                </div>
                <div class="class-ref">→ AnimationDemo.class</div>
            </div>
        `;
        
        if (this.instanceContent) this.instanceContent.insertAdjacentHTML('beforeend', obj2Html);
        
        const counterElement = this.staticContent.querySelector('.static-var:last-child .value');
        if (counterElement) {
            counterElement.textContent = '2';
            counterElement.classList.add('value-updated');
        }
        
        this.updateStats();
    }

    updateTimeline(stepIndex) {
        const progress = ((stepIndex + 1) / this.steps.length) * 100;
        
        if (this.timelineProgress) {
            this.timelineProgress.style.width = `${progress}%`;
        }
        
        // 更新时间轴步骤状态
        const timelineSteps = document.querySelectorAll('.timeline-step');
        
        timelineSteps.forEach((step, index) => {
            const stepMarker = step.querySelector('.step-marker');
            if (index <= stepIndex) {
                step.classList.add('active');
                if (stepMarker) {
                    stepMarker.classList.add('active');
                }
            } else {
                step.classList.remove('active');
                if (stepMarker) {
                    stepMarker.classList.remove('active');
                }
            }
        });
    }

    updateStats() {
        const staticVars = this.staticContent ? this.staticContent.querySelectorAll('.static-var').length : 0;
        const instances = this.instanceContent ? this.instanceContent.querySelectorAll('.instance-obj').length : 0;
        
        if(this.staticCount) this.staticCount.textContent = staticVars;
        if(this.instanceCount) this.instanceCount.textContent = instances;
        
        const totalMemory = staticVars * 8 + instances * 24;
        const savedMemory = instances > 0 ? staticVars * (instances - 1) * 8 : 0;
        
        if(this.memoryUsage) this.memoryUsage.textContent = `${totalMemory} B`;
        if(this.memorySaved) this.memorySaved.textContent = `${savedMemory} B`;
    }

    addLog(message) {
        if (!this.executionLog) return;
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.executionLog.appendChild(logEntry);
        this.executionLog.scrollTop = this.executionLog.scrollHeight;
    }

    resetAnimation() {
        this.currentStep = 0;
        this.isRunning = false;
        if(this.startBtn) {
            this.startBtn.textContent = '开始演示';
            this.startBtn.disabled = false;
        }
        
        if(this.metaspaceContent) this.metaspaceContent.innerHTML = '<div class="memory-placeholder">等待类加载...</div>';
        if(this.staticContent) this.staticContent.innerHTML = '<div class="memory-placeholder">等待静态初始化...</div>';
        if(this.instanceContent) this.instanceContent.innerHTML = '<div class="memory-placeholder">等待对象创建...</div>';
        if(this.executionLog) this.executionLog.innerHTML = '';
        
        if(this.timelineProgress) this.timelineProgress.style.width = '0%';
        document.querySelectorAll('.timeline-step').forEach(step => {
            step.classList.remove('active');
        });
        
        if(this.staticCount) this.staticCount.textContent = '0';
        if(this.instanceCount) this.instanceCount.textContent = '0';
        if(this.memoryUsage) this.memoryUsage.textContent = '0 B';
        if(this.memorySaved) this.memorySaved.textContent = '0 B';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 只有在包含交互式演示的幻灯片上才初始化
    if(document.getElementById('startDemo')) {
        new MemoryAnimationDemo();
    }
});