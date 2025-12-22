// Функциональность страницы "Как помочь"

// Функции модальных окон
function openMaterialModal() {
    const modal = document.getElementById('materialModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeMaterialModal() {
    const modal = document.getElementById('materialModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function openVolunteerModal() {
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Автозаполнение формы данными из профиля, если пользователь авторизован
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (isLoggedIn) {
            const userName = localStorage.getItem('userName') || '';
            const userPhone = localStorage.getItem('userPhone') || '';
            const userEmail = localStorage.getItem('userEmail') || '';
            
            const nameInput = document.getElementById('volunteerName');
            const phoneInput = document.getElementById('volunteerPhone');
            const emailInput = document.getElementById('volunteerEmail');
            
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
            const nameInput = document.getElementById('volunteerName');
            if (nameInput) {
                nameInput.readOnly = false;
            }
        }
    }
}

function closeVolunteerModal() {
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        const form = document.getElementById('volunteerForm');
        if (form) {
            form.reset();
            // Сбрасываем readOnly при закрытии
            const nameInput = document.getElementById('volunteerName');
            if (nameInput) {
                nameInput.readOnly = false;
            }
        }
    }
}

function openProfessionalModal() {
    const modal = document.getElementById('professionalModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Автозаполнение формы данными из профиля, если пользователь авторизован
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (isLoggedIn) {
            const userName = localStorage.getItem('userName') || '';
            const userPhone = localStorage.getItem('userPhone') || '';
            const userEmail = localStorage.getItem('userEmail') || '';
            
            const nameInput = document.getElementById('professionalName');
            const phoneInput = document.getElementById('professionalPhone');
            const emailInput = document.getElementById('professionalEmail');
            
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
            const nameInput = document.getElementById('professionalName');
            if (nameInput) {
                nameInput.readOnly = false;
            }
        }
    }
}

function closeProfessionalModal() {
    const modal = document.getElementById('professionalModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        const form = document.getElementById('professionalForm');
        if (form) {
            form.reset();
            // Сбрасываем readOnly при закрытии
            const nameInput = document.getElementById('professionalName');
            if (nameInput) {
                nameInput.readOnly = false;
            }
        }
    }
}

// Функция поделиться приютом
function shareShelter() {
    if (navigator.share) {
        navigator.share({
            title: 'Дом Лап - Приют для животных',
            text: 'Помогите животным найти дом! Посетите сайт приюта "Дом Лап"',
            url: window.location.origin
        });
    } else {
        // Резервный вариант для браузеров, которые не поддерживают Web Share API
        const shareText = 'Помогите животным найти дом! Посетите сайт приюта "Дом Лап" - ' + window.location.origin;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                showMessage('Ссылка скопирована в буфер обмена!', 'success');
            });
        } else {
            // Резервный вариант для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showMessage('Ссылка скопирована в буфер обмена!', 'success');
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Ожидание доступности applicationsDB
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts && !window.applicationsDB) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // Если на страницу "Как помочь" пришли с параметром ?volunteer=1,
    // автоматически открываем окно с анкетой волонтёра
    const params = new URLSearchParams(window.location.search);
    if (params.get('volunteer') === '1') {
        openVolunteerModal();
    }
    
    // Отправка формы волонтера
    const volunteerForm = document.getElementById('volunteerForm');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (validateForm(this)) {
                try {
                    // Получение данных формы
                    const name = document.getElementById('volunteerName').value.trim();
                    const phone = document.getElementById('volunteerPhone').value.trim();
                    const email = document.getElementById('volunteerEmail').value.trim();
                    const age = document.getElementById('volunteerAge').value;
                    const experience = document.getElementById('volunteerExperience').value.trim();
                    const availability = document.getElementById('volunteerAvailability').value.trim();
                    const motivation = document.getElementById('volunteerMotivation').value.trim();
                    
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
                    
                    // Создание заявки
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
                        
                        // Закрытие модального окна формы
                        closeVolunteerModal();
                        this.reset();
                        
                        // Показ модального окна успеха
                        showVolunteerSuccessModal({
                            fullName: finalName,
                            phone: phone,
                            email: email
                        });
                    } else {
                        showMessage('Ошибка: база данных недоступна', 'error');
                    }
                } catch (error) {
                    console.error('Error submitting volunteer application:', error);
                    showMessage('Ошибка при отправке заявки', 'error');
                }
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля.', 'error');
            }
        });
    }
    
    // Отправка формы профессиональной помощи
    const professionalForm = document.getElementById('professionalForm');
    if (professionalForm) {
        professionalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (validateForm(this)) {
                try {
                    // Получение данных формы
                    const name = document.getElementById('professionalName').value.trim();
                    const phone = document.getElementById('professionalPhone').value.trim();
                    const email = document.getElementById('professionalEmail').value.trim();
                    const service = document.getElementById('professionalService').value;
                    const description = document.getElementById('professionalDescription').value.trim();
                    
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
                    
                    // Создание заявки
                    if (window.applicationsDB && window.applicationsDB.addApplication) {
                        const application = {
                            type: 'Профессиональная помощь',
                            userName: finalName,
                            userPhone: phone,
                            userEmail: email,
                            userId: userId,
                            service: service,
                            description: description,
                            date: new Date().toISOString().split('T')[0],
                            status: 'pending',
                            statusRu: 'На рассмотрении',
                            statusEn: 'Pending',
                            viewed: false,
                            animalId: null,
                            animalName: '-'
                        };
                        
                        window.applicationsDB.addApplication(application);
                        showMessage('Ваше предложение успешно отправлено! Мы свяжемся с вами для обсуждения деталей.', 'success');
                        closeProfessionalModal();
                        this.reset();
                    } else {
                        showMessage('Ошибка: база данных недоступна', 'error');
                    }
                } catch (error) {
                    console.error('Error submitting professional application:', error);
                    showMessage('Ошибка при отправке заявки', 'error');
                }
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля.', 'error');
            }
        });
    }
    
    // Закрытие модальных окон при клике вне их
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Закрытие модальных окон клавишей Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
            // Также закрываем модальное окно успеха
            const volunteerSuccessModal = document.getElementById('volunteerSuccessModal');
            if (volunteerSuccessModal && volunteerSuccessModal.style.display === 'flex') {
                closeVolunteerSuccessModal();
            }
        }
    });
    
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
            window.location.href = 'profile.html';
        });
    }
    
    // Закрытие модального окна при клике вне его
    const volunteerSuccessModal = document.getElementById('volunteerSuccessModal');
    if (volunteerSuccessModal) {
        volunteerSuccessModal.addEventListener('click', function(e) {
            if (e.target === volunteerSuccessModal) {
                closeVolunteerSuccessModal();
            }
        });
    }
});

// Показ модального окна успешной заявки волонтера
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

// Закрытие модального окна успешной заявки волонтера
function closeVolunteerSuccessModal() {
    const volunteerSuccessModal = document.getElementById('volunteerSuccessModal');
    if (!volunteerSuccessModal) return;
    volunteerSuccessModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}
