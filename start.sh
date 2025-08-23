#!/bin/bash

# Colores para el terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}=========================================="
echo -e "   SISTEMA HISUSF SAN ISIDRO - INICIO"
echo -e "==========================================${NC}"
echo

echo -e "${YELLOW}⏳ Verificando dependencias...${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "❌ ${RED}Node.js no encontrado. Ejecutar ./install.sh primero${NC}"
    exit 1
fi

# Verificar carpetas
if [ ! -d "server/node_modules" ]; then
    echo -e "❌ ${RED}Dependencias del backend no instaladas. Ejecutar ./install.sh${NC}"
    exit 1
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "❌ ${RED}Dependencias del frontend no instaladas. Ejecutar ./install.sh${NC}"
    exit 1
fi

echo -e "✅ ${GREEN}Dependencias verificadas${NC}"

echo
echo -e "${GREEN}🚀 Iniciando Backend (Puerto 8000)...${NC}"

# Detectar terminal disponible
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd server && npm run dev; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -e "cd server && npm run dev; bash" &
elif command -v osascript &> /dev/null; then
    # macOS
    osascript -e "tell app \"Terminal\" to do script \"cd $(pwd)/server && npm run dev\""
else
    echo -e "${YELLOW}No se pudo abrir terminal automáticamente. Ejecuta manualmente:${NC}"
    echo -e "cd server && npm run dev"
fi

echo -e "${YELLOW}⏳ Esperando inicio del backend...${NC}"
sleep 8

echo
echo -e "${BLUE}🎨 Iniciando Frontend (Puerto 5173)...${NC}"

# Detectar terminal disponible para frontend
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd client && npm run dev; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -e "cd client && npm run dev; bash" &
elif command -v osascript &> /dev/null; then
    # macOS
    osascript -e "tell app \"Terminal\" to do script \"cd $(pwd)/client && npm run dev\""
else
    echo -e "${YELLOW}No se pudo abrir terminal automáticamente. Ejecuta manualmente:${NC}"
    echo -e "cd client && npm run dev"
fi

echo
echo -e "${CYAN}=========================================="
echo -e "          SISTEMA INICIADO"
echo -e "==========================================${NC}"
echo
echo -e "${GREEN}🌐 URLs del sistema:${NC}"
echo -e "   Frontend: http://localhost:5173"
echo -e "   Backend:  http://localhost:8000"
echo
echo -e "${PURPLE}👤 Credenciales por defecto:${NC}"
echo -e "   Usuario: 12345678"
echo -e "   Contraseña: admin123"
echo
echo -e "${RED}⚠️  Notas importantes:${NC}"
echo -e "   - Dos ventanas de terminal se abrirán automáticamente"
echo -e "   - NO cerrar esas ventanas mientras uses el sistema"
echo -e "   - Para detener: Ctrl+C en cada ventana"
echo -e "   - MongoDB debe estar ejecutándose"
echo
echo -e "${YELLOW}🔧 Si hay problemas:${NC}"
echo -e "   1. Verificar que MongoDB esté corriendo"
echo -e "   2. Verificar que los puertos 5173 y 8000 estén libres"
echo -e "   3. Revisar MANUAL_INSTALACION.md"
echo

# Esperar y abrir navegador
sleep 5
echo -e "${GREEN}🌐 Abriendo navegador...${NC}"

if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
else
    echo -e "${YELLOW}No se pudo abrir navegador automáticamente.${NC}"
    echo -e "Abrir manualmente: http://localhost:5173"
fi

echo
echo -e "✅ ${GREEN}Sistema listo para usar!${NC}"
echo

read -p "Presiona Enter para continuar..."
