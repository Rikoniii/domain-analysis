// Управление базой данных волонтеров

let volunteersData = null;

// Экспорт volunteersData для внешнего доступа
window.volunteersDB = window.volunteersDB || {};

// Загрузка волонтеров из JSON файла / localStorage
async function loadVolunteersData() {
    if (volunteersData) {
        return volunteersData;
    }
    
    try {
        // 1. Загружаем стартовые данные из файла
        let fileData = { volunteers: [] };
        try {
            const response = await fetch('../data/volunteers.json');
            if (response.ok) {
                const data = await response.json();
                if (data && Array.isArray(data.volunteers)) {
                    fileData = data;
                }
            }
        } catch (e) {
            console.warn('Could not load volunteers from file:', e);
        }
        
        // 2. Загружаем сохранённые данные из localStorage
        let savedData = { volunteers: [] };
        try {
            const saved = localStorage.getItem('volunteersData');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && Array.isArray(parsed.volunteers)) {
                    savedData = parsed;
                }
            }
        } catch (e) {
            console.warn('Could not load volunteers from localStorage:', e);
        }
        
        // 3. Мержим: создаём Map по ID, чтобы избежать дубликатов
        // Приоритет у сохранённых данных (localStorage), так как они новее
        const volunteersMap = new Map();
        
        // Сначала добавляем волонтёров из файла
        if (fileData.volunteers && fileData.volunteers.length > 0) {
            fileData.volunteers.forEach(v => {
                if (v.id) {
                    volunteersMap.set(v.id, v);
                }
            });
        }
        
        // Затем добавляем/обновляем волонтёрами из localStorage (они имеют приоритет)
        if (savedData.volunteers && savedData.volunteers.length > 0) {
            savedData.volunteers.forEach(v => {
                if (v.id) {
                    volunteersMap.set(v.id, v);
                }
            });
        }
        
        // Преобразуем Map обратно в массив
        volunteersData = { volunteers: Array.from(volunteersMap.values()) };
        
        // Экспорт и сохранение в localStorage
        window.volunteersDB.volunteersData = volunteersData;
        
        try {
            localStorage.setItem('volunteersData', JSON.stringify(volunteersData));
        } catch (e) {
            console.warn('Could not save volunteers to localStorage:', e);
        }
        
        return volunteersData;
    } catch (error) {
        console.error('Error loading volunteers:', error);
        volunteersData = { volunteers: [] };
        window.volunteersDB.volunteersData = volunteersData;
        return volunteersData;
    }
}

// Получить всех волонтеров
async function getAllVolunteers() {
    const data = await loadVolunteersData();
    return data.volunteers || [];
}

// Получить активных волонтеров
async function getActiveVolunteers() {
    const volunteers = await getAllVolunteers();
    return volunteers.filter(v => v.status === 'active');
}

// Получить волонтера по ID
async function getVolunteerById(id) {
    const volunteers = await getAllVolunteers();
    return volunteers.find(v => v.id === parseInt(id));
}

// Получить неактивных волонтеров
async function getInactiveVolunteers() {
    const volunteers = await getAllVolunteers();
    return volunteers.filter(v => v.status === 'inactive');
}

// Получить количество волонтеров
async function getVolunteersCount() {
    const active = await getActiveVolunteers();
    return active.length;
}

// Сохранение волонтёров в localStorage
function saveVolunteersData() {
    if (volunteersData) {
        localStorage.setItem('volunteersData', JSON.stringify(volunteersData));
        console.log('Saved volunteers to localStorage');
    }
}

// Добавить нового волонтёра
function addVolunteer(volunteer) {
    if (!volunteersData) {
        volunteersData = { volunteers: [] };
    }
    
    if (!volunteersData.volunteers) {
        volunteersData.volunteers = [];
    }
    
    // Генерация ID, если не предоставлен
    if (!volunteer.id) {
        const maxId = volunteersData.volunteers.length > 0
            ? Math.max(...volunteersData.volunteers.map(v => v.id || 0))
            : 0;
        volunteer.id = maxId + 1;
    }
    
    // Устанавливаем статус по умолчанию, если не указан
    if (!volunteer.status) {
        volunteer.status = 'active';
    }
    
    volunteersData.volunteers.push(volunteer);
    window.volunteersDB.volunteersData = volunteersData;
    saveVolunteersData();
    return volunteer;
}

// Обновить волонтёра
function updateVolunteer(id, updatedVolunteer) {
    if (!volunteersData || !volunteersData.volunteers) {
        return null;
    }
    
    const index = volunteersData.volunteers.findIndex(v => v.id === parseInt(id));
    if (index !== -1) {
        // Объединяем существующие данные с обновлениями
        const updated = { ...volunteersData.volunteers[index], ...updatedVolunteer, id: parseInt(id) };
        
        // Если leftDate явно установлен в null или undefined, удаляем его
        if (updatedVolunteer.hasOwnProperty('leftDate') && (updatedVolunteer.leftDate === null || updatedVolunteer.leftDate === undefined)) {
            delete updated.leftDate;
        }
        
        volunteersData.volunteers[index] = updated;
        window.volunteersDB.volunteersData = volunteersData;
        saveVolunteersData();
        return volunteersData.volunteers[index];
    }
    return null;
}

// Удалить волонтёра
function deleteVolunteer(id) {
    if (!volunteersData || !volunteersData.volunteers) {
        return false;
    }
    
    const index = volunteersData.volunteers.findIndex(v => v.id === parseInt(id));
    if (index !== -1) {
        volunteersData.volunteers.splice(index, 1);
        window.volunteersDB.volunteersData = volunteersData;
        saveVolunteersData();
        return true;
    }
    return false;
}

// Экспорт функций
window.volunteersDB = {
    loadVolunteersData,
    getAllVolunteers,
    getActiveVolunteers,
    getInactiveVolunteers,
    getVolunteerById,
    getVolunteersCount,
    addVolunteer,
    updateVolunteer,
    deleteVolunteer,
    saveVolunteersData
};

console.log('volunteers-db.js module loaded, volunteersDB exported:', !!window.volunteersDB);

