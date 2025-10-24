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

      var toc = document.createElement('aside');
      toc.className = 'slide-toc';

      var header = document.createElement('div');
      header.className = 'slide-toc-header';
      var title = document.title || '目录';
      header.innerHTML = '<div class="slide-toc-title">' + title + '</div>';
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

      function updateTOCHighlight(idx) {
        var items = toc.querySelectorAll('.slide-toc-item');
        items.forEach(function(el){ el.classList.remove('active'); });
        var target = toc.querySelector('.slide-toc-item[data-slide-index="' + idx + '"]');
        if (target) target.classList.add('active');
      }
    }

    function injectSlideTOCStyles() {
      var style = document.createElement('style');
      style.textContent = `
        .slide-toc { position: fixed; top: 0; left: 0; right: auto; bottom: 6px; width: 320px; background: rgba(255,255,255,0.96); border-right: 1px solid var(--border-color); box-shadow: 2px 0 10px rgba(0,0,0,0.06); z-index: 1000; display: flex; flex-direction: column; }
        .slide-toc-header { padding: 12px 16px; border-bottom: 1px solid var(--border-color); color: var(--heading-color); font-weight: 700; }
        .slide-toc-title { font-size: 16px; }
        .slide-toc-list { overflow-y: auto; padding: 8px 0; }
        .slide-toc-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; color: var(--text-color); text-decoration: none; transition: background-color .2s ease, color .2s ease; }
        .slide-toc-item:hover { background-color: #F3F4F6; }
        .slide-toc-item.active { background-color: #EFE7E1; color: var(--accent-color); font-weight: 700; }
        .slide-toc-number { min-width: 28px; height: 28px; line-height: 28px; border-radius: 14px; background-color: var(--border-color); color: var(--heading-color); text-align: center; font-size: 12px; }
        .slide-toc-item.active .slide-toc-number { background-color: var(--primary-color); color: #fff; }
        .slide-toc-text { flex: 1; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        /* Reserve room on large screens to avoid overlap */
        @media (min-width: 1200px) { .slide { padding-left: 420px; } }
        @media (max-width: 1200px) { .slide-toc { width: 260px; } }
        @media (max-width: 900px) { .slide-toc { width: 220px; opacity: 0.96; } }
        /* Move global nav toggle to the right to avoid overlap with toc */
        .global-nav-toggle { left: auto !important; right: 16px !important; }
        /* Ensure progress bar stays above toc */
        .progress-bar-container { z-index: 1100; }
      `;
      document.head.appendChild(style);
    }
  });
})();