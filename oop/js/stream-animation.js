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

        container.innerHTML = `
            <h3>sorted() 排序演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.startSortAnimation()">按成绩排序</button>
                <button onclick="StreamAnimation.resetAnimation('sorted-animation')">重置</button>
            </div>
            <div class="animation-scene">
                <div class="sort-container" id="sort-container">
                    <div class="sort-stage" id="sort-input">
                        <h4>原始顺序</h4>
                        <div class="student-list" id="sort-students"></div>
                    </div>
                    <div class="sort-stage" id="sort-output">
                        <h4>排序后 (按成绩降序)</h4>
                        <div class="student-list" id="sort-result"></div>
                    </div>
                </div>
            </div>
        `;

        this.renderStudents('sort-students', sampleStudents.slice(0, 5));
    },

    startSortAnimation: function() {
        const students = sampleStudents.slice(0, 5);
        const outputContainer = document.getElementById('sort-result');

        // 复制学生到输出区域（初始位置打乱）
        outputContainer.innerHTML = '';
        students.forEach((student, index) => {
            const studentEl = this.createStudentCard(student);
            studentEl.style.order = Math.random(); // 随机位置
            studentEl.classList.add('sorting');
            outputContainer.appendChild(studentEl);
        });

        // 排序动画
        setTimeout(() => {
            const sortedStudents = students.sort((a, b) => b.score - a.score);
            const studentEls = outputContainer.querySelectorAll('.student-card');

            sortedStudents.forEach((student, index) => {
                const targetEl = Array.from(studentEls).find(el =>
                    el.querySelector('.student-name').textContent === student.name
                );

                if (targetEl) {
                    targetEl.style.order = index;
                    targetEl.classList.add('sorted');

                    // 添加排名
                    const rankEl = document.createElement('div');
                    rankEl.className = 'rank-badge';
                    rankEl.textContent = `#${index + 1}`;
                    targetEl.appendChild(rankEl);
                }
            });
        }, 1000);
    },

    // 5. skip() 和 limit() 提取操作动画
    skipLimitDemo: function() {
        const container = document.getElementById('skipLimit-animation');
        if (!container) return;

        container.innerHTML = `
            <h3>skip() & limit() 分页演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.startSkipLimitAnimation()">分页: 跳过3个，取5个</button>
                <button onclick="StreamAnimation.resetAnimation('skipLimit-animation')">重置</button>
            </div>
            <div class="animation-scene">
                <div class="pagination-container">
                    <div class="stage" id="skip-input">
                        <h4>原始数据 (前10个)</h4>
                        <div class="student-list" id="skip-students"></div>
                    </div>
                    <div class="pagination-info">
                        <div class="operation">skip(3)</div>
                        <div class="arrow down">⬇</div>
                        <div class="operation">limit(5)</div>
                    </div>
                    <div class="stage" id="skip-result">
                        <h4>分页结果 (第2页)</h4>
                        <div class="student-list" id="skip-result-list"></div>
                    </div>
                </div>
            </div>
        `;

        this.renderStudents('skip-students', sampleStudents);
    },

    startSkipLimitAnimation: function() {
        const students = document.querySelectorAll('#skip-students .student-card');
        const outputContainer = document.getElementById('skip-result-list');

        outputContainer.innerHTML = '';

        students.forEach((studentEl, index) => {
            setTimeout(() => {
                if (index < 3) {
                    // skip: 飞出并消失
                    studentEl.classList.add('skipped');
                    setTimeout(() => {
                        studentEl.classList.add('fade-out');
                    }, 300);
                } else if (index < 8) {
                    // limit: 复制到结果区域
                    const clone = studentEl.cloneNode(true);
                    clone.classList.add('selected', 'fade-in');
                    outputContainer.appendChild(clone);
                    studentEl.classList.add('selected');
                } else {
                    // 超出limit: 变灰
                    studentEl.classList.add('excluded');
                }
            }, index * 200);
        });
    },

    // 6. max() / min() 最值查找动画
    maxMinDemo: function() {
        const container = document.getElementById('maxMin-animation');
        if (!container) return;

        container.innerHTML = `
            <h3>max() / min() 最值演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.startMaxMinAnimation()">查找最高分</button>
                <button onclick="StreamAnimation.resetAnimation('maxMin-animation')">重置</button>
            </div>
            <div class="animation-scene">
                <div class="tournament-container">
                    <div class="stage" id="maxmin-input">
                        <h4>学生成绩</h4>
                        <div class="student-list" id="maxmin-students"></div>
                    </div>
                    <div class="stage" id="maxmin-result">
                        <h4>最高分学生</h4>
                        <div id="winner-container"></div>
                    </div>
                </div>
            </div>
        `;

        this.renderStudents('maxmin-students', sampleStudents.slice(0, 8));
    },

    startMaxMinAnimation: function() {
        const students = sampleStudents.slice(0, 8);
        const winnerContainer = document.getElementById('winner-container');

        // 锦标赛式比较
        let candidates = [...students];
        let round = 1;

        const tournamentRound = () => {
            if (candidates.length <= 1) {
                // 显示最终胜利者
                winnerContainer.innerHTML = `
                    <div class="winner-card">
                        <div class="trophy">🏆</div>
                        <div class="winner-info">
                            <h4>${candidates[0].name}</h4>
                            <p>成绩: ${candidates[0].score}</p>
                        </div>
                    </div>
                `;
                return;
            }

            // 两两比较
            const nextRound = [];
            for (let i = 0; i < candidates.length; i += 2) {
                if (i + 1 < candidates.length) {
                    const a = candidates[i];
                    const b = candidates[i + 1];
                    const winner = a.score > b.score ? a : b;
                    const loser = a.score > b.score ? b : a;

                    nextRound.push(winner);

                    // 动画显示比较过程
                    setTimeout(() => {
                        this.showComparison(a, b, winner, loser);
                    }, (i / 2) * 1000 + round * 2000);
                } else {
                    nextRound.push(candidates[i]);
                }
            }

            candidates = nextRound;
            round++;

            if (candidates.length > 1) {
                setTimeout(tournamentRound, candidates.length * 1000 + 1000);
            }
        };

        setTimeout(tournamentRound, 500);
    },

    showComparison: function(a, b, winner, loser) {
        // 这里可以添加比较的视觉效果
        console.log(`比较: ${a.name}(${a.score}) vs ${b.name}(${b.score}) -> 胜者: ${winner.name}`);
    },

    // 7. reduce() 规约操作动画
    reduceDemo: function() {
        const container = document.getElementById('reduce-animation');
        if (!container) return;

        container.innerHTML = `
            <h3>reduce() 规约演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.startReduceAnimation()">计算成绩总和</button>
                <button onclick="StreamAnimation.resetAnimation('reduce-animation')">重置</button>
            </div>
            <div class="animation-scene">
                <div class="reduce-container">
                    <div class="stage" id="reduce-input">
                        <h4>学生成绩</h4>
                        <div class="score-list" id="reduce-scores"></div>
                    </div>
                    <div class="reduce-flow" id="reduce-accumulator">
                        <div class="accumulator">累加器: <span id="accumulator-value">0</span></div>
                        <div class="reduce-step" id="reduce-step"></div>
                    </div>
                    <div class="stage" id="reduce-result">
                        <h4>最终结果</h4>
                        <div class="result-display" id="result-display"></div>
                    </div>
                </div>
            </div>
        `;

        // 渲染成绩列表
        const scoresContainer = document.getElementById('reduce-scores');
        sampleStudents.slice(0, 6).forEach(student => {
            const scoreEl = document.createElement('div');
            scoreEl.className = 'score-item';
            scoreEl.textContent = student.score;
            scoresContainer.appendChild(scoreEl);
        });
    },

    startReduceAnimation: function() {
        const scores = sampleStudents.slice(0, 6).map(s => s.score);
        const accumulatorEl = document.getElementById('accumulator-value');
        const stepEl = document.getElementById('reduce-step');
        const resultEl = document.getElementById('result-display');

        let accumulator = 0;

        scores.forEach((score, index) => {
            setTimeout(() => {
                // 高亮当前处理的分数
                document.querySelectorAll('.score-item').forEach((el, i) => {
                    el.classList.toggle('highlighted', i === index);
                });

                // 显示累加步骤
                const oldAccumulator = accumulator;
                accumulator += score;

                stepEl.innerHTML = `
                    <div class="reduce-operation">
                        ${oldAccumulator} + ${score} = ${accumulator}
                    </div>
                `;

                // 更新累加器显示
                accumulatorEl.textContent = accumulator;

                // 最后显示最终结果
                if (index === scores.length - 1) {
                    setTimeout(() => {
                        resultEl.innerHTML = `
                            <div class="final-result">
                                总和: <span class="result-value">${accumulator}</span>
                            </div>
                        `;
                    }, 800);
                }
            }, index * 1200);
        });
    },

    // 8. collect() 收集操作动画
    collectDemo: function() {
        const container = document.getElementById('collect-animation');
        if (!container) return;

        container.innerHTML = `
            <h3>collect() 收集演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.startCollectAnimation()">收集到List</button>
                <button onclick="StreamAnimation.startGroupingAnimation()">按专业分组</button>
                <button onclick="StreamAnimation.resetAnimation('collect-animation')">重置</button>
            </div>
            <div class="animation-scene">
                <div class="collect-container">
                    <div class="stage" id="collect-input">
                        <h4>Stream处理后的数据</h4>
                        <div class="stream-items" id="stream-items"></div>
                    </div>
                    <div class="arrow" id="collect-arrow">
                        <div class="arrow-body"></div>
                        <div class="arrow-head">collect(Collectors.toList())</div>
                    </div>
                    <div class="stage" id="collect-output">
                        <h4>收集结果</h4>
                        <div class="list-container" id="list-result"></div>
                    </div>
                </div>
            </div>
        `;

        // 创建Stream数据项
        const streamContainer = document.getElementById('stream-items');
        sampleStudents.slice(0, 5).forEach((student, index) => {
            const streamItem = document.createElement('div');
            streamItem.className = 'stream-item';
            streamItem.textContent = student.name;
            streamItem.style.animationDelay = `${index * 0.2}s`;
            streamContainer.appendChild(streamItem);
        });
    },

    startCollectAnimation: function() {
        const streamItems = document.querySelectorAll('.stream-item');
        const listResult = document.getElementById('list-result');
        const arrow = document.getElementById('collect-arrow');

        listResult.innerHTML = '';
        arrow.classList.add('active');

        streamItems.forEach((item, index) => {
            setTimeout(() => {
                // Stream项飞入List容器
                item.classList.add('flying');

                setTimeout(() => {
                    const listItem = document.createElement('div');
                    listItem.className = 'list-item fade-in';
                    listItem.textContent = item.textContent;
                    listResult.appendChild(listItem);

                    item.classList.add('collected');
                }, 500);
            }, index * 300);
        });
    },

    startGroupingAnimation: function() {
        // 分组动画
        const majors = [...new Set(sampleStudents.map(s => s.major))];
        const resultContainer = document.getElementById('list-result');

        resultContainer.innerHTML = '';
        document.getElementById('collect-arrow').querySelector('.arrow-head').textContent = 'groupingBy(Student::getMajor)';

        majors.forEach((major, index) => {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'group-container';
            groupContainer.innerHTML = `
                <h5>${major}</h5>
                <div class="group-members" id="group-${index}"></div>
            `;
            resultContainer.appendChild(groupContainer);

            // 该专业的学生飞入对应组
            sampleStudents
                .filter(s => s.major === major)
                .forEach((student, sIndex) => {
                    setTimeout(() => {
                        const studentCard = this.createStudentCard(student);
                        studentCard.classList.add('fade-in');
                        document.getElementById(`group-${index}`).appendChild(studentCard);
                    }, (index * 3 + sIndex) * 200);
                });
        });
    },

    // 9. parallel() 并行操作动画
    parallelDemo: function() {
        const container = document.getElementById('parallel-animation');
        if (!container) return;

        container.innerHTML = `
            <h3>parallel() 并行处理演示</h3>
            <div class="animation-controls">
                <button onclick="StreamAnimation.startParallelAnimation()">并行 vs 串行对比</button>
                <button onclick="StreamAnimation.resetAnimation('parallel-animation')">重置</button>
            </div>
            <div class="animation-scene">
                <div class="parallel-comparison">
                    <div class="comparison-side">
                        <h4>串行处理 (Sequential)</h4>
                        <div class="processing-timeline" id="sequential-timeline">
                            <div class="timeline-track"></div>
                        </div>
                        <div class="time-display" id="sequential-time">时间: 0ms</div>
                    </div>
                    <div class="comparison-side">
                        <h4>并行处理 (Parallel)</h4>
                        <div class="processing-timeline" id="parallel-timeline">
                            <div class="timeline-track"></div>
                        </div>
                        <div class="time-display" id="parallel-time">时间: 0ms</div>
                    </div>
                </div>
            </div>
        `;

        this.startParallelProcessing();
    },

    startParallelProcessing: function() {
        const dataItems = Array(8).fill(0).map((_, i) => ({ id: i + 1, value: Math.random() * 100 }));
        const sequentialTime = 1000; // 模拟串行时间
        const parallelTime = 300; // 模拟并行时间

        // 串行处理动画
        const sequentialTimeline = document.getElementById('sequential-timeline');
        dataItems.forEach((item, index) => {
            setTimeout(() => {
                const taskEl = document.createElement('div');
                taskEl.className = 'task-item sequential';
                taskEl.textContent = `任务${item.id}`;
                taskEl.style.animationDelay = '0s';
                sequentialTimeline.appendChild(taskEl);
            }, index * sequentialTime);
        });

        // 并行处理动画
        const parallelTimeline = document.getElementById('parallel-timeline');
        dataItems.forEach(item => {
            const taskEl = document.createElement('div');
            taskEl.className = 'task-item parallel';
            taskEl.textContent = `任务${item.id}`;
            taskEl.style.animationDelay = '0s';
            parallelTimeline.appendChild(taskEl);
        });

        // 更新时间显示
        const updateTime = () => {
            document.getElementById('sequential-time').textContent =
                `时间: ${Math.min(sequentialTime, dataItems.length * sequentialTime)}ms`;
            document.getElementById('parallel-time').textContent =
                `时间: ${parallelTime}ms`;
        };

        setTimeout(updateTime, 100);
        setTimeout(updateTime, dataItems.length * sequentialTime + 100);
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