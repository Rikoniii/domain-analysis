// Animals page functionality

document.addEventListener('DOMContentLoaded', function() {
    const filters = {
        species: document.getElementById('species'),
        age: document.getElementById('age'),
        gender: document.getElementById('gender'),
        status: document.getElementById('status')
    };
    
    const animalsGrid = document.getElementById('animalsGrid');
    const noResults = document.getElementById('noResults');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    // Filter functionality
    function filterAnimals() {
        const selectedSpecies = filters.species.value;
        const selectedAge = filters.age.value;
        const selectedGender = filters.gender.value;
        const selectedStatus = filters.status.value;
        
        const animalCards = animalsGrid.querySelectorAll('.animal-card');
        let visibleCount = 0;
        
        animalCards.forEach(card => {
            const species = card.dataset.species;
            const age = card.dataset.age;
            const gender = card.dataset.gender;
            const status = card.dataset.status;
            
            let show = true;
            
            if (selectedSpecies && species !== selectedSpecies) show = false;
            if (selectedAge && age !== selectedAge) show = false;
            if (selectedGender && gender !== selectedGender) show = false;
            if (selectedStatus && status !== selectedStatus) show = false;
            
            if (show) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show/hide no results message
        if (visibleCount === 0) {
            noResults.style.display = 'block';
            animalsGrid.style.display = 'none';
        } else {
            noResults.style.display = 'none';
            animalsGrid.style.display = 'grid';
        }
    }
    
    // Add event listeners to filters
    Object.values(filters).forEach(filter => {
        if (filter) {
            filter.addEventListener('change', filterAnimals);
        }
    });
    
    // Clear filters functionality
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            Object.values(filters).forEach(filter => {
                if (filter) filter.value = '';
            });
            filterAnimals();
        });
    }
    
    // Global clear filters function
    window.clearFilters = function() {
        Object.values(filters).forEach(filter => {
            if (filter) filter.value = '';
        });
        filterAnimals();
    };
});

// Adoption modal functionality
function openAdoptionModal(animalName) {
    const modal = document.getElementById('adoptionModal');
    const animalNameInput = document.getElementById('animalName');
    
    if (animalNameInput) {
        animalNameInput.value = animalName;
    }
    
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAdoptionModal() {
    const modal = document.getElementById('adoptionModal');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('adoptionForm');
        if (form) {
            form.reset();
        }
    }
}

// Handle adoption form submission
document.addEventListener('DOMContentLoaded', function() {
    const adoptionForm = document.getElementById('adoptionForm');
    
    if (adoptionForm) {
        adoptionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm(this)) {
                // Simulate form submission
                showMessage('Заявка на усыновление успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
                closeAdoptionModal();
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля.', 'error');
            }
        });
    }
});

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('adoptionModal');
    if (modal && e.target === modal) {
        closeAdoptionModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAdoptionModal();
    }
});
