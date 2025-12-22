#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор тестовых данных для приюта "Дом Лап"
Использует Faker для создания реалистичных тестовых данных
"""
import random
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from faker import Faker
from faker.providers import internet, phone_number, date_time
from sqlalchemy.exc import IntegrityError

from database import init_db, SessionLocal, User, Donation, Subscription, PaymentMethod

# Инициализация Faker с русской локалью
fake = Faker('ru_RU')
fake.add_provider(internet)
fake.add_provider(phone_number)
fake.add_provider(date_time)

# Константы для генерации данных
PURPOSES = ['food', 'medical', 'maintenance', 'general']
PURPOSE_RU = {
    'food': 'Корм для животных',
    'medical': 'Ветеринарное лечение',
    'maintenance': 'Содержание приюта',
    'general': 'Общие нужды'
}
FREQUENCIES = ['weekly', 'monthly', 'quarterly']
STATUSES_DONATION = ['pending', 'succeeded', 'canceled', 'failed']
STATUSES_SUBSCRIPTION = ['active', 'canceled', 'paused']
PROVIDERS = ['yoomoney', 'stripe', 'paypal']


def normalize_phone(phone: str) -> str:
    """Нормализация номера телефона"""
    # Убираем все символы кроме цифр и +
    phone = ''.join(c for c in phone if c.isdigit() or c == '+')
    # Если нет +7 или 8 в начале, добавляем +7
    if not phone.startswith('+7') and not phone.startswith('8'):
        phone = '+7' + phone
    elif phone.startswith('8'):
        phone = '+7' + phone[1:]
    # Ограничиваем длину
    if len(phone) > 20:
        phone = phone[:20]
    return phone


def generate_user(db) -> User:
    """Генерация пользователя"""
    phone = normalize_phone(fake.phone_number())
    
    # Проверяем уникальность телефона
    existing = db.query(User).filter(User.phone == phone).first()
    if existing:
        # Генерируем новый уникальный номер
        base_phone = phone[:-4]
        phone = base_phone + str(random.randint(1000, 9999))
    
    user = User(
        phone=phone,
        email=fake.email() if random.random() > 0.1 else None,  # 90% имеют email
        full_name=fake.name(),
        created_at=fake.date_time_between(start_date='-1y', end_date='now')
    )
    
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        # Если все еще конфликт, пробуем еще раз
        return generate_user(db)


def generate_payment_method(db, user: User) -> PaymentMethod:
    """Генерация способа оплаты"""
    provider = random.choice(PROVIDERS)
    
    payment_method = PaymentMethod(
        user_id=user.id,
        provider=provider,
        provider_payment_token=fake.uuid4() if random.random() > 0.3 else None,  # 70% имеют токен
        last4=str(random.randint(1000, 9999)) if random.random() > 0.2 else None,  # 80% имеют last4
        is_active=random.choice([True, True, True, False]),  # 75% активны
        created_at=fake.date_time_between(start_date=user.created_at, end_date='now')
    )
    
    db.add(payment_method)
    db.commit()
    db.refresh(payment_method)
    return payment_method


def calculate_next_charge_date(frequency: str, from_date: datetime = None) -> datetime:
    """Вычислить дату следующего списания"""
    if from_date is None:
        from_date = datetime.utcnow()
    
    if frequency == 'weekly':
        return from_date + timedelta(weeks=1)
    elif frequency == 'monthly':
        return from_date + relativedelta(months=1)
    elif frequency == 'quarterly':
        return from_date + relativedelta(months=3)
    else:
        return from_date + relativedelta(months=1)


def generate_donation(db, user: User = None, subscription: Subscription = None) -> Donation:
    """Генерация пожертвования"""
    # Если пользователь не передан, создаем или выбираем случайного
    if not user:
        users = db.query(User).all()
        if users and random.random() > 0.2:  # 80% связаны с пользователем
            user = random.choice(users)
        else:
            user = generate_user(db)
    
    # Определяем публичное имя
    if random.random() > 0.15:  # 85% не анонимные
        public_name = user.full_name if user else fake.name()
        phone = user.phone if user else normalize_phone(fake.phone_number())
        email = user.email if user else (fake.email() if random.random() > 0.3 else None)
    else:
        public_name = 'Анонимно'
        phone = None
        email = None
    
    # Сумма пожертвования (от 100 до 50000 рублей)
    amount = round(random.uniform(100, 50000), 2)
    
    # Назначение
    purpose = random.choice(PURPOSES)
    
    # Статус
    status = random.choice(STATUSES_DONATION)
    
    # Даты
    created_at = fake.date_time_between(start_date='-6m', end_date='now')
    paid_at = None
    if status == 'succeeded':
        paid_at = fake.date_time_between(start_date=created_at, end_date='now')
    
    donation = Donation(
        user_id=user.id if user else None,
        public_name=public_name,
        phone=phone,
        email=email,
        amount=amount,
        purpose=purpose,
        is_recurring=subscription is not None,
        subscription_id=subscription.id if subscription else None,
        provider=random.choice(PROVIDERS),
        provider_payment_id=fake.uuid4() if status != 'pending' else None,
        status=status,
        paid_at=paid_at,
        created_at=created_at
    )
    
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


def generate_subscription(db, user: User = None, payment_method: PaymentMethod = None) -> Subscription:
    """Генерация подписки"""
    # Если пользователь не передан, создаем или выбираем случайного
    if not user:
        users = db.query(User).all()
        if users and random.random() > 0.3:  # 70% используют существующих пользователей
            user = random.choice(users)
        else:
            user = generate_user(db)
    
    # Если способ оплаты не передан, создаем или выбираем
    if not payment_method:
        payment_methods = db.query(PaymentMethod).filter(
            PaymentMethod.user_id == user.id,
            PaymentMethod.is_active == True
        ).all()
        
        if payment_methods and random.random() > 0.4:  # 60% используют существующий способ
            payment_method = random.choice(payment_methods)
        else:
            payment_method = generate_payment_method(db, user)
    
    # Сумма подписки (от 200 до 10000 рублей)
    amount = round(random.uniform(200, 10000), 2)
    
    # Назначение
    purpose = random.choice(PURPOSES)
    
    # Частота
    frequency = random.choice(FREQUENCIES)
    
    # Статус
    status = random.choice(STATUSES_SUBSCRIPTION)
    
    # Даты
    created_at = fake.date_time_between(start_date='-1y', end_date='now')
    next_charge_at = None
    last_charge_at = None
    canceled_at = None
    
    if status == 'active':
        next_charge_at = calculate_next_charge_date(frequency, created_at)
        if random.random() > 0.5:  # 50% имеют последнее списание
            last_charge_at = fake.date_time_between(start_date=created_at, end_date='now')
    elif status == 'canceled':
        canceled_at = fake.date_time_between(start_date=created_at, end_date='now')
    
    subscription = Subscription(
        user_id=user.id,
        payment_method_id=payment_method.id if payment_method else None,
        amount=amount,
        purpose=purpose,
        frequency=frequency,
        status=status,
        next_charge_at=next_charge_at,
        last_charge_at=last_charge_at,
        created_at=created_at,
        canceled_at=canceled_at
    )
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    # Создаем несколько пожертвований для активных подписок
    if status == 'active' and last_charge_at:
        num_donations = random.randint(1, 6)
        for _ in range(num_donations):
            generate_donation(db, user=user, subscription=subscription)
    
    return subscription


def validate_database(db):
    """Валидация данных в БД"""
    errors = []
    warnings = []
    
    # Проверка пользователей
    users = db.query(User).all()
    if not users:
        warnings.append("В БД нет пользователей")
    else:
        # Проверка уникальности телефонов
        phones = [u.phone for u in users]
        if len(phones) != len(set(phones)):
            errors.append("Найдены дубликаты телефонов у пользователей")
    
    # Проверка пожертвований
    donations = db.query(Donation).all()
    if not donations:
        warnings.append("В БД нет пожертвований")
    else:
        # Проверка минимальной суммы
        invalid_amounts = [d for d in donations if float(d.amount) < 100]
        if invalid_amounts:
            errors.append(f"Найдены пожертвования с суммой менее 100 руб: {len(invalid_amounts)}")
        
        # Проверка связей с пользователями
        orphan_donations = [d for d in donations if d.user_id and not db.query(User).filter(User.id == d.user_id).first()]
        if orphan_donations:
            errors.append(f"Найдены пожертвования с несуществующими пользователями: {len(orphan_donations)}")
    
    # Проверка подписок
    subscriptions = db.query(Subscription).all()
    if subscriptions:
        # Проверка связей с пользователями
        orphan_subs = [s for s in subscriptions if not db.query(User).filter(User.id == s.user_id).first()]
        if orphan_subs:
            errors.append(f"Найдены подписки с несуществующими пользователями: {len(orphan_subs)}")
        
        # Проверка способов оплаты
        orphan_pm = [s for s in subscriptions if s.payment_method_id and not db.query(PaymentMethod).filter(PaymentMethod.id == s.payment_method_id).first()]
        if orphan_pm:
            errors.append(f"Найдены подписки с несуществующими способами оплаты: {len(orphan_pm)}")
    
    # Проверка способов оплаты
    payment_methods = db.query(PaymentMethod).all()
    if payment_methods:
        orphan_pm = [pm for pm in payment_methods if not db.query(User).filter(User.id == pm.user_id).first()]
        if orphan_pm:
            errors.append(f"Найдены способы оплаты с несуществующими пользователями: {len(orphan_pm)}")
    
    return errors, warnings


def generate_test_data(
    num_users: int = 50,
    num_donations: int = 200,
    num_subscriptions: int = 30,
    num_payment_methods: int = 40
):
    """Основная функция генерации тестовых данных"""
    print("=" * 60)
    print("  Генератор тестовых данных для приюта 'Дом Лап'")
    print("=" * 60)
    
    # Инициализация БД
    init_db()
    db = SessionLocal()
    
    try:
        print(f"\n[INFO] Генерация пользователей: {num_users}")
        users = []
        for i in range(num_users):
            user = generate_user(db)
            users.append(user)
            if (i + 1) % 10 == 0:
                print(f"  Создано пользователей: {i + 1}/{num_users}")
        
        print(f"\n[INFO] Генерация способов оплаты: {num_payment_methods}")
        payment_methods = []
        for i in range(num_payment_methods):
            user = random.choice(users)
            pm = generate_payment_method(db, user)
            payment_methods.append(pm)
            if (i + 1) % 10 == 0:
                print(f"  Создано способов оплаты: {i + 1}/{num_payment_methods}")
        
        print(f"\n[INFO] Генерация подписок: {num_subscriptions}")
        subscriptions = []
        for i in range(num_subscriptions):
            user = random.choice(users)
            pm = random.choice(payment_methods) if payment_methods and random.random() > 0.3 else None
            sub = generate_subscription(db, user=user, payment_method=pm)
            subscriptions.append(sub)
            if (i + 1) % 10 == 0:
                print(f"  Создано подписок: {i + 1}/{num_subscriptions}")
        
        print(f"\n[INFO] Генерация пожертвований: {num_donations}")
        donations = []
        for i in range(num_donations):
            # 30% связаны с подписками
            subscription = random.choice(subscriptions) if subscriptions and random.random() < 0.3 else None
            user = subscription.user if subscription else (random.choice(users) if random.random() > 0.2 else None)
            
            donation = generate_donation(db, user=user, subscription=subscription)
            donations.append(donation)
            if (i + 1) % 50 == 0:
                print(f"  Создано пожертвований: {i + 1}/{num_donations}")
        
        print("\n[INFO] Валидация данных...")
        errors, warnings = validate_database(db)
        
        if warnings:
            for warning in warnings:
                print(f"  [WARNING] {warning}")
        
        if errors:
            print("\n[ERROR] Найдены ошибки валидации:")
            for error in errors:
                print(f"  - {error}")
            return False
        
        print("\n[OK] Валидация пройдена успешно!")
        
        # Статистика
        print("\n" + "=" * 60)
        print("  Статистика сгенерированных данных:")
        print("=" * 60)
        print(f"  Пользователей: {len(users)}")
        print(f"  Способов оплаты: {len(payment_methods)}")
        print(f"  Подписок: {len(subscriptions)}")
        print(f"  Пожертвований: {len(donations)}")
        
        # Дополнительная статистика
        active_subs = len([s for s in subscriptions if s.status == 'active'])
        succeeded_donations = len([d for d in donations if d.status == 'succeeded'])
        total_amount = sum([float(d.amount) for d in donations if d.status == 'succeeded'])
        
        print(f"\n  Активных подписок: {active_subs}")
        print(f"  Успешных пожертвований: {succeeded_donations}")
        print(f"  Общая сумма пожертвований: {total_amount:,.2f} ₽")
        
        print("\n" + "=" * 60)
        print("  Генерация данных завершена успешно!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Ошибка при генерации данных: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == '__main__':
    import sys
    
    # Параметры по умолчанию можно изменить через аргументы командной строки
    num_users = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    num_donations = int(sys.argv[2]) if len(sys.argv) > 2 else 200
    num_subscriptions = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    num_payment_methods = int(sys.argv[4]) if len(sys.argv) > 4 else 40
    
    success = generate_test_data(
        num_users=num_users,
        num_donations=num_donations,
        num_subscriptions=num_subscriptions,
        num_payment_methods=num_payment_methods
    )
    
    sys.exit(0 if success else 1)

