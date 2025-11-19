/**
 * Hamburger Menu Toggle Script
 * Handle mobile sidebar menu open/close
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        const hamburger = document.querySelector('.hamburger-menu');
        const sidebar = document.querySelector('.mobile-sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        const closeSidebar = document.querySelector('.mobile-sidebar-close');
        const sidebarLinks = document.querySelectorAll('.mobile-sidebar-nav .btn-nav');

        // Check if elements exist
        if (!hamburger || !sidebar || !overlay) {
            console.warn('Hamburger menu elements not found');
            return;
        }

        // Open sidebar
        function openSidebar() {
            hamburger.classList.add('active');
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        }

        // Close sidebar
        function closeSidebarMenu() {
            hamburger.classList.remove('active');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scrolling
        }

        // Toggle sidebar
        function toggleSidebar() {
            if (sidebar.classList.contains('active')) {
                closeSidebarMenu();
            } else {
                openSidebar();
            }
        }

        // Event listeners
        if (hamburger) {
            hamburger.addEventListener('click', toggleSidebar);
        }

        if (overlay) {
            overlay.addEventListener('click', closeSidebarMenu);
        }

        if (closeSidebar) {
            closeSidebar.addEventListener('click', closeSidebarMenu);
        }

        // Close sidebar when clicking a link (optional, for better UX)
        sidebarLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                // Only close if it's not the logout button (let logout handle itself)
                if (!this.id || this.id !== 'btnLogout') {
                    // Small delay to allow navigation to start
                    setTimeout(closeSidebarMenu, 150);
                }
            });
        });

        // Close sidebar on ESC key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && sidebar.classList.contains('active')) {
                closeSidebarMenu();
            }
        });

        // Handle window resize - close sidebar if resized to desktop
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 767 && sidebar.classList.contains('active')) {
                    closeSidebarMenu();
                }
            }, 250);
        });

        // Swipe to close (optional, for better mobile UX)
        let touchStartX = 0;
        let touchEndX = 0;

        sidebar.addEventListener('touchstart', function(event) {
            touchStartX = event.changedTouches[0].screenX;
        }, false);

        sidebar.addEventListener('touchend', function(event) {
            touchEndX = event.changedTouches[0].screenX;
            handleSwipe();
        }, false);

        function handleSwipe() {
            // Swipe left to close (threshold: 50px)
            if (touchStartX - touchEndX > 50) {
                closeSidebarMenu();
            }
        }
    });
})();
