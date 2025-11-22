// Donation page functionality

document.addEventListener('DOMContentLoaded', function() {
    const donationForm = document.getElementById('donationForm');
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const btnAmount = document.getElementById('btnAmount');
    const recurringCheckbox = document.getElementById('recurring');
    
    let selectedAmount = 0;
    
    // Amount selection
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Clear custom amount input
            if (customAmountInput) {
                customAmountInput.value = '';
            }
            
            // Update selected amount
            selectedAmount = parseInt(this.dataset.amount);
            updateButtonAmount();
        });
    });
    
    // Custom amount input
    if (customAmountInput) {
        customAmountInput.addEventListener('input', function() {
            // Remove active class from amount buttons
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Update selected amount
            selectedAmount = parseInt(this.value) || 0;
            updateButtonAmount();
        });
    }
    
    // Update button amount display
    function updateButtonAmount() {
        if (btnAmount) {
            btnAmount.textContent = selectedAmount.toLocaleString() + ' ₽';
        }
    }
    
    // Form submission
    if (donationForm) {
        donationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (selectedAmount < 100) {
                showMessage('Минимальная сумма пожертвования 100 рублей', 'error');
                return;
            }
            
            if (validateForm(this)) {
                // Simulate payment processing
                showMessage('Перенаправление на страницу оплаты...', 'success');
                
                // In real implementation, redirect to payment gateway
                setTimeout(() => {
                    // This would be replaced with actual payment gateway integration
                    console.log('Payment data:', {
                        amount: selectedAmount,
                        purpose: document.querySelector('input[name="purpose"]:checked').value,
                        payment: document.querySelector('input[name="payment"]:checked').value,
                        recurring: recurringCheckbox.checked,
                        donor: {
                            name: document.getElementById('donorName').value,
                            phone: document.getElementById('donorPhone').value,
                            email: document.getElementById('donorEmail').value,
                            message: document.getElementById('donorMessage').value
                        }
                    });
                    
                    showMessage('Спасибо за ваше пожертвование!', 'success');
                }, 2000);
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    }
    
    // Purpose selection animation
    const purposeOptions = document.querySelectorAll('.purpose-option');
    purposeOptions.forEach(option => {
        option.addEventListener('change', function() {
            purposeOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Payment method selection animation
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Initialize first options as selected
    if (purposeOptions.length > 0) {
        purposeOptions[0].classList.add('selected');
    }
    if (paymentOptions.length > 0) {
        paymentOptions[0].classList.add('selected');
    }
});

// Add CSS for donation page specific styles
const donationStyles = document.createElement('style');
donationStyles.textContent = `
    .page-header {
        background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e8 100%);
        padding: 3rem 0;
        text-align: center;
    }
    
    .page-title {
        font-size: 2.5rem;
        color: var(--text-color);
        margin-bottom: 1rem;
    }
    
    .page-subtitle {
        font-size: 1.2rem;
        color: var(--text-light);
    }
    
    .donation-section {
        padding: 4rem 0;
        background-color: var(--white);
    }
    
    .donation-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 4rem;
        align-items: start;
    }
    
    .donation-form-container {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
    }
    
    .donation-form-header {
        text-align: center;
        margin-bottom: 2rem;
    }
    
    .donation-form-header h2 {
        color: var(--text-color);
        margin-bottom: 0.5rem;
    }
    
    .form-section {
        margin-bottom: 2rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--border-color);
    }
    
    .form-section:last-child {
        border-bottom: none;
    }
    
    .form-section h3 {
        color: var(--text-color);
        margin-bottom: 1rem;
        font-size: 1.3rem;
    }
    
    .amount-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .amount-btn {
        padding: 1rem;
        border: 2px solid var(--border-color);
        background-color: var(--white);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        font-weight: 600;
        font-size: 1.1rem;
    }
    
    .amount-btn:hover,
    .amount-btn.active {
        border-color: var(--primary-color);
        background-color: var(--primary-color);
        color: var(--white);
    }
    
    .custom-amount {
        margin-top: 1rem;
    }
    
    .custom-amount label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--text-color);
    }
    
    .custom-amount input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: 1rem;
    }
    
    .purpose-options {
        display: grid;
        gap: 1rem;
    }
    
    .purpose-option {
        cursor: pointer;
        transition: var(--transition);
    }
    
    .purpose-option input {
        display: none;
    }
    
    .purpose-card {
        display: flex;
        align-items: center;
        padding: 1rem;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        transition: var(--transition);
    }
    
    .purpose-option:hover .purpose-card,
    .purpose-option.selected .purpose-card {
        border-color: var(--primary-color);
        background-color: #f8f9fa;
    }
    
    .purpose-icon {
        font-size: 2rem;
        margin-right: 1rem;
    }
    
    .purpose-info h4 {
        margin-bottom: 0.25rem;
        color: var(--text-color);
    }
    
    .purpose-info p {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .payment-methods {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }
    
    .payment-option {
        cursor: pointer;
    }
    
    .payment-option input {
        display: none;
    }
    
    .payment-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        transition: var(--transition);
        text-align: center;
    }
    
    .payment-option:hover .payment-card,
    .payment-option.selected .payment-card {
        border-color: var(--primary-color);
        background-color: #f8f9fa;
    }
    
    .payment-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
    
    .checkbox-option {
        display: flex;
        align-items: flex-start;
        cursor: pointer;
        padding: 1rem;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        transition: var(--transition);
    }
    
    .checkbox-option:hover {
        border-color: var(--primary-color);
        background-color: #f8f9fa;
    }
    
    .checkbox-option input {
        margin-right: 1rem;
        margin-top: 0.25rem;
    }
    
    .checkbox-content strong {
        display: block;
        margin-bottom: 0.25rem;
        color: var(--text-color);
    }
    
    .checkbox-content p {
        color: var(--text-light);
        font-size: 0.9rem;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--text-color);
    }
    
    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition: var(--transition);
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
    }
    
    .form-actions {
        text-align: center;
        margin-top: 2rem;
    }
    
    .btn-large {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 1rem 2rem;
        font-size: 1.2rem;
    }
    
    .btn-amount {
        background-color: rgba(255, 255, 255, 0.2);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.9rem;
    }
    
    .donation-info {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
    
    .info-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 1.5rem;
    }
    
    .info-card h3 {
        color: var(--text-color);
        margin-bottom: 1rem;
    }
    
    .info-stats {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .stat-item {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .stat-label {
        min-width: 80px;
        font-weight: 600;
        color: var(--text-color);
    }
    
    .stat-bar {
        flex: 1;
        height: 8px;
        background-color: var(--border-color);
        border-radius: 4px;
        overflow: hidden;
    }
    
    .stat-fill {
        height: 100%;
        background-color: var(--primary-color);
        transition: width 0.3s ease;
    }
    
    .stat-percent {
        min-width: 40px;
        text-align: right;
        font-weight: 600;
        color: var(--text-color);
    }
    
    .transparency-list {
        list-style: none;
        padding: 0;
    }
    
    .transparency-list li {
        margin-bottom: 0.5rem;
        color: var(--text-light);
    }
    
    .recent-donations {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .donation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background-color: var(--secondary-color);
        border-radius: var(--border-radius);
    }
    
    .donor-name {
        font-weight: 600;
        color: var(--text-color);
    }
    
    .donation-amount {
        font-weight: 700;
        color: var(--primary-color);
    }
    
    .donation-time {
        font-size: 0.8rem;
        color: var(--text-light);
    }
    
    .impact-section {
        padding: 4rem 0;
        background-color: var(--secondary-color);
    }
    
    .impact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
    }
    
    .impact-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        padding: 2rem;
        text-align: center;
        transition: var(--transition);
    }
    
    .impact-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-hover);
    }
    
    .impact-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .impact-card h3 {
        font-size: 2rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
    }
    
    .impact-card p {
        color: var(--text-light);
        line-height: 1.6;
    }
    
    @media (max-width: 768px) {
        .donation-content {
            grid-template-columns: 1fr;
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .amount-grid {
            grid-template-columns: 1fr;
        }
        
        .payment-methods {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(donationStyles);
