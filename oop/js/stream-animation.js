// stream-animation.js - Stream API 动画演示系统

// 学生数据样本
const sampleStudents = [
    { id: 1, name: "张三", age: 20, gender: "男", major: "计算机科学", score: 85, active: true },
    { id: 2, name: "李四", age: 22, gender: "女", major: "软件工程", score: 92, active: true },
    { id: 3, name: "王五", age: 19, gender: "男", major: "计算机科学", score: 78, active: false },
    { id: 4, name: "赵六", age: 21, gender: "女", major: "软件工程", score: 88, active: true },
    { id: 5, name: "钱七", age: 23, gender: "男", major: "数据科学", score: 95, active: true },
    { id: 6, name: "孙八", age: 20, gender: "女", major: "计算机科学", score: 82, active: true },
    { id: 7, name: "张三", age: 24, gender: "男", major: "软件工程", score: 76, active: false },
    { id: 8, name: "周九", age: 22, gender: "女", major: "数据科学", score: 90, active: true }
];

// 动画控制函数
const StreamAnimation = {

    // 1. forEach() 遍历操作动画
    forEachDemo: function() {
        const container = document.getElementById('forEach-animation');
        if (!container) return;

        container.innerHTML = `
            <h3>forEach() 遍历演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.forEachStep()">下一步</button>
                <button onclick="StreamAnimation.resetForEach()">重置</button>
            </div>
            <div class="animation-scene">
                <div class="student-list" id="forEach-students"></div>
                <div class="console-output" id="forEach-console">
                    <h4>控制台输出:</h4>
                    <div class="console-content"></div>
                </div>
            </div>
        `;

        this.renderStudents('forEach-students', sampleStudents);
        this.resetForEach();
    },

    resetForEach: function() {
        // 重置所有状态
        this.forEachCurrentIndex = 0;
        this.forEachStudents = document.querySelectorAll('#forEach-students .student-card');
        this.forEachConsoleContent = document.querySelector('#forEach-console .console-content');

        if (this.forEachConsoleContent) {
            this.forEachConsoleContent.innerHTML = '';
        }

        // 移除所有高亮
        this.forEachStudents.forEach(el => el.classList.remove('highlighted', 'processed'));
    },

    forEachStep: function() {
        if (!this.forEachStudents || this.forEachCurrentIndex >= this.forEachStudents.length) {
            // 处理完成
            if (this.forEachConsoleContent) {
                this.forEachConsoleContent.innerHTML += `<div class="console-line complete">✓ forEach() 遍历完成</div>`;
            }
            return;
        }

        // 移除之前的高亮
        this.forEachStudents.forEach(el => el.classList.remove('highlighted'));

        // 高亮当前处理的学生
        const currentStudent = this.forEachStudents[this.forEachCurrentIndex];
        currentStudent.classList.add('highlighted');

        // 模拟打印到控制台
        const name = currentStudent.querySelector('.student-name').textContent;
        const age = currentStudent.querySelector('.student-age').textContent;
        this.forEachConsoleContent.innerHTML += `<div class="console-line">处理学生: ${name}, 年龄: ${age}</div>`;

        // 滚动到最新输出
        this.forEachConsoleContent.scrollTop = this.forEachConsoleContent.scrollHeight;

        // 标记为已处理
        setTimeout(() => {
            currentStudent.classList.remove('highlighted');
            currentStudent.classList.add('processed');
        }, 300);

        // 移动到下一个
        this.forEachCurrentIndex++;
    },

    // 2. filter() 和 distinct() 筛选操作动画
    filterDemo: function() {
        const container = document.getElementById('filter-animation');
        if (!container) return;

        container.innerHTML = `
            <h3>filter() 和 distinct() 筛选演示</h3>
            <div class="animation-scene">
                <div class="process-flow">
                    <div class="stage" id="filter-input">
                        <h4>原始数据</h4>
                        <div class="student-list" id="filter-students"></div>
                    </div>
                    <div class="arrow" id="filter-arrow">
                        <div class="arrow-body"></div>
                        <div class="arrow-head">点击"下一步"开始</div>
                    </div>
                    <div class="stage" id="filter-output">
                        <h4>筛选结果</h4>
                        <div class="student-list" id="filter-result"></div>
                    </div>
                </div>
            </div>
        `;

        this.renderStudents('filter-students', sampleStudents);
        this.resetFilter();
    },

    resetFilter: function() {
        // 重置所有状态
        this.filterCurrentIndex = 0;
        this.filterCurrentMode = 'filter'; // 'filter' 或 'distinct'
        this.filterStudents = document.querySelectorAll('#filter-students .student-card');
        this.filterOutputContainer = document.getElementById('filter-result');
        this.filterArrow = document.getElementById('filter-arrow');

        // 清空输出区域
        if (this.filterOutputContainer) {
            this.filterOutputContainer.innerHTML = '';
        }

        // 重置箭头文本
        if (this.filterArrow) {
            this.filterArrow.querySelector('.arrow-head').textContent = 'filter(age ≥ 20)';
        }

        // 移除所有样式类
        this.filterStudents.forEach(el => {
            el.classList.remove('pass', 'fail', 'duplicate', 'unique', 'fade-out');
        });
    },

    filterStep: function() {
        if (!this.filterStudents || this.filterCurrentIndex >= this.filterStudents.length) {
            // 检查是否需要切换到distinct模式
            if (this.filterCurrentMode === 'filter') {
                this.switchToDistinctMode();
                return;
            }

            // 处理完成
            if (this.filterArrow) {
                this.filterArrow.querySelector('.arrow-head').textContent = '✓ 筛选和去重完成';
            }
            return;
        }

        const currentStudent = this.filterStudents[this.filterCurrentIndex];

        if (this.filterCurrentMode === 'filter') {
            // Filter模式：按年龄筛选
            const age = parseInt(currentStudent.querySelector('.student-age').textContent);

            // 显示筛选箭头
            if (this.filterArrow) {
                this.filterArrow.classList.add('active');
                if (age >= 20) {
                    this.filterArrow.querySelector('.arrow-head').textContent = `✓ 通过 (age: ${age})`;
                } else {
                    this.filterArrow.querySelector('.arrow-head').textContent = `✗ 未通过 (age: ${age})`;
                }
            }

            if (age >= 20) {
                // 通过筛选，复制到输出区域
                const clone = currentStudent.cloneNode(true);
                clone.classList.add('filtered');
                this.filterOutputContainer.appendChild(clone);
                currentStudent.classList.add('pass');
            } else {
                // 未通过筛选
                currentStudent.classList.add('fail');
            }
        } else if (this.filterCurrentMode === 'distinct') {
            // Distinct模式：按姓名去重
            const name = currentStudent.querySelector('.student-name').textContent;

            // 检查是否已经见过这个名字
            const existingNames = Array.from(this.filterOutputContainer.querySelectorAll('.student-card'))
                .map(el => el.querySelector('.student-name').textContent);

            if (existingNames.includes(name)) {
                // 重复项，添加震动效果然后淡出
                currentStudent.classList.add('duplicate');
                if (this.filterArrow) {
                    this.filterArrow.querySelector('.arrow-head').textContent = `✗ 重复: ${name}`;
                }
                setTimeout(() => {
                    currentStudent.classList.add('fade-out');
                }, 300);
            } else {
                // 首次出现，复制到输出
                const clone = currentStudent.cloneNode(true);
                clone.classList.add('unique');
                this.filterOutputContainer.appendChild(clone);
                currentStudent.classList.add('pass');
                if (this.filterArrow) {
                    this.filterArrow.querySelector('.arrow-head').textContent = `✓ 唯一: ${name}`;
                }
            }
        }

        // 移动到下一个
        this.filterCurrentIndex++;
    },

    switchToDistinctMode: function() {
        // 切换到distinct模式
        this.filterCurrentMode = 'distinct';
        this.filterCurrentIndex = 0;

        // 清空输出区域
        if (this.filterOutputContainer) {
            this.filterOutputContainer.innerHTML = '';
        }

        // 更新箭头文本
        if (this.filterArrow) {
            this.filterArrow.querySelector('.arrow-head').textContent = 'distinct() 按姓名去重';
        }

        // 重置学生样式
        this.filterStudents.forEach(el => {
            el.classList.remove('pass', 'fail', 'duplicate', 'unique', 'fade-out');
        });
    },

  
    // 3. map() 和 flatMap() 映射操作动画
    mapDemo: function() {
        const container = document.getElementById('map-animation');
        if (!container) return;

        container.innerHTML = `
            <h3>map() 和 flatMap() 映射演示</h3>
            <div class="animation-scene">
                <div class="process-flow">
                    <div class="stage" id="map-input">
                        <h4>Student对象</h4>
                        <div class="student-list" id="map-students"></div>
                    </div>
                    <div class="arrow" id="map-arrow">
                        <div class="arrow-body"></div>
                        <div class="arrow-head">点击"下一步"开始</div>
                    </div>
                    <div class="stage" id="map-output">
                        <h4>映射结果</h4>
                        <div class="string-list" id="map-result"></div>
                    </div>
                </div>
            </div>
        `;

        this.renderStudents('map-students', sampleStudents.slice(0, 4));
        this.resetMap();
    },

    resetMap: function() {
        // 重置所有状态
        this.mapCurrentIndex = 0;
        this.mapCurrentMode = 'map'; // 'map' 或 'flatMap'
        this.mapStudents = document.querySelectorAll('#map-students .student-card');
        this.mapOutputContainer = document.getElementById('map-result');
        this.mapArrow = document.getElementById('map-arrow');
        this.mapInputStage = document.getElementById('map-input');

        // 清空输出区域
        if (this.mapOutputContainer) {
            this.mapOutputContainer.innerHTML = '';
        }

        // 重置箭头文本
        if (this.mapArrow) {
            this.mapArrow.querySelector('.arrow-head').textContent = 'map(Student::getName)';
        }

        // 移除所有样式类
        this.mapStudents.forEach(el => {
            el.classList.remove('transforming', 'transformed', 'flattening');
        });
    },

    mapStep: function() {
        if (!this.mapStudents || this.mapCurrentIndex >= this.mapStudents.length) {
            // 检查是否需要切换到flatMap模式
            if (this.mapCurrentMode === 'map') {
                this.switchToFlatMapMode();
                return;
            }

            // 处理完成
            if (this.mapArrow) {
                this.mapArrow.querySelector('.arrow-head').textContent = '✓ 映射和扁平化完成';
            }
            return;
        }

        const currentStudent = this.mapStudents[this.mapCurrentIndex];

        if (this.mapCurrentMode === 'map') {
            // Map模式：Student -> String
            const name = currentStudent.querySelector('.student-name').textContent;

            // 显示映射箭头
            if (this.mapArrow) {
                this.mapArrow.classList.add('active');
                this.mapArrow.querySelector('.arrow-head').textContent = `map(Student::getName()) -> "${name}"`;
            }

            // 转换动画效果
            currentStudent.classList.add('transforming');

            setTimeout(() => {
                // 创建姓名字符串元素
                const nameEl = document.createElement('div');
                nameEl.className = 'string-item';
                nameEl.textContent = `"${name}"`;
                nameEl.classList.add('fade-in');
                this.mapOutputContainer.appendChild(nameEl);

                currentStudent.classList.remove('transforming');
                currentStudent.classList.add('transformed');
            }, 300);

        } else if (this.mapCurrentMode === 'flatMap') {
            // FlatMap模式：处理课程数据
            this.processFlatMapStep();
        }

        // 移动到下一个
        this.mapCurrentIndex++;
    },

    switchToFlatMapMode: function() {
        // 切换到flatMap模式
        this.mapCurrentMode = 'flatMap';
        this.mapCurrentIndex = 0;
        this.flatMapCourseIndex = 0;
        this.flatMapStudentIndex = 0;

        // 清空输出区域
        if (this.mapOutputContainer) {
            this.mapOutputContainer.innerHTML = '';
        }

        // 为flatMap添加课程数据
        this.studentsWithCourses = sampleStudents.slice(0, 3).map(student => ({
            ...student,
            courses: [
                { name: "Java", score: 85 },
                { name: "数据库", score: 78 },
                { name: "算法", score: 92 }
            ]
        }));

        // 重新渲染输入区域
        const container = document.getElementById('map-input');
        container.innerHTML = '<h4>Student课程列表</h4>';

        const studentsContainer = document.createElement('div');
        studentsContainer.className = 'student-list';
        studentsContainer.id = 'map-students';

        this.studentsWithCourses.forEach(student => {
            const studentDiv = document.createElement('div');
            studentDiv.className = 'student-card with-courses';
            studentDiv.innerHTML = `
                <div class="student-name">${student.name}</div>
                <div class="student-courses">
                    ${student.courses.map(course =>
                        `<div class="course-item">${course.name}: ${course.score}</div>`
                    ).join('')}
                </div>
            `;
            studentsContainer.appendChild(studentDiv);
        });

        container.appendChild(studentsContainer);

        // 更新状态变量
        this.mapStudents = document.querySelectorAll('#map-students .student-card');

        // 更新箭头文本
        if (this.mapArrow) {
            this.mapArrow.querySelector('.arrow-head').textContent = 'flatMap(学生 -> 课程列表)';
        }

        // 更新输出区域标题
        const outputStage = document.getElementById('map-output');
        if (outputStage) {
            outputStage.querySelector('h4').textContent = '扁平化结果';
        }
    },

    processFlatMapStep: function() {
        if (!this.studentsWithCourses || this.flatMapStudentIndex >= this.studentsWithCourses.length) {
            return;
        }

        const currentStudent = this.studentsWithCourses[this.flatMapStudentIndex];
        const studentEl = this.mapStudents[this.flatMapStudentIndex];

        // 显示当前处理的扁平化操作
        if (this.mapArrow) {
            this.mapArrow.querySelector('.arrow-head').textContent =
                `flatMap(${currentStudent.name} -> 课程)`;
        }

        // 添加扁平化效果
        studentEl.classList.add('flattening');

        // 处理该学生的所有课程
        currentStudent.courses.forEach((course, courseIndex) => {
            setTimeout(() => {
                const courseEl = document.createElement('div');
                courseEl.className = 'string-item course-name fade-in';
                courseEl.textContent = course.name;
                this.mapOutputContainer.appendChild(courseEl);

                this.flatMapCourseIndex++;

                // 最后一个课程处理完成
                if (this.flatMapStudentIndex === this.studentsWithCourses.length - 1 &&
                    courseIndex === currentStudent.courses.length - 1) {
                    setTimeout(() => {
                        studentEl.classList.remove('flattening');
                        studentEl.classList.add('flattened');
                    }, 300);
                }
            }, courseIndex * 200);
        });

        // 移动到下一个学生
        this.flatMapStudentIndex++;
    },

    // 4. sorted() 排序操作动画
    sortedDemo: function() {
        const container = document.getElementById('sorted-animation');
        if (!container) return;

        // 准备需要排序的学生数据（按成绩降序排序）
        this.sortedStudents = sampleStudents.slice(0, 5).sort((a, b) => b.score - a.score);

        // 打乱顺序用于演示
        this.shuffledStudents = [...this.sortedStudents].sort(() => Math.random() - 0.5);

        container.innerHTML = `
            <h3>sorted() 排序演示</h3>
            <div class="animation-scene">
                <div class="sort-container" id="sort-container">
                    <div class="sort-stage" id="sort-input">
                        <h4>原始顺序（随机）</h4>
                        <div class="student-list" id="sort-students"></div>
                    </div>
                    <div class="sort-stage" id="sort-output">
                        <h4>排序过程（按成绩降序）</h4>
                        <div class="student-list" id="sort-result"></div>
                    </div>
                </div>
                <div class="sort-info" id="sort-info">
                    <p>点击"下一步"开始排序演示</p>
                </div>
            </div>
        `;

        this.renderStudents('sort-students', this.shuffledStudents);
        this.resetSorted();
    },

    resetSorted: function() {
        // 重置所有状态
        this.sortedCurrentIndex = 0;
        this.sortedCurrentStep = 'prepare'; // 'prepare', 'sorting', 'complete'
        this.sortedInputStudents = document.querySelectorAll('#sort-students .student-card');
        this.sortedOutputContainer = document.getElementById('sort-result');
        this.sortedInfo = document.getElementById('sort-info');

        // 清空输出区域
        if (this.sortedOutputContainer) {
            this.sortedOutputContainer.innerHTML = '';
        }

        // 重置信息区域
        if (this.sortedInfo) {
            this.sortedInfo.innerHTML = '<p>点击"下一步"开始排序演示</p>';
        }

        // 移除所有样式类
        this.sortedInputStudents.forEach(el => {
            el.classList.remove('current', 'sorted', 'processing');
        });

        // 初始化输出区域（显示打乱顺序）
        this.renderSortedStudents();
    },

    renderSortedStudents: function() {
        if (!this.sortedOutputContainer || !this.shuffledStudents) return;

        this.sortedOutputContainer.innerHTML = '';

        this.shuffledStudents.forEach((student, index) => {
            const studentEl = this.createStudentCard(student);
            studentEl.classList.add('sorting');
            studentEl.setAttribute('data-score', student.score);
            studentEl.setAttribute('data-name', student.name);
            this.sortedOutputContainer.appendChild(studentEl);
        });
    },

    sortedStep: function() {
        if (this.sortedCurrentStep === 'prepare') {
            this.startSortingStep();
        } else if (this.sortedCurrentStep === 'sorting') {
            this.processSortingStep();
        } else if (this.sortedCurrentStep === 'complete') {
            // 排序完成
            if (this.sortedInfo) {
                this.sortedInfo.innerHTML = '<p><strong>✓ 排序完成！按成绩从高到低排列</strong></p>';
            }
        }
    },

    startSortingStep: function() {
        // 开始排序阶段
        this.sortedCurrentStep = 'sorting';
        this.sortedCurrentIndex = 0;

        if (this.sortedInfo) {
            this.sortedInfo.innerHTML = '<p><strong>开始排序：sorted(Comparator.comparing(Student::getScore).reversed())</strong></p>';
        }

        // 标记所有输出元素为排序中状态
        const outputStudents = this.sortedOutputContainer.querySelectorAll('.student-card');
        outputStudents.forEach(el => {
            el.classList.add('processing');
        });

        // 移到第一个排序步骤
        this.processSortingStep();
    },

    processSortingStep: function() {
        const outputStudents = this.sortedOutputContainer.querySelectorAll('.student-card');

        if (this.sortedCurrentIndex >= this.sortedStudents.length) {
            // 排序完成
            this.completeSorting();
            return;
        }

        const currentRank = this.sortedCurrentIndex + 1; // 当前排名（1-based）
        const targetStudent = this.sortedStudents[this.sortedCurrentIndex];
        const targetStudentEl = Array.from(outputStudents).find(el =>
            el.getAttribute('data-name') === targetStudent.name
        );

        if (targetStudentEl) {
            // 高亮当前处理的元素
            outputStudents.forEach(el => el.classList.remove('current'));
            targetStudentEl.classList.add('current');

            // 设置正确的order（排序位置，0-based）
            targetStudentEl.style.order = this.sortedCurrentIndex;

            // 更新信息显示
            if (this.sortedInfo) {
                this.sortedInfo.innerHTML = `
                    <p><strong>排序步骤 ${currentRank}/${this.sortedStudents.length}:</strong></p>
                    <p>将 <strong>${targetStudent.name}</strong> (成绩: ${targetStudent.score}) 排列到第 ${currentRank} 位</p>
                `;
            }

            // 添加排序完成效果
            setTimeout(() => {
                targetStudentEl.classList.remove('processing', 'current');
                targetStudentEl.classList.add('sorted');

                // 添加排名徽章
                this.addRankBadge(targetStudentEl, currentRank);

                // 然后才移动到下一个
                this.sortedCurrentIndex++;
            }, 300);
        } else {
            // 如果没找到元素，直接移动到下一个
            this.sortedCurrentIndex++;
        }
    },

    addRankBadge: function(studentEl, rank) {
        // 移除旧的排名徽章
        const oldBadge = studentEl.querySelector('.rank-badge');
        if (oldBadge) {
            oldBadge.remove();
        }

        // 添加新的排名徽章
        const rankEl = document.createElement('div');
        rankEl.className = 'rank-badge';
        rankEl.textContent = `#${rank}`;
        studentEl.appendChild(rankEl);
    },

    completeSorting: function() {
        this.sortedCurrentStep = 'complete';

        // 标记所有元素为排序完成
        const outputStudents = this.sortedOutputContainer.querySelectorAll('.student-card');
        outputStudents.forEach(el => {
            el.classList.remove('processing', 'current');
            el.classList.add('sorted');
        });

        // 最终信息
        if (this.sortedInfo) {
            this.sortedInfo.innerHTML = `
                <p><strong>✓ 排序完成！按成绩从高到低排列</strong></p>
                <p>排序规则：Comparator.comparing(Student::getScore).reversed()</p>
            `;
        }
    },

    // 5. skip() 和 limit() 提取操作动画
    skipLimitDemo: function() {
        const container = document.getElementById('skipLimit-animation');
        if (!container) return;

        // 分页参数配置
        this.skipCount = 3;
        this.limitCount = 5;

        container.innerHTML = `
            <h3>skip() 和 limit() 分页演示</h3>
            <div class="animation-scene">
                <div class="pagination-container">
                    <div class="stage" id="skip-input">
                        <h4>原始数据 (前10个)</h4>
                        <div class="student-list" id="skip-students"></div>
                    </div>
                    <div class="pagination-info" id="pagination-info">
                        <div class="operation">准备分页...</div>
                        <div class="arrow down">⬇</div>
                        <div class="operation">等待操作</div>
                    </div>
                    <div class="stage" id="skip-result">
                        <h4>分页结果</h4>
                        <div class="student-list" id="skip-result-list"></div>
                    </div>
                </div>
                <div class="pagination-status" id="pagination-status">
                    <p>点击"下一步"开始分页演示：skip(${this.skipCount}) + limit(${this.limitCount})</p>
                </div>
            </div>
        `;

        this.renderStudents('skip-students', sampleStudents);
        this.resetSkipLimit();
    },

    resetSkipLimit: function() {
        // 重置所有状态
        this.skipLimitCurrentIndex = 0;
        this.skipLimitCurrentStep = 'prepare'; // 'prepare', 'skipping', 'limiting', 'complete'
        this.skipLimitInputStudents = document.querySelectorAll('#skip-students .student-card');
        this.skipLimitOutputContainer = document.getElementById('skip-result-list');
        this.skipLimitPaginationInfo = document.getElementById('pagination-info');
        this.skipLimitStatus = document.getElementById('pagination-status');

        // 清空输出区域
        if (this.skipLimitOutputContainer) {
            this.skipLimitOutputContainer.innerHTML = '';
        }

        // 重置信息区域
        if (this.skipLimitStatus) {
            this.skipLimitStatus.innerHTML = `<p>点击"下一步"开始分页演示：skip(${this.skipCount}) + limit(${this.limitCount})</p>`;
        }

        // 移除所有样式类
        this.skipLimitInputStudents.forEach(el => {
            el.classList.remove('skipped', 'selected', 'excluded', 'fade-out', 'current');
        });
    },

    skipLimitStep: function() {
        if (this.skipLimitCurrentStep === 'prepare') {
            this.startSkippingStep();
        } else if (this.skipLimitCurrentStep === 'skipping') {
            // 检查当前是否有高亮的元素需要处理
            const currentElement = document.querySelector('#skip-students .student-card.current');
            if (currentElement) {
                // 执行跳过动画
                currentElement.classList.remove('current');
                currentElement.classList.add('skipped');

                setTimeout(() => {
                    currentElement.classList.add('fade-out');
                }, 200);

                // 移动到下一个索引
                this.skipLimitCurrentIndex++;

                // 处理下一个skip步骤
                setTimeout(() => {
                    this.processSkippingStep();
                }, 300);
            } else {
                this.processSkippingStep();
            }
        } else if (this.skipLimitCurrentStep === 'limiting') {
            // 检查当前是否有高亮的元素需要处理
            const currentElement = document.querySelector('#skip-students .student-card.current');
            if (currentElement) {
                // 执行选择动画
                currentElement.classList.remove('current');
                currentElement.classList.add('selected');

                // 复制到结果区域
                const clone = currentElement.cloneNode(true);
                clone.classList.add('selected', 'fade-in');
                this.skipLimitOutputContainer.appendChild(clone);

                // 移动到下一个索引
                this.skipLimitCurrentIndex++;

                // 检查是否完成选择
                const selectedCount = this.skipLimitOutputContainer.querySelectorAll('.student-card').length;
                if (selectedCount >= Math.min(this.limitCount, this.skipLimitInputStudents.length - this.skipCount)) {
                    this.completeLimiting();
                } else {
                    // 不再自动调用processLimitingStep，等待用户再次点击
                }
            } else {
                // 没有当前高亮元素，寻找下一个合适的元素
                this.processLimitingStep();
            }
        } else if (this.skipLimitCurrentStep === 'complete') {
            // 分页完成
            if (this.skipLimitStatus) {
                this.skipLimitStatus.innerHTML = '<p><strong>✓ 分页完成！获取第2页数据</strong></p>';
            }
        }
    },

    startSkippingStep: function() {
        // 开始skip阶段
        this.skipLimitCurrentStep = 'skipping';
        this.skipLimitCurrentIndex = 0;

        if (this.skipLimitPaginationInfo) {
            this.skipLimitPaginationInfo.innerHTML = `
                <div class="operation active">skip(${this.skipCount})</div>
                <div class="arrow down">⬇</div>
                <div class="operation">limit(${this.limitCount})</div>
            `;
        }

        if (this.skipLimitStatus) {
            this.skipLimitStatus.innerHTML = `<p><strong>开始跳过前${this.skipCount}个元素...</strong></p>`;
        }

        // 移到第一个skip步骤
        this.processSkippingStep();
    },

    processSkippingStep: function() {
        if (this.skipLimitCurrentIndex >= this.skipCount) {
            // skip阶段完成
            this.completeSkipping();
            return;
        }

        const currentStudent = this.skipLimitInputStudents[this.skipLimitCurrentIndex];

        if (currentStudent) {
            // 高亮当前处理的元素
            this.skipLimitInputStudents.forEach(el => el.classList.remove('current'));
            currentStudent.classList.add('current');

            // 更新状态显示
            const remainingSkip = this.skipCount - this.skipLimitCurrentIndex - 1;
            if (this.skipLimitStatus) {
                this.skipLimitStatus.innerHTML = `
                    <p><strong>跳过第${this.skipLimitCurrentIndex + 1}/${this.skipCount}个元素:</strong></p>
                    <p>学生: ${currentStudent.querySelector('.student-name').textContent}</p>
                    ${remainingSkip > 0 ? `<p>还需跳过 ${remainingSkip} 个元素</p>` : ''}
                `;
            }

            // 执行skip动画 - 不自动移动到下一个，等待用户点击
        }
        // 注意：这里不再自动增加索引，而是等待用户再次点击
    },

    completeSkipping: function() {
        // skip阶段完成，开始limiting阶段
        setTimeout(() => {
            this.skipLimitCurrentStep = 'limiting';
            this.skipLimitCurrentIndex = this.skipCount;

            if (this.skipLimitPaginationInfo) {
                this.skipLimitPaginationInfo.innerHTML = `
                    <div class="operation completed">skip(${this.skipCount}) ✓</div>
                    <div class="arrow down">⬇</div>
                    <div class="operation active">limit(${this.limitCount})</div>
                `;
            }

            if (this.skipLimitStatus) {
                this.skipLimitStatus.innerHTML = `<p><strong>跳过完成！开始选择${this.limitCount}个元素...</strong></p>`;
            }

            this.processLimitingStep();
        }, 500);
    },

    processLimitingStep: function() {
        if (!this.skipLimitInputStudents || this.skipLimitCurrentIndex >= this.skipLimitInputStudents.length) {
            this.completeLimiting();
            return;
        }

        const startIndex = this.skipCount;
        const endIndex = Math.min(startIndex + this.limitCount, this.skipLimitInputStudents.length);

        // 检查当前索引是否在limit范围内
        if (this.skipLimitCurrentIndex >= startIndex && this.skipLimitCurrentIndex < endIndex) {
            const currentStudent = this.skipLimitInputStudents[this.skipLimitCurrentIndex];

            if (currentStudent && !currentStudent.classList.contains('skipped') && !currentStudent.classList.contains('selected')) {
                // 高亮当前处理的元素
                this.skipLimitInputStudents.forEach(el => el.classList.remove('current'));
                currentStudent.classList.add('current');

                // 更新状态显示
                const currentLimitIndex = this.skipLimitCurrentIndex - startIndex + 1;
                if (this.skipLimitStatus) {
                    this.skipLimitStatus.innerHTML = `
                        <p><strong>选择第${currentLimitIndex}/${this.limitCount}个元素:</strong></p>
                        <p>学生: ${currentStudent.querySelector('.student-name').textContent}</p>
                        <p>成绩: ${currentStudent.querySelector('.student-score').textContent}</p>
                    `;
                }
                // 注意：这里不再自动执行选择动画，而是等待用户点击
            } else {
                // 如果当前元素不符合条件，移动到下一个
                this.skipLimitCurrentIndex++;
                this.processLimitingStep();
            }
        } else if (this.skipLimitCurrentIndex >= endIndex) {
            // 超出limit范围，完成选择
            this.completeLimiting();
        } else {
            // 还没到开始索引，直接移动到下一个
            this.skipLimitCurrentIndex++;
            // 继续处理下一个元素，但不要无限递归
            if (this.skipLimitCurrentIndex < startIndex) {
                this.processLimitingStep(); // 只有在还没到达skip范围时才递归
            }
        }
    },

    completeLimiting: function() {
        // limiting阶段完成
        this.skipLimitCurrentStep = 'complete';

        if (this.skipLimitPaginationInfo) {
            this.skipLimitPaginationInfo.innerHTML = `
                <div class="operation completed">skip(${this.skipCount}) ✓</div>
                <div class="arrow down">⬇</div>
                <div class="operation completed">limit(${this.limitCount}) ✓</div>
            `;
        }

        if (this.skipLimitStatus) {
            const selectedCount = this.skipLimitOutputContainer.querySelectorAll('.student-card').length;
            this.skipLimitStatus.innerHTML = `
                <p><strong>✓ 分页完成！获取到 ${selectedCount} 个元素</strong></p>
                <p>相当于数据库分页：LIMIT ${this.limitCount} OFFSET ${this.skipCount}</p>
                <p>即第 ${Math.floor(this.skipCount / this.limitCount) + 2} 页数据</p>
            `;
        }

        // 标记超出limit的元素
        for (let i = this.skipCount + this.limitCount; i < this.skipLimitInputStudents.length; i++) {
            this.skipLimitInputStudents[i].classList.add('excluded');
        }
    },

    // 6. max() / min() 最值查找动画
    maxMinDemo: function() {
        const container = document.getElementById('maxMin-animation');
        if (!container) return;

        // 重置状态
        this.maxMinCurrentIndex = 0;
        this.maxMinCurrentStep = 'prepare'; // 'prepare', 'comparing', 'complete'
        this.maxMinCurrentMax = null;
        this.maxMinCurrentMin = null;

        container.innerHTML = `
            <h3>max() / min() 最值演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.maxMinStep()">下一步</button>
                <button onclick="StreamAnimation.resetMaxMin()">重置</button>
            </div>
            <div class="animation-scene">
                <div class="tournament-container">
                    <div class="stage" id="maxmin-input">
                        <h4>学生成绩列表</h4>
                        <div class="student-list" id="maxmin-students"></div>
                    </div>
                    <div class="comparison-info" id="comparison-info">
                        <div class="operation">准备比较...</div>
                        <div class="current-status" id="current-status">
                            <p>点击"下一步"开始最值查找演示</p>
                        </div>
                    </div>
                    <div class="stage" id="maxmin-result">
                        <h4>最值结果</h4>
                        <div class="result-container">
                            <div class="max-container">
                                <h5>最高分 (max)</h5>
                                <div id="max-result"></div>
                            </div>
                            <div class="min-container">
                                <h5>最低分 (min)</h5>
                                <div id="min-result"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderStudents('maxmin-students', sampleStudents.slice(0, 6));
        this.resetMaxMin();
    },

    // 新增：单步执行函数
    maxMinStep: function() {
        if (this.maxMinCurrentStep === 'prepare') {
            this.startMaxMinComparison();
        } else if (this.maxMinCurrentStep === 'comparing') {
            this.processMaxMinComparison();
        } else if (this.maxMinCurrentStep === 'complete') {
            // 比较完成
            if (this.maxMinStatus) {
                this.maxMinStatus.innerHTML = '<p><strong>✓ 最值查找完成！</strong></p>';
            }
        }
    },

    startMaxMinComparison: function() {
        this.maxMinCurrentStep = 'comparing';
        this.maxMinCurrentIndex = 0;
        this.maxMinCurrentMax = null;
        this.maxMinCurrentMin = null;

        const comparisonInfo = document.getElementById('comparison-info');
        const operation = comparisonInfo.querySelector('.operation');
        operation.textContent = '比较中...';
        operation.classList.add('active');

        this.maxMinStudents = document.querySelectorAll('#maxmin-students .student-card');
        this.maxMinResult = document.getElementById('max-result');
        this.maxMinResultMin = document.getElementById('min-result');
        this.maxMinStatus = document.getElementById('current-status');

        if (this.maxMinStatus) {
            this.maxMinStatus.innerHTML = '<p><strong>开始查找最高分和最低分...</strong></p>';
        }

        this.processMaxMinComparison();
    },

    processMaxMinComparison: function() {
        if (!this.maxMinStudents || this.maxMinCurrentIndex >= this.maxMinStudents.length) {
            this.completeMaxMinComparison();
            return;
        }

        const currentStudent = this.maxMinStudents[this.maxMinCurrentIndex];

        // 高亮当前处理的元素
        this.maxMinStudents.forEach(el => el.classList.remove('current', 'max', 'min'));
        currentStudent.classList.add('current');

        const studentName = currentStudent.querySelector('.student-name').textContent;
        const studentScore = parseInt(currentStudent.querySelector('.student-score').textContent);

        // 更新最值
        if (this.maxMinCurrentMax === null || studentScore > this.maxMinCurrentMax.score) {
            this.maxMinCurrentMax = { name: studentName, score: studentScore };
        }
        if (this.maxMinCurrentMin === null || studentScore < this.maxMinCurrentMin.score) {
            this.maxMinCurrentMin = { name: studentName, score: studentScore };
        }

        // 更新状态显示
        if (this.maxMinStatus) {
            this.maxMinStatus.innerHTML = `
                <p><strong>处理第${this.maxMinCurrentIndex + 1}个学生:</strong></p>
                <p>学生: ${studentName}, 成绩: ${studentScore}</p>
                <p>当前最高分: ${this.maxMinCurrentMax.name} (${this.maxMinCurrentMax.score})</p>
                <p>当前最低分: ${this.maxMinCurrentMin.name} (${this.maxMinCurrentMin.score})</p>
            `;
        }

        // 显示当前的最值结果
        this.displayMaxMinResults();

        // 移动到下一个索引
        this.maxMinCurrentIndex++;
    },

    displayMaxMinResults: function() {
        if (this.maxMinResult && this.maxMinCurrentMax) {
            this.maxMinResult.innerHTML = `
                <div class="result-card max-card">
                    <div class="result-icon">👑</div>
                    <div class="result-info">
                        <h5>${this.maxMinCurrentMax.name}</h5>
                        <p class="score">${this.maxMinCurrentMax.score}分</p>
                    </div>
                </div>
            `;
        }

        if (this.maxMinResultMin && this.maxMinCurrentMin) {
            this.maxMinResultMin.innerHTML = `
                <div class="result-card min-card">
                    <div class="result-icon">🎯</div>
                    <div class="result-info">
                        <h5>${this.maxMinCurrentMin.name}</h5>
                        <p class="score">${this.maxMinCurrentMin.score}分</p>
                    </div>
                </div>
            `;
        }
    },

    completeMaxMinComparison: function() {
        this.maxMinCurrentStep = 'complete';

        const comparisonInfo = document.getElementById('comparison-info');
        const operation = comparisonInfo.querySelector('.operation');
        operation.textContent = '比较完成 ✓';
        operation.classList.remove('active');
        operation.classList.add('completed');

        // 高亮最终的最值学生
        this.maxMinStudents.forEach(el => {
            el.classList.remove('current');
            const studentName = el.querySelector('.student-name').textContent;
            if (studentName === this.maxMinCurrentMax.name) {
                el.classList.add('max');
            }
            if (studentName === this.maxMinCurrentMin.name) {
                el.classList.add('min');
            }
        });

        if (this.maxMinStatus) {
            this.maxMinStatus.innerHTML = `
                <p><strong>✓ 最值查找完成！</strong></p>
                <p>最高分: ${this.maxMinCurrentMax.name} (${this.maxMinCurrentMax.score}分)</p>
                <p>最低分: ${this.maxMinCurrentMin.name} (${this.maxMinCurrentMin.score}分)</p>
            `; // <p>等价于: students.stream().max(Comparator.comparing(Student::getScore))</p>
        }
    },

    resetMaxMin: function() {
        // 重置所有状态
        this.maxMinCurrentIndex = 0;
        this.maxMinCurrentStep = 'prepare';
        this.maxMinCurrentMax = null;
        this.maxMinCurrentMin = null;

        const students = document.querySelectorAll('#maxmin-students .student-card');
        students.forEach(el => {
            el.classList.remove('current', 'max', 'min', 'processed');
        });

        // 清空结果区域
        const maxResult = document.getElementById('max-result');
        const minResult = document.getElementById('min-result');
        if (maxResult) maxResult.innerHTML = '<p class="placeholder">等待查找...</p>';
        if (minResult) minResult.innerHTML = '<p class="placeholder">等待查找...</p>';

        // 重置比较信息
        const comparisonInfo = document.getElementById('comparison-info');
        if (comparisonInfo) {
            const operation = comparisonInfo.querySelector('.operation');
            operation.textContent = '准备比较...';
            operation.classList.remove('active', 'completed');
        }

        // 重置状态信息
        const maxMinStatus = document.getElementById('current-status');
        if (maxMinStatus) {
            maxMinStatus.innerHTML = '<p>点击"下一步"开始最值查找演示</p>';
        }
    },

    
    // 7. reduce() 规约操作动画
    reduceDemo: function() {
        const container = document.getElementById('reduce-animation');
        if (!container) return;

        // 重置状态
        this.reduceCurrentIndex = 0;
        this.reduceCurrentStep = 'prepare'; // 'prepare', 'reducing', 'complete'
        this.reduceAccumulator = 0;

        container.innerHTML = `
            <h3>reduce() 规约演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.reduceStep()">下一步</button>
                <button onclick="StreamAnimation.resetReduce()">重置</button>
            </div>
            <div class="animation-scene">
                <div class="reduce-container">
                    <div class="stage" id="reduce-input">
                        <h4>学生成绩列表</h4>
                        <div class="score-list" id="reduce-scores"></div>
                    </div>
                    <div class="reduce-flow" id="reduce-process">
                        <div class="process-info">
                            <div class="operation" id="reduce-operation">准备规约...</div>
                            <div class="accumulator-display">
                                <span class="label">累加器:</span>
                                <span class="value" id="accumulator-value">0</span>
                            </div>
                        </div>
                        <div class="reduce-step" id="reduce-step">
                            <div class="step-info">
                                <p>点击"下一步"开始规约操作</p>
                            </div>
                        </div>
                    </div>
                    <div class="stage" id="reduce-result">
                        <h4>最终结果</h4>
                        <div class="result-display" id="result-display">
                            <div class="placeholder">等待计算完成...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 渲染成绩列表
        this.renderReduceScores();
        this.resetReduce();
    },

    renderReduceScores: function() {
        const scoresContainer = document.getElementById('reduce-scores');
        if (!scoresContainer) return;

        scoresContainer.innerHTML = '';
        sampleStudents.slice(0, 5).forEach((student, index) => {
            const scoreEl = document.createElement('div');
            scoreEl.className = 'score-item';
            scoreEl.textContent = student.score;
            scoreEl.setAttribute('data-index', index);
            scoresContainer.appendChild(scoreEl);
        });
    },

    // 新增：单步执行函数
    reduceStep: function() {
        if (this.reduceCurrentStep === 'prepare') {
            this.startReducing();
        } else if (this.reduceCurrentStep === 'reducing') {
            this.processReduceStep();
        } else if (this.reduceCurrentStep === 'complete') {
            // 规约完成
            if (this.reduceStepInfo) {
                this.reduceStepInfo.innerHTML = '<p><strong>✓ 规约操作完成！</strong></p>';
            }
        }
    },

    startReducing: function() {
        this.reduceCurrentStep = 'reducing';
        this.reduceCurrentIndex = 0;
        this.reduceAccumulator = 0;

        // 更新操作状态
        const operation = document.getElementById('reduce-operation');
        if (operation) {
            operation.textContent = '规约中...';
            operation.classList.add('active');
        }

        this.reduceScores = sampleStudents.slice(0, 5).map(s => s.score);
        this.reduceScoreItems = document.querySelectorAll('.score-item');
        this.reduceAccumulatorEl = document.getElementById('accumulator-value');
        this.reduceStepInfo = document.querySelector('#reduce-step .step-info');
        this.reduceResultEl = document.getElementById('result-display');

        if (this.reduceStepInfo) {
            this.reduceStepInfo.innerHTML = '<p><strong>开始规约操作...</strong></p>';
        }

        this.processReduceStep();
    },

    processReduceStep: function() {
        if (!this.reduceScores || this.reduceCurrentIndex >= this.reduceScores.length) {
            this.completeReducing();
            return;
        }

        const currentScore = this.reduceScores[this.reduceCurrentIndex];
        const oldAccumulator = this.reduceAccumulator;
        this.reduceAccumulator += currentScore;

        // 高亮当前处理的分数
        this.reduceScoreItems.forEach((el, i) => {
            el.classList.toggle('current', i === this.reduceCurrentIndex);
            el.classList.toggle('processed', i < this.reduceCurrentIndex);
        });

        // 更新累加器显示
        if (this.reduceAccumulatorEl) {
            this.reduceAccumulatorEl.textContent = this.reduceAccumulator;
        }

        // 显示规约步骤
        if (this.reduceStepInfo) {
            this.reduceStepInfo.innerHTML = `
                <p><strong>第${this.reduceCurrentIndex + 1}步规约:</strong></p>
                <div class="operation-display">
                    <span class="old-value">${oldAccumulator}</span>
                    <span class="operator">+</span>
                    <span class="current-value">${currentScore}</span>
                    <span class="equals">=</span>
                    <span class="new-value">${this.reduceAccumulator}</span>
                </div>
                <p class="step-description">
                    ${this.reduceCurrentIndex === 0 ? '开始累加第一个元素' : `累加第${this.reduceCurrentIndex + 1}个元素`}
                </p>
            `;
        }

        // 移动到下一个索引
        this.reduceCurrentIndex++;
    },

    completeReducing: function() {
        this.reduceCurrentStep = 'complete';

        // 更新操作状态
        const operation = document.getElementById('reduce-operation');
        if (operation) {
            operation.textContent = '规约完成 ✓';
            operation.classList.remove('active');
            operation.classList.add('completed');
        }

        // 显示最终结果
        if (this.reduceResultEl) {
            this.reduceResultEl.innerHTML = `
                <div class="final-result">
                    <div class="result-title">计算完成</div>
                    <div class="result-operation">
                        sum = ${this.reduceScores.join(' + ')} = ${this.reduceAccumulator}
                    </div>
                    <div class="result-value">
                        总和: <strong>${this.reduceAccumulator}</strong>
                    </div>

                </div>
            `;
        }

        // 更新步骤信息
        if (this.reduceStepInfo) {
            this.reduceStepInfo.innerHTML = `
                <p><strong>✓ 规约操作完成！</strong></p>
                <p>共处理了 ${this.reduceScores.length} 个成绩</p>
                <p>最终累加结果: ${this.reduceAccumulator}</p>
            `;
        }

        // 标记所有分数为已处理
        this.reduceScoreItems.forEach(el => {
            el.classList.remove('current');
            el.classList.add('processed');
        });
    },

    resetReduce: function() {
        // 重置所有状态
        this.reduceCurrentIndex = 0;
        this.reduceCurrentStep = 'prepare';
        this.reduceAccumulator = 0;

        // 重置分数项目状态
        const scoreItems = document.querySelectorAll('.score-item');
        scoreItems.forEach(el => {
            el.classList.remove('current', 'processed');
        });

        // 重置累加器显示
        const accumulatorEl = document.getElementById('accumulator-value');
        if (accumulatorEl) {
            accumulatorEl.textContent = '0';
        }

        // 重置操作状态
        const operation = document.getElementById('reduce-operation');
        if (operation) {
            operation.textContent = '准备规约...';
            operation.classList.remove('active', 'completed');
        }

        // 重置步骤信息
        const stepInfo = document.querySelector('#reduce-step .step-info');
        if (stepInfo) {
            stepInfo.innerHTML = '<p>点击"下一步"开始规约操作</p>';
        }

        // 清空结果区域
        const resultEl = document.getElementById('result-display');
        if (resultEl) {
            resultEl.innerHTML = '<div class="placeholder">等待计算完成...</div>';
        }
    },

    // 8. collect() 收集操作动画
    collectDemo: function() {
        const container = document.getElementById('collect-animation');
        if (!container) return;

        // 重置状态
        this.collectCurrentIndex = 0;
        this.collectCurrentStep = 'prepare'; // 'prepare', 'collecting', 'complete'
        this.collectMode = 'toList'; // 'toList' 或 'groupingBy'

        container.innerHTML = `
            <h3>collect() 收集演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.collectStep()">下一步</button>
                <button onclick="StreamAnimation.toggleCollectMode()">切换模式</button>
                <button onclick="StreamAnimation.resetCollect()">重置</button>
               
            </div>
             <div class="current-mode-display">
                    <h5>当前收集模式</h5>
                    <div class="mode-code" id="mode-code">
                        <code>students.stream().collect(Collectors.toList())</code>
                    </div>
                </div>
            <div class="animation-scene">
                <div class="collect-container">
                    <div class="stage" id="collect-input">
                        <h4>Stream处理后的数据</h4>
                        <div class="stream-items" id="stream-items"></div>
                    </div>
                    <div class="arrow" id="collect-arrow">
                        <div class="arrow-body"></div>
                        <div class="arrow-head" id="arrow-operation">模式 1</div>
                    </div>
                    <div class="stage" id="collect-output">
                        <h4>收集结果</h4>
                        <div class="collect-info" id="collect-info">未开始，点击“下一步”开始演示</div>
                        <div class="result-container" id="collect-result">
                            <div class="placeholder">点击"下一步"开始收集演示</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 创建Stream数据项
        this.renderCollectStreamItems();
        this.updateModeDisplay();
        this.resetCollect();
    },

    renderCollectStreamItems: function() {
        const streamContainer = document.getElementById('stream-items');
        if (!streamContainer) return;

        streamContainer.innerHTML = '';
        this.collectStudents = sampleStudents.slice(0, 5);

        this.collectStudents.forEach((student, index) => {
            const streamItem = document.createElement('div');
            streamItem.className = 'stream-item';
            streamItem.textContent = student.name;
            streamItem.setAttribute('data-index', index);
            streamContainer.appendChild(streamItem);
        });
    },

    // 新增：单步执行函数
    collectStep: function() {
        if (this.collectCurrentStep === 'prepare') {
            this.startCollecting();
        } else if (this.collectCurrentStep === 'collecting') {
            this.processCollectStep();
        } else if (this.collectCurrentStep === 'complete') {
            // 收集完成
            if (this.collectResultEl) {
                this.collectResultEl.innerHTML = `
                    <div class="completion-message">
                        <p><strong>✓ 收集操作完成！</strong></p>
                        <p>模式: ${this.collectMode === 'toList' ? 'List收集' : '分组收集'}</p>
                    </div>
                `;
            }
        }
    },

    toggleCollectMode: function() {
        this.collectMode = this.collectMode === 'toList' ? 'groupingBy' : 'toList';
        this.updateModeDisplay();

        // 如果已经开始收集，重置以应用新模式
        if (this.collectCurrentStep !== 'prepare') {
            this.resetCollect();
        }
    },

    updateModeDisplay: function() {
        const arrowOperationEl = document.getElementById('arrow-operation');
        const modeCodeEl = document.getElementById('mode-code');

        if (this.collectMode === 'toList') {
            if (arrowOperationEl) {
                arrowOperationEl.textContent = '模式 1';
            }
            if (modeCodeEl) {
                modeCodeEl.innerHTML = '<code>students.stream().collect(Collectors.toList())</code>';
            }
        } else {
            if (arrowOperationEl) {
                arrowOperationEl.textContent = '模式 2';
            }
            if (modeCodeEl) {
                modeCodeEl.innerHTML = '<code>students.stream().collect(Collectors.groupingBy(Student::getMajor))</code>';
            }
        }
    },

    startCollecting: function() {
        this.collectCurrentStep = 'collecting';
        this.collectCurrentIndex = 0;

        // 激活箭头
        const arrow = document.getElementById('collect-arrow');
        if (arrow) {
            arrow.classList.add('active');
        }

        this.collectStreamItems = document.querySelectorAll('.stream-item');
        this.collectResultEl = document.getElementById('collect-result');

        // 清空结果区域
        if (this.collectResultEl) {
            this.collectResultEl.innerHTML = this.collectMode === 'toList' ?
                '<div class="list-result" id="list-result"></div>' :
                '<div class="group-result" id="group-result"></div>';
        }

        if (this.collectMode === 'groupingBy') {
            this.initGroupingResult();
        }

        // 初始化进度信息
        this.updateCollectInfo();

        this.processCollectStep();
    },

    initGroupingResult: function() {
        const groupResultEl = document.getElementById('group-result');
        if (!groupResultEl) return;

        // 获取所有专业
        this.collectMajors = [...new Set(sampleStudents.map(s => s.major))];

        // 创建分组容器
        this.collectMajors.forEach((major, index) => {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'group-container';
            groupContainer.innerHTML = `
                <h5>${major}</h5>
                <div class="group-members" id="group-${index}"></div>
            `;
            groupResultEl.appendChild(groupContainer);
        });
    },

    processCollectStep: function() {
        if (!this.collectStudents || this.collectCurrentIndex >= this.collectStudents.length) {
            this.completeCollecting();
            return;
        }

        const currentStudent = this.collectStudents[this.collectCurrentIndex];
        const currentItem = this.collectStreamItems[this.collectCurrentIndex];

        // 高亮当前处理的元素
        this.collectStreamItems.forEach((el, i) => {
            el.classList.toggle('current', i === this.collectCurrentIndex);
            el.classList.toggle('collected', i < this.collectCurrentIndex);
        });

        if (this.collectMode === 'toList') {
            this.processToListStep(currentStudent);
        } else {
            this.processGroupingStep(currentStudent);
        }

        // 移动到下一个索引
        this.collectCurrentIndex++;

        // 更新进度信息
        this.updateCollectInfo();
    },

    processToListStep: function(student) {
        const listResultEl = document.getElementById('list-result');
        if (!listResultEl) return;

        // 添加到List结果
        const listItem = document.createElement('div');
        listItem.className = 'list-item fade-in';
        listItem.textContent = student.name;
        listResultEl.appendChild(listItem);
    },

    processGroupingStep: function(student) {
        // 找到对应的专业分组
        const groupIndex = this.collectMajors.indexOf(student.major);
        if (groupIndex !== -1) {
            const groupEl = document.getElementById(`group-${groupIndex}`);
            if (groupEl) {
                const studentCard = this.createStudentCard(student);
                studentCard.classList.add('fade-in');
                groupEl.appendChild(studentCard);
            }
        }
    },

    completeCollecting: function() {
        this.collectCurrentStep = 'complete';

        // 停用箭头
        const arrow = document.getElementById('collect-arrow');
        if (arrow) {
            arrow.classList.remove('active');
            arrow.classList.add('completed');
        }

        // 显示完成信息
        if (this.collectResultEl) {
            const collectedCount = this.collectStudents.length;

            if (this.collectMode === 'toList') {
                this.collectResultEl.innerHTML = `
                    <div class="final-result">
                        <div class="result-title">收集完成</div>
                        <div class="result-info">
                            <p>成功收集了 <strong>${collectedCount}</strong> 个学生到List中</p>
                            <p>Stream → List 转换完成</p>
                        </div>
                        <div class="stream-equivalent">
                            等价于: students.stream().collect(Collectors.toList())
                        </div>
                    </div>
                `;
            } else {
                const groupCount = this.collectMajors.length;
                this.collectResultEl.innerHTML = `
                    <div class="final-result">
                        <div class="result-title">分组完成</div>
                        <div class="result-info">
                            <p>成功将 <strong>${collectedCount}</strong> 个学生按专业分为 <strong>${groupCount}</strong> 组</p>
                            <p>Stream → Map<String, List<Student>> 转换完成</p>
                        </div>
                        <div class="stream-equivalent">
                            等价于: students.stream().collect(Collectors.groupingBy(Student::getMajor))
                        </div>
                    </div>
                `;
            }
        }

        // 标记所有元素为已收集
        this.collectStreamItems.forEach(el => {
            el.classList.remove('current');
            el.classList.add('collected');
        });

        // 完成后的进度提示
        this.updateCollectInfo(true);
    },

    resetCollect: function() {
        // 重置所有状态
        this.collectCurrentIndex = 0;
        this.collectCurrentStep = 'prepare';
        this.collectMode = 'toList';

        // 重置流元素状态
        const streamItems = document.querySelectorAll('.stream-item');
        streamItems.forEach(el => {
            el.classList.remove('current', 'collected');
        });

        // 重置箭头状态
        const arrow = document.getElementById('collect-arrow');
        if (arrow) {
            arrow.classList.remove('active', 'completed');
        }

        // 更新模式显示
        this.updateModeDisplay();

        // 清空结果区域
        const resultEl = document.getElementById('collect-result');
        if (resultEl) {
            resultEl.innerHTML = '<div class="placeholder">点击"下一步"开始收集演示</div>';
        }

        // 重置进度信息
        const infoEl = document.getElementById('collect-info');
        if (infoEl) {
            infoEl.textContent = '未开始，点击“下一步”开始演示';
        }
    },

    // 更新进度信息显示（completed 为 true 时显示完成文案）
    updateCollectInfo: function(completed = false) {
        const infoEl = document.getElementById('collect-info');
        if (!infoEl || !this.collectStudents) return;

        const total = this.collectStudents.length;
        const processed = Math.min(this.collectCurrentIndex, total);
        const modeText = this.collectMode === 'toList' ? '收集到 List' : '按专业分组';

        if (completed) {
            infoEl.textContent = `已完成：共处理 ${total} 项（模式：${modeText}）`;
        } else if (this.collectCurrentStep === 'collecting') {
            infoEl.textContent = `进度：${processed}/${total}（模式：${modeText}）`;
        } else {
            infoEl.textContent = '未开始，点击“下一步”开始演示';
        }
    },

    // 9. parallel() 并行操作动画
    parallelDemo: function() {
        const container = document.getElementById('parallel-animation');
        if (!container) return;

        // 重置状态
        this.parallelCurrentStep = 'prepare'; // 'prepare', 'sequential', 'parallel', 'complete'
        this.parallelCurrentTaskIndex = 0;
        this.parallelSequentialTime = 0;
        this.parallelParallelTime = 0;

        container.innerHTML = `
            <h3>parallel() 并行处理演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.parallelStep()">下一步</button>
                <button onclick="StreamAnimation.resetParallel()">重置</button>
            </div>
            <div class="animation-scene">
                <div class="parallel-comparison">
                    <div class="comparison-side">
                        <h4>串行处理 (Sequential)</h4>
                        <div class="processing-info">
                            <div class="status" id="sequential-status">准备开始...</div>
                            <div class="task-counter" id="sequential-counter">任务: 0/8</div>
                        </div>
                        <div class="processing-timeline" id="sequential-timeline">
                            <div class="timeline-track"></div>
                        </div>
                        <div class="time-display" id="sequential-time">时间: 0ms</div>
                        <div class="performance-info">
                            <div class="info-label">总耗时:</div>
                            <div class="info-value" id="sequential-total">0ms</div>
                        </div>
                    </div>
                    <div class="comparison-side">
                        <h4>并行处理 (Parallel)</h4>
                        <div class="processing-info">
                            <div class="status" id="parallel-status">准备开始...</div>
                            <div class="task-counter" id="parallel-counter">任务: 0/8</div>
                        </div>
                        <div class="processing-timeline" id="parallel-timeline">
                            <div class="timeline-track"></div>
                        </div>
                        <div class="time-display" id="parallel-time">时间: 0ms</div>
                        <div class="performance-info">
                            <div class="info-label">总耗时:</div>
                            <div class="info-value" id="parallel-total">0ms</div>
                        </div>
                    </div>
                </div>
                <div class="comparison-result" id="comparison-result">
                    <p>点击"下一步"开始并行处理对比演示</p>
                </div>
            </div>
        `;

        this.resetParallel();
    },

    // 新增：单步执行函数
    parallelStep: function() {
        if (this.parallelCurrentStep === 'prepare') {
            this.startSequentialProcessing();
        } else if (this.parallelCurrentStep === 'sequential') {
            this.processSequentialStep();
        } else if (this.parallelCurrentStep === 'parallel') {
            this.processParallelStep();
        } else if (this.parallelCurrentStep === 'complete') {
            // 对比完成
            if (this.comparisonResultEl) {
                this.comparisonResultEl.innerHTML = `
                    <div class="completion-summary">
                        <h4>性能对比完成</h4>
                        <div class="performance-comparison">
                            <div class="comparison-item sequential-result">
                                <h5>串行处理</h5>
                                <p>总耗时: <strong>${this.parallelSequentialTime}ms</strong></p>
                                <p>处理方式: 逐个执行</p>
                            </div>
                            <div class="comparison-item parallel-result">
                                <h5>并行处理</h5>
                                <p>总耗时: <strong>${this.parallelParallelTime}ms</strong></p>
                                <p>处理方式: 同时执行</p>
                            </div>
                        </div>
                        <div class="efficiency-gain">
                            <p>性能提升: <strong>${Math.round((this.parallelSequentialTime - this.parallelParallelTime) / this.parallelSequentialTime * 100)}%</strong></p>
                        </div>
                        <div class="stream-equivalent">
                            等价于: students.parallelStream().map(this::processTask).collect(Collectors.toList())
                        </div>
                    </div>
                `;
            }
        }
    },

    startSequentialProcessing: function() {
        this.parallelCurrentStep = 'sequential';
        this.parallelCurrentTaskIndex = 0;
        this.parallelSequentialTime = 0;
        this.parallelTasks = Array(8).fill(0).map((_, i) => ({ id: i + 1, duration: 300 + Math.random() * 200 }));

        // 获取DOM元素
        this.sequentialTimeline = document.getElementById('sequential-timeline');
        this.parallelTimeline = document.getElementById('parallel-timeline');
        this.sequentialStatus = document.getElementById('sequential-status');
        this.sequentialCounter = document.getElementById('sequential-counter');
        this.sequentialTime = document.getElementById('sequential-time');
        this.sequentialTotal = document.getElementById('sequential-total');
        this.comparisonResultEl = document.getElementById('comparison-result');

        // 更新状态
        if (this.sequentialStatus) {
            this.sequentialStatus.textContent = '开始串行处理...';
            this.sequentialStatus.className = 'status active';
        }

        this.processSequentialStep();
    },

    processSequentialStep: function() {
        if (!this.parallelTasks || this.parallelCurrentTaskIndex >= this.parallelTasks.length) {
            this.completeSequentialProcessing();
            return;
        }

        const currentTask = this.parallelTasks[this.parallelCurrentTaskIndex];

        // 创建任务元素
        const taskEl = document.createElement('div');
        taskEl.className = 'task-item sequential';
        taskEl.textContent = `任务${currentTask.id}`;

        // 添加到时间线
        if (this.sequentialTimeline) {
            this.sequentialTimeline.appendChild(taskEl);
        }

        // 更新状态和计数器
        if (this.sequentialStatus) {
            this.sequentialStatus.textContent = `处理任务 ${currentTask.id}...`;
        }
        if (this.sequentialCounter) {
            this.sequentialCounter.textContent = `任务: ${this.parallelCurrentTaskIndex + 1}/8`;
        }

        // 模拟任务执行时间
        this.parallelSequentialTime += Math.round(currentTask.duration);
        if (this.sequentialTime) {
            this.sequentialTime.textContent = `时间: ${this.parallelSequentialTime}ms`;
        }
        if (this.sequentialTotal) {
            this.sequentialTotal.textContent = `${this.parallelSequentialTime}ms`;
        }

        this.parallelCurrentTaskIndex++;
    },

    completeSequentialProcessing: function() {
        this.parallelCurrentStep = 'parallel';
        this.parallelCurrentTaskIndex = 0;
        this.parallelParallelTime = 0;

        // 更新串行完成状态
        if (this.sequentialStatus) {
            this.sequentialStatus.textContent = '串行处理完成';
            this.sequentialStatus.className = 'status completed';
        }

        // 准备并行处理
        if (this.sequentialStatus) {
            this.sequentialStatus.textContent = '串行处理完成';
        }
        if (this.sequentialStatus) {
            this.sequentialStatus.className = 'status completed';
        }

        // 更新并行状态
        const parallelStatus = document.getElementById('parallel-status');
        const parallelCounter = document.getElementById('parallel-counter');
        if (parallelStatus) {
            parallelStatus.textContent = '开始并行处理...';
            parallelStatus.className = 'status active';
        }

        this.processParallelStep();
    },

    processParallelStep: function() {
        if (!this.parallelTasks || this.parallelCurrentTaskIndex >= this.parallelTasks.length) {
            this.completeParallelProcessing();
            return;
        }

        const currentTask = this.parallelTasks[this.parallelCurrentTaskIndex];

        // 创建任务元素（并行处理同时开始）
        const taskEl = document.createElement('div');
        taskEl.className = 'task-item parallel';
        taskEl.textContent = `任务${currentTask.id}`;
        taskEl.style.animationDelay = '0s';

        // 所有并行任务同时开始
        if (this.parallelTimeline && this.parallelCurrentTaskIndex === 0) {
            // 清空并行时间线并添加所有任务
            this.parallelTimeline.innerHTML = '';

            // 计算最长任务时间（并行处理的总时间）
            const maxDuration = Math.max(...this.parallelTasks.map(t => t.duration));
            this.parallelParallelTime = Math.round(maxDuration);

            // 添加所有任务
            this.parallelTasks.forEach(task => {
                const parallelTaskEl = document.createElement('div');
                parallelTaskEl.className = 'task-item parallel';
                parallelTaskEl.textContent = `任务${task.id}`;
                parallelTaskEl.style.animationDelay = '0s';
                this.parallelTimeline.appendChild(parallelTaskEl);
            });

            // 更新并行显示
            const parallelTime = document.getElementById('parallel-time');
            const parallelTotal = document.getElementById('parallel-total');
            const parallelCounter = document.getElementById('parallel-counter');

            if (parallelTime) {
                parallelTime.textContent = `时间: ${this.parallelParallelTime}ms`;
            }
            if (parallelTotal) {
                parallelTotal.textContent = `${this.parallelParallelTime}ms`;
            }
            if (parallelCounter) {
                parallelCounter.textContent = `任务: 8/8`;
            }

            // 延迟完成
            setTimeout(() => {
                this.completeParallelProcessing();
            }, 500);
        }

        this.parallelCurrentTaskIndex++;
    },

    completeParallelProcessing: function() {
        this.parallelCurrentStep = 'complete';

        // 更新并行完成状态
        const parallelStatus = document.getElementById('parallel-status');
        if (parallelStatus) {
            parallelStatus.textContent = '并行处理完成';
            parallelStatus.className = 'status completed';
        }

        // 等待用户点击查看对比结果
        if (this.comparisonResultEl) {
            this.comparisonResultEl.innerHTML = '<p>点击"下一步"查看性能对比结果</p>';
        }
    },

    resetParallel: function() {
        // 重置所有状态
        this.parallelCurrentStep = 'prepare';
        this.parallelCurrentTaskIndex = 0;
        this.parallelSequentialTime = 0;
        this.parallelParallelTime = 0;

        // 清空时间线
        const sequentialTimeline = document.getElementById('sequential-timeline');
        const parallelTimeline = document.getElementById('parallel-timeline');
        if (sequentialTimeline) {
            sequentialTimeline.innerHTML = '<div class="timeline-track"></div>';
        }
        if (parallelTimeline) {
            parallelTimeline.innerHTML = '<div class="timeline-track"></div>';
        }

        // 重置状态显示
        const elements = ['sequential-status', 'parallel-status', 'sequential-counter', 'parallel-counter'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.className = 'status';
                if (id.includes('status')) {
                    el.textContent = '准备开始...';
                } else if (id.includes('counter')) {
                    el.textContent = '任务: 0/8';
                }
            }
        });

        // 重置时间显示
        const timeElements = ['sequential-time', 'parallel-time', 'sequential-total', 'parallel-total'];
        timeElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = '时间: 0ms';
            }
        });

        // 重置结果区域
        const comparisonResultEl = document.getElementById('comparison-result');
        if (comparisonResultEl) {
            comparisonResultEl.innerHTML = '<p>点击"下一步"开始并行处理对比演示</p>';
        }
    },

    // 10. 完整Stream链综合动画
    fullChainDemo: function() {
        const container = document.getElementById('fullChain-animation');
        if (!container) return;

        container.innerHTML = `
            <h3>完整Stream链演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.startFullChainAnimation()">播放完整链</button>
                <button onclick="StreamAnimation.resetAnimation('fullChain-animation')">重置</button>
            </div>
            <div class="animation-scene">
                <div class="pipeline-container">
                    <div class="pipeline-stage" id="chain-input">
                        <h4>原始数据</h4>
                        <div class="student-list" id="chain-students"></div>
                    </div>

                    <div class="pipeline-arrow filter-arrow">
                        <div class="arrow-body"></div>
                        <div class="arrow-head">filter(age ≥ 20)</div>
                    </div>

                    <div class="pipeline-stage">
                        <h4>筛选结果</h4>
                        <div class="mini-list" id="chain-filtered"></div>
                    </div>

                    <div class="pipeline-arrow map-arrow">
                        <div class="arrow-body"></div>
                        <div class="arrow-head">map(Student::getName)</div>
                    </div>

                    <div class="pipeline-stage">
                        <h4>姓名列表</h4>
                        <div class="mini-list" id="chain-mapped"></div>
                    </div>

                    <div class="pipeline-arrow sort-arrow">
                        <div class="arrow-body"></div>
                        <div class="arrow-head">sorted()</div>
                    </div>

                    <div class="pipeline-stage">
                        <h4>排序结果</h4>
                        <div class="mini-list" id="chain-sorted"></div>
                    </div>

                    <div class="pipeline-arrow collect-arrow">
                        <div class="arrow-body"></div>
                        <div class="arrow-head">collect()</div>
                    </div>

                    <div class="pipeline-stage final-stage">
                        <h4>最终结果</h4>
                        <div class="final-list" id="chain-final"></div>
                    </div>
                </div>
            </div>
        `;

        this.renderStudents('chain-students', sampleStudents);
    },

    startFullChainAnimation: function() {
        const students = sampleStudents.filter(s => s.age >= 20);
        let step = 0;

        // 步骤1: 筛选
        setTimeout(() => {
            document.querySelector('.filter-arrow').classList.add('active');
            const filteredContainer = document.getElementById('chain-filtered');
            students.forEach((student, index) => {
                const card = this.createStudentCard(student);
                card.classList.add('mini-card', 'fade-in');
                card.style.animationDelay = `${index * 0.1}s`;
                filteredContainer.appendChild(card);
            });
        }, step * 1500);

        // 步骤2: 映射
        step++;
        setTimeout(() => {
            document.querySelector('.map-arrow').classList.add('active');
            const mappedContainer = document.getElementById('chain-mapped');
            students.forEach((student, index) => {
                const nameEl = document.createElement('div');
                nameEl.className = 'mini-string fade-in';
                nameEl.textContent = student.name;
                nameEl.style.animationDelay = `${index * 0.1}s`;
                mappedContainer.appendChild(nameEl);
            });
        }, step * 1500);

        // 步骤3: 排序
        step++;
        setTimeout(() => {
            document.querySelector('.sort-arrow').classList.add('active');
            const sortedContainer = document.getElementById('chain-sorted');
            const sortedStudents = students.sort((a, b) => a.name.localeCompare(b.name));
            sortedStudents.forEach((student, index) => {
                const nameEl = document.createElement('div');
                nameEl.className = 'mini-string fade-in';
                nameEl.textContent = student.name;
                nameEl.style.animationDelay = `${index * 0.1}s`;
                sortedContainer.appendChild(nameEl);
            });
        }, step * 1500);

        // 步骤4: 收集
        step++;
        setTimeout(() => {
            document.querySelector('.collect-arrow').classList.add('active');
            document.querySelector('.final-stage').classList.add('highlighted');
            const finalContainer = document.getElementById('chain-final');
            finalContainer.innerHTML = `
                <div class="final-result-display">
                    <div class="result-type">List&lt;String&gt;</div>
                    <div class="result-count">共 ${students.length} 个元素</div>
                </div>
            `;
        }, step * 1500);
    },

    // 辅助方法
    renderStudents: function(containerId, students) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        students.forEach(student => {
            container.appendChild(this.createStudentCard(student));
        });
    },

    createStudentCard: function(student) {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <div class="student-name">${student.name}</div>
            <div class="student-age">${student.age}</div>
            <div class="student-score">${student.score}</div>
            <div class="student-major">${student.major}</div>
        `;
        return card;
    },

    resetAnimation: function(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
};

// 监听幻灯片变化，自动初始化动画
document.addEventListener('slidechange', (event) => {
    const slideIndex = event.detail.index;

    // 根据slide index自动初始化对应的动画
    const animations = [
        null,     // slide 0 (title)
        null,     // slide 1 (pain points)
        null,     // slide 2 (ideal solution)
        null,     // slide 3 (overview)
        null,     // slide 4 (forEach theory)
        'forEach', // slide 5 (forEach animation)
        null,     // slide 6 (filter theory)
        'filter',  // slide 7 (filter animation)
        null,     // slide 8 (map theory)
        'map',     // slide 9 (map animation)
        null,     // slide 10 (sorted theory)
        'sorted',  // slide 11 (sorted animation)
        null,     // slide 12 (limit/skip theory)
        'skipLimit', // slide 13 (limit/skip animation)
        null,     // slide 14 (max/min theory)
        'maxMin',  // slide 15 (max/min animation)
        null,     // slide 16 (reduce theory)
        'reduce',  // slide 17 (reduce animation)
        null,     // slide 18 (collect theory)
        'collect', // slide 19 (collect animation)
        null,     // slide 20 (parallel theory)
        'parallel', // slide 21 (parallel animation)
        null,     // slide 22 (full chain theory)
        'fullChain', // slide 23 (full chain animation)
        null      // slide 24 (best practices)
    ];

    const animationType = animations[slideIndex];
    if (animationType && StreamAnimation[animationType + 'Demo']) {
        setTimeout(() => {
            StreamAnimation[animationType + 'Demo']();
        }, 500); // 延迟初始化，等待slide完全加载
    }
});