"""
Юнит-тесты для API эндпоинтов приложения

Этот модуль содержит тесты для HTTP эндпоинтов:
- /api/auth/verify-code: проверка кода подтверждения при авторизации
"""
from datetime import datetime, timedelta

import pytest

# Импортируем Flask приложение и словарь сессий для тестирования
from backend.app import app, verification_sessions


# ==================== FIXTURE ДЛЯ FLASK TEST CLIENT ==================== #

@pytest.fixture
def client():
    """
    Фикстура для создания тестового клиента Flask
    
    Используется для отправки HTTP запросов к API без запуска реального сервера.
    Автоматически очищается после каждого теста.
    """
    # Включаем тестовый режим приложения
    app.testing = True
    
    # Создаем тестовый клиент
    with app.test_client() as c:
        yield c


# ==================== ТЕСТЫ ДЛЯ /api/auth/verify-code ==================== #

def test_verify_code_success(client):
    """
    Позитивный тест: успешная проверка кода подтверждения
    
    Сценарий:
    - Пользователь отправляет правильный код для существующей сессии
    - Сессия не истекла
    
    Ожидаемое поведение:
    - HTTP статус 200 (OK)
    - В ответе verified=True
    - В ответе присутствует номер телефона
    """
    # Очищаем словарь сессий перед тестом
    verification_sessions.clear()
    
    # Создаем тестовую сессию с валидным кодом
    session_id = "session_ok"
    verification_sessions[session_id] = {
        "phone": "+79991234567",
        "code": "1234",
        "method": "sms",
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=5),  # Сессия действительна 5 минут
    }
    
    # Отправляем POST запрос с правильным кодом
    response = client.post(
        "/api/auth/verify-code",
        json={"session_id": session_id, "code": "1234"},
    )
    
    # Проверяем успешный статус ответа
    assert response.status_code == 200
    
    # Парсим JSON ответ
    data = response.get_json()
    
    # Проверяем, что код подтвержден
    assert data.get("verified") is True
    
    # Проверяем, что в ответе есть номер телефона
    assert data.get("phone") == "+79991234567"


def test_verify_code_missing_parameters(client):
    """
    Негативный тест: отсутствие обязательных параметров в запросе
    
    Сценарий:
    - Пользователь отправляет запрос без session_id или code
    
    Ожидаемое поведение:
    - HTTP статус 400 (Bad Request)
    - В ответе есть сообщение об ошибке
    """
    # Отправляем POST запрос без обязательных параметров
    response = client.post("/api/auth/verify-code", json={})
    
    # Проверяем статус ошибки
    assert response.status_code == 400
    
    # Парсим JSON ответ
    data = response.get_json()
    
    # Проверяем, что в ответе есть описание ошибки
    assert "error" in data


def test_verify_code_session_not_found(client):
    """
    Негативный тест: проверка кода для несуществующей сессии
    
    Сценарий:
    - Пользователь отправляет код для сессии, которой не существует
    - Возможно, сессия была удалена или никогда не создавалась
    
    Ожидаемое поведение:
    - HTTP статус 404 (Not Found)
    - В ответе есть сообщение об ошибке
    """
    # Очищаем словарь сессий (сессия не существует)
    verification_sessions.clear()
    
    # Отправляем POST запрос с несуществующим session_id
    response = client.post(
        "/api/auth/verify-code",
        json={"session_id": "unknown", "code": "1234"},
    )
    
    # Проверяем статус ошибки
    assert response.status_code == 404
    
    # Парсим JSON ответ
    data = response.get_json()
    
    # Проверяем, что в ответе есть описание ошибки
    assert "error" in data


def test_verify_code_expired(client):
    """
    Негативный тест: проверка истекшего кода подтверждения
    
    Сценарий:
    - Пользователь пытается использовать код после истечения срока действия сессии
    - expires_at находится в прошлом
    
    Ожидаемое поведение:
    - HTTP статус 400 (Bad Request)
    - В ответе есть сообщение о том, что код истек
    """
    # Очищаем словарь сессий перед тестом
    verification_sessions.clear()
    
    # Создаем сессию с истекшим сроком действия
    session_id = "session_expired"
    verification_sessions[session_id] = {
        "phone": "+79991234567",
        "code": "1234",
        "method": "sms",
        "created_at": datetime.utcnow() - timedelta(minutes=10),  # Создана 10 минут назад
        "expires_at": datetime.utcnow() - timedelta(minutes=5),    # Истекла 5 минут назад
    }
    
    # Отправляем POST запрос с кодом для истекшей сессии
    response = client.post(
        "/api/auth/verify-code",
        json={"session_id": session_id, "code": "1234"},
    )
    
    # Проверяем статус ошибки
    assert response.status_code == 400
    
    # Парсим JSON ответ
    data = response.get_json()
    
    # Проверяем, что в ответе есть сообщение об истечении кода
    assert "Код истек" in data.get("error", "")


def test_verify_code_wrong_code(client):
    """
    Негативный тест: проверка неправильного кода подтверждения
    
    Сценарий:
    - Пользователь отправляет код, который не соответствует сохраненному в сессии
    - Возможно, опечатка или попытка подбора кода
    
    Ожидаемое поведение:
    - HTTP статус 400 (Bad Request)
    - В ответе есть сообщение о неверном коде
    """
    # Очищаем словарь сессий перед тестом
    verification_sessions.clear()
    
    # Создаем тестовую сессию с кодом "1234"
    session_id = "session_wrong_code"
    verification_sessions[session_id] = {
        "phone": "+79991234567",
        "code": "1234",  # Правильный код
        "method": "sms",
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=5),  # Сессия действительна
    }
    
    # Отправляем POST запрос с неправильным кодом "0000"
    response = client.post(
        "/api/auth/verify-code",
        json={"session_id": session_id, "code": "0000"},  # Неправильный код
    )
    
    # Проверяем статус ошибки
    assert response.status_code == 400
    
    # Парсим JSON ответ
    data = response.get_json()
    
    # Проверяем, что в ответе есть сообщение о неверном коде
    assert "Неверный код" in data.get("error", "")

