

// API 规范折叠功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有 API 规范为折叠状态
    const apiSpecs = document.querySelectorAll('.api-specification');
    apiSpecs.forEach(spec => {
        // 添加 collapsed 类以默认折叠
        spec.classList.add('collapsed');

        // 将 h4 之后的内容包装到 .spec-content 中
        const h4 = spec.querySelector('h4');
        let nextElement = h4.nextElementSibling;
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'spec-content';

        while (nextElement) {
            const current = nextElement;
            nextElement = current.nextElementSibling;
            contentWrapper.appendChild(current);
        }

        h4.parentNode.appendChild(contentWrapper);

        // 添加点击事件
        h4.addEventListener('click', function() {
            spec.classList.toggle('collapsed');
        });
    });
});