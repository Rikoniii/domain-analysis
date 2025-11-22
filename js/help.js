// Help page functionality

// Modal functions
function openMaterialModal() {
    const modal = document.getElementById('materialModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeMaterialModal() {
    const modal = document.getElementById('materialModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function openVolunteerModal() {
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeVolunteerModal() {
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function openProfessionalModal() {
    const modal = document.getElementById('professionalModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeProfessionalModal() {
    const modal = document.getElementById('professionalModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Share shelter function
function shareShelter() {
    if (navigator.share) {
        navigator.share({
            title: 'Дом Лап - Приют для животных',
            text: 'Помогите животным найти дом! Посетите сайт приюта "Дом Лап"',
            url: window.location.origin
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const shareText = 'Помогите животным найти дом! Посетите сайт приюта "Дом Лап" - ' + window.location.origin;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                showMessage('Ссылка скопирована в буфер обмена!', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showMessage('Ссылка скопирована в буфер обмена!', 'success');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Volunteer form submission
    const volunteerForm = document.getElementById('volunteerForm');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm(this)) {
                showMessage('Заявка на волонтерство успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
                closeVolunteerModal();
                this.reset();
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля.', 'error');
            }
        });
    }
    
    // Professional form submission
    const professionalForm = document.getElementById('professionalForm');
    if (professionalForm) {
        professionalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm(this)) {
                showMessage('Ваше предложение успешно отправлено! Мы свяжемся с вами для обсуждения деталей.', 'success');
                closeProfessionalModal();
                this.reset();
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля.', 'error');
            }
        });
    }
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Close modals with Escape key
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
