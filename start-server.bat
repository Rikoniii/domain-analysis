@echo off
REM ========================================
REM Файл: start-server.bat
REM Расположение: C:\Users\User\Desktop\proekt\start-server.bat
REM Назначение: Запуск локального веб-сервера для разработки
REM ========================================
REM
REM ПРОЦЕСС ПОИСКА PYTHON:
REM Скрипт ищет Python в следующем порядке:
REM 1. В системной переменной PATH (команды: python, python3, py)
REM 2. В стандартных путях установки:
REM    - C:\Python39\python.exe
REM    - C:\Python310
REM    - C:\Python311\python.exe
REM    - C:\Python312\python.exe
REM 3. В пользовательских путях:
REM    - %LOCALAPPDATA%\Programs\Python\PythonXX\python.exe
REM    - %APPDATA%\..\Local\Programs\Python\PythonXX\python.exe
REM
REM ИСПОЛЬЗОВАНИЕ СЕРВЕРА:
REM Если найден файл server.py в той же директории, используется улучшенный сервер
REM с отключенным кэшированием CSS/JS. Иначе используется стандартный http.server.
REM ========================================

chcp 65001 >nul
title Local Web Server - Port 8000
color 0A

echo ========================================
echo   Локальный веб-сервер
echo ========================================
echo.
echo [INFO] Поиск Python...

set PYTHON_CMD=

REM Проверяем python в PATH
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
    goto :found
)

REM Проверяем python3
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python3
    goto :found
)

REM Проверяем py launcher (Windows)
py --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
    goto :found
)

REM Проверяем стандартные пути установки Python
if exist "C:\Python39\python.exe" (
    set PYTHON_CMD=C:\Python39\python.exe
    goto :found
)
if exist "C:\Python310\python.exe" (
    set PYTHON_CMD=C:\Python310\python.exe
    goto :found
)
if exist "C:\Python311\python.exe" (
    set PYTHON_CMD=C:\Python311\python.exe
    goto :found
)
if exist "C:\Python312\python.exe" (
    set PYTHON_CMD=C:\Python312\python.exe
    goto :found
)
if exist "%LOCALAPPDATA%\Programs\Python\Python39\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python39\python.exe
    goto :found
)
if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python310\python.exe
    goto :found
)
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
    goto :found
)
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe
    goto :found
)
if exist "%APPDATA%\..\Local\Programs\Python\Python39\python.exe" (
    set PYTHON_CMD=%APPDATA%\..\Local\Programs\Python\Python39\python.exe
    goto :found
)
if exist "%APPDATA%\..\Local\Programs\Python\Python310\python.exe" (
    set PYTHON_CMD=%APPDATA%\..\Local\Programs\Python\Python310\python.exe
    goto :found
)
if exist "%APPDATA%\..\Local\Programs\Python\Python311\python.exe" (
    set PYTHON_CMD=%APPDATA%\..\Local\Programs\Python\Python311\python.exe
    goto :found
)
if exist "%APPDATA%\..\Local\Programs\Python\Python312\python.exe" (
    set PYTHON_CMD=%APPDATA%\..\Local\Programs\Python\Python312\python.exe
    goto :found
)

REM Если не найден
echo [ОШИБКА] Python не найден в стандартных местах!
echo.
echo Попробуйте один из вариантов:
echo.
echo 1. Добавьте Python в PATH системы
echo 2. Используйте PyCharm: Run -^> Edit Configurations -^> + -^> Python
echo 3. Используйте VS Code с расширением "Live Server"
echo 4. Установите Python с https://www.python.org/downloads/
echo    (при установке отметьте "Add Python to PATH")
echo.
pause
exit /b 1

:found
echo [OK] Python найден: %PYTHON_CMD%
%PYTHON_CMD% --version

echo [OK] Python найден
echo.
echo ========================================
echo   Сервер запускается на порту 8000
echo ========================================
echo.
echo ВАЖНО: НЕ ЗАКРЫВАЙТЕ ЭТО ОКНО!
echo Оставьте его открытым, пока работаете с сайтом.
echo.
echo Откройте в браузере:
echo   http://localhost:8000/frontend/
echo   или
echo   http://127.0.0.1:8000/frontend/
echo.
echo Для остановки сервера нажмите Ctrl+C
echo ========================================
echo.

REM ========================================
REM ВЫБОР СЕРВЕРА:
REM Сначала проверяем наличие улучшенного сервера (server.py)
REM Если найден - используем его (отключает кэширование CSS/JS)
REM Если не найден - используем стандартный Python http.server
REM ========================================
if exist "backend\server.py" (
    echo [INFO] Найден улучшенный сервер: backend\server.py
    echo [INFO] Расположение: %CD%\backend\server.py
    echo [INFO] Используется улучшенный сервер с отключенным кэшированием
    echo [INFO] Кэширование CSS/JS отключено для разработки
    echo.
    %PYTHON_CMD% backend\server.py
) else (
    echo [INFO] Файл backend\server.py не найден
    echo [INFO] Используется стандартный сервер Python (http.server)
    echo [WARNING] Рекомендуется использовать backend\server.py для лучшей работы
    echo [WARNING] Стандартный сервер может кэшировать CSS/JS файлы
    echo.
    %PYTHON_CMD% -m http.server 8000
)

echo.
echo ========================================
echo   Сервер остановлен
echo ========================================
pause

