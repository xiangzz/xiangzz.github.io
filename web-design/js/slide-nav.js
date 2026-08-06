// slide-nav.js — 幻灯片导航控制
// 提供上一页/下一页切换、键盘翻页、进度条、对外 API
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const slideCounter = document.getElementById('slide-counter');
    const progressBar = document.getElementById('progress-bar');

    if (!slides.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        if (slides[index]) {
            slides[index].classList.add('active');
            currentSlide = index;
            updateControls();
            try { slides[index].scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}
            document.dispatchEvent(new CustomEvent('slidechange', {
                detail: { index: currentSlide, total: totalSlides }
            }));
        }
    }

    function updateControls() {
        if (slideCounter) {
            slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;
        }
        if (progressBar) {
            const progressPercent = ((currentSlide + 1) / totalSlides) * 100;
            progressBar.style.width = `${progressPercent}%`;
        }
        if (prevBtn) prevBtn.disabled = currentSlide === 0;
        if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
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
        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            showNextSlide();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            showPrevSlide();
        }
    });

    // 触摸滑动翻页（移动端最自然的翻页方式）
    // 忽略在可滚动区域内的纵向滚动，仅在横向滑动明显时翻页
    let touchStartX = 0;
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].screenX;
        const endY = e.changedTouches[0].screenY;
        const dx = touchStartX - endX;   // 横向位移
        const dy = touchStartY - endY;   // 纵向位移
        // 只有横向滑动占主导、且超过阈值时才翻页，避免误触
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) showNextSlide();   // 左滑 → 下一页
            else showPrevSlide();          // 右滑 → 上一页
        }
    }, { passive: true });

    // 初始化：显示第一张幻灯片
    const initialActive = Array.prototype.findIndex.call(slides, s => s.classList.contains('active'));
    showSlide(initialActive >= 0 ? initialActive : 0);

    // 对外 API
    window.Presentation = {
        showSlide: showSlide,
        showNext: showNextSlide,
        showPrev: showPrevSlide,
        getState: function() {
            return { currentSlide: currentSlide, totalSlides: totalSlides };
        }
    };
});
