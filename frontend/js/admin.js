// Функциональность админ-панели

document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации администратора
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (!isAdminLoggedIn) {
        // Перенаправление на вход или показ запроса на вход
        showAdminLogin();
    }
    
    // Инициализация админ-панели
    initializeDashboard();
});

// Показ модального окна входа администратора
function showAdminLogin() {
    // Создание модального окна входа, если оно не существует
    let loginModal = document.getElementById('adminLoginModal');
    if (!loginModal) {
        loginModal = document.createElement('div');
        loginModal.id = 'adminLoginModal';
        loginModal.className = 'modal';
        loginModal.style.display = 'flex';
        loginModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h2>Вход в админ-панель</h2>
                <form id="adminLoginForm">
                    <div class="form-group">
                        <label for="adminUsername">Логин:</label>
                        <input type="text" id="adminUsername" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="adminPassword">Пароль:</label>
                        <input type="password" id="adminPassword" required autocomplete="current-password">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Войти</button>
                        <a href="index.html" class="btn btn-secondary">Отмена</a>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(loginModal);
        
        // Обработка отправки формы
        document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            // Простая аутентификация (в реальном приложении это было бы на стороне сервера)
            if (username === 'admin' && password === 'admin123') {
                localStorage.setItem('adminLoggedIn', 'true');
                loginModal.style.display = 'none';
                showMessage('Добро пожаловать в админ-панель!', 'success');
                initializeDashboard();
            } else {
                showMessage('Неверные данные для входа', 'error');
            }
        });
    } else {
        loginModal.style.display = 'flex';
    }
}

// Инициализация панели управления
async function initializeDashboard() {
    // Загрузка данных панели управления
    await loadStats();
    loadRecentDonations();
    loadApplications();
    loadContent();
    loadVolunteers();
}

// Загрузка таблицы животных
async function loadAnimalsTable() {
    try {
        const animals = await window.animalsDB.getAllAnimals();
        const tableBody = document.querySelector('#animals-tab tbody');
        
        if (!tableBody) return;
        
        // Разделяем на животных в приюте и усыновленных
        const availableAnimals = animals.filter(a => a.status === 'available');
        const adoptedAnimals = animals.filter(a => a.status === 'adopted');
        
        // Сортируем по дате (новые сверху)
        availableAnimals.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
        adoptedAnimals.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
        
        let html = '';
        
        // Животные в приюте (сверху)
        if (availableAnimals.length > 0) {
            html += `
                <tr class="section-header">
                    <td colspan="6" style="background-color: var(--primary-color); color: white; font-weight: 600; padding: 1rem;">
                        Животные в приюте (${availableAnimals.length})
                    </td>
                </tr>
            `;
            html += availableAnimals.map(animal => createAnimalRow(animal)).join('');
        }
        
        // Усыновленные животные (снизу)
        if (adoptedAnimals.length > 0) {
            html += `
                <tr class="section-header">
                    <td colspan="6" style="background-color: var(--text-light); color: white; font-weight: 600; padding: 1rem; margin-top: 1rem;">
                        Усыновленные животные (${adoptedAnimals.length})
                    </td>
                </tr>
            `;
            html += adoptedAnimals.map(animal => createAnimalRow(animal)).join('');
        }
        
        tableBody.innerHTML = html;
    } catch (error) {
        console.error('Error loading animals table:', error);
    }
}

function createAnimalRow(animal) {
            const statusClass = animal.status === 'available' ? 'available' : 'adopted';
            const statusText = animal.status === 'available' ? 'В приюте' : 'Усыновлен';
            
            return `
                <tr>
            <td><img src="images/${animal.photos[0] || 'animal-placeholder.svg'}" alt="${animal.name}" class="table-img" onerror="this.src='images/animal-placeholder.svg'"></td>
                    <td>${animal.name}</td>
            <td>${animal.speciesRu || animal.species}</td>
            <td>${animal.ageText || animal.age}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-outline btn-small" onclick="editAnimal(${animal.id})">Редактировать</button>
                        <button class="btn btn-secondary btn-small" onclick="deleteAnimal(${animal.id})">Удалить</button>
                    </td>
                </tr>
            `;
}

// Функция редактирования животного
async function editAnimal(animalId) {
    try {
        // Преобразование в число, если необходимо
        const id = typeof animalId === 'string' ? parseInt(animalId) : animalId;
        
        if (!window.animalsDB) {
            showMessage('База данных животных недоступна', 'error');
            return;
        }
        
        const animals = await window.animalsDB.getAllAnimals();
        const animal = animals.find(a => a.id === id || a.id === animalId);
        
        if (!animal) {
            console.error('Animal not found. ID:', id, 'Available IDs:', animals.map(a => a.id));
            showMessage('Животное не найдено', 'error');
            return;
        }
        
        // Заполнение формы данными животного
        const nameField = document.getElementById('animalName');
        const speciesField = document.getElementById('animalSpecies');
        const ageValueField = document.getElementById('animalAgeValue');
        const ageUnitField = document.getElementById('animalAgeUnit');
        const genderField = document.getElementById('animalGender');
        const descriptionField = document.getElementById('animalDescription');
        const statusField = document.getElementById('animalStatus');
        
        if (nameField) nameField.value = animal.name || '';
        if (speciesField) speciesField.value = animal.species || '';
        
        // Парсинг возраста из ageText (например, "2 года" или "2 месяца")
        if (ageValueField && ageUnitField && animal.ageText) {
            const ageText = animal.ageText.toLowerCase();
            const ageMatch = ageText.match(/(\d+)/);
            if (ageMatch) {
                ageValueField.value = ageMatch[1];
                if (ageText.includes('месяц') || ageText.includes('мес')) {
                    ageUnitField.value = 'months';
                } else {
                    ageUnitField.value = 'years';
                }
            } else if (animal.age) {
                ageValueField.value = animal.age;
                ageUnitField.value = 'years';
            }
        }
        
        if (genderField) genderField.value = animal.gender || '';
        if (descriptionField) descriptionField.value = animal.description || '';
        if (statusField) statusField.value = animal.status || 'available';
        
        // Заполнение новых полей
        const breedField = document.getElementById('animalBreed');
        const traitsField = document.getElementById('animalTraits');
        const healthStatusField = document.getElementById('animalHealthStatus');
        const arrivalDateField = document.getElementById('animalArrivalDate');
        const vaccinatedField = document.getElementById('animalVaccinated');
        const sterilizedField = document.getElementById('animalSterilized');
        
        if (breedField) breedField.value = animal.breed || '';
        if (traitsField && animal.traits && Array.isArray(animal.traits)) {
            traitsField.value = animal.traits.join(', ');
        }
        if (healthStatusField) healthStatusField.value = animal.healthStatus || 'Здоров';
        if (arrivalDateField) arrivalDateField.value = animal.arrivalDate || '';
        if (vaccinatedField) vaccinatedField.checked = animal.vaccinated || false;
        if (sterilizedField) sterilizedField.checked = animal.sterilized || false;
        
        // Сохранение ID редактирования
        const form = document.getElementById('animalForm');
        if (form) {
            form.dataset.editingId = id;
        }
        
        // Изменение заголовка модального окна
        const modalTitle = document.querySelector('#animalModal h2');
        if (modalTitle) modalTitle.textContent = 'Редактировать животное';
        
        // Изменение кнопки отправки
        const submitBtn = document.querySelector('#animalForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Сохранить изменения';
        
        // Открытие модального окна
        openAnimalModal();
    } catch (error) {
        console.error('Error editing animal:', error);
        console.error('Error details:', error.stack);
        showMessage('Ошибка при загрузке данных животного: ' + error.message, 'error');
    }
}

// Функция удаления животного
async function deleteAnimal(animalId) {
    if (!confirm('Вы уверены, что хотите удалить это животное? Это действие нельзя отменить.')) {
        return;
    }
    
    try {
        // В реальной реализации это удалило бы с сервера
        showMessage('Животное удалено', 'success');
        await loadAnimalsTable();
        await loadStats(); // Обновление статистики
    } catch (error) {
        console.error('Error deleting animal:', error);
        showMessage('Ошибка при удалении животного', 'error');
    }
}

// Делаем функции глобально доступными
window.editAnimal = editAnimal;
window.deleteAnimal = deleteAnimal;

// Загрузка статистики
async function loadStats() {
    try {
        // Загрузка реальных данных из баз данных
        // Используем только животных в приюте (не усыновленных)
        const animalsCount = await window.animalsDB.getAvailableAnimalsCount();
        const availableCount = animalsCount; // Это одно и то же - только доступные
        
        // Загрузка данных пожертвований - используем ту же логику, что и график
        let monthlyDonations = 0;
        let newApplicationsCount = 0;
        
        const currentMonth = new Date().getMonth(); // 0-11 для JavaScript
        const currentYear = new Date().getFullYear();
        const excludeNames = ['влад', 'nikita', 'никита'];
        
        // Загружаем данные из API (как в графике)
        try {
            const response = await fetch(`http://localhost:5000/api/admin/donations?limit=1000`);
            if (response.ok) {
                const allApiDonations = await response.json();
                const apiDonations = allApiDonations.filter(d => {
                    // В тестовом режиме считаем pending, completed и succeeded как завершенные
                    const status = (d.status || '').toLowerCase();
                    const statusOk = status === 'succeeded' || status === 'completed' || status === 'pending';
                    const publicName = (d.public_name || '').toLowerCase();
                    const isFake = excludeNames.some(name => publicName.includes(name));
                    const dateStr = d.paid_at || d.created_at;
                    if (!dateStr) return false;
                    const donationDate = new Date(dateStr);
                    if (isNaN(donationDate.getTime())) return false;
                    const sameMonth = donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
                    return statusOk && !isFake && sameMonth;
                });
                
                monthlyDonations = apiDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
                console.log('Monthly donations from API:', monthlyDonations);
            }
        } catch (error) {
            console.warn('API недоступен, используем локальные данные:', error);
        }
        
        // Также проверяем локальную БД и объединяем данные (как в графике)
        if (window.donationsDB) {
            if (typeof window.donationsDB.loadDonationsData === 'function') {
                await window.donationsDB.loadDonationsData(true);
            }
            
            const allLocalDonations = await window.donationsDB.getAllDonations();
            const localDonations = allLocalDonations.filter(d => {
                // В тестовом режиме считаем pending, completed и succeeded как завершенные
                const status = (d.status || '').toLowerCase();
                const isCompleted = status === 'completed' || status === 'succeeded' || status === 'pending';
                if (!isCompleted) return false;
                
                if (!d.date) return false;
                const donationDate = new Date(d.date);
                if (isNaN(donationDate.getTime())) return false;
                
                const userName = (d.userName || '').toLowerCase();
                const publicName = (d.public_name || '').toLowerCase();
                const isFake = excludeNames.some(name => 
                    userName.includes(name) || publicName.includes(name)
                );
                
                return !isFake && donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
            });
            
            const localTotal = localDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
            console.log('Monthly donations from local DB:', localTotal);
            
            // Объединяем: используем максимум из API и локальных данных
            // (API данные имеют приоритет, но если локальных больше - используем их)
            monthlyDonations = Math.max(monthlyDonations, localTotal);
        }
        
        if (window.applicationsDB) {
            newApplicationsCount = await window.applicationsDB.getNewApplicationsCount();
        }
        
        let volunteersCount = 8;
        if (window.volunteersDB) {
            volunteersCount = await window.volunteersDB.getVolunteersCount();
        }
        
        const stats = {
            animals: animalsCount,
            donations: monthlyDonations,
            applications: newApplicationsCount,
            volunteers: volunteersCount
        };
        
        // Обновление чисел статистики с анимацией
        animateStats(stats);
        
        // Обновление статистики пожертвований напрямую с отформатированным значением
        const donationsStat = document.querySelectorAll('.stats-overview .stat-number')[1];
        if (donationsStat) {
            donationsStat.textContent = monthlyDonations.toLocaleString('ru-RU') + ' ₽';
        }
        
        // Загрузка таблицы животных
        loadAnimalsTable();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Анимация статистики
function animateStats(stats) {
    const statNumbers = document.querySelectorAll('.stats-overview .stat-number');
    
    statNumbers.forEach((stat, index) => {
        const target = Object.values(stats)[index];
        if (index === 1) {
            // Для пожертвований форматируем с валютой
            animateNumber(stat, target, true);
        } else {
            animateNumber(stat, target, false);
        }
    });
}

// Анимация подсчета чисел
function animateNumber(element, target, isCurrency = false) {
    // Для пожертвований устанавливаем напрямую без анимации для точности
    if (isCurrency) {
        element.textContent = target.toLocaleString('ru-RU') + ' ₽';
        return;
    }
    
    let current = 0;
    const increment = target / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 30);
}

// Маппинг назначений платежа с английского на русский
const purposeMap = {
    'food': 'Корм для животных',
    'medical': 'Ветеринарное лечение',
    'maintenance': 'Содержание приюта',
    'general': 'Общие нужды',
    'Корм для животных': 'Корм для животных',
    'Ветеринарное лечение': 'Ветеринарное лечение',
    'Содержание приюта': 'Содержание приюта',
    'Общие нужды': 'Общие нужды'
};

// Функция перевода назначения платежа
function translatePurpose(purpose) {
    if (!purpose) return 'Общие нужды';
    return purposeMap[purpose] || purpose;
}

// Загрузка последних пожертвований из API
async function loadRecentDonations() {
    try {
        // Принудительно перезагружаем данные из localStorage
        if (window.donationsDB && typeof window.donationsDB.loadDonationsData === 'function') {
            await window.donationsDB.loadDonationsData(true);
        }
        
        // Сначала пытаемся загрузить из API
        let donations = [];
        try {
            const response = await fetch('http://localhost:5000/api/admin/donations?limit=10');
            if (response.ok) {
                donations = await response.json();
                // Переводим назначения для данных из API
                donations = donations.map(d => ({
                    ...d,
                    purpose: translatePurpose(d.purpose)
                }));
            }
        } catch (apiError) {
            console.warn('API недоступен, используем локальные данные:', apiError);
            // Резервный вариант - локальная БД
            if (window.donationsDB) {
                const allDonations = await window.donationsDB.getAllDonations();
                const excludeNames = ['влад', 'nikita', 'никита'];
                // Фильтруем старые фейковые данные
                const filteredDonations = allDonations.filter(d => {
                    const userName = (d.userName || '').toLowerCase();
                    const publicName = (d.public_name || '').toLowerCase();
                    const isFake = excludeNames.some(name => 
                        userName.includes(name) || publicName.includes(name)
                    );
                    return !isFake;
                });
                
                donations = filteredDonations.slice(0, 10).map(d => ({
                    id: d.id,
                    public_name: d.userName || 'Анонимно',
                    amount: d.amount,
                    purpose: translatePurpose(d.purpose), // Переводим назначение
                    status: d.status === 'completed' ? 'succeeded' : d.status,
                    paid_at: d.date || d.created_at,
                    created_at: d.date || d.created_at,
                    phone: d.userPhone || '', // Добавляем телефон для админки
                    email: d.userEmail || '' // Добавляем email для админки
                }));
            }
        }
        
        const donationsList = document.querySelector('.recent-donations .donation-list');
        if (donationsList) {
            if (donations.length === 0) {
                donationsList.innerHTML = '<tr class="donation-item"><td colspan="5" style="text-align: center; padding: 2rem;">Нет донатов</td></tr>';
            } else {
                donationsList.innerHTML = donations.map(donation => {
                    const date = donation.paid_at || donation.created_at;
                    const dateObj = date ? new Date(date) : new Date();
                    const formattedDate = dateObj.toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    // В тестовом режиме считаем и pending, и succeeded как завершенные
                    const rawStatus = donation.status || '';
                    const statusKey = rawStatus.toLowerCase();
                    const normalizedStatus = (statusKey === 'pending') ? 'succeeded' : statusKey;
                    const statusText = normalizedStatus === 'succeeded' ? 'Завершено' : 
                                       normalizedStatus === 'failed' ? 'Ошибка' : rawStatus;
                    const statusClass = normalizedStatus === 'succeeded' ? 'completed' : normalizedStatus;
                    
                    // В админке показываем полные данные (телефон, email)
                    const phone = donation.phone || '';
                    const email = donation.email || '';
                    const fullName = donation.public_name || 'Анонимно';
                    
                    return `
                        <tr class="donation-item">
                            <td class="donation-date">${formattedDate}</td>
                            <td class="donation-amount">${donation.amount.toLocaleString('ru-RU')} ₽</td>
                            <td class="donation-donor">
                                <strong>${fullName}</strong>
                                ${phone ? `<div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.25rem;">📞 ${phone}</div>` : ''}
                                ${email ? `<div style="font-size: 0.85rem; color: var(--text-light);">📧 ${email}</div>` : ''}
                            </td>
                            <td class="donation-purpose">${donation.purpose}</td>
                            <td class="donation-status ${statusClass}">${statusText}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
        // Загрузка графика
        loadDonationsChart();
    } catch (error) {
        console.error('Error loading recent donations:', error);
    }
}

// Текущий выбранный месяц для графика (по умолчанию: текущий месяц)
let selectedChartMonth = new Date().getMonth();
let selectedChartYear = new Date().getFullYear();

// Загрузка графика пожертвований (используем API донатов или локальную БД)
async function loadDonationsChart(month = null, year = null) {
    try {
        // Использование предоставленного месяца/года или текущего выбранного
        const targetMonth = month !== null ? month : selectedChartMonth;
        const targetYear = year !== null ? year : selectedChartYear;
        
        // Обновление выбранного месяца/года
        selectedChartMonth = targetMonth;
        selectedChartYear = targetYear;
        
        // Обновление отображения месяца
        updateMonthDisplay(targetMonth, targetYear);
        
        let donationsByDay = {};
        let totalAmount = 0;
        const excludeNames = ['влад', 'nikita', 'никита'];
        
        // 1. Загружаем данные из локальной БД (старые данные могут быть только здесь)
        let localDonations = [];
        if (window.donationsDB) {
            // Принудительно перезагружаем данные из localStorage
            if (typeof window.donationsDB.loadDonationsData === 'function') {
                await window.donationsDB.loadDonationsData(true);
            }
            
            const allLocalDonations = await window.donationsDB.getAllDonations();
            console.log('График: Всего локальных донатов:', allLocalDonations.length);
            console.log('График: Примеры локальных донатов:', allLocalDonations.slice(0, 3).map(d => ({
                id: d.id,
                status: d.status,
                date: d.date,
                amount: d.amount,
                name: d.userName
            })));
            
            localDonations = allLocalDonations.filter(d => {
                // В тестовом режиме считаем pending, completed и succeeded как завершенные
                const status = (d.status || '').toLowerCase();
                const isCompleted = status === 'completed' || status === 'succeeded' || status === 'pending';
                if (!isCompleted) {
                    console.log('График: Локальный донат пропущен по статусу:', d.id, status);
                    return false;
                }
                
                if (!d.date) {
                    console.log('График: Локальный донат без даты пропущен:', d.id);
                    return false;
                }
                const donationDate = new Date(d.date);
                if (isNaN(donationDate.getTime())) {
                    console.log('График: Некорректная дата локального доната:', d.id, d.date);
                    return false;
                }
                
                const userName = (d.userName || '').toLowerCase();
                const publicName = (d.public_name || '').toLowerCase();
                const isFake = excludeNames.some(name => 
                    userName.includes(name) || publicName.includes(name)
                );
                
                const sameMonth = donationDate.getMonth() === targetMonth && donationDate.getFullYear() === targetYear;
                const result = !isFake && sameMonth;
                if (!result && !isFake) {
                    console.log('График: Локальный донат не подходит по месяцу:', d.id, 'Дата:', donationDate.toISOString(), 'Целевой месяц:', targetMonth + 1, targetYear);
                }
                return result;
            });
        }
        
        // 2. Пытаемся загрузить данные из API (новые данные)
        let apiDonations = [];
        try {
            const response = await fetch(`http://localhost:5000/api/admin/donations?limit=1000`);
            if (response.ok) {
                const allApiDonations = await response.json();
                console.log('График: Всего донатов из API:', allApiDonations.length);
                console.log('График: Примеры донатов из API:', allApiDonations.slice(0, 3).map(d => ({
                    id: d.id,
                    status: d.status,
                    date: d.paid_at || d.created_at,
                    amount: d.amount,
                    name: d.public_name
                })));
                
                apiDonations = allApiDonations.filter(d => {
                    // В тестовом режиме считаем pending, completed и succeeded как завершенные
                    const status = (d.status || '').toLowerCase();
                    const statusOk = status === 'succeeded' || status === 'completed' || status === 'pending';
                    const publicName = (d.public_name || '').toLowerCase();
                    const isFake = excludeNames.some(name => publicName.includes(name));
                    const dateStr = d.paid_at || d.created_at;
                    if (!dateStr) {
                        console.log('График: Донат без даты пропущен:', d.id);
                        return false;
                    }
                    const donationDate = new Date(dateStr);
                    if (isNaN(donationDate.getTime())) {
                        console.log('График: Некорректная дата доната:', d.id, dateStr);
                        return false;
                    }
                    const sameMonth = donationDate.getMonth() === targetMonth && donationDate.getFullYear() === targetYear;
                    const result = statusOk && !isFake && sameMonth;
                    if (!result && statusOk && !isFake) {
                        console.log('График: Донат не подходит по месяцу:', d.id, 'Дата:', donationDate.toISOString(), 'Целевой месяц:', targetMonth + 1, targetYear);
                    }
                    return result;
                });
            } else {
                console.warn('График: API вернул ошибку:', response.status, response.statusText);
            }
        } catch (apiError) {
            console.warn('API недоступен для графика, используем только локальные данные:', apiError);
        }
        
        // 3. Объединяем данные: используем ID для дедупликации, если ID нет - используем комбинацию дата+сумма+имя+время
        const donationsMap = new Map();
        let donationCounter = 0; // Счетчик для донатов без ID
        
        // Сначала добавляем данные из API (новые, имеют приоритет)
        apiDonations.forEach(d => {
            const dateStr = d.paid_at || d.created_at;
            const donationDate = new Date(dateStr);
            // Используем ID если есть, иначе создаем уникальный ключ с временем
            const key = d.id ? `api_${d.id}` : `api_${dateStr}_${d.amount}_${(d.public_name || '').toLowerCase()}_${donationCounter++}`;
            
            if (!donationsMap.has(key)) {
                donationsMap.set(key, {
                    date: dateStr,
                    amount: d.amount || 0,
                    day: donationDate.getDate()
                });
            }
        });
        
        // Затем добавляем локальные данные (старые), которые еще не были обработаны
        localDonations.forEach(d => {
            const donationDate = new Date(d.date);
            // Используем ID если есть, иначе создаем уникальный ключ с временем
            const key = d.id ? `local_${d.id}` : `local_${d.date}_${d.amount}_${(d.userName || '').toLowerCase()}_${donationCounter++}`;
            
            // Добавляем только если такого доната еще нет (API данные имеют приоритет)
            // Проверяем, нет ли такого же доната в API по ID
            const apiKey = d.id ? `api_${d.id}` : null;
            if (!apiKey || !donationsMap.has(apiKey)) {
                if (!donationsMap.has(key)) {
                    donationsMap.set(key, {
                        date: d.date,
                        amount: d.amount || 0,
                        day: donationDate.getDate()
                    });
                }
            }
        });
        
        // Преобразуем Map в массив
        const allMonthlyDonations = Array.from(donationsMap.values());
        
        // 4. Группируем по дням и считаем сумму
        allMonthlyDonations.forEach(d => {
            if (!donationsByDay[d.day]) {
                donationsByDay[d.day] = 0;
            }
            donationsByDay[d.day] += d.amount;
        });
        
        totalAmount = allMonthlyDonations.reduce((sum, d) => sum + d.amount, 0);
        
        // Логируем данные для отладки
        console.log('График: Месяц:', targetMonth + 1, 'Год:', targetYear);
        console.log('График: Локальных донатов за месяц:', localDonations.length);
        console.log('График: API донатов за месяц:', apiDonations.length);
        console.log('График: Всего уникальных донатов:', allMonthlyDonations.length);
        console.log('График: Детали донатов:', allMonthlyDonations.map(d => ({ day: d.day, amount: d.amount, date: d.date })));
        console.log('График: Пожертвований по дням:', Object.keys(donationsByDay).length);
        console.log('График: Данные по дням:', donationsByDay);
        console.log('График: Общая сумма:', totalAmount);
        
        // Дополнительная отладка: показываем распределение по дням
        const daysWithDonations = Object.keys(donationsByDay).map(Number).sort((a, b) => a - b);
        console.log('График: Дни с донатами:', daysWithDonations);
        daysWithDonations.forEach(day => {
            console.log(`  День ${day}: ${donationsByDay[day].toLocaleString('ru-RU')} ₽`);
        });
        
        // Отрисовка графика
        const canvas = document.getElementById('donationsChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth || 800;
        const height = 400;
        canvas.width = width;
        canvas.height = height;
        
        // Очистка холста
        ctx.clearRect(0, 0, width, height);
        
        // Отрисовка осей
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, height - 50);
        ctx.lineTo(width - 50, height - 50);
        ctx.moveTo(50, 50);
        ctx.lineTo(50, height - 50);
        ctx.stroke();
        
        // Поиск максимального значения
        const maxAmount = Math.max(...Object.values(donationsByDay), 1);
        const days = Object.keys(donationsByDay).map(Number).sort((a, b) => a - b);
        
        // Получение количества дней в месяце
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        
        // Отрисовка столбцов
        const barWidth = (width - 100) / daysInMonth;
        ctx.fillStyle = '#4CAF50';
        
        // Отрисовка столбцов для всех дней месяца (даже если нет пожертвований)
        for (let day = 1; day <= daysInMonth; day++) {
            const amount = donationsByDay[day] || 0;
            const barHeight = maxAmount > 0 ? (amount / maxAmount) * (height - 100) : 0;
            const x = 50 + (day - 1) * barWidth + 5;
            const y = height - 50 - barHeight;
            
            // Отрисовываем столбец только если есть пожертвования
            if (amount > 0) {
                ctx.fillRect(x, y, barWidth - 10, barHeight);
                
                // Отрисовка значения
                ctx.fillStyle = '#333';
                ctx.font = '11px Arial';
                ctx.textAlign = 'center';
                if (barHeight > 20) {
                    ctx.fillText(amount.toLocaleString('ru-RU') + '₽', x + (barWidth - 10) / 2, y - 5);
                }
            }
            
            // Отрисовка метки дня (каждые 5 дней или последний день)
            if (day % 5 === 0 || day === daysInMonth || day === 1) {
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial';
                ctx.fillText(day, x + (barWidth - 10) / 2, height - 35);
            }
            ctx.fillStyle = '#4CAF50';
        }
        
        // Отрисовка заголовка
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        ctx.fillText(`Донаты по дням месяца - ${monthNames[targetMonth]} ${targetYear}`, width / 2, 30);
        
        // Показ итога за месяц
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`Всего за месяц: ${totalAmount.toLocaleString('ru-RU')} ₽`, width / 2, 50);
        
        // Показ сообщения, если нет пожертвований
        if (totalAmount === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '18px Arial';
            ctx.fillText('Нет донатов за этот месяц', width / 2, height / 2);
        }
    } catch (error) {
        console.error('Error loading donations chart:', error);
    }
}

// Обновление отображения месяца
function updateMonthDisplay(month, year) {
    const monthDisplay = document.getElementById('currentMonthDisplay');
    if (monthDisplay) {
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        monthDisplay.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Обновление состояний кнопок
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    
    // Отключение кнопки "Далее", если просматриваем будущие месяцы
    if (nextBtn) {
        if (year > currentYear || (year === currentYear && month >= currentMonth)) {
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        } else {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }
}

// Изменение месяца для графика
function changeMonth(direction) {
    selectedChartMonth += direction;
    
    // Обработка переполнения месяца
    if (selectedChartMonth < 0) {
        selectedChartMonth = 11;
        selectedChartYear--;
    } else if (selectedChartMonth > 11) {
        selectedChartMonth = 0;
        selectedChartYear++;
    }
    
    // Не разрешаем будущие месяцы
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    if (selectedChartYear > currentYear || (selectedChartYear === currentYear && selectedChartMonth > currentMonth)) {
        selectedChartMonth = currentMonth;
        selectedChartYear = currentYear;
        return;
    }
    
    loadDonationsChart(selectedChartMonth, selectedChartYear);
}

// Переход к текущему месяцу
function goToCurrentMonth() {
    const currentDate = new Date();
    selectedChartMonth = currentDate.getMonth();
    selectedChartYear = currentDate.getFullYear();
    loadDonationsChart(selectedChartMonth, selectedChartYear);
}

// Делаем функции глобально доступными
window.changeMonth = changeMonth;
window.goToCurrentMonth = goToCurrentMonth;

// Текущий фильтр для заявок
let currentApplicationFilter = 'all'; // 'all', 'adoption', 'volunteering'

// Загрузка заявок
async function loadApplications(filter = null) {
    try {
        if (!window.applicationsDB) {
            console.warn('applicationsDB not available');
            return;
        }
        
        // Использование предоставленного фильтра или текущего фильтра
        const activeFilter = filter !== null ? filter : currentApplicationFilter;
        currentApplicationFilter = activeFilter;
        
        // Загружаем данные перед получением заявок (принудительно перезагружаем)
        await window.applicationsDB.loadApplicationsData(true);
        
        const applications = await window.applicationsDB.getAllApplications();
        console.log('Loaded applications in admin:', applications.length, applications);
        
        // Применение фильтра по типу
        let filteredApplications = applications;
        if (activeFilter === 'adoption') {
            filteredApplications = applications.filter(app => app.type === 'Усыновление' || app.type === 'Adoption');
        } else if (activeFilter === 'volunteering') {
            filteredApplications = applications.filter(app => app.type === 'Волонтерство' || app.type === 'Volunteering');
        } else if (activeFilter === 'professional') {
            filteredApplications = applications.filter(app => app.type === 'Профессиональная помощь' || app.type === 'Professional Help');
        }
        
        // Разделяем на новые (на рассмотрении) и обработанные (одобренные/отклоненные)
        // Новые = статус pending (независимо от того, просмотрены они или нет)
        // Обработанные = одобренные или отклоненные
        const newApplications = filteredApplications.filter(app => app.status === 'pending');
        const processedApplications = filteredApplications.filter(app => app.status === 'approved' || app.status === 'rejected');
        
        // Сортируем: новые по дате (новые сверху), обработанные по дате (новые сверху)
        newApplications.sort((a, b) => new Date(b.date) - new Date(a.date));
        processedApplications.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const applicationsList = document.querySelector('#applications-tab .applications-list');
        
        if (applicationsList) {
            let html = '';
            
            // Новые заявки (сверху) - все со статусом pending
            if (newApplications.length > 0) {
                html += `
                    <div class="applications-section">
                        <h3 class="section-subtitle" style="color: var(--primary-color); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                            Новые заявки (${newApplications.length})
                        </h3>
                        ${newApplications.map(app => createApplicationCard(app)).join('')}
                    </div>
                `;
            }
            
            // Обработанные заявки (снизу) - только одобренные и отклоненные
            if (processedApplications.length > 0) {
                html += `
                    <div class="applications-section" style="margin-top: 2rem;">
                        <h3 class="section-subtitle" style="color: var(--text-light); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
                            Обработанные заявки (${processedApplications.length})
                        </h3>
                        ${processedApplications.map(app => createApplicationCard(app)).join('')}
                    </div>
                `;
            }
            
            if (html === '') {
                html = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Нет заявок для отображения</p>';
            }
            
            applicationsList.innerHTML = html;
        }
        
        // Обновление кнопок фильтра
        updateFilterButtons(activeFilter);
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Обновление активного состояния кнопок фильтра
function updateFilterButtons(activeFilter) {
    const filterButtons = document.querySelectorAll('.filter-buttons .btn');
    filterButtons.forEach(button => {
        button.classList.remove('active');
        const buttonText = button.textContent.trim();
        if (
            (activeFilter === 'all' && buttonText === 'Все') ||
            (activeFilter === 'adoption' && buttonText === 'Усыновление') ||
            (activeFilter === 'volunteering' && buttonText === 'Волонтерство')
        ) {
            button.classList.add('active');
        }
    });
}

// Фильтрация заявок по типу
function filterApplications(filterType) {
    currentApplicationFilter = filterType;
    loadApplications(filterType);
}

window.filterApplications = filterApplications;

// Вспомогательная функция для создания карточки заявки
function createApplicationCard(app) {
    const date = new Date(app.date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const statusClass = app.status === 'approved' ? 'approved' : app.status === 'pending' ? 'pending' : 'rejected';
    const statusText = app.status === 'approved' ? 'Одобрено' : app.status === 'pending' ? 'На рассмотрении' : 'Отклонено';
    const viewedClass = app.viewed ? 'viewed' : 'unviewed';
    const isNew = app.status === 'pending' && !app.viewed;
    const isProcessed = app.status === 'approved' || app.status === 'rejected';
    
    // Показываем значок "Новое" только для непросмотренных заявок со статусом pending
    const viewedBadge = isNew ? '<span class="new-badge" style="background: #ff5722; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">Новое</span>' : '';
    
    // Скрываем кнопки действий для обработанных заявок (одобренных/отклоненных)
    const actionButtons = isProcessed ? '' : `
        <div class="application-actions">
            <button class="btn btn-primary btn-small" onclick="approveApplication(${app.id})">Одобрить</button>
            <button class="btn btn-secondary btn-small" onclick="rejectApplication(${app.id})">Отклонить</button>
            <button class="btn btn-outline btn-small" onclick="viewApplication(${app.id})">Подробнее</button>
            <button class="btn btn-secondary btn-small" onclick="deleteApplication(${app.id})" style="background-color: #dc3545; color: white;">Удалить</button>
        </div>
    `;
    
    // Дополнительные поля для разных типов заявок
    let additionalInfo = '';
    if (app.type === 'Профессиональная помощь' || app.type === 'Professional Help') {
        const serviceNames = {
            'veterinary': 'Ветеринарные услуги',
            'legal': 'Юридическая помощь',
            'it': 'IT-поддержка',
            'design': 'Дизайн и маркетинг',
            'other': 'Другое'
        };
        const serviceName = serviceNames[app.service] || app.service || 'Не указано';
        additionalInfo = `<p><strong>Вид услуг:</strong> ${serviceName}</p>`;
        if (app.description) {
            additionalInfo += `<p><strong>Описание:</strong> ${app.description}</p>`;
        }
    } else if (app.type === 'Волонтерство' || app.type === 'Volunteering') {
        if (app.age) {
            additionalInfo = `<p><strong>Возраст:</strong> ${app.age}</p>`;
        }
        if (app.experience) {
            additionalInfo += `<p><strong>Опыт работы с животными:</strong> ${app.experience}</p>`;
        }
        if (app.availability) {
            additionalInfo += `<p><strong>Когда могут помогать:</strong> ${app.availability}</p>`;
        }
        if (app.motivation) {
            additionalInfo += `<p><strong>Почему хотят стать волонтером:</strong> ${app.motivation}</p>`;
        }
    }

    // Информация о животном (кликабельная ссылка на детали животного, если animalId известен)
    let animalInfoHtml = '';
    if (app.animalName && app.animalName !== '-') {
        if (app.animalId) {
            animalInfoHtml = `<p><strong>Животное:</strong> <a href="animal-detail.html?id=${app.animalId}" target="_blank" rel="noopener noreferrer">${app.animalName}</a></p>`;
        } else {
            animalInfoHtml = `<p><strong>Животное:</strong> ${app.animalName}</p>`;
        }
    }
    
    return `
        <div class="application-card ${viewedClass}">
            <div class="application-header">
                <h3>${app.type}${viewedBadge}</h3>
                <span class="status ${statusClass}">${statusText}</span>
            </div>
            <div class="application-details">
                ${animalInfoHtml}
                <p><strong>Заявитель:</strong> ${app.userName}</p>
                <p><strong>Телефон:</strong> ${app.userPhone}</p>
                <p><strong>Email:</strong> ${app.userEmail}</p>
                <p><strong>Дата:</strong> ${date}</p>
                ${additionalInfo}
            </div>
            ${actionButtons}
        </div>
    `;
}

// Текущий фильтр контента
let currentContentFilter = 'all';

// Загрузка контента (новости и события)
async function loadContent(filter = null) {
    try {
        const activeFilter = filter !== null ? filter : currentContentFilter;
        currentContentFilter = activeFilter;
        
        const contentList = document.getElementById('contentList');
        if (!contentList) return;
        
        let allContent = [];
        
        // Загрузка новостей
        if (window.newsDB && (activeFilter === 'all' || activeFilter === 'news')) {
            const news = await window.newsDB.getAllNews();
            allContent = allContent.concat(news.map(item => ({ ...item, type: 'news' })));
        }
        
        // Загрузка событий
        if (window.eventsDB && (activeFilter === 'all' || activeFilter === 'events')) {
            const events = await window.eventsDB.getAllEvents();
            allContent = allContent.concat(events.map(item => ({ ...item, type: 'event' })));
        }
        
        // Сортировка по дате (новые первыми)
        allContent.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (allContent.length === 0) {
            contentList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Контент не найден</p>';
            return;
        }
        
        contentList.innerHTML = allContent.map(item => {
            const date = new Date(item.date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const typeBadge = item.type === 'event' 
                ? '<span style="background: #ff9800; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">Событие</span>'
                : '<span style="background: #4CAF50; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">Новость</span>';
            
            const title = item.title || item.name || 'Без названия';
            const description = item.excerpt || item.description || '';
            const category = item.category || '';
            
            return `
                <div class="content-card" style="background: var(--white); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; gap: 1rem; align-items: start;">
                    ${item.image ? `<div style="flex-shrink: 0;"><img src="images/${item.image}" alt="${title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;"></div>` : ''}
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-color); display: flex; align-items: center;">
                            ${title}${typeBadge}
                        </h3>
                        <p style="color: var(--text-light); margin: 0 0 1rem 0; font-size: 0.9rem;">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-light);">
                            <span>📅 ${date}</span>
                            ${category ? `<span>📂 ${category}</span>` : ''}
                            ${item.location ? `<span>📍 ${item.location}</span>` : ''}
                            ${item.time ? `<span>🕐 ${item.time}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                        <button class="btn btn-outline btn-small" onclick="editContent(${item.id}, '${item.type}')">Редактировать</button>
                        <button class="btn btn-secondary btn-small" onclick="deleteContent(${item.id}, '${item.type}')" style="background-color: #dc3545; color: white;">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Обновление кнопок фильтра
        document.querySelectorAll('.filter-buttons button').forEach(btn => {
            btn.classList.remove('active');
        });
        const filterBtn = document.getElementById(`filter${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}`) || document.getElementById('filterAll');
        if (filterBtn) filterBtn.classList.add('active');
        
        // Обновление текста кнопки добавления
        const addBtn = document.getElementById('addContentBtn');
        if (addBtn) {
            addBtn.textContent = activeFilter === 'events' ? 'Добавить событие' : activeFilter === 'news' ? 'Добавить новость' : 'Добавить контент';
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

// Фильтрация контента
function filterContent(filterType) {
    currentContentFilter = filterType;
    loadContent(filterType);
}

window.filterContent = filterContent;

// Функциональность вкладок
function showTab(tabName) {
    // Скрытие всех содержимых вкладок
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Удаление активного класса со всех кнопок вкладок
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Показ содержимого выбранной вкладки
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
        
        // Загрузка данных для конкретных вкладок при их открытии
        if (tabName === 'volunteers') {
            loadVolunteers();
        } else if (tabName === 'applications') {
            loadApplications();
        } else if (tabName === 'content') {
            loadContentTab();
        } else if (tabName === 'donations') {
            loadRecentDonations();
        }
    }
    
    // Добавление активного класса соответствующей кнопке вкладки
    const tabButtonMap = {
        'animals': 'Животные',
        'donations': 'Донаты',
        'applications': 'Заявки',
        'content': 'Управление контентом',
        'volunteers': 'Волонтеры'
    };
    
    const targetButtonText = tabButtonMap[tabName];
    if (targetButtonText) {
        tabButtons.forEach(button => {
            if (button.textContent.trim() === targetButtonText) {
                button.classList.add('active');
            }
        });
    }
    
    // Добавление активного класса нажатой кнопке, если событие существует
    if (event && event.target && event.target.classList.contains('tab-btn')) {
    event.target.classList.add('active');
    }
}

// Экспорт функции глобально
window.showTab = showTab;

// Загрузка вкладки контента - загружает данные всех подвкладок
async function loadContentTab() {
    await loadNewsContent();
    await loadRoomsContent();
    await loadEventsContent();
}

// Показ подвкладки контента
function showContentSubtab(subtabName) {
    // Скрытие всех содержимых подвкладок
    const subtabContents = document.querySelectorAll('.content-subtab-content');
    subtabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Удаление активного класса со всех кнопок подвкладок
    const subtabButtons = document.querySelectorAll('.subtab-btn');
    subtabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Показ содержимого выбранной подвкладки
    const selectedSubtab = document.getElementById(subtabName);
    if (selectedSubtab) {
        selectedSubtab.classList.add('active');
        
        // Загрузка данных для конкретной подвкладки
        if (subtabName === 'news-content') {
            loadNewsContent();
        } else if (subtabName === 'rooms-content') {
            loadRoomsContent();
        } else if (subtabName === 'events-content') {
            loadEventsContent();
        }
    }
    
    // Добавление активного класса нажатой кнопке
    if (event && event.target && event.target.classList.contains('subtab-btn')) {
        event.target.classList.add('active');
    }
}

window.showContentSubtab = showContentSubtab;

// Загрузка контента новостей для подвкладки
async function loadNewsContent() {
    try {
        if (!window.newsDB) {
            console.warn('newsDB not available');
            return;
        }
        
        const news = await window.newsDB.getAllNews();
        const newsList = document.getElementById('newsContentList');
        
        if (!newsList) return;
        
        if (news.length === 0) {
            newsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Новости не найдены</p>';
            return;
        }
        
        // Сортировка по дате (новые первыми)
        news.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        newsList.innerHTML = news.map(item => {
            const date = new Date(item.date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const title = item.title || 'Без названия';
            const description = item.excerpt || '';
            const category = item.category || '';
            
            return `
                <div class="content-card" style="background: var(--white); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; gap: 1rem; align-items: start;">
                    ${item.image ? `<div style="flex-shrink: 0;"><img src="images/${item.image}" alt="${title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;"></div>` : ''}
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-color); display: flex; align-items: center;">
                            ${title}
                            ${item.featured ? '<span style="background: #ff5722; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">Главная</span>' : ''}
                        </h3>
                        <p style="color: var(--text-light); margin: 0 0 1rem 0; font-size: 0.9rem;">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-light);">
                            <span>📅 ${date}</span>
                            ${category ? `<span>📂 ${category}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                        <button class="btn btn-outline btn-small" onclick="editContent(${item.id}, 'news')">Редактировать</button>
                        <button class="btn btn-secondary btn-small" onclick="deleteContent(${item.id}, 'news')" style="background-color: #dc3545; color: white;">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading news content:', error);
    }
}

// Загрузка контента помещений для подвкладки
async function loadRoomsContent() {
    try {
        if (!window.roomsDB) {
            console.warn('roomsDB not available');
            return;
        }
        
        const rooms = await window.roomsDB.getAllRooms();
        const roomsList = document.getElementById('roomsContentList');
        
        if (!roomsList) return;
        
        if (rooms.length === 0) {
            roomsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Помещения не найдены</p>';
            return;
        }
        
        roomsList.innerHTML = rooms.map(room => `
            <div class="room-card" style="background: var(--white); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-color);">${room.name}</h3>
                        <p style="color: var(--text-light); margin: 0 0 1rem 0;">${room.description.substring(0, 150)}${room.description.length > 150 ? '...' : ''}</p>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <span style="background: var(--secondary-color); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.9rem;">${room.capacity || 'Не указано'}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-outline btn-small" onclick="editRoom(${room.id})">Редактировать</button>
                        <button class="btn btn-secondary btn-small" onclick="deleteRoomAdmin(${room.id})" style="background-color: #dc3545; color: white;">Удалить</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading rooms content:', error);
    }
}

// Загрузка контента событий для подвкладки
async function loadEventsContent() {
    try {
        if (!window.eventsDB) {
            console.warn('eventsDB not available');
            return;
        }
        
        const events = await window.eventsDB.getAllEvents();
        const eventsList = document.getElementById('eventsContentList');
        
        if (!eventsList) return;
        
        if (events.length === 0) {
            eventsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">События не найдены</p>';
            return;
        }
        
        // Сортировка по дате (предстоящие первыми)
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        eventsList.innerHTML = events.map(item => {
            const date = new Date(item.date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const title = item.title || 'Без названия';
            const description = item.description || '';
            
            return `
                <div class="content-card" style="background: var(--white); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; gap: 1rem; align-items: start;">
                    ${item.image ? `<div style="flex-shrink: 0;"><img src="images/${item.image}" alt="${title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;"></div>` : ''}
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-color); display: flex; align-items: center;">
                            ${title}
                            <span style="background: #ff9800; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">Событие</span>
                        </h3>
                        <p style="color: var(--text-light); margin: 0 0 1rem 0; font-size: 0.9rem;">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-light);">
                            <span>📅 ${date}</span>
                            ${item.location ? `<span>📍 ${item.location}</span>` : ''}
                            ${item.time ? `<span>🕐 ${item.time}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                        <button class="btn btn-outline btn-small" onclick="editContent(${item.id}, 'event')">Редактировать</button>
                        <button class="btn btn-secondary btn-small" onclick="deleteContent(${item.id}, 'event')" style="background-color: #dc3545; color: white;">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading events content:', error);
    }
}

// Удалить все новости
async function deleteAllNews() {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ новости? Это действие нельзя отменить!')) {
        return;
    }
    
    if (!confirm('ЭТО УДАЛИТ ВСЕ НОВОСТИ НАВСЕГДА. Вы точно хотите продолжить?')) {
        return;
    }
    
    try {
        if (window.newsDB && window.newsDB.newsData) {
            window.newsDB.newsData.news = [];
            window.newsDB.saveNewsData();
            showMessage('Все новости удалены', 'success');
            await loadNewsContent();
        }
    } catch (error) {
        console.error('Error deleting all news:', error);
        showMessage('Ошибка при удалении новостей', 'error');
    }
}

// Удалить все помещения
async function deleteAllRooms() {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ помещения? Это действие нельзя отменить!')) {
        return;
    }
    
    if (!confirm('ЭТО УДАЛИТ ВСЕ ПОМЕЩЕНИЯ НАВСЕГДА. Вы точно хотите продолжить?')) {
        return;
    }
    
    try {
        if (window.roomsDB && window.roomsDB.roomsData) {
            window.roomsDB.roomsData.rooms = [];
            window.roomsDB.saveRoomsData();
            showMessage('Все помещения удалены', 'success');
            await loadRoomsContent();
        }
    } catch (error) {
        console.error('Error deleting all rooms:', error);
        showMessage('Ошибка при удалении помещений', 'error');
    }
}

// Удалить все события
async function deleteAllEvents() {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ события? Это действие нельзя отменить!')) {
        return;
    }
    
    if (!confirm('ЭТО УДАЛИТ ВСЕ СОБЫТИЯ НАВСЕГДА. Вы точно хотите продолжить?')) {
        return;
    }
    
    try {
        if (window.eventsDB && window.eventsDB.eventsData) {
            window.eventsDB.eventsData.events = [];
            window.eventsDB.saveEventsData();
            showMessage('Все события удалены', 'success');
            await loadEventsContent();
        }
    } catch (error) {
        console.error('Error deleting all events:', error);
        showMessage('Ошибка при удалении событий', 'error');
    }
}

window.deleteAllNews = deleteAllNews;
window.deleteAllRooms = deleteAllRooms;
window.deleteAllEvents = deleteAllEvents;

// Переход на вкладку из карточки статистики
function navigateToTab(tabName) {
    showTab(tabName);
    
    // Прокрутка к вкладкам при необходимости
    const tabsSection = document.querySelector('.admin-tabs');
    if (tabsSection) {
        tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.navigateToTab = navigateToTab;

// Функции модального окна животного
function openAnimalModal() {
    const modal = document.getElementById('animalModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAnimalModal() {
    const modal = document.getElementById('animalModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Сброс формы
        const form = document.getElementById('animalForm');
        if (form) {
            form.reset();
            delete form.dataset.editingId;
            
            // Явный сброс чекбоксов
            const vaccinatedField = document.getElementById('animalVaccinated');
            const sterilizedField = document.getElementById('animalSterilized');
            if (vaccinatedField) vaccinatedField.checked = false;
            if (sterilizedField) sterilizedField.checked = false;
        }
        
        // Сброс заголовка модального окна и кнопки
        const modalTitle = document.querySelector('#animalModal h2');
        if (modalTitle) modalTitle.textContent = 'Добавить животное';
        
        const submitBtn = document.querySelector('#animalForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Добавить';
    }
}

// Функции модального окна контента
let editingContentId = null;
let editingContentType = 'news';

function openContentModal(contentId = null, contentType = null) {
    const modal = document.getElementById('contentModal');
    const modalTitle = document.getElementById('contentModalTitle');
    const submitBtn = document.getElementById('contentSubmitBtn');
    const contentIdInput = document.getElementById('contentId');
    const contentTypeInput = document.getElementById('contentType');
    const contentTypeSelect = document.getElementById('contentTypeSelect');
    
    if (modal) {
        editingContentId = contentId;
        
        // Установка типа контента
        if (contentType) {
            editingContentType = contentType;
            if (contentTypeSelect) contentTypeSelect.value = contentType;
            if (contentTypeInput) contentTypeInput.value = contentType;
        } else {
            editingContentType = contentTypeSelect ? contentTypeSelect.value : 'news';
        }
        
        // Переключение полей в зависимости от типа
        toggleContentFields();
        
        if (contentId) {
            // Режим редактирования
            const typeText = editingContentType === 'event' ? 'событие' : 'новость';
            if (modalTitle) modalTitle.textContent = `Редактировать ${typeText}`;
            if (submitBtn) submitBtn.textContent = 'Сохранить изменения';
            if (contentIdInput) contentIdInput.value = contentId;
            
            // Загрузка данных контента
            loadContentForEdit(contentId, editingContentType);
        } else {
            // Режим добавления
            const typeText = editingContentType === 'event' ? 'событие' : 'новость';
            if (modalTitle) modalTitle.textContent = `Добавить ${typeText}`;
            if (submitBtn) submitBtn.textContent = 'Сохранить';
            if (contentIdInput) contentIdInput.value = '';
            
            // Сброс формы
            const form = document.getElementById('contentForm');
            if (form) {
                form.reset();
                // Установка даты по умолчанию на сегодня
                const dateInput = document.getElementById('contentDate');
                if (dateInput) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
                // Установка типа контента
                if (contentTypeSelect) {
                    contentTypeSelect.value = editingContentType;
                    toggleContentFields();
                }
            }
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Переключение полей контента в зависимости от типа
function toggleContentFields() {
    const contentTypeSelect = document.getElementById('contentTypeSelect');
    const newsFields = document.getElementById('newsFields');
    const eventFields = document.getElementById('eventFields');
    const contentTypeInput = document.getElementById('contentType');
    
    if (!contentTypeSelect) return;
    
    const selectedType = contentTypeSelect.value;
    editingContentType = selectedType;
    
    if (contentTypeInput) contentTypeInput.value = selectedType;
    
    if (selectedType === 'event') {
        if (newsFields) newsFields.style.display = 'none';
        if (eventFields) eventFields.style.display = 'block';
        // Сделать поля события обязательными
        const eventRequired = eventFields?.querySelectorAll('[required]');
        if (eventRequired) eventRequired.forEach(f => f.required = true);
        // Сделать поля новостей необязательными
        const newsRequired = newsFields?.querySelectorAll('[required]');
        if (newsRequired) newsRequired.forEach(f => f.required = false);
    } else {
        if (newsFields) newsFields.style.display = 'block';
        if (eventFields) eventFields.style.display = 'none';
        // Сделать поля новостей обязательными
        const newsRequired = newsFields?.querySelectorAll('[required]');
        if (newsRequired) newsRequired.forEach(f => f.required = true);
        // Сделать поля события необязательными
        const eventRequired = eventFields?.querySelectorAll('[required]');
        if (eventRequired) eventRequired.forEach(f => f.required = false);
    }
}

window.toggleContentFields = toggleContentFields;
window.openContentModal = openContentModal;

async function loadContentForEdit(contentId, contentType) {
    try {
        let content = null;
        
        if (contentType === 'event') {
            if (!window.eventsDB) return;
            content = await window.eventsDB.getEventById(contentId);
        } else {
            if (!window.newsDB) return;
            content = await window.newsDB.getNewsById(contentId);
        }
        
        if (!content) return;
        
        // Заполнение общих полей
        document.getElementById('contentTitle').value = content.title || '';
        document.getElementById('contentTitleEn').value = content.titleEn || '';
        document.getElementById('contentDate').value = content.date || '';
        document.getElementById('contentImage').value = content.image || '';
        
        if (contentType === 'event') {
            // Заполнение полей события
            document.getElementById('eventDescription').value = content.description || '';
            document.getElementById('eventDescriptionEn').value = content.descriptionEn || '';
            document.getElementById('eventLocation').value = content.location || '';
            document.getElementById('eventLocationEn').value = content.locationEn || '';
            document.getElementById('eventTime').value = content.time || '';
        } else {
            // Заполнение полей новости
            document.getElementById('contentCategory').value = content.category || '';
            document.getElementById('contentExcerpt').value = content.excerpt || '';
            document.getElementById('contentExcerptEn').value = content.excerptEn || '';
            document.getElementById('contentFull').value = content.content || '';
            document.getElementById('contentFullEn').value = content.contentEn || '';
            document.getElementById('contentFeatured').checked = content.featured || false;
        }
    } catch (error) {
        console.error('Error loading content for edit:', error);
    }
}

function clearNewsImage() {
    const imageInput = document.getElementById('newsImage');
    const imageNameInput = document.getElementById('newsImageName');
    const clearBtn = document.getElementById('clearImageBtn');
    const preview = document.getElementById('newsImagePreview');
    
    if (imageInput) imageInput.value = '';
    if (imageNameInput) imageNameInput.value = '';
    if (preview) preview.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
}

window.clearNewsImage = clearNewsImage;

function closeContentModal() {
    const modal = document.getElementById('contentModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Сброс формы и состояния редактирования
        const form = document.getElementById('contentForm');
        if (form) {
            form.reset();
        }
        editingContentId = null;
        editingContentType = 'news';
    }
}

window.closeContentModal = closeContentModal;

// Простой словарь перевода с русского на английский для общих терминов приюта
const translationDictionary = {
    // Общие слова
    'приют': 'shelter',
    'животные': 'animals',
    'собака': 'dog',
    'собаки': 'dogs',
    'кошка': 'cat',
    'кошки': 'cats',
    'питомец': 'pet',
    'питомцы': 'pets',
    'усыновление': 'adoption',
    'волонтер': 'volunteer',
    'волонтеры': 'volunteers',
    'помощь': 'help',
    'пожертвование': 'donation',
    'корм': 'food',
    'лечение': 'treatment',
    'ветеринар': 'veterinarian',
    'здоровье': 'health',
    'забота': 'care',
    'любовь': 'love',
    'дом': 'home',
    'семья': 'family',
    'новости': 'news',
    'событие': 'event',
    'события': 'events',
    'ярмарка': 'fair',
    'выставка': 'exhibition',
    'мероприятие': 'event',
    'акция': 'campaign',
    'благотворительность': 'charity',
    'спасение': 'rescue',
    'вольер': 'enclosure',
    'помещение': 'room',
    'вместимость': 'capacity',
    'особенности': 'features',
    // Месяцы и даты
    'января': 'January',
    'февраля': 'February',
    'марта': 'March',
    'апреля': 'April',
    'мая': 'May',
    'июня': 'June',
    'июля': 'July',
    'августа': 'August',
    'сентября': 'September',
    'октября': 'October',
    'ноября': 'November',
    'декабря': 'December',
    // Глаголы и фразы
    'приходите': 'come',
    'присоединяйтесь': 'join us',
    'поддержите': 'support',
    'помогите': 'help',
    'будет': 'will be',
    'проводится': 'will be held',
    'приглашаем': 'we invite',
    'ждем': 'we are waiting',
    'нашли': 'found',
    'новый': 'new',
    'новая': 'new',
    'новое': 'new',
    // Общие фразы
    'Дом Лап': 'Paw House',
    'до': 'up to',
    'и': 'and',
    'в': 'in',
    'на': 'on',
    'с': 'with',
    'для': 'for'
};

// Простая функция перевода (слово за словом с использованием словаря)
function simpleTranslate(text) {
    if (!text) return '';
    
    let result = text;
    
    // Сортировка ключей словаря по длине (от длинных к коротким) для избежания частичных замен
    const sortedKeys = Object.keys(translationDictionary).sort((a, b) => b.length - a.length);
    
    for (const ruWord of sortedKeys) {
        const enWord = translationDictionary[ruWord];
        // Замена без учета регистра
        const regex = new RegExp(ruWord, 'gi');
        result = result.replace(regex, (match) => {
            // Сохранение исходного регистра
            if (match[0] === match[0].toUpperCase()) {
                return enWord.charAt(0).toUpperCase() + enWord.slice(1);
            }
            return enWord;
        });
    }
    
    return result;
}

// Автоматический перевод контента (новости/события)
function autoTranslateContent() {
    const contentType = document.getElementById('contentTypeSelect').value;
    
    // Перевод заголовка
    const titleRu = document.getElementById('contentTitle').value;
    document.getElementById('contentTitleEn').value = simpleTranslate(titleRu);
    
    if (contentType === 'news') {
        // Перевод полей новости
        const excerptRu = document.getElementById('contentExcerpt').value;
        document.getElementById('contentExcerptEn').value = simpleTranslate(excerptRu);
        
        const fullRu = document.getElementById('contentFull').value;
        document.getElementById('contentFullEn').value = simpleTranslate(fullRu);
    } else {
        // Перевод полей события
        const descRu = document.getElementById('eventDescription').value;
        document.getElementById('eventDescriptionEn').value = simpleTranslate(descRu);
        
        const locationRu = document.getElementById('eventLocation').value;
        document.getElementById('eventLocationEn').value = simpleTranslate(locationRu);
    }
    
    showMessage('Перевод выполнен! Проверьте результат перед сохранением.', 'success');
}

window.autoTranslateContent = autoTranslateContent;

// Автоматический перевод помещения
function autoTranslateRoom() {
    const nameRu = document.getElementById('roomName').value;
    document.getElementById('roomNameEn').value = simpleTranslate(nameRu);
    
    const descRu = document.getElementById('roomDescription').value;
    document.getElementById('roomDescriptionEn').value = simpleTranslate(descRu);
    
    const capacityRu = document.getElementById('roomCapacity').value;
    document.getElementById('roomCapacityEn').value = simpleTranslate(capacityRu);
    
    const featuresRu = document.getElementById('roomFeatures').value;
    document.getElementById('roomFeaturesEn').value = simpleTranslate(featuresRu);
    
    showMessage('Перевод выполнен! Проверьте результат перед сохранением.', 'success');
}

window.autoTranslateRoom = autoTranslateRoom;

// Функция редактирования новости
// Функция редактирования контента
async function editContent(contentId, contentType) {
    openContentModal(contentId, contentType);
}

window.editContent = editContent;

// Функция удаления контента
async function deleteContent(contentId, contentType) {
    const typeText = contentType === 'event' ? 'событие' : 'новость';
    if (!confirm(`Вы уверены, что хотите удалить это ${typeText}? Это действие нельзя отменить.`)) {
        return;
    }
    
    try {
        if (contentType === 'event') {
            if (window.eventsDB) {
                window.eventsDB.deleteEvent(contentId);
                window.eventsDB.saveEventsData();
                showMessage('Событие удалено', 'success');
                await loadEventsContent();
            }
        } else {
            if (window.newsDB) {
                window.newsDB.deleteNews(contentId);
                window.newsDB.saveNewsData();
                showMessage('Новость удалена', 'success');
                await loadNewsContent();
            }
        }
        
        await loadStats(); // Обновление статистики
    } catch (error) {
        console.error('Error deleting content:', error);
        showMessage('Ошибка при удалении', 'error');
    }
}

window.deleteContent = deleteContent;

// Функция для валидации и очистки некорректных аватаров
function validateAndCleanAvatar(avatar) {
    if (!avatar) {
        return 'team1.svg';
    }
    
    // Если это data URL, оставляем как есть
    if (avatar.startsWith('data:')) {
        return avatar;
    }
    
    // Проверяем валидность расширения файла
    const validExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => 
        avatar.toLowerCase().endsWith(ext)
    );
    
    // Если расширение невалидное, возвращаем значение по умолчанию
    if (!hasValidExtension) {
        console.warn(`Invalid avatar file extension: ${avatar}, using default`);
        return 'team1.svg';
    }
    
    // Проверяем на подозрительные имена файлов (только цифры или очень короткие имена)
    const fileName = avatar.replace(/\.[^/.]+$/, ''); // Убираем расширение
    if (/^\d+$/.test(fileName) || fileName.length < 3) {
        console.warn(`Suspicious avatar file name: ${avatar}, using default`);
        return 'team1.svg';
    }
    
    // Список известных валидных файлов аватаров
    const knownAvatars = ['team1.svg', 'team2.svg', 'team3.svg', 'team4.svg'];
    if (!knownAvatars.includes(avatar) && !avatar.includes('/')) {
        // Если это не известный файл и не путь, проверяем более строго
        // Для файлов .webp, .png, .jpg проверяем, что имя файла разумное
        if (avatar.endsWith('.webp') || avatar.endsWith('.png') || avatar.endsWith('.jpg') || avatar.endsWith('.jpeg')) {
            // Если имя файла состоит только из цифр, это подозрительно
            if (/^\d+\.(webp|png|jpg|jpeg)$/i.test(avatar)) {
                console.warn(`Suspicious numeric avatar file: ${avatar}, using default`);
                return 'team1.svg';
            }
        }
    }
    
    return avatar;
}

// Загрузка волонтеров
async function loadVolunteers() {
    try {
        if (!window.volunteersDB) {
            console.warn('volunteersDB not available');
            return;
        }
        
        // Очистка некорректных аватаров из данных
        const allVolunteers = await window.volunteersDB.getAllVolunteers();
        let needsUpdate = false;
        
        for (const volunteer of allVolunteers) {
            if (volunteer.avatar) {
                const cleanedAvatar = validateAndCleanAvatar(volunteer.avatar);
                if (cleanedAvatar !== volunteer.avatar) {
                    console.log(`Cleaning invalid avatar for volunteer ${volunteer.id}: "${volunteer.avatar}" -> "${cleanedAvatar}"`);
                    // Обновляем через updateVolunteer, чтобы изменения сохранились
                    window.volunteersDB.updateVolunteer(volunteer.id, { avatar: cleanedAvatar });
                    needsUpdate = true;
                }
            }
        }
        
        // Если были изменения, перезагружаем данные
        if (needsUpdate) {
            // Сбрасываем кэш, чтобы загрузить обновленные данные
            if (window.volunteersDB.volunteersData) {
                window.volunteersDB.volunteersData = null;
            }
            // Перезагружаем данные
            await window.volunteersDB.loadVolunteersData();
        }
        
        const activeVolunteers = await window.volunteersDB.getActiveVolunteers();
        const inactiveVolunteers = await window.volunteersDB.getInactiveVolunteers();
        const volunteersList = document.querySelector('#volunteers-tab .volunteers-list');
        
        if (volunteersList) {
            let html = '';
            
            // Заголовок для активных волонтёров
            if (activeVolunteers.length > 0) {
                html += `
                    <div class="volunteers-section-header">
                        <h3 class="section-subtitle" style="color: var(--primary-color); margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                            Активные волонтёры (${activeVolunteers.length})
                        </h3>
                    </div>
                `;
            }
            
            // Общий список для всех волонтёров (активные + неактивные последовательно)
            const allVolunteers = [...activeVolunteers, ...inactiveVolunteers];
            
            if (allVolunteers.length > 0) {
                html += `<div class="volunteers-grid">`;
                
                // Добавляем активных волонтёров
                html += activeVolunteers.map(volunteer => createVolunteerCard(volunteer)).join('');
                
                // Заголовок для неактивных волонтёров (если есть активные)
                if (activeVolunteers.length > 0 && inactiveVolunteers.length > 0) {
                    html += `
                        <div class="volunteers-section-divider">
                            <h3 class="section-subtitle" style="color: var(--text-light); margin: 2rem 0 1.5rem 0; padding-top: 2rem; border-top: 1px solid var(--border-color);">
                                Неактивные волонтёры (${inactiveVolunteers.length})
                            </h3>
                        </div>
                    `;
                } else if (inactiveVolunteers.length > 0) {
                    // Если только неактивные
                    html += `
                        <div class="volunteers-section-divider">
                            <h3 class="section-subtitle" style="color: var(--text-light); margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
                                Неактивные волонтёры (${inactiveVolunteers.length})
                            </h3>
                        </div>
                    `;
                }
                
                // Добавляем неактивных волонтёров
                html += inactiveVolunteers.map(volunteer => createVolunteerCard(volunteer)).join('');
                
                html += `</div>`;
            } else {
                html = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Нет волонтёров для отображения</p>';
            }
            
            volunteersList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading volunteers:', error);
    }
}

// Вспомогательная функция для создания карточки волонтера (старый дизайн)
function createVolunteerCard(volunteer) {
    const joinDate = new Date(volunteer.joinDate).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Обработка аватара - поддержка как data URL, так и имен файлов
    const defaultAvatar = 'images/team1.svg';
    let avatarSrc = defaultAvatar;
    
    if (volunteer.avatar) {
        // Используем функцию валидации для очистки некорректных аватаров
        const cleanedAvatar = validateAndCleanAvatar(volunteer.avatar);
        
        // Если это data URL, используем его напрямую
        if (cleanedAvatar.startsWith('data:')) {
            avatarSrc = cleanedAvatar;
        } else {
            // Иначе формируем путь к файлу
            avatarSrc = `images/${cleanedAvatar}`;
        }
    }
    
    // Генерируем уникальный ID для обработчика ошибок
    const imgId = `volunteer-avatar-${volunteer.id}-${Date.now()}`;
    
    return `
        <div class="volunteer-card">
            <div class="volunteer-avatar">
                <img id="${imgId}" src="${avatarSrc}" alt="${volunteer.name}" 
                     onerror="this.onerror=null; this.src='${defaultAvatar}';">
                <div class="avatar-placeholder" style="display: none;">👤</div>
            </div>
            <div class="volunteer-info">
                <h3>${volunteer.name}</h3>
                <p class="volunteer-role"><strong>${volunteer.role}</strong></p>
                <p class="volunteer-specialization">${volunteer.specialization || '&nbsp;'}</p>
                <div class="volunteer-contacts">
                    ${volunteer.phone ? `<p>📞 <a href="tel:${volunteer.phone}">${volunteer.phone}</a></p>` : '<p>&nbsp;</p>'}
                    ${volunteer.email ? `<p>📧 <a href="mailto:${volunteer.email}">${volunteer.email}</a></p>` : ''}
                </div>
                <p class="volunteer-join-date">С нами с: ${joinDate}</p>
                ${volunteer.leftDate ? `<p class="volunteer-left-date">Покинул: ${new Date(volunteer.leftDate).toLocaleDateString('ru-RU')}</p>` : '<p class="volunteer-left-date">&nbsp;</p>'}
            </div>
            <div class="volunteer-actions">
                <button class="btn btn-outline btn-small" onclick="editVolunteer(${volunteer.id})">Редактировать</button>
                <button class="btn btn-secondary btn-small" onclick="deleteVolunteer(${volunteer.id})">Удалить</button>
            </div>
        </div>
    `;
}

// Функции управления волонтерами
function openVolunteerModal(volunteerId = null) {
    const modal = document.getElementById('volunteerModal');
    if (!modal) {
        showMessage('Модальное окно волонтера не найдено', 'error');
        return;
    }
    
    const modalTitle = document.getElementById('volunteerModalTitle');
    const submitBtn = document.getElementById('volunteerSubmitBtn');
    const volunteerIdInput = document.getElementById('volunteerId');
    
    if (volunteerId) {
        // Режим редактирования
        if (modalTitle) modalTitle.textContent = 'Редактировать волонтера';
        if (submitBtn) submitBtn.textContent = 'Сохранить изменения';
        if (volunteerIdInput) volunteerIdInput.value = volunteerId;
        loadVolunteerForEdit(volunteerId);
    } else {
        // Режим добавления
        if (modalTitle) modalTitle.textContent = 'Добавить волонтера';
        if (submitBtn) submitBtn.textContent = 'Добавить';
        if (volunteerIdInput) volunteerIdInput.value = '';
        
        // Сброс формы
        const form = document.getElementById('volunteerForm');
        if (form) form.reset();
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

async function loadVolunteerForEdit(volunteerId) {
    try {
        if (!window.volunteersDB) return;
        
        const volunteer = await window.volunteersDB.getVolunteerById(volunteerId);
        if (!volunteer) return;
        
        // Заполнение формы
        document.getElementById('volunteerName').value = volunteer.name || '';
        document.getElementById('volunteerPhone').value = volunteer.phone || '';
        document.getElementById('volunteerEmail').value = volunteer.email || '';
        document.getElementById('volunteerRole').value = volunteer.role || '';
        document.getElementById('volunteerSpecialization').value = volunteer.specialization || '';
        document.getElementById('volunteerJoinDate').value = volunteer.joinDate || '';
        document.getElementById('volunteerStatus').value = volunteer.status || 'active';
        
        // Обработка фотографии
        const photoName = volunteer.avatar || '';
        const photoInput = document.getElementById('volunteerPhoto');
        const photoNameInput = document.getElementById('volunteerPhotoName');
        const clearBtn = document.getElementById('clearVolunteerPhotoBtn');
        const preview = document.getElementById('volunteerPhotoPreview');
        const previewImg = document.getElementById('volunteerPhotoPreviewImg');
        
        if (photoName) {
            photoNameInput.value = photoName;
            
            // Валидация имени файла
            let avatarSrc = '';
            if (photoName.startsWith('data:')) {
                avatarSrc = photoName;
            } else {
                const validExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
                const hasValidExtension = validExtensions.some(ext => 
                    photoName.toLowerCase().endsWith(ext)
                );
                
                if (hasValidExtension) {
                    avatarSrc = `images/${photoName}`;
                } else {
                    // Некорректное имя файла - используем fallback
                    avatarSrc = 'images/team1.svg';
                }
            }
            
            previewImg.src = avatarSrc;
            // Добавляем обработчик ошибок для preview
            previewImg.onerror = function() {
                this.onerror = null;
                this.src = 'images/team1.svg';
            };
            preview.style.display = 'block';
            clearBtn.style.display = 'block';
        } else {
            photoNameInput.value = '';
            preview.style.display = 'none';
            clearBtn.style.display = 'none';
        }
        
        // Обработка изменения файла
        if (photoInput) {
            photoInput.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    // В реальной реализации файл будет загружен на сервер
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewImg.src = e.target.result;
                        preview.style.display = 'block';
                        clearBtn.style.display = 'block';
                        photoNameInput.value = file.name;
                    };
                    reader.readAsDataURL(file);
                }
            };
        }
    } catch (error) {
        console.error('Error loading volunteer for edit:', error);
    }
}

function clearVolunteerPhoto() {
    const photoInput = document.getElementById('volunteerPhoto');
    const photoNameInput = document.getElementById('volunteerPhotoName');
    const clearBtn = document.getElementById('clearVolunteerPhotoBtn');
    const preview = document.getElementById('volunteerPhotoPreview');
    
    if (photoInput) photoInput.value = '';
    if (photoNameInput) photoNameInput.value = '';
    if (preview) preview.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
}

window.clearVolunteerPhoto = clearVolunteerPhoto;

function closeVolunteerModal() {
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        const form = document.getElementById('volunteerForm');
        if (form) form.reset();
    }
}

async function editVolunteer(volunteerId) {
    openVolunteerModal(volunteerId);
}

async function deleteVolunteer(volunteerId) {
    if (!confirm('Вы уверены, что хотите удалить этого волонтера? Это действие нельзя отменить.')) {
        return;
    }
    
    try {
        if (!window.volunteersDB || !window.volunteersDB.deleteVolunteer) {
            showMessage('База данных волонтёров недоступна', 'error');
            return;
        }
        
        const deleted = window.volunteersDB.deleteVolunteer(volunteerId);
        if (deleted) {
            showMessage('Волонтер удален', 'success');
            await loadVolunteers();
            await loadStats(); // Обновление статистики
        } else {
            showMessage('Волонтер не найден', 'error');
        }
    } catch (error) {
        console.error('Error deleting volunteer:', error);
        showMessage('Ошибка при удалении волонтера', 'error');
    }
}

window.closeVolunteerModal = closeVolunteerModal;

// Действия с заявками
async function approveApplication(appId) {
    if (!confirm('Одобрить эту заявку?')) {
        return;
    }
    
    try {
        if (!window.applicationsDB) {
            showMessage('База данных заявок недоступна', 'error');
            return;
        }
        
        const applications = await window.applicationsDB.getAllApplications();
        const application = applications.find(app => app.id === appId);
        
        if (!application) {
            showMessage('Заявка не найдена', 'error');
            return;
        }
        
        // Обновление статуса заявки на одобрено
        if (window.applicationsDB && window.applicationsDB.applicationsData) {
            const appIndex = window.applicationsDB.applicationsData.applications.findIndex(a => a.id === appId);
            if (appIndex !== -1) {
                const appToUpdate = window.applicationsDB.applicationsData.applications[appIndex];
                appToUpdate.status = 'approved';
                appToUpdate.statusRu = 'Одобрено';
                appToUpdate.statusEn = 'Approved';
                appToUpdate.viewed = true;
                
                // Сохранение в localStorage
                try {
                    localStorage.setItem('applicationsData', JSON.stringify(window.applicationsDB.applicationsData));
                } catch (e) {
                    console.warn('Could not save applications to localStorage:', e);
                }

                // Создаём уведомление для пользователя об одобрении заявки
                try {
                    if (appToUpdate.userId) {
                        const key = `userNotifications_${appToUpdate.userId}`;
                        let notifications = [];
                        try {
                            const saved = localStorage.getItem(key);
                            if (saved) {
                                notifications = JSON.parse(saved) || [];
                            }
                        } catch (e) {
                            console.warn('Could not parse user notifications:', e);
                        }

                        notifications.push({
                            id: Date.now(),
                            applicationId: appToUpdate.id,
                            type: appToUpdate.type,
                            status: 'approved',
                            animalName: appToUpdate.animalName || '-',
                            date: new Date().toISOString(),
                            read: false
                        });

                        localStorage.setItem(key, JSON.stringify(notifications));
                    }
                } catch (e) {
                    console.warn('Could not save user notification:', e);
                }
            }
        }
        
        // Если это заявка на усыновление, помечаем животное как усыновленное
        if (application.type === 'Усыновление' || application.type === 'Adoption') {
            await markAnimalAsAdopted(application);
        }
        
        // Если это заявка на волонтерство, автоматически создаем волонтера
        if (application.type === 'Волонтерство' || application.type === 'Volunteering') {
            await createVolunteerFromApplication(application);
        }
        
        showMessage('Заявка одобрена', 'success');
        await loadApplications();
        await loadAnimalsTable(); // Перезагрузка животных для обновления статуса
        await loadVolunteers(); // Перезагрузка волонтеров, если был добавлен волонтер
        await loadStats(); // Обновление статистики
    } catch (error) {
        console.error('Error approving application:', error);
        showMessage('Ошибка при одобрении заявки', 'error');
    }
}

// Пометить животное как усыновленное при одобрении заявки на усыновление
async function markAnimalAsAdopted(application) {
    try {
        if (!window.animalsDB || !window.animalsDB.animalsData) {
            console.warn('animalsDB not available');
            return;
        }
        
        // Поиск животного по ID или имени
        let animal = null;
        if (application.animalId) {
            animal = window.animalsDB.animalsData.animals.find(a => a.id === application.animalId);
        }
        
        // Если не найдено по ID, попробовать найти по имени
        if (!animal && application.animalName) {
            animal = window.animalsDB.animalsData.animals.find(a => 
                a.name === application.animalName || a.nameEn === application.animalName
            );
        }
        
        if (animal) {
            animal.status = 'adopted';
            animal.statusRu = 'Усыновлен';
            animal.statusEn = 'Adopted';
            
            // Сохранение в localStorage
            try {
                localStorage.setItem('animalsData', JSON.stringify(window.animalsDB.animalsData));
            } catch (e) {
                console.warn('Could not save animals to localStorage:', e);
            }
            
            console.log(`Animal ${animal.name} marked as adopted`);
        } else {
            console.warn(`Animal not found for application: ${application.animalName || application.animalId}`);
        }
    } catch (error) {
        console.error('Error marking animal as adopted:', error);
    }
}

// Создание волонтера из одобренной заявки
async function createVolunteerFromApplication(application) {
    try {
        if (!window.volunteersDB) {
            console.warn('volunteersDB not available');
            return;
        }
        
        // Загружаем данные, если ещё не загружены
        await window.volunteersDB.loadVolunteersData();
        
        // Проверка, существует ли уже волонтер (по телефону или email)
        const existingVolunteers = await window.volunteersDB.getAllVolunteers();
        const existingVolunteer = existingVolunteers.find(v => 
            (v.phone && application.userPhone && v.phone === application.userPhone) || 
            (v.email && application.userEmail && v.email === application.userEmail)
        );
        
        if (existingVolunteer) {
            // Если волонтёр уже существует, активируем его и обновляем дату присоединения
            console.log('Found existing volunteer:', existingVolunteer);
            const updateData = {
                status: 'active',
                leftDate: null, // Явно удаляем leftDate
                // Обновляем дату присоединения на актуальную
                joinDate: new Date().toISOString().split('T')[0]
            };
            
            // Обновляем данные из заявки, если они изменились
            if (application.userName) {
                updateData.name = application.userName;
                updateData.nameEn = application.userName;
            }
            if (application.userPhone) {
                updateData.phone = application.userPhone;
            }
            if (application.userEmail) {
                updateData.email = application.userEmail;
            }
            if (application.motivation || application.experience) {
                updateData.specialization = application.motivation || application.experience || existingVolunteer.specialization || 'Волонтерская деятельность';
                updateData.specializationEn = 'Volunteer work';
            }
            
            // Обновляем аватар из профиля, если он есть и у волонтера еще нет data URL аватара
            try {
                const userAvatar = localStorage.getItem('userAvatar');
                if (userAvatar && userAvatar.startsWith('data:') && 
                    (!existingVolunteer.avatar || !existingVolunteer.avatar.startsWith('data:'))) {
                    updateData.avatar = userAvatar;
                }
            } catch (e) {
                console.warn('Could not get user avatar:', e);
            }
            
            const updated = window.volunteersDB.updateVolunteer(existingVolunteer.id, updateData);
            
            if (updated) {
                console.log('Volunteer activated:', updated);
                showMessage('Волонтер активирован', 'success');
                // Перезагружаем список волонтёров
                await loadVolunteers();
            } else {
                console.error('Failed to update volunteer');
                showMessage('Ошибка при активации волонтера', 'error');
            }
            return;
        }
        
        // Если волонтёра нет, создаём нового
        // Проверяем, есть ли аватар в профиле пользователя
        let avatar = 'team1.svg'; // Аватар по умолчанию
        try {
            // Пытаемся найти аватар пользователя по userId или телефону
            const userAvatar = localStorage.getItem('userAvatar');
            if (userAvatar && userAvatar.startsWith('data:')) {
                avatar = userAvatar; // Используем data URL если есть
            }
        } catch (e) {
            console.warn('Could not get user avatar:', e);
        }
        
        const newVolunteer = {
            name: application.userName || 'Волонтер',
            nameEn: application.userName || 'Volunteer',
            phone: application.userPhone || '',
            email: application.userEmail || '',
            role: 'Волонтер',
            roleEn: 'Volunteer',
            specialization: application.motivation || application.experience || application.specialization || 'Волонтерская деятельность',
            specializationEn: 'Volunteer work',
            joinDate: new Date().toISOString().split('T')[0],
            status: 'active',
            avatar: avatar
        };
        
        const added = window.volunteersDB.addVolunteer(newVolunteer);
        if (added) {
            console.log('New volunteer added:', added);
            showMessage('Волонтер автоматически добавлен из заявки', 'success');
            // Перезагружаем список волонтёров
            await loadVolunteers();
        } else {
            console.error('Failed to add volunteer');
            showMessage('Ошибка при добавлении волонтера', 'error');
        }
    } catch (error) {
        console.error('Error creating volunteer from application:', error);
        showMessage('Ошибка при создании волонтера', 'error');
    }
}

async function rejectApplication(appId) {
    if (!confirm('Отклонить эту заявку?')) {
        return;
    }
    
    try {
        if (!window.applicationsDB) {
            showMessage('База данных заявок недоступна', 'error');
            return;
        }
        
        // Обновление статуса заявки на отклонено
        let application = null;
        if (window.applicationsDB && window.applicationsDB.applicationsData) {
            const appIndex = window.applicationsDB.applicationsData.applications.findIndex(a => a.id === appId);
            if (appIndex !== -1) {
                application = window.applicationsDB.applicationsData.applications[appIndex];
                application.status = 'rejected';
                application.statusRu = 'Отклонено';
                application.statusEn = 'Rejected';
                application.viewed = true;
                
                // Сохранение в localStorage
                try {
                    localStorage.setItem('applicationsData', JSON.stringify(window.applicationsDB.applicationsData));
                } catch (e) {
                    console.warn('Could not save applications to localStorage:', e);
                }
            }
        }

        // Если это заявка на усыновление, снимаем бронь с животного
        if (application && (application.type === 'Усыновление' || application.type === 'Adoption')) {
            try {
                if (window.animalsDB && window.animalsDB.animalsData && Array.isArray(window.animalsDB.animalsData.animals)) {
                    let animal = null;
                    if (application.animalId) {
                        animal = window.animalsDB.animalsData.animals.find(a => a.id === application.animalId);
                    }
                    if (!animal && application.animalName) {
                        animal = window.animalsDB.animalsData.animals.find(a =>
                            a.name === application.animalName || a.nameEn === application.animalName
                        );
                    }
                    if (animal && animal.status === 'reserved') {
                        animal.status = 'available';
                        animal.statusRu = 'В приюте';
                        animal.statusEn = 'Available';
                        try {
                            localStorage.setItem('animalsData', JSON.stringify(window.animalsDB.animalsData));
                        } catch (e) {
                            console.warn('Could not save animals to localStorage after unreserving:', e);
                        }
                    }
                }
            } catch (e) {
                console.error('Error unreserving animal on application rejection:', e);
            }
        }

        showMessage('Заявка отклонена', 'success');
        await loadApplications();
        await loadAnimalsTable(); // обновляем список животных, чтобы статус обновился
        await loadStats(); // Обновление статистики
    } catch (error) {
        console.error('Error rejecting application:', error);
        showMessage('Ошибка при отклонении заявки', 'error');
    }
}

async function viewApplication(appId) {
    try {
        if (!window.applicationsDB) return;
        
        const application = (await window.applicationsDB.getAllApplications()).find(app => app.id === appId);
        if (!application) {
            showMessage('Заявка не найдена', 'error');
            return;
        }
        
        // Пометить как просмотренное при открытии (но не менять статус - остается в секции "новые")
        markApplicationAsViewed(appId);
        
        // Показать детали заявки (в реальной реализации это открыло бы модальное окно)
        const date = new Date(application.date).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        let details = `
Заявка #${application.id}
Тип: ${application.type}
Животное: ${application.animalName || '-'}
Заявитель: ${application.userName}
Телефон: ${application.userPhone}
Email: ${application.userEmail}
Дата: ${date}
Статус: ${application.status === 'approved' ? 'Одобрено' : application.status === 'pending' ? 'На рассмотрении' : 'Отклонено'}
        `;
        
        // Дополнительные поля для заявок на волонтёрство
        if (application.type === 'Волонтерство' || application.type === 'Volunteering') {
            if (application.age) {
                details += `Возраст: ${application.age}\n`;
            }
            if (application.experience) {
                details += `Опыт работы с животными: ${application.experience}\n`;
            }
            if (application.availability) {
                details += `Когда могут помогать: ${application.availability}\n`;
            }
            if (application.motivation) {
                details += `Почему хотят стать волонтером: ${application.motivation}\n`;
            }
        } else {
            // Для других типов заявок
            if (application.motivation) {
                details += `Мотивация: ${application.motivation}\n`;
            }
            if (application.experience) {
                details += `Опыт: ${application.experience}\n`;
            }
        }
        
        alert(details);
        // Не перезагружать заявки - просто пометить как просмотренное, остается на месте
        } catch (error) {
        console.error('Error viewing application:', error);
    }
}

// Пометить заявку как просмотренную
function markApplicationAsViewed(appId) {
    // В реальной реализации это обновляло бы на сервере
    // Пока обновляем локальную структуру данных
    if (window.applicationsDB && window.applicationsDB.applicationsData) {
        const app = window.applicationsDB.applicationsData.applications.find(a => a.id === appId);
        if (app) {
            app.viewed = true;
            
            // Сохранение в localStorage для сохранности
            try {
                localStorage.setItem('applicationsData', JSON.stringify(window.applicationsDB.applicationsData));
            } catch (e) {
                console.warn('Could not save applications to localStorage:', e);
            }
        }
    }
}

// Функция удаления заявки
async function deleteApplication(appId) {
    if (!confirm('Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.')) {
        return;
    }
    
    try {
        let deletedApplication = null;

        if (window.applicationsDB && window.applicationsDB.applicationsData) {
            const data = window.applicationsDB.applicationsData;
            if (Array.isArray(data.applications)) {
                const index = data.applications.findIndex(app => app.id === appId);
                if (index !== -1) {
                    // Сохраняем заявку перед удалением
                    deletedApplication = data.applications[index];
                    data.applications.splice(index, 1);
                    
                    try {
                        localStorage.setItem('applicationsData', JSON.stringify(data));
                    } catch (e) {
                        console.warn('Could not save applications after delete:', e);
                    }
                }
            }
        }

        // Если мы удалили заявку на усыновление, проверяем, нужно ли снять бронь с животного
        if (deletedApplication && (deletedApplication.type === 'Усыновление' || deletedApplication.type === 'Adoption')) {
            try {
                // Берём актуальный список заявок после удаления
                const allApps = window.applicationsDB
                    ? (window.applicationsDB.applicationsData?.applications || [])
                    : [];

                // Проверяем, остались ли другие pending-заявки на усыновление для этого же животного
                const hasOtherPending = allApps.some(app =>
                    (app.type === 'Усыновление' || app.type === 'Adoption') &&
                    app.status === 'pending' &&
                    (
                        (deletedApplication.animalId && app.animalId === deletedApplication.animalId) ||
                        (deletedApplication.animalName && (app.animalName === deletedApplication.animalName))
                    )
                );

                // Если других pending-заявок нет, и животное сейчас забронировано — снимаем бронь
                if (!hasOtherPending && window.animalsDB && window.animalsDB.animalsData && Array.isArray(window.animalsDB.animalsData.animals)) {
                    let animal = null;
                    if (deletedApplication.animalId) {
                        animal = window.animalsDB.animalsData.animals.find(a => a.id === deletedApplication.animalId);
                    }
                    if (!animal && deletedApplication.animalName) {
                        animal = window.animalsDB.animalsData.animals.find(a =>
                            a.name === deletedApplication.animalName || a.nameEn === deletedApplication.animalName
                        );
                    }
                    if (animal && animal.status === 'reserved') {
                        animal.status = 'available';
                        animal.statusRu = 'В приюте';
                        animal.statusEn = 'Available';
                        try {
                            localStorage.setItem('animalsData', JSON.stringify(window.animalsDB.animalsData));
                        } catch (e) {
                            console.warn('Could not save animalsData when unreserving on delete:', e);
                        }
                    }
                }
            } catch (e) {
                console.warn('Error while unreserving animal on application delete:', e);
            }
        }
        
        showMessage('Заявка удалена', 'success');
        await loadApplications();
        await loadAnimalsTable(); // Обновляем животных, чтобы статус обновился
        await loadStats(); // Обновление статистики
    } catch (error) {
        console.error('Error deleting application:', error);
        showMessage('Ошибка при удалении заявки', 'error');
    }
}

// Сделать функции глобально доступными
// Примечание: editNews/deleteNews заменены на editContent/deleteContent
window.editNews = editContent;
window.deleteNews = deleteContent;
window.openVolunteerModal = openVolunteerModal;
window.editVolunteer = editVolunteer;
window.deleteVolunteer = deleteVolunteer;
window.approveApplication = approveApplication;
window.rejectApplication = rejectApplication;
window.viewApplication = viewApplication;
window.deleteApplication = deleteApplication;

// Управление помещениями
async function loadRooms() {
    await loadRoomsContent();
}

function openRoomModal(roomId = null) {
    const modal = document.getElementById('roomModal');
    const form = document.getElementById('roomForm');
    const title = document.getElementById('roomModalTitle');
    
    if (roomId) {
        title.textContent = 'Редактировать помещение';
        editRoom(roomId);
    } else {
        title.textContent = 'Добавить помещение';
        form.reset();
        document.getElementById('roomId').value = '';
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

async function editRoom(roomId) {
    try {
        const room = await window.roomsDB.getRoomById(roomId);
        if (!room) {
            showMessage('Помещение не найдено', 'error');
            return;
        }
        
        document.getElementById('roomId').value = room.id;
        document.getElementById('roomName').value = room.name || '';
        document.getElementById('roomNameEn').value = room.nameEn || '';
        document.getElementById('roomDescription').value = room.description || '';
        document.getElementById('roomDescriptionEn').value = room.descriptionEn || '';
        document.getElementById('roomCapacity').value = room.capacity || '';
        document.getElementById('roomCapacityEn').value = room.capacityEn || '';
        document.getElementById('roomFeatures').value = Array.isArray(room.features) ? room.features.join(', ') : '';
        document.getElementById('roomFeaturesEn').value = Array.isArray(room.featuresEn) ? room.featuresEn.join(', ') : '';
        document.getElementById('roomImages').value = Array.isArray(room.images) ? room.images.join(', ') : '';
        
        openRoomModal(roomId);
    } catch (error) {
        console.error('Error editing room:', error);
        showMessage('Ошибка при загрузке помещения', 'error');
    }
}

function closeRoomModal() {
    const modal = document.getElementById('roomModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('roomForm').reset();
    }
}

async function deleteRoomAdmin(roomId) {
    if (!confirm('Вы уверены, что хотите удалить это помещение? Это действие нельзя отменить.')) {
        return;
    }
    
    try {
        if (window.roomsDB && window.roomsDB.deleteRoom) {
            window.roomsDB.deleteRoom(roomId);
            showMessage('Помещение удалено', 'success');
            await loadRoomsContent();
        } else {
            showMessage('База данных помещений недоступна', 'error');
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        showMessage('Ошибка при удалении помещения', 'error');
    }
}

// Отправка формы помещения
document.addEventListener('DOMContentLoaded', function() {
    const roomForm = document.getElementById('roomForm');
    if (roomForm) {
        roomForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const roomId = document.getElementById('roomId').value;
            const roomData = {
                name: document.getElementById('roomName').value.trim(),
                nameEn: document.getElementById('roomNameEn').value.trim(),
                description: document.getElementById('roomDescription').value.trim(),
                descriptionEn: document.getElementById('roomDescriptionEn').value.trim(),
                capacity: document.getElementById('roomCapacity').value.trim(),
                capacityEn: document.getElementById('roomCapacityEn').value.trim(),
                features: document.getElementById('roomFeatures').value.split(',').map(f => f.trim()).filter(f => f),
                featuresEn: document.getElementById('roomFeaturesEn').value.split(',').map(f => f.trim()).filter(f => f),
                images: document.getElementById('roomImages').value.split(',').map(img => img.trim()).filter(img => img),
                events: []
            };
            
            try {
                if (roomId) {
                    // Обновление существующего помещения
                    window.roomsDB.updateRoom(roomId, roomData);
                    showMessage('Помещение обновлено', 'success');
                } else {
                    // Добавление нового помещения
                    window.roomsDB.addRoom(roomData);
                    showMessage('Помещение добавлено', 'success');
                }
                
                closeRoomModal();
                await loadRoomsContent();
            } catch (error) {
                console.error('Error saving room:', error);
                showMessage('Ошибка при сохранении помещения', 'error');
            }
        });
    }
});

window.openRoomModal = openRoomModal;
window.closeRoomModal = closeRoomModal;
window.editRoom = editRoom;
window.deleteRoom = deleteRoomAdmin;

// Экспорт пожертвований - используется функция из excel-export.js
async function exportDonations() {
    if (window.exportDonationsToExcel) {
        await window.exportDonationsToExcel();
    } else {
        showMessage('Библиотека экспорта не загружена', 'error');
    }
}

window.exportDonations = exportDonations;

// Функция выхода из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
        localStorage.removeItem('adminLoggedIn');
        showMessage('Вы вышли из админ-панели', 'success');
        
        // Перенаправление на главную страницу
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Нормализация названия породы в админ-панели (использует функцию из animals.js, если доступна)
function normalizeBreedForAdmin(breed, species) {
    if (!breed) return breed;
    
    // Использовать глобальную функцию normalizeBreed, если доступна (из animals.js)
    if (window.normalizeBreed && typeof window.normalizeBreed === 'function') {
        return window.normalizeBreed(breed, species);
    }
    
    // Резервный вариант, если animals.js не загружен
    const breedLower = breed.toLowerCase().trim();
    
    // Нормализация для собак
    if (species === 'dog') {
        const dogVariants = ['дворняжка', 'дворняга', 'дворовая', 'дворовой', 'метис', 'метисная'];
        if (dogVariants.some(v => breedLower.includes(v))) {
            return 'Дворняжка';
        }
    }
    
    // Нормализация для кошек
    if (species === 'cat') {
        const catVariants = ['дворовая', 'дворовой', 'дворняжка', 'дворняга', 'домашняя', 'домашний'];
        if (catVariants.some(v => breedLower.includes(v))) {
            return 'Дворовая';
        }
    }
    
    // Если не найдено совпадение, возвращаем оригинал с заглавной буквы
    return breed.charAt(0).toUpperCase() + breed.slice(1).toLowerCase();
}

// Добавить нормализацию породы при потере фокуса ввода
function setupBreedNormalization() {
    const breedField = document.getElementById('animalBreed');
    const speciesField = document.getElementById('animalSpecies');
    
    if (breedField && speciesField) {
        breedField.addEventListener('blur', function() {
            const species = speciesField.value;
            const breed = this.value;
            if (breed && species) {
                const normalized = normalizeBreedForAdmin(breed, species);
                if (normalized !== breed) {
                    this.value = normalized;
                }
            }
        });
    }
}

// Отправка форм
document.addEventListener('DOMContentLoaded', function() {
    // Настройка нормализации породы
    setupBreedNormalization();
    // Animal form submission
    const animalForm = document.getElementById('animalForm');
    if (animalForm) {
        animalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const editingId = this.dataset.editingId;
            const isEditing = !!editingId;
            
            if (validateForm(this)) {
                try {
                    // Получение значений формы
                    const name = document.getElementById('animalName').value;
                    const species = document.getElementById('animalSpecies').value;
                    const ageValue = parseInt(document.getElementById('animalAgeValue').value) || 0;
                    const ageUnit = document.getElementById('animalAgeUnit').value;
                    const gender = document.getElementById('animalGender').value;
                    let breed = document.getElementById('animalBreed').value || '';
                    // Нормализация названия породы
                    breed = normalizeBreedForAdmin(breed, species);
                    const description = document.getElementById('animalDescription').value || '';
                    const traitsText = document.getElementById('animalTraits').value || '';
                    const healthStatus = document.getElementById('animalHealthStatus').value || 'Здоров';
                    const arrivalDate = document.getElementById('animalArrivalDate').value || '';
                    const vaccinated = document.getElementById('animalVaccinated').checked;
                    const sterilized = document.getElementById('animalSterilized').checked;
                    const status = document.getElementById('animalStatus').value;
                    
                    // Парсинг характеристик из строки, разделенной запятыми
                    const traits = traitsText.split(',').map(t => t.trim()).filter(t => t.length > 0);
                    
                    // Форматирование текста возраста
                    let ageText = '';
                    let ageTextEn = '';
                    if (ageValue > 0) {
                        if (ageUnit === 'months') {
                            ageText = ageValue === 1 ? '1 месяц' : ageValue < 5 ? `${ageValue} месяца` : `${ageValue} месяцев`;
                            ageTextEn = ageValue === 1 ? '1 month' : `${ageValue} months`;
                        } else {
                            ageText = ageValue === 1 ? '1 год' : ageValue < 5 ? `${ageValue} года` : `${ageValue} лет`;
                            ageTextEn = ageValue === 1 ? '1 year' : `${ageValue} years`;
                        }
                    }
                    
                    // Получение переводов видов
                    const speciesRu = species === 'dog' ? 'Собака' : 'Кошка';
                    const speciesEn = species === 'dog' ? 'Dog' : 'Cat';
                    const genderRu = gender === 'male' ? 'Кобель' : 'Кошка';
                    const genderEn = gender === 'male' ? 'Male' : 'Female';
                    const statusRu = status === 'available' ? 'В приюте' : 'Усыновлен';
                    const statusEn = status === 'available' ? 'Available' : 'Adopted';
                    const breedEn = breed || (species === 'dog' ? 'Mixed breed' : 'Mixed breed');
                    const healthStatusEn = healthStatus === 'Здоров' ? 'Healthy' : healthStatus === 'Требует лечения' ? 'Needs treatment' : 'In rehabilitation';
                    
                    // Перевод характеристик (простой перевод пока)
                    const traitsEn = traits.map(t => {
                        const translations = {
                            'Дружелюбный': 'Friendly',
                            'Активный': 'Active',
                            'Любит детей': 'Loves children',
                            'Ладит с животными': 'Gets along with animals',
                            'Спокойный': 'Calm',
                            'Игривый': 'Playful',
                            'Независимый': 'Independent',
                            'Общительный': 'Sociable'
                        };
                        return translations[t] || t;
                    });
                    
                    const animalData = {
                        name: name,
                        nameEn: name, // Будет переведено автоматически
                        species: species,
                        speciesRu: speciesRu,
                        speciesEn: speciesEn,
                        breed: breed,
                        breedEn: breedEn,
                        age: ageUnit === 'months' ? ageValue / 12 : ageValue,
                        ageText: ageText,
                        ageTextEn: ageTextEn,
                        gender: gender,
                        genderRu: genderRu,
                        genderEn: genderEn,
                        status: status,
                        statusRu: statusRu,
                        statusEn: statusEn,
                        description: description,
                        descriptionEn: description, // Будет переведено автоматически
                        traits: traits,
                        traitsEn: traitsEn,
                        photos: ['dog1.svg', 'dog1.svg', 'dog1.svg'], // Фотографии по умолчанию
                        vaccinated: vaccinated,
                        sterilized: sterilized,
                        healthStatus: healthStatus,
                        healthStatusEn: healthStatusEn,
                        arrivalDate: arrivalDate
                    };
                    
                    // Сохранение в базу данных
                    if (isEditing && window.animalsDB && window.animalsDB.animalsData) {
                        const animalId = parseInt(editingId);
                        const animalIndex = window.animalsDB.animalsData.animals.findIndex(a => a.id === animalId);
                        if (animalIndex !== -1) {
                            // Сохранить существующие фотографии, если новая фотография не загружена
                            const existingAnimal = window.animalsDB.animalsData.animals[animalIndex];
                            if (existingAnimal && existingAnimal.photos) {
                                animalData.photos = existingAnimal.photos;
                            }
                            
                            window.animalsDB.animalsData.animals[animalIndex] = {
                                ...existingAnimal,
                                ...animalData,
                                id: animalId
                            };
                            
                            // Сохранение в localStorage
                            if (window.animalsDB.saveAnimalsData) {
                                await window.animalsDB.saveAnimalsData();
                            }
                            
                            showMessage('Животное успешно обновлено!', 'success');
                        } else {
                            showMessage('Животное не найдено', 'error');
                            return;
                        }
                    } else if (window.animalsDB && window.animalsDB.animalsData) {
                        const maxId = window.animalsDB.animalsData.animals.length > 0
                            ? Math.max(...window.animalsDB.animalsData.animals.map(a => a.id))
                            : 0;
                        window.animalsDB.animalsData.animals.push({
                            ...animalData,
                            id: maxId + 1
                        });
                        
                        // Сохранение в localStorage
                        if (window.animalsDB.saveAnimalsData) {
                            await window.animalsDB.saveAnimalsData();
                        }
                        
                showMessage('Животное успешно добавлено!', 'success');
                    } else {
                        showMessage('База данных животных недоступна', 'error');
                        return;
                    }
                    
                closeAnimalModal();
                
                // Обновление списка животных
                setTimeout(() => {
                        loadAnimalsTable();
                        loadStats();
                    }, 500);
                } catch (error) {
                    console.error('Error saving animal:', error);
                    showMessage('Ошибка при сохранении животного: ' + error.message, 'error');
                }
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    }
    
    // Отправка формы волонтера
    const volunteerForm = document.getElementById('volunteerForm');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const volunteerIdInput = document.getElementById('volunteerId');
            const isEditing = volunteerIdInput && volunteerIdInput.value;
            
            if (validateForm(this)) {
                // Обработка фотографии
                const photoNameInput = document.getElementById('volunteerPhotoName');
                const photoFile = document.getElementById('volunteerPhoto').files[0];
                let photoName = photoNameInput ? photoNameInput.value : '';
                
                // Если выбран новый файл, использовать его имя
                if (photoFile) {
                    photoName = photoFile.name;
                    // В реальной реализации загрузить файл на сервер здесь
                }
                
                // Валидация имени файла аватара
                if (photoName && !photoName.startsWith('data:')) {
                    const validExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
                    const hasValidExtension = validExtensions.some(ext => 
                        photoName.toLowerCase().endsWith(ext)
                    );
                    
                    // Если расширение невалидное, используем значение по умолчанию
                    if (!hasValidExtension) {
                        console.warn(`Invalid avatar file extension: ${photoName}, using default`);
                        photoName = 'team1.svg';
                    }
                }
                
                // Если фотографии нет, использовать значение по умолчанию
                if (!photoName) {
                    photoName = 'team1.svg';
                }
                
                const volunteerData = {
                    name: document.getElementById('volunteerName').value,
                    phone: document.getElementById('volunteerPhone').value,
                    email: document.getElementById('volunteerEmail').value,
                    role: document.getElementById('volunteerRole').value,
                    specialization: document.getElementById('volunteerSpecialization').value,
                    joinDate: document.getElementById('volunteerJoinDate').value,
                    status: document.getElementById('volunteerStatus').value,
                    avatar: photoName
                };
                
                // Сохранение в базу данных
                if (!window.volunteersDB) {
                    showMessage('База данных волонтеров недоступна', 'error');
                    return;
                }
                
                if (isEditing) {
                    const volunteerId = parseInt(volunteerIdInput.value);
                    const updated = window.volunteersDB.updateVolunteer(volunteerId, {
                        ...volunteerData,
                        nameEn: volunteerData.name,
                        roleEn: volunteerData.role,
                        specializationEn: volunteerData.specialization
                    });
                    if (updated) {
                        showMessage('Волонтер успешно обновлен!', 'success');
                    } else {
                        showMessage('Волонтер не найден', 'error');
                        return;
                    }
                } else {
                    const added = window.volunteersDB.addVolunteer({
                        ...volunteerData,
                        nameEn: volunteerData.name,
                        roleEn: volunteerData.role,
                        specializationEn: volunteerData.specialization
                    });
                    if (added) {
                        showMessage('Волонтер успешно добавлен!', 'success');
                    } else {
                        showMessage('Ошибка при добавлении волонтера', 'error');
                        return;
                    }
                }
                
                closeVolunteerModal();
                
                // Обновление списка волонтеров
                setTimeout(() => {
                    loadVolunteers();
                    loadStats();
                }, 500);
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    }
    
    // Инициализация обработчика ввода фотографии волонтера
    const volunteerPhotoInput = document.getElementById('volunteerPhoto');
    if (volunteerPhotoInput) {
        volunteerPhotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewImg = document.getElementById('volunteerPhotoPreviewImg');
                    const preview = document.getElementById('volunteerPhotoPreview');
                    const clearBtn = document.getElementById('clearVolunteerPhotoBtn');
                    const photoNameInput = document.getElementById('volunteerPhotoName');
                    
                    if (previewImg) previewImg.src = e.target.result;
                    if (preview) preview.style.display = 'block';
                    if (clearBtn) clearBtn.style.display = 'block';
                    if (photoNameInput) photoNameInput.value = file.name;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Отправка формы контента (новости и события)
    const contentForm = document.getElementById('contentForm');
    if (contentForm) {
        contentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const contentIdInput = document.getElementById('contentId');
            const contentTypeInput = document.getElementById('contentType');
            const contentTypeSelect = document.getElementById('contentTypeSelect');
            const isEditing = contentIdInput && contentIdInput.value;
            const contentType = contentTypeSelect ? contentTypeSelect.value : (contentTypeInput ? contentTypeInput.value : 'news');
            
            if (validateForm(this)) {
                const imageName = document.getElementById('contentImage').value || (contentType === 'event' ? 'news-featured.svg' : 'news1.svg');
                
                if (contentType === 'event') {
                    // Сохранение события
                    const eventData = {
                        title: document.getElementById('contentTitle').value,
                        titleEn: document.getElementById('contentTitleEn').value,
                        date: document.getElementById('contentDate').value,
                        description: document.getElementById('eventDescription').value,
                        descriptionEn: document.getElementById('eventDescriptionEn').value,
                        location: document.getElementById('eventLocation').value,
                        locationEn: document.getElementById('eventLocationEn').value,
                        time: document.getElementById('eventTime').value,
                        image: imageName
                    };
                    
                    if (isEditing && window.eventsDB) {
                        const eventId = parseInt(contentIdInput.value);
                        window.eventsDB.updateEvent(eventId, eventData);
                        window.eventsDB.saveEventsData();
                        showMessage('Событие успешно обновлено!', 'success');
                    } else if (window.eventsDB) {
                        window.eventsDB.addEvent(eventData);
                        window.eventsDB.saveEventsData();
                        showMessage('Событие успешно добавлено!', 'success');
                    } else {
                        showMessage('База данных событий недоступна', 'error');
                        return;
                    }
                } else {
                    // Сохранение новости
                    const newsData = {
                        title: document.getElementById('contentTitle').value,
                        titleEn: document.getElementById('contentTitleEn').value,
                        date: document.getElementById('contentDate').value,
                        category: document.getElementById('contentCategory').value,
                        excerpt: document.getElementById('contentExcerpt').value,
                        excerptEn: document.getElementById('contentExcerptEn').value,
                        content: document.getElementById('contentFull').value,
                        contentEn: document.getElementById('contentFullEn').value,
                        image: imageName,
                        featured: document.getElementById('contentFeatured').checked
                    };
                    
                    if (isEditing && window.newsDB) {
                        const newsId = parseInt(contentIdInput.value);
                        window.newsDB.updateNews(newsId, newsData);
                        window.newsDB.saveNewsData();
                        showMessage('Новость успешно обновлена!', 'success');
                    } else if (window.newsDB) {
                        window.newsDB.addNews(newsData);
                        window.newsDB.saveNewsData();
                        showMessage('Новость успешно опубликована!', 'success');
                    } else {
                        showMessage('База данных новостей недоступна', 'error');
                        return;
                    }
                }
                
                closeContentModal();
                
                // Сброс кэша для принудительной перезагрузки
                if (window.newsDB && window.newsDB.resetNewsCache) {
                    window.newsDB.resetNewsCache();
                }
                if (window.eventsDB && window.eventsDB.resetEventsCache) {
                    window.eventsDB.resetEventsCache();
                }
                
                // Обновление соответствующего списка контента
                setTimeout(() => {
                    if (contentType === 'event') {
                        loadEventsContent();
                    } else {
                        loadNewsContent();
                    }
                    loadStats();
                }, 500);
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    }
    
    // Отправка формы пожертвования
    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        donationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (validateForm(this)) {
                const donationData = {
                    amount: parseInt(document.getElementById('donationAmount').value),
                    userName: document.getElementById('donationDonorName').value,
                    userPhone: document.getElementById('donationPhone').value || '',
                    userEmail: document.getElementById('donationEmail').value || '',
                    purpose: document.getElementById('donationPurpose').value || 'Общие нужды',
                    date: document.getElementById('donationDate').value,
                    status: 'completed'
                };
                
                // Сохранение в базу данных
                if (window.donationsDB && window.donationsDB.donationsData) {
                    const maxId = window.donationsDB.donationsData.donations.length > 0
                        ? Math.max(...window.donationsDB.donationsData.donations.map(d => d.id))
                        : 0;
                    
                    const newDonation = {
                        ...donationData,
                        id: maxId + 1,
                        userId: `user_${maxId + 1}`
                    };
                    
                    window.donationsDB.donationsData.donations.push(newDonation);
                    
                    // Сохранение в localStorage для сохранности
                    try {
                        localStorage.setItem('donationsData', JSON.stringify(window.donationsDB.donationsData));
                    } catch (e) {
                        console.warn('Could not save donations to localStorage:', e);
                    }
                    
                    showMessage('Донат успешно добавлен!', 'success');
                } else {
                    showMessage('База данных донатов недоступна', 'error');
                    return;
                }
                
                closeDonationModal();
                
                // Обновление списка пожертвований и графика
                setTimeout(() => {
                    loadRecentDonations();
                    loadStats();
                }, 500);
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    }
});

// Функции модального окна пожертвований
function openDonationModal() {
    const modal = document.getElementById('donationModal');
    if (modal) {
        // Установка даты по умолчанию на сегодня
        const dateInput = document.getElementById('donationDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeDonationModal() {
    const modal = document.getElementById('donationModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const form = document.getElementById('donationForm');
        if (form) form.reset();
    }
}

window.openDonationModal = openDonationModal;
window.closeDonationModal = closeDonationModal;

// Application actions are now handled by approveApplication, rejectApplication, viewApplication functions

// Добавление CSS для панели администратора
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .admin-dashboard {
        padding: 2rem 0;
        background-color: var(--secondary-color);
        min-height: 100vh;
    }
    
    .stats-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;
    }
    
    .stat-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
        text-align: center;
        transition: var(--transition);
    }
    
    .stat-card.clickable-stat {
        cursor: pointer;
        user-select: none;
    }
    
    .stat-card.clickable-stat:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        background-color: #f8f9fa;
    }
    
    .stat-card.clickable-stat:active {
        transform: translateY(-2px);
    }
    
    .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-hover);
    }
    
    .stat-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }
    
    .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
    }
    
    .stat-label {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .admin-tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid var(--border-color);
    }
    
    .tab-btn {
        background: none;
        border: none;
        padding: 1rem 2rem;
        cursor: pointer;
        font-weight: 600;
        color: var(--text-light);
        border-bottom: 3px solid transparent;
        transition: var(--transition);
    }
    
    .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
    }
    
    .tab-btn:hover {
        color: var(--primary-color);
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
    }
    
    .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }
    
    .admin-header h2 {
        color: var(--text-color);
        margin: 0;
    }
    
    .filter-buttons {
        display: flex;
        gap: 0.5rem;
    }
    
    .admin-table {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        overflow: hidden;
    }
    
    .admin-table table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .admin-table th,
    .admin-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }
    
    .admin-table th {
        background-color: var(--secondary-color);
        font-weight: 600;
        color: var(--text-color);
    }
    
    .table-img {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 50%;
    }
    
    .status {
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .status.available {
        background-color: var(--primary-color);
        color: var(--white);
    }
    
    .status.pending {
        background-color: #ff9800;
        color: var(--white);
    }
    
    .donation-stats {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
        margin-bottom: 2rem;
    }
    
    .chart-placeholder {
        text-align: center;
        padding: 3rem;
        background-color: var(--secondary-color);
        border-radius: var(--border-radius);
    }
    
    .chart-placeholder h3 {
        color: var(--text-color);
        margin-bottom: 1rem;
    }
    
    .chart-placeholder p {
        color: var(--text-light);
    }
    
    .recent-donations {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
    }
    
    .recent-donations h3 {
        color: var(--text-color);
        margin-bottom: 1.5rem;
    }
    
    .donation-list {
        /* Таблица уже имеет структуру через admin-table */
    }
    
    .donation-item {
        /* Стили для строк таблицы */
    }
    
    .donation-item td {
        padding: 1rem;
        vertical-align: top;
        border-bottom: 1px solid var(--border-color);
    }
    
    .donation-date {
        width: 150px;
        white-space: nowrap;
    }
    
    .donation-amount {
        width: 120px;
        text-align: right;
        font-weight: 600;
        color: var(--primary-color);
    }
    
    .donation-donor {
        width: 250px;
        min-width: 200px;
    }
    
    .donation-donor strong {
        color: var(--text-color);
        display: block;
        margin-bottom: 0.25rem;
    }
    
    .donation-purpose {
        width: 200px;
        min-width: 150px;
    }
    
    .donation-status {
        width: 120px;
        text-align: center;
    }
    
    .applications-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .application-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
    }
    
    .application-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .application-header h3 {
        color: var(--text-color);
        margin: 0;
    }
    
    .application-details {
        margin-bottom: 1.5rem;
    }
    
    .application-details p {
        margin-bottom: 0.5rem;
        color: var(--text-light);
    }
    
    .application-details strong {
        color: var(--text-color);
    }
    
    .application-actions {
        display: flex;
        gap: 1rem;
    }
    
    .news-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .news-card {
        display: flex;
        gap: 1.5rem;
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 1.5rem;
    }
    
    .news-image {
        width: 100px;
        height: 100px;
        border-radius: var(--border-radius);
        overflow: hidden;
    }
    
    .news-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .news-content {
        flex: 1;
    }
    
    .news-content h3 {
        color: var(--text-color);
        margin-bottom: 0.5rem;
    }
    
    .news-content p {
        color: var(--text-light);
        margin-bottom: 1rem;
        line-height: 1.6;
    }
    
    .news-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.9rem;
        color: var(--text-light);
    }
    
    .news-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .btn-small {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }
    
    .volunteers-list {
        width: 100%;
    }
    
    .volunteers-section-header {
        margin-bottom: 1.5rem;
    }
    
    .volunteers-section-divider {
        grid-column: 1 / -1;
        margin-top: 1rem;
        width: 100%;
    }
    
    .volunteers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        width: 100%;
        align-items: start;
    }
    
    .volunteer-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        min-height: 400px;
        transition: var(--transition);
    }
    
    .volunteer-card:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-hover);
    }
    
    .volunteer-avatar {
        width: 80px;
        height: 80px;
        min-height: 80px;
        border-radius: 50%;
        overflow: hidden;
        margin: 0 auto 1rem;
        background-color: var(--secondary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .volunteer-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .avatar-placeholder {
        font-size: 2.5rem;
        color: var(--text-light);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }
    
    .volunteer-info {
        text-align: center;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }
    
    .volunteer-info h3 {
        color: var(--text-color);
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        line-height: 1.3;
        min-height: 2.6rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .volunteer-role {
        color: var(--primary-color);
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        font-size: 0.95rem;
        min-height: 1.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .volunteer-specialization {
        color: var(--text-light);
        font-size: 0.9rem;
        margin: 0 0 1rem 0;
        line-height: 1.4;
        min-height: 2.8rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .volunteer-contacts {
        margin: 0.5rem 0;
        text-align: left;
        min-height: 3.5rem;
        flex-shrink: 0;
    }
    
    .volunteer-contacts p {
        margin: 0.25rem 0;
        color: var(--text-color);
        font-size: 0.9rem;
        line-height: 1.4;
        min-height: 1.4rem;
    }
    
    .volunteer-contacts a {
        color: var(--primary-color);
        text-decoration: none;
    }
    
    .volunteer-contacts a:hover {
        text-decoration: underline;
    }
    
    .volunteer-join-date {
        color: var(--text-light);
        font-size: 0.85rem;
        margin: auto 0 0.5rem 0;
        min-height: 1.2rem;
    }
    
    .volunteer-left-date {
        color: #9e9e9e;
        font-size: 0.85rem;
        margin: 0;
        min-height: 1.2rem;
    }
    
    .volunteer-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-top: auto;
        padding-top: 1rem;
        flex-shrink: 0;
    }
    
    .volunteer-actions .btn {
        flex: 1;
        min-width: 0;
        white-space: nowrap;
    }
    
    .application-card.unviewed {
        border-left: 4px solid var(--primary-color);
        background-color: #f8f9fa;
    }
    
    .application-card.viewed {
        opacity: 0.85;
    }
    
    .new-badge {
        display: inline-block;
        background: #ff5722;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-left: 0.5rem;
    }
    
    .applications-section {
        margin-bottom: 2rem;
    }
    
    .section-subtitle {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
    }
    
    /* Content Management Sub-tabs */
    .content-subtabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        padding: 1rem;
        background: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
    }
    
    .subtab-btn {
        background: var(--secondary-color);
        border: 2px solid transparent;
        padding: 1rem 1.5rem;
        cursor: pointer;
        font-weight: 600;
        color: var(--text-color);
        border-radius: var(--border-radius);
        transition: var(--transition);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .subtab-btn.active {
        background: var(--primary-color);
        color: var(--white);
        border-color: var(--primary-color);
    }
    
    .subtab-btn:hover:not(.active) {
        background: var(--border-color);
        border-color: var(--primary-color);
    }
    
    .content-subtab-content {
        display: none;
    }
    
    .content-subtab-content.active {
        display: block;
    }
    
    .admin-subheader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
    }
    
    .admin-subheader h3 {
        margin: 0;
        color: var(--text-color);
    }
    
    @media (max-width: 768px) {
        .admin-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }
        
        .admin-table {
            overflow-x: auto;
        }
        
        .news-card {
            flex-direction: column;
        }
        
        .application-actions {
            flex-direction: column;
        }
        
        .volunteers-grid {
            grid-template-columns: 1fr;
        }
        
        .volunteer-card {
            min-height: auto;
        }
        
        .volunteer-info h3 {
            min-height: auto;
        }
        
        .volunteer-specialization {
            min-height: auto;
        }
        
        .volunteer-contacts {
            min-height: auto;
        }
    }
`;
document.head.appendChild(adminStyles);

