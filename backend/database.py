#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
База данных для приюта "Дом Лап"
Использует SQLite для простоты развертывания
"""
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

Base = declarative_base()

# Путь к БД - в папке backend
DB_PATH = os.path.join(os.path.dirname(__file__), 'shelter.db')

# Создание движка БД
engine = create_engine(f'sqlite:///{DB_PATH}', echo=False)

# Фабрика сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Модели данных
class User(Base):
    """Пользователи системы"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    payment_methods = relationship("PaymentMethod", back_populates="user", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")


class PaymentMethod(Base):
    """Способы оплаты (токены от платежных провайдеров)"""
    __tablename__ = 'payment_methods'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    provider = Column(String(50), nullable=False, default='yoomoney')  # yoomoney, stripe и т.д.
    provider_payment_token = Column(String(255), nullable=True)  # Токен для повторных списаний
    last4 = Column(String(4), nullable=True)  # Последние 4 цифры карты для отображения
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    user = relationship("User", back_populates="payment_methods")
    subscriptions = relationship("Subscription", back_populates="payment_method")


class Donation(Base):
    """Пожертвования"""
    __tablename__ = 'donations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # NULL для анонимных
    public_name = Column(String(255), nullable=False)  # ФИО или "Анонимно"
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    purpose = Column(String(100), nullable=False)  # food, medical, maintenance, general (назначение пожертвования)
    is_recurring = Column(Boolean, default=False)
    subscription_id = Column(Integer, ForeignKey('subscriptions.id'), nullable=True)
    
    # Платежная информация
    provider = Column(String(50), nullable=False, default='yoomoney')
    provider_payment_id = Column(String(255), nullable=True, index=True)  # ID платежа в YooMoney
    status = Column(String(50), nullable=False, default='pending')  # pending, succeeded, canceled, failed (статус платежа)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Связи
    user = relationship("User", back_populates="donations")
    subscription = relationship("Subscription", back_populates="donations")


class Subscription(Base):
    """Регулярные пожертвования (подписки)"""
    __tablename__ = 'subscriptions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    payment_method_id = Column(Integer, ForeignKey('payment_methods.id'), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    purpose = Column(String(100), nullable=False)
    frequency = Column(String(20), nullable=False)  # weekly, monthly, quarterly (частота списания)
    status = Column(String(20), nullable=False, default='active')  # active, canceled, paused (статус подписки)
    next_charge_at = Column(DateTime, nullable=True, index=True)
    last_charge_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    canceled_at = Column(DateTime, nullable=True)
    
    # Связи
    user = relationship("User", back_populates="subscriptions")
    payment_method = relationship("PaymentMethod", back_populates="subscriptions")
    donations = relationship("Donation", back_populates="subscription")


def init_db():
    """Инициализация БД - создание всех таблиц"""
    Base.metadata.create_all(bind=engine)
    print(f"[OK] База данных инициализирована: {DB_PATH}")


def get_db():
    """Получить сессию БД (для использования в Flask)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == '__main__':
    # Создаем БД при прямом запуске
    init_db()
    print("База данных создана успешно!")

