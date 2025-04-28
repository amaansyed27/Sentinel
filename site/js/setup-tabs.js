document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.setup-tab');
    const tabContents = document.querySelectorAll('.setup-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show corresponding tab content
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-setup`).classList.add('active');
            
            // Scroll to top of the tab content with smooth animation
            document.querySelector('.setup-content').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
    
    // For step images, add click to enlarge functionality
    const setupImages = document.querySelectorAll('.setup-image');
    
    setupImages.forEach(img => {
        img.addEventListener('click', () => {
            // Create lightbox
            const lightbox = document.createElement('div');
            lightbox.classList.add('lightbox');
            
            // Create enlarged image
            const enlargedImg = document.createElement('img');
            enlargedImg.src = img.src;
            enlargedImg.alt = img.alt;
            enlargedImg.classList.add('lightbox-img');
            
            // Create close button
            const closeBtn = document.createElement('div');
            closeBtn.classList.add('lightbox-close');
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            
            // Append to document
            lightbox.appendChild(enlargedImg);
            lightbox.appendChild(closeBtn);
            document.body.appendChild(lightbox);
            
            // Add active class to show the lightbox with animation
            setTimeout(() => {
                lightbox.classList.add('active');
            }, 10);
            
            // Add close functionality
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox || e.target === closeBtn || e.target.closest('.lightbox-close')) {
                    lightbox.classList.remove('active');
                    setTimeout(() => {
                        document.body.removeChild(lightbox);
                    }, 300);
                }
            });
        });
        
        // Add cursor pointer to indicate it's clickable
        img.style.cursor = 'pointer';
    });
});
