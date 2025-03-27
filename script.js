document.addEventListener('DOMContentLoaded', function () {
    // Menu Toggle Fix
    let menu = document.querySelector('#menu-icon');
    let navbar = document.querySelector('.navbar');

    menu.onclick = () => {
        menu.classList.toggle('bx-x');
        navbar.classList.toggle('active');
    }

    window.onscroll = () => {
        menu.classList.remove('bx-x');
        navbar.classList.remove('active');
    }

    // Typed.js Initialization Fix
    const typed = new Typed('.typed-text', {
        strings: ['Mechanical Engineer.', 'Website Developer.', 'Designer.', 'Freelancer.', 'Coder.'],
        typeSpeed: 80,
        backSpeed: 70,
        backDelay: 1200,
        loop: true,
    });
});