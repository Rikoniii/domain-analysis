// Управление базой данных новостей

let newsData = null;

// Загрузка новостей из JSON файла и localStorage
async function loadNewsData() {
    if (newsData) {
        return newsData;
    }
    
    try {
        // Сначала пытаемся загрузить из localStorage (если есть правки из админ-панели)
        const savedNews = localStorage.getItem('newsData');
        if (savedNews) {
            try {
                newsData = JSON.parse(savedNews);
                console.log('Loaded news from localStorage:', newsData.news?.length || 0);
            } catch (e) {
                console.warn('Error parsing saved news from localStorage:', e);
            }
        }
        
        // Затем загружаем из JSON файла
        const response = await fetch('../data/news.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const jsonData = await response.json();
        
        // Объединение: если есть сохраненные данные, используем их; иначе используем JSON
        if (!newsData || !newsData.news || newsData.news.length === 0) {
            newsData = jsonData;
        } else {
            // Объединение сохраненных данных с JSON (сохраненные данные имеют приоритет)
            const savedNewsMap = new Map(newsData.news.map(n => [n.id, n]));
            const jsonNewsMap = new Map(jsonData.news.map(n => [n.id, n]));
            
            // Объединение: сохраненные новости + новые новости из JSON, которых нет в сохраненных
            const mergedNews = [
                ...Array.from(savedNewsMap.values()),
                ...Array.from(jsonNewsMap.values()).filter(n => !savedNewsMap.has(n.id))
            ];
            
            newsData = { news: mergedNews };
        }
        
        // Экспорт для внешнего доступа
        window.newsDB.newsData = newsData;
        return newsData;
    } catch (error) {
        console.error('Error loading news:', error);
        newsData = { news: [] };
        return newsData;
    }
}

// Сохранение новостей в localStorage
function saveNewsData() {
    if (newsData) {
        localStorage.setItem('newsData', JSON.stringify(newsData));
        console.log('Saved news to localStorage');
    }
}

// Получить все новости
async function getAllNews() {
    const data = await loadNewsData();
    return data.news || [];
}

// Получить новость по ID
async function getNewsById(id) {
    const news = await getAllNews();
    return news.find(n => n.id === parseInt(id));
}

// Получить главную новость
async function getFeaturedNews() {
    const news = await getAllNews();
    return news.find(n => n.featured) || news[0];
}

// Добавить новую новость
function addNews(news) {
    if (!newsData) {
        newsData = { news: [] };
    }
    
    if (!newsData.news) {
        newsData.news = [];
    }
    
    // Генерация ID, если не предоставлен
    if (!news.id) {
        const maxId = newsData.news.length > 0
            ? Math.max(...newsData.news.map(n => n.id || 0))
            : 0;
        news.id = maxId + 1;
    }
    
    newsData.news.push(news);
    window.newsDB.newsData = newsData;
    saveNewsData();
    return news;
}

// Обновить новость
function updateNews(id, updatedNews) {
    if (!newsData || !newsData.news) {
        return null;
    }
    
    const index = newsData.news.findIndex(n => n.id === parseInt(id));
    if (index !== -1) {
        newsData.news[index] = { ...newsData.news[index], ...updatedNews, id: parseInt(id) };
        window.newsDB.newsData = newsData;
        saveNewsData();
        return newsData.news[index];
    }
    return null;
}

// Удалить новость
function deleteNews(id) {
    if (!newsData || !newsData.news) {
        return false;
    }
    
    const index = newsData.news.findIndex(n => n.id === parseInt(id));
    if (index !== -1) {
        newsData.news.splice(index, 1);
        window.newsDB.newsData = newsData;
        saveNewsData();
        return true;
    }
    return false;
}

// Функция сброса кэша (для перезагрузки после правок в админ-панели)
function resetNewsCache() {
    newsData = null;
    console.log('News cache reset');
}

// Экспорт функций
window.newsDB = {
    loadNewsData,
    getAllNews,
    getNewsById,
    getFeaturedNews,
    addNews,
    updateNews,
    deleteNews,
    saveNewsData,
    resetNewsCache,
    newsData: null // Будет установлено при загрузке данных
};

console.log('news-db.js module loaded, newsDB exported:', !!window.newsDB);

