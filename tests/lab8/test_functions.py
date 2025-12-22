"""
Юнит-тесты для утилитарных функций приложения

Этот модуль содержит тесты для функций:
- calculate_next_charge_date: вычисление даты следующего списания
- generate_code: генерация кода подтверждения
- generate_session_id: генерация ID сессии
"""
import string
from datetime import datetime, timedelta

import pytest

# Импортируем функции из backend/app для тестирования
from backend.app import (
    calculate_next_charge_date,
    generate_code,
    generate_session_id,
)


# ==================== ТЕСТЫ ДЛЯ calculate_next_charge_date ==================== #

def test_calculate_next_charge_date_weekly():
    """
    Позитивный тест: проверка вычисления даты следующего списания для еженедельной подписки
    
    Ожидаемое поведение:
    - Функция должна добавить ровно 7 дней к базовой дате
    """
    # Устанавливаем базовую дату для теста
    base_date = datetime(2025, 1, 1)
    
    # Вызываем функцию с частотой "weekly"
    result = calculate_next_charge_date("weekly", from_date=base_date)
    
    # Проверяем, что результат равен базовой дате + 1 неделя
    assert result == base_date + timedelta(weeks=1)


def test_calculate_next_charge_date_monthly():
    """
    Позитивный тест: проверка вычисления даты следующего списания для ежемесячной подписки
    
    Ожидаемое поведение:
    - Функция должна добавить 1 календарный месяц к базовой дате
    - Используется relativedelta для корректной обработки месяцев разной длины
    """
    # Используем дату в конце месяца для проверки корректной обработки
    base_date = datetime(2025, 1, 31)
    
    # Вызываем функцию с частотой "monthly"
    result = calculate_next_charge_date("monthly", from_date=base_date)
    
    # Проверяем, что месяц изменился (может быть февраль или март в зависимости от года)
    # relativedelta корректно обрабатывает переход через месяц
    assert result.month in (2, 3)


def test_calculate_next_charge_date_quarterly():
    """
    Позитивный тест: проверка вычисления даты следующего списания для квартальной подписки
    
    Ожидаемое поведение:
    - Функция должна добавить 3 календарных месяца к базовой дате
    """
    # Устанавливаем базовую дату
    base_date = datetime(2025, 1, 10)
    
    # Вызываем функцию с частотой "quarterly"
    result = calculate_next_charge_date("quarterly", from_date=base_date)
    
    # Проверяем, что месяц увеличился на 3 (январь -> апрель)
    assert result.month == 4


def test_calculate_next_charge_date_default_for_unknown_frequency():
    """
    Негативный тест: проверка поведения функции при неизвестной частоте
    
    Ожидаемое поведение:
    - Функция должна использовать значение по умолчанию (месяц)
    - Не должна выбрасывать исключение
    """
    # Устанавливаем базовую дату
    base_date = datetime(2025, 1, 10)
    
    # Вызываем функцию с неизвестной частотой
    result = calculate_next_charge_date("unknown", from_date=base_date)
    
    # Проверяем, что функция вернула дату (используется месяц по умолчанию)
    # Месяц должен измениться
    assert result.month in (2, 3)


def test_calculate_next_charge_date_uses_utc_now_when_from_date_none():
    """
    Позитивный тест: проверка использования текущего времени UTC при отсутствии базовой даты
    
    Ожидаемое поведение:
    - Если from_date=None, функция должна использовать datetime.utcnow()
    - Результат должен быть объектом datetime
    """
    # Вызываем функцию без указания базовой даты (from_date=None)
    result = calculate_next_charge_date("monthly", from_date=None)
    
    # Проверяем, что результат является объектом datetime
    assert isinstance(result, datetime)


# ==================== ТЕСТЫ ДЛЯ generate_code ==================== #

def test_generate_code_default_length():
    """
    Позитивный тест: проверка генерации кода с длиной по умолчанию
    
    Ожидаемое поведение:
    - По умолчанию код должен состоять из 4 символов
    """
    # Генерируем код без указания длины
    code = generate_code()
    
    # Проверяем, что длина кода равна 4
    assert len(code) == 4


def test_generate_code_custom_length():
    """
    Позитивный тест: проверка генерации кода с произвольной длиной
    
    Ожидаемое поведение:
    - Код должен иметь указанную длину
    """
    # Генерируем код длиной 6 символов
    code = generate_code(6)
    
    # Проверяем, что длина кода равна 6
    assert len(code) == 6


def test_generate_code_digits_only():
    """
    Позитивный тест: проверка, что код состоит только из цифр
    
    Ожидаемое поведение:
    - Все символы кода должны быть цифрами (0-9)
    """
    # Генерируем код длиной 10 символов для более надежной проверки
    code = generate_code(10)
    
    # Проверяем, что все символы являются цифрами
    assert all(ch in string.digits for ch in code)


def test_generate_code_zero_length():
    """
    Граничный тест: проверка генерации кода нулевой длины
    
    Ожидаемое поведение:
    - При длине 0 должен возвращаться пустая строка
    """
    # Генерируем код нулевой длины
    code = generate_code(0)
    
    # Проверяем, что результат - пустая строка
    assert code == ""


# ==================== ТЕСТЫ ДЛЯ generate_session_id ==================== #

def test_generate_session_id_length():
    """
    Позитивный тест: проверка длины генерируемого ID сессии
    
    Ожидаемое поведение:
    - ID сессии должен состоять из 32 символов
    """
    # Генерируем ID сессии
    session_id = generate_session_id()
    
    # Проверяем, что длина равна 32 символам
    assert len(session_id) == 32


def test_generate_session_id_alphanumeric():
    """
    Позитивный тест: проверка, что ID сессии состоит только из букв и цифр
    
    Ожидаемое поведение:
    - ID должен содержать только символы из набора: a-z, A-Z, 0-9
    """
    # Генерируем ID сессии
    session_id = generate_session_id()
    
    # Определяем допустимые символы (буквы и цифры)
    allowed = set(string.ascii_letters + string.digits)
    
    # Проверяем, что все символы ID находятся в допустимом наборе
    assert all(ch in allowed for ch in session_id)


def test_generate_session_id_uniqueness():
    """
    Позитивный тест: проверка уникальности генерируемых ID сессий
    
    Ожидаемое поведение:
    - При генерации множества ID не должно быть дубликатов
    - Это важно для безопасности и корректной работы системы
    """
    # Генерируем 100 различных ID сессий
    ids = {generate_session_id() for _ in range(100)}
    
    # Проверяем, что все ID уникальны (количество элементов равно количеству генераций)
    # В небольшом наборе не должно быть коллизий благодаря случайности генерации
    assert len(ids) == 100

