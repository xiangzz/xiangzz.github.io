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
  });
})();