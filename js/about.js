// About page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Animate statistics on scroll
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

    // Animate number counting
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

    // Map functionality
    const mapButton = document.querySelector('.map-placeholder .btn');
    if (mapButton) {
        mapButton.addEventListener('click', function() {
            // In real implementation, this would open a map service
            const address = 'Москва, ул. Добрая, д. 1';
            const mapUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
            window.open(mapUrl, '_blank');
        });
    }

    // Social media sharing
    const socialButtons = document.querySelectorAll('.social-button');
    socialButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const platform = this.textContent.toLowerCase();
            let shareUrl = '';
            
            switch(platform) {
                case 'vk':
                    shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent('Дом Лап - Приют для животных')}`;
                    break;
                case 'telegram':
                    shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Помогите животным найти дом!')}`;
                    break;
                case 'instagram':
                    // Instagram doesn't support direct sharing, so we'll copy the link
                    copyToClipboard(window.location.href);
                    showMessage('Ссылка скопирована в буфер обмена!', 'success');
                    return;
                case 'youtube':
                    // YouTube link to channel (would be replaced with actual channel)
                    shareUrl = '#';
                    break;
            }
            
            if (shareUrl && shareUrl !== '#') {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        });
    });

    // Copy to clipboard function
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    // Timeline animation
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

    // Team member hover effects
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        member.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Facility cards animation
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
});
