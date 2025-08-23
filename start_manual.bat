@echo off
title Sistema HISUSF San Isidro - Inicio Manual
color 0C
echo.
echo ==========================================
echo   SISTEMA HISUSF SAN ISIDRO - MANUAL
echo ==========================================
echo.
echo Este script te permite controlar el backend y frontend por separado
echo.

:menu
echo ==========================================
echo Selecciona una opción:
echo.
echo [1] Iniciar Backend (Puerto 8000)
echo [2] Iniciar Frontend (Puerto 5173)  
echo [3] Iniciar Ambos (Automático)
echo [4] Ver Logs del Backend
echo [5] Generar Datos de Prueba
echo [6] Gestionar Base de Datos
echo [7] Ver Estado del Sistema
echo [8] Salir
echo.
set /p choice="Ingresa tu opción (1-8): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto seeders
if "%choice%"=="6" goto database
if "%choice%"=="7" goto status
if "%choice%"=="8" goto exit
goto menu

:backend
echo.
echo 🚀 Iniciando Backend...
start "Backend HISUSF" cmd /k "cd /d %~dp0server && npm run dev"
echo ✅ Backend iniciado en nueva ventana
echo    URL: http://localhost:8000
echo.
pause
goto menu

:frontend
echo.
echo 🎨 Iniciando Frontend...
start "Frontend HISUSF" cmd /k "cd /d %~dp0client && npm run dev"
echo ✅ Frontend iniciado en nueva ventana
echo    URL: http://localhost:5173
echo.
pause
goto menu

:both
echo.
echo 🚀 Iniciando Backend...
start "Backend HISUSF" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 5 /nobreak >nul
echo 🎨 Iniciando Frontend...
start "Frontend HISUSF" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 3 /nobreak >nul
echo ✅ Ambos servicios iniciados
echo    Frontend: http://localhost:5173
echo    Backend: http://localhost:8000
start http://localhost:5173
echo.
pause
goto menu

:logs
echo.
echo 📋 Logs del Backend disponibles en la terminal del backend
echo    Si no hay backend corriendo, iniciando...
cd server
npm run dev
pause
goto menu

:seeders
echo.
echo ==========================================
echo          DATOS DE PRUEBA
echo ==========================================
echo.
echo [1] Crear Usuario Administrador
echo [2] Generar 100 Citas de Prueba
echo [3] Crear Logs de Actividad
echo [4] Limpiar todas las Citas
echo [5] Volver al menú principal
echo.
set /p seedchoice="Selecciona opción (1-5): "

if "%seedchoice%"=="1" (
    cd server
    call npm run seed:admin
    echo.
    echo ✅ Usuario admin creado - Usuario: 12345678 / Contraseña: admin123
    pause
)
if "%seedchoice%"=="2" (
    cd server
    call npm run seed:citas
    pause
)
if "%seedchoice%"=="3" (
    cd server
    call npm run seed:logs
    pause
)
if "%seedchoice%"=="4" (
    cd server
    call npm run manage:citas clean
    pause
)
if "%seedchoice%"=="5" goto menu
goto seeders

:database
echo.
echo ==========================================
echo       GESTIÓN DE BASE DE DATOS
echo ==========================================
echo.
echo [1] Conectar a MongoDB Shell
echo [2] Ver estado de MongoDB
echo [3] Backup de la Base de Datos
echo [4] Volver al menú principal
echo.
set /p dbchoice="Selecciona opción (1-4): "

if "%dbchoice%"=="1" (
    echo Abriendo MongoDB Shell...
    mongosh
    pause
)
if "%dbchoice%"=="2" (
    echo Verificando estado de MongoDB...
    mongosh --eval "db.adminCommand('ping')"
    pause
)
if "%dbchoice%"=="3" (
    echo Creando backup...
    set timestamp=%date:~-4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
    set timestamp=%timestamp: =0%
    mongodump --db USFDATABASE --out backup_%timestamp%
    echo ✅ Backup creado en: backup_%timestamp%
    pause
)
if "%dbchoice%"=="4" goto menu
goto database

:status
echo.
echo ==========================================
echo        ESTADO DEL SISTEMA
echo ==========================================
echo.

REM Verificar Node.js
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js: No instalado
) else (
    echo ✅ Node.js: Instalado
    node --version
)

echo.
echo 🔍 Verificando MongoDB...
mongosh --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB: No detectado
) else (
    echo ✅ MongoDB: Instalado
    mongosh --version
)

echo.
echo 🔍 Verificando dependencias...
if exist "server\node_modules" (
    echo ✅ Backend: Dependencias instaladas
) else (
    echo ❌ Backend: Dependencias NO instaladas
)

if exist "client\node_modules" (
    echo ✅ Frontend: Dependencias instaladas  
) else (
    echo ❌ Frontend: Dependencias NO instaladas
)

echo.
echo 🔍 Verificando puertos...
netstat -an | findstr ":8000 " >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Puerto 8000: En uso (Backend posiblemente corriendo)
) else (
    echo ⚪ Puerto 8000: Libre
)

netstat -an | findstr ":5173 " >nul 2>&1  
if %errorlevel% equ 0 (
    echo ✅ Puerto 5173: En uso (Frontend posiblemente corriendo)
) else (
    echo ⚪ Puerto 5173: Libre
)

echo.
echo 🔍 URLs del sistema:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    MongoDB:  mongodb://localhost:27017

echo.
pause
goto menu

:exit
echo.
echo 👋 Cerrando Sistema HISUSF San Isidro
echo    ¡Hasta luego!
echo.
timeout /t 2 >nul
exit

REM Error handling
:error
echo.
echo ❌ Ha ocurrido un error. Revisa:
echo    1. MongoDB esté ejecutándose
echo    2. Puertos 5173 y 8000 estén libres
echo    3. Dependencias estén instaladas (ejecutar install.bat)
echo.
pause
goto menu
