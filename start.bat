@echo off
title Sistema HISUSF San Isidro - Inicio Automatico
color 0B
echo.
echo ==========================================
echo    SISTEMA HISUSF SAN ISIDRO - INICIO
echo ==========================================
echo.

echo ⏳ Verificando dependencias...

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no encontrado. Ejecutar install.bat primero
    pause
    exit /b 1
)

REM Verificar carpetas
if not exist "server\node_modules" (
    echo ❌ Dependencias del backend no instaladas. Ejecutar install.bat
    pause
    exit /b 1
)

if not exist "client\node_modules" (
    echo ❌ Dependencias del frontend no instaladas. Ejecutar install.bat
    pause
    exit /b 1
)

echo ✅ Dependencias verificadas

echo.
echo 🚀 Iniciando Backend (Puerto 8000)...
start "Backend HISUSF" cmd /k "cd /d %~dp0server && npm run dev"

echo ⏳ Esperando inicio del backend...
timeout /t 8 /nobreak >nul

echo.
echo 🎨 Iniciando Frontend (Puerto 5173)...
start "Frontend HISUSF" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ==========================================
echo           SISTEMA INICIADO
echo ==========================================
echo.
echo 🌐 URLs del sistema:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo.
echo 👤 Credenciales por defecto:
echo    Usuario: 12345678
echo    Contraseña: admin123
echo.
echo ⚠️  Notas importantes:
echo    - Dos ventanas de terminal se abrirán automáticamente
echo    - NO cerrar esas ventanas mientras uses el sistema
echo    - Para detener: Ctrl+C en cada ventana o cerrar terminales
echo    - MongoDB debe estar ejecutándose
echo.
echo 🔧 Si hay problemas:
echo    1. Verificar que MongoDB esté corriendo
echo    2. Verificar que los puertos 5173 y 8000 estén libres  
echo    3. Revisar MANUAL_INSTALACION.md
echo.

REM Esperar un poco más y abrir navegador
timeout /t 5 /nobreak >nul
echo 🌐 Abriendo navegador...
start http://localhost:5173

echo.
echo ✅ Sistema listo para usar!
echo.
pause
