/**
 * 命令解析器类
 * 负责解析和执行Windows命令行命令
 */
class CommandParser {
    constructor(vfs, gameManager, levelManager = null) {
        this.vfs = vfs;
        this.gameManager = gameManager;
        this.levelManager = levelManager;
        
        // 进程状态管理
        this.runningProcesses = new Set(['1234']); // 初始运行的进程PID
        
        // 支持的命令映射
        this.commands = {
            'dir': this.cmdDir.bind(this),
            'ls': this.cmdDir.bind(this), // Unix风格别名
            'cd': this.cmdCd.bind(this),
            'type': this.cmdType.bind(this),
            'cat': this.cmdType.bind(this), // Unix风格别名
            'cls': this.cmdCls.bind(this),
            'clear': this.cmdCls.bind(this), // Unix风格别名
            'help': this.cmdHelp.bind(this),
            'mkdir': this.cmdMkdir.bind(this),
            'md': this.cmdMkdir.bind(this), // 短别名
            'rmdir': this.cmdRmdir.bind(this),
            'rd': this.cmdRmdir.bind(this), // 短别名
            'del': this.cmdDel.bind(this),
            'erase': this.cmdDel.bind(this), // 别名
            'copy': this.cmdCopy.bind(this),
            'move': this.cmdMove.bind(this),
            'ren': this.cmdRename.bind(this),
            'rename': this.cmdRename.bind(this),
            'find': this.cmdFind.bind(this),
            'tree': this.cmdTree.bind(this),
            'echo': this.cmdEcho.bind(this),
            'date': this.cmdDate.bind(this),
            'time': this.cmdTime.bind(this),
            'ver': this.cmdVer.bind(this),
            'whoami': this.cmdWhoami.bind(this),
            'pwd': this.cmdPwd.bind(this), // Unix风格
            'ping': this.cmdPing.bind(this),
            'tasklist': this.cmdTasklist.bind(this),
            'taskkill': this.cmdTaskkill.bind(this),
            'where': this.cmdWhere.bind(this),
            'findstr': this.cmdFindstr.bind(this),
            'setinfo': this.cmdSetinfo.bind(this),
            'genpass': this.cmdGenpass.bind(this),
            'exit': this.cmdExit.bind(this),
            'quit': this.cmdExit.bind(this)
        };
        
        // 命令帮助信息
        this.helpInfo = {
            'dir': '显示目录中的文件和子目录列表',
            'cd': '显示当前目录名或改变当前目录',
            'type': '显示文本文件的内容',
            'cls': '清除屏幕',
            'help': '提供 Windows 命令的帮助信息',
            'mkdir': '创建目录',
            'rmdir': '删除目录',
            'del': '删除一个或数个文件',
            'copy': '将一份或多份文件复制到另一个位置',
            'move': '移动文件并重命名文件和目录',
            'ren': '重命名文件',
            'find': '在文件中搜索字符串',
            'tree': '以图形显示驱动器或路径的文件夹结构',
            'echo': '显示消息，或将命令回显功能打开或关上',
            'date': '显示或设置日期',
            'time': '显示或设置系统时间',
            'ver': '显示 Windows 的版本',
            'whoami': '显示当前用户名',
            'ping': '测试网络连接',
            'tasklist': '显示当前运行的进程列表',
            'taskkill': '终止指定的进程',
            'where': '查找可执行文件的位置',
            'findstr': '在文件中搜索字符串',
            'setinfo': '设置学生信息（学号和姓名）',
            'genpass': '生成加密密码',
            'exit': '退出命令解释器'
        };
    }

    /**
     * 解析并执行命令
     */
    parseAndExecute(commandLine) {
        const trimmed = commandLine.trim();
        if (!trimmed) {
            return { output: '', type: 'output' };
        }

        // 解析命令和参数
        const parts = this.parseCommandLine(trimmed);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        // 检查命令是否存在
        if (this.commands[command]) {
            try {
                return this.commands[command](args);
            } catch (error) {
                return {
                    output: `执行命令时发生错误: ${error.message}`,
                    type: 'error'
                };
            }
        } else {
            return {
                output: `'${command}' 不是内部或外部命令，也不是可运行的程序或批处理文件。`,
                type: 'error'
            };
        }
    }

    /**
     * 解析命令行，处理引号和空格
     */
    parseCommandLine(commandLine) {
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < commandLine.length; i++) {
            const char = commandLine[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            parts.push(current);
        }
        
        return parts;
    }

    /**
     * DIR 命令 - 显示目录内容
     */
    cmdDir(args) {
        let path = this.vfs.getCurrentPath();
        let showAll = false;
        let recursive = false;
        let pattern = '';
        
        // 解析参数
        for (const arg of args) {
            if (arg.startsWith('/') || arg.startsWith('-')) {
                if (arg.toLowerCase().includes('a')) {
                    showAll = true;
                }
                if (arg.toLowerCase().includes('s')) {
                    recursive = true;
                }
            } else if (!pattern) {
                // 检查是否包含通配符
                if (arg.includes('*') || arg.includes('?')) {
                    pattern = arg;
                } else {
                    path = arg;
                }
            }
        }

        if (recursive && pattern) {
            return this.dirRecursiveWithPattern(path, pattern);
        } else if (pattern) {
            return this.dirWithPattern(path, pattern);
        } else if (recursive) {
            return this.dirRecursive(path);
        } else {
            return this.dirNormal(path, showAll);
        }
    }

    dirNormal(path, showAll) {
        const items = this.vfs.listDirectory(path);
        if (!items) {
            return {
                output: '系统找不到指定的路径。',
                type: 'error'
            };
        }

        let output = `\n ${this.vfs.getDisplayPath()} 的目录\n\n`;
        
        let totalFiles = 0;
        let totalDirs = 0;
        let totalSize = 0;

        for (const item of items) {
            const date = item.date || '2024-01-15 12:00';
            const size = item.type === 'directory' ? '<DIR>' : this.vfs.formatFileSize(item.size);
            
            output += `${date.padEnd(20)} ${size.padStart(15)} ${item.name}\n`;
            
            if (item.type === 'directory') {
                totalDirs++;
            } else {
                totalFiles++;
                totalSize += item.size;
            }
        }

        output += `\n               ${totalFiles} 个文件 ${this.vfs.formatFileSize(totalSize)}\n`;
        output += `               ${totalDirs} 个目录\n`;

        return {
            output: output,
            type: 'output',
            score: 5
        };
    }

    dirWithPattern(path, pattern) {
        const items = this.vfs.listDirectory(path);
        if (!items) {
            return {
                output: '系统找不到指定的路径。',
                type: 'error'
            };
        }

        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp('^' + regexPattern + '$', 'i');

        let output = `\n ${this.vfs.getDisplayPath()} 的目录\n\n`;
        
        let totalFiles = 0;
        let totalDirs = 0;
        let totalSize = 0;

        for (const item of items) {
            if (regex.test(item.name)) {
                const date = item.date || '2024-01-15 12:00';
                const size = item.type === 'directory' ? '<DIR>' : this.vfs.formatFileSize(item.size);
                
                output += `${date.padEnd(20)} ${size.padStart(15)} ${item.name}\n`;
                
                if (item.type === 'directory') {
                    totalDirs++;
                } else {
                    totalFiles++;
                    totalSize += item.size;
                }
            }
        }

        if (totalFiles === 0 && totalDirs === 0) {
            return {
                output: '找不到文件',
                type: 'error'
            };
        }

        output += `\n               ${totalFiles} 个文件 ${this.vfs.formatFileSize(totalSize)}\n`;
        output += `               ${totalDirs} 个目录\n`;

        return {
            output: output,
            type: 'output',
            score: 8
        };
    }

    dirRecursive(startPath) {
        let output = '';
        let totalFiles = 0;
        let totalDirs = 0;
        let totalSize = 0;

        const processDirectory = (currentPath) => {
            const items = this.vfs.listDirectory(currentPath);
            if (!items) return;

            output += `\n ${this.vfs.getDisplayPath(currentPath)} 的目录\n\n`;

            let localFiles = 0;
            let localDirs = 0;
            let localSize = 0;

            for (const item of items) {
                const date = item.date || '2024-01-15 12:00';
                const size = item.type === 'directory' ? '<DIR>' : this.vfs.formatFileSize(item.size);
                
                output += `${date.padEnd(20)} ${size.padStart(15)} ${item.name}\n`;
                
                if (item.type === 'directory') {
                    localDirs++;
                    totalDirs++;
                } else {
                    localFiles++;
                    totalFiles++;
                    localSize += item.size;
                    totalSize += item.size;
                }
            }

            output += `\n               ${localFiles} 个文件 ${this.vfs.formatFileSize(localSize)}\n`;
            output += `               ${localDirs} 个目录\n`;

            // 递归处理子目录
            for (const item of items) {
                if (item.type === 'directory') {
                    const subPath = this.vfs.joinPath(currentPath, item.name);
                    processDirectory(subPath);
                }
            }
        };

        processDirectory(startPath);

        output += `\n     文件总数:\n`;
        output += `               ${totalFiles} 个文件 ${this.vfs.formatFileSize(totalSize)}\n`;
        output += `               ${totalDirs} 个目录\n`;

        return {
            output: output,
            type: 'output',
            score: 12
        };
    }

    dirRecursiveWithPattern(startPath, pattern) {
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp('^' + regexPattern + '$', 'i');

        let output = '';
        let totalFiles = 0;
        let totalSize = 0;

        const processDirectory = (currentPath) => {
            const items = this.vfs.listDirectory(currentPath);
            if (!items) return;

            let hasMatches = false;
            let localFiles = 0;
            let localSize = 0;

            for (const item of items) {
                if (regex.test(item.name) && item.type !== 'directory') {
                    if (!hasMatches) {
                        output += `\n ${this.vfs.getDisplayPath(currentPath)} 的目录\n\n`;
                        hasMatches = true;
                    }

                    const date = item.date || '2024-01-15 12:00';
                    const size = this.vfs.formatFileSize(item.size);
                    
                    output += `${date.padEnd(20)} ${size.padStart(15)} ${item.name}\n`;
                    
                    localFiles++;
                    totalFiles++;
                    localSize += item.size;
                    totalSize += item.size;
                }
            }

            if (hasMatches) {
                output += `\n               ${localFiles} 个文件 ${this.vfs.formatFileSize(localSize)}\n\n`;
            }

            // 递归处理子目录
            for (const item of items) {
                if (item.type === 'directory') {
                    const subPath = this.vfs.joinPath(currentPath, item.name);
                    processDirectory(subPath);
                }
            }
        };

        processDirectory(startPath);

        if (totalFiles === 0) {
            return {
                output: '找不到文件',
                type: 'error'
            };
        }

        output += `文件总数: `;
        output += `${totalFiles} 个文件 ${this.vfs.formatFileSize(totalSize)}\n`;

        return {
            output: output,
            type: 'output',
            score: 15
        };
    }

    /**
     * CD 命令 - 切换目录
     */
    cmdCd(args) {
        if (args.length === 0) {
            return {
                output: this.vfs.getCurrentPath(),
                type: 'output'
            };
        }

        const result = this.vfs.changeDirectory(args[0]);
        if (result.success) {
            return {
                output: '',
                type: 'output',
                score: 3
            };
        } else {
            return {
                output: result.error,
                type: 'error'
            };
        }
    }

    /**
     * TYPE 命令 - 显示文件内容
     */
    cmdType(args) {
        if (args.length === 0) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        const result = this.vfs.readFile(args[0]);
        if (result.success) {
            return {
                output: result.content,
                type: 'output',
                score: 5
            };
        } else {
            return {
                output: result.error,
                type: 'error'
            };
        }
    }

    /**
     * CLS 命令 - 清屏
     */
    cmdCls(args) {
        this.gameManager.clearTerminal();
        return {
            output: '',
            type: 'output',
            score: 1
        };
    }

    /**
     * HELP 命令 - 显示帮助
     */
    cmdHelp(args) {
        if (args.length === 0) {
            let output = '有关某个命令的详细信息，请键入 HELP 命令名。\n\n';
            output += '可用命令:\n';
            
            const commands = Object.keys(this.helpInfo).sort();
            for (const cmd of commands) {
                output += `${cmd.toUpperCase().padEnd(12)} ${this.helpInfo[cmd]}\n`;
            }
            
            return {
                output: output,
                type: 'info'
            };
        } else {
            const command = args[0].toLowerCase();
            if (this.helpInfo[command]) {
                return {
                    output: `${command.toUpperCase()}: ${this.helpInfo[command]}`,
                    type: 'info'
                };
            } else {
                return {
                    output: `没有找到命令 '${command}' 的帮助信息。`,
                    type: 'error'
                };
            }
        }
    }

    /**
     * MKDIR 命令 - 创建目录
     */
    cmdMkdir(args) {
        if (args.length === 0) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        const result = this.vfs.createDirectory(args[0]);
        if (result.success) {
            return {
                output: '',
                type: 'output',
                score: 8
            };
        } else {
            return {
                output: result.error,
                type: 'error'
            };
        }
    }

    /**
     * RMDIR 命令 - 删除目录
     */
    cmdRmdir(args) {
        if (args.length === 0) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        let recursive = false;
        let targetDir = '';
        
        // 解析参数
        for (const arg of args) {
            if (arg.toLowerCase() === '/s') {
                recursive = true;
            } else if (!targetDir && !arg.startsWith('/')) {
                targetDir = arg;
            }
        }

        if (!targetDir) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        const result = this.vfs.deleteDirectory(targetDir, recursive);
        if (result.success) {
            return {
                output: '',
                type: 'output',
                score: 8
            };
        } else {
            return {
                output: result.error,
                type: 'error'
            };
        }
    }

    /**
     * DEL 命令 - 删除文件
     */
    cmdDel(args) {
        if (args.length === 0) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        let quiet = false;
        let force = false;
        let filename = '';
        
        // 解析参数
        for (const arg of args) {
            if (arg.toLowerCase() === '/q') {
                quiet = true;
            } else if (arg.toLowerCase() === '/f') {
                force = true;
            } else if (!filename && !arg.startsWith('/')) {
                filename = arg;
            }
        }

        if (!filename) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        // 处理通配符删除
        if (filename.includes('*')) {
            const currentPath = this.vfs.getCurrentPath();
            try {
                const files = this.vfs.listDirectory(currentPath);
                const pattern = filename.replace(/\*/g, '.*');
                const regex = new RegExp('^' + pattern + '$', 'i');
                
                let deletedCount = 0;
                let errors = [];
                
                for (const file of files) {
                    if (!file.isDirectory && regex.test(file.name)) {
                        const result = this.vfs.delete(file.name);
                        if (result.success) {
                            deletedCount++;
                        } else if (!quiet) {
                            errors.push(`无法删除 ${file.name}: ${result.error}`);
                        }
                    }
                }
                
                if (deletedCount === 0 && errors.length === 0) {
                    return {
                        output: quiet ? '' : '找不到文件',
                        type: quiet ? 'output' : 'error'
                    };
                }
                
                let output = '';
                if (!quiet && deletedCount > 0) {
                    output = `已删除 ${deletedCount} 个文件`;
                }
                if (errors.length > 0 && !quiet) {
                    output += (output ? '\n' : '') + errors.join('\n');
                }
                
                return {
                    output: output,
                    type: errors.length > 0 ? 'error' : 'output',
                    score: deletedCount * 3
                };
            } catch (error) {
                return {
                    output: quiet ? '' : error.message,
                    type: 'error'
                };
            }
        } else {
            // 单个文件删除
            const result = this.vfs.delete(filename);
            if (result.success) {
                return {
                    output: quiet ? '' : '',
                    type: 'output',
                    score: 6
                };
            } else {
                return {
                    output: quiet ? '' : result.error,
                    type: quiet ? 'output' : 'error'
                };
            }
        }
    }

    /**
     * COPY 命令 - 复制文件
     */
    cmdCopy(args) {
        if (args.length < 2) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        // 简化实现：读取源文件并创建目标文件
        const sourceResult = this.vfs.readFile(args[0]);
        if (!sourceResult.success) {
            return {
                output: sourceResult.error,
                type: 'error'
            };
        }

        const targetResult = this.vfs.createFile(args[1], sourceResult.content);
        if (targetResult.success) {
            return {
                output: '已复制         1 个文件。',
                type: 'output',
                score: 10
            };
        } else {
            return {
                output: targetResult.error,
                type: 'error'
            };
        }
    }

    /**
     * MOVE 命令 - 移动文件
     */
    cmdMove(args) {
        if (args.length < 2) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        // 简化实现：复制然后删除
        const copyResult = this.cmdCopy(args);
        if (copyResult.type === 'error') {
            return copyResult;
        }

        const deleteResult = this.vfs.delete(args[0]);
        if (deleteResult.success) {
            return {
                output: '移动了         1 个文件。',
                type: 'output',
                score: 12
            };
        } else {
            return {
                output: deleteResult.error,
                type: 'error'
            };
        }
    }

    /**
     * REN 命令 - 重命名文件
     */
    cmdRename(args) {
        if (args.length < 2) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        // 简化实现：使用移动命令
        return this.cmdMove(args);
    }

    /**
     * FIND 命令 - 搜索文件
     */
    cmdFind(args) {
        if (args.length === 0) {
            return {
                output: '命令语法不正确。',
                type: 'error'
            };
        }

        const pattern = args[0];
        const results = this.vfs.searchFiles(pattern);
        
        if (results.length === 0) {
            return {
                output: '没有找到匹配的文件。',
                type: 'output'
            };
        }

        let output = `搜索结果 (${results.length} 个匹配项):\n\n`;
        for (const result of results) {
            output += `${result.path}\n`;
        }

        return {
            output: output,
            type: 'output',
            score: 8
        };
    }

    /**
     * TREE 命令 - 显示目录树
     */
    cmdTree(args) {
        const path = args.length > 0 ? args[0] : this.vfs.getCurrentPath();
        const tree = this.generateTree(path);
        
        if (!tree) {
            return {
                output: '系统找不到指定的路径。',
                type: 'error'
            };
        }

        return {
            output: tree,
            type: 'output',
            score: 10
        };
    }

    /**
     * 生成目录树
     */
    generateTree(path, prefix = '', isLast = true) {
        const node = this.vfs.getNode(path);
        if (!node || node.type !== 'directory') {
            return null;
        }

        let result = `${prefix}${isLast ? '└── ' : '├── '}${path.split('\\').pop() || path}\n`;
        
        if (node.children) {
            const children = Object.keys(node.children);
            children.forEach((child, index) => {
                const isLastChild = index === children.length - 1;
                const childPath = path + '\\' + child;
                const childNode = node.children[child];
                
                if (childNode.type === 'directory') {
                    const newPrefix = prefix + (isLast ? '    ' : '│   ');
                    result += this.generateTree(childPath, newPrefix, isLastChild);
                } else {
                    result += `${prefix}${isLast ? '    ' : '│   '}${isLastChild ? '└── ' : '├── '}${child}\n`;
                }
            });
        }

        return result;
    }

    /**
     * ECHO 命令 - 显示消息
     */
    cmdEcho(args) {
        if (args.length === 0) {
            return {
                output: 'ECHO 处于打开状态。',
                type: 'output'
            };
        }

        return {
            output: args.join(' '),
            type: 'output',
            score: 2
        };
    }

    /**
     * DATE 命令 - 显示日期
     */
    cmdDate(args) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
        });

        return {
            output: `当前日期: ${dateStr}`,
            type: 'output'
        };
    }

    /**
     * TIME 命令 - 显示时间
     */
    cmdTime(args) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return {
            output: `当前时间: ${timeStr}`,
            type: 'output'
        };
    }

    /**
     * VER 命令 - 显示版本
     */
    cmdVer(args) {
        return {
            output: 'Microsoft Windows [版本 10.0.19041.1]\nWindows命令行学习游戏 v1.0',
            type: 'output'
        };
    }

    /**
     * WHOAMI 命令 - 显示当前用户
     */
    cmdWhoami(args) {
        return {
            output: 'DESKTOP-GAME\\Student',
            type: 'output'
        };
    }

    /**
     * PWD 命令 - 显示当前目录 (Unix风格)
     */
    cmdPwd(args) {
        return {
            output: this.vfs.getCurrentPath(),
            type: 'output'
        };
    }

    /**
     * PING 命令 - 测试网络连接
     */
    cmdPing(args) {
        if (args.length === 0) {
            return {
                output: '用法: ping [-n count] 目标主机\n\n选项:\n    -n count    要发送的回显请求数。',
                type: 'error'
            };
        }

        let count = 4;
        let target = args[0];
        
        // 处理 -n 参数
        if (args[0] === '-n' && args.length >= 3) {
            count = parseInt(args[1]) || 4;
            target = args[2];
        }

        // 模拟ping输出
        let output = `\n正在 Ping ${target}:\n\n`;
        
        for (let i = 1; i <= count; i++) {
            const time = Math.floor(Math.random() * 10) + 1;
            output += `来自 ${target} 的回复: 字节=32 时间=${time}ms TTL=64\n`;
        }
        
        output += `\n${target} 的 Ping 统计信息:\n`;
        output += `    数据包: 已发送 = ${count}，已接收 = ${count}，丢失 = 0 (0% 丢失)，\n`;
        output += `往返行程的估计时间(以毫秒为单位):\n`;
        output += `    最短 = 1ms，最长 = 10ms，平均 = 5ms`;

        return {
            output: output,
            type: 'output'
        };
    }

    /**
     * TASKLIST 命令 - 显示进程列表
     */
    cmdTasklist(args) {
        let output = '\n映像名称                       PID 会话名              会话#       内存使用\n';
        output += '========================= ======== ================ =========== ============\n';
        
        // 模拟进程列表
        const allProcesses = [
            { name: 'System Idle Process', pid: 0, session: 'Services', sessionId: 0, memory: '24 K' },
            { name: 'System', pid: 4, session: 'Services', sessionId: 0, memory: '228 K' },
            { name: 'smss.exe', pid: 364, session: 'Services', sessionId: 0, memory: '1,084 K' },
            { name: 'csrss.exe', pid: 584, session: 'Services', sessionId: 0, memory: '4,784 K' },
            { name: 'winlogon.exe', pid: 608, session: 'Console', sessionId: 1, memory: '2,652 K' },
            { name: 'services.exe', pid: 652, session: 'Services', sessionId: 0, memory: '3,892 K' },
            { name: 'lsass.exe', pid: 664, session: 'Services', sessionId: 0, memory: '6,744 K' },
            { name: 'svchost.exe', pid: 824, session: 'Services', sessionId: 0, memory: '4,616 K' },
            { name: 'svchost.exe', pid: 892, session: 'Services', sessionId: 0, memory: '3,028 K' },
            { name: 'notepad.exe', pid: 1234, session: 'Console', sessionId: 1, memory: '8,192 K' },
            { name: 'chrome.exe', pid: 5678, session: 'Console', sessionId: 1, memory: '256,000 K' }
        ];

        // 只显示运行中的进程
        const runningProcesses = allProcesses.filter(proc => {
            // 系统进程始终运行
            if (proc.pid < 1000) return true;
            // 检查notepad.exe是否在运行进程列表中
            if (proc.pid === 1234) return this.runningProcesses.has('1234');
            // 其他进程默认运行
            return true;
        });

        runningProcesses.forEach(proc => {
            const name = proc.name.padEnd(25);
            const pid = proc.pid.toString().padStart(8);
            const session = proc.session.padEnd(16);
            const sessionId = proc.sessionId.toString().padStart(11);
            const memory = proc.memory.padStart(12);
            output += `${name} ${pid} ${session} ${sessionId} ${memory}\n`;
        });

        return {
            output: output,
            type: 'output'
        };
    }

    /**
     * TASKKILL 命令 - 终止进程
     */
    cmdTaskkill(args) {
        if (args.length === 0) {
            return {
                output: '错误: 缺少参数/选项。\n\n用法: taskkill [/f] [/pid processid | /im imagename]',
                type: 'error',
                success: false
            };
        }

        let force = false;
        let target = null;
        let targetType = null;

        // 解析参数
        for (let i = 0; i < args.length; i++) {
            if (args[i].toLowerCase() === '/f') {
                force = true;
            } else if (args[i].toLowerCase() === '/pid' && i + 1 < args.length) {
                target = args[i + 1];
                targetType = 'pid';
                i++;
            } else if (args[i].toLowerCase() === '/im' && i + 1 < args.length) {
                target = args[i + 1];
                targetType = 'image';
                i++;
            }
        }

        if (!target) {
            return {
                output: '错误: 缺少进程标识符。\n请使用 /PID 或 /IM 参数指定要终止的进程。',
                type: 'error',
                success: false
            };
        }

        // 模拟终止进程
        let output = '';
        let isSuccess = false;
        
        if (targetType === 'pid') {
            if (target === '1234') {
                if (this.runningProcesses.has('1234')) {
                    this.runningProcesses.delete('1234'); // 从运行进程中移除
                    output = `成功: 已终止 PID 为 ${target} 的进程。`;
                    isSuccess = true;
                } else {
                    output = `错误: 找不到 PID 为 "${target}" 的进程。`;
                    isSuccess = false;
                }
            } else {
                output = `错误: 找不到 PID 为 "${target}" 的进程。`;
                isSuccess = false;
            }
        } else {
            if (target.toLowerCase() === 'notepad.exe' || target.toLowerCase() === 'notepad') {
                if (this.runningProcesses.has('1234')) {
                    this.runningProcesses.delete('1234'); // 从运行进程中移除
                    output = `成功: 已终止进程 "${target}"。`;
                    isSuccess = true;
                } else {
                    output = `错误: 这不是目标进程 "${target}"。`;
                    isSuccess = false;
                }
            } else {
                output = `错误: 这不是目标进程 "${target}"。`;
                isSuccess = false;
            }
        }

        return {
            output: output,
            type: output.startsWith('成功') ? 'output' : 'error',
            success: isSuccess
        };
    }

    /**
     * WHERE 命令 - 查找可执行文件位置
     */
    cmdWhere(args) {
        if (args.length === 0) {
            return {
                output: '用法: where [/r dir] [/q] [/f] pattern...',
                type: 'error'
            };
        }

        let recursive = false;
        let quiet = false;
        let force = false;
        let searchDir = '';
        let patterns = [];

        // 解析参数
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg.toLowerCase() === '/r' && i + 1 < args.length) {
                recursive = true;
                searchDir = args[i + 1];
                i++; // 跳过下一个参数
            } else if (arg.toLowerCase() === '/q') {
                quiet = true;
            } else if (arg.toLowerCase() === '/f') {
                force = true;
            } else if (!arg.startsWith('/')) {
                patterns.push(arg);
            }
        }

        if (patterns.length === 0) {
            return {
                output: '用法: where [/r dir] [/q] [/f] pattern...',
                type: 'error'
            };
        }

        let results = [];

        // 如果指定了递归搜索目录
        if (recursive && searchDir) {
            for (const pattern of patterns) {
                const searchResults = this.searchFilesRecursive(searchDir, pattern);
                results = results.concat(searchResults);
            }
        } else {
            // 搜索系统文件和当前目录
            for (const pattern of patterns) {
                const systemResults = this.searchSystemFiles(pattern);
                const localResults = this.searchLocalFiles(pattern);
                results = results.concat(systemResults, localResults);
            }
        }

        if (results.length === 0) {
            return {
                output: quiet ? '' : `信息: 找不到文件 "${patterns.join(' ')}"。`,
                type: quiet ? 'output' : 'error'
            };
        }

        const output = results.join('\n');
        return {
            output: output,
            type: 'output',
            score: results.length * 2
        };
    }

    searchSystemFiles(pattern) {
        const systemFiles = {
            'notepad.exe': 'C:\\Windows\\System32\\notepad.exe',
            'notepad': 'C:\\Windows\\System32\\notepad.exe',
            'cmd.exe': 'C:\\Windows\\System32\\cmd.exe',
            'cmd': 'C:\\Windows\\System32\\cmd.exe',
            'ping.exe': 'C:\\Windows\\System32\\ping.exe',
            'ping': 'C:\\Windows\\System32\\ping.exe',
            'tasklist.exe': 'C:\\Windows\\System32\\tasklist.exe',
            'tasklist': 'C:\\Windows\\System32\\tasklist.exe',
            'taskkill.exe': 'C:\\Windows\\System32\\taskkill.exe',
            'taskkill': 'C:\\Windows\\System32\\taskkill.exe'
        };

        const results = [];
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp('^' + regexPattern + '$', 'i');

        for (const [filename, path] of Object.entries(systemFiles)) {
            if (regex.test(filename)) {
                results.push(path);
            }
        }

        return results;
    }

    searchLocalFiles(pattern) {
        const results = [];
        const currentPath = this.vfs.getCurrentPath();
        
        try {
            const files = this.vfs.listDirectory(currentPath);
            const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
            const regex = new RegExp('^' + regexPattern + '$', 'i');

            for (const file of files) {
                if (regex.test(file.name)) {
                    const fullPath = this.vfs.joinPath(currentPath, file.name);
                    results.push(fullPath);
                }
            }
        } catch (error) {
            // 忽略错误，继续搜索
        }

        return results;
    }

    searchFilesRecursive(searchDir, pattern) {
        const results = [];
        const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        const regex = new RegExp('^' + regexPattern + '$', 'i');

        const searchInDirectory = (currentPath) => {
            try {
                const files = this.vfs.listDirectory(currentPath);
                
                for (const file of files) {
                    if (regex.test(file.name)) {
                        const fullPath = this.vfs.joinPath(currentPath, file.name);
                        results.push(fullPath);
                    }
                    
                    if (file.type === 'directory') {
                        const subPath = this.vfs.joinPath(currentPath, file.name);
                        searchInDirectory(subPath);
                    }
                }
            } catch (error) {
                // 忽略无法访问的目录
            }
        };

        searchInDirectory(searchDir);
        return results;
    }

    /**
     * FINDSTR 命令 - 在文件中搜索字符串
     */
    cmdFindstr(args) {
        if (args.length === 0) {
            return {
                output: '用法: findstr [/b] [/e] [/l] [/r] [/s] [/i] [/x] [/v] [/n] [/m] [/o] [/p] [/f:file] [/c:string] [/g:file] [/d:dir] strings [[drive:][path]filename[ ...]]',
                type: 'error'
            };
        }

        let showLineNumbers = false;
        let searchString = '';
        let filePattern = '';
        
        // 解析参数
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === '/n') {
                showLineNumbers = true;
            } else if (!searchString && !arg.startsWith('/')) {
                searchString = arg;
            } else if (!filePattern && !arg.startsWith('/')) {
                filePattern = arg;
            }
        }

        if (!searchString) {
            return {
                output: 'FINDSTR: 搜索字符串不能为空',
                type: 'error'
            };
        }

        // 如果没有指定文件模式，默认搜索当前目录的所有文件
        if (!filePattern) {
            filePattern = '*.*';
        }

        let results = [];
        const currentPath = this.vfs.getCurrentPath();
        
        try {
            // 获取匹配的文件
            const files = this.vfs.listDirectory(currentPath);
            const matchingFiles = files.filter(file => {
                if (filePattern === '*.*') return !file.isDirectory;
                if (filePattern === '*.txt') return file.name.endsWith('.txt');
                if (filePattern === '*.log') return file.name.endsWith('.log');
                return file.name.includes(filePattern.replace('*', ''));
            });

            for (const file of matchingFiles) {
                if (!file.isDirectory) {
                    try {
                        const fileResult = this.vfs.readFile(this.vfs.joinPath(currentPath, file.name));
                        if (!fileResult.success) continue;
                        const content = fileResult.content;
                        const lines = content.split('\n');
                        
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].toLowerCase().includes(searchString.toLowerCase())) {
                                if (showLineNumbers) {
                                    results.push(`${file.name}:${i + 1}:${lines[i]}`);
                                } else {
                                    results.push(`${file.name}:${lines[i]}`);
                                }
                            }
                        }
                    } catch (e) {
                        // 忽略无法读取的文件
                    }
                }
            }

            if (results.length === 0) {
                return {
                    output: 'FINDSTR: 找不到搜索字符串',
                    type: 'error'
                };
            }

            return {
                output: results.join('\n'),
                type: 'output'
            };
        } catch (error) {
            return {
                output: `FINDSTR: ${error.message}`,
                type: 'error'
            };
        }
    }

    /**
     * EXIT 命令 - 退出
     */
    cmdExit(args) {
        return {
            output: '感谢使用Windows命令行学习游戏！',
            type: 'info'
        };
    }

    /**
     * SETINFO 命令 - 设置学生信息
     */
    cmdSetinfo(args) {
        if (args.length < 2) {
            return {
                output: '用法: setinfo <学号> <姓名>\n示例: setinfo 2023001 张三',
                type: 'error'
            };
        }

        const studentId = args[0];
        const name = args.slice(1).join(' '); // 支持姓名中有空格

        // 验证学号格式（简单验证）
        if (!/^\d+$/.test(studentId)) {
            return {
                output: '错误: 学号必须是数字',
                type: 'error'
            };
        }

        // 验证姓名格式（简单验证）
        if (name.length < 2 || name.length > 20) {
            return {
                output: '错误: 姓名长度必须在2-20个字符之间',
                type: 'error'
            };
        }

        // 保存学生信息到LevelManager
        if (this.levelManager && this.levelManager.studentInfo) {
            this.levelManager.studentInfo.studentId = studentId;
            this.levelManager.studentInfo.name = name;
            
            // 标记第一个任务完成
            this.levelManager.completedTasks.add('password_1');
            
            return {
                output: `学生信息设置成功:\n学号: ${studentId}\n姓名: ${name}`,
                type: 'success'
            };
        } else {
            return {
                output: '错误: 无法保存学生信息',
                type: 'error'
            };
        }
    }

    /**
     * GENPASS 命令 - 生成加密密码
     */
    cmdGenpass(args) {
        // 检查是否已设置学生信息
        if (!this.levelManager || !this.levelManager.studentInfo || 
            !this.levelManager.studentInfo.studentId || !this.levelManager.studentInfo.name) {
            return {
                output: '错误: 请先使用 setinfo 命令设置学生信息',
                type: 'error'
            };
        }

        try {
            const studentId = this.levelManager.studentInfo.studentId;
            const name = this.levelManager.studentInfo.name;
            const score = this.gameManager ? this.gameManager.score : 0;
            const gameTime = this.gameManager ? this.gameManager.getGameTime() : 0;
            const timestamp = Date.now();

            // 生成加密密码
            const encryptedPassword = this.levelManager.generateEncryptedPassword(
                studentId, name, score, gameTime, timestamp
            );

            // 标记第二个任务完成
            this.levelManager.completedTasks.add('password_2');

            return {
                output: `加密密码生成成功:\n\n密码: ${encryptedPassword}\n\n请将此密码页面发送给老师进行验证。\n老师将使用密钥解锁您的信息。`,
                type: 'success'
            };
        } catch (error) {
            return {
                output: `生成密码时发生错误: ${error.message}`,
                type: 'error'
            };
        }
    }

    /**
     * 获取所有支持的命令
     */
    getSupportedCommands() {
        return Object.keys(this.commands);
    }

    /**
     * 获取命令的帮助信息
     */
    getCommandHelp(command) {
        return this.helpInfo[command.toLowerCase()] || null;
    }
}