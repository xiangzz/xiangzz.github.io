// ppt.js
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const slideCounter = document.getElementById('slide-counter');
    const progressBar = document.getElementById('progress-bar');

    let currentSlide = 0;
    const totalSlides = slides.length;

    function showSlide(index) {
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });

        // Show the target slide
        if (slides[index]) {
            slides[index].classList.add('active');
            currentSlide = index;
            updateControls();

            // Smooth scroll slide to top
            try { slides[index].scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) {}

            // Dispatch slide change event
            document.dispatchEvent(new CustomEvent('slidechange', {
                detail: { index: currentSlide, total: totalSlides }
            }));
        }
    }

    function updateControls() {
        // Update counter
        slideCounter.textContent = `${currentSlide + 1} / ${totalSlides}`;

        // Update progress bar
        const progressPercent = ((currentSlide + 1) / totalSlides) * 100;
        progressBar.style.width = `${progressPercent}%`;

        // Update button states
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    function showNextSlide() {
        if (currentSlide < totalSlides - 1) {
            showSlide(currentSlide + 1);
        }
    }

    function showPrevSlide() {
        if (currentSlide > 0) {
            showSlide(currentSlide - 1);
        }
    }

    // Event Listeners
    nextBtn.addEventListener('click', showNextSlide);
    prevBtn.addEventListener('click', showPrevSlide);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ') { // Space also goes to next slide
            showNextSlide();
        } else if (e.key === 'ArrowLeft') {
            showPrevSlide();
        }
    });

    // Initial setup
    showSlide(0);

    // 初始化动画控制
    if (typeof initClassObjectAnimation === 'function') {
        initClassObjectAnimation();
    }
    if (typeof initMemoryModelAnimation === 'function') {
        initMemoryModelAnimation();
    }

    // Expose a lightweight API for external navigation
    window.Presentation = {
        showSlide: showSlide,
        showNext: showNextSlide,
        showPrev: showPrevSlide,
        getState: function() { return { currentSlide: currentSlide, totalSlides: totalSlides }; }
    };
});