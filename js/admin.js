// Admin panel functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (!isAdminLoggedIn) {
        // Redirect to login or show login prompt
        showAdminLogin();
    }
    
    // Initialize admin dashboard
    initializeDashboard();
});

// Show admin login
function showAdminLogin() {
    const username = prompt('Введите логин администратора:');
    const password = prompt('Введите пароль:');
    
    // Simple authentication (in real app, this would be server-side)
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('adminLoggedIn', 'true');
        showMessage('Добро пожаловать в админ-панель!', 'success');
    } else {
        alert('Неверные данные для входа');
        window.location.href = 'index.html';
    }
}

// Initialize dashboard
function initializeDashboard() {
    // Load dashboard data
    loadStats();
    loadRecentDonations();
    loadApplications();
    loadNews();
}

// Load statistics
function loadStats() {
    // In real implementation, this would fetch from server
    const stats = {
        animals: 25,
        donations: 45000,
        applications: 12,
        volunteers: 8
    };
    
    // Update stat numbers with animation
    animateStats(stats);
}

// Animate statistics
function animateStats(stats) {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach((stat, index) => {
        const target = Object.values(stats)[index];
        animateNumber(stat, target);
    });
}

// Animate number counting
function animateNumber(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 30);
}

// Load recent donations
function loadRecentDonations() {
    // In real implementation, this would fetch from server
    console.log('Recent donations loaded');
}

// Load applications
function loadApplications() {
    // In real implementation, this would fetch from server
    console.log('Applications loaded');
}

// Load news
function loadNews() {
    // In real implementation, this would fetch from server
    console.log('News loaded');
}

// Tab functionality
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Animal modal functions
function openAnimalModal() {
    const modal = document.getElementById('animalModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAnimalModal() {
    const modal = document.getElementById('animalModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('animalForm');
        if (form) {
            form.reset();
        }
    }
}

// News modal functions
function openNewsModal() {
    const modal = document.getElementById('newsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeNewsModal() {
    const modal = document.getElementById('newsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('newsForm');
        if (form) {
            form.reset();
        }
    }
}

// Export donations
function exportDonations() {
    // In real implementation, this would generate and download CSV/Excel
    showMessage('Экспорт данных начат...', 'success');
    
    // Simulate export
    setTimeout(() => {
        showMessage('Данные экспортированы в файл donations.csv', 'success');
    }, 2000);
}

// Logout function
function logout() {
    if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
        localStorage.removeItem('adminLoggedIn');
        showMessage('Вы вышли из админ-панели', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Form submissions
document.addEventListener('DOMContentLoaded', function() {
    // Animal form submission
    const animalForm = document.getElementById('animalForm');
    if (animalForm) {
        animalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm(this)) {
                // In real implementation, this would save to server
                showMessage('Животное успешно добавлено!', 'success');
                closeAnimalModal();
                
                // Refresh animals list
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    }
    
    // News form submission
    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
        newsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm(this)) {
                // In real implementation, this would save to server
                showMessage('Новость успешно опубликована!', 'success');
                closeNewsModal();
                
                // Refresh news list
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    }
});

// Application actions
document.addEventListener('click', function(e) {
    if (e.target.textContent === 'Одобрить') {
        if (confirm('Одобрить эту заявку?')) {
            e.target.textContent = 'Одобрено';
            e.target.disabled = true;
            e.target.classList.remove('btn-primary');
            e.target.classList.add('btn-secondary');
            showMessage('Заявка одобрена', 'success');
        }
    }
    
    if (e.target.textContent === 'Отклонить') {
        if (confirm('Отклонить эту заявку?')) {
            e.target.textContent = 'Отклонено';
            e.target.disabled = true;
            e.target.classList.remove('btn-secondary');
            e.target.classList.add('btn-outline');
            showMessage('Заявка отклонена', 'success');
        }
    }
});

// Add CSS for admin panel
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .admin-dashboard {
        padding: 2rem 0;
        background-color: var(--secondary-color);
        min-height: 100vh;
    }
    
    .stats-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;
    }
    
    .stat-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
        text-align: center;
        transition: var(--transition);
    }
    
    .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-hover);
    }
    
    .stat-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }
    
    .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
    }
    
    .stat-label {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .admin-tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid var(--border-color);
    }
    
    .tab-btn {
        background: none;
        border: none;
        padding: 1rem 2rem;
        cursor: pointer;
        font-weight: 600;
        color: var(--text-light);
        border-bottom: 3px solid transparent;
        transition: var(--transition);
    }
    
    .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
    }
    
    .tab-btn:hover {
        color: var(--primary-color);
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
    }
    
    .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }
    
    .admin-header h2 {
        color: var(--text-color);
        margin: 0;
    }
    
    .filter-buttons {
        display: flex;
        gap: 0.5rem;
    }
    
    .admin-table {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        overflow: hidden;
    }
    
    .admin-table table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .admin-table th,
    .admin-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }
    
    .admin-table th {
        background-color: var(--secondary-color);
        font-weight: 600;
        color: var(--text-color);
    }
    
    .table-img {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 50%;
    }
    
    .status {
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .status.available {
        background-color: var(--primary-color);
        color: var(--white);
    }
    
    .status.pending {
        background-color: #ff9800;
        color: var(--white);
    }
    
    .donation-stats {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
        margin-bottom: 2rem;
    }
    
    .chart-placeholder {
        text-align: center;
        padding: 3rem;
        background-color: var(--secondary-color);
        border-radius: var(--border-radius);
    }
    
    .chart-placeholder h3 {
        color: var(--text-color);
        margin-bottom: 1rem;
    }
    
    .chart-placeholder p {
        color: var(--text-light);
    }
    
    .recent-donations {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
    }
    
    .recent-donations h3 {
        color: var(--text-color);
        margin-bottom: 1.5rem;
    }
    
    .donation-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .donation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: var(--secondary-color);
        border-radius: var(--border-radius);
    }
    
    .donor-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .donor-info strong {
        color: var(--text-color);
    }
    
    .donation-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        text-align: right;
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .applications-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .application-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
    }
    
    .application-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .application-header h3 {
        color: var(--text-color);
        margin: 0;
    }
    
    .application-details {
        margin-bottom: 1.5rem;
    }
    
    .application-details p {
        margin-bottom: 0.5rem;
        color: var(--text-light);
    }
    
    .application-details strong {
        color: var(--text-color);
    }
    
    .application-actions {
        display: flex;
        gap: 1rem;
    }
    
    .news-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .news-card {
        display: flex;
        gap: 1.5rem;
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 1.5rem;
    }
    
    .news-image {
        width: 100px;
        height: 100px;
        border-radius: var(--border-radius);
        overflow: hidden;
    }
    
    .news-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .news-content {
        flex: 1;
    }
    
    .news-content h3 {
        color: var(--text-color);
        margin-bottom: 0.5rem;
    }
    
    .news-content p {
        color: var(--text-light);
        margin-bottom: 1rem;
        line-height: 1.6;
    }
    
    .news-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.9rem;
        color: var(--text-light);
    }
    
    .news-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .btn-small {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
        .admin-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }
        
        .admin-table {
            overflow-x: auto;
        }
        
        .news-card {
            flex-direction: column;
        }
        
        .application-actions {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(adminStyles);
