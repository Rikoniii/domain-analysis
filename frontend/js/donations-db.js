// Управление базой данных пожертвований

let donationsData = null;

// Загрузка пожертвований (локальная mock-БД для фронтенда)
async function loadDonationsData(forceReload = false) {
    // Если уже есть данные в памяти и не требуется перезагрузка — возвращаем их
    if (donationsData && !forceReload) {
        return donationsData;
    }

    // 1. Пытаемся взять данные из localStorage (это наш основной источник правды)
    try {
        const savedData = localStorage.getItem('donationsData');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed && Array.isArray(parsed.donations)) {
                // Фильтруем старые фейковые данные (Влад, Никита и т.п.)
                const excludeNames = ['влад', 'nikita', 'никита'];
                parsed.donations = parsed.donations.filter(d => {
                    const userName = (d.userName || '').toLowerCase();
                    const publicName = (d.public_name || '').toLowerCase();
                    const isFake = excludeNames.some(name =>
                        userName.includes(name) || publicName.includes(name)
                    );
                    return !isFake;
                });

                donationsData = parsed;
                window.donationsDB.donationsData = donationsData;

                // Сохраняем отфильтрованные данные обратно, чтобы фейковые навсегда исчезли
                try {
                    localStorage.setItem('donationsData', JSON.stringify(donationsData));
                } catch (e) {
                    console.warn('Could not save filtered donations to localStorage:', e);
                }

                console.log('Загружено пожертвований из localStorage:', donationsData.donations.length);
                return donationsData;
            }
        }
    } catch (e) {
        console.warn('Could not load donations from localStorage:', e);
    }

    // 2. Если в localStorage ничего нет — инициализируем пустую структуру (без попыток загрузки несуществующего файла)
    donationsData = { donations: [] };
    window.donationsDB.donationsData = donationsData;

    try {
        localStorage.setItem('donationsData', JSON.stringify(donationsData));
    } catch (e) {
        console.warn('Could not save empty donations to localStorage:', e);
    }

    return donationsData;
}

// Получить все пожертвования
async function getAllDonations() {
    const data = await loadDonationsData();
    return data.donations || [];
}

// Получить пожертвования пользователя
async function getUserDonations(userId) {
    const donations = await getAllDonations();
    return donations.filter(d => d.userId === userId);
}

// Получить пожертвования за месяц
async function getMonthlyDonations(month, year) {
    const donations = await getAllDonations();
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    return donations.filter(d => {
        // Проверяем статус - учитываем только завершенные пожертвования
        const isCompleted = d.status === 'completed' || d.status === 'succeeded';
        if (!isCompleted) return false;
        
        // Проверяем дату
        if (!d.date) return false;
        const donationDate = new Date(d.date);
        if (isNaN(donationDate.getTime())) return false;
        
        return donationDate.getMonth() + 1 === targetMonth && donationDate.getFullYear() === targetYear;
    });
}

// Получить общую сумму пожертвований за месяц
async function getMonthlyTotal(month, year) {
    const monthlyDonations = await getMonthlyDonations(month, year);
    return monthlyDonations.reduce((sum, d) => sum + d.amount, 0);
}

// Получить общую сумму всех пожертвований
async function getTotalDonations() {
    const donations = await getAllDonations();
    return donations.reduce((sum, d) => sum + d.amount, 0);
}

// Добавить новое пожертвование (используется формой доната)
async function addDonation(donation) {
    try {
        const data = await loadDonationsData();
        if (!data.donations) {
            data.donations = [];
        }

        const maxId = data.donations.length > 0
            ? Math.max(...data.donations.map(d => d.id || 0))
            : 0;

        const newDonation = {
            id: maxId + 1,
            amount: donation.amount || 0,
            purpose: donation.purpose || 'Общие нужды',
            date: donation.date || new Date().toISOString(), // Сохраняем полную дату и время
            status: donation.status || 'completed',
            userId: donation.userId || null,
            userName: donation.userName || (donation.anonymous ? 'Анонимно' : ''),
            userPhone: donation.userPhone || '',
            userEmail: donation.userEmail || '',
            paymentMethod: donation.paymentMethod || 'card',
            recurring: !!donation.recurring,
            anonymous: !!donation.anonymous
        };

        data.donations.unshift(newDonation);
        donationsData = data;
        window.donationsDB.donationsData = donationsData;

        try {
            localStorage.setItem('donationsData', JSON.stringify(donationsData));
            console.log('Donation saved to localStorage:', newDonation);
        } catch (e) {
            console.warn('Could not persist donations after addDonation:', e);
        }

        return newDonation;
    } catch (error) {
        console.error('Error adding donation:', error);
        throw error;
    }
}

// Экспорт функций
window.donationsDB = {
    loadDonationsData,
    getAllDonations,
    getUserDonations,
    getMonthlyDonations,
    getMonthlyTotal,
    getTotalDonations,
    addDonation,
    donationsData: null // Будет установлено при загрузке данных
};

console.log('donations-db.js module loaded, donationsDB exported:', !!window.donationsDB);

