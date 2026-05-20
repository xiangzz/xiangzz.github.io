// slide.js — 幻灯片导航控制
// 提供上一页/下一页切换、键盘翻页、进度条、对外 API
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const slideCounter = document.getElementById('slide-counter');
    const progressBar = document.getElementById('progress-bar');

    if (!slides.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    function showSlide(index) {
        if (index < 0 || index >= totalSlides) return;
        slides.forEach(s => s.classList.remove('active'));
        slides[index].classList.add('active');
        currentSlide = index;
        updateControls();
        slides[index].scrollTop = 0;
        document.dispatchEvent(new CustomEvent('slidechange', {
            detail: { index: index, total: totalSlides }
        }));
    }

    function updateControls() {
        if (prevBtn) prevBtn.disabled = currentSlide === 0;
        if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
        if (slideCounter) slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;
        if (progressBar) progressBar.style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;
    }

    function showNextSlide() {
        if (currentSlide < totalSlides - 1) showSlide(currentSlide + 1);
    }

    function showPrevSlide() {
        if (currentSlide > 0) showSlide(currentSlide - 1);
    }

    if (nextBtn) nextBtn.addEventListener('click', showNextSlide);
    if (prevBtn) prevBtn.addEventListener('click', showPrevSlide);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
            e.preventDefault();
            showNextSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            showPrevSlide();
        } else if (e.key === 'Home') {
            e.preventDefault();
            showSlide(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            showSlide(totalSlides - 1);
        }
    });

    // 初始化：显示第一张 .active 幻灯片
    const initialActive = Array.prototype.findIndex.call(slides, s => s.classList.contains('active'));
    showSlide(initialActive >= 0 ? initialActive : 0);

    // === 对外 API ===
    // nav.js 的 TOC 点击通过此 API 切换幻灯片，确保页码和进度条同步更新
    window.Presentation = {
        showSlide: showSlide,
        showNext: showNextSlide,
        showPrev: showPrevSlide,
        getState: function() {
            return { currentSlide: currentSlide, totalSlides: totalSlides };
        }
    };
});
