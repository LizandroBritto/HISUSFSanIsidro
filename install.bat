@echo off
title Sistema HISUSF San Isidro - Instalacion
color 0A
echo.
echo ==========================================
echo   SISTEMA HISUSF SAN ISIDRO - SETUP
echo ==========================================
echo.

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo    Descargar desde: https://nodejs.org/
    echo    Reiniciar este script después de instalar
    pause
    exit /b 1
) else (
    echo ✅ Node.js detectado
)

echo.
echo [2/5] Instalando dependencias del backend...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló instalación del backend
    pause
    exit /b 1
)
echo ✅ Backend configurado

echo.
echo [3/5] Instalando dependencias del frontend...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló instalación del frontend
    pause
    exit /b 1
)
echo ✅ Frontend configurado

echo.
echo [4/5] Verificando MongoDB...
mongosh --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB no detectado automáticamente
    echo    Asegurate de que MongoDB esté instalado y ejecutándose
    echo    Descargar desde: https://www.mongodb.com/try/download/community
) else (
    echo ✅ MongoDB detectado
)

echo.
echo [5/5] Creando usuario administrador...
cd ..\server
call npm run seed:admin

echo.
echo ==========================================
echo          INSTALACIÓN COMPLETADA
echo ==========================================
echo.
echo 📋 Credenciales por defecto:
echo    Usuario: 12345678
echo    Contraseña: admin123
echo.
echo 🚀 Para iniciar el sistema ejecutar:
echo    - Opción 1: ejecutar start.bat
echo    - Opción 2: ejecutar start_manual.bat para control individual
echo.
echo ⚠️  IMPORTANTE:
echo    - Cambiar contraseña del admin después del primer login
echo    - Verificar que MongoDB esté ejecutándose
echo    - El sistema usará los puertos 8000 (backend) y 5173 (frontend)
echo.
pause
