// Функциональность страницы пожертвований

document.addEventListener('DOMContentLoaded', function() {
    const donationForm = document.getElementById('donationForm');
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const btnAmount = document.getElementById('btnAmount');
    const recurringCheckbox = document.getElementById('recurring');
    const recurringDetails = document.getElementById('recurringDetails');
    const anonymousCheckbox = document.getElementById('anonymousDonation');

    const donorNameInput = document.getElementById('donorName');
    const donorPhoneInput = document.getElementById('donorPhone');
    const donorEmailInput = document.getElementById('donorEmail');

    // Элементы модального окна СБП
    const sbpModal = document.getElementById('sbpModal');
    const sbpAmountText = document.getElementById('sbpAmountText');
    const sbpModalClose = document.getElementById('sbpModalClose');
    const sbpPaidButton = document.getElementById('sbpPaidButton');
    const sbpCancelButton = document.getElementById('sbpCancelButton');
    
    // Элементы модального окна оплаты картой
    const cardPaymentModal = document.getElementById('cardPaymentModal');
    const cardPaymentAmountText = document.getElementById('cardPaymentAmountText');
    const cardPaymentModalClose = document.getElementById('cardPaymentModalClose');
    const cardPaymentCancelButton = document.getElementById('cardPaymentCancelButton');
    const cardPaymentForm = document.getElementById('cardPaymentForm');
    const savedCardsSection = document.getElementById('savedCardsSection');
    const savedCardsList = document.getElementById('savedCardsList');
    const useNewCardButton = document.getElementById('useNewCardButton');
    const saveCardForFuture = document.getElementById('saveCardForFuture');
    
    // Элементы модального окна успешной оплаты
    const successPaymentModal = document.getElementById('successPaymentModal');
    const successPaymentAmount = document.getElementById('successPaymentAmount');
    const donateAgainButton = document.getElementById('donateAgainButton');
    const goToHomeButton = document.getElementById('goToHomeButton');
    const goToProfileButton = document.getElementById('goToProfileButton');
    
    let selectedAmount = 0;
    let currentDonationData = null; // Храним данные пожертвования для обработки после оплаты картой
    window.currentDonationData = currentDonationData; // Делаем доступным глобально

    // Автозаполнение данных донора из профиля, если пользователь авторизован
    try {
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        if (isLoggedIn) {
            const storedName = localStorage.getItem('userName') || '';
            const storedPhone = localStorage.getItem('userPhone') || '';
            const storedEmail = localStorage.getItem('userEmail') || '';

            if (donorNameInput && !donorNameInput.value) donorNameInput.value = storedName;
            if (donorPhoneInput && !donorPhoneInput.value) donorPhoneInput.value = storedPhone;
            if (donorEmailInput && !donorEmailInput.value) donorEmailInput.value = storedEmail;

            // Подсказка о том, какая карта будет использована
            try {
                const cardsKey = 'paymentCards_' + storedPhone;
                const saved = cardsKey ? localStorage.getItem(cardsKey) : null;
                if (saved) {
                    const cards = JSON.parse(saved) || [];
                    const activeCard = cards.find(c => c.isActive);
                    if (activeCard) {
                        const paymentHint = document.getElementById('paymentMethodHint');
                        if (paymentHint) {
                            const masked = '**** **** **** ' + (activeCard.number || '').slice(-4);
                            paymentHint.textContent = `Будет использована активная карта из профиля: ${masked}`;
                            paymentHint.style.display = 'block';
                        }
                    }
                }
            } catch (e) {
                console.warn('Cannot read saved cards for hint:', e);
            }
        }
    } catch (e) {
        console.warn('Error during donor autofill:', e);
    }
    
    // Выбор суммы
    amountButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Удаление активного класса со всех кнопок
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавление активного класса к нажатой кнопке
            this.classList.add('active');
            
            // Очистка поля ввода произвольной суммы
            if (customAmountInput) {
                customAmountInput.value = '';
            }
            
            // Обновление выбранной суммы
            selectedAmount = parseInt(this.dataset.amount);
            updateButtonAmount();
        });
    });
    
    // Ввод произвольной суммы
    if (customAmountInput) {
        customAmountInput.addEventListener('input', function() {
            // Удаление активного класса с кнопок сумм
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Обновление выбранной суммы
            selectedAmount = parseInt(this.value) || 0;
            updateButtonAmount();
        });
    }
    
    // Обновление отображения суммы на кнопке
    function updateButtonAmount() {
        if (btnAmount) {
            btnAmount.textContent = selectedAmount.toLocaleString() + ' ₽';
        }
    }

    // Обработка платежа после ввода карты или выбора способа оплаты
    async function processDonationPayment(donationData) {
        if (!donationData) return;
        
        try {
            showMessage('Создание платежа...', 'success');
            
            // Отправляем запрос на API
            const response = await fetch('http://localhost:5000/api/donations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(donationData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            // Проверяем, нужно ли перенаправлять на страницу оплаты
            if (result.payment_url && !result.payment_url.includes('mock_payment')) {
                // Реальная оплата - перенаправляем на страницу оплаты
                // После возврата с оплаты будет показано модальное окно через URL параметры
                showMessage('Перенаправление на страницу оплаты...', 'success');
                setTimeout(() => {
                    window.location.href = result.payment_url;
                }, 1000);
                return; // Не продолжаем обработку, так как будет редирект
            }
            
            // Очищаем форму
            if (donationForm) {
                donationForm.reset();
            }
            selectedAmount = 0;
            updateButtonAmount();
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Fallback: сохраняем в локальную БД для совместимости
            try {
                if (window.donationsDB && typeof window.donationsDB.addDonation === 'function') {
                    // Определяем userId для сохранения
                    let userId = donationData.user_id;
                    if (!userId && donationData.phone) {
                        const userPhone = localStorage.getItem('userPhone');
                        if (userPhone && userPhone === donationData.phone) {
                            const testPhone = '+7 (495) 123-45-67';
                            const normalizedPhone = userPhone.replace(/\s/g, '').replace(/[()]/g, '');
                            const normalizedTestPhone = testPhone.replace(/\s/g, '').replace(/[()]/g, '');
                            userId = (normalizedPhone === normalizedTestPhone || userPhone === testPhone) ? 'anna_petrova' : 'user_' + normalizedPhone;
                        } else {
                            userId = 'user_' + donationData.phone.replace(/\s/g, '').replace(/[()]/g, '');
                        }
                    }
                    
                    // Преобразуем purpose в читаемый формат
                    const purposeMap = {
                        'food': 'Корм для животных',
                        'medical': 'Ветеринарное лечение',
                        'maintenance': 'Содержание приюта',
                        'general': 'Общие нужды'
                    };
                    const purposeText = purposeMap[donationData.purpose] || donationData.purpose;
                    
                    // Убеждаемся, что donationsDB загружен (принудительно перезагружаем)
                    if (window.donationsDB && typeof window.donationsDB.loadDonationsData === 'function') {
                        await window.donationsDB.loadDonationsData(true); // forceReload = true (принудительная перезагрузка)
                    }
                    
                    if (!window.donationsDB || typeof window.donationsDB.addDonation !== 'function') {
                        console.error('donationsDB not available!');
                        throw new Error('База данных пожертвований недоступна');
                    }
                    
                    const savedDonation = await window.donationsDB.addDonation({
                        amount: donationData.amount,
                        purpose: purposeText, // Используем читаемый формат
                        date: new Date().toISOString(), // Сохраняем полную дату и время
                        status: 'completed', // Меняем статус на completed после успешной оплаты
                        userId: userId || 'anonymous',
                        userName: donationData.anonymous ? 'Анонимно' : donationData.full_name,
                        userPhone: donationData.phone,
                        userEmail: donationData.email,
                        paymentMethod: donationData.payment_method,
                        recurring: donationData.is_recurring,
                        anonymous: donationData.anonymous
                    });
                    
                    console.log('Donation saved successfully:', savedDonation);
                    console.log('All donations:', window.donationsDB.donationsData?.donations);
                    
                    // Обновляем список последних пожертвований с небольшой задержкой
                    // Сбрасываем страницу на первую и перезагружаем данные
                    setTimeout(() => {
                        recentDonationsPage = 0;
                        // Принудительно перезагружаем данные из localStorage
                        if (window.donationsDB && typeof window.donationsDB.loadDonationsData === 'function') {
                            window.donationsDB.loadDonationsData(true).then(() => {
                                if (typeof loadRecentDonations === 'function') {
                                    loadRecentDonations(0, false);
                                } else if (typeof window.loadRecentDonations === 'function') {
                                    window.loadRecentDonations(0, false);
                                }
                            });
                        } else {
                            if (typeof loadRecentDonations === 'function') {
                                loadRecentDonations(0, false);
                            } else if (typeof window.loadRecentDonations === 'function') {
                                window.loadRecentDonations(0, false);
                            }
                        }
                    }, 800);
                    
                    // Если пользователь авторизован, обновляем историю в профиле
                    if (typeof loadDonationHistory === 'function') {
                        setTimeout(() => {
                            loadDonationHistory();
                        }, 800);
                    }
                }
            } catch (err) {
                console.warn('Error saving donation to local DB (fallback):', err);
            }

            // Если выбрано регулярное пожертвование — создаём/обновляем подписку в профиле
            if (donationData.is_recurring) {
                try {
                    const userPhone = localStorage.getItem('userPhone');
                    if (userPhone) {
                        const regularDonationsKey = 'regularDonations_' + userPhone;
                        let regularDonations = [];
                        try {
                            const saved = localStorage.getItem(regularDonationsKey);
                            if (saved) {
                                regularDonations = JSON.parse(saved);
                            }
                        } catch (e2) {
                            console.warn('Error loading regular donations from storage:', e2);
                        }
                        const maxId = regularDonations.length > 0
                            ? Math.max(...regularDonations.map(rd => rd.id || 0))
                            : 0;
                        const frequencySelect = document.getElementById('recurringFrequency');
                        const frequency = frequencySelect ? frequencySelect.value : 'monthly';
                        const frequencyText = frequency === 'weekly'
                            ? 'Каждую неделю'
                            : frequency === 'quarterly'
                                ? 'Каждый квартал'
                                : 'Каждый месяц';
                        const newRegular = {
                            id: maxId + 1,
                            amount: donationData.amount,
                            frequency,
                            frequencyText,
                            purpose: donationData.purpose === 'food'
                                ? 'Корм для животных'
                                : donationData.purpose === 'medical'
                                    ? 'Ветеринарное лечение'
                                    : donationData.purpose === 'maintenance'
                                        ? 'Содержание приюта'
                                        : 'Общие нужды',
                            status: 'active',
                            createdAt: new Date().toISOString()
                        };
                        regularDonations.push(newRegular);
                        localStorage.setItem(regularDonationsKey, JSON.stringify(regularDonations));
                    }
                } catch (e3) {
                    console.error('Error creating regular donation subscription:', e3);
                }
            }
            
            // Показываем модальное окно успешной оплаты после всех операций
            // (для демо-режима или когда нет редиректа на платежную страницу)
            showSuccessPaymentModal(donationData.amount);
            
            // Очищаем данные текущего пожертвования
            currentDonationData = null;
            window.currentDonationData = null;
            
            console.log('Payment processed:', donationData);
        } catch (error) {
            console.error('Error processing donation payment:', error);
            
            // Более понятные сообщения об ошибках
            let errorMessage = 'Произошла ошибка при обработке пожертвования';
            if (error.message && error.message.includes('Failed to fetch')) {
                errorMessage = 'Не удалось подключиться к серверу. Убедитесь, что backend сервер запущен на http://localhost:5000';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        }
    }
    
    // Переключение отображения деталей регулярного пожертвования
    if (recurringCheckbox && recurringDetails) {
        recurringCheckbox.addEventListener('change', function() {
            recurringDetails.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Функции для модального окна оплаты картой
    function openCardPaymentModal(amount) {
        if (!cardPaymentModal) return;
        
        if (cardPaymentAmountText) {
            cardPaymentAmountText.textContent = `Сумма к оплате: ${amount.toLocaleString('ru-RU')} ₽`;
        }
        
        // Сбрасываем форму
        if (cardPaymentForm) {
            cardPaymentForm.reset();
            cardPaymentForm.style.display = 'block';
        }
        if (saveCardForFuture) {
            saveCardForFuture.checked = false;
        }
        
        // Загружаем сохраненные карты
        loadSavedCardsForPayment();
        
        cardPaymentModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeCardPaymentModal() {
        if (!cardPaymentModal) return;
        cardPaymentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Сбрасываем форму
        if (cardPaymentForm) {
            cardPaymentForm.reset();
            cardPaymentForm.style.display = 'block';
        }
        if (savedCardsSection) {
            savedCardsSection.style.display = 'none';
        }
    }

    function loadSavedCardsForPayment() {
        if (!savedCardsList || !savedCardsSection) return;
        
        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone) {
            savedCardsSection.style.display = 'none';
            return;
        }
        
        const cardsKey = 'paymentCards_' + userPhone;
        let cards = [];
        
        try {
            const saved = localStorage.getItem(cardsKey);
            if (saved) {
                cards = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading cards:', e);
        }
        
        if (cards.length === 0) {
            savedCardsSection.style.display = 'none';
            return;
        }
        
        // Показываем сохраненные карты
        savedCardsSection.style.display = 'block';
        savedCardsList.innerHTML = cards.map(card => {
            const maskedNumber = '**** **** **** ' + card.number.slice(-4);
            const isActive = card.isActive ? ' (Активная)' : '';
            return `
                <div class="saved-card-item" data-card-id="${card.id}" style="padding: 1rem; margin-bottom: 0.5rem; border: 2px solid ${card.isActive ? 'var(--primary-color)' : '#ddd'}; border-radius: 8px; cursor: pointer; transition: var(--transition);">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="font-size: 1.5rem;">💳</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: var(--text-color);">${maskedNumber}</div>
                            <div style="font-size: 0.85rem; color: var(--text-light);">${card.name} • ${card.expiry}${isActive}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Добавляем обработчики клика на сохраненные карты
        savedCardsList.querySelectorAll('.saved-card-item').forEach(item => {
            item.addEventListener('click', function() {
                const cardId = parseInt(this.dataset.cardId);
                useSavedCard(cardId, cards);
            });
        });
    }

    function useSavedCard(cardId, cards) {
        const card = cards.find(c => c.id === cardId);
        if (!card) return;
        
        // Скрываем список сохраненных карт и показываем форму
        if (savedCardsSection) savedCardsSection.style.display = 'none';
        if (cardPaymentForm) cardPaymentForm.style.display = 'block';
        
        // Заполняем форму данными сохраненной карты (кроме CVC)
        const cardNumberInput = document.getElementById('paymentCardNumber');
        const cardExpiryInput = document.getElementById('paymentCardExpiry');
        const cardNameInput = document.getElementById('paymentCardName');
        
        if (cardNumberInput) {
            // Форматируем номер карты
            const formatted = card.number.match(/.{1,4}/g)?.join(' ') || card.number;
            cardNumberInput.value = formatted;
        }
        if (cardExpiryInput) cardExpiryInput.value = card.expiry;
        if (cardNameInput) cardNameInput.value = card.name;
        
        // CVC нужно ввести заново (по соображениям безопасности)
        const cardCVCInput = document.getElementById('paymentCardCVC');
        if (cardCVCInput) {
            cardCVCInput.value = '';
            cardCVCInput.focus();
        }
        
        // Карта уже сохранена - скрываем чекбокс "Сохранить карту"
        if (saveCardForFuture) {
            const checkboxGroup = saveCardForFuture.closest('.checkbox-group');
            if (checkboxGroup) {
                checkboxGroup.style.display = 'none';
            }
        }
    }

    // Функции для модального окна СБП (демо-режим)
    function openSbpModal(amount) {
        if (!sbpModal) return;
        if (sbpAmountText) {
            sbpAmountText.textContent = `Сумма к оплате: ${amount.toLocaleString('ru-RU')} ₽`;
        }
        sbpModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeSbpModal() {
        if (!sbpModal) return;
        sbpModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    if (sbpModalClose) {
        sbpModalClose.addEventListener('click', closeSbpModal);
    }
    if (sbpCancelButton) {
        sbpCancelButton.addEventListener('click', closeSbpModal);
    }

    if (sbpPaidButton) {
        sbpPaidButton.addEventListener('click', function() {
            closeSbpModal();
            if (currentDonationData) {
                processDonationPayment(currentDonationData);
            }
        });
    }

    // Функции для модального окна успешной оплаты
    function showSuccessPaymentModal(amount) {
        if (!successPaymentModal) return;
        
        // Устанавливаем сумму в модальном окне
        if (successPaymentAmount) {
            if (amount > 0) {
                successPaymentAmount.textContent = `Сумма пожертвования: ${amount.toLocaleString('ru-RU')} ₽`;
            } else {
                successPaymentAmount.textContent = 'Пожертвование успешно обработано!';
            }
        }
        
        // Показываем модальное окно
        successPaymentModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeSuccessPaymentModal() {
        if (!successPaymentModal) return;
        successPaymentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Закрытие модального окна при клике на фон
    if (successPaymentModal) {
        successPaymentModal.addEventListener('click', function(e) {
            if (e.target === successPaymentModal) {
                closeSuccessPaymentModal();
            }
        });
    }

    // Обработчики кнопок модального окна успешной оплаты
    if (donateAgainButton) {
        donateAgainButton.addEventListener('click', function() {
            closeSuccessPaymentModal();
            // Прокручиваем к форме пожертвования
            const donationFormContainer = document.querySelector('.donation-form-container');
            if (donationFormContainer) {
                donationFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if (goToHomeButton) {
        goToHomeButton.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }

    if (goToProfileButton) {
        goToProfileButton.addEventListener('click', function() {
            window.location.href = 'profile.html';
        });
    }

    // Обработчики для модального окна оплаты картой
    if (cardPaymentModalClose) {
        cardPaymentModalClose.addEventListener('click', closeCardPaymentModal);
    }
    if (cardPaymentCancelButton) {
        cardPaymentCancelButton.addEventListener('click', closeCardPaymentModal);
    }
    if (useNewCardButton) {
        useNewCardButton.addEventListener('click', function() {
            if (savedCardsSection) savedCardsSection.style.display = 'none';
            if (cardPaymentForm) cardPaymentForm.style.display = 'block';
        });
    }

    // Обработка формы оплаты картой
    if (cardPaymentForm) {
        cardPaymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const cardNumber = document.getElementById('paymentCardNumber').value.replace(/\s/g, '');
            const cardExpiry = document.getElementById('paymentCardExpiry').value;
            const cardCVC = document.getElementById('paymentCardCVC').value;
            const cardName = document.getElementById('paymentCardName').value.trim();
            const shouldSaveCard = saveCardForFuture && saveCardForFuture.checked;
            
            // Валидация
            if (cardNumber.length < 13 || cardNumber.length > 19) {
                showMessage('Некорректный номер карты', 'error');
                return;
            }
            if (!cardExpiry || !cardCVC || !cardName) {
                showMessage('Заполните все поля', 'error');
                return;
            }
            
            // Сохраняем карту, если выбрана опция
            if (shouldSaveCard) {
                // Используем телефон из формы или из localStorage
                const userPhone = localStorage.getItem('userPhone') || (currentDonationData ? currentDonationData.phone : null);
                if (userPhone) {
                    const cardsKey = 'paymentCards_' + userPhone;
                    let cards = [];
                    
                    try {
                        const saved = localStorage.getItem(cardsKey);
                        if (saved) {
                            cards = JSON.parse(saved);
                        }
                    } catch (e) {
                        console.error('Error loading cards:', e);
                    }
                    
                    // Проверяем, не существует ли уже такая карта
                    const existingCard = cards.find(c => c.number === cardNumber);
                    if (!existingCard) {
                        const maxId = cards.length > 0 ? Math.max(...cards.map(c => c.id || 0)) : 0;
                        const newCard = {
                            id: maxId + 1,
                            number: cardNumber,
                            expiry: cardExpiry,
                            cvc: cardCVC,
                            name: cardName,
                            isActive: currentDonationData && currentDonationData.is_recurring, // Делаем активной, если это регулярное пожертвование
                            createdAt: new Date().toISOString()
                        };
                        cards.push(newCard);
                        localStorage.setItem(cardsKey, JSON.stringify(cards));
                        
                        // Если это регулярное пожертвование и карта стала активной, деактивируем остальные
                        if (newCard.isActive) {
                            cards.forEach(c => {
                                if (c.id !== newCard.id) {
                                    c.isActive = false;
                                }
                            });
                            localStorage.setItem(cardsKey, JSON.stringify(cards));
                        }
                    }
                }
            }
            
            // Закрываем модальное окно и обрабатываем платеж
            closeCardPaymentModal();
            
            // В демо-режиме просто обрабатываем пожертвование
            // В реальной интеграции здесь была бы отправка данных карты на платежный шлюз
            if (currentDonationData) {
                processDonationPayment(currentDonationData);
            }
        });
        
        // Форматирование полей карты и проверка существования карты
        const cardNumberInput = document.getElementById('paymentCardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '');
                value = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = value;
                
                // Проверяем, есть ли уже такая карта
                if (typeof window.checkIfCardExists === 'function') {
                    window.checkIfCardExists(value.replace(/\s/g, ''));
                }
            });
        }
        
        const cardExpiryInput = document.getElementById('paymentCardExpiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;
            });
        }
        
        const cardCVCInput = document.getElementById('paymentCardCVC');
        if (cardCVCInput) {
            cardCVCInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
            });
        }
    }

    // Отправка формы
    if (donationForm) {
        donationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (selectedAmount < 100) {
                showMessage('Минимальная сумма пожертвования 100 рублей', 'error');
                return;
            }
            
            if (validateForm(this)) {
                const purposeValue = document.querySelector('input[name="purpose"]:checked')?.value || 'general';
                const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'card';
                const isRecurring = !!(recurringCheckbox && recurringCheckbox.checked);
                
                // Для регулярных пожертвований требуется банковская карта
                if (isRecurring) {
                    if (paymentMethod !== 'card') {
                        showMessage('Регулярные пожертвования доступны только при оплате банковской картой.', 'error');
                        return;
                    }
                    // Проверяем, есть ли сохраненная карта (но не требуем обязательной авторизации)
                    const userPhone = localStorage.getItem('userPhone') || donorPhone;
                    const cardsKey = 'paymentCards_' + userPhone;
                    let activeCard = null;
                    try {
                        const saved = userPhone ? localStorage.getItem(cardsKey) : null;
                        if (saved) {
                            const cards = JSON.parse(saved) || [];
                            activeCard = cards.find(c => c.isActive);
                        }
                    } catch (err) {
                        console.warn('Error reading cards for recurring donation:', err);
                    }
                    // Если нет активной карты - это нормально, пользователь введет карту при оплате
                    // Карта будет сохранена при оплате, если отмечен чекбокс "Сохранить карту"
                }

                // Отправка данных на API
                const isAnonymous = !!(anonymousCheckbox && anonymousCheckbox.checked);
                const rawName = donorNameInput ? donorNameInput.value.trim() : '';
                const donorName = isAnonymous ? 'Анонимно' : rawName;
                const donorPhone = donorPhoneInput ? donorPhoneInput.value.trim() : '';
                const donorEmail = donorEmailInput ? donorEmailInput.value.trim() : '';
                
                // Получаем user_id, если пользователь авторизован
                let userId = null;
                const userPhone = localStorage.getItem('userPhone');
                if (userPhone && !isAnonymous) {
                    // В реальности user_id должен приходить с сервера после авторизации
                    // Здесь используем временную логику для демо
                    try {
                        // Пытаемся найти пользователя через API (опционально)
                        // Пока используем null, сервер сам создаст пользователя по телефону
                    } catch (e) {
                        console.warn('Could not get user_id from API:', e);
                    }
                }
                
                // Сохраняем данные пожертвования для обработки после оплаты
                currentDonationData = {
                    amount: selectedAmount,
                    purpose: purposeValue,
                    is_recurring: isRecurring,
                    anonymous: isAnonymous,
                    full_name: rawName,
                    phone: donorPhone,
                    email: donorEmail,
                    user_id: userId,
                    payment_method: paymentMethod
                };
                window.currentDonationData = currentDonationData; // Обновляем глобальную переменную
                
                // Если выбран способ оплаты картой - открываем модальное окно
                if (paymentMethod === 'card') {
                    openCardPaymentModal(selectedAmount);
                } else if (paymentMethod === 'sbp') {
                    // Для СБП показываем модальное окно с QR
                    openSbpModal(selectedAmount);
                } else {
                    // Для других способов оплаты сразу отправляем на API
                    processDonationPayment(currentDonationData);
                }
            } else {
                showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    }
    
    // Анимация выбора цели
    const purposeOptions = document.querySelectorAll('.purpose-option');
    purposeOptions.forEach(option => {
        option.addEventListener('change', function() {
            purposeOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Анимация выбора способа оплаты
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Инициализация первых опций как выбранных
    if (purposeOptions.length > 0) {
        purposeOptions[0].classList.add('selected');
    }
    if (paymentOptions.length > 0) {
        paymentOptions[0].classList.add('selected');
    }
    
    // Загружаем последние пожертвования при загрузке страницы
    recentDonationsPage = 0;
    loadRecentDonations(0, false);
    
    // Делаем функцию доступной глобально
    window.loadRecentDonations = loadRecentDonations;
    
    // Проверяем параметры URL для отображения модального окна успешной оплаты
    // (когда пользователь возвращается с платежной страницы)
    const urlParams = new URLSearchParams(window.location.search);
    const donationStatus = urlParams.get('status');
    const donationId = urlParams.get('donation_id');
    
    if (donationStatus === 'success' && donationId) {
        // Получаем информацию о пожертвовании из API или localStorage
        // Для демо-режима просто показываем модальное окно
        // В реальном приложении можно получить сумму из API по donation_id
        setTimeout(() => {
            // Пытаемся получить сумму из последнего пожертвования
            const lastDonationAmount = currentDonationData?.amount || 0;
            if (lastDonationAmount > 0) {
                showSuccessPaymentModal(lastDonationAmount);
            } else {
                // Если не нашли сумму, показываем общее сообщение
                showSuccessPaymentModal(0);
                if (successPaymentAmount) {
                    successPaymentAmount.textContent = 'Пожертвование успешно обработано!';
                }
            }
            
            // Очищаем URL параметры
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
    }
});

// Функция сокращения имени для общего доступа (Анна В. Ф.)
function shortenName(fullName) {
    if (!fullName || fullName === 'Анонимно') {
        return 'Анонимно';
    }
    
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0];
    }
    
    if (parts.length === 2) {
        // Имя Фамилия -> Имя Ф.
        return `${parts[0]} ${parts[1][0]}.`;
    }
    
    if (parts.length >= 3) {
        // Имя Отчество Фамилия -> Имя О. Ф.
        const firstName = parts[0];
        const middleInitial = parts[1][0] + '.';
        const lastInitial = parts[2][0] + '.';
        return `${firstName} ${middleInitial} ${lastInitial}`;
    }
    
    return fullName;
}

// Проверка существования карты (доступна глобально)
window.checkIfCardExists = function(cardNumber) {
    const saveCardCheckbox = document.getElementById('saveCardForFuture');
    if (!saveCardCheckbox) return;
    
    if (!cardNumber || cardNumber.length < 13) {
        // Показываем чекбокс, если номер карты неполный
        const checkboxGroup = saveCardCheckbox.closest('.checkbox-group');
        if (checkboxGroup) {
            checkboxGroup.style.display = 'flex';
        }
        saveCardCheckbox.checked = false;
        return;
    }
    
    const userPhone = localStorage.getItem('userPhone') || (window.currentDonationData ? window.currentDonationData.phone : null);
    if (!userPhone) {
        // Если нет телефона, показываем чекбокс
        const checkboxGroup = saveCardCheckbox.closest('.checkbox-group');
        if (checkboxGroup) {
            checkboxGroup.style.display = 'flex';
        }
        return;
    }
    
    const cardsKey = 'paymentCards_' + userPhone;
    try {
        const saved = localStorage.getItem(cardsKey);
        if (saved) {
            const cards = JSON.parse(saved);
            const existingCard = cards.find(c => c.number === cardNumber);
            
            if (existingCard) {
                // Карта уже сохранена - скрываем чекбокс
                const checkboxGroup = saveCardCheckbox.closest('.checkbox-group');
                if (checkboxGroup) {
                    checkboxGroup.style.display = 'none';
                }
            } else {
                // Карта не сохранена - показываем чекбокс
                const checkboxGroup = saveCardCheckbox.closest('.checkbox-group');
                if (checkboxGroup) {
                    checkboxGroup.style.display = 'flex';
                }
                saveCardCheckbox.checked = false;
            }
        } else {
            // Нет сохраненных карт - показываем чекбокс
            const checkboxGroup = saveCardCheckbox.closest('.checkbox-group');
            if (checkboxGroup) {
                checkboxGroup.style.display = 'flex';
            }
        }
    } catch (e) {
        console.error('Error checking card existence:', e);
    }
};

// Функция загрузки последних пожертвований для отображения на странице
let recentDonationsPage = 0;
const RECENT_DONATIONS_PER_PAGE = 5;

async function loadRecentDonations(page = 0, append = false) {
    try {
        const recentDonationsList = document.getElementById('recentDonationsList');
        if (!recentDonationsList) return;
        
        let donations = [];
        const excludeNames = ['влад', 'nikita', 'никита'];
        
        // 1. Загружаем данные из локальной БД (старые данные могут быть только здесь)
        let localDonations = [];
        if (window.donationsDB) {
            // Принудительно перезагружаем данные из localStorage
            if (typeof window.donationsDB.loadDonationsData === 'function') {
                await window.donationsDB.loadDonationsData(true);
            }
            
            try {
                const allLocalDonations = await window.donationsDB.getAllDonations();
                localDonations = allLocalDonations
                    .filter(d => {
                        // В тестовом режиме считаем pending, completed и succeeded как завершенные
                        const status = (d.status || '').toLowerCase();
                        const isCompleted = status === 'completed' || status === 'succeeded' || status === 'pending';
                        // Исключаем старые фейковые данные
                        const userName = (d.userName || '').toLowerCase();
                        const publicName = (d.public_name || '').toLowerCase();
                        const isFake = excludeNames.some(name => 
                            userName.includes(name) || publicName.includes(name)
                        );
                        return isCompleted && !isFake;
                    })
                    .map(d => ({
                        name: shortenName(d.userName || 'Анонимно'),
                        amount: d.amount,
                        date: d.date || d.created_at,
                        status: d.status,
                        id: d.id,
                        source: 'local'
                    }));
            } catch (dbError) {
                console.warn('Ошибка загрузки из локальной БД:', dbError);
            }
        }
        
        // 2. Загружаем данные из API (новые данные)
        let apiDonations = [];
        try {
            const response = await fetch(`http://localhost:5000/api/admin/donations?limit=100`);
            if (response.ok) {
                const allApiDonations = await response.json();
                apiDonations = allApiDonations
                    .filter(d => {
                        // В тестовом режиме считаем pending, completed и succeeded как завершенные
                        const status = (d.status || '').toLowerCase();
                        const isCompleted = status === 'succeeded' || status === 'completed' || status === 'pending';
                        const publicName = (d.public_name || '').toLowerCase();
                        const isFake = excludeNames.some(name => publicName.includes(name));
                        return isCompleted && !isFake;
                    })
                    .map(d => ({
                        name: shortenName(d.public_name || 'Анонимно'),
                        amount: d.amount,
                        date: d.paid_at || d.created_at,
                        status: d.status,
                        id: d.id,
                        source: 'api'
                    }));
            }
        } catch (apiError) {
            console.warn('API недоступен, используем только локальные данные:', apiError);
        }
        
        // 3. Объединяем данные: используем Map для дедупликации по ID
        const donationsMap = new Map();
        
        // Сначала добавляем данные из API (новые, имеют приоритет)
        apiDonations.forEach(d => {
            const key = d.id ? `api_${d.id}` : `api_${d.date}_${d.amount}_${d.name}`;
            if (!donationsMap.has(key)) {
                donationsMap.set(key, d);
            }
        });
        
        // Затем добавляем локальные данные (старые), которые еще не были обработаны
        localDonations.forEach(d => {
            const key = d.id ? `api_${d.id}` : `local_${d.date}_${d.amount}_${d.name}`;
            // Проверяем, нет ли такого же доната в API по ID
            const apiKey = d.id ? `api_${d.id}` : null;
            if (!apiKey || !donationsMap.has(apiKey)) {
                if (!donationsMap.has(key)) {
                    donationsMap.set(key, d);
                }
            }
        });
        
        // Преобразуем Map в массив и сортируем по дате (новые первыми)
        donations = Array.from(donationsMap.values()).sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });
        
        // Берем нужную страницу
        const startIndex = page * RECENT_DONATIONS_PER_PAGE;
        const endIndex = startIndex + RECENT_DONATIONS_PER_PAGE;
        const pageDonations = donations.slice(startIndex, endIndex);
        const hasMore = donations.length > endIndex;
        
        // Форматируем даты и отображаем
        if (page === 0 && pageDonations.length === 0) {
            recentDonationsList.innerHTML = `
                <div class="donation-item">
                    <div class="donor-name">Пожертвований пока нет</div>
                    <div class="donation-amount">-</div>
                    <div class="donation-time">-</div>
                </div>
            `;
        } else {
            const donationsHtml = pageDonations.map(donation => {
                // Парсим дату - поддерживаем как ISO формат, так и формат только даты
                let date;
                if (donation.date) {
                    // Если дата в формате ISO (с временем) - используем как есть
                    if (donation.date.includes('T') || donation.date.includes(' ')) {
                        date = new Date(donation.date);
                    } else {
                        // Если только дата без времени - добавляем текущее время
                        date = new Date(donation.date + 'T' + new Date().toTimeString().split(' ')[0]);
                    }
                } else {
                    date = new Date();
                }
                
                // Проверяем валидность даты
                if (isNaN(date.getTime())) {
                    date = new Date();
                }
                
                const now = new Date();
                const diffMs = now - date;
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                
                let timeText = '';
                if (diffMinutes < 1) {
                    timeText = 'только что';
                } else if (diffMinutes < 60) {
                    timeText = `${diffMinutes} ${diffMinutes === 1 ? 'минуту' : diffMinutes < 5 ? 'минуты' : 'минут'} назад`;
                } else if (diffHours < 24) {
                    timeText = `${diffHours} ${diffHours === 1 ? 'час' : diffHours < 5 ? 'часа' : 'часов'} назад`;
                } else if (diffDays === 1) {
                    timeText = 'вчера';
                } else if (diffDays < 30) {
                    timeText = `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'} назад`;
                } else {
                    // Для старых пожертвований показываем дату
                    timeText = date.toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
                    });
                }
                
                return `
                    <div class="donation-item">
                        <div class="donor-name">${donation.name}</div>
                        <div class="donation-amount">${donation.amount.toLocaleString('ru-RU')} ₽</div>
                        <div class="donation-time">${timeText}</div>
                    </div>
                `;
            }).join('');
            
            if (append) {
                // Добавляем к существующему списку
                const existingButton = recentDonationsList.querySelector('.load-more-donations-btn');
                if (existingButton) {
                    existingButton.remove();
                }
                recentDonationsList.insertAdjacentHTML('beforeend', donationsHtml);
            } else {
                // Заменяем весь список
                recentDonationsList.innerHTML = donationsHtml;
            }
            
            // Добавляем кнопку "Показать еще", если есть еще пожертвования
            if (hasMore) {
                const existingButton = recentDonationsList.querySelector('.load-more-donations-btn');
                if (!existingButton) {
                    const loadMoreButton = document.createElement('button');
                    loadMoreButton.className = 'btn btn-outline btn-small load-more-donations-btn';
                    loadMoreButton.textContent = 'Показать еще';
                    loadMoreButton.style.marginTop = '1rem';
                    loadMoreButton.style.width = '100%';
                    loadMoreButton.onclick = function() {
                        recentDonationsPage++;
                        loadRecentDonations(recentDonationsPage, true);
                    };
                    recentDonationsList.appendChild(loadMoreButton);
                }
            } else {
                // Удаляем кнопку, если больше нет данных
                const existingButton = recentDonationsList.querySelector('.load-more-donations-btn');
                if (existingButton) {
                    existingButton.remove();
                }
            }
        }
        
        console.log('Recent donations loaded:', pageDonations.length, 'of', donations.length);
    } catch (error) {
        console.error('Error loading recent donations:', error);
    }
}

// Добавление CSS для специфических стилей страницы пожертвований
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
    
    /* Стили модального окна для СБП (демо-режим) */
    .sbp-modal {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 1rem;
    }
    
    .sbp-modal-content {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-hover);
        max-width: 480px;
        width: 100%;
        padding: 2rem;
        position: relative;
        text-align: center;
    }
    
    .sbp-modal-close {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        border: none;
        background: transparent;
        font-size: 1.5rem;
        cursor: pointer;
    }
    
    .sbp-qr-wrapper {
        display: flex;
        justify-content: center;
        margin: 1rem 0;
    }
    
    .sbp-qr {
        width: 180px;
        height: 180px;
        border-radius: 12px;
        background: repeating-linear-gradient(
            45deg,
            #f0f0f0,
            #f0f0f0 10px,
            #e0e0e0 10px,
            #e0e0e0 20px
        );
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
    }
    
    .sbp-qr-inner {
        width: 70%;
        height: 70%;
        background-image: radial-gradient(circle at 10% 20%, #000 3px, transparent 4px),
                          radial-gradient(circle at 80% 30%, #000 3px, transparent 4px),
                          radial-gradient(circle at 30% 80%, #000 3px, transparent 4px),
                          radial-gradient(circle at 70% 70%, #000 3px, transparent 4px);
        background-size: 20px 20px;
        background-repeat: repeat;
        opacity: 0.85;
    }
    
    .sbp-modal-actions {
        margin-top: 1.5rem;
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
    }
    
    /* Стили для модального окна оплаты картой */
    .saved-card-item {
        transition: var(--transition);
    }
    
    .saved-card-item:hover {
        background-color: var(--secondary-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .saved-card-item:active {
        transform: translateY(0);
    }
    
    #cardPaymentForm .form-group {
        margin-bottom: 1rem;
    }
    
    #cardPaymentForm .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--text-color);
    }
    
    #cardPaymentForm .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition: var(--transition);
    }
    
    #cardPaymentForm .form-group input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
    }
    
    #cardPaymentForm .checkbox-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    #cardPaymentForm .checkbox-group input[type="checkbox"] {
        width: auto;
    }
    
    #cardPaymentForm .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    
    /* Стили для модального окна успешной оплаты */
    .success-payment-modal {
        text-align: center;
        max-width: 450px;
    }
    
    .success-payment-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        font-weight: bold;
        margin: 0 auto;
        animation: successPulse 0.6s ease-out;
    }
    
    @keyframes successPulse {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .success-payment-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1.5rem;
    }
    
    .success-payment-actions .btn {
        padding: 0.875rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
    }
`;
document.head.appendChild(donationStyles);
