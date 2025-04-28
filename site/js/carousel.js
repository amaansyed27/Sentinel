document.addEventListener('DOMContentLoaded', function() {
    // Initialize the implementation notes carousel
    initCarousel();
    
    function initCarousel() {
        const carousel = document.querySelector('.carousel-container');
        if (!carousel) return;
        
        const track = document.querySelector('.carousel-track');
        const slides = Array.from(document.querySelectorAll('.carousel-slide'));
        const nextButton = document.querySelector('.next-btn');
        const prevButton = document.querySelector('.prev-btn');
        const indicators = document.querySelector('.carousel-indicators');
        
        if (!track || !slides.length || !nextButton || !prevButton) return;
        
        let currentIndex = 0;
        const slideWidth = 100; // 100%
        
        // Create indicator buttons
        slides.forEach((_, index) => {
            const button = document.createElement('button');
            button.classList.add('carousel-indicator');
            if (index === 0) button.classList.add('active');
            button.setAttribute('aria-label', `Slide ${index + 1}`);
            button.addEventListener('click', () => {
                goToSlide(index);
            });
            indicators.appendChild(button);
        });
        
        // Set initial position
        updateCarouselPosition();
        
        // Event listeners for buttons
        nextButton.addEventListener('click', () => {
            if (currentIndex === slides.length - 1) {
                goToSlide(0);
            } else {
                goToSlide(currentIndex + 1);
            }
        });
        
        prevButton.addEventListener('click', () => {
            if (currentIndex === 0) {
                goToSlide(slides.length - 1);
            } else {
                goToSlide(currentIndex - 1);
            }
        });
        
        // Auto advance every 5 seconds
        let autoplayInterval = setInterval(() => {
            if (currentIndex === slides.length - 1) {
                goToSlide(0);
            } else {
                goToSlide(currentIndex + 1);
            }
        }, 5000);
        
        // Pause autoplay when hovering over carousel
        carousel.addEventListener('mouseenter', () => {
            clearInterval(autoplayInterval);
        });
        
        carousel.addEventListener('mouseleave', () => {
            autoplayInterval = setInterval(() => {
                if (currentIndex === slides.length - 1) {
                    goToSlide(0);
                } else {
                    goToSlide(currentIndex + 1);
                }
            }, 5000);
        });
        
        function goToSlide(index) {
            currentIndex = index;
            updateCarouselPosition();
            updateIndicators();
        }
        
        function updateCarouselPosition() {
            track.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
        }
        
        function updateIndicators() {
            const indicatorButtons = indicators.querySelectorAll('.carousel-indicator');
            indicatorButtons.forEach((button, index) => {
                if (index === currentIndex) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
        
        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                nextButton.click();
            } else if (e.key === 'ArrowLeft') {
                prevButton.click();
            }
        });
        
        // Touch events for mobile swiping
        let touchStartX = 0;
        let touchEndX = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            handleSwipe();
        });
        
        function handleSwipe() {
            // Minimum swipe distance (pixels)
            const swipeThreshold = 50;
            
            if (touchStartX - touchEndX > swipeThreshold) {
                // Swipe left - next slide
                nextButton.click();
            }
            
            if (touchEndX - touchStartX > swipeThreshold) {
                // Swipe right - previous slide
                prevButton.click();
            }
        }
    }
});
