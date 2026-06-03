// nav.js — 全局章节导航
// 加载 nav.html，提供右上角章节目录弹窗
(function() {
  document.addEventListener('DOMContentLoaded', function() {

    fetch('./nav.html')
      .then(function(res) { return res.text(); })
      .then(function(html) {
        var container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        var toggle = document.querySelector('.global-nav-toggle');
        var overlay = document.querySelector('.global-nav-overlay');
        var closeBtn = document.querySelector('.global-nav-close');

        function open() { if (overlay) overlay.removeAttribute('hidden'); }
        function close() { if (overlay) overlay.setAttribute('hidden', ''); }

        if (toggle) toggle.addEventListener('click', function(e){ e.stopPropagation(); open(); });
        if (closeBtn) closeBtn.addEventListener('click', close);
        if (overlay) overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });

        // 将 toggle 按钮移到右上角
        if (toggle) {
          toggle.style.position = 'fixed';
          toggle.style.top = '12px';
          toggle.style.right = '12px';
          toggle.style.left = 'auto';
          toggle.style.zIndex = '10001';
          toggle.style.background = 'white';
          toggle.style.color = 'var(--primary-color)';
          toggle.style.border = '1px solid var(--primary-color)';
          toggle.style.borderRadius = '50%';
          toggle.style.width = '36px';
          toggle.style.height = '36px';
          toggle.style.padding = '0';
          toggle.style.fontSize = '14px';
          toggle.style.display = 'flex';
          toggle.style.alignItems = 'center';
          toggle.style.justifyContent = 'center';
          toggle.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
        }
      })
      .catch(function(err) { console.error('导航加载失败:', err); });
  });
})();
