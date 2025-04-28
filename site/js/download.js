document.addEventListener('DOMContentLoaded', function() {
    // Platform selection for Screenpipe installation instructions
    const platformButtons = document.querySelectorAll('.platform-btn');
    const platformInstructions = document.querySelectorAll('.platform-instructions');
    
    platformButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            platformButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get selected platform
            const platform = this.getAttribute('data-platform');
            
            // Hide all instruction sections
            platformInstructions.forEach(instruction => {
                instruction.classList.remove('active');
            });
            
            // Show selected platform instructions
            document.getElementById(`${platform}-instructions`).classList.add('active');
        });
    });
    
    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-clipboard-text');
            
            // Create a temporary textarea element to copy text
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';  // Avoid scrolling to bottom
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                // Execute copy command
                document.execCommand('copy');
                
                // Visual feedback
                const originalIcon = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i>';
                
                // Reset icon after 2 seconds
                setTimeout(() => {
                    this.innerHTML = originalIcon;
                }, 2000);
                
            } catch (err) {
                console.error('Unable to copy text: ', err);
            }
            
            document.body.removeChild(textarea);
        });
    });
    
    // Scroll progress indicator
    const scrollProgress = document.getElementById('scrollProgress');
    
    window.addEventListener('scroll', () => {
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const progress = (window.pageYOffset / totalHeight) * 100;
        scrollProgress.style.width = `${progress}%`;
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
