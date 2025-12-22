@echo off
chcp 65001 >nul
title API Server - Port 5000
color 0B

echo ========================================
echo   Flask API сервер для приюта
echo ========================================
echo.

REM ========================================
REM Поиск Python (как в start-server.bat)
REM ========================================
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

REM Если не найден
echo [ОШИБКА] Python не найден в стандартных местах!
echo.
echo Установите Python 3.8+ и добавьте его в PATH
echo или используйте официальный установщик с опцией "Add Python to PATH".
echo.
pause
exit /b 1

:found
echo [OK] Python найден: %PYTHON_CMD%
%PYTHON_CMD% --version

REM Проверяем наличие зависимостей
echo [INFO] Проверка зависимостей...
pip show Flask >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Установка зависимостей...
    %PYTHON_CMD% -m pip install -r backend\requirements.txt
)

REM Запускаем API сервер
echo.
echo [OK] Запуск API сервера...
echo.
cd backend
%PYTHON_CMD% app.py
cd ..

pause

