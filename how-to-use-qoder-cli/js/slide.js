function initPresentation() {
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;
    const totalSlides = slides.length;
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const slideCounter = document.getElementById('slide-counter');
    const progressBar = document.getElementById('progress-bar');

    function showSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        slides[index].classList.add('active');
        currentSlide = index;
        updateControls();
        slides[index].scrollTop = 0;
        document.dispatchEvent(new CustomEvent('slidechange', { detail: { index: index } }));
    }

    function updateControls() {
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === totalSlides - 1;
        slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;
        progressBar.style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;
    }

    prevBtn.addEventListener('click', () => {
        if (currentSlide > 0) showSlide(currentSlide - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) showSlide(currentSlide + 1);
    });

    document.addEventListener('slidechange', (e) => {
        if (!e || !e.detail) return;
        const idx = e.detail.index;
        if (idx !== undefined && idx !== currentSlide) {
            slides.forEach(s => s.classList.remove('active'));
            slides[idx].classList.add('active');
            currentSlide = idx;
            updateControls();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
            e.preventDefault();
            if (currentSlide < totalSlides - 1) showSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentSlide > 0) showSlide(currentSlide - 1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            showSlide(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            showSlide(totalSlides - 1);
        }
    });

    showSlide(0);
}

document.addEventListener('DOMContentLoaded', initPresentation);
