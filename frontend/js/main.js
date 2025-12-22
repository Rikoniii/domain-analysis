// Основная функциональность JavaScript для сайта Дом Лап

// Пользовательский курсор-лапка с исчезающими отпечатками
function initPawCursor() {
    const body = document.body;
    if (!body || body.classList.contains('paw-cursor-enabled')) {
        return;
    }

    const prefersCoarsePointer = window.matchMedia('(pointer: coarse)');
    if (prefersCoarsePointer.matches) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let allowTrail = !prefersReducedMotion.matches;
    prefersReducedMotion.addEventListener('change', (event) => {
        allowTrail = !event.matches;
    });

    const cursor = document.createElement('div');
    cursor.className = 'paw-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    body.appendChild(cursor);
    body.classList.add('paw-cursor-enabled');

    let lastTrailTime = 0;
    const trailDelay = 90;

    function updateCursorPosition(event) {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
        cursor.style.opacity = '1';
    }

    function createTrail(event) {
        if (!allowTrail) {
            return;
        }

        const now = performance.now();
        if (now - lastTrailTime < trailDelay) {
            return;
        }
        lastTrailTime = now;

        const trail = document.createElement('span');
        trail.className = 'pawprint';
        trail.style.left = `${event.clientX}px`;
        trail.style.top = `${event.clientY}px`;
        trail.style.setProperty('--trail-scale', (0.85 + Math.random() * 0.3).toFixed(2));
        trail.style.setProperty('--trail-rotate', `${(Math.random() * 30 - 15).toFixed(2)}deg`);
        body.appendChild(trail);

        trail.addEventListener('animationend', () => {
            trail.remove();
        }, { once: true });
    }

    function handleMouseMove(event) {
        updateCursorPosition(event);
        createTrail(event);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', updateCursorPosition);
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });
    document.addEventListener('mousedown', () => cursor.classList.add('active'));
    document.addEventListener('mouseup', () => cursor.classList.remove('active'));

    prefersCoarsePointer.addEventListener('change', (event) => {
        if (event.matches) {
            body.classList.remove('paw-cursor-enabled');
            cursor.remove();
            document.removeEventListener('mousemove', handleMouseMove);
        }
    });
}

// Получить инициалы из полного ФИО, например "Анна Петрова Васильевна" -> "Анна П.В."
function getInitialsFromFullName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0];
    }
    const firstName = parts[0];
    const rest = parts.slice(1);
    const initials = rest
        .filter(Boolean)
        .map(p => p.charAt(0).toUpperCase() + '.')
        .join('');
    return `${firstName} ${initials}`;
}

// Обновление навигации для отображения статуса пользователя на всех страницах
function updateNavigationUserStatus() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const userName = localStorage.getItem('userName');
    const profileLink = document.querySelector('a[href="profile.html"]');
    
    // Если ссылка не найдена, пробуем снова после небольшой задержки
    if (!profileLink) {
        setTimeout(updateNavigationUserStatus, 200);
        return;
    }
    
    const currentPage = window.location.pathname.split('/').pop();
    const isProfilePage = currentPage === 'profile.html';
    
    if (isLoggedIn && userName) {
        const initials = getInitialsFromFullName(userName);
        // На странице профиля показываем полное ФИО, на остальных — инициалы
        if (isProfilePage) {
            profileLink.innerHTML = `<span style="display: flex; align-items: center; gap: 0.5rem; color: var(--primary-color); font-weight: 600;">
                <span>👤</span>
                <span>${userName}</span>
                <span style="font-size: 0.7rem; background: var(--primary-color); color: white; padding: 0.2rem 0.5rem; border-radius: 12px;">В профиле</span>
            </span>`;
            profileLink.style.color = 'var(--primary-color)';
        } else {
            profileLink.innerHTML = `<span style="display: flex; align-items: center; gap: 0.5rem;">
                <span>👤</span>
                <span>${initials}</span>
            </span>`;
            profileLink.style.color = '';
        }
        profileLink.title = 'Личный кабинет';
    } else {
        // Показываем текст по умолчанию "Личный кабинет"
        profileLink.innerHTML = 'Личный кабинет';
        profileLink.title = 'Личный кабинет';
        profileLink.style.color = '';
    }
}

// Функции модального окна авторизации (доступны на всех страницах)
function showAuthChoiceModal() {
    // Создание модального окна, если оно не существует
    let modal = document.getElementById('authChoiceModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'authChoiceModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Личный кабинет</h2>
                    <button class="modal-close" onclick="closeAuthChoiceModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <button type="button" class="btn btn-primary btn-large" id="authChoiceLoginBtn">Войти в аккаунт</button>
                        <button type="button" class="btn btn-secondary btn-large" id="authChoiceRegisterBtn">Зарегистрироваться</button>
                    </div>
                    <div id="previousAccountSuggestion" style="display: none; margin-top: 1.5rem; padding: 0.75rem; background: #e3f2fd; border-radius: 8px; border: 1px solid #2196F3;">
                        <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #1976d2;">Войти в последний аккаунт?</p>
                        <p id="previousAccountInfo" style="margin: 0 0 0.5rem 0; color: #666;"></p>
                        <button type="button" class="btn btn-outline btn-small" id="usePreviousAccount" style="margin-right: 0.5rem;">Войти</button>
                        <button type="button" class="btn btn-outline btn-small" id="dismissSuggestion">Нет, войти в другой</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Обработка кликов по кнопкам
        const loginBtn = document.getElementById('authChoiceLoginBtn');
        const registerBtn = document.getElementById('authChoiceRegisterBtn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                closeAuthChoiceModal();
                // Перенаправление на страницу профиля, которая покажет модальное окно входа
                window.location.href = 'profile.html?action=login';
            });
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', function() {
                closeAuthChoiceModal();
                // Перенаправление на страницу профиля, которая покажет модальное окно регистрации
                window.location.href = 'profile.html?action=register';
            });
        }
        
        // Обработка предложения предыдущего аккаунта
        const lastLogin = localStorage.getItem('lastLogin');
        const suggestionDiv = document.getElementById('previousAccountSuggestion');
        const previousAccountInfo = document.getElementById('previousAccountInfo');
        
        if (lastLogin) {
            try {
                const userData = JSON.parse(lastLogin);
                if (userData.phone && userData.name) {
                    if (suggestionDiv) {
                        suggestionDiv.style.display = 'block';
                        if (previousAccountInfo) {
                            previousAccountInfo.textContent = `${userData.name} (${userData.phone})`;
                        }
                    }
                    
                    const useBtn = document.getElementById('usePreviousAccount');
                    if (useBtn) {
                        useBtn.addEventListener('click', function() {
                            window.location.href = 'profile.html';
                        });
                    }
                }
            } catch (e) {
                console.error('Error parsing last login:', e);
            }
        }
        
        const dismissBtn = document.getElementById('dismissSuggestion');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', function() {
                if (suggestionDiv) suggestionDiv.style.display = 'none';
            });
        }
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAuthChoiceModal() {
    const modal = document.getElementById('authChoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Сделать функции глобально доступными
window.updateNavigationUserStatus = updateNavigationUserStatus;
window.showAuthChoiceModal = showAuthChoiceModal;
window.closeAuthChoiceModal = closeAuthChoiceModal;

// Вызов при загрузке страницы
// Обработка ошибок загрузки внешних ресурсов (подавление несущественных ошибок)
window.addEventListener('error', function(e) {
    // Подавляем ошибки загрузки Google Fonts (не критично, используются fallback шрифты)
    if (e.target && e.target.tagName === 'LINK' && e.target.href && 
        (e.target.href.includes('fonts.googleapis.com') || e.target.href.includes('fonts.gstatic.com'))) {
        e.preventDefault();
        return false;
    }
    
    // Подавляем ошибки Яндекс.Метрики (блокировка блокировщиками рекламы - нормально)
    if (e.message && (e.message.includes('mc.yandex.com') || e.message.includes('metrika'))) {
        e.preventDefault();
        return false;
    }
    
    // Подавляем ошибки загрузки тайлов Яндекс.Карт (сетевые проблемы - не критично)
    if (e.message && e.message.includes('maps.yandex.ru') && 
        (e.message.includes('ERR_CONNECTION_RESET') || e.message.includes('ERR_BLOCKED_BY_CLIENT'))) {
        e.preventDefault();
        return false;
    }
}, true);

document.addEventListener('DOMContentLoaded', function() {
    // Обновление статуса пользователя в навигации на всех страницах
    updateNavigationUserStatus();
    initPawCursor();
    
    // Также обновляем, когда страница становится видимой (например, при возврате из другой вкладки)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            updateNavigationUserStatus();
        }
    });
    
    // Прослушивание изменений хранилища (когда пользователь входит/выходит в другой вкладке)
    window.addEventListener('storage', function(e) {
        if (e.key === 'userLoggedIn' || e.key === 'userName') {
            updateNavigationUserStatus();
        }
    });
    
    // Также обновляем после небольшой задержки, чтобы убедиться, что DOM полностью готов
    setTimeout(function() {
        updateNavigationUserStatus();
    }, 100);
    
    // Обработка клика по ссылке профиля - показываем модальное окно авторизации, если не авторизован
    const profileLink = document.querySelector('a[href="profile.html"]');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
            const currentPage = window.location.pathname.split('/').pop();
            const isProfilePage = currentPage === 'profile.html';
            
            // Перехватываем только на страницах, не являющихся профилем
            if (!isLoggedIn && !isProfilePage) {
                e.preventDefault();
                // Показываем модальное окно выбора авторизации (будет загружено из profile.js, если доступно)
                if (typeof showAuthChoiceModal === 'function') {
                    showAuthChoiceModal();
                } else {
                    // Резервный вариант: перенаправление на страницу профиля
                    window.location.href = 'profile.html';
                }
            }
        });
    }
    
    // Переключение мобильного меню
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }

    // Закрытие мобильного меню при клике на ссылки
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });

    // Плавная прокрутка для якорных ссылок
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
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

    // Добавление эффекта прокрутки для хедера
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Прокрутка вниз
            header.style.transform = 'translateY(-100%)';
        } else {
            // Прокрутка вверх
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });

    // Добавление анимации загрузки
    const loadingElements = document.querySelectorAll('.animal-card, .news-card, .feature');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    loadingElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Вспомогательная функция валидации формы
    window.validateForm = function(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        return isValid;
    };

    // Форматирование номера телефона
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 1) {
                    value = '+7 (' + value;
                } else if (value.length <= 4) {
                    value = '+7 (' + value.substring(1);
                } else if (value.length <= 7) {
                    value = '+7 (' + value.substring(1, 4) + ') ' + value.substring(4);
                } else if (value.length <= 9) {
                    value = '+7 (' + value.substring(1, 4) + ') ' + value.substring(4, 7) + '-' + value.substring(7);
                } else {
                    value = '+7 (' + value.substring(1, 4) + ') ' + value.substring(4, 7) + '-' + value.substring(7, 9) + '-' + value.substring(9, 11);
                }
            }
            e.target.value = value;
        });
    });

    // Показать сообщения об успехе/ошибке
    window.showMessage = function(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    };

    // Добавление CSS для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .error {
            border-color: #f44336 !important;
            box-shadow: 0 0 5px rgba(244, 67, 54, 0.3) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Загрузка превью животных и новостей на главной странице
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadAnimalsPreview();
        loadNewsPreview();
        setupVolunteerFormHome();
    }
});

// Загрузка превью животных для главной страницы
async function loadAnimalsPreview() {
    try {
        const animals = await window.animalsDB.getAvailableAnimals();
        const previewGrid = document.querySelector('.animals-preview .animals-grid');
        
        if (!previewGrid) return;
        
        // Показать первых 3 доступных животных
        const previewAnimals = animals.slice(0, 3);
        
        if (previewAnimals.length === 0) {
            const noAnimalsText = window.translations ? window.translations.getTranslation('animals.noResults') : 'Нет доступных животных';
            previewGrid.innerHTML = `<p>${noAnimalsText}</p>`;
            return;
        }
        
        const lang = window.animalsDB.getCurrentLanguage();
        let moreText = 'Подробнее';
        if (window.translations && window.translations.getTranslation) {
            moreText = window.translations.getTranslation('common.more', lang);
            // Если вернулся ключ вместо перевода, используем fallback
            if (moreText === 'common.more' || moreText === 'common-more') {
                moreText = lang === 'en' ? 'More details' : 'Подробнее';
            }
        } else {
            moreText = lang === 'en' ? 'More details' : 'Подробнее';
        }
        
        previewGrid.innerHTML = previewAnimals.map(animal => {
            const name = window.animalsDB.getLocalizedText(animal, 'name');
            const ageText = window.animalsDB.getLocalizedText(animal, 'ageText');
            const gender = window.animalsDB.getLocalizedText(animal, 'gender');
            const status = window.animalsDB.getLocalizedText(animal, 'status');
            const description = window.animalsDB.getLocalizedText(animal, 'description');
            
            return `
                <div class="animal-card">
                    <div class="animal-image">
                        <a href="animal-detail.html?id=${animal.id}" style="display: block;">
                            <img src="images/${animal.photos[0]}" alt="${name}">
                        </a>
                        <div class="animal-status available">${status}</div>
                    </div>
                    <div class="animal-info">
                        <h3 class="animal-name">
                            <a href="animal-detail.html?id=${animal.id}" style="text-decoration: none; color: inherit;">
                                ${name}
                            </a>
                        </h3>
                        <p class="animal-details">${gender}, ${ageText}</p>
                        <p class="animal-description">${description.substring(0, 80)}${description.length > 80 ? '...' : ''}</p>
                        <a href="animal-detail.html?id=${animal.id}" class="btn btn-outline">
                            ${moreText}
                        </a>
                    </div>
                </div>
            `;
        }).join('');
        
        // Обновление статистики миссии реальными данными
        updateMissionStats();
    } catch (error) {
        console.error('Error loading animals preview:', error);
    }
}

// Обновление статистики миссии реальными данными из базы данных
// Примечание: Используем фиксированные значения 150+ и 80+ для синхронизации со всеми страницами
async function updateMissionStats() {
    try {
        // Используем фиксированные значения для синхронизации со страницей "О приюте"
        // 150+ животных спасено, 80+ найдено домов
        const statNumbers = document.querySelectorAll('.mission-stats .stat-number');
        if (statNumbers.length >= 2) {
            // Первая статистика: всего спасено (фиксированное значение для синхронизации)
            statNumbers[0].textContent = '150+';
            // Вторая статистика: нашли дом (фиксированное значение для синхронизации)
            statNumbers[1].textContent = '80+';
        }
    } catch (error) {
        console.error('Error updating mission stats:', error);
    }
}

// Настройка анкеты волонтера на главной странице
async function setupVolunteerFormHome() {
    const openBtn = document.getElementById('openVolunteerFromHome');
    const modal = document.getElementById('volunteerModalHome');
    const form = document.getElementById('volunteerFormHome');

    if (!openBtn || !modal || !form) {
        return;
    }

    // Открытие модального окна
    openBtn.addEventListener('click', function () {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // Открытие/закрытие через глобальные функции (для кнопки-крестика)
    window.openVolunteerModalHome = function () {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Автозаполнение формы данными из профиля, если пользователь авторизован
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (isLoggedIn) {
            const userName = localStorage.getItem('userName') || '';
            const userPhone = localStorage.getItem('userPhone') || '';
            const userEmail = localStorage.getItem('userEmail') || '';
            
            const nameInput = document.getElementById('volunteerNameHome');
            const phoneInput = document.getElementById('volunteerPhoneHome');
            const emailInput = document.getElementById('volunteerEmailHome');
            
            if (nameInput && userName) {
                nameInput.value = userName;
                nameInput.readOnly = true; // Фиксируем ФИО
            }
            if (phoneInput && userPhone) {
                phoneInput.value = userPhone;
            }
            if (emailInput && userEmail) {
                emailInput.value = userEmail;
            }
        } else {
            // Если не авторизован, снимаем readOnly
            const nameInput = document.getElementById('volunteerNameHome');
            if (nameInput) {
                nameInput.readOnly = false;
            }
        }
    };
    
    window.closeVolunteerModalHome = function () {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        const form = document.getElementById('volunteerFormHome');
        if (form) {
            form.reset();
            // Сбрасываем readOnly при закрытии
            const nameInput = document.getElementById('volunteerNameHome');
            if (nameInput) {
                nameInput.readOnly = false;
            }
        }
    };

    // Закрытие по клику вне контента
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            window.closeVolunteerModalHome();
        }
    });

    // Закрытие по Esc
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            window.closeVolunteerModalHome();
        }
    });

    // Ожидание и проверка доступности applicationsDB
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts && !window.applicationsDB) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    // Отправка анкеты волонтера
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!window.validateForm || !window.validateForm(form)) {
            window.showMessage && window.showMessage('Пожалуйста, заполните все обязательные поля.', 'error');
            return;
        }

        try {
            const name = document.getElementById('volunteerNameHome').value.trim();
            const phone = document.getElementById('volunteerPhoneHome').value.trim();
            const email = document.getElementById('volunteerEmailHome').value.trim();
            const age = document.getElementById('volunteerAgeHome').value;
            const experience = document.getElementById('volunteerExperienceHome').value.trim();
            const availability = document.getElementById('volunteerAvailabilityHome').value.trim();
            const motivation = document.getElementById('volunteerMotivationHome').value.trim();

            // Определяем userId по сохраненному телефону, как в профиле
            let userPhone = localStorage.getItem('userPhone') || phone;
            let userId = '';
            if (userPhone) {
                const testPhone = '+7 (495) 123-45-67';
                const normalizedPhone = userPhone.replace(/\s/g, '').replace(/[()]/g, '');
                const normalizedTestPhone = testPhone.replace(/\s/g, '').replace(/[()]/g, '');
                userId = (normalizedPhone === normalizedTestPhone || userPhone === testPhone)
                    ? 'anna_petrova'
                    : 'user_' + normalizedPhone;
            } else {
                userId = 'user_' + Date.now();
            }
            
            // Если пользователь авторизован, используем ФИО из профиля
            const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
            const profileName = localStorage.getItem('userName');
            const finalName = (isLoggedIn && profileName) ? profileName : name;

            if (window.applicationsDB && window.applicationsDB.addApplication) {
                const application = {
                    type: 'Волонтерство',
                    userName: finalName,
                    userPhone: phone,
                    userEmail: email,
                    userId: userId,
                    age: age || null,
                    experience: experience,
                    availability: availability,
                    motivation: motivation,
                    date: new Date().toISOString().split('T')[0],
                    status: 'pending',
                    statusRu: 'На рассмотрении',
                    statusEn: 'Pending',
                    viewed: false,
                    animalId: null,
                    animalName: '-'
                };

                window.applicationsDB.addApplication(application);
                window.showMessage && window.showMessage('Заявка на волонтерство успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
                window.closeVolunteerModalHome();
                form.reset();
            } else {
                window.showMessage && window.showMessage('Ошибка: база данных недоступна', 'error');
            }
        } catch (error) {
            console.error('Error submitting volunteer application from home:', error);
            window.showMessage && window.showMessage('Ошибка при отправке заявки', 'error');
        }
    });
}

// Форматирование даты для превью новостей (локализованное)
function formatNewsDate(dateString) {
    const date = new Date(dateString);
    const lang = document.documentElement.getAttribute('lang') || 'ru';

    if (lang === 'en') {
        const monthsEn = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthsEn[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } else {
        const monthsRu = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        return `${date.getDate()} ${monthsRu[date.getMonth()]} ${date.getFullYear()}`;
    }
}

// Локализованный текст для новости
function getNewsLocalizedText(item, field) {
    const lang = document.documentElement.getAttribute('lang') || 'ru';
    if (lang === 'en' && item[field + 'En']) {
        return item[field + 'En'];
    }
    return item[field] || '';
}

// Загрузка превью последней новости для главной страницы
async function loadNewsPreview() {
    try {
        const newsContainer = document.getElementById('homeNewsGrid');
        if (!newsContainer || !window.newsDB || !window.newsDB.getAllNews) {
            return;
        }

        const allNews = await window.newsDB.getAllNews();
        if (!allNews || allNews.length === 0) {
            newsContainer.innerHTML = '<p style="text-align: center; padding: 2rem;">Новости ещё не добавлены</p>';
            return;
        }

        // Сортируем по дате (новые сначала) и берём самую последнюю новость
        const sortedNews = [...allNews].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestNews = sortedNews[0];

        const title = getNewsLocalizedText(latestNews, 'title');
        const excerpt = getNewsLocalizedText(latestNews, 'excerpt');
        const category = getNewsLocalizedText(latestNews, 'category');
        const date = formatNewsDate(latestNews.date);

        // Вся карточка кликабельна и ведёт на страницу новостей с параметром конкретной новости
        newsContainer.innerHTML = `
            <article class="news-card">
                <a href="news.html?newsId=${latestNews.id}" style="display: block; color: inherit; text-decoration: none;">
                    <div class="news-image">
                        <img src="images/${latestNews.image}" alt="${title}">
                    </div>
                    <div class="news-content">
                        <div class="news-meta">
                            <span class="news-date">${date}</span>
                            <span class="news-category">${category}</span>
                        </div>
                        <h3 class="news-title">${title}</h3>
                        <p class="news-excerpt">${excerpt}</p>
                        <span class="news-link" data-translate="news.readMore">Читать подробнее</span>
                    </div>
                </a>
            </article>
        `;
    } catch (error) {
        console.error('Error loading news preview:', error);
    }
}

// Регистрация Service Worker для PWA
// Для разработки можно отключить, установив DISABLE_SW = true
const DISABLE_SW = false; // Установите true для отключения Service Worker при разработке

if ('serviceWorker' in navigator && !DISABLE_SW) {
    window.addEventListener('load', function() {
        // Сначала пытаемся отменить регистрацию старых Service Workers
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister().then(function(success) {
                    if (success) {
                        console.log('Old ServiceWorker unregistered');
                    }
                }).catch(function(err) {
                    // Игнорируем ошибки при отмене регистрации
                });
            }
        }).catch(function(err) {
            // Игнорируем ошибки
        });
        
        // Регистрируем новый Service Worker с обработкой ошибок
        navigator.serviceWorker.register('sw.js?v=2.1')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
                // Принудительно обновляем Service Worker при загрузке
                registration.update().catch(function(err) {
                    // Игнорируем ошибки обновления
                });
            })
            .catch(function(err) {
                // Не критичная ошибка, просто логируем (не показываем в консоли как ошибку)
                if (err.message && !err.message.includes('Not found')) {
                    console.log('ServiceWorker registration skipped:', err.message);
                }
            });
    });
} else if (DISABLE_SW) {
    // Отключаем все Service Workers для разработки
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
            }
        });
        // Очищаем кэш
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) {
                    caches.delete(name);
                }
            });
        }
        console.log('ServiceWorker disabled for development');
    }
}

