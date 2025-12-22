// Управление базой данных событий

let eventsData = null;

// Загрузка событий из JSON файла и localStorage
async function loadEventsData() {
    if (eventsData) {
        return eventsData;
    }
    
    try {
        // Сначала пытаемся загрузить из localStorage (если есть правки из админ-панели)
        const savedEvents = localStorage.getItem('eventsData');
        if (savedEvents) {
            try {
                eventsData = JSON.parse(savedEvents);
                console.log('Loaded events from localStorage:', eventsData.events?.length || 0);
            } catch (e) {
                console.warn('Error parsing saved events from localStorage:', e);
            }
        }
        
        // Затем загружаем из JSON файла
        const response = await fetch('../data/events.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        
        // Объединение: если есть сохраненные данные, используем их; иначе используем JSON
        if (!eventsData || !eventsData.events || eventsData.events.length === 0) {
            eventsData = jsonData;
        } else {
            // Объединение сохраненных данных с JSON (сохраненные данные имеют приоритет)
            const savedEventsMap = new Map(eventsData.events.map(e => [e.id, e]));
            const jsonEventsMap = new Map(jsonData.events.map(e => [e.id, e]));
            
            // Объединение: сохраненные события + новые события из JSON, которых нет в сохраненных
            const mergedEvents = [
                ...Array.from(savedEventsMap.values()),
                ...Array.from(jsonEventsMap.values()).filter(e => !savedEventsMap.has(e.id))
            ];
            
            eventsData = { events: mergedEvents };
        }
        
        // Экспорт для внешнего доступа
        window.eventsDB.eventsData = eventsData;
        return eventsData;
    } catch (error) {
        console.error('Error loading events:', error);
        eventsData = { events: [] };
        return eventsData;
    }
}

// Сохранение событий в localStorage
function saveEventsData() {
    if (eventsData) {
        localStorage.setItem('eventsData', JSON.stringify(eventsData));
        console.log('Saved events to localStorage');
    }
}

// Получить все события
async function getAllEvents() {
    const data = await loadEventsData();
    return data.events || [];
}

// Получить событие по ID
async function getEventById(id) {
    const events = await getAllEvents();
    return events.find(e => e.id === parseInt(id));
}

// Добавить новое событие
function addEvent(event) {
    if (!eventsData) {
        eventsData = { events: [] };
    }
    
    if (!eventsData.events) {
        eventsData.events = [];
    }
    
    // Генерация ID, если не предоставлен
    if (!event.id) {
        const maxId = eventsData.events.length > 0
            ? Math.max(...eventsData.events.map(e => e.id || 0))
            : 0;
        event.id = maxId + 1;
    }
    
    // Parse date to extract day and month
    if (event.date && !event.day) {
        const date = new Date(event.date);
        event.day = date.getDate();
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        event.month = months[date.getMonth()];
        event.monthEn = monthsEn[date.getMonth()];
    }
    
    eventsData.events.push(event);
    window.eventsDB.eventsData = eventsData;
    saveEventsData();
    return event;
}

// Обновить событие
function updateEvent(id, updatedEvent) {
    if (!eventsData || !eventsData.events) {
        return null;
    }
    
    const index = eventsData.events.findIndex(e => e.id === parseInt(id));
    if (index !== -1) {
        // Парсинг даты для извлечения дня и месяца, если дата изменилась
        if (updatedEvent.date) {
            const date = new Date(updatedEvent.date);
            updatedEvent.day = date.getDate();
            const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            updatedEvent.month = months[date.getMonth()];
            updatedEvent.monthEn = monthsEn[date.getMonth()];
        }
        
        eventsData.events[index] = { ...eventsData.events[index], ...updatedEvent, id: parseInt(id) };
        window.eventsDB.eventsData = eventsData;
        saveEventsData();
        return eventsData.events[index];
    }
    return null;
}

// Удалить событие
function deleteEvent(id) {
    if (!eventsData || !eventsData.events) {
        return false;
    }
    
    const index = eventsData.events.findIndex(e => e.id === parseInt(id));
    if (index !== -1) {
        eventsData.events.splice(index, 1);
        window.eventsDB.eventsData = eventsData;
        saveEventsData();
        return true;
    }
    return false;
}

// Функция сброса кэша (для перезагрузки после правок в админ-панели)
function resetEventsCache() {
    eventsData = null;
    console.log('Events cache reset');
}

// Экспорт функций
window.eventsDB = {
    loadEventsData,
    getAllEvents,
    getEventById,
    addEvent,
    updateEvent,
    deleteEvent,
    saveEventsData,
    resetEventsCache,
    eventsData: null // Будет установлено при загрузке данных
};

console.log('events-db.js module loaded, eventsDB exported:', !!window.eventsDB);

