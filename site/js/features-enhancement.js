document.addEventListener('DOMContentLoaded', function() {
    // Initialize smooth scrolling
    initSmoothScroll();
    
    // Initialize improved scroll spy
    initScrollSpy();
    
    // Initialize back to top button
    initBackToTop();
    
    // Initialize scroll progress
    initScrollProgress();
    
    // Initialize animations on scroll
    initAOS();
    
    // Initialize responsive section navigation
    initResponsiveSectionNav();
    
    // Handle mobile menu
    const mobileMenuToggle = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Toggle icon between bars and X
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-bars')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
    
    function initSmoothScroll() {
        // Get all links that start with #
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Skip if just "#"
                if (href === '#') return;
                
                e.preventDefault();
                
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    // Get header height for offset
                    const headerHeight = document.querySelector('header').offsetHeight;
                    
                    window.scrollTo({
                        top: targetElement.offsetTop - headerHeight - 20,
                        behavior: 'smooth'
                    });
                    
                    // Update active class in navigation
                    const sectionId = href.replace('#', '');
                    updateActiveSectionInNav(sectionId);
                    
                    // For mobile, close menu after clicking
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        const icon = document.querySelector('.mobile-menu i');
                        if (icon && icon.classList.contains('fa-times')) {
                            icon.classList.remove('fa-times');
                            icon.classList.add('fa-bars');
                        }
                    }
                }
            });
        });
    }
    
    function updateActiveSectionInNav(sectionId) {
        const navLinks = document.querySelectorAll('.section-navigator a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });
    }
    
    function initScrollSpy() {
        const sections = [
            { id: "hero", el: document.getElementById("hero") },
            { id: "overview", el: document.getElementById("overview") },
            { id: "security-scoring", el: document.getElementById("security-scoring") },
            { id: "link-markers", el: document.getElementById("link-markers") },
            { id: "ai-chat", el: document.getElementById("ai-chat") },
            { id: "screen-analysis", el: document.getElementById("screen-analysis") },
            { id: "comparison", el: document.getElementById("comparison") },
            { id: "hackathon", el: document.getElementById("hackathon") }
        ].filter(section => section.el); // Filter out any sections that don't exist
        
        const navLinks = document.querySelectorAll('.section-navigator a');
        
        if (!sections.length || !navLinks.length) return;
        
        function updateActiveSection() {
            const scrollPos = window.scrollY;
            const headerHeight = document.querySelector('header')?.offsetHeight || 0;
            const offset = headerHeight + 100; // Increased offset for better highlighting
            
            // Find the current section
            let currentSection = null;
            
            // Special case for the hero section
            if (scrollPos < 300) {
                currentSection = "hero";
            } else {
                // Check each section
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i];
                    const sectionTop = section.el.offsetTop - offset;
                    const nextSection = sections[i + 1];
                    const sectionBottom = nextSection 
                        ? nextSection.el.offsetTop - offset 
                        : document.documentElement.scrollHeight;
                    
                    if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                        currentSection = section.id;
                        break;
                    }
                }
                
                // If we're at the very bottom of the page, highlight the last section
                if (!currentSection && window.innerHeight + scrollPos >= document.documentElement.scrollHeight - 50) {
                    currentSection = sections[sections.length - 1].id;
                }
            }
            
            // Update active class
            if (currentSection) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === currentSection) {
                        link.classList.add('active');
                    }
                });
            }
        }
        
        // Add scroll event listener
        window.addEventListener('scroll', updateActiveSection);
        
        // Initial call to set active section on page load
        updateActiveSection();
        
        // Update on window resize to handle position changes
        window.addEventListener('resize', updateActiveSection);
    }
    
    function initBackToTop() {
        const backToTopButton = document.getElementById('backToTop');
        
        if (!backToTopButton) return;
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
        
        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    function initScrollProgress() {
        const progressBar = document.getElementById('scrollProgress');
        
        if (!progressBar) return;
        
        window.addEventListener('scroll', function() {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            
            progressBar.style.width = scrolled + '%';
        });
    }
    
    function initAOS() {
        // Simple AOS implementation
        const animatedElements = document.querySelectorAll('[data-aos]');
        
        if (!animatedElements.length) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }
    
    function initResponsiveSectionNav() {
        const sectionNav = document.getElementById('sectionNav');
        if (!sectionNav) return;
        
        function adjustNavigation() {
            if (window.innerWidth <= 768) {
                // On mobile, move to bottom
                sectionNav.classList.add('bottom-nav');
            } else {
                // On desktop, keep at side
                sectionNav.classList.remove('bottom-nav');
            }
        }
        
        // Run initially and on resize
        adjustNavigation();
        window.addEventListener('resize', adjustNavigation);
    }
});
