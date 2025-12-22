#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flask API сервер для приюта "Дом Лап"
Обрабатывает донаты, подписки, админ-панель и интеграцию с YooMoney
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import json
import os
import hashlib
import hmac
import requests
from typing import Optional, Dict, Any

from database import init_db, get_db, User, Donation, Subscription, PaymentMethod, engine, SessionLocal
import random
import string

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для фронтенда

# Конфигурация YooMoney
YOOMONEY_SHOP_ID = os.getenv('YOOMONEY_SHOP_ID', '')  # ID магазина в YooMoney
YOOMONEY_SECRET_KEY = os.getenv('YOOMONEY_SECRET_KEY', '')  # Секретный ключ
YOOMONEY_WEBHOOK_SECRET = os.getenv('YOOMONEY_WEBHOOK_SECRET', '')  # Секрет для проверки webhook
BASE_URL = os.getenv('BASE_URL', 'http://localhost:8000')  # Базовый URL для return_url

# Инициализация БД при старте
init_db()


# ==================== УТИЛИТЫ ====================

def get_or_create_user(phone: str, email: Optional[str] = None, full_name: Optional[str] = None, db: Session = None) -> User:
    """Получить или создать пользователя"""
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(phone=phone, email=email, full_name=full_name)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Обновляем данные, если они изменились
        if email and user.email != email:
            user.email = email
        if full_name and user.full_name != full_name:
            user.full_name = full_name
        db.commit()
    return user


def calculate_next_charge_date(frequency: str, from_date: Optional[datetime] = None) -> datetime:
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
        return from_date + relativedelta(months=1)  # По умолчанию месяц


# ==================== YOOMONEY ИНТЕГРАЦИЯ ====================

def create_yoomoney_payment(
    amount: float,
    description: str,
    return_url: str,
    metadata: Dict[str, Any],
    payment_method: str = 'card'
) -> Dict[str, Any]:
    """
    Создать платеж в YooMoney
    
    ВАЖНО: Это упрощенная версия. В реальности нужно использовать официальный SDK YooMoney
    или делать HTTP запросы к их API согласно документации.
    
    Документация: https://yoomoney.ru/docs/payment-buttons/using-api/payment-process
    """
    if not YOOMONEY_SHOP_ID or not YOOMONEY_SECRET_KEY:
        # В режиме разработки возвращаем мок в зависимости от способа оплаты
        payment_type = (
            'bank_card' if payment_method == 'card'
            else 'yoomoney' if payment_method == 'yoomoney'
            else 'paypal' if payment_method == 'paypal'
            else 'sbp'
        )
        return {
            'id': f'mock_payment_{payment_type}_{datetime.utcnow().timestamp()}',
            'status': 'pending',
            'confirmation': {
                'type': 'redirect',
                # В реальности здесь будет URL YooMoney / виджета. В демо просто возвращаем ссылку на donate.html
                'confirmation_url': f'{BASE_URL}/frontend/donate.html?mock_payment=success&amount={amount}&method={payment_type}'
            }
        }
    
    # Реальная интеграция (пример структуры запроса)
    url = 'https://yoomoney.ru/api/v3/payments'
    headers = {
        'Authorization': f'Bearer {YOOMONEY_SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    # Определяем тип платежного метода для YooMoney
    # bank_card - обычная карта; для СБП и других методов нужно смотреть документацию YooMoney
    if payment_method == 'card':
        payment_type = 'bank_card'
    elif payment_method == 'yoomoney':
        payment_type = 'yoo_money'
    elif payment_method == 'sbp':
        # Для СБП у YooMoney есть отдельные сценарии, здесь оставляем как пример
        payment_type = 'sbp'
    else:
        payment_type = 'bank_card'

    data = {
        'amount': {
            'value': str(amount),
            'currency': 'RUB'
        },
        'confirmation': {
            'type': 'redirect',
            'return_url': return_url
        },
        'description': description,
        'metadata': metadata,
        'capture': True,
        'payment_method_data': {
            'type': payment_type
        }
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[ERROR] YooMoney API error: {e}")
        raise


def verify_yoomoney_webhook(data: Dict[str, Any], signature: str) -> bool:
    """
    Проверить подпись webhook от YooMoney
    
    ВАЖНО: Реальная проверка зависит от формата подписи, который использует YooMoney.
    Обычно это HMAC-SHA256 от тела запроса с секретным ключом.
    """
    if not YOOMONEY_WEBHOOK_SECRET:
        # В режиме разработки пропускаем проверку
        return True
    
    # Пример проверки (нужно адаптировать под реальный формат YooMoney)
    body_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
    expected_signature = hmac.new(
        YOOMONEY_WEBHOOK_SECRET.encode('utf-8'),
        body_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)


# ==================== API ЭНДПОИНТЫ ====================

@app.route('/api/admin/donations', methods=['GET'])
def get_admin_donations():
    """Получить список донатов для админ-панели"""
    db = next(get_db())
    try:
        limit = request.args.get('limit', 50, type=int)
        status = request.args.get('status', None)
        
        query = db.query(Donation)
        if status:
            query = query.filter(Donation.status == status)
        
        donations = query.order_by(Donation.created_at.desc()).limit(limit).all()
        
        result = []
        for d in donations:
            result.append({
                'id': d.id,
                'public_name': d.public_name,
                'amount': float(d.amount),
                'purpose': d.purpose,
                'status': d.status,
                'paid_at': d.paid_at.isoformat() if d.paid_at else None,
                'created_at': d.created_at.isoformat(),
                'phone': d.phone,
                'email': d.email,
                'is_recurring': d.is_recurring
            })
        
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] get_admin_donations: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/admin/donations/monthly-stats', methods=['GET'])
def get_monthly_stats():
    """Получить статистику донатов по месяцам для графика"""
    db = next(get_db())
    try:
        year = request.args.get('year', datetime.utcnow().year, type=int)
        month = request.args.get('month', datetime.utcnow().month, type=int)
        
        # Получаем все донаты за месяц со статусом succeeded, completed или pending
        # В тестовом режиме считаем pending как завершенный
        # Используем paid_at если есть, иначе created_at
        from sqlalchemy import or_, case
        donations = db.query(Donation).filter(
            or_(
                Donation.status == 'succeeded',
                Donation.status == 'completed',
                Donation.status == 'pending'
            )
        ).all()
        
        # Фильтруем по дате в Python, так как нужно использовать paid_at или created_at
        filtered_donations = []
        for d in donations:
            donation_date = d.paid_at if d.paid_at else d.created_at
            if donation_date and donation_date.year == year and donation_date.month == month:
                filtered_donations.append(d)
        donations = filtered_donations
        
        # Группируем по дням
        by_day = {}
        total = 0
        
        for d in donations:
            # Используем paid_at если есть, иначе created_at
            donation_date = d.paid_at if d.paid_at else d.created_at
            if donation_date:
                day = donation_date.day
                if day not in by_day:
                    by_day[day] = 0
                by_day[day] += float(d.amount)
                total += float(d.amount)
        
        # Формируем массив для всех дней месяца
        from calendar import monthrange
        days_in_month = monthrange(year, month)[1]
        result_by_day = []
        for day in range(1, days_in_month + 1):
            result_by_day.append({
                'day': day,
                'amount': by_day.get(day, 0)
            })
        
        return jsonify({
            'year': year,
            'month': month,
            'by_day': result_by_day,
            'total': total
        })
    except Exception as e:
        print(f"[ERROR] get_monthly_stats: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/donations', methods=['POST'])
def create_donation():
    """Создать донат и инициировать платеж в YooMoney"""
    db = next(get_db())
    try:
        data = request.json
        
        # Валидация
        amount = float(data.get('amount', 0))
        if amount < 100:
            return jsonify({'error': 'Минимальная сумма пожертвования - 100 ₽'}), 400
        
        purpose = data.get('purpose', 'general')
        is_recurring = data.get('is_recurring', False)
        anonymous = data.get('anonymous', False)
        full_name = data.get('full_name', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip()
        user_id = data.get('user_id', None)
        payment_method = data.get('payment_method', 'card')
        
        # Определяем публичное имя
        if anonymous:
            public_name = 'Анонимно'
        else:
            public_name = full_name if full_name else 'Анонимно'
        
        # Получаем или создаем пользователя (если не анонимно)
        user = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
        elif phone and not anonymous:
            user = get_or_create_user(phone, email, full_name, db)
        
        # Создаем запись доната
        donation = Donation(
            user_id=user.id if user else None,
            public_name=public_name,
            phone=phone if not anonymous else None,
            email=email if not anonymous else None,
            amount=amount,
            purpose=purpose,
            is_recurring=is_recurring,
            status='pending'
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)
        
        # Создаем платеж в YooMoney (или мок в режиме разработки)
        description = f"Пожертвование в приют 'Дом Лап': {purpose}"
        return_url = f"{BASE_URL}/frontend/donate.html?donation_id={donation.id}&status=success"
        metadata = {
            'donation_id': donation.id,
            'user_id': user.id if user else None,
            'purpose': purpose,
            'payment_method': payment_method
        }
        
        try:
            payment_response = create_yoomoney_payment(
                amount,
                description,
                return_url,
                metadata,
                payment_method=payment_method
            )
            
            # Сохраняем ID платежа от провайдера
            donation.provider_payment_id = payment_response.get('id')
            donation.provider = 'yoomoney'
            db.commit()
            
            # Если это регулярное пожертвование, создаем подписку (после успешного первого платежа)
            subscription_id = None
            if is_recurring and user:
                # Подписка будет создана после успешного первого платежа через webhook
                pass
            
            return jsonify({
                'donation_id': donation.id,
                'payment_url': payment_response.get('confirmation', {}).get('confirmation_url'),
                'status': 'pending'
            })
        except Exception as e:
            print(f"[ERROR] YooMoney payment creation failed: {e}")
            donation.status = 'failed'
            db.commit()
            return jsonify({'error': f'Ошибка создания платежа: {str(e)}'}), 500
        
    except Exception as e:
        print(f"[ERROR] create_donation: {e}")
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/yoomoney/webhook', methods=['POST'])
def yoomoney_webhook():
    """Обработчик webhook от YooMoney"""
    db = next(get_db())
    try:
        # Получаем данные и подпись
        data = request.json
        signature = request.headers.get('X-YooMoney-Signature', '')  # Или другой заголовок, зависит от YooMoney
        
        # Проверяем подпись
        if not verify_yoomoney_webhook(data, signature):
            print("[WARNING] Invalid webhook signature")
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Обрабатываем событие
        event_type = data.get('event', '')
        payment_data = data.get('object', {})
        payment_id = payment_data.get('id', '')
        
        # Находим донат по ID платежа
        donation = db.query(Donation).filter(Donation.provider_payment_id == payment_id).first()
        if not donation:
            print(f"[WARNING] Donation not found for payment_id: {payment_id}")
            return jsonify({'error': 'Donation not found'}), 404
        
        # Обновляем статус доната
        status = payment_data.get('status', '')
        if status == 'succeeded':
            donation.status = 'succeeded'
            donation.paid_at = datetime.utcnow()
            
            # Если это регулярное пожертвование и еще нет подписки - создаем
            if donation.is_recurring and not donation.subscription_id and donation.user_id:
                user = db.query(User).filter(User.id == donation.user_id).first()
                if user:
                    # Получаем или создаем способ оплаты
                    payment_method = None
                    if payment_data.get('payment_method', {}).get('id'):
                        provider_token = payment_data['payment_method']['id']
                        payment_method = db.query(PaymentMethod).filter(
                            PaymentMethod.provider_payment_token == provider_token,
                            PaymentMethod.user_id == user.id
                        ).first()
                        
                        if not payment_method:
                            payment_method = PaymentMethod(
                                user_id=user.id,
                                provider='yoomoney',
                                provider_payment_token=provider_token,
                                last4=payment_data.get('payment_method', {}).get('card', {}).get('last4', ''),
                                is_active=True
                            )
                            db.add(payment_method)
                            db.commit()
                            db.refresh(payment_method)
                    
                    # Создаем подписку
                    frequency = 'monthly'  # По умолчанию, можно брать из donation или запроса
                    subscription = Subscription(
                        user_id=user.id,
                        payment_method_id=payment_method.id if payment_method else None,
                        amount=donation.amount,
                        purpose=donation.purpose,
                        frequency=frequency,
                        status='active',
                        next_charge_at=calculate_next_charge_date(frequency)
                    )
                    db.add(subscription)
                    db.commit()
                    db.refresh(subscription)
                    
                    donation.subscription_id = subscription.id
            
        elif status in ['canceled', 'failed']:
            donation.status = status
        
        db.commit()
        
        return jsonify({'status': 'ok'})
        
    except Exception as e:
        print(f"[ERROR] yoomoney_webhook: {e}")
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/subscriptions', methods=['GET'])
def get_subscriptions():
    """Получить список подписок (для админки или профиля)"""
    db = next(get_db())
    try:
        user_id = request.args.get('user_id', None, type=int)
        status = request.args.get('status', 'active')
        
        query = db.query(Subscription)
        if user_id:
            query = query.filter(Subscription.user_id == user_id)
        if status:
            query = query.filter(Subscription.status == status)
        
        subscriptions = query.order_by(Subscription.created_at.desc()).all()
        
        result = []
        for s in subscriptions:
            result.append({
                'id': s.id,
                'user_id': s.user_id,
                'amount': float(s.amount),
                'purpose': s.purpose,
                'frequency': s.frequency,
                'status': s.status,
                'next_charge_at': s.next_charge_at.isoformat() if s.next_charge_at else None,
                'last_charge_at': s.last_charge_at.isoformat() if s.last_charge_at else None,
                'created_at': s.created_at.isoformat()
            })
        
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] get_subscriptions: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@app.route('/api/subscriptions/<int:subscription_id>/cancel', methods=['POST'])
def cancel_subscription(subscription_id: int):
    """Отменить подписку"""
    db = next(get_db())
    try:
        subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
        if not subscription:
            return jsonify({'error': 'Subscription not found'}), 404
        
        subscription.status = 'canceled'
        subscription.canceled_at = datetime.utcnow()
        db.commit()
        
        return jsonify({'status': 'ok'})
    except Exception as e:
        print(f"[ERROR] cancel_subscription: {e}")
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


# ==================== КРОН-ДЖОБ ДЛЯ ПОДПИСОК ====================

def process_recurring_charges():
    """
    Обработать регулярные списания по подпискам
    Вызывается по расписанию (cron или планировщик задач)
    """
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Находим активные подписки, у которых наступило время списания
        subscriptions = db.query(Subscription).filter(
            Subscription.status == 'active',
            Subscription.next_charge_at <= now
        ).all()
        
        for subscription in subscriptions:
            try:
                # Создаем донат
                donation = Donation(
                    user_id=subscription.user_id,
                    public_name=subscription.user.full_name if subscription.user else 'Анонимно',
                    phone=subscription.user.phone if subscription.user else None,
                    email=subscription.user.email if subscription.user else None,
                    amount=subscription.amount,
                    purpose=subscription.purpose,
                    is_recurring=True,
                    subscription_id=subscription.id,
                    status='pending',
                    provider='yoomoney'
                )
                db.add(donation)
                db.commit()
                db.refresh(donation)
                
                # Инициируем платеж через YooMoney API
                if subscription.payment_method and subscription.payment_method.provider_payment_token:
                    # Используем сохраненный токен для повторного списания
                    # (это зависит от возможностей YooMoney API)
                    description = f"Регулярное пожертвование: {subscription.purpose}"
                    return_url = f"{BASE_URL}/frontend/profile.html"
                    metadata = {
                        'donation_id': donation.id,
                        'subscription_id': subscription.id,
                        'user_id': subscription.user_id
                    }
                    
                    # Создаем платеж (в реальности нужно использовать токен для безакцептного списания)
                    payment_response = create_yoomoney_payment(
                        float(subscription.amount),
                        description,
                        return_url,
                        metadata
                    )
                    
                    donation.provider_payment_id = payment_response.get('id')
                    db.commit()
                    
                    # Обновляем дату следующего списания (будет обновлена после успешного webhook)
                    subscription.next_charge_at = calculate_next_charge_date(
                        subscription.frequency,
                        subscription.next_charge_at
                    )
                    db.commit()
                else:
                    # Нет способа оплаты - помечаем подписку как проблемную
                    subscription.status = 'paused'
                    db.commit()
                    
            except Exception as e:
                print(f"[ERROR] Failed to process subscription {subscription.id}: {e}")
                db.rollback()
        
    except Exception as e:
        print(f"[ERROR] process_recurring_charges: {e}")
    finally:
        db.close()


# ==================== МИГРАЦИЯ ДАННЫХ ====================

@app.route('/api/migrate/json-to-db', methods=['POST'])
def migrate_json_to_db():
    """Миграция данных из JSON файлов в БД (одноразовая операция)"""
    db = next(get_db())
    try:
        # Читаем donations.json - путь относительно корня проекта
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        donations_file = os.path.join(project_root, 'data', 'donations.json')
        if os.path.exists(donations_file):
            with open(donations_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            count = 0
            for d in data.get('donations', []):
                # Проверяем, не существует ли уже
                existing = db.query(Donation).filter(Donation.id == d.get('id')).first()
                if existing:
                    continue
                
                # Получаем или создаем пользователя
                phone = d.get('userPhone', '')
                email = d.get('userEmail', '')
                name = d.get('userName', '')
                
                user = None
                if phone:
                    user = get_or_create_user(phone, email, name, db)
                
                # Создаем донат
                donation = Donation(
                    id=d.get('id'),
                    user_id=user.id if user else None,
                    public_name=name or 'Анонимно',
                    phone=phone,
                    email=email,
                    amount=d.get('amount', 0),
                    purpose=d.get('purpose', 'general'),
                    status='succeeded' if d.get('status') == 'completed' else 'pending',
                    paid_at=datetime.fromisoformat(d.get('date', datetime.utcnow().isoformat())) if d.get('date') else datetime.utcnow(),
                    created_at=datetime.fromisoformat(d.get('date', datetime.utcnow().isoformat())) if d.get('date') else datetime.utcnow()
                )
                db.add(donation)
                count += 1
            
            db.commit()
            return jsonify({'status': 'ok', 'migrated': count})
        else:
            return jsonify({'error': 'donations.json not found'}), 404
            
    except Exception as e:
        print(f"[ERROR] migrate_json_to_db: {e}")
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


# ==================== АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ ====================

# In-memory storage for verification codes (в продакшене использовать Redis)
verification_sessions = {}

def generate_code(length=4):
    """Генерировать код подтверждения"""
    return ''.join(random.choices(string.digits, k=length))

def generate_session_id():
    """Генерировать ID сессии"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

@app.route('/api/auth/send-code', methods=['POST'])
def send_verification_code():
    """Отправить код подтверждения через SMS или звонок"""
    db = next(get_db())
    try:
        data = request.json
        phone = data.get('phone', '').strip()
        method = data.get('method', 'sms')  # 'sms' or 'call'
        
        if not phone:
            return jsonify({'error': 'Номер телефона обязателен'}), 400
        
        # Normalize phone
        normalized_phone = phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
        
        # Generate code and session
        code = generate_code(4)
        session_id = generate_session_id()
        
        # Store session (expires in 5 minutes)
        verification_sessions[session_id] = {
            'phone': normalized_phone,
            'code': code,
            'method': method,
            'created_at': datetime.utcnow(),
            'expires_at': datetime.utcnow() + timedelta(minutes=5)
        }
        
        # TODO: В продакшене здесь будет реальная отправка SMS/звонка
        # Для теста просто логируем
        print(f"[AUTH] Code for {normalized_phone}: {code} (method: {method})")
        
        # В режиме разработки можно использовать мок-сервисы:
        # - SMS: Twilio, SMS.ru, smsc.ru
        # - Звонки: Twilio Voice API
        
        return jsonify({
            'session_id': session_id,
            'message': 'Код отправлен' if method == 'sms' else 'Звонок совершен'
        })
        
    except Exception as e:
        print(f"[ERROR] send_verification_code: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/auth/verify-code', methods=['POST'])
def verify_code():
    """Проверить код подтверждения"""
    try:
        data = request.json
        session_id = data.get('session_id')
        code = data.get('code', '').strip()
        
        if not session_id or not code:
            return jsonify({'error': 'Необходимы session_id и code'}), 400
        
        session = verification_sessions.get(session_id)
        if not session:
            return jsonify({'error': 'Сессия не найдена или истекла'}), 404
        
        # Check expiration
        if datetime.utcnow() > session['expires_at']:
            del verification_sessions[session_id]
            return jsonify({'error': 'Код истек'}), 400
        
        # Verify code
        if session['code'] != code:
            return jsonify({'error': 'Неверный код'}), 400
        
        # Code is valid
        return jsonify({'verified': True, 'phone': session['phone']})
        
    except Exception as e:
        print(f"[ERROR] verify_code: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    db = next(get_db())
    try:
        data = request.json
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip()
        full_name = data.get('full_name', '').strip()
        code = data.get('code', '').strip()
        session_id = data.get('session_id')
        
        if not phone or not full_name or not code or not session_id:
            return jsonify({'error': 'Заполните все обязательные поля'}), 400
        
        # Normalize phone
        normalized_phone = phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
        
        # Verify code first
        session = verification_sessions.get(session_id)
        if not session:
            return jsonify({'error': 'Сессия не найдена или истекла'}), 404
        
        if datetime.utcnow() > session['expires_at']:
            del verification_sessions[session_id]
            return jsonify({'error': 'Код истек'}), 400
        
        if session['code'] != code or session['phone'] != normalized_phone:
            return jsonify({'error': 'Неверный код подтверждения'}), 400
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.phone == normalized_phone).first()
        if existing_user:
            return jsonify({'error': 'Пользователь с таким номером уже зарегистрирован'}), 400
        
        # Create user
        user = User(
            phone=normalized_phone,
            email=email if email else None,
            full_name=full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Clean up session
        del verification_sessions[session_id]
        
        return jsonify({
            'user': {
                'id': user.id,
                'phone': user.phone,
                'email': user.email,
                'full_name': user.full_name
            }
        })
        
    except Exception as e:
        print(f"[ERROR] register: {e}")
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Вход в существующий аккаунт"""
    db = next(get_db())
    try:
        data = request.json
        phone = data.get('phone', '').strip()
        code = data.get('code', '').strip()
        session_id = data.get('session_id')
        
        if not phone or not code or not session_id:
            return jsonify({'error': 'Необходимы phone, code и session_id'}), 400
        
        # Normalize phone
        normalized_phone = phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
        
        # Verify code
        session = verification_sessions.get(session_id)
        if not session:
            return jsonify({'error': 'Сессия не найдена или истекла'}), 404
        
        if datetime.utcnow() > session['expires_at']:
            del verification_sessions[session_id]
            return jsonify({'error': 'Код истек'}), 400
        
        if session['code'] != code or session['phone'] != normalized_phone:
            return jsonify({'error': 'Неверный код подтверждения'}), 400
        
        # Find user
        user = db.query(User).filter(User.phone == normalized_phone).first()
        if not user:
            return jsonify({'error': 'Пользователь не найден. Пожалуйста, зарегистрируйтесь'}), 404
        
        # Clean up session
        del verification_sessions[session_id]
        
        return jsonify({
            'user': {
                'id': user.id,
                'phone': user.phone,
                'email': user.email,
                'full_name': user.full_name
            }
        })
        
    except Exception as e:
        print(f"[ERROR] login: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# ==================== ЗАПУСК ====================

if __name__ == '__main__':
    print("=" * 50)
    print("  Flask API сервер для приюта 'Дом Лап'")
    print("=" * 50)
    print(f"\n[OK] API запущен на http://localhost:5000")
    print(f"[INFO] База данных: shelter.db")
    print("\n[INFO] Доступные эндпоинты:")
    print("  GET  /api/admin/donations")
    print("  GET  /api/admin/donations/monthly-stats")
    print("  POST /api/donations")
    print("  POST /api/yoomoney/webhook")
    print("  GET  /api/subscriptions")
    print("  POST /api/subscriptions/<id>/cancel")
    print("  POST /api/auth/send-code")
    print("  POST /api/auth/register")
    print("  POST /api/auth/login")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)

