// chapter-nav.js — 章节间导航
// 在页面右上角注入目录按钮，点击弹出课程全章节导航面板
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    fetch('./nav.html')
      .then(function(res) { return res.text(); })
      .then(function(html) {
        var container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        var toggle = document.querySelector('.chapter-nav-toggle');
        var overlay = document.querySelector('.chapter-nav-overlay');
        var closeBtn = document.querySelector('.chapter-nav-close');

        function open() {
          if (overlay) overlay.removeAttribute('hidden');
        }
        function close() {
          if (overlay) overlay.setAttribute('hidden', '');
        }

        if (toggle) {
          toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            open();
          });
        }
        if (closeBtn) {
          closeBtn.addEventListener('click', close);
        }
        if (overlay) {
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) close();
          });
        }

        // 高亮当前章节
        var currentPath = window.location.pathname.split('/').pop();
        if (currentPath) {
          var links = document.querySelectorAll('.chapter-group-links a');
          links.forEach(function(link) {
            var href = link.getAttribute('href');
            if (href && href.endsWith(currentPath)) {
              link.classList.add('current');
            }
          });
        }

        // ESC 关闭
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && overlay && !overlay.hasAttribute('hidden')) {
            close();
          }
        });
      })
      .catch(function(err) {
        console.error('章节导航加载失败:', err);
      });
  });
})();
