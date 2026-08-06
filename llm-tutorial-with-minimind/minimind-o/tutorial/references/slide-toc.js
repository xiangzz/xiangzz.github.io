// slide-toc.js — 幻灯片目录侧边栏 + 全局章节导航
// 自动从 .slide 中的 h1/h2/h3 标题生成目录，支持桌面端侧边栏和移动端抽屉模式
// 同时加载全局章节导航（右上角按钮）
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // 仅在存在演示主区域时启用
    if (!document.querySelector('#presentation')) return;

    // 加载全局章节导航
    loadGlobalNav();

    buildSlideTOC();

    // ========== 全局章节导航 ==========
    function loadGlobalNav() {
      // 计算 nav.html 的路径（与 slide-toc.js 同目录）
      var scriptEl = document.querySelector('script[src*="slide-toc"]');
      var navPath = './references/nav.html';
      if (scriptEl) {
        var src = scriptEl.getAttribute('src');
        // 如果 src 是绝对路径或包含目录，据此推断 nav.html 位置
        var lastSlash = src.lastIndexOf('/');
        if (lastSlash >= 0) {
          navPath = src.substring(0, lastSlash + 1) + 'nav.html';
        }
      }

      fetch(navPath)
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

          if (toggle) {
            toggle.addEventListener('click', function(e) { e.stopPropagation(); open(); });
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
          highlightCurrentChapter();
        })
        .catch(function(err) {
          console.warn('全局导航加载失败:', err);
        });
    }

    function highlightCurrentChapter() {
      var links = document.querySelectorAll('.nav-group-links a');
      var currentPath = window.location.pathname;
      links.forEach(function(link) {
        var href = link.getAttribute('href');
        if (!href) return;
        // 简单匹配：当前路径以 href 结尾
        if (currentPath.indexOf(href.replace('./', '')) !== -1) {
          link.classList.add('current');
        }
      });
    }

    function buildSlideTOC() {
      var slides = document.querySelectorAll('.slide');
      if (!slides || !slides.length) return;

      function isMobile() {
        return window.innerWidth <= 640;
      }

      // 遮罩层（移动端）
      var overlay = document.createElement('div');
      overlay.className = 'slide-toc-overlay';
      document.body.appendChild(overlay);

      // 切换按钮
      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'slide-toc-toggle';
      toggleBtn.innerHTML = '☰';
      toggleBtn.setAttribute('aria-label', '切换目录');
      document.body.appendChild(toggleBtn);

      // 侧边栏
      var toc = document.createElement('aside');
      toc.className = 'slide-toc';

      var header = document.createElement('div');
      header.className = 'slide-toc-header';
      var title = document.title || '目录';
      header.innerHTML = '<div class="slide-toc-title">' + title + '</div>' +
                        '<button class="slide-toc-close" aria-label="关闭/收起目录">&lt;</button>';
      toc.appendChild(header);

      var list = document.createElement('div');
      list.className = 'slide-toc-list';

      slides.forEach(function(slide, i) {
        var heading = slide.querySelector('h2, h1, h3');
        var text = heading ? heading.textContent.trim() : ('第 ' + (i + 1) + ' 页');
        // 安全截断：超过 14 字时截为 10 字 + …，保持目录侧边栏可扫读
        var displayText = text.length > 14 ? text.slice(0, 10) + '…' : text;
        var item = document.createElement('a');
        item.className = 'slide-toc-item';
        item.setAttribute('href', '#');
        item.setAttribute('data-slide-index', i);
        if (text !== displayText) item.setAttribute('title', text);
        item.innerHTML = '<span class="slide-toc-number">' + (i + 1) + '</span>' +
                         '<span class="slide-toc-text">' + displayText + '</span>';
        item.addEventListener('click', function(e) {
          e.preventDefault();
          if (window.Presentation && typeof window.Presentation.showSlide === 'function') {
            window.Presentation.showSlide(i);
          } else {
            // fallback: 无 slide-nav.js 时自行切换幻灯片
            slides.forEach(function(s){ s.classList.remove('active'); });
            slides[i].classList.add('active');
            try { slides[i].scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
            // 更新页码和进度条（与 slide-nav.js 的 updateControls 保持一致）
            var counter = document.getElementById('slide-counter');
            if (counter) counter.textContent = (i + 1) + ' / ' + slides.length;
            var bar = document.getElementById('progress-bar');
            if (bar) bar.style.width = ((i + 1) / slides.length * 100) + '%';
            // 更新上一页/下一页按钮状态
            var prevBtn = document.getElementById('prevBtn') || document.getElementById('prev-btn');
            var nextBtn = document.getElementById('nextBtn') || document.getElementById('next-btn');
            if (prevBtn) prevBtn.disabled = i === 0;
            if (nextBtn) nextBtn.disabled = i === slides.length - 1;
            // 派发事件
            document.dispatchEvent(new CustomEvent('slidechange', {
              detail: { index: i, total: slides.length }
            }));
            updateTOCHighlight(i);
          }
          if (isMobile()) { closeMobileTOC(); }
        });
        list.appendChild(item);
      });

      toc.appendChild(list);
      document.body.appendChild(toc);

      injectSlideTOCStyles();

      // 初始高亮
      var activeIndex = Array.prototype.findIndex.call(slides, function(s){
        return s.classList.contains('active');
      });
      updateTOCHighlight(activeIndex >= 0 ? activeIndex : 0);

      // 监听幻灯片切换事件
      document.addEventListener('slidechange', function(e) {
        if (!e || !e.detail) return;
        updateTOCHighlight(e.detail.index);
      });

      function openMobileTOC() {
        toc.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      function closeMobileTOC() {
        toc.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }

      function toggleDesktopTOC() {
        document.body.classList.toggle('toc-closed');
        try {
          localStorage.setItem('toc-closed', document.body.classList.contains('toc-closed'));
        } catch(e) {}
      }

      // 恢复上次状态
      try {
        if (localStorage.getItem('toc-closed') === 'true' && !isMobile()) {
          document.body.classList.add('toc-closed');
        }
      } catch(e) {}

      // 事件绑定
      toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (isMobile()) {
          if (toc.classList.contains('active')) closeMobileTOC();
          else openMobileTOC();
        } else {
          toggleDesktopTOC();
        }
      });

      var closeBtn = toc.querySelector('.slide-toc-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (isMobile()) { closeMobileTOC(); }
          else { toggleDesktopTOC(); }
        });
      }

      overlay.addEventListener('click', function(e) {
        e.stopPropagation();
        closeMobileTOC();
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          if (isMobile() && toc.classList.contains('active')) {
            closeMobileTOC();
          }
        }
      });

      window.addEventListener('resize', function() {
        if (!isMobile()) { closeMobileTOC(); }
      });

      function updateTOCHighlight(idx) {
        var items = toc.querySelectorAll('.slide-toc-item');
        items.forEach(function(el){ el.classList.remove('active'); });
        var target = toc.querySelector('.slide-toc-item[data-slide-index="' + idx + '"]');
        if (target) {
          target.classList.add('active');
          if (isMobile()) {
            setTimeout(function() {
              target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }
        }
      }
    }

    function injectSlideTOCStyles() {
      var style = document.createElement('style');
      style.textContent = `
        .slide-toc { position: fixed; top: 0; left: 0; right: auto; bottom: 6px; width: 320px; background: rgba(255,255,255,0.96); border-right: 1px solid var(--border-color); box-shadow: 2px 0 10px rgba(0,0,0,0.06); z-index: 1000; display: flex; flex-direction: column; transform: translateX(0); transition: transform 0.3s ease; }
        body.toc-closed .slide-toc { transform: translateX(-100%); }
        .slide-toc-toggle { position: fixed; top: 12px; left: 12px; z-index: 1001; background: var(--primary-color); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 14px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; }
        @media (min-width: 641px) { body:not(.toc-closed) .slide-toc-toggle { display: none; } }
        .slide-toc-header { padding: 12px 16px; border-bottom: 1px solid var(--border-color); color: var(--heading-color); font-weight: 700; display: flex; align-items: center; justify-content: space-between; }
        .slide-toc-title { font-size: 16px; }
        .slide-toc-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-color); padding: 4px; display: block; }
        .slide-toc-list { overflow-y: auto; padding: 8px 0; -webkit-overflow-scrolling: touch; }
        .slide-toc-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; color: var(--text-color); text-decoration: none; transition: background-color .2s ease, color .2s ease; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .slide-toc-item:hover { background-color: #F3F4F6; }
        .slide-toc-item:active { background-color: #E5E7EB; }
        .slide-toc-item.active { background-color: #EFE7E1; color: var(--accent-color); font-weight: 700; }
        .slide-toc-number { min-width: 28px; height: 28px; line-height: 28px; border-radius: 14px; background-color: var(--border-color); color: var(--heading-color); text-align: center; font-size: 12px; }
        .slide-toc-item.active .slide-toc-number { background-color: var(--primary-color); color: #fff; }
        .slide-toc-text { flex: 1; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .slide { transition: padding-left 0.3s ease; }
        @media (min-width: 1200px) { .slide { padding-left: 420px; } body.toc-closed .slide { padding-left: 100px; } .controls { left: 320px; } body.toc-closed .controls { left: 0; } .progress-bar-container { left: 320px; } body.toc-closed .progress-bar-container { left: 0; } }
        @media (max-width: 1200px) and (min-width: 900px) { .slide-toc { width: 260px; } .slide { padding-left: 280px; } body.toc-closed .slide { padding-left: 60px; } .controls { left: 260px; } body.toc-closed .controls { left: 0; } .progress-bar-container { left: 260px; } body.toc-closed .progress-bar-container { left: 0; } }
        @media (max-width: 900px) and (min-width: 641px) { .slide-toc { width: 220px; opacity: 0.96; } .slide { padding-left: 240px; } body.toc-closed .slide { padding-left: 40px; } .controls { left: 220px; } body.toc-closed .controls { left: 0; } .progress-bar-container { left: 220px; } body.toc-closed .progress-bar-container { left: 0; } }
        @media (max-width: 768px) and (min-width: 641px) { .slide-toc { width: 200px; } .slide-toc-header { padding: 10px 12px; } .slide-toc-title { font-size: 15px; } .slide-toc-item { padding: 8px 12px; gap: 10px; } .slide-toc-number { min-width: 24px; height: 24px; line-height: 24px; font-size: 11px; } .slide-toc-text { font-size: 13px; } .slide { padding-left: 220px; } body.toc-closed .slide { padding-left: 20px; } .controls { left: 200px; } body.toc-closed .controls { left: 0; } .progress-bar-container { left: 200px; } body.toc-closed .progress-bar-container { left: 0; } }
        @media (max-width: 640px) { .slide-toc { width: 85vw; max-width: 320px; top: 0; bottom: 0; transform: translateX(-100%); } .slide-toc.active { transform: translateX(0); } .slide-toc-toggle { display: flex; align-items: center; justify-content: center; } .slide-toc-close { display: block; } .slide-toc-header { padding: 8px 12px; } .slide-toc-title { font-size: 14px; } .slide-toc-item { padding: 12px 12px; gap: 12px; } .slide { padding-left: 0 !important; } .controls { left: 0 !important; } .progress-bar-container { left: 0 !important; } }
        @media (max-width: 480px) { .slide-toc { width: 90vw; max-width: 280px; } .slide-toc-toggle { width: 32px; height: 32px; font-size: 12px; top: 8px; left: 8px; } .slide-toc-header { padding: 6px 10px; } .slide-toc-title { font-size: 13px; } .slide-toc-item { padding: 10px 10px; gap: 10px; } .slide-toc-number { min-width: 26px; height: 26px; line-height: 26px; font-size: 11px; } .slide-toc-text { font-size: 13px; } }
        .slide-toc-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 999; }
        .slide-toc-overlay.active { display: block; }
        @media (max-width: 640px) { .slide-toc-overlay { display: none; } .slide-toc-overlay.active { display: block; } }
        .progress-bar-container { z-index: 1100; }
      `;
      document.head.appendChild(style);
    }
  });
})();
