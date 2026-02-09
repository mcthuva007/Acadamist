// Preloader
// Preloader
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Wait a bit for the loading animation to feel complete
        setTimeout(() => {
            preloader.style.transform = 'translateY(-100%)';
            // Start hero animations after preloader leaves
            setTimeout(() => {
                document.body.classList.add('loaded');
                // Trigger Hero Image Animation specifically here
                const heroImg = document.querySelector('.hero__image');
                if (heroImg) {
                    heroImg.style.opacity = '1'; // Ensure visibility
                    heroImg.classList.add('animate-fade-in-right');
                }
            }, 600); // Wait for curtain to clear
        }, 1500);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Detect if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    // Only initialize Lenis on desktop for smooth scrolling
    // Use native mobile scrolling for better performance
    let lenis = null;

    if (!isMobile) {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);
    }

    // Mobile Menu Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navList = document.querySelector('.nav__list');
    const navLinks = document.querySelectorAll('.nav__link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navList.classList.toggle('active');

            // Prevent body scroll when menu is open
            if (navList.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navList.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navList.classList.contains('active')) {
                navToggle.classList.remove('active');
                navList.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    const observerOptions = {
        threshold: isMobile ? 0.05 : 0.1, // Lower threshold on mobile
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Disable reveal animations on mobile for better performance
    if (!isMobile && window.innerWidth > 768) {
        document.querySelectorAll('.hero__title, .hero__subtitle, .section-title, .portfolio-item, .service-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = '';
            el.classList.add('reveal-ready');
            observer.observe(el);
        });
    }

    const style = document.createElement('style');
    style.innerHTML = `
        .in-view {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    const header = document.querySelector('.header');

    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    }

    // Throttled scroll handler for better performance
    let scrollTicking = false;
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        scrollTicking = false;
    };

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(handleScroll);
            scrollTicking = true;
        }
    }, { passive: true });

    const typewriterElement = document.querySelector('.typewriter');
    if (typewriterElement) {
        const text = typewriterElement.getAttribute('data-text');

        const typeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    typewriterElement.textContent = '';
                    typewriterElement.classList.remove('typing-done');

                    let i = 0;
                    function typeWriter() {
                        if (i < text.length) {
                            typewriterElement.textContent += text.charAt(i);
                            i++;
                            setTimeout(typeWriter, 50);
                        } else {
                            typewriterElement.classList.add('typing-done');
                        }
                    }
                    setTimeout(typeWriter, 500);
                } else {
                    typewriterElement.textContent = '';
                }
            });
        }, { threshold: 0.5 });

        typeObserver.observe(typewriterElement);
    }

    // Enhanced Video Lazy Loading and Performance
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;

            if (entry.isIntersecting) {
                // Video is in viewport - play if not already playing
                if (video.paused && video.muted) {
                    video.play().catch(error => {
                        console.log('Auto-play prevented:', error);
                    });
                }
            } else {
                // Video is out of viewport - pause to save resources
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    }, {
        threshold: 0.25, // Play when 25% visible
        rootMargin: '50px' // Start loading slightly before entering viewport
    });

    // Observe all videos for lazy loading
    document.querySelectorAll('.portfolio-video').forEach(video => {
        videoObserver.observe(video);

        // Reduce video quality on slow connections if on mobile
        if (isMobile && 'connection' in navigator) {
            const connection = navigator.connection;
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                // Could implement quality switching here if multiple sources available
                video.preload = 'none';
            }
        }
    });

    // Video Click Interaction with better touch handling
    document.querySelectorAll('.portfolio-item__image').forEach(wrapper => {
        const video = wrapper.querySelector('video');
        const playBtn = wrapper.querySelector('.play-button');

        if (video) {
            const handleVideoClick = function (e) {
                e.preventDefault();
                if (video.muted) {
                    video.muted = false;
                    video.currentTime = 0;
                    video.play();
                    video.setAttribute('controls', 'true');

                    if (playBtn) playBtn.style.display = 'none';
                    wrapper.style.cursor = 'default';
                }
            };

            // Use touch events on mobile for better responsiveness
            if (isMobile) {
                wrapper.addEventListener('touchend', handleVideoClick, { passive: false });
            } else {
                wrapper.addEventListener('click', handleVideoClick);
            }
        }
    });


    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const counter = entry.target;
            if (entry.isIntersecting) {
                const target = +counter.getAttribute('data-target');
                const duration = 2000;
                const increment = target / (duration / 16);

                let current = 0;
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.ceil(current) + "+";
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target + "+";
                    }
                };
                updateCounter();
            } else {
                counter.textContent = "0+";
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(stat => {
        statsObserver.observe(stat);
    });

});
