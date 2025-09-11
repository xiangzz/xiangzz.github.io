// 平滑滚动导航
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 高亮当前章节
window.addEventListener('scroll', function () {
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link');

    let currentSection = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.pageYOffset >= sectionTop) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + currentSection) {
            link.classList.add('active');
        }
    });
});

// 移动端菜单切换
const menuToggle = document.getElementById('menuToggle');
const sidebarNav = document.getElementById('sidebarNav');

if (menuToggle) {
    menuToggle.addEventListener('click', function() {
        sidebarNav.classList.toggle('active');
    });

    // 点击导航链接后关闭菜单（移动端）
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebarNav.classList.remove('active');
            }
        });
    });

    // 点击主内容区域关闭菜单
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            !sidebarNav.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebarNav.classList.remove('active');
        }
    });
}

// 为代码块添加复制功能
document.querySelectorAll('pre code').forEach(block => {
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = '复制';
    button.addEventListener('click', function () {
        navigator.clipboard.writeText(block.textContent).then(() => {
            button.textContent = '已复制';
            setTimeout(() => {
                button.textContent = '复制';
            }, 2000);
        });
    });
    block.parentNode.style.position = 'relative';
    block.parentNode.appendChild(button);
});