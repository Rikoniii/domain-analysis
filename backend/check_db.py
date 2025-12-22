#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для проверки состояния базы данных
"""
from database import init_db, SessionLocal, User, Donation, Subscription, PaymentMethod
from sqlalchemy import func

def check_database():
    """Проверить состояние базы данных"""
    print("=" * 60)
    print("  ПРОВЕРКА БАЗЫ ДАННЫХ")
    print("=" * 60)
    
    # Инициализируем БД
    init_db()
    
    db = SessionLocal()
    try:
        # Статистика по таблицам
        users_count = db.query(User).count()
        donations_count = db.query(Donation).count()
        subscriptions_count = db.query(Subscription).count()
        payment_methods_count = db.query(PaymentMethod).count()
        
        print(f"\n[СТАТИСТИКА]")
        print(f"  Пользователей: {users_count}")
        print(f"  Пожертвований: {donations_count}")
        print(f"  Подписок: {subscriptions_count}")
        print(f"  Способов оплаты: {payment_methods_count}")
        
        # Проверяем пожертвования
        if donations_count > 0:
            print(f"\n[ПОЖЕРТВОВАНИЯ]")
            donations = db.query(Donation).order_by(Donation.created_at.desc()).limit(10).all()
            for d in donations:
                print(f"  ID: {d.id:3d} | {d.public_name:30s} | {float(d.amount):8.2f} ₽ | {d.status:10s} | {d.purpose}")
            
            # Статистика по статусам
            status_stats = db.query(
                Donation.status,
                func.count(Donation.id).label('count'),
                func.sum(Donation.amount).label('total')
            ).group_by(Donation.status).all()
            
            print(f"\n[СТАТИСТИКА ПО СТАТУСАМ]")
            for stat in status_stats:
                print(f"  {stat.status:15s}: {stat.count:3d} шт. | {float(stat.total or 0):12.2f} ₽")
        
        # Проверяем пользователей
        if users_count > 0:
            print(f"\n[ПОЛЬЗОВАТЕЛИ]")
            users = db.query(User).limit(10).all()
            for u in users:
                donations_by_user = db.query(Donation).filter(Donation.user_id == u.id).count()
                print(f"  ID: {u.id:3d} | {u.phone:20s} | {u.full_name or 'N/A':30s} | Донатов: {donations_by_user}")
        
        # Проверяем на фейковые данные
        print(f"\n[ПРОВЕРКА НА ФЕЙКОВЫЕ ДАННЫЕ]")
        from sqlalchemy import or_
        fake_users = db.query(User).filter(
            User.email.isnot(None),
            or_(
                User.email.contains('example.com'),
                User.email.contains('test.com'),
                User.email.contains('demo.com')
            )
        ).all()
        
        fake_donations = db.query(Donation).filter(
            Donation.email.isnot(None),
            or_(
                Donation.email.contains('example.com'),
                Donation.email.contains('test.com'),
                Donation.email.contains('demo.com')
            )
        ).all()
        
        if fake_users or fake_donations:
            print(f"  ⚠️  Найдено фейковых пользователей: {len(fake_users)}")
            print(f"  ⚠️  Найдено фейковых пожертвований: {len(fake_donations)}")
            if fake_users:
                print(f"\n  Фейковые пользователи:")
                for u in fake_users:
                    print(f"    - ID {u.id}: {u.phone} ({u.email})")
            if fake_donations:
                print(f"\n  Фейковые пожертвования:")
                for d in fake_donations[:5]:
                    print(f"    - ID {d.id}: {d.public_name} ({d.email}) - {float(d.amount)} ₽")
        else:
            print(f"  ✓ Фейковых данных не найдено")
        
        print(f"\n" + "=" * 60)
        
    except Exception as e:
        print(f"[ОШИБКА] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    check_database()

