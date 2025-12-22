// Функциональность страницы профиля

document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page DOMContentLoaded');
    
    // Проверка, авторизован ли пользователь
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    console.log('User logged in:', isLoggedIn);
    console.log('localStorage userLoggedIn:', localStorage.getItem('userLoggedIn'));
    
    // Показ/скрытие содержимого профиля в зависимости от статуса входа
    const profileSection = document.querySelector('.profile-section');
    if (profileSection) {
        console.log('Profile section found');
        if (!isLoggedIn) {
            console.log('User not logged in, hiding profile section');
            profileSection.style.display = 'none';
        } else {
            console.log('User logged in, showing profile section');
            profileSection.style.display = 'block';
            // Принудительное отображение для переопределения inline-стиля
            profileSection.setAttribute('style', 'display: block !important;');
        }
    } else {
        console.error('Profile section not found in DOM!');
    }
    
    if (!isLoggedIn) {
        // Скрытие заголовка и подвала страницы при показе модального окна
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
            pageHeader.style.display = 'none';
        }
        
        // Проверка параметра action в URL
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action'); // 'login' or 'register'
        
        // Показ соответствующего модального окна
        console.log('Showing auth modal, action:', action);
        setTimeout(() => {
            if (action === 'register') {
                showRegisterModal();
            } else if (action === 'login') {
                showLoginModal();
            } else {
                // По умолчанию: показ модального окна выбора
                showAuthChoiceModal();
            }
        }, 100);
        return; // Не загружать данные пользователя, если не авторизован
    } else {
        // Показ заголовка страницы, если авторизован
        const pageHeader = document.querySelector('.page-header');
        if (pageHeader) {
            pageHeader.style.display = 'block';
        }
    }
    
    // Загрузка данных пользователя только если авторизован
    console.log('Loading user data...');
    loadUserData();
    
    // Загрузка истории пожертвований (асинхронно)
    loadDonationHistory();
    
    // Загрузка заявок (асинхронно)
    loadApplications();
    
    // Загрузка регулярных пожертвований
    loadRegularDonations();
    
    // Загрузка статуса волонтера
    loadVolunteerStatus();
    
    // Загрузка платежных карт
    loadPaymentCards();
});

// Показ модального окна выбора авторизации (вход или регистрация)
function showAuthChoiceModal() {
    // Скрытие содержимого страницы при показе модального окна
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.style.display = 'none';
    }
    
    const modal = document.getElementById('authChoiceModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Проверка сохраненных данных пользователя (последний вход)
        const lastLogin = localStorage.getItem('lastLogin');
        const suggestionDiv = document.getElementById('previousAccountSuggestion');
        const previousAccountInfo = document.getElementById('previousAccountInfo');
        
        if (lastLogin && !localStorage.getItem('userLoggedIn')) {
            try {
                const userData = JSON.parse(lastLogin);
                if (userData.phone && userData.name) {
                    if (suggestionDiv) {
                        suggestionDiv.style.display = 'block';
                        if (previousAccountInfo) {
                            previousAccountInfo.textContent = `${userData.name} (${userData.phone})`;
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing last login data:', e);
            }
        } else if (suggestionDiv) {
            suggestionDiv.style.display = 'none';
        }
    }
}

// Закрытие модального окна выбора авторизации
function closeAuthChoiceModal() {
    const modal = document.getElementById('authChoiceModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Показ модального окна входа
function showLoginModal() {
    closeAuthChoiceModal();
    // Скрытие содержимого страницы при показе модального окна
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.style.display = 'none';
    }
    
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Предзаполнение телефона из последнего входа, если доступно
        const lastLogin = localStorage.getItem('lastLogin');
        const loginPhoneInput = document.getElementById('loginPhone');
        if (loginPhoneInput && lastLogin) {
            try {
                const userData = JSON.parse(lastLogin);
                if (userData.phone) {
                    loginPhoneInput.value = userData.phone;
                }
            } catch (e) {
                console.error('Error parsing last login:', e);
            }
        }
        
        // Сброс поля кода
        const codeGroup = document.getElementById('loginCodeGroup');
        const codeInput = document.getElementById('loginCode');
        if (codeGroup) codeGroup.style.display = 'none';
        if (codeInput) codeInput.value = '';
    }
}

// Показ модального окна регистрации
function showRegisterModal() {
    closeAuthChoiceModal();
    // Скрытие содержимого страницы при показе модального окна
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader) {
        pageHeader.style.display = 'none';
    }
    
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Сброс формы
        const form = document.getElementById('registerForm');
        if (form) form.reset();
        
        // Сброс поля кода
        const codeGroup = document.getElementById('registerCodeGroup');
        const codeInput = document.getElementById('registerCode');
        if (codeGroup) codeGroup.style.display = 'none';
        if (codeInput) codeInput.value = '';
    }
}

// Закрытие модального окна регистрации
function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Показ заголовка страницы снова, если пользователь авторизован
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (isLoggedIn) {
            const pageHeader = document.querySelector('.page-header');
            if (pageHeader) {
                pageHeader.style.display = 'block';
            }
        }
    }
}

// Закрытие модального окна входа
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Показ заголовка страницы снова, если пользователь авторизован
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (isLoggedIn) {
            const pageHeader = document.querySelector('.page-header');
            if (pageHeader) {
                pageHeader.style.display = 'block';
            }
        }
    }
}

// Сделать функции глобально доступными
window.closeLoginModal = closeLoginModal;
window.showLoginModal = showLoginModal;
window.showAuthChoiceModal = showAuthChoiceModal;
window.closeAuthChoiceModal = closeAuthChoiceModal;
window.showRegisterModal = showRegisterModal;
window.closeRegisterModal = closeRegisterModal;
window.logout = logout;

// Отправка формы входа
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        // Обработка кнопки "Использовать предыдущий аккаунт" (из модального окна выбора авторизации)
        const usePreviousAccountBtn = document.getElementById('usePreviousAccount');
        if (usePreviousAccountBtn) {
            usePreviousAccountBtn.addEventListener('click', function() {
                const lastLogin = localStorage.getItem('lastLogin');
                if (lastLogin) {
                    try {
                        const userData = JSON.parse(lastLogin);
                        if (userData.phone) {
                            showLoginModal();
                            const loginPhoneInput = document.getElementById('loginPhone');
                            if (loginPhoneInput) {
                                loginPhoneInput.value = userData.phone;
                            }
                            // Автоматическая отправка для отправки кода
                            setTimeout(() => {
                                document.getElementById('loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                            }, 100);
                        }
                    } catch (e) {
                        console.error('Error using last login:', e);
                    }
                }
            });
        }
        
        // Обработка кнопки "Отклонить предложение"
        const dismissSuggestionBtn = document.getElementById('dismissSuggestion');
        if (dismissSuggestionBtn) {
            dismissSuggestionBtn.addEventListener('click', function() {
                const suggestionDiv = document.getElementById('previousAccountSuggestion');
                if (suggestionDiv) {
                    suggestionDiv.style.display = 'none';
                }
            });
        }
        
        let loginCodeSent = false;
        let loginSessionId = null;
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const phone = document.getElementById('loginPhone').value.trim();
            const method = document.getElementById('loginMethod').value;
            const code = document.getElementById('loginCode').value.trim();
            const rememberMe = document.getElementById('rememberMe')?.checked || false;
            const codeGroup = document.getElementById('loginCodeGroup');
            const codeInput = document.getElementById('loginCode');
            const submitBtn = document.getElementById('loginSubmitBtn');
            
            if (!phone) {
                showMessage('Пожалуйста, введите номер телефона', 'error');
                return;
            }
            
            // Нормализация номера телефона
            const normalizedPhone = phone.replace(/\s/g, '').replace(/[()]/g, '');
            
            if (!loginCodeSent) {
                // Шаг 1: Отправка кода подтверждения
                try {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Отправка...';
                    
                    const response = await fetch('http://localhost:5000/api/auth/send-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: normalizedPhone, method: method })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        loginCodeSent = true;
                        loginSessionId = data.session_id;
                        codeGroup.style.display = 'block';
                        codeInput.focus();
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Подтвердить';
                        
                        const hint = document.getElementById('loginCodeHint');
                        if (hint) {
                            hint.textContent = method === 'sms' 
                                ? 'Введите код из SMS' 
                                : 'Введите последние 4 цифры номера, с которого вам позвонили';
                        }
                        
                        showMessage('Код отправлен на ваш номер телефона', 'success');
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Войти';
                        showMessage(data.error || 'Ошибка отправки кода', 'error');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Войти';
                    showMessage('Ошибка соединения с сервером', 'error');
                }
            } else {
                // Шаг 2: Проверка кода и вход
                if (!code) {
                    showMessage('Пожалуйста, введите код подтверждения', 'error');
                    return;
                }
                
                try {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Вход...';
                    
                    const response = await fetch('http://localhost:5000/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            phone: normalizedPhone, 
                            code: code,
                            session_id: loginSessionId
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        // Сохранение состояния входа
                        localStorage.setItem('userLoggedIn', 'true');
                        localStorage.setItem('userPhone', data.user.phone);
                        localStorage.setItem('userName', data.user.full_name || 'Пользователь');
                        localStorage.setItem('userEmail', data.user.email || '');
                        localStorage.setItem('userId', data.user.id);
                        
                        // Сохранение последнего входа
                        const lastLoginData = {
                            name: data.user.full_name || 'Пользователь',
                            phone: data.user.phone,
                            email: data.user.email || ''
                        };
                        localStorage.setItem('lastLogin', JSON.stringify(lastLoginData));
                        
                        if (rememberMe) {
                            localStorage.setItem('savedUserData', JSON.stringify(lastLoginData));
                            localStorage.setItem('savedPhone', data.user.phone);
                        }
                        
                        closeLoginModal();
                        showMessage('Добро пожаловать в личный кабинет!', 'success');
                        
                        // Обновление навигации
                        if (typeof updateNavigationUserStatus === 'function') {
                            updateNavigationUserStatus();
                        }
                        
                        // Показать секцию профиля и заголовок страницы
                        const profileSection = document.querySelector('.profile-section');
                        if (profileSection) {
                            profileSection.style.display = 'block';
                        }
                        const pageHeader = document.querySelector('.page-header');
                        if (pageHeader) {
                            pageHeader.style.display = 'block';
                        }
                        
                        // Загрузка данных пользователя
                        loadUserData();
                        loadDonationHistory();
                        loadApplications();
                        loadUserNotifications();
                        loadRegularDonations();
                        loadVolunteerStatus();
                        loadPaymentCards();
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Подтвердить';
                        showMessage(data.error || 'Неверный код', 'error');
                        codeInput.value = '';
                        codeInput.focus();
                    }
                } catch (error) {
                    console.error('Login verification error:', error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Подтвердить';
                    showMessage('Ошибка соединения с сервером', 'error');
                }
            }
        });
    }
});

// Отправка формы регистрации
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        let registerCodeSent = false;
        let registerSessionId = null;
        
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('registerFirstName').value.trim();
            const lastName = document.getElementById('registerLastName').value.trim();
            const middleName = document.getElementById('registerMiddleName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const phone = document.getElementById('registerPhone').value.trim();
            const method = document.getElementById('registerMethod').value;
            const code = document.getElementById('registerCode').value.trim();
            const codeGroup = document.getElementById('registerCodeGroup');
            const codeInput = document.getElementById('registerCode');
            const submitBtn = document.getElementById('registerSubmitBtn');
            
            // Валидация
            if (!firstName || !lastName || !email || !phone) {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
                return;
            }
            
            // Нормализация номера телефона
            const normalizedPhone = phone.replace(/\s/g, '').replace(/[()]/g, '');
            
            if (!registerCodeSent) {
                // Шаг 1: Отправка кода подтверждения
                try {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Отправка кода...';
                    
                    const response = await fetch('http://localhost:5000/api/auth/send-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: normalizedPhone, method: method })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        registerCodeSent = true;
                        registerSessionId = data.session_id;
                        codeGroup.style.display = 'block';
                        codeInput.focus();
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Зарегистрироваться';
                        
                        const hint = document.getElementById('registerCodeHint');
                        if (hint) {
                            hint.textContent = method === 'sms' 
                                ? 'Введите код из SMS' 
                                : 'Введите последние 4 цифры номера, с которого вам позвонили';
                        }
                        
                        showMessage('Код отправлен на ваш номер телефона', 'success');
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Зарегистрироваться';
                        showMessage(data.error || 'Ошибка отправки кода', 'error');
                    }
                } catch (error) {
                    console.error('Register error:', error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Зарегистрироваться';
                    showMessage('Ошибка соединения с сервером', 'error');
                }
            } else {
                // Шаг 2: Проверка кода и регистрация
                if (!code) {
                    showMessage('Пожалуйста, введите код подтверждения', 'error');
                    return;
                }
                
                try {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Регистрация...';
                    
                    const fullName = middleName 
                        ? `${firstName} ${lastName} ${middleName}`.trim()
                        : `${firstName} ${lastName}`.trim();
                    
                    const response = await fetch('http://localhost:5000/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            phone: normalizedPhone,
                            email: email,
                            full_name: fullName,
                            code: code,
                            session_id: registerSessionId
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        // Сохранение состояния входа
                        localStorage.setItem('userLoggedIn', 'true');
                        localStorage.setItem('userPhone', data.user.phone);
                        localStorage.setItem('userName', data.user.full_name);
                        localStorage.setItem('userEmail', data.user.email || '');
                        localStorage.setItem('userId', data.user.id);
                        
                        // Сохранение последнего входа
                        const lastLoginData = {
                            name: data.user.full_name,
                            phone: data.user.phone,
                            email: data.user.email || ''
                        };
                        localStorage.setItem('lastLogin', JSON.stringify(lastLoginData));
                        
                        closeRegisterModal();
                        showMessage('Регистрация успешна! Добро пожаловать!', 'success');
                        
                        // Обновление навигации
                        if (typeof updateNavigationUserStatus === 'function') {
                            updateNavigationUserStatus();
                        }
                        
                        // Показать секцию профиля и заголовок страницы
                        const profileSection = document.querySelector('.profile-section');
                        if (profileSection) {
                            profileSection.style.display = 'block';
                        }
                        const pageHeader = document.querySelector('.page-header');
                        if (pageHeader) {
                            pageHeader.style.display = 'block';
                        }
                        
                        // Загрузка данных пользователя
                        loadUserData();
                        loadDonationHistory();
                        loadApplications();
                        loadUserNotifications();
                        loadRegularDonations();
                        loadVolunteerStatus();
                        loadPaymentCards();
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Зарегистрироваться';
                        showMessage(data.error || 'Ошибка регистрации', 'error');
                        codeInput.value = '';
                        codeInput.focus();
                    }
                } catch (error) {
                    console.error('Register verification error:', error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Зарегистрироваться';
                    showMessage('Ошибка соединения с сервером', 'error');
                }
            }
        });
    }
});

// Вспомогательная функция для отображения сообщений (если не существует)
if (typeof showMessage === 'undefined') {
    function showMessage(text, type = 'info') {
        // Попытка использовать существующую систему сообщений
        if (window.showMessage && typeof window.showMessage === 'function') {
            window.showMessage(text, type);
            return;
        }
        
        // Резервный вариант - alert
        alert(text);
    }
    window.showMessage = showMessage;
}

// Загрузка данных пользователя
function loadUserData() {
    const userPhone = localStorage.getItem('userPhone');
    const userName = localStorage.getItem('userName') || 'Анна Петрова Васильевна';
    const userEmail = localStorage.getItem('userEmail') || 'anna@example.com';
    
    if (userPhone) {
        // В реальной реализации это будет получать данные пользователя с сервера
        // Для тестового аккаунта (Анна Петрова) используем сохраненные данные
        const testPhone = '+7 (495) 123-45-67';
        const normalizedPhone = userPhone.replace(/\s/g, '').replace(/[()]/g, '');
        const normalizedTestPhone = testPhone.replace(/\s/g, '').replace(/[()]/g, '');
        
        let userData;
        if (normalizedPhone === normalizedTestPhone || userPhone === testPhone) {
            userData = {
                name: 'Анна Петрова Васильевна',
                phone: userPhone,
                email: 'anna@example.com',
                totalDonations: 5,
                totalAmount: 2500
            };
        } else {
            userData = {
                name: userName,
                phone: userPhone,
                email: userEmail,
                totalDonations: 0,
                totalAmount: 0
            };
        }
        
        // Сохранение имени пользователя в localStorage для навигации
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('userEmail', userData.email);
        
        // Обновление информации профиля
        const profileName = document.getElementById('profileName');
        const profilePhone = document.getElementById('profilePhone');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileName) profileName.textContent = userData.name;
        if (profilePhone) profilePhone.textContent = userData.phone;
        if (profileEmail) profileEmail.textContent = userData.email;
        
        // Обновление аватара
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            updateAvatarDisplay(savedAvatar);
        }
        
        // Обновление статистики профиля (будет обновлено после загрузки пожертвований)
        const savedDonations = localStorage.getItem('userTotalDonations');
        const savedAmount = localStorage.getItem('userTotalAmount');
        
        const statNumber = document.getElementById('statDonationsCount');
        const statAmount = document.getElementById('statTotalAmount');
        
        if (statNumber) {
            if (savedDonations) {
                statNumber.textContent = savedDonations;
            } else if (userData.totalDonations !== undefined) {
                statNumber.textContent = userData.totalDonations;
            }
        }
        
        if (statAmount) {
            if (savedAmount) {
                statAmount.textContent = parseInt(savedAmount).toLocaleString('ru-RU') + ' ₽';
            } else if (userData.totalAmount !== undefined) {
                statAmount.textContent = userData.totalAmount.toLocaleString('ru-RU') + ' ₽';
            }
        }
        
        // Обеспечить видимость секции профиля
        const profileSection = document.querySelector('.profile-section');
        if (profileSection) {
            profileSection.style.display = 'block';
            console.log('Profile section displayed after loading user data');
        }
        
        // Обновление навигации на всех страницах
        if (typeof updateNavigationUserStatus === 'function') {
            updateNavigationUserStatus();
        }
    } else {
        console.warn('No user phone found in localStorage');
    }
}

// Вспомогательная функция для переводов на странице профиля
function tProfile(key, fallback) {
    try {
        if (window.translations && typeof window.translations.t === 'function') {
            const value = window.translations.t(key);
            if (value && value !== key) return value;
        }
    } catch (e) {
        // игнорировать и использовать резервный вариант
    }
    return fallback;
}

// Загрузка истории пожертвований
async function loadDonationHistory() {
    try {
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) return;
        
        // Определение ID пользователя по телефону
        const testPhone = '+7 (495) 123-45-67';
        const normalizedPhone = userPhone.replace(/\s/g, '').replace(/[()]/g, '');
        const normalizedTestPhone = testPhone.replace(/\s/g, '').replace(/[()]/g, '');
        const userId = (normalizedPhone === normalizedTestPhone || userPhone === testPhone) ? 'anna_petrova' : 'user_' + normalizedPhone;
        
        let donations = [];

        // 1. Пытаемся загрузить историю пожертвований из API (основной источник правды)
        try {
            const response = await fetch('http://localhost:5000/api/admin/donations?limit=1000');
            if (response.ok) {
                const apiDonations = await response.json();
                const userEmail = localStorage.getItem('userEmail') || '';

                const purposeMap = {
                    'food': 'Корм для животных',
                    'medical': 'Ветеринарное лечение',
                    'maintenance': 'Содержание приюта',
                    'general': 'Общие нужды'
                };

                const userDonations = apiDonations.filter(d => {
                    const samePhone = d.phone === userPhone;
                    const sameEmail = userEmail && d.email === userEmail;
                    return samePhone || sameEmail;
                });

                donations = userDonations.map(d => {
                    const dateStr = d.paid_at || d.created_at;
                    const date = dateStr ? new Date(dateStr) : new Date();
                    const formattedDate = date.toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    const rawStatus = (d.status || '').toLowerCase();
                    // В тестовом режиме считаем pending как завершенный
                    const normalizedStatus = (rawStatus === 'pending') ? 'completed' : (rawStatus || 'completed');
                    return {
                        rawDate: date.toISOString(),
                        date: formattedDate,
                        amount: d.amount || 0,
                        purpose: purposeMap[d.purpose] || d.purpose || 'Общие нужды',
                        status: normalizedStatus
                    };
                }).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
            }
        } catch (apiError) {
            console.warn('API недоступен для истории пожертвований, используем локальную БД:', apiError);
        }

        // 2. Если из API ничего не получили — используем локальную БД (donationsDB)
        if (donations.length === 0 && window.donationsDB) {
            // Загружаем все пожертвования и фильтруем по userId, телефону или email
            const allDonations = await window.donationsDB.getAllDonations();
            const userEmail = localStorage.getItem('userEmail') || '';
            
            const userDonations = allDonations.filter(d => {
                const sameUserId = d.userId === userId;
                const samePhone = d.userPhone === userPhone;
                const sameEmail = userEmail && d.userEmail === userEmail;
                return sameUserId || samePhone || sameEmail;
            });
            
            donations = userDonations.map(d => {
                const date = new Date(d.date);
                const formattedDate = date.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                return {
                    rawDate: d.date,
                    date: formattedDate,
                    amount: d.amount,
                    purpose: d.purpose,
                    status: d.status
                };
            }).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        }
        
        // Обновление списка пожертвований в HTML
        const donationList = document.querySelector('.donation-list');
        if (donationList) {
            if (donations.length === 0) {
                donationList.innerHTML = `
                    <div class="donation-item">
                        <div class="donation-date"></div>
                        <div class="donation-amount">${tProfile('profile.noDonationsText', 'Вы ещё не делали пожертвований')}</div>
                        <div class="donation-purpose"></div>
                        <div class="donation-status"></div>
                    </div>
                `;
            } else {
                const maxVisible = 5;
                const visible = donations.slice(0, maxVisible);
                const hidden = donations.slice(maxVisible);
                
                const visibleHtml = visible.map(d => {
                    const statusKey = (d.status || '').toLowerCase();
                    let statusText;
                    if (statusKey === 'completed' || statusKey === 'succeeded') {
                        statusText = tProfile('profile.donationStatusCompleted', 'Завершено');
                    } else if (statusKey === 'pending') {
                        statusText = tProfile('profile.donationStatusPending', 'В обработке');
                    } else if (statusKey === 'failed') {
                        statusText = tProfile('profile.donationStatusFailed', 'Ошибка');
                    } else {
                        statusText = d.status || '';
                    }
                    const statusClass = statusKey === 'succeeded' ? 'completed' : (statusKey || 'unknown');
                    return `
                        <div class="donation-item">
                            <div class="donation-date">${d.date}</div>
                            <div class="donation-amount">${d.amount.toLocaleString('ru-RU')} ₽</div>
                            <div class="donation-purpose">${d.purpose}</div>
                            <div class="donation-status ${statusClass}">${statusText}</div>
                        </div>
                    `;
                }).join('');
                
                const hiddenHtml = hidden.map(d => {
                    const statusKey = (d.status || '').toLowerCase();
                    let statusText;
                    if (statusKey === 'completed' || statusKey === 'succeeded') {
                        statusText = tProfile('profile.donationStatusCompleted', 'Завершено');
                    } else if (statusKey === 'pending') {
                        statusText = tProfile('profile.donationStatusPending', 'В обработке');
                    } else if (statusKey === 'failed') {
                        statusText = tProfile('profile.donationStatusFailed', 'Ошибка');
                    } else {
                        statusText = d.status || '';
                    }
                    const statusClass = statusKey === 'succeeded' ? 'completed' : (statusKey || 'unknown');
                    return `
                        <div class="donation-item donation-item-hidden" style="display: none;">
                            <div class="donation-date">${d.date}</div>
                            <div class="donation-amount">${d.amount.toLocaleString('ru-RU')} ₽</div>
                            <div class="donation-purpose">${d.purpose}</div>
                            <div class="donation-status ${statusClass}">${statusText}</div>
                        </div>
                    `;
                }).join('');
                
                const showMoreButton = hidden.length > 0
                    ? `<button id="showMoreDonations" class="btn btn-outline btn-small" style="margin-top: 0.75rem;">
                            ${tProfile('profile.showMoreDonations', 'Показать все пожертвования')}
                       </button>`
                    : '';
                
                donationList.innerHTML = visibleHtml + hiddenHtml + showMoreButton;
                
                if (hidden.length > 0) {
                    const btn = document.getElementById('showMoreDonations');
                    if (btn) {
                        btn.addEventListener('click', function() {
                            const hiddenItems = donationList.querySelectorAll('.donation-item-hidden');
                            hiddenItems.forEach(item => {
                                // Используем тот же layout, что и для видимых элементов
                                item.style.display = 'grid';
                            });
                            btn.style.display = 'none';
                        });
                    }
                }
            }
        }
        
        // Обновление статистики профиля с реальными данными пожертвований
        if (donations.length > 0) {
            // Вычисление общей суммы из фактических сумм пожертвований
            const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
            
            const statNumber = document.getElementById('statDonationsCount');
            const statAmount = document.getElementById('statTotalAmount');
            if (statNumber) statNumber.textContent = donations.length;
            if (statAmount) statAmount.textContent = totalAmount.toLocaleString('ru-RU') + ' ₽';
            
            // Сохранение в localStorage для loadUserData
            localStorage.setItem('userTotalDonations', donations.length);
            localStorage.setItem('userTotalAmount', totalAmount);
        }
        
        // Обеспечить видимость секции профиля после загрузки данных
        const profileSection = document.querySelector('.profile-section');
        if (profileSection && localStorage.getItem('userLoggedIn') === 'true') {
            profileSection.style.display = 'block';
            console.log('Profile section displayed after loading donation history');
        }
        
    console.log('Donation history loaded:', donations);
    } catch (error) {
        console.error('Error loading donation history:', error);
    }
}

// Загрузка заявок
async function loadApplications() {
    try {
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) return;
        
        // Определение ID пользователя по телефону
        const testPhone = '+7 (495) 123-45-67';
        const normalizedPhone = userPhone.replace(/\s/g, '').replace(/[()]/g, '');
        const normalizedTestPhone = testPhone.replace(/\s/g, '').replace(/[()]/g, '');
        const userId = (normalizedPhone === normalizedTestPhone || userPhone === testPhone) ? 'anna_petrova' : 'user_' + normalizedPhone;
        
        let applications = [];
        if (window.applicationsDB) {
            // Берём все заявки и фильтруем по userId / телефону / email,
            // чтобы не терять историю при изменении логики userId
            const allApplications = await window.applicationsDB.getAllApplications();
            const userEmail = localStorage.getItem('userEmail') || '';
            
            const userApplications = allApplications.filter(app => {
                const sameUserId = app.userId === userId;
                const samePhone = app.userPhone === userPhone;
                const sameEmail = userEmail && app.userEmail === userEmail;
                return sameUserId || samePhone || sameEmail;
            });
            
            applications = userApplications.map(app => {
                const date = new Date(app.date);
                const formattedDate = date.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                return {
                    type: app.type,
                    animal: app.animalName,
                    rawDate: app.date,
                    date: formattedDate,
                    status: app.status
                };
            }).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate)).reverse();
        }
        
        // Обновление списка заявок в HTML
        const applicationList = document.querySelector('.application-list');
        if (applicationList) {
            if (applications.length === 0) {
                // Если заявок пока нет, показываем пустое состояние
                applicationList.innerHTML = `
                    <div class="application-item">
                        <div class="application-type">${tProfile('profile.noApplicationsTitle', 'Заявок пока нет')}</div>
                        <div class="application-animal"></div>
                        <div class="application-date"></div>
                        <div class="application-status">${tProfile('profile.noApplicationsText', 'Вы ещё не отправляли заявки')}</div>
                    </div>
                `;
            } else {
                applicationList.innerHTML = applications.map(app => {
                const statusClass = app.status === 'approved' ? 'approved' : app.status === 'pending' ? 'pending' : 'rejected';
                const statusText = app.status === 'approved'
                    ? tProfile('profile.applicationStatusApproved', 'Одобрено')
                    : app.status === 'pending'
                        ? tProfile('profile.applicationStatusPending', 'На рассмотрении')
                        : tProfile('profile.applicationStatusRejected', 'Отклонено');
                const typeText = app.type === 'Усыновление' || app.type === 'Adoption'
                    ? tProfile('profile.applicationTypeAdoption', 'Усыновление')
                    : app.type === 'Волонтерство' || app.type === 'Volunteering'
                        ? tProfile('profile.applicationTypeVolunteering', 'Волонтерство')
                        : app.type;
                
                    return `
                        <div class="application-item">
                            <div class="application-type">${typeText}</div>
                            <div class="application-animal">${app.animal}</div>
                            <div class="application-date">${app.date}</div>
                            <div class="application-status ${statusClass}">${statusText}</div>
                        </div>
                    `;
                }).join('');
            }
        }
        
        // Обеспечить видимость секции профиля после загрузки данных
        const profileSection = document.querySelector('.profile-section');
        if (profileSection && localStorage.getItem('userLoggedIn') === 'true') {
            profileSection.style.display = 'block';
            console.log('Profile section displayed after loading applications');
        }
        
        console.log('Applications loaded:', applications);
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Загрузка уведомлений пользователя (например, при одобрении заявок)
async function loadUserNotifications() {
    try {
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) return;

        // Определяем userId из телефона (та же логика, что и в loadApplications)
        const testPhone = '+7 (495) 123-45-67';
        const normalizedPhone = userPhone.replace(/\s/g, '').replace(/[()]/g, '');
        const normalizedTestPhone = testPhone.replace(/\s/g, '').replace(/[()]/g, '');
        const userId = (normalizedPhone === normalizedTestPhone || userPhone === testPhone) ? 'anna_petrova' : 'user_' + normalizedPhone;

        const key = `userNotifications_${userId}`;
        let notifications = [];
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                notifications = JSON.parse(saved) || [];
            }
        } catch (e) {
            console.warn('Could not parse user notifications:', e);
        }

        const unread = notifications.filter(n => !n.read);
        if (unread.length === 0) {
            // Ничего не показываем, если нет непрочитанных уведомлений
            return;
        }

        // Создаём или находим контейнер для уведомлений
        let notificationsContainer = document.getElementById('profileNotifications');
        if (!notificationsContainer) {
            const profileContent = document.querySelector('.profile-content');
            if (!profileContent) return;

            notificationsContainer = document.createElement('div');
            notificationsContainer.id = 'profileNotifications';
            notificationsContainer.style.marginBottom = '1.5rem';
            profileContent.insertBefore(notificationsContainer, profileContent.firstChild);
        }

        notificationsContainer.innerHTML = unread.map(n => {
            const date = new Date(n.date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            let message = '';
            if (n.type === 'Усыновление' || n.type === 'Adoption') {
                message = `Ваша заявка на усыновление питомца «${n.animalName || '-'}» одобрена. Мы скоро с вами свяжемся.`;
            } else if (n.type === 'Волонтерство' || n.type === 'Volunteering') {
                message = `Ваша заявка на волонтёрство одобрена. Мы скоро с вами свяжемся.`;
            } else {
                message = `Ваша заявка («${n.type}») одобрена. Мы скоро с вами свяжемся.`;
            }

            return `
                <div class="profile-notification" style="margin-bottom: 0.75rem; padding: 0.75rem 1rem; border-radius: 8px; background: rgba(76, 175, 80, 0.08); border-left: 4px solid #4CAF50; display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem;">
                    <div>
                        <div style="font-weight: 600; color: #2e7d32; margin-bottom: 0.25rem;">✅ Заявка одобрена</div>
                        <div style="font-size: 0.9rem; color: var(--text-color);">${message}</div>
                        <div style="font-size: 0.8rem; color: var(--text-light); margin-top: 0.25rem;">${date}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Добавляем небольшой индикатор-значок на блок "Мои заявки"
        const applicationsHeader = document.querySelector('.applications h3');
        if (applicationsHeader) {
            let badge = applicationsHeader.querySelector('.applications-notification-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'applications-notification-badge';
                badge.style.cssText = 'margin-left: 0.5rem; font-size: 0.75rem; background: #4CAF50; color: white; padding: 0.1rem 0.5rem; border-radius: 999px;';
                applicationsHeader.appendChild(badge);
            }
            badge.textContent = unread.length.toString();
        }

        // Помечаем уведомления как прочитанные, чтобы при следующем заходе не дублировались
        const updated = notifications.map(n => ({
            ...n,
            read: true
        }));
        try {
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
            console.warn('Could not save updated notifications as read:', e);
        }
    } catch (error) {
        console.error('Error loading user notifications:', error);
    }
}

// Загрузка регулярных пожертвований
function loadRegularDonations() {
    try {
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) return;
        
        // Получение регулярных пожертвований из localStorage
        const regularDonationsKey = 'regularDonations_' + userPhone;
        let regularDonations = [];
        
        try {
            const saved = localStorage.getItem(regularDonationsKey);
            if (saved) {
                regularDonations = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading regular donations from localStorage:', e);
        }
        
        // Для Анны Петровой добавить значения по умолчанию, если их нет
        const testPhone = '+7 (495) 123-45-67';
        const normalizedPhone = userPhone.replace(/\s/g, '').replace(/[()]/g, '');
        const normalizedTestPhone = testPhone.replace(/\s/g, '').replace(/[()]/g, '');
        
        if ((normalizedPhone === normalizedTestPhone || userPhone === testPhone) && regularDonations.length === 0) {
            regularDonations = [
                { id: 1, amount: 500, frequency: 'monthly', frequencyText: 'Каждый месяц', purpose: 'Корм для животных', status: 'active' }
            ];
            localStorage.setItem(regularDonationsKey, JSON.stringify(regularDonations));
        }
        
        // Фильтрация отмененных пожертвований
        const activeDonations = regularDonations.filter(rd => rd.status !== 'cancelled');
        
        // Обновление индикатора подписки
        const subscriptionIndicator = document.getElementById('subscriptionIndicator');
        const subscribeButton = document.getElementById('subscribeButton');
        
        if (activeDonations.length > 0) {
            // Показать индикатор, скрыть кнопку подписки
            if (subscriptionIndicator) subscriptionIndicator.style.display = 'block';
            if (subscribeButton) subscribeButton.style.display = 'none';
        } else {
            // Скрыть индикатор, показать кнопку подписки
            if (subscriptionIndicator) subscriptionIndicator.style.display = 'none';
            if (subscribeButton) subscribeButton.style.display = 'block';
        }
        
        // Обновление списка регулярных пожертвований
        const regularList = document.getElementById('regularDonationsList');
        if (regularList) {
            if (activeDonations.length === 0) {
                const noText = tProfile('profile.regularNoActive', 'У вас нет активных регулярных пожертвований');
                regularList.innerHTML = `<p style="color: #666; text-align: center; padding: 2rem;">${noText}</p>`;
            } else {
                regularList.innerHTML = activeDonations.map(rd => {
                    const frequencyText = rd.frequencyText || (rd.frequency === 'monthly'
                        ? tProfile('profile.regularFrequencyMonthly', 'Каждый месяц')
                        : rd.frequency === 'weekly'
                            ? tProfile('profile.regularFrequencyWeekly', 'Каждую неделю')
                            : tProfile('profile.regularFrequencyQuarterly', 'Каждый квартал'));
                    const statusText = rd.status === 'active'
                        ? tProfile('profile.regularStatusActive', 'Активно')
                        : tProfile('profile.regularStatusCancelled', 'Отменено');
                    const statusClass = rd.status === 'active' ? 'active' : 'cancelled';
                    
                    // Получение описания частоты с конкретными датами
                    let frequencyDesc = '';
                    if (rd.frequency === 'monthly') {
                        frequencyDesc = tProfile('profile.regularFreqDescMonthly', 'Списывается каждое 1-е число месяца');
                    } else if (rd.frequency === 'weekly') {
                        frequencyDesc = tProfile('profile.regularFreqDescWeekly', 'Списывается каждый понедельник');
                    } else if (rd.frequency === 'quarterly') {
                        frequencyDesc = tProfile('profile.regularFreqDescQuarterly', 'Списывается 1-го числа каждого квартала (январь, апрель, июль, октябрь)');
                    } else {
                        frequencyDesc = tProfile('profile.regularFreqDescMonthly', 'Списывается каждый месяц');
                    }
                    
                    return `
                        <div class="regular-item" data-id="${rd.id}" style="padding: 1.5rem; background: var(--white); border-radius: 8px; box-shadow: var(--shadow); margin-bottom: 1rem;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
                                <div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${rd.amount.toLocaleString('ru-RU')} ₽</div>
                                    <div style="font-size: 0.85rem; color: var(--text-light);">${frequencyDesc}</div>
                                </div>
                                <div>
                                    <div style="font-weight: 600; color: var(--text-color);">${frequencyText}</div>
                                    <div style="font-size: 0.9rem; color: var(--text-light);">${rd.purpose}</div>
                                </div>
                                <div>
                                    <div class="regular-status ${statusClass}" style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${statusText}</div>
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    ${rd.status === 'active' ? `
                                        <button class="btn btn-outline btn-small" onclick="editRegularDonation(${rd.id})" title="${tProfile('profile.editProfileTitle', 'Редактировать профиль')}">✏️</button>
                                        <button class="btn btn-outline btn-small" onclick="cancelRegularDonation(${rd.id})" title="${tProfile('profile.regularCancel', 'Отменить')}">${tProfile('profile.regularCancel', 'Отменить')}</button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
        
        // Обеспечить видимость секции профиля после загрузки данных
        const profileSection = document.querySelector('.profile-section');
        if (profileSection && localStorage.getItem('userLoggedIn') === 'true') {
            profileSection.style.display = 'block';
            console.log('Profile section displayed after loading regular donations');
        }
        
        console.log('Regular donations loaded:', activeDonations);
    } catch (error) {
        console.error('Error loading regular donations:', error);
    }
}

// Загрузка статуса волонтера
async function loadVolunteerStatus() {
    try {
        const userPhone = localStorage.getItem('userPhone');
        const userEmail = localStorage.getItem('userEmail');
        if (!userPhone) return;
        
        // Загрузка данных волонтеров
        if (window.volunteersDB && typeof window.volunteersDB.loadVolunteersData === 'function') {
            await window.volunteersDB.loadVolunteersData();
        }
        
        // Проверка, является ли пользователь волонтером
        let isVolunteer = false;
        let volunteerInfo = null;
        
        if (window.volunteersDB && typeof window.volunteersDB.getAllVolunteers === 'function') {
            const volunteers = await window.volunteersDB.getAllVolunteers();
            volunteerInfo = volunteers.find(v => 
                (v.phone === userPhone || v.email === userEmail) && v.status === 'active'
            );
            isVolunteer = !!volunteerInfo;
        }
        
        // Обновление интерфейса
        const statusIndicator = document.getElementById('volunteerStatusIndicator');
        const volunteerInfoDiv = document.getElementById('volunteerInfo');
        const notVolunteerDiv = document.getElementById('notVolunteerInfo');
        
        if (isVolunteer && volunteerInfo) {
            // Показать статус волонтера
            if (statusIndicator) statusIndicator.style.display = 'block';
            if (volunteerInfoDiv) {
                volunteerInfoDiv.style.display = 'block';
                const details = document.getElementById('volunteerDetails');
                    if (details) {
                        const roleLabel = tProfile('profile.volunteerRoleInline', 'Роль:');
                        const specLabel = tProfile('profile.volunteerSpecInline', 'Специализация:');
                        const joinLabel = tProfile('profile.volunteerJoinDateInline', 'Дата присоединения:');
                        const joinDate = new Date(volunteerInfo.joinDate);
                        const lang = document.documentElement.getAttribute('lang') || 'ru';
                        const joinDateFormatted = joinDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU');
                        details.innerHTML = `
                            <div style="margin-bottom: 1rem;">
                                <div style="font-weight: 600; color: var(--text-color); margin-bottom: 0.5rem;">${roleLabel}</div>
                                <div style="color: var(--text-light);">${volunteerInfo.role || 'Волонтер'}</div>
                            </div>
                            <div style="margin-bottom: 1rem;">
                                <div style="font-weight: 600; color: var(--text-color); margin-bottom: 0.5rem;">${specLabel}</div>
                                <div style="color: var(--text-light);">${volunteerInfo.specialization || 'Не указано'}</div>
                            </div>
                            <div>
                                <div style="font-weight: 600; color: var(--text-color); margin-bottom: 0.5rem;">${joinLabel}</div>
                                <div style="color: var(--text-light);">${joinDateFormatted}</div>
                            </div>
                        `;
                }
            }
            if (notVolunteerDiv) notVolunteerDiv.style.display = 'none';
        } else {
            // Показать, что не волонтер
            if (statusIndicator) statusIndicator.style.display = 'none';
            if (volunteerInfoDiv) volunteerInfoDiv.style.display = 'none';
            if (notVolunteerDiv) notVolunteerDiv.style.display = 'block';
        }
        
        console.log('Volunteer status loaded:', { isVolunteer, volunteerInfo });
    } catch (error) {
        console.error('Error loading volunteer status:', error);
    }
}

// Покинуть волонтерство
async function leaveVolunteering() {
    if (!confirm('Вы уверены, что хотите покинуть волонтерство? Это действие можно будет отменить, подав новую заявку.')) {
        return;
    }
    
    try {
        const userPhone = localStorage.getItem('userPhone');
        const userEmail = localStorage.getItem('userEmail');
        if (!userPhone) return;
        
        // Обновление статуса волонтера в базе данных
        if (!window.volunteersDB) {
            if (typeof showMessage === 'function') {
                showMessage('База данных волонтёров недоступна', 'error');
            } else {
                alert('База данных волонтёров недоступна');
            }
            return;
        }
        
        // Загружаем данные, если ещё не загружены
        await window.volunteersDB.loadVolunteersData();
        
        const volunteers = await window.volunteersDB.getAllVolunteers();
        const volunteer = volunteers.find(v => 
            (v.phone === userPhone || v.email === userEmail) && v.status === 'active'
        );
        
        if (volunteer) {
            const updated = window.volunteersDB.updateVolunteer(volunteer.id, {
                status: 'inactive',
                leftDate: new Date().toISOString().split('T')[0]
            });
            
            if (updated) {
                if (typeof showMessage === 'function') {
                    showMessage('Вы покинули волонтерство', 'success');
                } else {
                    alert('Вы покинули волонтерство');
                }
                
                // Перезагрузка статуса волонтера
                await loadVolunteerStatus();
            } else {
                if (typeof showMessage === 'function') {
                    showMessage('Ошибка при обновлении статуса', 'error');
                } else {
                    alert('Ошибка при обновлении статуса');
                }
            }
        }
    } catch (error) {
        console.error('Error leaving volunteering:', error);
        alert('Ошибка при выходе из волонтерства');
    }
}

// Открытие модального окна заявки волонтера
function openVolunteerApplicationModal() {
    const modal = document.getElementById('volunteerApplicationModal');
    if (modal) {
        // Заполнение формы данными пользователя, если он авторизован
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (isLoggedIn) {
            const userName = localStorage.getItem('userName');
            const userPhone = localStorage.getItem('userPhone');
            const userEmail = localStorage.getItem('userEmail');
            
            const nameInput = document.getElementById('volunteerName');
            const phoneInput = document.getElementById('volunteerPhone');
            const emailInput = document.getElementById('volunteerEmail');
            
            if (nameInput && userName) nameInput.value = userName;
            if (phoneInput && userPhone) phoneInput.value = userPhone;
            if (emailInput && userEmail) emailInput.value = userEmail;
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие модального окна заявки волонтера
function closeVolunteerApplicationModal() {
    const modal = document.getElementById('volunteerApplicationModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const form = document.getElementById('volunteerApplicationForm');
        if (form) form.reset();
    }
}

// Показать модальное окно успешной заявки волонтера
function showVolunteerSuccessModal(info) {
    const volunteerSuccessModal = document.getElementById('volunteerSuccessModal');
    if (!volunteerSuccessModal) return;

    const { fullName, phone, email } = info || {};

    const volunteerSuccessName = document.getElementById('volunteerSuccessName');
    const volunteerSuccessPhone = document.getElementById('volunteerSuccessPhone');
    const volunteerSuccessEmail = document.getElementById('volunteerSuccessEmail');

    if (volunteerSuccessName && fullName) {
        volunteerSuccessName.textContent = `Ваше имя: ${fullName}`;
        volunteerSuccessName.style.display = 'block';
    } else if (volunteerSuccessName) {
        volunteerSuccessName.style.display = 'none';
    }

    if (volunteerSuccessPhone && phone) {
        volunteerSuccessPhone.textContent = `Телефон: ${phone}`;
        volunteerSuccessPhone.style.display = 'block';
    } else if (volunteerSuccessPhone) {
        volunteerSuccessPhone.style.display = 'none';
    }

    if (volunteerSuccessEmail && email) {
        volunteerSuccessEmail.textContent = `Email: ${email}`;
        volunteerSuccessEmail.style.display = 'block';
    } else if (volunteerSuccessEmail) {
        volunteerSuccessEmail.style.display = 'none';
    }

    volunteerSuccessModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Закрыть модальное окно успешной заявки волонтера
function closeVolunteerSuccessModal() {
    const volunteerSuccessModal = document.getElementById('volunteerSuccessModal');
    if (!volunteerSuccessModal) return;
    volunteerSuccessModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Отправка заявки волонтера
async function submitVolunteerApplication() {
    try {
        // Получение данных формы из полной формы
        const nameInput = document.getElementById('volunteerName');
        const phoneInput = document.getElementById('volunteerPhone');
        const emailInput = document.getElementById('volunteerEmail');
        const ageInput = document.getElementById('volunteerAge');
        const experienceInput = document.getElementById('volunteerExperience');
        const availabilityInput = document.getElementById('volunteerAvailability');
        const motivationInput = document.getElementById('volunteerMotivation');

        if (!nameInput || !phoneInput || !motivationInput) {
            console.error('Required form inputs not found');
            if (typeof showMessage === 'function') {
                showMessage('Ошибка: форма не найдена', 'error');
            } else {
                alert('Ошибка: форма не найдена');
            }
            return;
        }

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput ? emailInput.value.trim() : '';
        const age = ageInput ? ageInput.value : '';
        const experience = experienceInput ? experienceInput.value.trim() : '';
        const availability = availabilityInput ? availabilityInput.value.trim() : '';
        const motivation = motivationInput.value.trim();
        
        // Проверка обязательных полей
        if (!name || !phone || !motivation) {
            if (typeof showMessage === 'function') {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            } else {
                alert('Пожалуйста, заполните все обязательные поля');
            }
            return;
        }
        
        // Определяем userId по сохраненному телефону или введенному
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
        
        // Если пользователь авторизован, используем ФИО из профиля, но приоритет у введенного имени
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        const profileName = localStorage.getItem('userName');
        const finalName = name || (isLoggedIn && profileName ? profileName : '');
        
        // Проверка доступности applicationsDB
        if (!window.applicationsDB) {
            console.error('applicationsDB not available');
            if (typeof showMessage === 'function') {
                showMessage('Ошибка: система заявок недоступна', 'error');
            } else {
                alert('Ошибка: система заявок недоступна');
            }
            return;
        }
        
        // Создание объекта заявки
        const newApplication = {
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
        
        // Использовать addApplication для правильного сохранения заявки
        const savedApplication = await window.applicationsDB.addApplication(newApplication);
        console.log('Volunteer application saved:', savedApplication);
        
        // Закрыть модальное окно формы
        closeVolunteerApplicationModal();
        
        // Показать модальное окно успеха
        showVolunteerSuccessModal({
            fullName: finalName,
            phone: phone,
            email: email
        });
        
        // Перезагрузка списка заявок
        loadApplications();
    } catch (error) {
        console.error('Error submitting volunteer application:', error);
        if (typeof showMessage === 'function') {
            showMessage('Ошибка при подаче заявки', 'error');
        } else {
            alert('Ошибка при подаче заявки');
        }
    }
}

// Привязка отправки формы заявки волонтера и кнопок модального окна успеха
document.addEventListener('DOMContentLoaded', function() {
    const volunteerForm = document.getElementById('volunteerApplicationForm');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitVolunteerApplication();
        });
    }
    
    // Обработка кнопок модального окна успеха
    const volunteerGoToHomeButton = document.getElementById('volunteerGoToHomeButton');
    const volunteerGoToProfileButton = document.getElementById('volunteerGoToProfileButton');
    
    if (volunteerGoToHomeButton) {
        volunteerGoToHomeButton.addEventListener('click', function() {
            closeVolunteerSuccessModal();
            window.location.href = 'index.html';
        });
    }
    
    if (volunteerGoToProfileButton) {
        volunteerGoToProfileButton.addEventListener('click', function() {
            closeVolunteerSuccessModal();
            // Уже на странице профиля, просто закрыть модальное окно
        });
    }
    
    // Закрыть модальное окно при клике снаружи
    const volunteerSuccessModal = document.getElementById('volunteerSuccessModal');
    if (volunteerSuccessModal) {
        volunteerSuccessModal.addEventListener('click', function(e) {
            if (e.target === volunteerSuccessModal) {
                closeVolunteerSuccessModal();
            }
        });
    }
});

// Отмена регулярного пожертвования
function cancelRegularDonation(id) {
    if (!confirm('Вы уверены, что хотите отменить это регулярное пожертвование? После отмены подписка станет неактивной.')) {
        return;
    }
    
    try {
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) return;
        
        const regularDonationsKey = 'regularDonations_' + userPhone;
        let regularDonations = [];
        
        try {
            const saved = localStorage.getItem(regularDonationsKey);
            if (saved) {
                regularDonations = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading regular donations:', e);
        }
        
        // Пометить как отмененное
        const donation = regularDonations.find(rd => rd.id === id);
        if (donation) {
            donation.status = 'cancelled';
            donation.cancelledAt = new Date().toISOString();
            localStorage.setItem(regularDonationsKey, JSON.stringify(regularDonations));
            
            if (typeof showMessage === 'function') {
                showMessage('Регулярное пожертвование отменено', 'success');
            } else {
                alert('Регулярное пожертвование отменено');
            }
            
            // Перезагрузка регулярных пожертвований (это обновит индикатор и кнопку)
            loadRegularDonations();
        }
    } catch (error) {
        console.error('Error cancelling regular donation:', error);
        alert('Ошибка при отмене регулярного пожертвования');
    }
}

// Редактирование регулярного пожертвования
function editRegularDonation(id) {
    try {
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) return;
        
        const regularDonationsKey = 'regularDonations_' + userPhone;
        let regularDonations = [];
        
        try {
            const saved = localStorage.getItem(regularDonationsKey);
            if (saved) {
                regularDonations = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading regular donations:', e);
        }
        
        const donation = regularDonations.find(rd => rd.id === id);
        if (!donation) {
            alert('Пожертвование не найдено');
            return;
        }
        
        // Предварительное заполнение формы существующими данными
        const amountField = document.getElementById('regularAmount');
        const frequencyField = document.getElementById('regularFrequency');
        const purposeField = document.getElementById('regularPurpose');
        
        if (amountField) amountField.value = donation.amount;
        if (frequencyField) frequencyField.value = donation.frequency;
        if (purposeField) purposeField.value = donation.purpose;
        
        // Сохранение ID редактирования
        const form = document.getElementById('regularDonationForm');
        if (form) {
            form.dataset.editingId = id;
        }
        
        // Изменение заголовка модального окна
        const modalTitle = document.querySelector('#regularDonationModal h2');
        if (modalTitle) modalTitle.textContent = 'Редактировать регулярное пожертвование';
        
        // Изменение кнопки отправки
        const submitBtn = document.querySelector('#regularDonationForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Сохранить изменения';
        
        // Открытие модального окна
        openRegularDonationModal();
    } catch (error) {
        console.error('Error editing regular donation:', error);
        alert('Ошибка при редактировании регулярного пожертвования');
    }
}

// Открытие модального окна регулярного пожертвования
function openRegularDonationModal() {
    const modal = document.getElementById('regularDonationModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие модального окна регулярного пожертвования
function closeRegularDonationModal() {
    const modal = document.getElementById('regularDonationModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const form = document.getElementById('regularDonationForm');
        if (form) {
            form.reset();
            delete form.dataset.editingId;
        }
        
        // Сброс заголовка модального окна
        const modalTitle = document.querySelector('#regularDonationModal h2');
        if (modalTitle) modalTitle.textContent = 'Подписка на регулярное пожертвование';
        
        // Сброс кнопки отправки
        const submitBtn = document.querySelector('#regularDonationForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Подписаться';
    }
}

// Прокрутка к секции истории пожертвований
function scrollToDonationHistory() {
    const donationHistorySection = document.getElementById('donationHistorySection');
    if (donationHistorySection) {
        donationHistorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Краткое выделение секции
        donationHistorySection.style.transition = 'background-color 0.3s';
        donationHistorySection.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        setTimeout(() => {
            donationHistorySection.style.backgroundColor = '';
        }, 2000);
    }
}

// Предпросмотр аватара
function previewAvatar(input) {
    const preview = document.getElementById('avatarPreview');
    const previewImg = document.getElementById('avatarPreviewImg');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Функции редактирования профиля
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (!modal) return;
    
    // Получение текущих данных пользователя
    const userName = localStorage.getItem('userName') || '';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userPhone = localStorage.getItem('userPhone') || '';
    const userAvatar = localStorage.getItem('userAvatar') || '';
    
    // Разделение имени на имя и фамилию
    const nameParts = userName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Предварительное заполнение формы
    const firstNameField = document.getElementById('editFirstName');
    const lastNameField = document.getElementById('editLastName');
    const emailField = document.getElementById('editEmail');
    const phoneField = document.getElementById('editPhone');
    const avatarField = document.getElementById('editAvatar');
    const preview = document.getElementById('avatarPreview');
    const previewImg = document.getElementById('avatarPreviewImg');
    
    if (firstNameField) firstNameField.value = firstName;
    if (lastNameField) lastNameField.value = lastName;
    if (emailField) emailField.value = userEmail;
    if (phoneField) phoneField.value = userPhone;
    
    // Показать текущий аватар, если он существует
    if (userAvatar && previewImg) {
        previewImg.src = userAvatar;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
    
    if (avatarField) avatarField.value = '';
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const form = document.getElementById('editProfileForm');
        if (form) form.reset();
    }
}

// Сохранение изменений профиля
async function saveProfileChanges() {
    try {
        const firstName = document.getElementById('editFirstName').value.trim();
        const lastName = document.getElementById('editLastName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const avatarInput = document.getElementById('editAvatar');
        
        if (!firstName || !lastName || !email || !phone) {
            if (typeof showMessage === 'function') {
                showMessage('Пожалуйста, заполните все поля', 'error');
            } else {
                alert('Пожалуйста, заполните все поля');
            }
            return;
        }
        
        const newName = `${firstName} ${lastName}`.trim();
        const oldPhone = localStorage.getItem('userPhone');
        const oldName = localStorage.getItem('userName');
        const userId = oldPhone === '+7 (495) 123-45-67' ? 'anna_petrova' : 'user_' + oldPhone.replace(/\s/g, '').replace(/[()]/g, '');
        
        // Обработка загрузки аватара - ожидание чтения файла
        let avatarDataUrl = localStorage.getItem('userAvatar') || '';
        if (avatarInput && avatarInput.files && avatarInput.files[0]) {
            // Асинхронное чтение файла и ожидание его
            avatarDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    resolve(e.target.result);
                };
                reader.onerror = function() {
                    resolve(avatarDataUrl); // Сохранить старый аватар при ошибке
                };
                reader.readAsDataURL(avatarInput.files[0]);
            });
            localStorage.setItem('userAvatar', avatarDataUrl);
            updateAvatarDisplay(avatarDataUrl);
        }
        
        // Обновление localStorage
        localStorage.setItem('userName', newName);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPhone', phone);
        if (avatarDataUrl) {
            localStorage.setItem('userAvatar', avatarDataUrl);
            updateAvatarDisplay(avatarDataUrl);
        }
        
        // Обновление отображения профиля
        const profileName = document.getElementById('profileName');
        const profilePhone = document.getElementById('profilePhone');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileName) profileName.textContent = newName;
        if (profilePhone) profilePhone.textContent = phone;
        if (profileEmail) profileEmail.textContent = email;
        
        // Обновление аватара при изменении
        if (avatarDataUrl) {
            updateAvatarDisplay(avatarDataUrl);
        }
        
        // Обновление навигации
        if (typeof updateNavigationUserStatus === 'function') {
            updateNavigationUserStatus();
        }
        
        // Обновление данных пользователя в базах данных
        // Сначала убедиться, что базы данных загружены
        if (window.applicationsDB && typeof window.applicationsDB.loadApplicationsData === 'function') {
            await window.applicationsDB.loadApplicationsData();
        }
        if (window.donationsDB && typeof window.donationsDB.loadDonationsData === 'function') {
            await window.donationsDB.loadDonationsData();
        }
        
        // Обновление заявок
        if (window.applicationsDB && window.applicationsDB.applicationsData) {
            const applications = window.applicationsDB.applicationsData.applications;
            let updated = false;
            applications.forEach(app => {
                if (app.userId === userId || app.userPhone === oldPhone || app.userName === oldName) {
                    app.userName = newName;
                    app.userEmail = email;
                    app.userPhone = phone;
                    updated = true;
                }
            });
            if (updated) {
                try {
                    localStorage.setItem('applicationsData', JSON.stringify(window.applicationsDB.applicationsData));
                    console.log('Applications updated with new profile data');
                } catch (e) {
                    console.warn('Could not save applications:', e);
                }
            }
        }
        
        // Обновление пожертвований
        if (window.donationsDB && window.donationsDB.donationsData) {
            const donations = window.donationsDB.donationsData.donations;
            let updated = false;
            donations.forEach(donation => {
                if (donation.userId === userId || donation.phone === oldPhone || donation.donorName === oldName) {
                    donation.donorName = newName;
                    donation.email = email;
                    donation.phone = phone;
                    updated = true;
                }
            });
            if (updated) {
                try {
                    localStorage.setItem('donationsData', JSON.stringify(window.donationsDB.donationsData));
                    console.log('Donations updated with new profile data');
                } catch (e) {
                    console.warn('Could not save donations:', e);
                }
            }
        }
        
        // Если телефон изменился, обновить ключ регулярных пожертвований
        if (oldPhone !== phone) {
            const oldKey = 'regularDonations_' + oldPhone;
            const newKey = 'regularDonations_' + phone;
            const oldData = localStorage.getItem(oldKey);
            if (oldData) {
                localStorage.setItem(newKey, oldData);
                localStorage.removeItem(oldKey);
            }
        }
        
        // Обновление данных волонтера, если пользователь является волонтером
        if (window.volunteersDB && typeof window.volunteersDB.loadVolunteersData === 'function') {
            await window.volunteersDB.loadVolunteersData();
            const volunteers = await window.volunteersDB.getAllVolunteers();
            const volunteer = volunteers.find(v => 
                (v.phone === phone || v.phone === oldPhone || v.email === email) && v.status === 'active'
            );
            
            if (volunteer) {
                const updateData = {
                    name: newName,
                    nameEn: newName,
                    phone: phone,
                    email: email
                };
                
                // Обновление аватара при изменении
                if (avatarDataUrl) {
                    updateData.avatar = avatarDataUrl; // Сохранить как data URL
                }
                
                const updated = window.volunteersDB.updateVolunteer(volunteer.id, updateData);
                if (updated) {
                    console.log('Volunteer data updated with profile changes');
                } else {
                    console.warn('Failed to update volunteer data');
                }
            }
        }
        
        if (typeof showMessage === 'function') {
            showMessage('Профиль успешно обновлен!', 'success');
        } else {
            alert('Профиль успешно обновлен!');
        }
        
        closeEditProfileModal();
        
        // Перезагрузка данных для отражения изменений
        loadUserData();
        loadDonationHistory();
        loadApplications();
        loadVolunteerStatus();
    } catch (error) {
        console.error('Error saving profile changes:', error);
        alert('Ошибка при сохранении изменений профиля');
    }
}

// Обработка отправки формы редактирования профиля
document.addEventListener('DOMContentLoaded', function() {
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileChanges();
        });
    }
});

// Сделать функции глобально доступными
window.cancelRegularDonation = cancelRegularDonation;
window.editRegularDonation = editRegularDonation;
window.openRegularDonationModal = openRegularDonationModal;
window.closeRegularDonationModal = closeRegularDonationModal;
window.scrollToDonationHistory = scrollToDonationHistory;
// Обновление отображения аватара
function updateAvatarDisplay(avatarDataUrl) {
    const avatarImage = document.getElementById('avatarImage');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    
    if (avatarDataUrl && avatarImage && avatarPlaceholder) {
        avatarImage.src = avatarDataUrl;
        avatarImage.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    }
}

// Загрузка платежных карт
function loadPaymentCards() {
    try {
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) return;
        
        const cardsKey = 'paymentCards_' + userPhone;
        let cards = [];
        
        try {
            const saved = localStorage.getItem(cardsKey);
            if (saved) {
                cards = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading payment cards:', e);
        }
        
        const cardsList = document.getElementById('paymentCardsList');
        if (cardsList) {
            if (cards.length === 0) {
                const noCardsText = tProfile('profile.cardsNoneText', 'У вас нет сохраненных карт');
                cardsList.innerHTML = `<p style="color: #666; text-align: center; padding: 2rem;">${noCardsText}</p>`;
            } else {
                cardsList.innerHTML = cards.map(card => {
                    const isActive = card.isActive ? tProfile('profile.cardActiveBadge', 'Активная') : '';
                    const activeClass = card.isActive ? 'active' : '';
                    const maskedNumber = '**** **** **** ' + card.number.slice(-4);
                    
                    return `
                        <div class="card-item ${activeClass}" data-id="${card.id}" style="padding: 1.5rem; background: var(--white); border-radius: 8px; box-shadow: var(--shadow); margin-bottom: 1rem; border: ${card.isActive ? '2px solid var(--primary-color)' : '1px solid #ddd'};">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                        <div style="font-size: 1.2rem;">💳</div>
                                        <div style="font-weight: 600; color: var(--text-color);">${maskedNumber}</div>
                                        ${card.isActive ? `<span style="padding: 0.25rem 0.75rem; background: var(--primary-color); color: white; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${isActive}</span>` : ''}
                                    </div>
                                    <div style="font-size: 0.9rem; color: var(--text-light);">${card.name} • ${card.expiry}</div>
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    ${!card.isActive ? `<button class="btn btn-outline btn-small" onclick="setActiveCard(${card.id})" title="${tProfile('profile.cardSetActiveTitle', 'Сделать активной')}">✓</button>` : ''}
                                    <button class="btn btn-outline btn-small" onclick="deleteCard(${card.id})" title="${tProfile('profile.cardDeleteTitle', 'Удалить')}">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Error loading payment cards:', error);
    }
}

// Открытие модального окна добавления карты
function openAddCardModal() {
    const modal = document.getElementById('addCardModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие модального окна добавления карты
function closeAddCardModal() {
    const modal = document.getElementById('addCardModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const form = document.getElementById('addCardForm');
        if (form) form.reset();
    }
}

// Установка активной карты
function setActiveCard(cardId) {
    try {
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) return;
        
        const cardsKey = 'paymentCards_' + userPhone;
        let cards = [];
        
        try {
            const saved = localStorage.getItem(cardsKey);
            if (saved) {
                cards = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading cards:', e);
        }
        
        // Установить все карты как неактивные, затем установить выбранную как активную
        cards.forEach(card => {
            card.isActive = card.id === cardId;
        });
        
        localStorage.setItem(cardsKey, JSON.stringify(cards));
        loadPaymentCards();
        
        if (typeof showMessage === 'function') {
            showMessage('Карта установлена как активная', 'success');
        }
    } catch (error) {
        console.error('Error setting active card:', error);
    }
}

// Удаление карты
function deleteCard(cardId) {
    if (!confirm('Вы уверены, что хотите удалить эту карту?')) {
        return;
    }
    
    try {
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) return;
        
        const cardsKey = 'paymentCards_' + userPhone;
        let cards = [];
        
        try {
            const saved = localStorage.getItem(cardsKey);
            if (saved) {
                cards = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading cards:', e);
        }
        
        cards = cards.filter(card => card.id !== cardId);
        localStorage.setItem(cardsKey, JSON.stringify(cards));
        loadPaymentCards();
        
        if (typeof showMessage === 'function') {
            showMessage('Карта удалена', 'success');
        }
    } catch (error) {
        console.error('Error deleting card:', error);
    }
}

// Обработка отправки формы добавления карты
document.addEventListener('DOMContentLoaded', function() {
    const addCardForm = document.getElementById('addCardForm');
    if (addCardForm) {
        addCardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const cardExpiry = document.getElementById('cardExpiry').value;
            const cardCVC = document.getElementById('cardCVC').value;
            const cardName = document.getElementById('cardName').value.trim();
            const setAsActive = document.getElementById('setAsActive').checked;
            
            if (cardNumber.length < 13 || cardNumber.length > 19) {
                if (typeof showMessage === 'function') {
                    showMessage('Некорректный номер карты', 'error');
                } else {
                    alert('Некорректный номер карты');
                }
                return;
            }
            
            const userPhone = localStorage.getItem('userPhone');
            if (!userPhone) {
                alert('Необходимо войти в систему');
                return;
            }
            
            const cardsKey = 'paymentCards_' + userPhone;
            let cards = [];
            
            try {
                const saved = localStorage.getItem(cardsKey);
                if (saved) {
                    cards = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Error loading cards:', e);
            }
            
            // Если устанавливается как активная, деактивировать все остальные
            if (setAsActive) {
                cards.forEach(card => card.isActive = false);
            }
            
            const maxId = cards.length > 0 ? Math.max(...cards.map(c => c.id || 0)) : 0;
            const newCard = {
                id: maxId + 1,
                number: cardNumber,
                expiry: cardExpiry,
                cvc: cardCVC,
                name: cardName,
                isActive: setAsActive,
                createdAt: new Date().toISOString()
            };
            
            cards.push(newCard);
            localStorage.setItem(cardsKey, JSON.stringify(cards));
            
            if (typeof showMessage === 'function') {
                showMessage('Карта успешно добавлена!', 'success');
            } else {
                alert('Карта успешно добавлена!');
            }
            
            closeAddCardModal();
            loadPaymentCards();
        });
        
        // Форматирование ввода номера карты
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '');
                value = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = value;
            });
        }
        
        // Форматирование ввода срока действия
        const cardExpiryInput = document.getElementById('cardExpiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;
            });
        }
        
        // Форматирование ввода CVC
        const cardCVCInput = document.getElementById('cardCVC');
        if (cardCVCInput) {
            cardCVCInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
            });
        }
    }
});

window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.leaveVolunteering = leaveVolunteering;
window.openVolunteerApplicationModal = openVolunteerApplicationModal;
window.closeVolunteerApplicationModal = closeVolunteerApplicationModal;
window.showVolunteerSuccessModal = showVolunteerSuccessModal;
window.closeVolunteerSuccessModal = closeVolunteerSuccessModal;
window.previewAvatar = previewAvatar;
window.openAddCardModal = openAddCardModal;
window.closeAddCardModal = closeAddCardModal;
window.setActiveCard = setActiveCard;
window.deleteCard = deleteCard;

// Открытие/закрытие модального окна удаления профиля
function openDeleteProfileModal() {
    const modal = document.getElementById('deleteProfileModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeDeleteProfileModal() {
    const modal = document.getElementById('deleteProfileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Полное удаление профиля (вызов из модального окна)
async function deleteProfile() {
    try {
        const userPhone = localStorage.getItem('userPhone');
        const userEmail = localStorage.getItem('userEmail');

        // 1. Попробуем уведомить бэкенд (если есть соответствующий endpoint)
        try {
            await fetch('http://localhost:5000/api/profile/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: userPhone, email: userEmail })
            });
        } catch (apiError) {
            console.warn('Не удалось вызвать API удаления профиля, продолжаем очистку на клиенте:', apiError);
        }

        // 2. Очищаем все локальные данные, связанные с пользователем
        // Удаляем привязанные карты
        if (userPhone) {
            const cardsKey = 'paymentCards_' + userPhone;
            localStorage.removeItem(cardsKey);
        }

        // Удаляем локальные пожертвования пользователя из mock-БД
        try {
            const donationsRaw = localStorage.getItem('donationsData');
            if (donationsRaw) {
                const donationsParsed = JSON.parse(donationsRaw);
                if (donationsParsed && Array.isArray(donationsParsed.donations)) {
                    const filtered = donationsParsed.donations.filter(d => {
                        const samePhone = d.userPhone === userPhone;
                        const sameEmail = userEmail && d.userEmail === userEmail;
                        return !(samePhone || sameEmail);
                    });
                    donationsParsed.donations = filtered;
                    localStorage.setItem('donationsData', JSON.stringify(donationsParsed));
                }
            }
        } catch (e) {
            console.warn('Ошибка при очистке локальных пожертвований пользователя:', e);
        }

        // 3. Удаляем все данные профиля и статусы
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        localStorage.removeItem('userTotalDonations');
        localStorage.removeItem('userTotalAmount');

        // Удаляем lastLogin, чтобы профиль не всплывал
        localStorage.removeItem('lastLogin');

        closeDeleteProfileModal();

        if (typeof showMessage === 'function') {
            showMessage('Профиль и все связанные данные удалены', 'success');
        } else {
            alert('Профиль и все связанные данные удалены');
        }

        if (typeof updateNavigationUserStatus === 'function') {
            updateNavigationUserStatus();
        }

        // Перенаправляем на главную
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Ошибка при удалении профиля:', error);
        if (typeof showMessage === 'function') {
            showMessage('Ошибка при удалении профиля', 'error');
        } else {
            alert('Ошибка при удалении профиля');
        }
    }
}

window.deleteProfile = deleteProfile;
window.openDeleteProfileModal = openDeleteProfileModal;
window.closeDeleteProfileModal = closeDeleteProfileModal;

// Функция выхода
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        // Сохранение последнего входа перед выходом
        const userName = localStorage.getItem('userName');
        const userPhone = localStorage.getItem('userPhone');
        const userEmail = localStorage.getItem('userEmail');
        
        if (userName && userPhone) {
            const lastLoginData = {
                name: userName,
                phone: userPhone,
                email: userEmail || ''
            };
            localStorage.setItem('lastLogin', JSON.stringify(lastLoginData));
        }
        
        // Удаление статуса входа, но сохранение lastLogin для следующего раза
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        // Примечание: lastLogin сохраняется для быстрого входа в следующий раз
        
        showMessage('Вы вышли из личного кабинета', 'success');
        
        // Обновление навигации на всех страницах
        if (typeof updateNavigationUserStatus === 'function') {
            updateNavigationUserStatus();
        }
        
        // Перенаправление на главную страницу
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Примечание: updateNavigationUserStatus определена в main.js для доступности на всех страницах
// Она вызывается автоматически при DOMContentLoaded и может быть вызвана вручную при необходимости

// Обработка отправки формы регулярного пожертвования
document.addEventListener('DOMContentLoaded', function() {
    const regularDonationForm = document.getElementById('regularDonationForm');
    if (regularDonationForm) {
        regularDonationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amount = parseInt(document.getElementById('regularAmount').value);
            const frequency = document.getElementById('regularFrequency').value;
            const purpose = document.getElementById('regularPurpose').value;
            
            if (!amount || amount < 100) {
                if (typeof showMessage === 'function') {
                    showMessage('Минимальная сумма пожертвования - 100 ₽', 'error');
                } else {
                    alert('Минимальная сумма пожертвования - 100 ₽');
                }
                return;
            }
            
            const userPhone = localStorage.getItem('userPhone');
            if (!userPhone) {
                if (typeof showMessage === 'function') {
                    showMessage('Необходимо войти в систему', 'error');
                } else {
                    alert('Необходимо войти в систему');
                }
                return;
            }
            
            const regularDonationsKey = 'regularDonations_' + userPhone;
            let regularDonations = [];
            
            try {
                const saved = localStorage.getItem(regularDonationsKey);
                if (saved) {
                    regularDonations = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Error loading regular donations:', e);
            }
            
            const form = document.getElementById('regularDonationForm');
            const editingId = form ? form.dataset.editingId : null;
            const isEditing = !!editingId;
            
            const frequencyText = frequency === 'monthly' ? 'Каждый месяц' : frequency === 'weekly' ? 'Каждую неделю' : 'Каждый квартал';
            
            if (isEditing) {
                // Обновление существующего пожертвования
                const donation = regularDonations.find(rd => rd.id === parseInt(editingId));
                if (donation) {
                    donation.amount = amount;
                    donation.frequency = frequency;
                    donation.frequencyText = frequencyText;
                    donation.purpose = purpose;
                    donation.updatedAt = new Date().toISOString();
                    
                    localStorage.setItem(regularDonationsKey, JSON.stringify(regularDonations));
                    
                    if (typeof showMessage === 'function') {
                        showMessage('Регулярное пожертвование обновлено!', 'success');
                    } else {
                        alert('Регулярное пожертвование обновлено!');
                    }
                }
            } else {
                // Создание нового пожертвования
                const maxId = regularDonations.length > 0 
                    ? Math.max(...regularDonations.map(rd => rd.id || 0))
                    : 0;
                
                const newDonation = {
                    id: maxId + 1,
                    amount: amount,
                    frequency: frequency,
                    frequencyText: frequencyText,
                    purpose: purpose,
                    status: 'active',
                    createdAt: new Date().toISOString()
                };
                
                regularDonations.push(newDonation);
                localStorage.setItem(regularDonationsKey, JSON.stringify(regularDonations));
                
                if (typeof showMessage === 'function') {
                    showMessage('Подписка на регулярное пожертвование оформлена!', 'success');
                } else {
                    alert('Подписка на регулярное пожертвование оформлена!');
                }
            }
            
            closeRegularDonationModal();
            loadRegularDonations();
        });
    }
});

// Добавление CSS для страницы профиля
const profileStyles = document.createElement('style');
profileStyles.textContent = `
    .profile-section {
        padding: 4rem 0;
        background-color: var(--secondary-color);
    }
    
    .profile-content {
        display: grid;
        gap: 2rem;
    }
    
    .profile-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
        display: flex;
        gap: 2rem;
        align-items: center;
    }
    
    .profile-avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background-color: var(--secondary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
    }
    
    .avatar-placeholder {
        color: var(--text-light);
    }
    
    .profile-details h2 {
        color: var(--text-color);
        margin-bottom: 0.5rem;
    }
    
    .profile-phone,
    .profile-email {
        color: var(--text-light);
        margin-bottom: 0.25rem;
    }
    
    .profile-stats {
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
    }
    
    .profile-stats .stat {
        text-align: center;
    }
    
    .profile-stats .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 0.25rem;
    }
    
    .profile-stats .stat-label {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .stat-clickable {
        cursor: pointer;
        transition: var(--transition);
        border-radius: var(--border-radius);
        padding: 0.5rem;
        margin: -0.5rem;
    }
    
    .stat-clickable:hover {
        background-color: rgba(76, 175, 80, 0.05);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
    }
    
    .stat-clickable:active {
        transform: translateY(0);
    }
    
    .donation-history,
    .applications,
    .regular-donations {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
    }
    
    .donation-history h3,
    .applications h3,
    .regular-donations h3 {
        color: var(--text-color);
        margin-bottom: 1.5rem;
    }
    
    .donation-list,
    .application-list,
    .regular-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .donation-item,
    .application-item,
    .regular-item {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
        background-color: var(--secondary-color);
        border-radius: var(--border-radius);
    }
    
    .donation-date,
    .application-date {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .donation-amount {
        font-weight: 700;
        color: var(--primary-color);
    }
    
    .donation-purpose,
    .application-animal {
        color: var(--text-color);
    }
    
    .donation-status,
    .application-status,
    .regular-status {
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        text-align: center;
    }
    
    .donation-status.completed,
    .application-status.approved,
    .regular-status.active {
        background-color: var(--primary-color);
        color: var(--white);
    }
    
    .application-status.pending {
        background-color: #ff9800;
        color: var(--white);
    }
    
    .regular-item {
        grid-template-columns: 1fr 1fr 1fr 1fr auto;
    }
    
    .regular-amount {
        font-weight: 700;
        color: var(--primary-color);
    }
    
    .regular-frequency {
        color: var(--text-color);
    }
    
    .regular-purpose {
        color: var(--text-color);
    }
    
    .btn-small {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }
    
    .profile-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    @media (max-width: 768px) {
        .profile-card {
            flex-direction: column;
            text-align: center;
        }
        
        .donation-item,
        .application-item,
        .regular-item {
            grid-template-columns: 1fr;
            text-align: center;
        }
        
        .profile-actions {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(profileStyles);
