#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Улучшенный локальный веб-сервер с отключением кэширования для разработки

РАСПОЛОЖЕНИЕ ФАЙЛА:
Этот файл находится в папке backend/, но сервер должен работать из корня проекта
чтобы обслуживать файлы из папки frontend/
"""
import http.server
import socketserver
import os
from datetime import datetime
from urllib.parse import urlparse

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Получаем путь без query параметров для проверки расширения
        path_without_query = self.path.split('?')[0]
        
        # Отключаем кэширование для CSS, JS и HTML файлов при разработке
        if path_without_query.endswith('.css') or path_without_query.endswith('.js') or path_without_query.endswith('.html'):
            # Агрессивное отключение кэширования
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            # Добавляем ETag с текущим временем для принудительного обновления
            import time
            self.send_header('ETag', f'"{int(time.time())}"')
            self.send_header('Last-Modified', datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT'))
        # Для остальных файлов используем обычное кэширование
        else:
            self.send_header('Cache-Control', 'public, max-age=3600')
        
        # Добавляем CORS заголовки для разработки
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        super().end_headers()
    
    def do_GET(self):
        # Переопределяем do_GET для обработки If-None-Match (ETag)
        # Всегда возвращаем 200 вместо 304, чтобы браузер загружал свежий файл
        path_without_query = self.path.split('?')[0]
        if path_without_query.endswith('.css') or path_without_query.endswith('.js') or path_without_query.endswith('.html'):
            # Игнорируем If-None-Match и If-Modified-Since для файлов разработки
            # Это заставляет браузер всегда загружать свежую версию
            if 'If-None-Match' in self.headers:
                del self.headers['If-None-Match']
            if 'If-Modified-Since' in self.headers:
                del self.headers['If-Modified-Since']
        return super().do_GET()
    
    def log_message(self, format, *args):
        """Улучшенное логирование с временными метками и цветами"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        message = format % args
        
        # Определяем тип запроса для цветного вывода
        if message.startswith('"GET'):
            if '.css' in message:
                print(f'[{timestamp}] \033[36m{message}\033[0m')  # Cyan для CSS
            elif '.js' in message:
                print(f'[{timestamp}] \033[33m{message}\033[0m')  # Yellow для JS
            elif '.html' in message:
                print(f'[{timestamp}] \033[32m{message}\033[0m')  # Green для HTML
            elif '.svg' in message or '.png' in message or '.jpg' in message:
                print(f'[{timestamp}] \033[35m{message}\033[0m')  # Magenta для изображений
            else:
                print(f'[{timestamp}] {message}')
        else:
            print(f'[{timestamp}] {message}')

def main():
    # Переходим в корень проекта (на уровень выше backend/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)
    
    Handler = MyHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print("=" * 50)
            print("  Улучшенный локальный веб-сервер")
            print("=" * 50)
            print(f"\n[OK] Сервер запущен на порту {PORT}")
            print(f"\n[INFO] Рабочая директория: {os.getcwd()}")
            print("\n[INFO] Откройте в браузере:")
            print(f"   http://localhost:{PORT}/frontend/")
            print(f"   http://127.0.0.1:{PORT}/frontend/")
            print("\n" + "=" * 50)
            print("  ВАЖНО:")
            print("  - Кэширование CSS/JS отключено")
            print("  - Изменения видны сразу после обновления страницы")
            print("  - Для остановки нажмите Ctrl+C")
            print("=" * 50)
            print("\n[INFO] Логи запросов:\n")
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n" + "=" * 50)
        print("  [INFO] Сервер остановлен")
        print("=" * 50)
    except OSError as e:
        if e.errno == 10048:  # Windows: Адрес уже используется
            print(f"\n[ОШИБКА] Порт {PORT} уже занят!")
            print("\nРешения:")
            print("1. Закройте другое приложение, использующее порт 8000")
            print("2. Или измените PORT в файле server.py")
        else:
            print(f"\n[ОШИБКА] {e}")
        input("\nНажмите Enter для выхода...")

if __name__ == "__main__":
    main()

