document.addEventListener('DOMContentLoaded', function() {
    // Sidebar elements
    const btn = document.querySelector('#btn');
    const sidebar = document.querySelector('.sidebar');
    const searchBtn = document.querySelector('.bx-search');
    const listItems = document.querySelectorAll('.list-item');
    const loader = document.getElementById('loader');
    const imageInput = document.getElementById('image-input');
    const cartoonifyButton = document.getElementById('cartoonify-button');
    const originalImage = document.getElementById('original-image');
    const cartoonImage = document.getElementById('cartoon-image');
    const uploadForm = document.getElementById('upload-form');

    // Sidebar toggle functionality with animation
    btn.onclick = function() {
        sidebar.classList.toggle('active');
        this.classList.toggle('fa-times');
        this.classList.toggle('fa-bars');
    }

    // Search button toggle
    searchBtn.onclick = function() {
        sidebar.classList.toggle('active');
    }

    // Active link highlighting with animation
    function activeLink() {
        listItems.forEach(item => {
            item.classList.remove('active');
            item.querySelector('a').style.transform = 'scale(1)';
        });
        this.classList.add('active');
        this.querySelector('a').style.transform = 'scale(1.05)';
    }

    listItems.forEach(item => {
        item.onclick = activeLink;
        
        // Add hover effects
        item.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active')) {
                this.querySelector('a').style.transform = 'scale(1.05)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.querySelector('a').style.transform = 'scale(1)';
            }
        });
    });

    // Image input handling with preview
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                originalImage.src = event.target.result;
                originalImage.style.display = 'inline-block';
                cartoonImage.style.display = 'none';
                
                // Add animation class
                document.querySelector('.image-wrapper:first-child').classList.add('animate__animated', 'animate__fadeIn');
                setTimeout(() => {
                    document.querySelector('.image-wrapper:first-child').classList.remove('animate__animated', 'animate__fadeIn');
                }, 1000);
            };
            reader.readAsDataURL(file);
        }
    });

    // Form submission with enhanced UI feedback
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (imageInput.files.length === 0) {
            // Shake animation for error feedback
            imageInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                imageInput.style.animation = '';
            }, 500);
            return;
        }

        // Show loading state with animations
        loader.style.display = 'block';
        cartoonifyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing';
        cartoonifyButton.style.background = 'linear-gradient(45deg, #23d5ab, #23a6d5)';
        cartoonifyButton.style.boxShadow = '0 4px 15px rgba(35, 213, 171, 0.6)';
        
        try {
            const formData = new FormData(uploadForm);
            const response = await fetch('/cartoonify', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();
            
            if (data.success) {
                // Display cartoon image with animation
                cartoonImage.src = data.cartoon_url;
                cartoonImage.style.display = 'inline-block';
                document.querySelector('.image-wrapper:last-child').classList.add('animate__animated', 'animate__fadeIn');
                setTimeout(() => {
                    document.querySelector('.image-wrapper:last-child').classList.remove('animate__animated', 'animate__fadeIn');
                }, 1000);
                
                // Success button animation
                cartoonifyButton.innerHTML = '<i class="fas fa-check"></i> Success!';
                cartoonifyButton.style.background = 'linear-gradient(45deg, #4CAF50, #2E7D32)';
                setTimeout(() => {
                    cartoonifyButton.innerHTML = '<i class="fas fa-magic"></i> Cartoonify Again';
                    cartoonifyButton.style.background = 'linear-gradient(45deg, #23a6d5, #23d5ab)';
                }, 2000);
            } else {
                throw new Error(data.error || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Error button animation
            cartoonifyButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
            cartoonifyButton.style.background = 'linear-gradient(45deg, #f44336, #c62828)';
            setTimeout(() => {
                cartoonifyButton.innerHTML = '<i class="fas fa-magic"></i> Try Again';
                cartoonifyButton.style.background = 'linear-gradient(45deg, #23a6d5, #23d5ab)';
            }, 2000);
            
            // Show error to user
            alert(error.message || 'Failed to cartoonize image. Please try again.');
        } finally {
            loader.style.display = 'none';
        }
    });

    // Add hover effect to cartoonify button
    cartoonifyButton.addEventListener('mouseenter', () => {
        if (!cartoonifyButton.disabled) {
            cartoonifyButton.style.transform = 'translateY(-3px)';
            cartoonifyButton.style.boxShadow = '0 10px 20px rgba(35, 166, 213, 0.6)';
        }
    });
    
    cartoonifyButton.addEventListener('mouseleave', () => {
        if (!cartoonifyButton.disabled) {
            cartoonifyButton.style.transform = '';
            cartoonifyButton.style.boxShadow = '0 5px 15px rgba(35, 166, 213, 0.4)';
        }
    });

    // Add click animation to all buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(1px)';
        });
        button.addEventListener('mouseup', () => {
            button.style.transform = '';
        });
    });
});

// Add shake animation for error feedback
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
