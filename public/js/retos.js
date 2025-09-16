// Retos component JavaScript
document.addEventListener('DOMContentLoaded', () => {
    const fadeInElements = document.querySelectorAll('.fade-in-left');

    const checkVisibility = () => {
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;

        fadeInElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top + scrollY;
            const elementBottom = elementTop + element.offsetHeight;
            const isVisible = (elementBottom > scrollY && elementTop < scrollY + windowHeight);
            
            if (isVisible) {
                element.classList.add('visible');
            }
        });
    };

    // Check visibility on scroll and resize
    window.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);
    
    // Initial check
    checkVisibility();
});
