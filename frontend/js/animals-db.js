// Управление базой данных животных

let animalsData = null;

// Загрузка животных из JSON файла (внутренняя функция)
async function loadAnimalsData() {
    if (animalsData) {
        console.log('Using cached animals data:', animalsData.animals ? animalsData.animals.length : 0);
        return animalsData;
    }
    
    try {
        // Логируем только если не используем кэш
        if (!animalsData) {
            console.log('Fetching animals.json...');
        }
        const response = await fetch('../data/animals.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // Логируем только если не используем кэш
        if (!animalsData) {
            console.log('Parsed JSON data:', data);
        }
        
        // Валидация структуры данных
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format: expected object, got ' + typeof data);
        }
        if (!data.animals) {
            console.error('data.animals is missing. Data keys:', Object.keys(data));
            throw new Error('data.animals is missing');
        }
        if (!Array.isArray(data.animals)) {
            console.error('data.animals is not an array. Type:', typeof data.animals, 'Value:', data.animals);
            throw new Error('data.animals is not an array');
        }
        
        animalsData = data;
        // Логируем только если не используем кэш
        if (!animalsData || animalsData.animals.length !== data.animals.length) {
            console.log('Animals loaded successfully:', data.animals.length, 'animals');
        }
        
        // Пытаемся сначала загрузить из localStorage (для сохранения статуса усыновленных / забронированных)
        try {
            const savedData = localStorage.getItem('animalsData');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                // Обновляем статус из localStorage (поддерживаем не только adopted, но и reserved и другие будущие статусы)
                if (parsed && parsed.animals && parsed.animals.length > 0) {
                    parsed.animals.forEach(savedAnimal => {
                        const fileAnimal = animalsData.animals.find(a => a.id === savedAnimal.id);
                        if (fileAnimal && savedAnimal.status) {
                            fileAnimal.status = savedAnimal.status;
                            if (savedAnimal.statusRu) {
                                fileAnimal.statusRu = savedAnimal.statusRu;
                            }
                            if (savedAnimal.statusEn) {
                                fileAnimal.statusEn = savedAnimal.statusEn;
                            }
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('Could not load animals from localStorage:', e);
        }

        // Доп. защита от "застрявшего" статуса reserved:
        // если у животного статус reserved, но нет ни одной заявки на усыновление в статусе pending для него,
        // возвращаем статус "в приюте".
        try {
            const appsRaw = localStorage.getItem('applicationsData');
            if (appsRaw) {
                const appsParsed = JSON.parse(appsRaw);
                const applications = Array.isArray(appsParsed?.applications) ? appsParsed.applications : [];

                animalsData.animals.forEach(animal => {
                    if (animal.status === 'reserved') {
                        const hasPendingAdoption = applications.some(app =>
                            (app.type === 'Усыновление' || app.type === 'Adoption') &&
                            app.status === 'pending' &&
                            (
                                app.animalId === animal.id ||
                                app.animalName === animal.name ||
                                app.animalName === animal.nameEn
                            )
                        );

                        if (!hasPendingAdoption) {
                            animal.status = 'available';
                            animal.statusRu = 'В приюте';
                            animal.statusEn = 'Available';
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('Could not sync reserved animals with applications:', e);
        }
        
        // Экспорт для внешнего доступа
        window.animalsDB.animalsData = animalsData;
        
        // Сохранение в localStorage
        try {
            localStorage.setItem('animalsData', JSON.stringify(animalsData));
        } catch (e) {
            console.warn('Could not save animals to localStorage:', e);
        }
        
        return animalsData;
    } catch (error) {
        console.error('Error loading animals:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        animalsData = { animals: [] };
        return animalsData;
    }
}

// Получить всех животных
async function getAllAnimals() {
    try {
        const data = await loadAnimalsData();
        if (!data) {
            console.error('loadAnimals returned null or undefined');
            return [];
        }
        if (!data.animals) {
            console.error('data.animals is undefined. Data structure:', data);
            return [];
        }
        return data.animals || [];
    } catch (error) {
        console.error('Error in getAllAnimals:', error);
        return [];
    }
}

// Получить животное по ID
async function getAnimalById(id) {
    const animals = await getAllAnimals();
    return animals.find(animal => animal.id === parseInt(id));
}

// Получить только доступных животных
async function getAvailableAnimals() {
    const animals = await getAllAnimals();
    return animals.filter(animal => animal.status === 'available');
}

// Получить животных по виду
async function getAnimalsBySpecies(species) {
    const animals = await getAllAnimals();
    if (!species) return animals;
    return animals.filter(animal => animal.species === species);
}

// Получить количество животных
async function getAnimalsCount() {
    const animals = await getAllAnimals();
    return animals.length;
}

// Получить количество доступных животных
async function getAvailableAnimalsCount() {
    const available = await getAvailableAnimals();
    return available.length;
}

// Фильтрация животных по критериям
async function filterAnimals(filters) {
    let animals = await getAllAnimals();
    
    if (filters.species) {
        animals = animals.filter(a => a.species === filters.species);
    }
    
    if (filters.status) {
        animals = animals.filter(a => a.status === filters.status);
    }
    
    if (filters.gender) {
        animals = animals.filter(a => a.gender === filters.gender);
    }
    
    if (filters.age) {
        animals = animals.filter(a => {
            if (filters.age === 'young') return a.age < 1;
            if (filters.age === 'adult') return a.age >= 1 && a.age < 3;
            if (filters.age === 'senior') return a.age >= 3;
            return true;
        });
    }
    
    return animals;
}

// Получить текущий язык
function getCurrentLanguage() {
    return document.documentElement.getAttribute('lang') || 'ru';
}

// Получить локализованный текст для животного
function getLocalizedText(animal, field) {
    const lang = getCurrentLanguage();
    if (lang === 'en') {
        // Для английского языка: сначала пробуем fieldEn, потом field
        return animal[field + 'En'] || animal[field] || '';
    } else {
        // Для русского языка: сначала пробуем fieldRu, потом field (если fieldRu нет)
        // Это важно, потому что field может содержать английское значение (например, "available", "male", "female")
        return animal[field + 'Ru'] || animal[field] || '';
    }
}

// Экспорт функций
// Примечание: loadAnimalsData не экспортируется, чтобы избежать конфликта с loadAnimals в animals.js
window.animalsDB = {
    animalsData: null, // Будет установлено при загрузке данных
    getAllAnimals,
    getAnimalById,
    getAvailableAnimals,
    getAnimalsBySpecies,
    getAnimalsCount,
    getAvailableAnimalsCount,
    filterAnimals,
    getCurrentLanguage,
    getLocalizedText
};

// Логирование загрузки модуля
console.log('animals-db.js module loaded, animalsDB exported:', !!window.animalsDB);

