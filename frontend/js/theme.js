// Управление темой
// (Язык теперь полностью управляется в translations.js)

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    document.querySelectorAll('.theme-switcher').forEach(btn => {
        const icon = btn.querySelector('span');
        if (icon) {
            icon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    });
}

// Инициализация только темы
function initializeTheme() {
    initTheme();
    
    // Обработчики для переключателей темы
    document.querySelectorAll('.theme-switcher').forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
}

// Инициализация при готовности DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}
