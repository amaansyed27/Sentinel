document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Platform selection tabs for Screenpipe
    const platformButtons = document.querySelectorAll('.platform-btn');
    const platformInstructions = document.querySelectorAll('.platform-instructions');
    
    platformButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and instructions
            platformButtons.forEach(btn => btn.classList.remove('active'));
            platformInstructions.forEach(inst => inst.classList.remove('active'));
            
            // Add active class to clicked button and corresponding instructions
            this.classList.add('active');
            const platform = this.dataset.platform;
            document.getElementById(`${platform}-instructions`).classList.add('active');
        });
    });
    
    // Copy buttons functionality
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.dataset.clipboardText;
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    // Visual feedback for copy success
                    const originalIcon = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        this.innerHTML = originalIcon;
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        });
    });
    
    // Scroll progress
    const scrollProgress = document.getElementById('scrollProgress');
    
    window.addEventListener('scroll', function() {
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const progress = (window.pageYOffset / totalHeight) * 100;
        scrollProgress.style.width = progress + '%';
    });
    
    // Download button actions
    const downloadButtons = document.querySelectorAll('#downloadZip, #ctaDownload');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // In a real scenario, this would trigger the actual download
            alert("This is a demo project. In a real implementation, this would download the extension ZIP file.");
        });
    });
});
