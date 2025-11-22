// News page functionality

document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletterForm');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    // Newsletter subscription
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            
            if (email) {
                // Simulate subscription
                showMessage('Спасибо за подписку! Теперь вы будете получать наши новости.', 'success');
                this.reset();
            } else {
                showMessage('Пожалуйста, введите корректный email адрес.', 'error');
            }
        });
    }
    
    // Load more functionality
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            // Simulate loading more news
            this.textContent = 'Загрузка...';
            this.disabled = true;
            
            setTimeout(() => {
                // In real implementation, this would load more articles from server
                showMessage('Все новости загружены', 'success');
                this.style.display = 'none';
            }, 1500);
        });
    }
    
    // Add click tracking for news links
    const newsLinks = document.querySelectorAll('.news-link');
    newsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // In real implementation, this would navigate to full article
            showMessage('Полная версия статьи будет доступна в ближайшее время', 'success');
        });
    });
});
