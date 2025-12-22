// Функциональность страницы новостей

let allNews = [];
let allEvents = [];
let currentNewsIndex = 0;
let currentEventIndex = 0;

// Загрузка событий из базы данных
async function loadEvents() {
    try {
        // Ожидание доступности eventsDB
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            if (window.eventsDB && window.eventsDB.getAllEvents) {
                allEvents = await window.eventsDB.getAllEvents();
                console.log('Loaded events:', allEvents.length);
                // Отображение событий на странице
                displayEventsOnPage();
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('eventsDB not available after', maxAttempts, 'attempts');
        // Резервный вариант - пустой массив
        allEvents = [];
        displayEventsOnPage();
    } catch (error) {
        console.error('Error loading events:', error);
        allEvents = [];
        displayEventsOnPage();
    }
}

// Загрузка новостей из базы данных
async function loadNews() {
    try {
        // Ожидание доступности newsDB
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            if (window.newsDB && window.newsDB.getAllNews) {
                allNews = await window.newsDB.getAllNews();
                console.log('Loaded news:', allNews.length);
                // Отображение новостей на странице
                displayNewsOnPage();
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('newsDB not available after', maxAttempts, 'attempts');
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

// Отображение новостей на странице
function displayNewsOnPage() {
    const newsGrid = document.getElementById('newsGrid');
    if (!newsGrid) return;
    
    if (allNews.length === 0) {
        newsGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">Новости не найдены</p>';
        return;
    }
    
    const lang = document.documentElement.getAttribute('lang') || 'ru';
    
    // Сортировка новостей по дате (новые первыми)
    const sortedNews = [...allNews].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    newsGrid.innerHTML = sortedNews.map(news => {
        const title = getLocalizedText(news, 'title');
        const excerpt = getLocalizedText(news, 'excerpt');
        const category = getLocalizedText(news, 'category');
        const date = formatDate(news.date);
        const isFeatured = news.featured;
        const titleTag = isFeatured ? 'h2' : 'h3';
        
        return `
            <article class="news-card ${isFeatured ? 'featured' : ''}" data-news-id="${news.id}">
                <div class="news-image">
                    <img src="images/${news.image}" alt="${title}">
                    ${isFeatured ? '<div class="news-badge" data-translate="news.featuredBadge">Главная новость</div>' : ''}
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-date">${date}</span>
                        <span class="news-category">${category}</span>
                    </div>
                    <${titleTag} class="news-title">${title}</${titleTag}>
                    <p class="news-excerpt">${excerpt}</p>
                    <a href="#" class="news-link" data-translate="news.readMore">Читать подробнее</a>
                </div>
            </article>
        `;
    }).join('');
    
    // Делаем новости кликабельными после рендеринга
    makeNewsClickable();
}

// Форматирование даты с локализацией
function formatDate(dateString) {
    const date = new Date(dateString);
    const lang = document.documentElement.getAttribute('lang') || 'ru';

    if (lang === 'en') {
        const monthsEn = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthsEn[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } else {
        const monthsRu = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];
        return `${date.getDate()} ${monthsRu[date.getMonth()]} ${date.getFullYear()}`;
    }
}

// Получение локализованного текста
function getLocalizedText(item, field) {
    const lang = document.documentElement.getAttribute('lang') || 'ru';
    if (lang === 'en' && item[field + 'En']) {
        return item[field + 'En'];
    }
    return item[field] || '';
}

// Открытие модального окна с деталями новости
async function openNewsDetailModal(newsId) {
    await loadNews();
    
    const news = allNews.find(n => n.id === parseInt(newsId));
    if (!news) {
        showMessage('Новость не найдена', 'error');
        return;
    }
    
    currentNewsIndex = allNews.findIndex(n => n.id === parseInt(newsId));
    
    const modal = document.getElementById('newsDetailModal');
    const lang = document.documentElement.getAttribute('lang') || 'ru';
    
    // Установка содержимого новости
    document.getElementById('newsDetailImage').src = `images/${news.image}`;
    document.getElementById('newsDetailDate').textContent = formatDate(news.date);
    document.getElementById('newsDetailCategory').textContent = getLocalizedText(news, 'category');
    document.getElementById('newsDetailTitle').textContent = getLocalizedText(news, 'title');
    
    const content = getLocalizedText(news, 'content');
    const excerpt = getLocalizedText(news, 'excerpt');
    document.getElementById('newsDetailContent').innerHTML = content || `<p>${excerpt}</p>`;
    
    // Настройка точек слайдера
    setupNewsSliderDots();
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Настройка точек слайдера новостей
function setupNewsSliderDots() {
    const dotsContainer = document.getElementById('newsSliderDots');
    dotsContainer.innerHTML = '';
    
    allNews.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'dot' + (index === currentNewsIndex ? ' active' : '');
        dot.onclick = () => {
            currentNewsIndex = index;
            displayNewsByIndex();
        };
        dotsContainer.appendChild(dot);
    });
}

// Отображение новости по текущему индексу
function displayNewsByIndex() {
    if (currentNewsIndex < 0 || currentNewsIndex >= allNews.length) return;
    
    const news = allNews[currentNewsIndex];
    const lang = document.documentElement.getAttribute('lang') || 'ru';
    
    document.getElementById('newsDetailImage').src = `images/${news.image}`;
    document.getElementById('newsDetailDate').textContent = formatDate(news.date);
    document.getElementById('newsDetailCategory').textContent = getLocalizedText(news, 'category');
    document.getElementById('newsDetailTitle').textContent = getLocalizedText(news, 'title');
    
    const content = getLocalizedText(news, 'content');
    const excerpt = getLocalizedText(news, 'excerpt');
    // Замена переносов строк на теги <br> и оборачивание в параграфы
    const formattedContent = content 
        ? content.split('\n').map(line => line.trim() ? `<p>${line.trim()}</p>` : '').join('')
        : `<p>${excerpt}</p>`;
    document.getElementById('newsDetailContent').innerHTML = formattedContent;
    
    setupNewsSliderDots();
}

// Изменение новости в слайдере
function changeNews(direction) {
    currentNewsIndex += direction;
    
    if (currentNewsIndex < 0) {
        currentNewsIndex = allNews.length - 1;
    } else if (currentNewsIndex >= allNews.length) {
        currentNewsIndex = 0;
    }
    
    displayNewsByIndex();
}

// Закрытие модального окна с деталями новости
function closeNewsDetailModal() {
    const modal = document.getElementById('newsDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Отображение событий на странице
function displayEventsOnPage() {
    const eventsGrid = document.querySelector('.events-grid');
    if (!eventsGrid) return;
    
    if (allEvents.length === 0) {
        eventsGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">События не найдены</p>';
        return;
    }
    
    const lang = document.documentElement.getAttribute('lang') || 'ru';
    
    // Сортировка событий по дате (предстоящие первыми)
    const sortedEvents = [...allEvents].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    eventsGrid.innerHTML = sortedEvents.map(event => {
        const title = getLocalizedText(event, 'title');
        const description = getLocalizedText(event, 'description');
        const location = getLocalizedText(event, 'location');
        const month = lang === 'ru' ? (event.month || '') : (event.monthEn || '');
        
        return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-date">
                    <span class="event-day">${event.day || ''}</span>
                    <span class="event-month">${month}</span>
                </div>
                <div class="event-content">
                    <h3 class="event-title">${title}</h3>
                    <p class="event-description">${description}</p>
                    <div class="event-meta">
                        <span>📍 ${location}</span>
                        <span>🕐 ${event.time || ''}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Make events clickable
    document.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('click', () => {
            const eventId = card.getAttribute('data-event-id');
            if (eventId) {
                openEventsDetailModal(parseInt(eventId));
            }
        });
    });
}

// Открытие модального окна с деталями события
function openEventsDetailModal(eventId) {
    const event = allEvents.find(e => e.id === parseInt(eventId));
    if (!event) {
        showMessage('Событие не найдено', 'error');
        return;
    }
    
    currentEventIndex = allEvents.findIndex(e => e.id === parseInt(eventId));
    
    const modal = document.getElementById('eventsDetailModal');
    const lang = document.documentElement.getAttribute('lang') || 'ru';
    
    const title = getLocalizedText(event, 'title');
    const description = getLocalizedText(event, 'description');
    const location = getLocalizedText(event, 'location');
    const month = lang === 'ru' ? (event.month || '') : (event.monthEn || '');
    
    // Установка содержимого события
    document.getElementById('eventDetailDay').textContent = event.day || '';
    document.getElementById('eventDetailMonth').textContent = month;
    document.getElementById('eventDetailTitle').textContent = title;
    document.getElementById('eventDetailDescription').textContent = description;
    document.getElementById('eventDetailMeta').innerHTML = `
        <span>📍 ${location}</span>
        <span>🕐 ${event.time || ''}</span>
    `;
    
    // Настройка точек слайдера
    setupEventsSliderDots();
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Настройка точек слайдера событий
function setupEventsSliderDots() {
    const dotsContainer = document.getElementById('eventsSliderDots');
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    
    allEvents.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = 'dot' + (index === currentEventIndex ? ' active' : '');
        dot.onclick = () => {
            currentEventIndex = index;
            displayEventByIndex();
        };
        dotsContainer.appendChild(dot);
    });
}

// Отображение события по текущему индексу
function displayEventByIndex() {
    if (currentEventIndex < 0 || currentEventIndex >= allEvents.length) return;
    
    const event = allEvents[currentEventIndex];
    const lang = document.documentElement.getAttribute('lang') || 'ru';
    
    const title = getLocalizedText(event, 'title');
    const description = getLocalizedText(event, 'description');
    const location = getLocalizedText(event, 'location');
    const month = lang === 'ru' ? (event.month || '') : (event.monthEn || '');
    
    document.getElementById('eventDetailDay').textContent = event.day || '';
    document.getElementById('eventDetailMonth').textContent = month;
    document.getElementById('eventDetailTitle').textContent = title;
    document.getElementById('eventDetailDescription').textContent = description;
    document.getElementById('eventDetailMeta').innerHTML = `
        <span>📍 ${location}</span>
        <span>🕐 ${event.time || ''}</span>
    `;
    
    setupEventsSliderDots();
}

// Изменение события в слайдере
function changeEvent(direction) {
    currentEventIndex += direction;
    
    if (currentEventIndex < 0) {
        currentEventIndex = allEvents.length - 1;
    } else if (currentEventIndex >= allEvents.length) {
        currentEventIndex = 0;
    }
    
    displayEventByIndex();
}

// Закрытие модального окна с деталями события
function closeEventsDetailModal() {
    const modal = document.getElementById('eventsDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Делаем карточки новостей кликабельными
function makeNewsClickable() {
    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => {
        const newsId = card.getAttribute('data-news-id');
        if (newsId) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', async (e) => {
                // Не открываем, если клик по самой ссылке
                const newsLink = card.querySelector('.news-link');
                if (newsLink && (e.target === newsLink || newsLink.contains(e.target))) {
                    return;
                }
                
                openNewsDetailModal(newsId);
            });
        }
    });
    
    // Также делаем ссылки кликабельными
    const newsLinks = document.querySelectorAll('.news-link');
    newsLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const card = link.closest('.news-card');
            const newsId = card?.getAttribute('data-news-id');
            
            if (newsId) {
                openNewsDetailModal(newsId);
            }
        });
    });
}

// Делаем карточки событий кликабельными
function makeEventsClickable() {
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        const eventId = card.getAttribute('data-event-id');
        if (eventId) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                openEventsDetailModal(eventId);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    const newsletterForm = document.getElementById('newsletterForm');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const newsletterEmail = document.getElementById('newsletterEmail');
    
    // Установка плейсхолдера для email рассылки
    if (newsletterEmail && window.translations) {
        const lang = document.documentElement.getAttribute('lang') || 'ru';
        const placeholder = window.translations.t('news.subscribePlaceholder', lang);
        if (placeholder && placeholder !== 'news.subscribePlaceholder') {
            newsletterEmail.placeholder = placeholder;
        } else {
            newsletterEmail.placeholder = lang === 'en' ? 'Your email' : 'Ваш email';
        }
    }
    
    // Обновление плейсхолдера при изменении языка
    document.addEventListener('languageChanged', function(e) {
        if (newsletterEmail && window.translations) {
            const lang = e.detail?.lang || document.documentElement.getAttribute('lang') || 'ru';
            const placeholder = window.translations.t('news.subscribePlaceholder', lang);
            if (placeholder && placeholder !== 'news.subscribePlaceholder') {
                newsletterEmail.placeholder = placeholder;
            } else {
                newsletterEmail.placeholder = lang === 'en' ? 'Your email' : 'Ваш email';
            }
        }
    });
    
    // Загрузка новостей и событий из базы данных
    await loadNews();
    await loadEvents();

    // Если на страницу "Новости" пришли с параметром конкретной новости (с главной),
    // автоматически открываем модальное окно с этой новостью
    const params = new URLSearchParams(window.location.search);
    const newsIdFromUrl = params.get('newsId');
    if (newsIdFromUrl) {
        openNewsDetailModal(parseInt(newsIdFromUrl, 10));
    }
    
    // Перезагрузка новостей и событий при изменении хранилища (когда админ-панель обновляется)
    window.addEventListener('storage', function(e) {
        if (e.key === 'newsData') {
            // Сброс кэша newsData для принудительной перезагрузки
            if (window.newsDB && window.newsDB.resetNewsCache) {
                window.newsDB.resetNewsCache();
            }
            loadNews();
        }
        if (e.key === 'eventsData') {
            // Сброс кэша eventsData для принудительной перезагрузки
            if (window.eventsDB && window.eventsDB.resetEventsCache) {
                window.eventsDB.resetEventsCache();
            }
            loadEvents();
        }
    });
    
    // Также проверяем изменения localStorage в том же окне (для админ-панели)
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (key === 'newsData') {
            // Сброс кэша newsData для принудительной перезагрузки
            if (window.newsDB && window.newsDB.resetNewsCache) {
                window.newsDB.resetNewsCache();
            }
            loadNews();
        }
        if (key === 'eventsData') {
            // Сброс кэша eventsData для принудительной перезагрузки
            if (window.eventsDB && window.eventsDB.resetEventsCache) {
                window.eventsDB.resetEventsCache();
            }
            loadEvents();
        }
    };
    
    // Подписка на рассылку
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            
            if (email) {
                // Имитация подписки
                showMessage('Спасибо за подписку! Теперь вы будете получать наши новости.', 'success');
                this.reset();
            } else {
                showMessage('Пожалуйста, введите корректный email адрес.', 'error');
            }
        });
    }
    
    // Функциональность "Загрузить еще"
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            // Имитация загрузки дополнительных новостей
            this.textContent = 'Загрузка...';
            this.disabled = true;
            
            setTimeout(() => {
                // В реальной реализации это загрузило бы дополнительные статьи с сервера
                showMessage('Все новости загружены', 'success');
                this.style.display = 'none';
            }, 1500);
        });
    }
    
    // Делаем события кликабельными (новости делаются кликабельными в displayNewsOnPage)
    setTimeout(() => {
        makeEventsClickable();
    }, 500);
    
    // Закрытие модальных окон при клике вне их
    document.addEventListener('click', function(e) {
        const newsModal = document.getElementById('newsDetailModal');
        const eventsModal = document.getElementById('eventsDetailModal');
        
        if (newsModal && e.target === newsModal) {
            closeNewsDetailModal();
        }
        if (eventsModal && e.target === eventsModal) {
            closeEventsDetailModal();
        }
    });
    
    // Закрытие модальных окон клавишей Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeNewsDetailModal();
            closeEventsDetailModal();
        }
    });
    
    // Навигация по клавиатуре для слайдера новостей
    document.addEventListener('keydown', function(e) {
        const newsModal = document.getElementById('newsDetailModal');
        if (newsModal && newsModal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') {
                changeNews(-1);
            } else if (e.key === 'ArrowRight') {
                changeNews(1);
            }
        }
    });
    
    // Навигация по клавиатуре для слайдера событий
    document.addEventListener('keydown', function(e) {
        const eventsModal = document.getElementById('eventsDetailModal');
        if (eventsModal && eventsModal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') {
                changeEvent(-1);
            } else if (e.key === 'ArrowRight') {
                changeEvent(1);
            }
        }
    });
});

// Экспорт функций глобально
window.openNewsDetailModal = openNewsDetailModal;
window.closeNewsDetailModal = closeNewsDetailModal;
window.changeNews = changeNews;
window.openEventsDetailModal = openEventsDetailModal;
window.closeEventsDetailModal = closeEventsDetailModal;
window.changeEvent = changeEvent;
