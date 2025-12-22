// Скрипт страницы деталей животного

let currentPhotoIndex = 0;

// Загрузка и отображение деталей животного
async function loadAnimalDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const animalId = urlParams.get('id');
    
    if (!animalId) {
        showError('Животное не найдено');
        return;
    }
    
    try {
        const animal = await window.animalsDB.getAnimalById(animalId);
        
        if (!animal) {
            showError('Животное не найдено');
            return;
        }
        
        displayAnimalDetail(animal);
    } catch (error) {
        console.error('Error loading animal:', error);
        showError('Ошибка загрузки данных');
    }
}

// Отображение деталей животного
function displayAnimalDetail(animal) {
    const container = document.getElementById('animalDetailContent');
    const lang = window.animalsDB.getCurrentLanguage();
    
    const name = window.animalsDB.getLocalizedText(animal, 'name');
    const species = window.animalsDB.getLocalizedText(animal, 'species');
    const breed = window.animalsDB.getLocalizedText(animal, 'breed');
    const ageText = window.animalsDB.getLocalizedText(animal, 'ageText');
    const gender = window.animalsDB.getLocalizedText(animal, 'gender');
    const status = window.animalsDB.getLocalizedText(animal, 'status');
    const description = window.animalsDB.getLocalizedText(animal, 'description');
    const healthStatus = window.animalsDB.getLocalizedText(animal, 'healthStatus');
    const traits = lang === 'en' ? animal.traitsEn : animal.traits;

    // Хлебные крошки
    const breadcrumbEl = document.getElementById('animalBreadcrumb');
    if (breadcrumbEl) {
        let animalsText = 'Наши животные';
        if (window.translations && window.translations.getTranslation) {
            const translated = window.translations.getTranslation('nav.animals', lang);
            if (translated && translated !== 'nav.animals') {
                animalsText = translated;
            } else if (lang === 'en') {
                animalsText = 'Our animals';
            }
        } else if (lang === 'en') {
            animalsText = 'Our animals';
        }

        breadcrumbEl.innerHTML = `
            <a href="animals.html" class="breadcrumb-link">${animalsText}</a>
            <span class="breadcrumb-separator">/</span>
            <a href="animal-detail.html?id=${animal.id}" class="breadcrumb-current">${name}</a>
        `;
    }
    
    // Построение HTML для фотографий
    const photosHTML = animal.photos.map((photo, index) => `
        <div class="animal-gallery-thumb ${index === 0 ? 'active' : ''}" onclick="showPhoto(${index})">
            <img src="images/${photo}" alt="${name}">
        </div>
    `).join('');
    
    // Построение HTML для характеристик
    const traitsHTML = traits.map(trait => `
        <span class="animal-trait">${trait}</span>
    `).join('');
    
    container.innerHTML = `
        <!-- Gallery Section -->
        <div class="animal-detail-gallery">
            <div class="animal-gallery-main" id="galleryMain">
                <img src="images/${animal.photos[0]}" alt="${name}" id="mainPhoto" onclick="openFullScreenGallery()">
                ${animal.photos.length > 1 ? `
                    <button class="gallery-nav prev" onclick="previousPhoto()">‹</button>
                    <button class="gallery-nav next" onclick="nextPhoto()">›</button>
                ` : ''}
            </div>
            ${animal.photos.length > 1 ? `
                <div class="animal-gallery-thumbs">
                    ${photosHTML}
                </div>
            ` : ''}
        </div>
        
        <!-- Info Section -->
        <div class="animal-detail-info">
            <div class="animal-detail-header">
                <h1 class="animal-detail-name">${name}</h1>
                <div class="animal-detail-meta">
                    <span>${species}</span>
                    <span>•</span>
                    <span>${breed}</span>
                    <span>•</span>
                    <span>${gender}</span>
                    <span>•</span>
                    <span>${ageText}</span>
                </div>
                <div style="margin-top: 1rem;">
                    <span class="animal-detail-status ${animal.status}">${status}</span>
                </div>
            </div>
            
            <div class="animal-detail-section">
                <h3>О питомце</h3>
                <p class="animal-detail-description">${description}</p>
            </div>
            
            <div class="animal-detail-section">
                <h3>Характер и особенности</h3>
                <div class="animal-detail-traits">
                    ${traitsHTML}
                </div>
            </div>
            
            <div class="animal-detail-section">
                <h3>Здоровье</h3>
                <div class="animal-detail-health">
                    <div class="health-item">
                        <span class="health-item-icon">${animal.vaccinated ? '✅' : '❌'}</span>
                        <span>${lang === 'en' ? 'Vaccinated' : 'Вакцинирован'}</span>
                    </div>
                    <div class="health-item">
                        <span class="health-item-icon">${animal.sterilized ? '✅' : '❌'}</span>
                        <span>${lang === 'en' ? 'Sterilized' : 'Стерилизован'}</span>
                    </div>
                    <div class="health-item">
                        <span class="health-item-icon">💚</span>
                        <span>${healthStatus}</span>
                    </div>
                </div>
            </div>
            
            ${animal.status === 'available'
                ? `
                <div class="animal-detail-actions">
                    <button class="btn btn-primary btn-large" onclick="openAdoptionModal('${name.replace(/'/g, "\\'")}', ${animal.id})">
                        ${lang === 'en' ? 'Adopt' : 'Хочу усыновить'}
                    </button>
                    <a href="animals.html" class="btn btn-secondary btn-large">
                        ${lang === 'en' ? 'Back to animals' : 'Вернуться к списку'}
                    </a>
                </div>
                `
                : animal.status === 'reserved'
                    ? `
                <div class="animal-detail-actions">
                    <button class="btn btn-secondary btn-large" disabled style="cursor: not-allowed; opacity: 0.8;">
                        🔒 ${lang === 'en' ? 'Pet is already reserved' : 'Питомец уже забронирован'}
                    </button>
                    <a href="animals.html" class="btn btn-secondary btn-large">
                        ${lang === 'en' ? 'Back to animals' : 'Вернуться к списку'}
                    </a>
                </div>
                `
                    : `
                <div class="animal-detail-actions">
                    <a href="animals.html" class="btn btn-secondary btn-large">
                        ${lang === 'en' ? 'Back to animals' : 'Вернуться к списку'}
                    </a>
                </div>
                `}
        </div>
    `;
    
    // Сохранение данных животного для навигации по фотографиям
    window.currentAnimal = animal;
    currentPhotoIndex = 0;
}

// Навигация по фотографиям
function showPhoto(index) {
    if (!window.currentAnimal) return;
    
    currentPhotoIndex = index;
    const photo = window.currentAnimal.photos[index];
    const mainPhoto = document.getElementById('mainPhoto');
    
    if (mainPhoto) {
        mainPhoto.src = `images/${photo}`;
    }
    
    // Обновление активной миниатюры
    document.querySelectorAll('.animal-gallery-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

function nextPhoto() {
    if (!window.currentAnimal) return;
    const nextIndex = (currentPhotoIndex + 1) % window.currentAnimal.photos.length;
    showPhoto(nextIndex);
}

function previousPhoto() {
    if (!window.currentAnimal) return;
    const prevIndex = currentPhotoIndex === 0 
        ? window.currentAnimal.photos.length - 1 
        : currentPhotoIndex - 1;
    showPhoto(prevIndex);
}

// Полноэкранная галерея
function updateFullScreenFromCurrent() {
    if (!window.currentAnimal) return;
    
    const modal = document.getElementById('fullScreenGalleryModal');
    const img = document.getElementById('fullScreenPhoto');
    const nameEl = document.getElementById('fullScreenAnimalName');
    const counterEl = document.getElementById('fullScreenCounter');
    
    if (!modal || !img) return;
    
    const currentPhoto = window.currentAnimal.photos[currentPhotoIndex];
    const name = window.animalsDB.getLocalizedText(window.currentAnimal, 'name');
    
    img.src = `images/${currentPhoto}`;
    img.alt = name;
    
    if (nameEl) {
        nameEl.textContent = name;
    }
    if (counterEl) {
        counterEl.textContent = `${currentPhotoIndex + 1} / ${window.currentAnimal.photos.length}`;
    }
}

function openFullScreenGallery(startIndex) {
    if (!window.currentAnimal) return;
    
    if (typeof startIndex === 'number') {
        currentPhotoIndex = startIndex;
    }
    
    const modal = document.getElementById('fullScreenGalleryModal');
    if (!modal) return;
    
    updateFullScreenFromCurrent();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeFullScreenGallery() {
    const modal = document.getElementById('fullScreenGalleryModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function nextFullScreenPhoto() {
    if (!window.currentAnimal) return;
    const nextIndex = (currentPhotoIndex + 1) % window.currentAnimal.photos.length;
    showPhoto(nextIndex);
    updateFullScreenFromCurrent();
}

function previousFullScreenPhoto() {
    if (!window.currentAnimal) return;
    const prevIndex = currentPhotoIndex === 0
        ? window.currentAnimal.photos.length - 1
        : currentPhotoIndex - 1;
    showPhoto(prevIndex);
    updateFullScreenFromCurrent();
}

// Навигация с клавиатуры
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('fullScreenGalleryModal');
    const isFullScreenOpen = modal && modal.style.display === 'flex';
    
    if (e.key === 'Escape' && isFullScreenOpen) {
        closeFullScreenGallery();
        return;
    }
    
    if (e.key === 'ArrowLeft') {
        if (isFullScreenOpen) {
            previousFullScreenPhoto();
        } else {
            previousPhoto();
        }
    }
    if (e.key === 'ArrowRight') {
        if (isFullScreenOpen) {
            nextFullScreenPhoto();
        } else {
            nextPhoto();
        }
    }
});

// Открытие модального окна усыновления
function openAdoptionModal(animalName, animalId) {
    // Перенаправление на страницу животных с триггером модального окна
    window.location.href = `animals.html?adopt=${animalId}`;
}

// Показать сообщение об ошибке
function showError(message) {
    const container = document.getElementById('animalDetailContent');
    const lang = window.animalsDB.getCurrentLanguage();
    const backText = window.translations ? window.translations.getTranslation('animals.backToList', lang) : 'Вернуться к списку животных';
    
    container.innerHTML = `
        <div style="text-align: center; padding: 4rem 0;">
            <h2>${message}</h2>
            <a href="animals.html" class="btn btn-primary" style="margin-top: 2rem;">
                ${backText}
            </a>
        </div>
    `;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadAnimalDetail();
    
    // Прослушивание изменений языка для перезагрузки деталей животного
    document.addEventListener('languageChanged', async (e) => {
        const urlParams = new URLSearchParams(window.location.search);
        const animalId = urlParams.get('id');
        if (animalId) {
            await loadAnimalDetail();
        }
    });
});

// Сделать функции полноэкранной галереи доступными глобально для обработчиков onclick
window.openFullScreenGallery = openFullScreenGallery;
window.closeFullScreenGallery = closeFullScreenGallery;
window.nextFullScreenPhoto = nextFullScreenPhoto;
window.previousFullScreenPhoto = previousFullScreenPhoto;

