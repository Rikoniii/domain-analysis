// Функциональность экспорта в Excel с использованием SheetJS (библиотека xlsx)

// Загрузка библиотеки xlsx из CDN
function loadXLSXLibrary() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) {
            resolve(window.XLSX);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
        script.onload = () => resolve(window.XLSX);
        script.onerror = () => reject(new Error('Failed to load XLSX library'));
        document.head.appendChild(script);
    });
}

// Функция сокращения имени для общего доступа
function shortenName(fullName) {
    if (!fullName || fullName === 'Анонимно') {
        return 'Анонимно';
    }
    
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0];
    }
    
    if (parts.length === 2) {
        // Имя Фамилия -> Имя Ф.
        return `${parts[0]} ${parts[1][0]}.`;
    }
    
    if (parts.length >= 3) {
        // Имя Отчество Фамилия -> Имя О. Ф.
        const firstName = parts[0];
        const middleInitial = parts[1][0] + '.';
        const lastInitial = parts[2][0] + '.';
        return `${firstName} ${middleInitial} ${lastInitial}`;
    }
    
    return fullName;
}

// Проверка, находимся ли мы в админке
function isAdminPage() {
    return window.location.pathname.includes('admin.html') || 
           window.location.href.includes('admin.html');
}

// Маппинг назначений платежа с английского на русский (локальный для этого файла)
const excelPurposeMap = {
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
    return excelPurposeMap[purpose] || purpose;
}

// Экспорт пожертвований в Excel
async function exportDonationsToExcel() {
    try {
        const XLSX = await loadXLSXLibrary();
        
        // Показываем сообщение о загрузке
        if (typeof showMessage === 'function') {
            showMessage('Загрузка актуальных данных...', 'info');
        }
        
        // Получение актуальных данных пожертвований (с принудительной перезагрузкой)
        const donations = await getDonationsData(true);
        
        if (!donations || donations.length === 0) {
            if (typeof showMessage === 'function') {
                showMessage('Нет данных для экспорта', 'warning');
            } else {
                alert('Нет данных для экспорта');
            }
            return;
        }
        
        // Проверяем, находимся ли мы в админке
        const isAdmin = isAdminPage();
        
        // Подготовка данных для Excel (сортируем по дате - новые первыми)
        const sortedDonations = [...donations].sort((a, b) => b.date - a.date);
        
        // В общем доступе скрываем личные данные, в админке показываем все
        const worksheetData = sortedDonations.map(donation => {
            const baseData = {
                'Дата': formatDate(donation.date),
                'Время': donation.date ? new Date(donation.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '',
                'Сумма (₽)': donation.amount,
                'Имя донора': isAdmin ? (donation.donorName || 'Анонимно') : shortenName(donation.donorName || 'Анонимно'),
                'Назначение': donation.message || '',
                'ID транзакции': donation.transactionId || `DON-${Date.now()}`
            };
            
            // Только в админке добавляем телефон и email
            if (isAdmin) {
                baseData['Телефон'] = donation.phone || '';
                baseData['Email'] = donation.email || '';
            }
            
            return baseData;
        });
        
        // Создание рабочей книги и листа
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Донаты');
        
        // Генерация имени файла с текущей датой
        const filename = `donations_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Запись файла
        XLSX.writeFile(workbook, filename);
        
        if (typeof showMessage === 'function') {
            showMessage('Данные успешно экспортированы!', 'success');
        } else {
            alert('Данные успешно экспортированы!');
        }
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        if (typeof showMessage === 'function') {
            showMessage('Ошибка при экспорте данных', 'error');
        } else {
            alert('Ошибка при экспорте данных: ' + error.message);
        }
    }
}

// Получение данных пожертвований из базы данных (с принудительной перезагрузкой)
async function getDonationsData(forceReload = true) {
    let donations = [];
    
    // Сначала пытаемся загрузить из API (самые актуальные данные)
    try {
        const response = await fetch('http://localhost:5000/api/admin/donations?limit=1000');
        if (response.ok) {
            const apiDonations = await response.json();
            const excludeNames = ['влад', 'nikita', 'никита'];
            donations = apiDonations
                .filter(d => {
                    // В тестовом режиме считаем pending, completed и succeeded как завершенные
                    const status = (d.status || '').toLowerCase();
                    const statusOk = status === 'succeeded' || status === 'completed' || status === 'pending';
                    const publicName = (d.public_name || '').toLowerCase();
                    const isFake = excludeNames.some(name => publicName.includes(name));
                    return statusOk && !isFake;
                })
                    .map(d => ({
                        date: d.paid_at ? new Date(d.paid_at) : (d.created_at ? new Date(d.created_at) : new Date()),
                        amount: d.amount || 0,
                        donorName: d.public_name || 'Анонимно',
                        message: translatePurpose(d.purpose) || 'Общие нужды', // Переводим назначение на русский
                        transactionId: `DON-${d.id || Date.now()}`,
                        phone: d.phone || '',
                        email: d.email || ''
                    }))
                .sort((a, b) => b.date - a.date); // Сортируем по дате (новые первыми)
            
            if (donations.length > 0) {
                console.log('Loaded donations from API:', donations.length);
                return donations;
            }
        }
    } catch (apiError) {
        console.warn('API недоступен, используем локальные данные:', apiError);
    }
    
    // Если из API ничего не получили, загружаем из локальной БД
    try {
        // Ожидание доступности donationsDB
        let attempts = 0;
        const maxAttempts = 30;
        while (attempts < maxAttempts && !window.donationsDB) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Принудительно перезагружаем данные из localStorage
        if (window.donationsDB && window.donationsDB.loadDonationsData) {
            await window.donationsDB.loadDonationsData(forceReload);
        }
        
        if (window.donationsDB && window.donationsDB.getAllDonations) {
            const allDonations = await window.donationsDB.getAllDonations();
            const excludeNames = ['влад', 'nikita', 'никита'];
            donations = allDonations
                .filter(d => {
                    // В тестовом режиме считаем pending, completed и succeeded как завершенные
                    const status = (d.status || '').toLowerCase();
                    const isCompleted = status === 'completed' || status === 'succeeded' || status === 'pending';
                    if (!isCompleted) return false;
                    
                    const userName = (d.userName || '').toLowerCase();
                    const publicName = (d.public_name || '').toLowerCase();
                    const isFake = excludeNames.some(name => 
                        userName.includes(name) || publicName.includes(name)
                    );
                    return !isFake;
                })
                    .map(d => ({
                        date: d.date ? new Date(d.date) : new Date(),
                        amount: d.amount || 0,
                        donorName: d.userName || 'Анонимно',
                        message: translatePurpose(d.purpose) || 'Общие нужды', // Переводим назначение на русский
                        transactionId: `DON-${d.id || Date.now()}`,
                        phone: d.userPhone || '',
                        email: d.userEmail || ''
                    }))
                .sort((a, b) => b.date - a.date); // Сортируем по дате (новые первыми)
            
            if (donations.length > 0) {
                console.log('Loaded donations from local DB:', donations.length);
                return donations;
            }
        }
    } catch (error) {
        console.error('Error getting donations from DB:', error);
    }
    
    // Fallback: попытка получить напрямую из localStorage
    try {
        const savedDonations = localStorage.getItem('donationsData');
        if (savedDonations) {
            const parsed = JSON.parse(savedDonations);
            if (parsed && parsed.donations && Array.isArray(parsed.donations)) {
                const excludeNames = ['влад', 'nikita', 'никита'];
                donations = parsed.donations
                    .filter(d => {
                        // В тестовом режиме считаем pending, completed и succeeded как завершенные
                        const status = (d.status || '').toLowerCase();
                        const isCompleted = status === 'completed' || status === 'succeeded' || status === 'pending';
                        if (!isCompleted) return false;
                        
                        const userName = (d.userName || '').toLowerCase();
                        const publicName = (d.public_name || '').toLowerCase();
                        const isFake = excludeNames.some(name => 
                            userName.includes(name) || publicName.includes(name)
                        );
                        return !isFake;
                    })
                    .map(d => ({
                        date: d.date ? new Date(d.date) : new Date(),
                        amount: d.amount || 0,
                        donorName: d.userName || 'Анонимно',
                        message: translatePurpose(d.purpose) || 'Общие нужды', // Переводим назначение на русский
                        transactionId: `DON-${d.id || Date.now()}`,
                        phone: d.userPhone || '',
                        email: d.userEmail || ''
                    }))
                    .sort((a, b) => b.date - a.date); // Сортируем по дате (новые первыми)
                
                if (donations.length > 0) {
                    console.log('Loaded donations from localStorage:', donations.length);
                    return donations;
                }
            }
        }
    } catch (e) {
        console.error('Error parsing donations from localStorage:', e);
    }
    
    console.warn('No donations data found');
    return [];
}

// Форматирование даты для отображения
function formatDate(date) {
    if (!date) return '';
    
    // Если date уже объект Date, используем его напрямую
    let d;
    if (date instanceof Date) {
        d = date;
    } else {
        d = new Date(date);
    }
    
    if (isNaN(d.getTime())) return '';
    
    // Проверяем, есть ли время в исходной дате (если это строка)
    const dateString = typeof date === 'string' ? date : date.toISOString();
    const hasTime = dateString.includes('T') || dateString.includes(' ');
    
    if (hasTime) {
        return d.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        return d.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
}

// Сохранение пожертвования в localStorage (для демонстрационных целей)
function saveDonation(donationData) {
    const donations = getDonationsData();
    donations.unshift({
        date: new Date(),
        amount: donationData.amount,
        donorName: donationData.donorName || 'Анонимно',
        message: donationData.message || '',
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
    localStorage.setItem('donations', JSON.stringify(donations));
}

// Функция для вызова из админ-панели
async function exportDonations() {
    await exportDonationsToExcel();
}

// Экспорт финансового отчета (доходы и расходы)
async function exportFinancialReport() {
    try {
        const XLSX = await loadXLSXLibrary();
        
        // Показываем сообщение о загрузке
        if (typeof showMessage === 'function') {
            showMessage('Загрузка актуальных данных...', 'info');
        }
        
        // Получение актуальных данных пожертвований (доходы) с принудительной перезагрузкой
        const donations = await getDonationsData(true);
        
        // Проверяем, находимся ли мы в админке
        const isAdmin = isAdminPage();
        
        // Подготовка данных для Excel
        const workbook = XLSX.utils.book_new();
        
        // Лист 1: Доходы (пожертвования) - сортируем по дате (новые первыми)
        const sortedDonations = [...donations].sort((a, b) => b.date - a.date);
        
        // В общем доступе скрываем личные данные, в админке показываем все
        const incomeData = sortedDonations.map(donation => {
            const baseData = {
                'Дата': formatDate(donation.date),
                'Время': donation.date ? new Date(donation.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '',
                'Сумма (₽)': donation.amount,
                'Донор': isAdmin ? (donation.donorName || 'Анонимно') : shortenName(donation.donorName || 'Анонимно'),
                'Назначение': donation.message || '',
                'ID транзакции': donation.transactionId || `DON-${donation.id || Date.now()}`
            };
            
            // Только в админке добавляем телефон и email
            if (isAdmin) {
                baseData['Телефон'] = donation.phone || '';
                baseData['Email'] = donation.email || '';
            }
            
            return baseData;
        });
        
        const incomeSheet = XLSX.utils.json_to_sheet(incomeData);
        XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Доходы');
        
        // Лист 2: Расходы (примерные данные - в реальном приложении это будет из базы данных расходов)
        const expensesData = [
            { 'Дата': '2024-10-01', 'Сумма (₽)': 15000, 'Категория': 'Корм', 'Описание': 'Корм для собак и кошек' },
            { 'Дата': '2024-10-05', 'Сумма (₽)': 8000, 'Категория': 'Ветеринария', 'Описание': 'Вакцинация животных' },
            { 'Дата': '2024-10-10', 'Сумма (₽)': 12000, 'Категория': 'Лечение', 'Описание': 'Лечение больных животных' },
            { 'Дата': '2024-10-15', 'Сумма (₽)': 5000, 'Категория': 'Корм', 'Описание': 'Корм для котят' },
            { 'Дата': '2024-10-20', 'Сумма (₽)': 3000, 'Категория': 'Аксессуары', 'Описание': 'Ошейники, поводки, игрушки' }
        ];
        
        const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
        XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Расходы');
        
        // Лист 3: Сводка
        const totalIncome = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
        const totalExpenses = expensesData.reduce((sum, e) => sum + (parseFloat(e['Сумма (₽)']) || 0), 0);
        const balance = totalIncome - totalExpenses;
        
        const summaryData = [
            { 'Показатель': 'Общие доходы', 'Сумма (₽)': totalIncome },
            { 'Показатель': 'Общие расходы', 'Сумма (₽)': totalExpenses },
            { 'Показатель': 'Баланс', 'Сумма (₽)': balance }
        ];
        
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');
        
        // Генерация имени файла с текущей датой
        const filename = `financial_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Запись файла
        XLSX.writeFile(workbook, filename);
        
        if (typeof showMessage === 'function') {
            showMessage('Финансовый отчет успешно экспортирован!', 'success');
        } else {
            alert('Финансовый отчет успешно экспортирован!');
        }
    } catch (error) {
        console.error('Error exporting financial report:', error);
        if (typeof showMessage === 'function') {
            showMessage('Ошибка при экспорте финансового отчета', 'error');
        } else {
            alert('Ошибка при экспорте финансового отчета');
        }
    }
}

// Экспорт функций глобально
window.exportDonationsToExcel = exportDonationsToExcel;
window.exportDonations = exportDonations;
window.saveDonation = saveDonation;
window.exportFinancialReport = exportFinancialReport;

