// Функциональность страницы "О приюте"

let allRooms = [];
let currentRoomImageIndex = 0;

document.addEventListener('DOMContentLoaded', async function() {
    // Ожидание доступности roomsDB
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts && !window.roomsDB) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // Загрузка и отображение помещений
    await loadRooms();
    
    // Инициализация Яндекс.Карты
    initYandexMap();
    
    // Анимация статистики при прокрутке
    const statNumbers = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumber(entry.target);
            }
        });
    });

    statNumbers.forEach(stat => {
        observer.observe(stat);
    });

    // Анимация подсчета чисел
    function animateNumber(element) {
        const target = parseInt(element.textContent.replace(/\D/g, ''));
        const suffix = element.textContent.replace(/\d/g, '');
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + suffix;
        }, 30);
    }

    // Анимация временной шкалы
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    }, { threshold: 0.1 });

    timelineItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-50px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        timelineObserver.observe(item);
    });

    // Эффекты наведения на членов команды
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        member.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Анимация карточек помещений
    const facilityCards = document.querySelectorAll('.facility-card');
    const facilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    facilityCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        facilityObserver.observe(card);
    });
    
    // Закрытие модального окна при клике вне его
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
        }
    });
});

// Загрузка помещений из базы данных
async function loadRooms() {
    try {
        if (window.roomsDB && window.roomsDB.getAllRooms) {
            allRooms = await window.roomsDB.getAllRooms();
            displayRooms();
        } else {
            console.warn('roomsDB not available');
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

// Отображение помещений на странице
function displayRooms() {
    const roomsGrid = document.getElementById('roomsGrid');
    if (!roomsGrid) return;
    
    const currentLang = localStorage.getItem('language') || 'ru';
    
    roomsGrid.innerHTML = allRooms.map(room => {
        const name = currentLang === 'en' ? (room.nameEn || room.name) : room.name;
        const description = currentLang === 'en' ? (room.descriptionEn || room.description) : room.description;
        const image = room.images && room.images.length > 0 ? `images/${room.images[0]}` : 'images/facility1.svg';
        
        return `
            <div class="facility-card" onclick="openRoomModal(${room.id})" style="cursor: pointer;">
                <div class="facility-image">
                    <img src="${image}" alt="${name}">
                </div>
                <div class="facility-content">
                    <h3>${name}</h3>
                    <p>${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</p>
                </div>
            </div>
        `;
    }).join('');
    
    // Повторное наблюдение за карточками помещений для анимации
    const facilityCards = document.querySelectorAll('.facility-card');
    const facilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    facilityCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        facilityObserver.observe(card);
    });
}

// Открытие модального окна с деталями помещения
async function openRoomModal(roomId) {
    try {
        const room = await window.roomsDB.getRoomById(roomId);
        if (!room) {
            console.error('Room not found');
            return;
        }
        
        const modal = document.getElementById('roomDetailModal');
        const currentLang = localStorage.getItem('language') || 'ru';
        
        const name = currentLang === 'en' ? (room.nameEn || room.name) : room.name;
        const description = currentLang === 'en' ? (room.descriptionEn || room.description) : room.description;
        const capacity = currentLang === 'en' ? (room.capacityEn || room.capacity) : room.capacity;
        const features = currentLang === 'en' ? (room.featuresEn || room.features) : room.features;
        
        document.getElementById('roomDetailTitle').textContent = name;
        document.getElementById('roomDescription').textContent = description;
        document.getElementById('roomCapacity').innerHTML = `<strong>Вместимость:</strong> ${capacity}`;
        
        const featuresList = document.getElementById('roomFeaturesList');
        featuresList.innerHTML = features.map(feature => `<li>${feature}</li>`).join('');
        
        // Установка изображений
        if (room.images && room.images.length > 0) {
            const mainImage = document.getElementById('roomMainImage');
            mainImage.src = `images/${room.images[0]}`;
            mainImage.alt = name;
            
            const thumbnails = document.getElementById('roomThumbnails');
            thumbnails.innerHTML = room.images.map((img, index) => 
                `<img src="images/${img}" alt="${name}" onclick="changeRoomImage(${index})" class="${index === 0 ? 'active' : ''}">`
            ).join('');
            
            currentRoomImageIndex = 0;
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error opening room modal:', error);
    }
}

// Закрытие модального окна помещения
function closeRoomModal() {
    const modal = document.getElementById('roomDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Изменение изображения помещения в модальном окне
function changeRoomImage(index) {
    const room = allRooms.find(r => {
        const modal = document.getElementById('roomDetailModal');
        return modal && modal.style.display === 'flex';
    });
    
    if (!room || !room.images || index >= room.images.length) return;
    
    currentRoomImageIndex = index;
    const mainImage = document.getElementById('roomMainImage');
    mainImage.src = `images/${room.images[index]}`;
    
    // Обновление активной миниатюры
    const thumbnails = document.querySelectorAll('#roomThumbnails img');
    thumbnails.forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

// Инициализация Яндекс.Карты (без API ключа - используем встраивание)
function initYandexMap() {
    const mapContainer = document.getElementById('yandex-map');
    if (!mapContainer) return;
    
    // Использование встраивания Яндекс.Карт без API ключа
    const address = encodeURIComponent('Москва, ул. Добрая, д. 1');
    const embedUrl = `https://yandex.ru/map-widget/v1/?ll=37.6800%2C55.7887&z=15&pt=37.6800%2C55.7887&text=${address}`;
    
    mapContainer.innerHTML = `
        <iframe 
            src="${embedUrl}" 
            width="100%" 
            height="500" 
            frameborder="0" 
            style="border-radius: 16px; border: none;"
            allowfullscreen="true"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Карта расположения приюта">
        </iframe>
    `;
    
    // Обработка ошибок загрузки карты (не критично - карта может загрузиться позже)
    const iframe = mapContainer.querySelector('iframe');
    if (iframe) {
        iframe.addEventListener('load', function() {
            // Карта успешно загружена
            console.log('Yandex Map loaded successfully');
        });
        
        // Обработка ошибок (блокировка метрики и тайлов карты - нормальное явление)
        iframe.addEventListener('error', function() {
            // Тихая обработка ошибок iframe
            console.log('Map iframe: Some resources may be blocked (ad blockers, network issues) - this is normal');
        });
    }
}

// Сделать функции глобально доступными
window.openRoomModal = openRoomModal;
window.closeRoomModal = closeRoomModal;
window.changeRoomImage = changeRoomImage;

// Прослушивание изменений языка
window.addEventListener('languageChanged', function() {
    displayRooms();
});
