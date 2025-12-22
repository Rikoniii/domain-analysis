@echo off
chcp 65001 >nul
title Проверка базы данных
color 0B

echo ========================================
echo   ПРОВЕРКА БАЗЫ ДАННЫХ
echo ========================================
echo.

REM Поиск Python
set PYTHON_CMD=

python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
    goto :found
)

python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python3
    goto :found
)

py --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=py
    goto :found
)

echo [ОШИБКА] Python не найден!
pause
exit /b 1

:found
echo [OK] Python найден: %PYTHON_CMD%
echo.

REM Запускаем скрипт проверки
cd backend
%PYTHON_CMD% check_db.py
cd ..

echo.
pause

