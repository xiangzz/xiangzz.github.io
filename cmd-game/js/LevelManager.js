/**
 * 关卡管理器类
 * 负责管理游戏关卡、检查进度和处理关卡逻辑
 */
class LevelManager {
    constructor(gameManager, vfs) {
        this.gameManager = gameManager;
        this.vfs = vfs;
        this.currentLevelIndex = 0;
        this.levels = this.initializeLevels();
        this.completedTasks = new Set();
        this.levelStartTime = Date.now();
        this.studentInfo = {
            studentId: null,
            name: null
        };
        
        // 初始化第一关
        this.setupCurrentLevel();
    }

    /**
     * 初始化所有关卡
     */
    initializeLevels() {
        return [
            {
                level: 1,
                title: "基础导航",
                description: "学习使用 cd 命令进入指定目录",
                tasks: [
                    { id: "nav_1", text: "使用 dir 命令查看当前目录", completed: false },
                    { id: "nav_2", text: "使用 cd Documents 进入 Documents 目录", completed: false }
                ],
                hints: [
                    "使用 dir 命令查看当前目录内容",
                    "使用 cd Documents 进入 Documents 目录",
                    "如果输入错误，可以使用 cd .. 返回上一级目录"
                ],
                setupState: this.setupNavigationLevel.bind(this),
                checkSuccess: this.checkNavigationLevel.bind(this),
                completionMessage: "恭喜！你已经掌握了基本的目录导航命令。",
                score: 50
            },
            {
                level: 2,
                title: "创建目录",
                description: "学习使用 mkdir 命令创建新目录",
                tasks: [
                    { id: "mkdir_1", text: "使用 mkdir my_folder 创建目录", completed: false },
                    { id: "mkdir_2", text: "使用 dir 命令确认目录创建成功", completed: false }
                ],
                hints: [
                    "使用 mkdir my_folder 创建目录",
                    "使用 dir 命令确认目录创建成功",
                    "确保目录名称完全匹配：my_folder"
                ],
                setupState: this.setupDirectoryCreationLevel.bind(this),
                checkSuccess: this.checkDirectoryCreationLevel.bind(this),
                completionMessage: "很好！你学会了如何创建新目录。",
                score: 75
            },
            {
                level: 3,
                title: "文件复制",
                description: "学习使用 copy 命令复制文件",
                tasks: [
                    { id: "copy_1", text: "查看 source 目录中的文件", completed: false },
                    { id: "copy_2", text: "将 test.txt 复制到 target 目录", completed: false },
                    { id: "copy_3", text: "验证文件复制成功", completed: false }
                ],
                hints: [
                    "使用 cd source 进入源目录",
                    "使用 copy test.txt ..\\target\\test.txt 复制文件",
                    "使用 dir ..\\target 确认文件已复制"
                ],
                setupState: this.setupFileCopyLevel.bind(this),
                checkSuccess: this.checkFileCopyLevel.bind(this),
                completionMessage: "出色！文件复制操作完成。",
                score: 100
            },
            {
                level: 4,
                title: "文件删除",
                description: "学习使用 del 命令删除文件",
                tasks: [
                    { id: "del_1", text: "确认 delete_me.txt 文件存在", completed: false },
                    { id: "del_2", text: "使用 del 命令删除文件", completed: false },
                    { id: "del_3", text: "验证文件已被删除", completed: false }
                ],
                hints: [
                    "使用 dir 命令确认文件存在",
                    "使用 del delete_me.txt 删除文件",
                    "使用 dir 命令验证文件已被删除"
                ],
                setupState: this.setupFileDeletionLevel.bind(this),
                checkSuccess: this.checkFileDeletionLevel.bind(this),
                completionMessage: "很好！你学会了安全地删除文件。",
                score: 75
            },
            {
                level: 5,
                title: "文件内容查看",
                description: "学习使用 type 命令查看文件内容",
                tasks: [
                    { id: "type_1", text: "使用 type 命令查看 readme.txt", completed: false },
                    { id: "type_2", text: "使用 type 命令查看 config.txt", completed: false }
                ],
                hints: [
                    "使用 type readme.txt 查看文件内容",
                    "使用 type config.txt 查看配置文件",
                    "注意观察不同文件的内容格式"
                ],
                setupState: this.setupFileViewLevel.bind(this),
                checkSuccess: this.checkFileViewLevel.bind(this),
                completionMessage: "优秀！你掌握了查看文件内容的方法。",
                score: 60
            },
            {
                level: 6,
                title: "文件移动",
                description: "学习使用 move 命令移动和重命名文件",
                tasks: [
                    { id: "move_1", text: "查看当前目录中的文件", completed: false },
                    { id: "move_2", text: "将 source.txt 移动并重命名为 moved.txt", completed: false },
                    { id: "move_3", text: "验证文件移动成功", completed: false }
                ],
                hints: [
                    "使用 dir 查看当前文件",
                    "使用 move source.txt moved.txt 移动并重命名文件",
                    "使用 dir 验证移动结果"
                ],
                setupState: this.setupFileMoveLevel.bind(this),
                checkSuccess: this.checkFileMoveLevel.bind(this),
                completionMessage: "太棒了！文件移动操作完成。",
                score: 90
            },
            {
                level: 7,
                title: "命令行参数",
                description: "学习使用带参数的命令删除只读文件",
                tasks: [
                    { id: "args_1", text: "查看当前目录中的文件", completed: false },
                    { id: "args_2", text: "无需确认强制删除只读文件 readonly.txt", completed: false },
                    { id: "args_3", text: "验证文件删除成功", completed: false }
                ],
                hints: [
                    "使用 dir 查看当前文件",
                    "使用 del /Q /F readonly.txt 强制删除只读文件",
                    "/Q 表示安静模式，/F 表示强制删除"
                ],
                setupState: this.setupCommandArgsLevel.bind(this),
                checkSuccess: this.checkCommandArgsLevel.bind(this),
                completionMessage: "很好！你学会了使用命令参数。",
                score: 100
            },
            {
                level: 8,
                title: "文件重命名",
                description: "学习使用 ren 命令重命名文件",
                tasks: [
                    { id: "rename_1", text: "查看当前目录中的文件", completed: false },
                    { id: "rename_2", text: "将 old_name.txt 重命名为 new_name.txt", completed: false },
                    { id: "rename_3", text: "验证重命名成功", completed: false }
                ],
                hints: [
                    "使用 dir 查看当前文件",
                    "使用 ren old_name.txt new_name.txt 重命名文件",
                    "使用 dir 命令确认新文件名"
                ],
                setupState: this.setupRenameLevel.bind(this),
                checkSuccess: this.checkRenameLevel.bind(this),
                completionMessage: "出色！文件重命名操作完成。",
                score: 80
            },
            {
                level: 9,
                title: "目录删除",
                description: "学习使用 rmdir 命令删除目录",
                tasks: [
                    { id: "rmdir_1", text: "查看当前目录结构", completed: false },
                    { id: "rmdir_2", text: "删除空目录 empty_folder", completed: false },
                    { id: "rmdir_3", text: "删除包含文件的目录 full_folder", completed: false }
                ],
                hints: [
                    "使用 dir 查看目录结构",
                    "使用 rmdir empty_folder 删除空目录",
                    "使用 rmdir /S full_folder 删除包含文件的目录"
                ],
                setupState: this.setupRmdirLevel.bind(this),
                checkSuccess: this.checkRmdirLevel.bind(this),
                completionMessage: "很好！你学会了删除目录。",
                score: 90
            },
            {
                level: 10,
                title: "网络测试",
                description: "学习使用ping命令测试网络连接",
                tasks: [
                    { id: "ping_1", text: "测试本地(localhost)连接", completed: false },
                    { id: "ping_2", text: "使用参数控制ping次数为2", completed: false }
                ],
                hints: [
                    "使用 ping localhost 测试本地连接",
                    "使用 ping -n 2 localhost 只发送2个数据包",
                    "观察ping输出的统计信息"
                ],
                setupState: this.setupPingLevel.bind(this),
                checkSuccess: this.checkPingLevel.bind(this),
                completionMessage: "太好了！你学会了网络连接测试。",
                score: 90
            },
            {
                level: 11,
                title: "进程列表",
                description: "学习使用tasklist命令查看系统进程",
                tasks: [
                    { id: "tasklist_1", text: "查看所有运行的进程", completed: false },
                    { id: "tasklist_2", text: "观察进程信息", completed: false }
                ],
                hints: [
                    "使用 tasklist 查看所有进程",
                    "观察进程的PID、内存使用等信息",
                    "注意不同进程的内存占用差异"
                ],
                setupState: this.setupProcessListLevel.bind(this),
                checkSuccess: this.checkProcessListLevel.bind(this),
                completionMessage: "很好！你掌握了进程查看技巧。",
                score: 95
            },
            {
                level: 12,
                title: "进程终止",
                description: "学习使用taskkill命令终止进程",
                tasks: [
                    { id: "taskkill_1", text: "查看当前进程", completed: false },
                    { id: "taskkill_2", text: "终止notepad进程", completed: false }
                ],
                hints: [
                    "使用 tasklist 查看当前进程",
                    "使用 taskkill /PID 1234 终止指定PID的进程",
                    "使用 taskkill /IM notepad.exe 终止指定名称的进程"
                ],
                setupState: this.setupProcessKillLevel.bind(this),
                checkSuccess: this.checkProcessKillLevel.bind(this),
                completionMessage: "出色！你学会了进程管理。",
                score: 100
            },
            {
                level: 13,
                title: "通配符操作",
                description: "学习使用通配符进行批量文件操作",
                tasks: [
                    { id: "wildcard_1", text: "进入wildcard_test中显示所有txt文件", completed: false },
                    { id: "wildcard_2", text: "删除所有.bak文件", completed: false }
                ],
                hints: [
                    "首先进入wildcard_test目录：cd wildcard_test",
                    "使用 dir *.txt 显示所有txt文件",
                    "使用 del *.bak 删除所有备份文件"
                ],
                setupState: this.setupWildcardLevel.bind(this),
                checkSuccess: this.checkWildcardLevel.bind(this),
                completionMessage: "很好！你掌握了通配符的基本用法。",
                score: 105
            },
            {
                level: 14,
                title: "高级文本搜索",
                description: "深入学习findstr命令的高级用法",
                tasks: [
                    { id: "search_1", text: "在file1.txt文件中搜索关键词 error", completed: false },
                    { id: "search_2", text: "在当前目录所有文件中搜索 error 并显示行号", completed: false }
                ],
                hints: [
                    "使用 findstr \"error\" file1.txt 在指定文件中搜索",
                    "使用 findstr /n \"error\" *.* 在所有文件中搜索并显示行号",
                    "观察搜索结果显示的行号和内容"
                ],
                setupState: this.setupAdvancedSearchLevel.bind(this),
                checkSuccess: this.checkAdvancedSearchLevel.bind(this),
                completionMessage: "太棒了！你掌握了高级搜索技巧。",
                score: 110
            },
            {
                level: 15,
                title: "文件查找",
                description: "学习使用where命令查找可执行文件",
                tasks: [
                    { id: "filesearch_1", text: "使用查找src/中的JavaScript文件", completed: false },
                    { id: "filesearch_2", text: "使用查找project/中.ini配置文件", completed: false }
                ],
                hints: [
                    "使用 where /R . *.js 在当前目录和系统路径中查找JavaScript文件",
                    "使用 dir /s *.ini 递归搜索所有子目录中的配置文件",
                    "观察两种命令的搜索范围和结果显示方式的不同"
                ],
                setupState: this.setupFileSearchLevel.bind(this),
                checkSuccess: this.checkFileSearchLevel.bind(this),
                completionMessage: "恭喜！你已经掌握了文件查找技能！",
                score: 150
            },
            {
                level: 16,
                title: "密码生成",
                description: "生成加密密码并截图发给老师验证",
                tasks: [
                    { id: "password_1", text: "设置个人信息： setinfo 学号 姓名", completed: false },
                    { id: "password_2", text: "使用 genpass 生成加密密码", completed: false }
                ],
                hints: [
                    "使用 setinfo 命令设置你的学号和姓名，例如：setinfo 2023001 张三",
                    "使用 genpass 命令生成加密密码，密码将结合你的信息、分数和时间戳"
                ],
                setupState: this.setupPasswordLevel.bind(this),
                checkSuccess: this.checkPasswordLevel.bind(this),
                completionMessage: "恭喜！你已经完成了所有关卡，成为命令行高手！",
                score: 200
            }
        ];
    }

    /**
     * 设置当前关卡
     */
    setupCurrentLevel() {
        const level = this.getCurrentLevel();
        if (level) {
            // 重置任务完成状态
            level.tasks.forEach(task => task.completed = false);
            this.completedTasks.clear();
            
            // 设置关卡初始状态
            level.setupState();
            
            // 更新UI
            this.gameManager.updateLevelInfo(level);
            this.levelStartTime = Date.now();
            
            // 显示关卡开始消息
            this.gameManager.addToTerminal(`\n=== 第 ${level.level} 关：${level.title} ===`, 'level-start');
            this.gameManager.addToTerminal(level.description, 'level-desc');
            this.gameManager.addToTerminal('输入 help 获取提示信息\n', 'info');
        }
    }

    /**
     * 获取当前关卡
     */
    getCurrentLevel() {
        return this.levels[this.currentLevelIndex] || null;
    }

    /**
     * 重置当前关卡
     */
    resetCurrentLevel() {
        const level = this.getCurrentLevel();
        if (level) {
            level.completed = false;
            level.tasks.forEach(task => {
                task.completed = false;
            });
            
            // 重置文件系统到关卡初始状态
            if (level.setup && this.vfs) {
                level.setup(this.vfs);
            }
        }
    }

    /**
     * 检查是否可以进入下一关
     */
    canAdvanceToNext() {
        const level = this.getCurrentLevel();
        return level && level.completed && this.currentLevelIndex < this.levels.length - 1;
    }

    /**
     * 进入下一关
     */
    nextLevel() {
        if (this.canAdvanceToNext()) {
            this.currentLevelIndex++;
            const newLevel = this.getCurrentLevel();
            if (newLevel && newLevel.setup && this.vfs) {
                newLevel.setup(this.vfs);
            }
            return true;
        }
        return false;
    }

    /**
     * 检查命令执行后的进度
     */
    checkProgress(command, result) {
        const level = this.getCurrentLevel();
        if (!level) return;

        // 先检查单个任务完成情况
        this.checkTaskCompletion(command, level, result);
        
        // 然后检查关卡是否完成
        if (level.checkSuccess()) {
            this.completeLevel();
        }
    }

    /**
     * 检查任务完成情况
     */
    checkTaskCompletion(command, level, result) {
        const cmd = command.toLowerCase().trim();
        
        // 根据不同关卡检查任务完成
        switch (level.level) {
            case 1: // 导航关卡
                if (cmd.startsWith('dir') && result && result.type !== 'error' && !this.completedTasks.has('nav_1')) {
                    this.markTaskCompleted('nav_1', level);
                }
                if (cmd.startsWith('cd documents') && !this.completedTasks.has('nav_2')) {
                    this.markTaskCompleted('nav_2', level);
                }
                break;
                
            case 2: // 创建目录
                if (cmd.startsWith('mkdir my_folder') && !this.completedTasks.has('mkdir_1')) {
                    this.markTaskCompleted('mkdir_1', level);
                }
                if (cmd.startsWith('dir') && this.completedTasks.has('mkdir_1') && !this.completedTasks.has('mkdir_2')) {
                    this.markTaskCompleted('mkdir_2', level);
                }
                break;
                
            case 3: // 文件复制
                if (cmd.startsWith('dir') && cmd.includes('source') && !this.completedTasks.has('copy_1')) {
                    this.markTaskCompleted('copy_1', level);
                }
                if (cmd.startsWith('copy') && cmd.includes('test.txt') && result && result.type !== 'error' && !this.completedTasks.has('copy_2')) {
                    this.markTaskCompleted('copy_2', level);
                }
                if (cmd.startsWith('dir') && cmd.includes('target') && this.completedTasks.has('copy_2') && !this.completedTasks.has('copy_3')) {
                    this.markTaskCompleted('copy_3', level);
                }
                break;
                
            case 4: // 文件删除
                if (cmd.startsWith('dir') && !this.completedTasks.has('del_1')) {
                    this.markTaskCompleted('del_1', level);
                }
                if (cmd.startsWith('del delete_me.txt') && !this.completedTasks.has('del_2')) {
                    this.markTaskCompleted('del_2', level);
                }
                if (cmd.startsWith('dir') && this.completedTasks.has('del_2') && !this.completedTasks.has('del_3')) {
                    this.markTaskCompleted('del_3', level);
                }
                break;
                
            case 5: // 文件查看
                if (cmd.startsWith('type readme.txt') && !this.completedTasks.has('type_1')) {
                    this.markTaskCompleted('type_1', level);
                }
                if (cmd.startsWith('type config.txt') && !this.completedTasks.has('type_2')) {
                    this.markTaskCompleted('type_2', level);
                }
                break;
                
            case 6: // 文件移动
                if (cmd.startsWith('dir') && !this.completedTasks.has('move_1')) {
                    this.markTaskCompleted('move_1', level);
                }
                if (cmd.startsWith('move') && cmd.includes('source.txt') && cmd.includes('moved.txt') && !this.completedTasks.has('move_2')) {
                    this.markTaskCompleted('move_2', level);
                }
                if (cmd.startsWith('dir') && this.completedTasks.has('move_2') && !this.completedTasks.has('move_3')) {
                    this.markTaskCompleted('move_3', level);
                }
                break;
                
            case 7: // 命令行参数
                if (cmd.startsWith('dir') && !this.completedTasks.has('args_1')) {
                    this.markTaskCompleted('args_1', level);
                }
                if ((cmd.startsWith('del /q /f readonly.txt') || cmd.startsWith('del /f /q readonly.txt')) && !this.completedTasks.has('args_2')) {
                    this.markTaskCompleted('args_2', level);
                }
                if (cmd.startsWith('dir') && this.completedTasks.has('args_2') && !this.completedTasks.has('args_3')) {
                    this.markTaskCompleted('args_3', level);
                }
                break;
                
            case 8: // 文件重命名
                if (cmd.startsWith('dir') && !this.completedTasks.has('rename_1')) {
                    this.markTaskCompleted('rename_1', level);
                }
                if (cmd.startsWith('ren') && cmd.includes('old_name.txt') && cmd.includes('new_name.txt') && !this.completedTasks.has('rename_2')) {
                    this.markTaskCompleted('rename_2', level);
                }
                if (cmd.startsWith('dir') && this.completedTasks.has('rename_2') && !this.completedTasks.has('rename_3')) {
                    this.markTaskCompleted('rename_3', level);
                }
                break;
                
            case 9: // 目录删除
                if (cmd.startsWith('dir') && !this.completedTasks.has('rmdir_1')) {
                    this.markTaskCompleted('rmdir_1', level);
                }
                if (cmd.startsWith('rmdir empty_folder') && !this.completedTasks.has('rmdir_2')) {
                    this.markTaskCompleted('rmdir_2', level);
                }
                if ((cmd.startsWith('rmdir /s full_folder') || cmd.startsWith('rmdir /S full_folder')) && !this.completedTasks.has('rmdir_3')) {
                    this.markTaskCompleted('rmdir_3', level);
                }
                break;
                
            case 10: // 网络测试
                if (cmd.startsWith('ping localhost') && !this.completedTasks.has('ping_1')) {
                    this.markTaskCompleted('ping_1', level);
                }
                if ((cmd.startsWith('ping -n') || cmd.startsWith('ping /n')) && cmd.includes('localhost') && !this.completedTasks.has('ping_2')) {
                    this.markTaskCompleted('ping_2', level);
                }
                break;
                
            case 11: // 进程列表
                if (cmd.startsWith('tasklist') && !this.completedTasks.has('tasklist_1')) {
                    this.markTaskCompleted('tasklist_1', level);
                }
                if (cmd.startsWith('tasklist') && this.completedTasks.has('tasklist_1') && !this.completedTasks.has('tasklist_2')) {
                    this.markTaskCompleted('tasklist_2', level);
                }
                break;
                
            case 12: // 进程终止
                if (cmd.startsWith('tasklist') && !this.completedTasks.has('taskkill_1')) {
                    this.markTaskCompleted('taskkill_1', level);
                }
                if (cmd.startsWith('taskkill') && !this.completedTasks.has('taskkill_2')) {
                    // 只有当命令成功执行时才标记任务完成
                    if (result && result.success && !result.error) {
                        this.markTaskCompleted('taskkill_2', level);
                    }
                }
                break;
                
            case 13: // 通配符操作
                // 任务1：使用 dir *.txt 显示所有txt文件
                if (cmd.startsWith('dir') && cmd.includes('*.txt') && !this.completedTasks.has('wildcard_1')) {
                    // 检查命令执行结果
                    if (result && result.type === 'output' && result.output) {
                        // 验证是否正确显示了txt文件（至少包含data1.txt, data2.txt, data3.txt, readme.txt）
                        const output = result.output.toLowerCase();
                        if (output.includes('.txt') && 
                            (output.includes('data1.txt') || output.includes('data2.txt') || 
                             output.includes('data3.txt') || output.includes('readme.txt'))) {
                            // 确保当前目录是wildcard_test
                            const currentPath = this.vfs.getCurrentPath();
                            if (currentPath.includes('wildcard_test')) {
                                this.markTaskCompleted('wildcard_1', level);
                            }
                        }
                    }
                }
                // 任务2：使用 del *.bak 删除所有bak文件
                if (cmd.startsWith('del') && cmd.includes('*.bak') && !this.completedTasks.has('wildcard_2')) {
                    // 检查命令执行结果
                    if (result && result.type === 'output') {
                        // 验证删除操作是否成功（检查输出中是否包含删除信息）
                        const output = result.output.toLowerCase();
                        if (output.includes('删除') || output.includes('已删除') || 
                            output.includes('deleted') || output.includes('个文件')) {
                            // 确保当前目录是wildcard_test
                            const currentPath = this.vfs.getCurrentPath();
                            if (currentPath.includes('wildcard_test')) {
                                this.markTaskCompleted('wildcard_2', level);
                            }
                        }
                    }
                }
                break;
                
            case 14: // 高级文本搜索
                // 检查第一个任务：在file1.txt中搜索error
                if (cmd.startsWith('findstr') && cmd.includes('error') && cmd.includes('file1.txt') && !this.completedTasks.has('search_1')) {
                    // 验证命令执行结果
                    if (result && result.type === 'output' && result.output && 
                        result.output.includes('error') && result.output.includes('file1.txt')) {
                        this.markTaskCompleted('search_1', level);
                    }
                }
                // 检查第二个任务：在所有文件中搜索error并显示行号
                if (cmd.startsWith('findstr') && cmd.includes('/n') && cmd.includes('error') && 
                    (cmd.includes('*.*') || cmd.includes('*.txt')) && !this.completedTasks.has('search_2')) {
                    // 验证命令执行结果包含行号和搜索结果
                    if (result && result.type === 'output' && result.output && 
                        result.output.includes(':') && result.output.includes('error')) {
                        this.markTaskCompleted('search_2', level);
                    }
                }
                break;
                
            case 15: // 文件查找
                // 任务1：使用where命令查找*.js文件
                if (cmd.startsWith('where') && cmd.includes('*.js') && !this.completedTasks.has('filesearch_1')) {
                    // 检查命令执行结果
                    if (result && result.type === 'output' && result.output) {
                        // 验证是否找到了.js文件（main.js或utils.js）
                        if (result.output.includes('.js') && 
                            (result.output.includes('main.js') || result.output.includes('utils.js'))) {
                            this.markTaskCompleted('filesearch_1', level);
                        }
                    }
                }
                // 任务2：使用dir /s命令递归查找*.ini文件
                if (cmd.startsWith('dir') && cmd.includes('/s') && cmd.includes('*.ini') && !this.completedTasks.has('filesearch_2')) {
                    // 检查命令执行结果
                    if (result && result.type === 'output' && result.output) {
                        // 验证是否找到了.ini文件（config.ini）
                        if (result.output.includes('.ini') && result.output.includes('config.ini')) {
                            this.markTaskCompleted('filesearch_2', level);
                        }
                    }
                }
                break;
        }
    }

    /**
     * 标记任务完成
     */
    markTaskCompleted(taskId, level) {
        this.completedTasks.add(taskId);
        
        // 更新任务状态
        const task = level.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = true;
            this.gameManager.updateTaskList(level.tasks);
            this.gameManager.addToTerminal(`✓ 任务完成: ${task.text}`, 'task-complete');
        }
    }

    /**
     * 完成关卡
     */
    completeLevel() {
        const level = this.getCurrentLevel();
        if (!level) return;

        // 计算关卡用时
        const timeSpent = Math.floor((Date.now() - this.levelStartTime) / 1000);
        
        // 显示完成消息
        this.gameManager.showLevelComplete({
            level: level.level,
            completionMessage: level.completionMessage,
            score: level.score,
            timeSpent: timeSpent
        });

        // 进入下一关
        this.currentLevelIndex++;
        
        // 检查是否完成所有关卡
        if (this.currentLevelIndex >= this.levels.length) {
            this.completeGame();
        } else {
            // 延迟设置下一关
            setTimeout(() => {
                this.setupCurrentLevel();
            }, 3000);
        }
    }

    /**
     * 完成游戏
     */
    completeGame() {
        const totalScore = this.gameManager.getScore();
        const gameTime = Math.floor((Date.now() - this.gameManager.gameStartTime) / 1000);
        
        this.gameManager.addHTMLToTerminal(`
            <div class="game-complete">
                <h2>🎉 恭喜通关！</h2>
                <p>你已经完成了所有 ${this.levels.length} 个关卡！</p>
                <p>总分数: ${totalScore}</p>
                <p>总用时: ${Math.floor(gameTime / 60)}分${gameTime % 60}秒</p>
                <p>你已经成为Windows命令行高手！</p>
            </div>
        `, 'game-complete');
        
        // 生成通关码
        this.generateCompletionCode(totalScore, gameTime);
    }

    /**
     * 生成通关码
     */
    generateCompletionCode(score, time) {
        const studentInfo = this.gameManager.currentUser;
        const timestamp = Date.now();
        const data = `${studentInfo}_${score}_${time}_${timestamp}`;
        
        // 简单的编码（实际应用中应使用更安全的方法）
        const encoded = btoa(data);
        
        this.gameManager.addHTMLToTerminal(`
            <div class="completion-code">
                <h3>通关码</h3>
                <p class="code">${encoded}</p>
                <p>请将此通关码发送给老师以验证你的学习成果。</p>
            </div>
        `, 'completion-code');
    }

    /**
     * 重置到指定关卡
     */
    resetToLevel(levelNumber) {
        this.currentLevelIndex = Math.max(0, levelNumber - 1);
        this.setupCurrentLevel();
    }

    /**
     * 获取提示
     */
    getHints() {
        const level = this.getCurrentLevel();
        return level ? level.hints : [];
    }

    // 关卡设置方法
    setupNavigationLevel() {
        // 确保在正确的起始目录
        this.vfs.changeDirectory('C:\\Users\\Student');
    }

    checkNavigationLevel() {
        return this.vfs.getCurrentPath() === 'C:\\Users\\Student\\Documents';
    }

    setupDirectoryCreationLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        // 创建一个测试目录以确保环境正确
        this.vfs.createDirectory('test_dir');
    }

    checkDirectoryCreationLevel() {
        // 检查目录是否存在
        const result = this.vfs.getNode('C:\\Users\\Student\\Documents\\my_folder');
        const directoryExists = result && result.type === 'directory';
        
        // 检查所有任务是否完成
        const allTasksCompleted = this.completedTasks.has('mkdir_1') && this.completedTasks.has('mkdir_2');
        
        // 只有当目录存在且所有任务都完成时才算通关
        return directoryExists && allTasksCompleted;
    }

    setupFileCopyLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createDirectory('source');
        this.vfs.createDirectory('target');
        this.vfs.createFile('source\\test.txt', 'Hello, this is a test file!');
    }

    checkFileCopyLevel() {
        // 检查所有任务是否都完成
        const allTasksCompleted = this.completedTasks.has('copy_1') && 
                                  this.completedTasks.has('copy_2') && 
                                  this.completedTasks.has('copy_3');
        
        // 同时检查文件是否确实存在
        const result = this.vfs.readFile('target\\test.txt');
        
        return allTasksCompleted && result.success;
    }

    setupFileDeletionLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createFile('delete_me.txt', 'This is a file to be deleted.');
    }

    checkFileDeletionLevel() {
        // 检查所有任务是否都完成
        const allTasksCompleted = this.completedTasks.has('del_1') && 
                                  this.completedTasks.has('del_2') && 
                                  this.completedTasks.has('del_3');
        
        // 同时检查文件是否确实被删除
        const result = this.vfs.readFile('delete_me.txt');
        
        return allTasksCompleted && !result.success;
    }

    setupFileViewLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createFile('readme.txt', 'Welcome to the Windows Command Line Game!\nThis is a learning tool for command line operations.');
        this.vfs.createFile('config.txt', 'Configuration File\n================\nVersion: 1.0\nAuthor: Game System');
    }

    checkFileViewLevel() {
        // 检查是否执行了type命令查看两个文件
        return this.completedTasks.has('type_1') && this.completedTasks.has('type_2');
    }

    setupFileMoveLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createFile('source.txt', 'This file needs to be moved and renamed.');
    }

    checkFileMoveLevel() {
        // 检查所有任务是否都完成
        const allTasksCompleted = this.completedTasks.has('move_1') && 
                                  this.completedTasks.has('move_2') && 
                                  this.completedTasks.has('move_3');
        const sourceExists = this.vfs.readFile('source.txt').success;
        const targetExists = this.vfs.readFile('moved.txt').success;
        return !sourceExists && targetExists && allTasksCompleted;
    }

    // 第7关：命令行参数
    setupCommandArgsLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createFile('readonly.txt', 'This is a read-only file that needs special deletion.');
        // 模拟只读属性（在实际实现中可能需要特殊处理）
    }

    checkCommandArgsLevel() {
        const fileExists = this.vfs.readFile('readonly.txt').success;
        return !fileExists;
    }

    setupRmdirLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createDirectory('empty_folder');
        this.vfs.createDirectory('full_folder');
        this.vfs.createFile('full_folder\\file1.txt', 'File in directory');
        this.vfs.createFile('full_folder\\file2.txt', 'Another file');
    }

    checkRmdirLevel() {
        // 检查所有任务是否完成
        const allTasksCompleted = this.completedTasks.has('rmdir_1') && 
                                 this.completedTasks.has('rmdir_2') && 
                                 this.completedTasks.has('rmdir_3');
        
        // 检查目录是否被删除
        const emptyResult = this.vfs.getNode('C:\\Users\\Student\\Documents\\empty_folder');
        const fullResult = this.vfs.getNode('C:\\Users\\Student\\Documents\\full_folder');
        const directoriesDeleted = !emptyResult && !fullResult;
        
        return allTasksCompleted && directoriesDeleted;
    }

    setupRenameLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createFile('old_name.txt', 'This file will be renamed.');
    }

    checkRenameLevel() {
        return this.completedTasks.has('rename_1') && 
               this.completedTasks.has('rename_2') && 
               this.completedTasks.has('rename_3');
    }

    setupPingLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student');
        // 网络测试不需要特殊的文件系统设置
    }

    checkPingLevel() {
        return this.completedTasks.has('ping_1') && this.completedTasks.has('ping_2');
    }

    setupFindLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createFile('file1.txt', 'This is a normal file.');
        this.vfs.createFile('important.txt', 'This is an important document.');
        this.vfs.createFile('data.txt', 'Some data content here.');
        this.vfs.createFile('notes.txt', 'Important notes for the project.');
    }

    checkFindLevel() {
        return this.completedTasks.has('find_1') && this.completedTasks.has('find_2');
    }

    setupFinalLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        // 创建一些文件用于最终测试
        this.vfs.createFile('project_file.txt', 'Project documentation');
        this.vfs.createFile('temp_data.tmp', 'Temporary data');
        this.vfs.createFile('config.ini', 'Configuration settings');
    }

    checkFinalLevel() {
        // 检查是否完成了所有最终任务
        return this.completedTasks.has('final_1') && 
               this.completedTasks.has('final_2') && 
               this.completedTasks.has('final_3');
    }

    // 第11关：进程列表
    setupProcessListLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        // 模拟一些进程信息
        this.vfs.createFile('process_info.txt', 'Use tasklist command to view running processes');
    }

    checkProcessListLevel() {
        return this.completedTasks.has('tasklist_1') && this.completedTasks.has('tasklist_2');
    }

    // 第12关：进程终止
    setupProcessKillLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createFile('kill_info.txt', 'Use taskkill command to terminate processes');
    }

    checkProcessKillLevel() {
        return this.completedTasks.has('taskkill_1') && this.completedTasks.has('taskkill_2');
    }

    // 第13关：通配符操作
    setupWildcardLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createDirectory('wildcard_test');
        this.vfs.createFile('wildcard_test\\data1.txt', 'Data file 1');
        this.vfs.createFile('wildcard_test\\data2.txt', 'Data file 2');
        this.vfs.createFile('wildcard_test\\data3.txt', 'Data file 3');
        this.vfs.createFile('wildcard_test\\backup1.bak', 'Backup file 1');
        this.vfs.createFile('wildcard_test\\backup2.bak', 'Backup file 2');
        this.vfs.createFile('wildcard_test\\temp.tmp', 'Temporary file');
        this.vfs.createFile('wildcard_test\\readme.txt', 'Read me file');
        this.vfs.createDirectory('wildcard_test');
    }

    checkWildcardLevel() {
        return this.completedTasks.has('wildcard_1') && this.completedTasks.has('wildcard_2');
    }

    // 第14关：高级文本搜索
    setupAdvancedSearchLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createDirectory('search_test');
        this.vfs.createFile('wildcard_test\\backup-13-1.bak', 'Backup file 1');
        this.vfs.createFile('wildcard_test\\backup-13-2.bak', 'Backup file 2');
        this.vfs.createFile('search_test\\file1.txt', 'This file contains the word error in line 1\nNormal text in line 2\nAnother error message here');
        this.vfs.createFile('search_test\\file2.txt', 'Regular content\nNo special words here\nJust normal text');
        this.vfs.createFile('search_test\\log.txt', 'System log file\nerror: Connection failed\nWARNING: Low memory\nerror: Disk full');
        this.vfs.changeDirectory('search_test');
    }

    checkAdvancedSearchLevel() {
        return this.completedTasks.has('search_1') && this.completedTasks.has('search_2');
    }

    // 第15关：文件查找
    setupFileSearchLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        this.vfs.createDirectory('project');
        this.vfs.createDirectory('project\\src');
        this.vfs.createDirectory('project\\docs');
        this.vfs.createFile('project\\src\\main.js', 'Main JavaScript file');
        this.vfs.createFile('project\\src\\utils.js', 'Utility functions');
        this.vfs.createFile('project\\docs\\readme.txt', 'Project documentation');
        this.vfs.createFile('project\\config.ini', 'Configuration file');
        // 切换到project目录，让用户从正确位置开始
        this.vfs.changeDirectory('project');
    }

    checkFileSearchLevel() {
        return this.completedTasks.has('filesearch_1') && this.completedTasks.has('filesearch_2');
    }

    // 第16关：密码生成
    setupPasswordLevel() {
        this.vfs.changeDirectory('C:\\Users\\Student\\Documents');
        // 重置学生信息和任务状态
        this.studentInfo.studentId = null;
        this.studentInfo.name = null;
        this.completedTasks.delete('password_1');
        this.completedTasks.delete('password_2');
    }

    checkPasswordLevel() {
        return this.completedTasks.has('password_1') && this.completedTasks.has('password_2');
    }

    /**
     * 将Unicode字符串转换为UTF-8字节序列
     * @param {string} str - 要转换的字符串
     * @returns {number[]} - UTF-8字节数组
     */
    stringToUtf8Bytes(str) {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code < 0x80) {
                // ASCII字符 (0-127)
                bytes.push(code);
            } else if (code < 0x800) {
                // 2字节UTF-8序列 (128-2047)
                bytes.push(0xC0 | (code >> 6));
                bytes.push(0x80 | (code & 0x3F));
            } else if (code < 0xD800 || code >= 0xE000) {
                // 3字节UTF-8序列 (2048-65535，排除代理对)
                bytes.push(0xE0 | (code >> 12));
                bytes.push(0x80 | ((code >> 6) & 0x3F));
                bytes.push(0x80 | (code & 0x3F));
            } else {
                // 代理对处理 (UTF-16高代理 + 低代理 -> 4字节UTF-8)
                if (i + 1 < str.length) {
                    const high = code;
                    const low = str.charCodeAt(++i);
                    const codePoint = 0x10000 + ((high & 0x3FF) << 10) + (low & 0x3FF);
                    bytes.push(0xF0 | (codePoint >> 18));
                    bytes.push(0x80 | ((codePoint >> 12) & 0x3F));
                    bytes.push(0x80 | ((codePoint >> 6) & 0x3F));
                    bytes.push(0x80 | (codePoint & 0x3F));
                } else {
                    // 无效的代理对，使用替换字符
                    bytes.push(0xEF, 0xBF, 0xBD);
                }
            }
        }
        return bytes;
    }

    /**
     * 简化的XOR加密算法（支持UTF-8）
     * @param {string} text - 要加密的文本
     * @param {string} key - 加密密钥
     * @returns {string} - 加密后的十六进制字符串
     */
    xorEncrypt(text, key) {
        // 将字符串转换为UTF-8字节序列
        const textBytes = this.stringToUtf8Bytes(text);
        const keyBytes = this.stringToUtf8Bytes(key);
        
        let result = '';
        for (let i = 0; i < textBytes.length; i++) {
            const textByte = textBytes[i];
            const keyByte = keyBytes[i % keyBytes.length];
            const encrypted = textByte ^ keyByte;
            result += encrypted.toString(16).padStart(2, '0');
        }
        return result;
    }

    /**
     * 将十六进制字符串转换为字节数组
     * @param {string} hexStr - 十六进制字符串
     * @returns {number[]} - 字节数组
     */
    hexToBytes(hexStr) {
        const bytes = [];
        for (let i = 0; i < hexStr.length; i += 2) {
            bytes.push(parseInt(hexStr.substr(i, 2), 16));
        }
        return bytes;
    }

    /**
     * 简化的Base64编码（兼容性实现）
     * @param {string} str - 要编码的字符串（十六进制格式）
     * @returns {string} - Base64编码结果
     */
    base64Encode(str) {
        // 将十六进制字符串转换为字节数组
        const bytes = this.hexToBytes(str);
        
        // 自定义Base64编码实现
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        
        while (i < bytes.length) {
            const a = bytes[i++];
            const b = i < bytes.length ? bytes[i++] : 0;
            const c = i < bytes.length ? bytes[i++] : 0;
            
            const bitmap = (a << 16) | (b << 8) | c;
            
            result += chars.charAt((bitmap >> 18) & 63);
            result += chars.charAt((bitmap >> 12) & 63);
            result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
            result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : '=';
        }
        
        return result;
    }

    /**
     * 生成加密密码
     * @param {string} studentId - 学号
     * @param {string} name - 姓名
     * @param {number} score - 分数
     * @param {number} time - 游戏时间
     * @param {number} timestamp - 时间戳
     * @returns {string} - 加密后的密码
     */
    generateEncryptedPassword(studentId, name, score, time, timestamp) {
        const data = `${studentId}_${name}_${score}_${time}_${timestamp}`;
        const key = 'oop2025';
        
        // 使用XOR加密
        const encrypted = this.xorEncrypt(data, key);
        
        // 使用Base64编码
        const encoded = this.base64Encode(encrypted);
        
        return encoded;
    }


}