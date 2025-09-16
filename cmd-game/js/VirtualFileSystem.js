/**
 * 虚拟文件系统类
 * 模拟Windows文件系统结构和操作
 */
class VirtualFileSystem {
    constructor() {
        this.currentPath = 'C:\\Users\\Student';
        this.fileSystem = this.initializeFileSystem();
        this.commandHistory = [];
    }

    /**
     * 初始化文件系统结构
     */
    initializeFileSystem() {
        return {
            'C:': {
                type: 'directory',
                children: {
                    'Users': {
                        type: 'directory',
                        children: {
                            'Student': {
                                type: 'directory',
                                children: {
                                    'Documents': {
                                        type: 'directory',
                                        children: {
                                            'readme.txt': {
                                                type: 'file',
                                                content: '欢迎来到Windows命令行学习游戏！\n这是一个学习文档。',
                                                size: 1024,
                                                date: '2024-01-15 10:30'
                                            },
                                            'notes.txt': {
                                                type: 'file',
                                                content: '学习笔记：\n1. dir - 列出目录内容\n2. cd - 切换目录\n3. type - 显示文件内容',
                                                size: 512,
                                                date: '2024-01-15 11:00'
                                            }
                                        }
                                    },
                                    'Desktop': {
                                        type: 'directory',
                                        children: {
                                            'game.txt': {
                                                type: 'file',
                                                content: '这是桌面上的一个游戏文件。',
                                                size: 256,
                                                date: '2024-01-15 09:15'
                                            }
                                        }
                                    },
                                    'Downloads': {
                                        type: 'directory',
                                        children: {
                                            'setup.exe': {
                                                type: 'file',
                                                content: '[二进制文件]',
                                                size: 2048000,
                                                date: '2024-01-14 16:45'
                                            },
                                            'data.csv': {
                                                type: 'file',
                                                content: 'Name,Age,City\nJohn,25,Beijing\nMary,30,Shanghai\nTom,28,Guangzhou',
                                                size: 1536,
                                                date: '2024-01-15 14:20'
                                            }
                                        }
                                    }
                                }
                            },
                            'Public': {
                                type: 'directory',
                                children: {
                                    'shared.txt': {
                                        type: 'file',
                                        content: '这是一个共享文件。',
                                        size: 128,
                                        date: '2024-01-10 08:00'
                                    }
                                }
                            }
                        }
                    },
                    'Windows': {
                        type: 'directory',
                        children: {
                            'System32': {
                                type: 'directory',
                                children: {
                                    'cmd.exe': {
                                        type: 'file',
                                        content: '[系统文件]',
                                        size: 512000,
                                        date: '2024-01-01 00:00'
                                    },
                                    'notepad.exe': {
                                        type: 'file',
                                        content: '[系统文件]',
                                        size: 256000,
                                        date: '2024-01-01 00:00'
                                    }
                                }
                            }
                        }
                    },
                    'Program Files': {
                        type: 'directory',
                        children: {
                            'Common Files': {
                                type: 'directory',
                                children: {}
                            }
                        }
                    }
                }
            }
        };
    }

    /**
     * 获取当前目录路径
     */
    getCurrentPath() {
        return this.currentPath;
    }

    /**
     * 设置当前目录路径
     */
    setCurrentPath(path) {
        this.currentPath = path;
    }

    /**
     * 解析路径为数组
     */
    parsePath(path) {
        if (path.startsWith('C:\\') || path.startsWith('C:/')) {
            return path.replace(/\\/g, '/').split('/').filter(p => p !== '');
        }
        return this.currentPath.replace(/\\/g, '/').split('/').filter(p => p !== '').concat(
            path.replace(/\\/g, '/').split('/').filter(p => p !== '')
        );
    }

    /**
     * 规范化路径
     */
    normalizePath(pathArray) {
        const normalized = [];
        for (const part of pathArray) {
            if (part === '..') {
                if (normalized.length > 1) { // 保留 'C:'
                    normalized.pop();
                }
            } else if (part !== '.' && part !== '') {
                normalized.push(part);
            }
        }
        return normalized;
    }

    /**
     * 获取指定路径的节点
     */
    getNode(path) {
        const pathArray = this.normalizePath(this.parsePath(path));
        let current = this.fileSystem;
        
        for (let i = 0; i < pathArray.length; i++) {
            const part = pathArray[i];
            
            // 特殊处理根级别（第一次循环）
            if (i === 0) {
                // 对于根对象，直接查找 current[part]
                if (current && current[part]) {
                    current = current[part];
                } else {
                    return null;
                }
            } else {
                // 对于子节点，查找 current.children[part]
                if (current && current.children && current.children[part]) {
                    current = current.children[part];
                } else {
                    return null;
                }
            }
        }
        return current;
    }

    /**
     * 检查路径是否存在
     */
    exists(path) {
        return this.getNode(path) !== null;
    }

    /**
     * 检查路径是否为目录
     */
    isDirectory(path) {
        const node = this.getNode(path);
        return node && node.type === 'directory';
    }

    /**
     * 检查路径是否为文件
     */
    isFile(path) {
        const node = this.getNode(path);
        return node && node.type === 'file';
    }

    /**
     * 列出目录内容
     */
    listDirectory(path = this.currentPath) {
        const node = this.getNode(path);
        if (!node || node.type !== 'directory') {
            return null;
        }

        const items = [];
        if (node.children) {
            for (const [name, child] of Object.entries(node.children)) {
                items.push({
                    name: name,
                    type: child.type,
                    size: child.size || 0,
                    date: child.date || '2024-01-15 12:00'
                });
            }
        }

        // 排序：目录在前，然后按名称排序
        items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        return items;
    }

    /**
     * 切换目录
     */
    changeDirectory(path) {
        if (path === '') {
            return { success: true, path: this.currentPath };
        }

        let targetPath;
        if (path.startsWith('C:\\') || path.startsWith('C:/')) {
            targetPath = path;
        } else {
            const currentArray = this.parsePath(this.currentPath);
            const pathArray = path.replace(/\\/g, '/').split('/').filter(p => p !== '');
            targetPath = this.normalizePath(currentArray.concat(pathArray)).join('\\');
            if (!targetPath.startsWith('C:')) {
                targetPath = 'C:\\' + targetPath;
            }
        }

        if (this.isDirectory(targetPath)) {
            this.currentPath = targetPath;
            return { success: true, path: targetPath };
        } else {
            return { success: false, error: '系统找不到指定的路径。' };
        }
    }

    /**
     * 读取文件内容
     */
    readFile(path) {
        const node = this.getNode(path);
        if (!node) {
            return { success: false, error: '系统找不到指定的文件。' };
        }
        if (node.type !== 'file') {
            return { success: false, error: '拒绝访问。' };
        }
        return { success: true, content: node.content };
    }

    /**
     * 创建目录
     */
    createDirectory(path) {
        const pathArray = this.normalizePath(this.parsePath(path));
        const dirName = pathArray.pop();
        const parentPath = pathArray.join('\\');
        if (!parentPath.startsWith('C:')) {
            parentPath = 'C:\\' + parentPath;
        }

        const parentNode = this.getNode(parentPath);
        if (!parentNode || parentNode.type !== 'directory') {
            return { success: false, error: '系统找不到指定的路径。' };
        }

        if (parentNode.children[dirName]) {
            return { success: false, error: '子目录或文件已经存在。' };
        }

        parentNode.children[dirName] = {
            type: 'directory',
            children: {}
        };

        return { success: true };
    }

    /**
     * 创建文件
     */
    createFile(path, content = '') {
        const pathArray = this.normalizePath(this.parsePath(path));
        const fileName = pathArray.pop();
        const parentPath = pathArray.join('\\');
        if (!parentPath.startsWith('C:')) {
            parentPath = 'C:\\' + parentPath;
        }

        const parentNode = this.getNode(parentPath);
        if (!parentNode || parentNode.type !== 'directory') {
            return { success: false, error: '系统找不到指定的路径。' };
        }

        if (parentNode.children[fileName]) {
            return { success: false, error: '文件已经存在。' };
        }

        parentNode.children[fileName] = {
            type: 'file',
            content: content,
            size: content.length,
            date: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\//g, '-')
        };

        return { success: true };
    }

    /**
     * 删除文件或目录
     */
    delete(path) {
        const pathArray = this.normalizePath(this.parsePath(path));
        const itemName = pathArray.pop();
        const parentPath = pathArray.join('\\');
        if (!parentPath.startsWith('C:')) {
            parentPath = 'C:\\' + parentPath;
        }

        const parentNode = this.getNode(parentPath);
        if (!parentNode || parentNode.type !== 'directory') {
            return { success: false, error: '系统找不到指定的路径。' };
        }

        if (!parentNode.children[itemName]) {
            return { success: false, error: '系统找不到指定的文件。' };
        }

        delete parentNode.children[itemName];
        return { success: true };
    }

    /**
     * 删除目录 - 模拟Windows rmdir命令行为
     * @param {string} path - 要删除的目录路径
     * @param {boolean} recursive - 是否递归删除（/S参数）
     */
    deleteDirectory(path, recursive = false) {
        const pathArray = this.normalizePath(this.parsePath(path));
        const dirName = pathArray.pop();
        const parentPath = pathArray.join('\\');
        if (!parentPath.startsWith('C:')) {
            parentPath = 'C:\\' + parentPath;
        }

        const parentNode = this.getNode(parentPath);
        if (!parentNode || parentNode.type !== 'directory') {
            return { success: false, error: '系统找不到指定的路径。' };
        }

        if (!parentNode.children[dirName]) {
            return { success: false, error: '系统找不到指定的文件。' };
        }

        const targetNode = parentNode.children[dirName];
        if (targetNode.type !== 'directory') {
            return { success: false, error: '目录名无效。' };
        }

        // 检查目录是否为空
        const hasChildren = Object.keys(targetNode.children).length > 0;
        
        if (hasChildren && !recursive) {
            // 目录不为空且没有/S参数，返回错误
            return { success: false, error: '目录不是空的。' };
        }

        // 删除目录
        delete parentNode.children[dirName];
        return { success: true };
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 字节';
        const k = 1024;
        const sizes = ['字节', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取路径的显示名称
     */
    getDisplayPath(path = this.currentPath) {
        return path.replace(/\//g, '\\');
    }

    /**
     * 连接路径
     */
    joinPath(basePath, ...paths) {
        let result = basePath;
        for (const path of paths) {
            if (!result.endsWith('\\') && !result.endsWith('/')) {
                result += '\\';
            }
            result += path;
        }
        return result.replace(/\//g, '\\');
    }

    /**
     * 重置文件系统
     */
    reset() {
        this.currentPath = 'C:\\Users\\Student';
        this.fileSystem = this.initializeFileSystem();
        this.commandHistory = [];
    }

    /**
     * 添加命令到历史记录
     */
    addToHistory(command) {
        this.commandHistory.push(command);
        if (this.commandHistory.length > 100) {
            this.commandHistory.shift();
        }
    }

    /**
     * 获取命令历史
     */
    getHistory() {
        return this.commandHistory;
    }

    /**
     * 搜索文件
     */
    searchFiles(pattern, searchPath = this.currentPath) {
        const results = [];
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
        
        const search = (node, currentPath) => {
            if (node.children) {
                for (const [name, child] of Object.entries(node.children)) {
                    const fullPath = currentPath + '\\' + name;
                    if (regex.test(name)) {
                        results.push({
                            name: name,
                            path: fullPath,
                            type: child.type,
                            size: child.size || 0,
                            date: child.date || '2024-01-15 12:00'
                        });
                    }
                    if (child.type === 'directory') {
                        search(child, fullPath);
                    }
                }
            }
        };

        const startNode = this.getNode(searchPath);
        if (startNode && startNode.type === 'directory') {
            search(startNode, searchPath);
        }

        return results;
    }
}