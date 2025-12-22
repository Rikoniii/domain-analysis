# Настройка SMS и звонков для подтверждения телефона

## 📖 Как мы это сделали и зачем?

Мы реализовали систему подтверждения телефона через SMS или звонок. В режиме разработки код просто выводится в консоль, что позволяет тестировать без реальных затрат на SMS.

**Почему именно так?**
- **Режим разработки** - код в консоли позволяет быстро тестировать функционал без настройки SMS-сервисов
- **Гибкость** - легко переключиться на реальный SMS-сервис через переменные окружения
- **Безопасность** - код подтверждения генерируется на сервере, имеет срок действия

**Как это работает?** При запросе кода сервер генерирует случайный 4-значный код, сохраняет его в сессии с временем жизни, и отправляет пользователю (в разработке - выводит в консоль).

Этот документ описывает, как настроить отправку SMS и звонков для подтверждения телефона при регистрации и входе в личный кабинет.

## Текущее состояние (режим разработки)

В текущей реализации код подтверждения просто выводится в консоль сервера. Это удобно для разработки и тестирования.

### Для тестирования

1. Запустите backend сервер:
   ```bash
   cd backend
   python app.py
   ```

2. При регистрации или входе код будет выведен в консоль:
   ```
   [AUTH] Code for 74951234567: 1234 (method: sms)
   ```

3. Введите этот код в форму на фронтенде.

## Настройка для продакшена

### Вариант 1: SMS.ru (рекомендуется для России)

SMS.ru - популярный сервис для отправки SMS в России с простым API.

#### Установка

```bash
pip install smsru
```

#### Настройка

1. Зарегистрируйтесь на [sms.ru](https://sms.ru/)
2. Получите API ID в личном кабинете
3. Добавьте в `backend/app.py`:

```python
import smsru

# Конфигурация SMS.ru
SMSRU_API_ID = os.getenv('SMSRU_API_ID', '')

def send_sms_via_smsru(phone: str, code: str) -> bool:
    """Отправить SMS через SMS.ru"""
    try:
        client = smsru.SmsRu(SMSRU_API_ID)
        response = client.send_one(phone, f'Ваш код подтверждения: {code}')
        return response.status_code == 200
    except Exception as e:
        print(f"[ERROR] SMS.ru error: {e}")
        return False
```

4. Обновите функцию `send_verification_code`:

```python
@app.route('/api/auth/send-code', methods=['POST'])
def send_verification_code():
    # ... существующий код ...
    
    if method == 'sms':
        if SMSRU_API_ID:
            send_sms_via_smsru(normalized_phone, code)
        else:
            print(f"[AUTH] Code for {normalized_phone}: {code} (method: sms)")
    # ...
```

5. Установите переменную окружения:
   ```bash
   export SMSRU_API_ID="your-api-id-here"
   ```

#### Стоимость
- ~2-3 рубля за SMS в России
- Есть бесплатный тестовый режим

---

### Вариант 2: Twilio (международный)

Twilio - популярный международный сервис для SMS и звонков.

#### Установка

```bash
pip install twilio
```

#### Настройка

1. Зарегистрируйтесь на [twilio.com](https://www.twilio.com/)
2. Получите Account SID и Auth Token
3. Получите номер телефона для отправки SMS/звонков
4. Добавьте в `backend/app.py`:

```python
from twilio.rest import Client

# Конфигурация Twilio
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')

def send_sms_via_twilio(phone: str, code: str) -> bool:
    """Отправить SMS через Twilio"""
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f'Ваш код подтверждения: {code}',
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )
        return message.status in ['queued', 'sent']
    except Exception as e:
        print(f"[ERROR] Twilio error: {e}")
        return False

def make_call_via_twilio(phone: str, code: str) -> bool:
    """Совершить звонок через Twilio"""
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        # Используйте TwiML для произнесения кода
        call = client.calls.create(
            url=f'https://your-server.com/twiml/voice?code={code}',
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )
        return call.status in ['queued', 'ringing', 'in-progress']
    except Exception as e:
        print(f"[ERROR] Twilio call error: {e}")
        return False
```

5. Создайте TwiML endpoint для звонков (в `app.py`):

```python
@app.route('/twiml/voice', methods=['GET'])
def twiml_voice():
    """TwiML для голосового звонка с кодом"""
    code = request.args.get('code', '')
    # Разбиваем код на цифры для произнесения
    code_digits = ' '.join(list(code))
    
    twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say language="ru-RU">Ваш код подтверждения: {code_digits}</Say>
        <Pause length="2"/>
        <Say language="ru-RU">Повторяю: {code_digits}</Say>
    </Response>'''
    
    return Response(twiml, mimetype='text/xml')
```

6. Установите переменные окружения:
   ```bash
   export TWILIO_ACCOUNT_SID="your-account-sid"
   export TWILIO_AUTH_TOKEN="your-auth-token"
   export TWILIO_PHONE_NUMBER="+1234567890"
   ```

#### Стоимость
- ~$0.0075 за SMS в США
- ~$0.013 за минуту звонка
- Есть бесплатный trial с $15 кредитами

---

### Вариант 3: smsc.ru

smsc.ru - еще один популярный сервис для России.

#### Установка

```bash
pip install requests
```

#### Настройка

1. Зарегистрируйтесь на [smsc.ru](https://smsc.ru/)
2. Получите логин и пароль
3. Добавьте в `backend/app.py`:

```python
import requests

# Конфигурация SMSC.ru
SMSC_LOGIN = os.getenv('SMSC_LOGIN', '')
SMSC_PASSWORD = os.getenv('SMSC_PASSWORD', '')

def send_sms_via_smsc(phone: str, code: str) -> bool:
    """Отправить SMS через SMSC.ru"""
    try:
        url = 'https://smsc.ru/sys/send.php'
        params = {
            'login': SMSC_LOGIN,
            'psw': SMSC_PASSWORD,
            'phones': phone,
            'mes': f'Ваш код подтверждения: {code}',
            'fmt': 3  # JSON формат
        }
        response = requests.get(url, params=params)
        result = response.json()
        return result.get('error_code') == 0
    except Exception as e:
        print(f"[ERROR] SMSC.ru error: {e}")
        return False
```

4. Установите переменные окружения:
   ```bash
   export SMSC_LOGIN="your-login"
   export SMSC_PASSWORD="your-password"
   ```

---

## Рекомендации

### Для разработки/тестирования
- Используйте текущую реализацию (вывод в консоль)
- Или используйте бесплатные тестовые аккаунты (Twilio trial, SMS.ru тестовый режим)

### Для продакшена в России
- **SMS.ru** - лучший выбор по соотношению цена/качество
- **smsc.ru** - альтернатива с похожим функционалом

### Для международного использования
- **Twilio** - надежный международный сервис

## Безопасность

1. **Никогда не храните API ключи в коде** - используйте переменные окружения
2. **Ограничьте частоту запросов** - добавьте rate limiting для предотвращения спама
3. **Используйте HTTPS** - для защиты данных при передаче
4. **Логируйте попытки** - для мониторинга и отладки

## Пример добавления rate limiting

```python
from functools import wraps
from datetime import datetime, timedelta

# Хранилище для rate limiting (в продакшене использовать Redis)
rate_limit_store = {}

def rate_limit(max_requests=5, period_minutes=15):
    """Декоратор для ограничения частоты запросов"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            phone = kwargs.get('phone') or (args[0] if args else None)
            if not phone:
                return f(*args, **kwargs)
            
            key = f"rate_limit_{phone}"
            now = datetime.utcnow()
            
            if key in rate_limit_store:
                requests, last_reset = rate_limit_store[key]
                if now - last_reset > timedelta(minutes=period_minutes):
                    rate_limit_store[key] = [1, now]
                elif requests >= max_requests:
                    return jsonify({'error': 'Слишком много запросов. Попробуйте позже.'}), 429
                else:
                    rate_limit_store[key][0] += 1
            else:
                rate_limit_store[key] = [1, now]
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

# Использование:
@app.route('/api/auth/send-code', methods=['POST'])
@rate_limit(max_requests=5, period_minutes=15)
def send_verification_code():
    # ...
```

## Интеграция в текущий код

Обновите функцию `send_verification_code` в `backend/app.py`:

```python
@app.route('/api/auth/send-code', methods=['POST'])
def send_verification_code():
    # ... существующий код генерации кода ...
    
    # Отправка SMS или звонка
    if method == 'sms':
        if SMSRU_API_ID:  # или другой сервис
            send_sms_via_smsru(normalized_phone, code)
        else:
            # Режим разработки - вывод в консоль
            print(f"[AUTH] Code for {normalized_phone}: {code} (method: sms)")
    elif method == 'call':
        if TWILIO_ACCOUNT_SID:  # или другой сервис
            make_call_via_twilio(normalized_phone, code)
        else:
            # Режим разработки - вывод в консоль
            print(f"[AUTH] Code for {normalized_phone}: {code} (method: call)")
    
    # ... остальной код ...
```

## Тестирование

После настройки протестируйте:

1. Регистрацию нового пользователя
2. Вход существующего пользователя
3. Оба метода подтверждения (SMS и звонок)
4. Обработку ошибок (неверный код, истекший код)

## Мониторинг

Рекомендуется добавить логирование всех попыток отправки:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# В функции send_verification_code:
logger.info(f"Sending {method} code to {normalized_phone}, session: {session_id}")
```

Это поможет отслеживать использование и выявлять проблемы.

