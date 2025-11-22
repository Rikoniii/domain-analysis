// Profile page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        // Redirect to login or show login modal
        showLoginModal();
    }
    
    // Load user data
    loadUserData();
    
    // Load donation history
    loadDonationHistory();
    
    // Load applications
    loadApplications();
    
    // Load regular donations
    loadRegularDonations();
});

// Show login modal
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Close login modal
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const phone = document.getElementById('loginPhone').value;
            const method = document.getElementById('loginMethod').value;
            
            if (phone) {
                // Simulate login process
                showMessage('Код отправлен на ваш номер телефона', 'success');
                
                // In real implementation, this would send SMS or make a call
                setTimeout(() => {
                    // Simulate successful login
                    localStorage.setItem('userLoggedIn', 'true');
                    localStorage.setItem('userPhone', phone);
                    closeLoginModal();
                    showMessage('Добро пожаловать в личный кабинет!', 'success');
                    location.reload();
                }, 2000);
            } else {
                showMessage('Пожалуйста, введите номер телефона', 'error');
            }
        });
    }
});

// Load user data
function loadUserData() {
    const userPhone = localStorage.getItem('userPhone');
    if (userPhone) {
        // In real implementation, this would fetch user data from server
        const userData = {
            name: 'Анна Петрова',
            phone: userPhone,
            email: 'anna@example.com',
            totalDonations: 5,
            totalAmount: 2500
        };
        
        // Update profile info
        const profileName = document.querySelector('.profile-details h2');
        const profilePhone = document.querySelector('.profile-phone');
        const profileEmail = document.querySelector('.profile-email');
        
        if (profileName) profileName.textContent = userData.name;
        if (profilePhone) profilePhone.textContent = userData.phone;
        if (profileEmail) profileEmail.textContent = userData.email;
    }
}

// Load donation history
function loadDonationHistory() {
    // In real implementation, this would fetch from server
    const donations = [
        { date: '15 декабря 2024', amount: '500 ₽', purpose: 'Корм для животных', status: 'completed' },
        { date: '10 декабря 2024', amount: '1 000 ₽', purpose: 'Ветеринарное лечение', status: 'completed' },
        { date: '5 декабря 2024', amount: '500 ₽', purpose: 'Содержание приюта', status: 'completed' },
        { date: '1 декабря 2024', amount: '300 ₽', purpose: 'Корм для животных', status: 'completed' },
        { date: '25 ноября 2024', amount: '200 ₽', purpose: 'Общие нужды', status: 'completed' }
    ];
    
    // Update donation list (already in HTML for demo)
    console.log('Donation history loaded:', donations);
}

// Load applications
function loadApplications() {
    // In real implementation, this would fetch from server
    const applications = [
        { type: 'Усыновление', animal: 'Бобик', date: '18 декабря 2024', status: 'pending' },
        { type: 'Волонтерство', animal: '-', date: '15 декабря 2024', status: 'approved' }
    ];
    
    // Update applications list (already in HTML for demo)
    console.log('Applications loaded:', applications);
}

// Load regular donations
function loadRegularDonations() {
    // In real implementation, this would fetch from server
    const regularDonations = [
        { amount: '500 ₽', frequency: 'Каждый месяц', purpose: 'Корм для животных', status: 'active' }
    ];
    
    // Update regular donations list (already in HTML for demo)
    console.log('Regular donations loaded:', regularDonations);
}

// Logout function
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('userPhone');
        showMessage('Вы вышли из личного кабинета', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Cancel regular donation
document.addEventListener('click', function(e) {
    if (e.target.textContent === 'Отменить') {
        if (confirm('Вы уверены, что хотите отменить регулярное пожертвование?')) {
            e.target.textContent = 'Отменено';
            e.target.disabled = true;
            e.target.classList.remove('btn-outline');
            e.target.classList.add('btn-secondary');
            showMessage('Регулярное пожертвование отменено', 'success');
        }
    }
});

// Add CSS for profile page
const profileStyles = document.createElement('style');
profileStyles.textContent = `
    .profile-section {
        padding: 4rem 0;
        background-color: var(--secondary-color);
    }
    
    .profile-content {
        display: grid;
        gap: 2rem;
    }
    
    .profile-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
        display: flex;
        gap: 2rem;
        align-items: center;
    }
    
    .profile-avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background-color: var(--secondary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
    }
    
    .avatar-placeholder {
        color: var(--text-light);
    }
    
    .profile-details h2 {
        color: var(--text-color);
        margin-bottom: 0.5rem;
    }
    
    .profile-phone,
    .profile-email {
        color: var(--text-light);
        margin-bottom: 0.25rem;
    }
    
    .profile-stats {
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
    }
    
    .profile-stats .stat {
        text-align: center;
    }
    
    .profile-stats .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 0.25rem;
    }
    
    .profile-stats .stat-label {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .donation-history,
    .applications,
    .regular-donations {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
    }
    
    .donation-history h3,
    .applications h3,
    .regular-donations h3 {
        color: var(--text-color);
        margin-bottom: 1.5rem;
    }
    
    .donation-list,
    .application-list,
    .regular-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .donation-item,
    .application-item,
    .regular-item {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
        background-color: var(--secondary-color);
        border-radius: var(--border-radius);
    }
    
    .donation-date,
    .application-date {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .donation-amount {
        font-weight: 700;
        color: var(--primary-color);
    }
    
    .donation-purpose,
    .application-animal {
        color: var(--text-color);
    }
    
    .donation-status,
    .application-status,
    .regular-status {
        padding: 0.25rem 0.75rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        text-align: center;
    }
    
    .donation-status.completed,
    .application-status.approved,
    .regular-status.active {
        background-color: var(--primary-color);
        color: var(--white);
    }
    
    .application-status.pending {
        background-color: #ff9800;
        color: var(--white);
    }
    
    .regular-item {
        grid-template-columns: 1fr 1fr 1fr 1fr auto;
    }
    
    .regular-amount {
        font-weight: 700;
        color: var(--primary-color);
    }
    
    .regular-frequency {
        color: var(--text-color);
    }
    
    .regular-purpose {
        color: var(--text-color);
    }
    
    .btn-small {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }
    
    .profile-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    @media (max-width: 768px) {
        .profile-card {
            flex-direction: column;
            text-align: center;
        }
        
        .donation-item,
        .application-item,
        .regular-item {
            grid-template-columns: 1fr;
            text-align: center;
        }
        
        .profile-actions {
            flex-direction: column;
        }
    }
`;
document.head.appendChild(profileStyles);
