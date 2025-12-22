#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт миграции данных из JSON в БД
Запускается один раз для переноса существующих данных
"""
import json
import os
from datetime import datetime
from database import init_db, SessionLocal, User, Donation

def migrate_donations():
    """Миграция донатов из data/donations.json в БД"""
    db = SessionLocal()
    try:
        # Инициализируем БД
        init_db()
        
        # Читаем JSON - путь относительно корня проекта
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        donations_file = os.path.join(project_root, 'data', 'donations.json')
        if not os.path.exists(donations_file):
            print(f"[ERROR] Файл {donations_file} не найден")
            return
        
        with open(donations_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        count = 0
        skipped = 0
        
        for d in data.get('donations', []):
            # Проверяем, не существует ли уже
            existing = db.query(Donation).filter(Donation.id == d.get('id')).first()
            if existing:
                skipped += 1
                continue
            
            # Получаем или создаем пользователя
            phone = d.get('userPhone', '')
            email = d.get('userEmail', '')
            name = d.get('userName', '')
            
            user = None
            if phone:
                user = db.query(User).filter(User.phone == phone).first()
                if not user:
                    user = User(phone=phone, email=email, full_name=name)
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                else:
                    # Обновляем данные
                    if email and user.email != email:
                        user.email = email
                    if name and user.full_name != name:
                        user.full_name = name
                    db.commit()
            
            # Создаем донат
            donation_date = d.get('date', datetime.utcnow().isoformat())
            try:
                if 'T' in donation_date:
                    paid_at = datetime.fromisoformat(donation_date)
                else:
                    paid_at = datetime.strptime(donation_date, '%Y-%m-%d')
            except:
                paid_at = datetime.utcnow()
            
            donation = Donation(
                id=d.get('id'),
                user_id=user.id if user else None,
                public_name=name or 'Анонимно',
                phone=phone if phone else None,
                email=email if email else None,
                amount=d.get('amount', 0),
                purpose=d.get('purpose', 'general'),
                status='succeeded' if d.get('status') == 'completed' else 'pending',
                paid_at=paid_at,
                created_at=paid_at,
                provider='yoomoney'
            )
            db.add(donation)
            count += 1
        
        db.commit()
        print(f"[OK] Мигрировано донатов: {count}")
        print(f"[INFO] Пропущено (уже существуют): {skipped}")
        
    except Exception as e:
        print(f"[ERROR] Ошибка миграции: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    print("=" * 50)
    print("  Миграция данных из JSON в БД")
    print("=" * 50)
    migrate_donations()
    print("=" * 50)

