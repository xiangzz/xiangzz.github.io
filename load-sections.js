/**
 * 动态加载页面模块的JavaScript工具
 * 用于实现内容模块化和代码复用
 */

class SectionLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
    }

    /**
     * 加载指定模块到容器中
     * @param {string} containerId - 容器元素ID
     * @param {string} modulePath - 模块文件路径
     * @returns {Promise<void>}
     */
    async loadSection(containerId, modulePath) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }

        // 显示加载状态
        container.innerHTML = '<div class="loading"><span class="loading-spinner"></span>加载中...</div>';

        try {
            // 检查缓存
            if (this.cache.has(modulePath)) {
                container.innerHTML = this.cache.get(modulePath);
                return;
            }

            // 检查是否正在加载
            if (this.loadingPromises.has(modulePath)) {
                await this.loadingPromises.get(modulePath);
                container.innerHTML = this.cache.get(modulePath);
                return;
            }

            // 开始加载
            const loadPromise = this.fetchModule(modulePath);
            this.loadingPromises.set(modulePath, loadPromise);

            const content = await loadPromise;
            this.cache.set(modulePath, content);
            container.innerHTML = content;
            
            // 重新初始化代码高亮
            if (window.Prism) {
                Prism.highlightAllUnder(container);
            }

        } catch (error) {
            console.error(`Failed to load module "${modulePath}":`, error);
            container.innerHTML = '<div class="error">加载失败，请刷新页面重试</div>';
        } finally {
            this.loadingPromises.delete(modulePath);
        }
    }

    /**
     * 获取模块内容
     * @param {string} modulePath 
     * @returns {Promise<string>}
     */
    async fetchModule(modulePath) {
        const response = await fetch(modulePath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.text();
    }

    /**
     * 预加载模块到缓存
     * @param {string} modulePath 
     * @returns {Promise<void>}
     */
    async preloadModule(modulePath) {
        if (!this.cache.has(modulePath)) {
            const content = await this.fetchModule(modulePath);
            this.cache.set(modulePath, content);
        }
    }
}

// 创建全局实例
window.sectionLoader = new SectionLoader();

// 辅助函数，简化调用
window.loadSection = (containerId, modulePath) => {
    return window.sectionLoader.loadSection(containerId, modulePath);
};

// 当DOM加载完成后自动加载指定模块
document.addEventListener('DOMContentLoaded', () => {
    // 查找需要动态加载的容器
    const containers = document.querySelectorAll('[data-module]');
    containers.forEach(container => {
        const modulePath = container.getAttribute('data-module');
        if (modulePath) {
            window.loadSection(container.id, modulePath);
        }
    });
});