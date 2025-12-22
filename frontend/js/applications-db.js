// Управление базой данных заявок

let applicationsData = null;

// Экспорт applicationsData для внешнего доступа
window.applicationsDB = window.applicationsDB || {};

// Загрузка заявок из JSON файла / localStorage
async function loadApplicationsData(forceReload = false) {
    if (applicationsData && !forceReload) {
        return applicationsData;
    }
    
    // Сбрасываем кэш при принудительной перезагрузке
    if (forceReload) {
        applicationsData = null;
    }
    
    try {
        // 1. Пытаемся сначала взять актуальные данные из localStorage
        try {
            const saved = localStorage.getItem('applicationsData');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed.applications)) {
                    applicationsData = parsed;
                    window.applicationsDB.applicationsData = applicationsData;
                    console.log('Loaded applications from localStorage:', applicationsData.applications.length);
                    return applicationsData;
                }
            }
        } catch (e) {
            console.warn('Could not load applications from localStorage:', e);
        }
        
        // 2. Если в localStorage ещё ничего нет, загружаем стартовые заявки из файла
        let data = { applications: [] };
        try {
            const response = await fetch('../data/applications.json');
            if (response.ok) {
                const fileData = await response.json();
                if (fileData && Array.isArray(fileData.applications)) {
                    data = fileData;
                }
            }
        } catch (e) {
            console.warn('Could not load applications from file:', e);
        }
        
        applicationsData = data;
        // Экспорт и сохранение в localStorage как начального состояния
        window.applicationsDB.applicationsData = applicationsData;
        
        try {
            localStorage.setItem('applicationsData', JSON.stringify(applicationsData));
        } catch (e) {
            console.warn('Could not save applications to localStorage:', e);
        }
        
        return applicationsData;
    } catch (error) {
        console.error('Error loading applications:', error);
        applicationsData = { applications: [] };
        window.applicationsDB.applicationsData = applicationsData;
        return applicationsData;
    }
}

// Получить все заявки
async function getAllApplications() {
    const data = await loadApplicationsData();
    return data.applications || [];
}

// Получить заявки пользователя
async function getUserApplications(userId) {
    const applications = await getAllApplications();
    return applications.filter(a => a.userId === userId);
}

// Получить заявки по статусу
async function getApplicationsByStatus(status) {
    const applications = await getAllApplications();
    return applications.filter(a => a.status === status);
}

// Получить количество новых заявок (pending)
async function getNewApplicationsCount() {
    const pending = await getApplicationsByStatus('pending');
    return pending.length;
}

// Сохранение заявок в localStorage
function saveApplicationsData() {
    if (applicationsData) {
        localStorage.setItem('applicationsData', JSON.stringify(applicationsData));
        console.log('Saved applications to localStorage');
    }
}

// Добавление новой заявки
async function addApplication(application) {
    // Убеждаемся, что данные загружены
    if (!applicationsData) {
        await loadApplicationsData();
    }
    
    if (!applicationsData) {
        applicationsData = { applications: [] };
    }
    
    if (!applicationsData.applications) {
        applicationsData.applications = [];
    }
    
    // Генерация ID, если не предоставлен
    if (!application.id) {
        const maxId = applicationsData.applications.length > 0
            ? Math.max(...applicationsData.applications.map(a => a.id || 0))
            : 0;
        application.id = maxId + 1;
    }
    
    // Проверяем, нет ли уже заявки с таким ID (чтобы не дублировать)
    const existingIndex = applicationsData.applications.findIndex(a => a.id === application.id);
    if (existingIndex !== -1) {
        // Если заявка уже есть, обновляем её
        applicationsData.applications[existingIndex] = application;
        console.log('Application updated:', application.id);
    } else {
        // Если заявки нет, добавляем новую
        applicationsData.applications.push(application);
        console.log('Application added:', application.id);
    }
    
    window.applicationsDB.applicationsData = applicationsData;
    saveApplicationsData();
    console.log('Total applications in database:', applicationsData.applications.length);
    console.log('Application details:', JSON.stringify(application, null, 2));
    return application;
}

// Экспорт функций
window.applicationsDB = {
    loadApplicationsData,
    getAllApplications,
    getUserApplications,
    getApplicationsByStatus,
    getNewApplicationsCount,
    addApplication,
    saveApplicationsData,
    applicationsData: null // Будет установлено при загрузке данных
};

console.log('applications-db.js module loaded, applicationsDB exported:', !!window.applicationsDB);

