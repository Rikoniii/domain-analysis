// Функциональность страницы животных с базой данных

let allAnimals = [];
let currentModalAnimal = null;
let currentModalImageIndex = 0;
let animalsLoading = false;
let animalsLoaded = false;
let animalsInitialized = false;
let adoptionHandledFromQuery = false;

// Загрузка животных из базы данных и их отображение
async function loadAnimals() {
    // Предотвращение множественных одновременных загрузок
    if (animalsLoading) {
        console.log('Animals already loading, skipping duplicate call...');
        return;
    }
    
    // Если уже загружено, просто обновляем отображение
    if (animalsLoaded && allAnimals.length > 0) {
        populateBreedFilter();
        filterAndDisplayAnimals();
        return;
    }
    
    animalsLoading = true;
    
    try {
        // Ожидание доступности animalsDB
        if (!window.animalsDB) {
            console.error('animalsDB not available, retrying...');
            animalsLoading = false;
            setTimeout(() => loadAnimals(), 500);
            return;
        }
        
        if (!window.animalsDB.getAllAnimals) {
            console.error('animalsDB.getAllAnimals not available');
            showError('Ошибка: функция getAllAnimals не найдена');
            animalsLoading = false;
            return;
        }
        
        allAnimals = await window.animalsDB.getAllAnimals();
        
        if (!Array.isArray(allAnimals)) {
            console.error('getAllAnimals did not return an array:', allAnimals);
            showError('Ошибка: неверный формат данных');
            animalsLoading = false;
            return;
        }
        
        if (allAnimals.length === 0) {
            console.warn('No animals loaded from database');
            showError('Животные не найдены в базе данных');
            animalsLoading = false;
            return;
        }
        
        console.log('Loaded animals:', allAnimals.length);
        console.log('Sample animal:', allAnimals[0]);
        
        animalsLoaded = true;
        
        // Ждем немного, чтобы убедиться, что DOM готов, затем заполняем фильтр пород
        setTimeout(() => {
            populateBreedFilter();
        filterAndDisplayAnimals();
            updateAnimalsStats(); // Обновляем статистику после загрузки
            animalsLoading = false;
        }, 100);
    } catch (error) {
        console.error('Error loading animals:', error);
        console.error('Error stack:', error.stack);
        showError('Ошибка загрузки данных о животных: ' + (error.message || 'Неизвестная ошибка'));
        animalsLoading = false;
    }
}

// Нормализация названий пород - объединяет разные варианты написания
// Экспорт для использования в admin.js
window.normalizeBreed = function(breed, species) {
    if (!breed) return breed;
    
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
};

// Также создаем локальную функцию для внутреннего использования
function normalizeBreed(breed, species) {
    return window.normalizeBreed(breed, species);
}

// Заполнение фильтра пород породами, которые существуют в базе данных
function populateBreedFilter() {
    const breedSelect = document.getElementById('breed');
    if (!breedSelect) {
        console.warn('Breed select element not found');
        return;
    }
    
    if (!allAnimals || allAnimals.length === 0) {
        console.warn('No animals loaded yet');
        return;
    }
    
    // Предотвращение множественных вызовов
    if (window.breedFilterPopulated) {
        return;
    }
    
    console.log('Populating breed filter with', allAnimals.length, 'animals');
    
    // Получение уникальных пород из животных, сгруппированных по видам (с нормализацией)
    const breedsBySpecies = {
        dog: new Set(),
        cat: new Set()
    };
    
    // Карта для хранения нормализованных пород -> оригинальных пород для отображения
    window.breedNormalizationMap = {};
    
    allAnimals.forEach(animal => {
        if (animal.breed && animal.species) {
            const normalizedBreed = normalizeBreed(animal.breed, animal.species);
            breedsBySpecies[animal.species].add(normalizedBreed);
            
            // Сохранение соответствия для фильтрации
            if (!window.breedNormalizationMap[animal.species]) {
                window.breedNormalizationMap[animal.species] = {};
            }
            if (!window.breedNormalizationMap[animal.species][normalizedBreed]) {
                window.breedNormalizationMap[animal.species][normalizedBreed] = new Set();
            }
            window.breedNormalizationMap[animal.species][normalizedBreed].add(animal.breed);
        }
    });
    
    window.breedFilterPopulated = true;
    console.log('Breeds by species:', {
        dog: Array.from(breedsBySpecies.dog),
        cat: Array.from(breedsBySpecies.cat)
    });
    
    // Сохранение данных о породах для последующего использования
    window.availableBreeds = breedsBySpecies;
    
    // Обновление фильтра пород на основе текущего выбора вида
    updateBreedFilter();
}

// Обновление опций фильтра пород на основе выбранного вида
function updateBreedFilter() {
    const breedSelect = document.getElementById('breed');
    const speciesSelect = document.getElementById('species');
    
    if (!breedSelect) {
        console.warn('Breed select element not found in updateBreedFilter');
        return;
    }
    
    if (!window.availableBreeds) {
        console.warn('Available breeds not initialized');
        return;
    }
    
    const selectedSpecies = speciesSelect ? speciesSelect.value : '';
    
    // Уменьшенное логирование
    // console.log('Updating breed filter for species:', selectedSpecies);
    // console.log('Available breeds:', window.availableBreeds);
    
    // Очистка существующих опций, кроме "Все"
    breedSelect.innerHTML = '<option value="">Все</option>';
    
    // Добавление пород для выбранного вида или всех пород, если вид не выбран
    let breedsToShow = [];
    
    if (selectedSpecies && window.availableBreeds[selectedSpecies]) {
        breedsToShow = Array.from(window.availableBreeds[selectedSpecies]).sort();
        console.log('Adding breeds for', selectedSpecies, ':', breedsToShow);
    } else {
        // Если вид не выбран, показываем все породы
        const allBreeds = new Set();
        Object.values(window.availableBreeds).forEach(breedSet => {
            breedSet.forEach(breed => allBreeds.add(breed));
        });
        breedsToShow = Array.from(allBreeds).sort();
        console.log('Adding all breeds (no species selected):', breedsToShow);
    }
    
    // Добавление пород в селект
    if (breedsToShow.length > 0) {
        breedsToShow.forEach(breed => {
            const option = document.createElement('option');
            option.value = breed;
            option.textContent = breed;
            breedSelect.appendChild(option);
        });
    } else {
        console.warn('No breeds found. Selected species:', selectedSpecies, 'Available breeds:', window.availableBreeds);
    }

    // Применяем сохранённый фильтр породы, если есть
    if (window.savedAnimalsFilters && window.savedAnimalsFilters.breed) {
        const savedBreed = window.savedAnimalsFilters.breed;
        const hasOption = Array.from(breedSelect.options).some(opt => opt.value === savedBreed);
        if (hasOption) {
            breedSelect.value = savedBreed;
        }
    }
}

// Фильтрация и отображение животных в двух секциях
function filterAndDisplayAnimals() {
    const filters = {
        species: document.getElementById('species')?.value || '',
        age: document.getElementById('age')?.value || '',
        gender: document.getElementById('gender')?.value || '',
        breed: document.getElementById('breed')?.value || ''
    };
    
    const filtered = allAnimals.filter(animal => {
        // Фильтр по виду
        if (filters.species && animal.species !== filters.species) return false;
        
        // Фильтр по полу
        if (filters.gender && animal.gender !== filters.gender) return false;
        
        // Фильтр по возрасту
        if (filters.age) {
            if (filters.age === 'young' && animal.age >= 1) return false;
            if (filters.age === 'adult' && (animal.age < 1 || animal.age >= 3)) return false;
            if (filters.age === 'senior' && animal.age < 3) return false;
        }
        
        // Фильтр по породе (с нормализацией)
        if (filters.breed) {
            const normalizedFilterBreed = normalizeBreed(filters.breed, animal.species);
            const normalizedAnimalBreed = normalizeBreed(animal.breed, animal.species);
            if (normalizedAnimalBreed !== normalizedFilterBreed) return false;
        }
        
        return true;
    });
    
    // Разделение на доступных и усыновленных
    // Доступные: в приюте и забронированные (reserved)
    const available = filtered.filter(a => a.status === 'available' || a.status === 'reserved');
    const adopted = filtered.filter(a => a.status === 'adopted');
    
    // Уменьшенное логирование - логируем только при наличии проблем
    if (filtered.length === 0) {
        console.log('No animals match the current filters');
    }
    
    displayAnimals(available, 'availableAnimalsGrid');
    displayAnimals(adopted, 'adoptedAnimalsGrid');
    
    // Обновляем статистику (используем все животные, не только отфильтрованные)
    updateAnimalsStats();
    
    // Показать/скрыть секции
    const availableSection = document.querySelector('.available-section');
    const adoptedSection = document.querySelector('.adopted-section');
    
    if (availableSection) {
        availableSection.style.display = available.length > 0 ? 'block' : 'none';
    }
    if (adoptedSection) {
        adoptedSection.style.display = adopted.length > 0 ? 'block' : 'none';
    }
    
    // Показать сообщение об отсутствии результатов, если обе секции пусты
    updateNoResults(filtered.length === 0);
}

// Обновление статистики животных
function updateAnimalsStats() {
    if (!allAnimals || allAnimals.length === 0) {
        // Если животных еще нет, показываем нули
        const totalCountEl = document.getElementById('totalAnimalsCount');
        const adoptedCountEl = document.getElementById('adoptedAnimalsCount');
        if (totalCountEl) totalCountEl.textContent = '0';
        if (adoptedCountEl) adoptedCountEl.textContent = '0';
        return;
    }
    
    // Подсчитываем общее количество животных
    const totalCount = allAnimals.length;
    
    // Подсчитываем усыновленных (статус 'adopted')
    const adoptedCount = allAnimals.filter(a => a.status === 'adopted').length;
    
    // Обновляем элементы на странице
    const totalCountEl = document.getElementById('totalAnimalsCount');
    const adoptedCountEl = document.getElementById('adoptedAnimalsCount');
    
    if (totalCountEl) {
        // Анимация числа
        animateNumber(totalCountEl, parseInt(totalCountEl.textContent) || 0, totalCount);
    }
    if (adoptedCountEl) {
        // Анимация числа
        animateNumber(adoptedCountEl, parseInt(adoptedCountEl.textContent) || 0, adoptedCount);
    }
}

// Анимация числа при изменении
function animateNumber(element, from, to) {
    if (from === to) {
        element.textContent = to;
        return;
    }
    
    const duration = 500; // миллисекунды
    const startTime = Date.now();
    const difference = to - from;
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing-функция для плавной анимации
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(from + difference * easeOutQuart);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = to;
        }
    };
    
    animate();
}

// Обработка параметра ?adopt=ID в URL для автоматического открытия заявки
async function handleAdoptionFromQuery() {
    if (adoptionHandledFromQuery) {
        return;
    }
    
    try {
        const params = new URLSearchParams(window.location.search);
        const adoptId = params.get('adopt');
        if (!adoptId) {
            return;
        }
        
        // Помечаем, что уже обработали этот параметр, чтобы не дублировать открытие модалки
        adoptionHandledFromQuery = true;
        
        if (!window.animalsDB || !window.animalsDB.getAnimalById) {
            console.warn('animalsDB not available for handleAdoptionFromQuery');
            return;
        }
        
        const animal = await window.animalsDB.getAnimalById(adoptId);
        if (!animal) {
            console.warn('Animal not found for adopt id:', adoptId);
            return;
        }
        
        const name = window.animalsDB.getLocalizedText(animal, 'name');
        openAdoptionModal(name, animal.id);
    } catch (e) {
        console.error('Error handling adoption from query:', e);
    }
}

// Работа с сохранением фильтров между переходами
function getCurrentFiltersState() {
    return {
        species: document.getElementById('species')?.value || '',
        age: document.getElementById('age')?.value || '',
        gender: document.getElementById('gender')?.value || '',
        breed: document.getElementById('breed')?.value || ''
    };
}

function saveAnimalsFilters() {
    try {
        const filters = getCurrentFiltersState();
        sessionStorage.setItem('animalsFilters', JSON.stringify(filters));
        window.savedAnimalsFilters = filters;
    } catch (e) {
        console.warn('Failed to save animals filters:', e);
    }
}

function loadAnimalsFiltersFromStorage() {
    try {
        const raw = sessionStorage.getItem('animalsFilters');
        if (!raw) return null;
        const filters = JSON.parse(raw);
        window.savedAnimalsFilters = filters;
        return filters;
    } catch (e) {
        console.warn('Failed to load animals filters:', e);
        return null;
    }
}

// Отображение животных в сетке
function displayAnimals(animals, gridId) {
    const animalsGrid = document.getElementById(gridId);
    const lang = window.animalsDB.getCurrentLanguage();
    
    if (!animalsGrid) return;
    
    if (animals.length === 0) {
        animalsGrid.innerHTML = '';
        return;
    }
    
    let adoptText = 'Хочу усыновить';
    let adoptedText = 'Усыновлен';
    let moreText = 'Подробнее';
    
    if (window.translations && window.translations.getTranslation) {
        adoptText = window.translations.getTranslation('animals.adopt', lang);
        if (adoptText === 'animals.adopt' || adoptText === 'animals-adopt') {
            adoptText = lang === 'en' ? 'Adopt' : 'Хочу усыновить';
        }
        
        adoptedText = window.translations.getTranslation('animals.adoptedBtn', lang);
        if (adoptedText === 'animals.adoptedBtn' || adoptedText === 'animals-adoptedBtn') {
            adoptedText = lang === 'en' ? 'Adopted' : 'Усыновлен';
        }
        
        moreText = window.translations.getTranslation('common.more', lang);
        if (moreText === 'common.more' || moreText === 'common-more') {
            moreText = lang === 'en' ? 'More' : 'Подробнее';
        }
    } else {
        adoptText = lang === 'en' ? 'Adopt' : 'Хочу усыновить';
        adoptedText = lang === 'en' ? 'Adopted' : 'Усыновлен';
        moreText = lang === 'en' ? 'More' : 'Подробнее';
    }
    
    animalsGrid.innerHTML = animals.map(animal => {
        const name = window.animalsDB.getLocalizedText(animal, 'name');
        const ageText = window.animalsDB.getLocalizedText(animal, 'ageText');
        const gender = window.animalsDB.getLocalizedText(animal, 'gender');
        const status = window.animalsDB.getLocalizedText(animal, 'status');
        const description = window.animalsDB.getLocalizedText(animal, 'description');
        const traits = lang === 'en' ? animal.traitsEn : animal.traits;
        
        const traitsHTML = traits.slice(0, 3).map(trait => 
            `<span class="trait">${trait}</span>`
        ).join('');
        
        return `
            <div class="animal-card">
                <div class="animal-image">
                    <a href="animal-detail.html?id=${animal.id}" style="display: block;">
                        <img src="images/${animal.photos[0]}" alt="${name}">
                    </a>
                    <div class="animal-status ${animal.status}">${status}</div>
                </div>
                <div class="animal-info">
                    <h3 class="animal-name">
                        <a href="animal-detail.html?id=${animal.id}" style="text-decoration: none; color: inherit;">
                            ${name}
                        </a>
                    </h3>
                    <p class="animal-details">${gender}, ${ageText}</p>
                    <p class="animal-description">${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</p>
                    <div class="animal-traits">
                        ${traitsHTML}
                    </div>
                    <a href="animal-detail.html?id=${animal.id}" class="btn btn-outline">
                        ${moreText}
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Открытие модального окна с деталями животного
async function openAnimalDetailModal(animalId) {
    try {
        const animal = await window.animalsDB.getAnimalById(animalId);
        if (!animal) {
            showMessage('Животное не найдено', 'error');
            return;
        }
        
        currentModalAnimal = animal;
        currentModalImageIndex = 0;
        
        const lang = window.animalsDB.getCurrentLanguage();
        const modal = document.getElementById('animalDetailModal');
        
        // Установка имени животного
        const name = window.animalsDB.getLocalizedText(animal, 'name');
        document.getElementById('modalAnimalName').textContent = name;
        
        // Установка статуса
        const status = window.animalsDB.getLocalizedText(animal, 'status');
        const statusEl = document.getElementById('modalAnimalStatus');
        statusEl.textContent = status;
        statusEl.className = `animal-status-modal ${animal.status}`;
        
        // Установка деталей
        const ageText = window.animalsDB.getLocalizedText(animal, 'ageText');
        const gender = window.animalsDB.getLocalizedText(animal, 'gender');
        const breed = window.animalsDB.getLocalizedText(animal, 'breed');
        document.getElementById('modalAnimalDetails').textContent = `${gender}, ${ageText}, ${breed}`;
        
        // Установка описания
        const description = window.animalsDB.getLocalizedText(animal, 'description');
        document.getElementById('modalAnimalDescription').textContent = description;
        
        // Установка характеристик
        const traits = lang === 'en' ? animal.traitsEn : animal.traits;
        const traitsContainer = document.getElementById('modalAnimalTraits');
        traitsContainer.innerHTML = `
            <h4 data-translate="animals.traits">Характер и особенности</h4>
            <div class="traits-list">
                ${traits.map(trait => `<span class="trait">${trait}</span>`).join('')}
            </div>
        `;
        
        // Установка информации о здоровье
        const healthStatus = window.animalsDB.getLocalizedText(animal, 'healthStatus');
        const healthContainer = document.getElementById('modalAnimalHealth');
        const vaccinatedText = window.translations ? window.translations.getTranslation('animals.vaccinated', lang) : 'Вакцинирован';
        const sterilizedText = window.translations ? window.translations.getTranslation('animals.sterilized', lang) : 'Стерилизован';
        const healthText = window.translations ? window.translations.getTranslation('animals.health', lang) : 'Здоровье';
        
        healthContainer.innerHTML = `
            <h4>${healthText}</h4>
            <div class="health-info">
                <p><strong>${healthStatus}</strong></p>
                <p>${animal.vaccinated ? '✓ ' + vaccinatedText : ''}</p>
                <p>${animal.sterilized ? '✓ ' + sterilizedText : ''}</p>
            </div>
        `;
        
        // Показать/скрыть кнопку усыновления
        const adoptButton = document.getElementById('modalAdoptButton');
        if (adoptButton) {
            const adoptTextEl = adoptButton.querySelector('[data-translate=\"animals.adopt\"]');
            
            if (animal.status === 'available') {
                adoptButton.style.display = 'block';
                adoptButton.disabled = false;
                adoptButton.classList.remove('btn-disabled');
                if (adoptTextEl) {
                    adoptTextEl.textContent = window.translations
                        ? window.translations.getTranslation('animals.adopt', lang)
                        : (lang === 'en' ? 'Adopt' : 'Хочу усыновить');
                }
            } else if (animal.status === 'reserved') {
                adoptButton.style.display = 'block';
                adoptButton.disabled = true;
                adoptButton.classList.add('btn-disabled');
                if (adoptTextEl) {
                    adoptTextEl.textContent = lang === 'en'
                        ? 'Pet is already reserved'
                        : 'Питомец уже забронирован';
                }
            } else {
                adoptButton.style.display = 'none';
            }
        }
        
        // Настройка слайдера изображений
        setupImageSlider(animal.photos);
        
        // Показать модальное окно
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error opening animal detail:', error);
        showMessage('Ошибка загрузки информации о животном', 'error');
    }
}

// Настройка слайдера изображений
function setupImageSlider(photos) {
    if (!photos || photos.length === 0) return;
    
    currentModalImageIndex = 0;
    updateModalImage(photos);
    
    // Создание точек навигации
    const dotsContainer = document.getElementById('modalSliderDots');
    dotsContainer.innerHTML = '';
    photos.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'dot' + (index === 0 ? ' active' : '');
        dot.onclick = () => {
            currentModalImageIndex = index;
            updateModalImage(photos);
        };
        dotsContainer.appendChild(dot);
    });
}

// Обновление изображения в модальном окне
function updateModalImage(photos) {
    if (!photos || photos.length === 0) return;
    
    const mainImage = document.getElementById('modalMainImage');
    if (mainImage) {
        mainImage.src = `images/${photos[currentModalImageIndex]}`;
        mainImage.alt = `Photo ${currentModalImageIndex + 1}`;
    }
    
    // Обновление точек навигации
    const dots = document.querySelectorAll('#modalSliderDots .dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentModalImageIndex);
    });
}

// Изменение изображения в модальном окне
function changeModalImage(direction) {
    if (!currentModalAnimal || !currentModalAnimal.photos) return;
    
    const photos = currentModalAnimal.photos;
    currentModalImageIndex += direction;
    
    if (currentModalImageIndex < 0) {
        currentModalImageIndex = photos.length - 1;
    } else if (currentModalImageIndex >= photos.length) {
        currentModalImageIndex = 0;
    }
    
    updateModalImage(photos);
}

// Закрытие модального окна с деталями животного
function closeAnimalDetailModal() {
    const modal = document.getElementById('animalDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentModalAnimal = null;
        currentModalImageIndex = 0;
    }
}

// Открытие модального окна усыновления из модального окна деталей
function openAdoptionModalFromDetail() {
    if (!currentModalAnimal) return;
    
    closeAnimalDetailModal();
    
    const lang = window.animalsDB.getCurrentLanguage();
    const name = window.animalsDB.getLocalizedText(currentModalAnimal, 'name');
    openAdoptionModal(name, currentModalAnimal.id);
}

// Фильтрация животных
function filterAnimals() {
    filterAndDisplayAnimals();
}

// Обновление сообщения об отсутствии результатов
function updateNoResults(show) {
    const noResults = document.getElementById('noResults');
    const availableSection = document.querySelector('.available-section');
    const adoptedSection = document.querySelector('.adopted-section');
    
    if (noResults) {
        noResults.style.display = show ? 'block' : 'none';
    }
    
    if (show) {
        if (availableSection) availableSection.style.display = 'none';
        if (adoptedSection) adoptedSection.style.display = 'none';
    }
}

// Очистка фильтров
function clearFilters() {
    const filters = {
        species: document.getElementById('species'),
        age: document.getElementById('age'),
        gender: document.getElementById('gender'),
        breed: document.getElementById('breed')
    };
    
    Object.values(filters).forEach(filter => {
        if (filter) {
            filter.value = '';
            filter.classList.remove('filter-active');
        }
    });
    
    // Обновление фильтра пород для отображения всех пород
    updateBreedFilter();
    filterAndDisplayAnimals();
    
    // Удаляем сохранённые фильтры
    try {
        sessionStorage.removeItem('animalsFilters');
        window.savedAnimalsFilters = null;
    } catch (e) {
        console.warn('Failed to clear animals filters from storage:', e);
    }
}

// Открытие модального окна усыновления
function openAdoptionModal(animalName, animalId) {
    const modal = document.getElementById('adoptionModal');
    const animalNameInput = document.getElementById('animalName');
    
    if (animalNameInput) {
        animalNameInput.value = animalName;
    }
    
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    if (modal) {
        modal.dataset.animalId = animalId;
    }
    
    // Автозаполнение формы данными из профиля, если пользователь авторизован
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    
    if (isLoggedIn) {
        const userName = localStorage.getItem('userName') || '';
        const userPhone = localStorage.getItem('userPhone') || '';
        const userEmail = localStorage.getItem('userEmail') || '';
        
        if (fullNameInput && userName) {
            fullNameInput.value = userName;
            fullNameInput.readOnly = true; // ФИО фиксировано для авторизованного пользователя
        }
        if (phoneInput && userPhone) {
            phoneInput.value = userPhone;
        }
        if (emailInput && userEmail) {
            emailInput.value = userEmail;
        }
    } else {
        // Для неавторизованных пользователей даём возможность ввести ФИО вручную
        if (fullNameInput) {
            fullNameInput.readOnly = false;
        }
    }
}

// Закрытие модального окна усыновления
function closeAdoptionModal() {
    const modal = document.getElementById('adoptionModal');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        const form = document.getElementById('adoptionForm');
        if (form) {
            form.reset();
        }
    }
}

// Модальное окно успешной подачи заявки на усыновление
const adoptionSuccessModal = document.getElementById('adoptionSuccessModal');
const adoptionSuccessAnimal = document.getElementById('adoptionSuccessAnimal');
const adoptionSuccessName = document.getElementById('adoptionSuccessName');
const adoptionSuccessPhone = document.getElementById('adoptionSuccessPhone');
const adoptionSuccessEmail = document.getElementById('adoptionSuccessEmail');
const adoptionGoToAnimalsButton = document.getElementById('adoptionGoToAnimalsButton');
const adoptionGoToProfileButton = document.getElementById('adoptionGoToProfileButton');

function showAdoptionSuccessModal(info) {
    if (!adoptionSuccessModal) return;

    const { animalName, fullName, phone, email } = info || {};

    if (adoptionSuccessAnimal && animalName) {
        adoptionSuccessAnimal.textContent = `Питомец: ${animalName}`;
        adoptionSuccessAnimal.style.display = 'block';
    } else if (adoptionSuccessAnimal) {
        adoptionSuccessAnimal.style.display = 'none';
    }

    if (adoptionSuccessName && fullName) {
        adoptionSuccessName.textContent = `Ваше имя: ${fullName}`;
        adoptionSuccessName.style.display = 'block';
    } else if (adoptionSuccessName) {
        adoptionSuccessName.style.display = 'none';
    }

    if (adoptionSuccessPhone && phone) {
        adoptionSuccessPhone.textContent = `Телефон: ${phone}`;
        adoptionSuccessPhone.style.display = 'block';
    } else if (adoptionSuccessPhone) {
        adoptionSuccessPhone.style.display = 'none';
    }

    if (adoptionSuccessEmail && email) {
        adoptionSuccessEmail.textContent = `Email: ${email}`;
        adoptionSuccessEmail.style.display = 'block';
    } else if (adoptionSuccessEmail) {
        adoptionSuccessEmail.style.display = 'none';
    }

    adoptionSuccessModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAdoptionSuccessModal() {
    if (!adoptionSuccessModal) return;
    adoptionSuccessModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Показать сообщение об ошибке
function showError(message) {
    const availableGrid = document.getElementById('availableAnimalsGrid');
    const adoptedGrid = document.getElementById('adoptedAnimalsGrid');
    if (availableGrid) {
        availableGrid.innerHTML = `<div style="text-align: center; padding: 2rem; color: var(--text-light);">${message}</div>`;
    }
    if (adoptedGrid) {
        adoptedGrid.innerHTML = '';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Предотвращение множественных инициализаций
    if (animalsInitialized) {
        console.log('Animals already initialized, skipping...');
        return;
    }
    
    animalsInitialized = true;
    console.log('Animals page DOMContentLoaded');
    console.log('window.animalsDB available:', !!window.animalsDB);

    // Восстанавливаем фильтры из сессии (если были)
    const savedFilters = loadAnimalsFiltersFromStorage();
    if (savedFilters) {
        const speciesEl = document.getElementById('species');
        const ageEl = document.getElementById('age');
        const genderEl = document.getElementById('gender');
        const breedEl = document.getElementById('breed');

        if (speciesEl && savedFilters.species) {
            speciesEl.value = savedFilters.species;
            speciesEl.classList.add('filter-active');
        }
        if (ageEl && savedFilters.age) {
            ageEl.value = savedFilters.age;
            ageEl.classList.add('filter-active');
        }
        if (genderEl && savedFilters.gender) {
            genderEl.value = savedFilters.gender;
            genderEl.classList.add('filter-active');
        }
        if (breedEl && savedFilters.breed) {
            // Значение применится после того, как породы будут загружены и updateBreedFilter обновит список
            breedEl.classList.add('filter-active');
        }
    }
    
    // Ожидание доступности animalsDB
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds max
    
    const initAnimals = setInterval(() => {
        attempts++;
        if (window.animalsDB && window.animalsDB.getAllAnimals) {
            console.log('animalsDB is available, loading animals...');
            clearInterval(initAnimals);
            loadAnimals();
            // После загрузки животных проверяем, нужно ли сразу открыть модалку усыновления по параметру URL
            handleAdoptionFromQuery();
        } else if (attempts >= maxAttempts) {
            console.error('animalsDB not available after', attempts, 'attempts');
            clearInterval(initAnimals);
            showError('Ошибка: не удалось загрузить модуль базы данных. Проверьте консоль браузера.');
        }
    }, 100);
    
    // Добавление обработчиков событий для фильтров
    const filterElements = ['species', 'age', 'gender', 'breed'];
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                // Подсветка активного фильтра
                if (this.value) {
                    this.classList.add('filter-active');
                } else {
                    this.classList.remove('filter-active');
                }
                
                // Если вид изменился, обновляем фильтр пород
                if (id === 'species') {
                    updateBreedFilter();
                    // Сброс выбора породы при изменении вида
                    const breedSelect = document.getElementById('breed');
                    if (breedSelect) breedSelect.value = '';
                }
                filterAnimals();
                saveAnimalsFilters();
            });
        }
    });
    
    // Кнопка очистки фильтров
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Форма усыновления
    const adoptionForm = document.getElementById('adoptionForm');
    if (adoptionForm) {
        adoptionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!window.validateForm || !window.validateForm(this)) {
                window.showMessage && window.showMessage('Пожалуйста, заполните все обязательные поля.', 'error');
                return;
            }
            
            try {
                const adoptionModal = document.getElementById('adoptionModal');
                const animalIdRaw = adoptionModal ? adoptionModal.dataset.animalId : null;
                const animalId = animalIdRaw ? parseInt(animalIdRaw) : null;
                
                const animalName = document.getElementById('animalName')?.value.trim() || '-';
                const fullNameFromForm = document.getElementById('fullName')?.value.trim() || '';
                const phone = document.getElementById('phone')?.value.trim() || '';
                const email = document.getElementById('email')?.value.trim() || '';
                const address = document.getElementById('address')?.value.trim() || '';
                const experience = document.getElementById('experience')?.value.trim() || '';
                const motivation = document.getElementById('motivation')?.value.trim() || '';
                
                // Определяем userId по сохраненному телефону, как в профиле
                let userPhone = localStorage.getItem('userPhone') || phone;
                let userId = '';
                const storedUserName = localStorage.getItem('userName') || '';
                // Если пользователь авторизован, всегда используем имя из профиля
                const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
                const effectiveUserName = isLoggedIn && storedUserName ? storedUserName : fullNameFromForm;
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
                
                // Создаем заявку в базе заявок, если модуль доступен
                if (window.applicationsDB && window.applicationsDB.addApplication) {
                    const application = {
                        type: 'Усыновление',
                        userName: effectiveUserName,
                        userPhone: phone,
                        userEmail: email,
                        userId: userId,
                        address: address,
                        experience: experience,
                        motivation: motivation,
                        date: new Date().toISOString().split('T')[0],
                        status: 'pending',
                        statusRu: 'На рассмотрении',
                        statusEn: 'Pending',
                        viewed: false,
                        animalId: animalId,
                        animalName: animalName || '-'
                    };
                    
                    window.applicationsDB.addApplication(application);
                }
                
                // Меняем статус животного на "забронирован", чтобы оно не считалось свободным
                if (
                    animalId &&
                    window.animalsDB &&
                    window.animalsDB.animalsData &&
                    Array.isArray(window.animalsDB.animalsData.animals)
                ) {
                    const animal = window.animalsDB.animalsData.animals.find(a => a.id === animalId);
                    if (animal && animal.status === 'available') {
                        animal.status = 'reserved';
                        animal.statusRu = 'Забронирован';
                        animal.statusEn = 'Reserved';
                        
                        try {
                            localStorage.setItem('animalsData', JSON.stringify(window.animalsDB.animalsData));
                        } catch (err) {
                            console.warn('Could not save updated animalsData to localStorage:', err);
                        }
                        
                        // Обновляем список животных на странице
                        filterAndDisplayAnimals();
                    }
                }

                // Закрываем форму и показываем модальное окно успешной заявки
                closeAdoptionModal();
                showAdoptionSuccessModal({
                    animalName,
                    fullName: effectiveUserName,
                    phone,
                    email
                });
            } catch (error) {
                console.error('Error submitting adoption application:', error);
                window.showMessage && window.showMessage('Ошибка при отправке заявки на усыновление.', 'error');
            }
        });
    }
    
    // Закрытие модальных окон при клике вне их
    document.addEventListener('click', function(e) {
        const animalModal = document.getElementById('animalDetailModal');
        const adoptionModal = document.getElementById('adoptionModal');
        const adoptionSuccessModalEl = document.getElementById('adoptionSuccessModal');

        if (animalModal && e.target === animalModal) {
            closeAnimalDetailModal();
        }
        if (adoptionModal && e.target === adoptionModal) {
            closeAdoptionModal();
        }
        if (adoptionSuccessModalEl && e.target === adoptionSuccessModalEl) {
            closeAdoptionSuccessModal();
        }
    });
    
    // Закрытие модальных окон клавишей Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAnimalDetailModal();
            closeAdoptionModal();
            closeAdoptionSuccessModal();
        }
    });

    if (adoptionGoToAnimalsButton) {
        adoptionGoToAnimalsButton.addEventListener('click', function() {
            window.location.href = 'animals.html';
        });
    }

    if (adoptionGoToProfileButton) {
        adoptionGoToProfileButton.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }
    
    // Навигация по клавиатуре для слайдера изображений
    document.addEventListener('keydown', function(e) {
        const animalModal = document.getElementById('animalDetailModal');
        if (animalModal && animalModal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') {
                changeModalImage(-1);
            } else if (e.key === 'ArrowRight') {
                changeModalImage(1);
            }
        }
    });
    
    // Прослушивание изменений языка для перезагрузки животных
    document.addEventListener('languageChanged', async (e) => {
        // Если животные уже загружены, просто обновляем отображение без перезагрузки данных
        if (animalsLoaded && allAnimals.length > 0) {
            filterAndDisplayAnimals();
        } else {
        await loadAnimals();
        }
    });
});

// Сделать функции глобально доступными
window.clearFilters = clearFilters;
window.openAdoptionModal = openAdoptionModal;
window.closeAdoptionModal = closeAdoptionModal;
window.openAnimalDetailModal = openAnimalDetailModal;
window.closeAnimalDetailModal = closeAnimalDetailModal;
window.changeModalImage = changeModalImage;
window.openAdoptionModalFromDetail = openAdoptionModalFromDetail;

