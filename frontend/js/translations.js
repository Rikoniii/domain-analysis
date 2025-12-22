// Простая система переводов
// Все ключи используют точечную нотацию: "nav.home", "animals.title" и т.д.

let translations = null;
let currentLang = 'ru';

// Загрузка переводов из JSON
async function loadTranslations() {
    if (translations) return translations;
    
    try {
        const response = await fetch('../data/translations.json');
        if (!response.ok) throw new Error('Failed to load translations');
        translations = await response.json();
        return translations;
    } catch (error) {
        console.error('Error loading translations:', error);
        return null;
    }
}

// Получить перевод по ключу (например: "nav.home", "animals.title")
function t(key, lang = null) {
    lang = lang || currentLang;
    
    if (!translations || !translations[lang]) return key;
    
    // Разбиваем ключ по точкам: "nav.home" -> ["nav", "home"]
    const keys = key.split('.');
    let value = translations[lang];
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return key; // Перевод не найден
        }
    }
    
    return typeof value === 'string' ? value : key;
}

// Перевод всей страницы
function translatePage(lang = null) {
    lang = lang || currentLang;
    currentLang = lang;
    
    if (!translations) {
        console.warn('Translations not loaded yet');
        return;
    }
    
    // Обновляем lang атрибут
    document.documentElement.setAttribute('lang', lang);
    
    // Перевод элементов с data-translate
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        const translation = t(key, lang);
        
        if (translation && translation !== key) {
            if (el.tagName === 'INPUT' && el.type === 'submit') {
                el.value = translation;
            } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else if (translation.includes('<')) {
                el.innerHTML = translation;
            } else {
                el.textContent = translation;
            }
        }
    });
    
    // Перевод title атрибутов
    document.querySelectorAll('[data-translate-title]').forEach(el => {
        const key = el.getAttribute('data-translate-title');
        const translation = t(key, lang);
        if (translation !== key) el.title = translation;
    });
    
    // Перевод placeholder атрибутов
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        const translation = t(key, lang);
        if (translation !== key) el.placeholder = translation;
    });
    
    // Перевод alt атрибутов
    document.querySelectorAll('[data-translate-alt]').forEach(el => {
        const key = el.getAttribute('data-translate-alt');
        const translation = t(key, lang);
        if (translation !== key) el.alt = translation;
    });
    
    // Обновление заголовка страницы
    const titleKey = document.body.getAttribute('data-page-title');
    if (titleKey) {
        const title = t(titleKey, lang);
        const siteName = lang === 'ru' ? 'Дом Лап' : 'Dom Lap';
        document.title = title !== titleKey ? `${title} - ${siteName}` : document.title;
    }
    
    // Событие для динамического контента
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    
    console.log('✓ Page translated to:', lang);
}

// Переключение языка
async function switchLanguage() {
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    currentLang = newLang;
    localStorage.setItem('language', newLang);

    // Обновляем кнопку
    updateLangButton();

    // Переводим страницу
    translatePage(newLang);

    // Перезагружаем динамический контент при необходимости
    // Превью животных есть только на главной странице и требует подключенной базы животных
    try {
        const hasAnimalsPreviewSection = document.querySelector('.animals-preview');
        if (hasAnimalsPreviewSection && window.animalsDB && typeof window.animalsDB.getAvailableAnimals === 'function') {
            if (typeof window.loadAnimalsPreview === 'function') {
                window.loadAnimalsPreview();
            }
        }
    } catch (e) {
        // Не критично для перевода страницы, просто логируем в виде предупреждения
        console.warn('Could not reload animals preview on language switch:', e);
    }
}

// Обновление кнопки языка
function updateLangButton() {
    document.querySelectorAll('.lang-switcher').forEach(btn => {
        btn.textContent = currentLang.toUpperCase();
        btn.title = currentLang === 'ru' ? 'Switch to English' : 'Переключить на русский';
    });
}

// Инициализация
async function initTranslations() {
    await loadTranslations();
    
    if (!translations) {
        console.error('Failed to load translations');
        return;
    }
    
    // Получаем сохраненный язык
    currentLang = localStorage.getItem('language') || 'ru';
    
    // Обновляем кнопку и переводим страницу
    updateLangButton();
    translatePage(currentLang);
    
    // Добавляем обработчики для кнопок языка
    document.querySelectorAll('.lang-switcher').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchLanguage();
        });
    });
}

// Экспорт для глобального доступа
// Добавляем getTranslation для совместимости с существующим кодом
window.translations = {
    t,
    translatePage,
    switchLanguage,
    loadTranslations,
    initTranslations,
    getCurrentLang: () => currentLang,
    getTranslation: (key, lang = null) => t(key, lang)
};

// Автоинициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranslations);
} else {
    initTranslations();
}
