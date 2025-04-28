document.addEventListener('DOMContentLoaded', function() {
    // Scroll Progress Bar
    const scrollProgress = document.getElementById('scrollProgress');
    
    window.addEventListener('scroll', function() {
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const progress = (window.pageYOffset / totalHeight) * 100;
        scrollProgress.style.width = progress + '%';
    });

    // Back to Top button
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Simulate subtle browser mockup animation
    const browserMockup = document.querySelector('.browser-mockup');
    if (browserMockup) {
        window.addEventListener('mousemove', function(e) {
            // Only if we're on a larger screen
            if (window.innerWidth > 992) {
                const mouseX = e.clientX / window.innerWidth;
                const mouseY = e.clientY / window.innerHeight;
                
                // Small tilt effect based on mouse position
                const tiltX = (mouseY - 0.5) * 5;
                const tiltY = (0.5 - mouseX) * 5;
                
                browserMockup.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            }
        });

        // Reset transform when mouse leaves
        window.addEventListener('mouseleave', function() {
            browserMockup.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(5deg)';
        });
    }

    // Animate hero image subtly on mousemove
    const heroImage = document.querySelector('.hero-image img');
    
    if (heroImage) {
        document.addEventListener('mousemove', function(e) {
            // Only if we're on a larger screen
            if (window.innerWidth > 992) {
                const mouseX = e.clientX / window.innerWidth;
                const mouseY = e.clientY / window.innerHeight;
                
                // Small tilt effect based on mouse position
                const tiltX = (mouseY - 0.5) * 10;
                const tiltY = (0.5 - mouseX) * 10;
                
                heroImage.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            }
        });

        // Reset transform when mouse leaves
        document.addEventListener('mouseleave', function() {
            heroImage.style.transform = 'perspective(1000px) rotateY(-5deg)';
        });
    }

    // Animate particles in security-particles
    const particles = document.querySelectorAll('.security-particles .particle');
    
    if (particles.length > 0) {
        particles.forEach(particle => {
            // Set random initial position
            const randomX = Math.random() * 80 + 10; // 10% to 90%
            const randomY = Math.random() * 80 + 10; // 10% to 90%
            
            particle.style.left = `${randomX}%`;
            particle.style.top = `${randomY}%`;
        });
    }

    // Configure intersection observer for animations
    const observerOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Apply observer to both types of elements that need animations
    const elementsToAnimate = document.querySelectorAll('[data-aos], .feature-card');
    
    elementsToAnimate.forEach(element => {
        observer.observe(element);
    });
});
