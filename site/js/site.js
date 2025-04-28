/**
 * Sentinel MK2 Website JavaScript
 * Handles interactive elements and responsive behavior
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle - improved
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
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenuToggle.contains(event.target) && !navLinks.contains(event.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon && icon.classList.contains('fa-times')) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
    
    // Setup tabs
    const setupTabs = document.querySelectorAll('.setup-tab');
    if (setupTabs.length > 0) {
        setupTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                document.querySelectorAll('.setup-tab').forEach(t => {
                    t.classList.remove('active');
                });
                
                // Remove active class from all content sections
                document.querySelectorAll('.setup-tab-content').forEach(c => {
                    c.classList.remove('active');
                });
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Show related content
                const tabId = this.getAttribute('data-tab');
                const contentElement = document.getElementById(`${tabId}-setup`);
                if (contentElement) {
                    contentElement.classList.add('active');
                }
            });
        });
    }
    
    // Check for hash in URL to activate specific tab
    function checkUrlHash() {
        const hash = window.location.hash;
        if (hash && hash.includes('setup')) {
            const tabId = hash.replace('#', '').replace('-setup', '');
            const tab = document.querySelector(`.setup-tab[data-tab="${tabId}"]`);
            if (tab) {
                tab.click();
            }
        }
    }
    
    // Check hash on load
    checkUrlHash();
    
    // Check hash on hash change
    window.addEventListener('hashchange', checkUrlHash);
    
    // Animate elements when they come into view
    const animateOnScroll = function() {
        const elementsToAnimate = document.querySelectorAll('.feature-card, .workflow-step, .download-card, .setup-step, .installation-step, .note-card');
        
        elementsToAnimate.forEach(element => {
            const elementPosition = element.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // If element is in viewport
            if (elementPosition.top < windowHeight * 0.9) {
                element.classList.add('animated');
            }
        });
    };
    
    // Run animation on scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Initial check for elements in viewport
    animateOnScroll();
    
    // Handle chart animations
    const chartBars = document.querySelectorAll('.chart-bar');
    if (chartBars.length > 0) {
        // Animation for chart bars
        const animateCharts = function() {
            chartBars.forEach(bar => {
                const barPosition = bar.getBoundingClientRect();
                if (barPosition.top < window.innerHeight * 0.9) {
                    bar.classList.add('animated');
                }
            });
        };
        
        window.addEventListener('scroll', animateCharts);
        animateCharts(); // Initial check
    }
    
    // Additional styles for the page
    const addStyles = function() {
        const style = document.createElement('style');
        style.textContent = `
            .animated {
                animation: fadeInUp 0.6s ease forwards;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .chart-bar {
                position: relative;
                height: 30px;
                margin-bottom: 10px;
                background-color: var(--primary);
                color: white;
                border-radius: var(--border-radius-sm);
                padding-left: 10px;
                display: flex;
                align-items: center;
                opacity: 0;
                transform: scaleX(0);
                transform-origin: left;
                transition: transform 1s ease;
            }
            
            .chart-bar.animated {
                opacity: 1;
                transform: scaleX(1);
            }
            
            .chart-bar::before {
                content: attr(data-label);
                position: relative;
                z-index: 1;
            }
            
            .chart-bar::after {
                content: attr(data-value);
                position: absolute;
                right: 10px;
                font-weight: bold;
            }
            
            .setup-tabs {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-bottom: 30px;
            }
            
            .setup-tab {
                padding: 10px 20px;
                background-color: var(--bg-element);
                border: none;
                border-radius: var(--border-radius-md);
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .setup-tab:hover {
                background-color: var(--border-medium);
            }
            
            .setup-tab.active {
                background-color: var(--primary);
                color: white;
            }
            
            .setup-tab-content {
                display: none;
            }
            
            .setup-tab-content.active {
                display: block;
                animation: fadeIn 0.5s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .risk-scores {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .risk-score {
                padding: 15px;
                border-radius: var(--border-radius-md);
                display: flex;
                flex-direction: column;
            }
            
            .risk-score.high {
                background-color: var(--status-safe);
                color: var(--status-safe-text);
            }
            
            .risk-score.medium {
                background-color: var(--status-warning);
                color: var(--status-warning-text);
            }
            
            .risk-score.low {
                background-color: var(--status-danger);
                color: var(--status-danger-text);
            }
            
            .risk-score .score {
                font-weight: bold;
                font-size: 18px;
            }
            
            .risk-score .label {
                font-weight: 500;
                margin-bottom: 5px;
            }
            
            .case-studies-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            
            .case-study {
                background-color: var(--bg-main);
                border-radius: var(--border-radius-md);
                overflow: hidden;
                box-shadow: var(--shadow-md);
            }
            
            .case-study-header {
                background-color: var(--primary);
                color: white;
                padding: 15px;
            }
            
            .case-study-body {
                padding: 15px;
            }
            
            .download-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin: 15px 0;
            }
            
            .setup-image {
                max-width: 100%;
                border-radius: var(--border-radius-md);
                margin: 15px 0;
                box-shadow: var(--shadow-sm);
            }
            
            .analysis-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 30px;
                margin-bottom: 40px;
            }
            
            .analysis-category {
                background-color: var(--bg-main);
                border-radius: var(--border-radius-lg);
                overflow: hidden;
                box-shadow: var(--shadow-md);
                opacity: 0;
                transform: translateY(20px);
            }
            
            .analysis-category.animated {
                opacity: 1;
                transform: translateY(0);
            }
            
            .analysis-category-header {
                padding: 20px;
                background-color: var(--bg-element);
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .analysis-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: var(--primary);
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 24px;
            }
            
            .analysis-category-body {
                padding: 20px;
            }
            
            .analysis-charts {
                margin-bottom: 40px;
            }
            
            .chart-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 30px;
                margin-top: 20px;
            }
            
            @media (min-width: 768px) {
                .analysis-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            
            @media (min-width: 1024px) {
                .analysis-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;
        document.head.appendChild(style);
    };
    
    // Add additional styles
    addStyles();
    
    // Load enhanced header script
    if (document.querySelector('.enhanced-header')) {
        const enhancedHeaderScript = document.createElement('script');
        enhancedHeaderScript.src = 'js/enhanced-header.js';
        document.body.appendChild(enhancedHeaderScript);
    }

    // Load navigation script 
    const navigationScript = document.createElement('script');
    navigationScript.src = 'js/navigation.js';
    document.body.appendChild(navigationScript);
});
