// Injects the shared navigation overlay into pages and wires events
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // Avoid on index page (it may already have its own header/navigation)
    // We rely on developer including this script only where needed.
    fetch('./nav.html')
      .then(function(res) { return res.text(); })
      .then(function(html) {
        var container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        var toggle = document.querySelector('.global-nav-toggle');
        var overlay = document.querySelector('.global-nav-overlay');
        var closeBtn = document.querySelector('.global-nav-close');

        function open() {
          if (overlay) overlay.removeAttribute('hidden');
        }
        function close() {
          if (overlay) overlay.setAttribute('hidden', '');
        }

        if (toggle) {
          toggle.addEventListener('click', function(e){ e.stopPropagation(); open(); });
        }
        if (closeBtn) {
          closeBtn.addEventListener('click', close);
        }
        if (overlay) {
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) close();
          });
        }
      })
      .catch(function(err) {
        console.error('导航加载失败:', err);
      });

    // Build right-side Slide TOC
    try {
      buildSlideTOC();
    } catch (e) {
      console.error('目录生成失败:', e);
    }

    function buildSlideTOC() {
      var slides = document.querySelectorAll('.slide');
      if (!slides || !slides.length) return;

      // Create overlay for mobile
      var overlay = document.createElement('div');
      overlay.className = 'slide-toc-overlay';
      document.body.appendChild(overlay);

      // Create toggle button for mobile
      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'slide-toc-toggle';
      toggleBtn.innerHTML = '☰';
      toggleBtn.setAttribute('aria-label', '切换目录');
      document.body.appendChild(toggleBtn);

      var toc = document.createElement('aside');
      toc.className = 'slide-toc';

      var header = document.createElement('div');
      header.className = 'slide-toc-header';
      var title = document.title || '目录';
      header.innerHTML = '<div class="slide-toc-title">' + title + '</div>' +
                        '<button class="slide-toc-close" aria-label="关闭目录">×</button>';
      toc.appendChild(header);

      var list = document.createElement('div');
      list.className = 'slide-toc-list';

      slides.forEach(function(slide, i) {
        var heading = slide.querySelector('h2, h1, h3');
        var text = heading ? heading.textContent.trim() : ('第 ' + (i + 1) + ' 页');
        var item = document.createElement('a');
        item.className = 'slide-toc-item';
        item.setAttribute('href', '#');
        item.setAttribute('data-slide-index', i);
        item.innerHTML = '<span class="slide-toc-number">' + (i + 1) + '</span>' +
                         '<span class="slide-toc-text">' + text + '</span>';
        item.addEventListener('click', function(e) {
          e.preventDefault();
          if (window.Presentation && typeof window.Presentation.showSlide === 'function') {
            window.Presentation.showSlide(i);
          } else {
            // Fallback: manual active toggling
            slides.forEach(function(s){ s.classList.remove('active'); });
            slides[i].classList.add('active');
            try { slides[i].scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
            updateTOCHighlight(i);
          }
          // Close mobile TOC after selection
          closeMobileTOC();
        });
        list.appendChild(item);
      });

      toc.appendChild(list);
      document.body.appendChild(toc);

      injectSlideTOCStyles();

      // initial highlight
      var activeIndex = Array.prototype.findIndex.call(slides, function(s){ return s.classList.contains('active'); });
      updateTOCHighlight(activeIndex >= 0 ? activeIndex : 0);

      // listen to slidechange
      document.addEventListener('slidechange', function(e) {
        if (!e || !e.detail) return;
        updateTOCHighlight(e.detail.index);
      });

      // Mobile interaction handlers
      function openMobileTOC() {
        if (window.innerWidth <= 640) {
          toc.classList.add('active');
          overlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      }

      function closeMobileTOC() {
        toc.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }

      function toggleMobileTOC() {
        if (toc.classList.contains('active')) {
          closeMobileTOC();
        } else {
          openMobileTOC();
        }
      }

      // Event listeners for mobile interactions
      toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMobileTOC();
      });

      var closeBtn = toc.querySelector('.slide-toc-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          closeMobileTOC();
        });
      }

      overlay.addEventListener('click', function(e) {
        e.stopPropagation();
        closeMobileTOC();
      });

      // Close TOC on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && toc.classList.contains('active')) {
          closeMobileTOC();
        }
      });

      // Handle resize events
      window.addEventListener('resize', function() {
        if (window.innerWidth > 640) {
          closeMobileTOC(); // Close mobile TOC when switching to desktop
        }
      });

      function updateTOCHighlight(idx) {
        var items = toc.querySelectorAll('.slide-toc-item');
        items.forEach(function(el){ el.classList.remove('active'); });
        var target = toc.querySelector('.slide-toc-item[data-slide-index="' + idx + '"]');
        if (target) {
          target.classList.add('active');
          // Auto-scroll to active item on mobile
          if (window.innerWidth <= 640) {
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
        .slide-toc.collapsed { transform: translateX(-100%); }
        .slide-toc-toggle { display: none; position: fixed; top: 12px; left: 12px; z-index: 1001; background: var(--primary-color); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; font-size: 14px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
        .slide-toc-header { padding: 12px 16px; border-bottom: 1px solid var(--border-color); color: var(--heading-color); font-weight: 700; display: flex; align-items: center; justify-content: space-between; }
        .slide-toc-title { font-size: 16px; }
        .slide-toc-close { display: none; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-color); padding: 4px; }
        .slide-toc-list { overflow-y: auto; padding: 8px 0; -webkit-overflow-scrolling: touch; }
        .slide-toc-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; color: var(--text-color); text-decoration: none; transition: background-color .2s ease, color .2s ease; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .slide-toc-item:hover { background-color: #F3F4F6; }
        .slide-toc-item:active { background-color: #E5E7EB; }
        .slide-toc-item.active { background-color: #EFE7E1; color: var(--accent-color); font-weight: 700; }
        .slide-toc-number { min-width: 28px; height: 28px; line-height: 28px; border-radius: 14px; background-color: var(--border-color); color: var(--heading-color); text-align: center; font-size: 12px; }
        .slide-toc-item.active .slide-toc-number { background-color: var(--primary-color); color: #fff; }
        .slide-toc-text { flex: 1; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* 大屏幕适配 */
        @media (min-width: 1200px) { .slide { padding-left: 420px; } }
        @media (max-width: 1200px) { .slide-toc { width: 260px; } }
        @media (max-width: 900px) { .slide-toc { width: 220px; opacity: 0.96; } }

        /* 平板设备适配 */
        @media (max-width: 768px) {
          .slide-toc { width: 280px; }
          .slide-toc-header { padding: 10px 12px; }
          .slide-toc-title { font-size: 15px; }
          .slide-toc-item { padding: 8px 12px; gap: 10px; }
          .slide-toc-number { min-width: 24px; height: 24px; line-height: 24px; font-size: 11px; }
          .slide-toc-text { font-size: 13px; }
        }

        /* 移动设备适配 */
        @media (max-width: 640px) {
          .slide-toc {
            width: 85vw;
            max-width: 320px;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
          }
          .slide-toc.active { transform: translateX(0); }
          .slide-toc-toggle { display: flex; align-items: center; justify-content: center; }
          .slide-toc-close { display: block; }
          .slide-toc-header { padding: 8px 12px; }
          .slide-toc-title { font-size: 14px; }
          .slide-toc-item { padding: 12px 12px; gap: 12px; }
          .slide-toc-number { min-width: 28px; height: 28px; line-height: 28px; font-size: 12px; }
          .slide-toc-text { font-size: 14px; line-height: 1.3; }
          .slide { padding-left: 0 !important; }
        }

        /* 小屏手机适配 */
        @media (max-width: 480px) {
          .slide-toc { width: 90vw; max-width: 280px; }
          .slide-toc-toggle { width: 32px; height: 32px; font-size: 12px; top: 8px; left: 8px; }
          .slide-toc-header { padding: 6px 10px; }
          .slide-toc-title { font-size: 13px; }
          .slide-toc-item { padding: 10px 10px; gap: 10px; }
          .slide-toc-number { min-width: 26px; height: 26px; line-height: 26px; font-size: 11px; }
          .slide-toc-text { font-size: 13px; }
          .global-nav-toggle { right: 8px !important; top: 6px !important; width: 32px !important; height: 32px !important; font-size: 12px !important; background: white !important; color: var(--primary-color) !important; border: 1px solid var(--primary-color) !important; border-radius: 50% !important; cursor: pointer !important; box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        }

        /* Move global nav toggle to the right to avoid overlap with toc */
        .global-nav-toggle { left: auto !important; right: 12px !important; top: 8px !important; width: 36px !important; height: 36px !important; font-size: 14px !important; background: white !important; color: var(--primary-color) !important; border: 1px solid var(--primary-color) !important; border-radius: 50% !important; cursor: pointer !important; box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        /* Ensure progress bar stays above toc */
        .progress-bar-container { z-index: 1100; }

        /* 遮罩层 */
        .slide-toc-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 999;
        }
        .slide-toc-overlay.active { display: block; }

        @media (max-width: 640px) {
          .slide-toc-overlay { display: none; }
          .slide-toc-overlay.active { display: block; }
        }
      `;
      document.head.appendChild(style);
    }
  });
})();