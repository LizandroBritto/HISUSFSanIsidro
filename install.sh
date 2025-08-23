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
echo -e "  SISTEMA HISUSF SAN ISIDRO - SETUP"
echo -e "==========================================${NC}"
echo

echo -e "${YELLOW}[1/5] Verificando Node.js...${NC}"
if command -v node &> /dev/null; then
    echo -e "✅ ${GREEN}Node.js detectado: $(node --version)${NC}"
else
    echo -e "❌ ${RED}ERROR: Node.js no está instalado${NC}"
    echo -e "   Descargar desde: https://nodejs.org/"
    echo -e "   Reiniciar este script después de instalar"
    exit 1
fi

echo
echo -e "${YELLOW}[2/5] Instalando dependencias del backend...${NC}"
cd server
if npm install; then
    echo -e "✅ ${GREEN}Backend configurado${NC}"
else
    echo -e "❌ ${RED}ERROR: Falló instalación del backend${NC}"
    exit 1
fi

echo
echo -e "${YELLOW}[3/5] Instalando dependencias del frontend...${NC}"
cd ../client
if npm install; then
    echo -e "✅ ${GREEN}Frontend configurado${NC}"
else
    echo -e "❌ ${RED}ERROR: Falló instalación del frontend${NC}"
    exit 1
fi

echo
echo -e "${YELLOW}[4/5] Verificando MongoDB...${NC}"
if command -v mongosh &> /dev/null; then
    echo -e "✅ ${GREEN}MongoDB detectado: $(mongosh --version)${NC}"
elif command -v mongo &> /dev/null; then
    echo -e "✅ ${GREEN}MongoDB detectado (versión legacy)${NC}"
else
    echo -e "⚠️  ${YELLOW}MongoDB no detectado automáticamente${NC}"
    echo -e "   Asegurate de que MongoDB esté instalado y ejecutándose"
    echo -e "   Descargar desde: https://www.mongodb.com/try/download/community"
fi

echo
echo -e "${YELLOW}[5/5] Creando usuario administrador...${NC}"
cd ../server
npm run seed:admin

echo
echo -e "${CYAN}=========================================="
echo -e "         INSTALACIÓN COMPLETADA"
echo -e "==========================================${NC}"
echo
echo -e "${PURPLE}📋 Credenciales por defecto:${NC}"
echo -e "   Usuario: 12345678"
echo -e "   Contraseña: admin123"
echo
echo -e "${GREEN}🚀 Para iniciar el sistema ejecutar:${NC}"
echo -e "   - Opción 1: ./start.sh"
echo -e "   - Opción 2: ./start_manual.sh para control individual"
echo
echo -e "${RED}⚠️  IMPORTANTE:${NC}"
echo -e "   - Cambiar contraseña del admin después del primer login"
echo -e "   - Verificar que MongoDB esté ejecutándose"
echo -e "   - El sistema usará los puertos 8000 (backend) y 5173 (frontend)"
echo

read -p "Presiona Enter para continuar..."
