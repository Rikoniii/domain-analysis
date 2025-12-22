// Управление базой данных помещений

let roomsData = null;

// Загрузка помещений из JSON файла и localStorage
async function loadRoomsData() {
    if (roomsData) {
        return roomsData;
    }
    
    try {
        // Сначала пытаемся загрузить из localStorage (если есть правки из админ-панели)
        const savedRooms = localStorage.getItem('roomsData');
        if (savedRooms) {
            try {
                roomsData = JSON.parse(savedRooms);
                console.log('Loaded rooms from localStorage:', roomsData.rooms?.length || 0);
            } catch (e) {
                console.warn('Error parsing saved rooms from localStorage:', e);
            }
        }
        
        // Затем загружаем из JSON файла
        const response = await fetch('../data/rooms.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        
        // Объединение: если есть сохраненные данные, используем их; иначе используем JSON
        if (!roomsData || !roomsData.rooms || roomsData.rooms.length === 0) {
            roomsData = jsonData;
        } else {
            // Объединение сохраненных данных с JSON (сохраненные данные имеют приоритет)
            const savedRoomsMap = new Map(roomsData.rooms.map(r => [r.id, r]));
            const jsonRoomsMap = new Map(jsonData.rooms.map(r => [r.id, r]));
            
            // Объединение: сохраненные помещения + новые помещения из JSON, которых нет в сохраненных
            const mergedRooms = [
                ...Array.from(savedRoomsMap.values()),
                ...Array.from(jsonRoomsMap.values()).filter(r => !savedRoomsMap.has(r.id))
            ];
            
            roomsData = { rooms: mergedRooms };
        }
        
        // Экспорт для внешнего доступа
        window.roomsDB.roomsData = roomsData;
        return roomsData;
    } catch (error) {
        console.error('Error loading rooms:', error);
        roomsData = { rooms: [] };
        return roomsData;
    }
}

// Сохранение помещений в localStorage
function saveRoomsData() {
    if (roomsData) {
        localStorage.setItem('roomsData', JSON.stringify(roomsData));
        console.log('Saved rooms to localStorage');
    }
}

// Получить все помещения
async function getAllRooms() {
    const data = await loadRoomsData();
    return data.rooms || [];
}

// Получить помещение по ID
async function getRoomById(id) {
    const rooms = await getAllRooms();
    return rooms.find(r => r.id === parseInt(id));
}

// Добавить новое помещение
function addRoom(room) {
    if (!roomsData) {
        roomsData = { rooms: [] };
    }
    
    if (!roomsData.rooms) {
        roomsData.rooms = [];
    }
    
    // Генерация ID, если не предоставлен
    if (!room.id) {
        const maxId = roomsData.rooms.length > 0
            ? Math.max(...roomsData.rooms.map(r => r.id || 0))
            : 0;
        room.id = maxId + 1;
    }
    
    roomsData.rooms.push(room);
    window.roomsDB.roomsData = roomsData;
    saveRoomsData();
    return room;
}

// Обновить помещение
function updateRoom(id, updatedRoom) {
    if (!roomsData || !roomsData.rooms) {
        return null;
    }
    
    const index = roomsData.rooms.findIndex(r => r.id === parseInt(id));
    if (index !== -1) {
        roomsData.rooms[index] = { ...roomsData.rooms[index], ...updatedRoom, id: parseInt(id) };
        window.roomsDB.roomsData = roomsData;
        saveRoomsData();
        return roomsData.rooms[index];
    }
    return null;
}

// Удалить помещение
function deleteRoom(id) {
    if (!roomsData || !roomsData.rooms) {
        return false;
    }
    
    const index = roomsData.rooms.findIndex(r => r.id === parseInt(id));
    if (index !== -1) {
        roomsData.rooms.splice(index, 1);
        window.roomsDB.roomsData = roomsData;
        saveRoomsData();
        return true;
    }
    return false;
}

// Функция сброса кэша (для перезагрузки после правок в админ-панели)
function resetRoomsCache() {
    roomsData = null;
    console.log('Rooms cache reset');
}

// Экспорт функций
window.roomsDB = {
    loadRoomsData,
    getAllRooms,
    getRoomById,
    addRoom,
    updateRoom,
    deleteRoom,
    saveRoomsData,
    resetRoomsCache,
    roomsData: null // Будет установлено при загрузке данных
};

console.log('rooms-db.js module loaded, roomsDB exported:', !!window.roomsDB);

