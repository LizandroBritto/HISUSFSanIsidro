# Manual de Instalación - Sistema HISUSF San Isidro

## Requisitos del Sistema

### Software Requerido

- **Node.js** versión 18 o superior ([Descargar aquí](https://nodejs.org/))
- **MongoDB** versión 4.4 o superior ([Descargar aquí](https://www.mongodb.com/try/download/community))
- **Git** (opcional, para clonar desde repositorio)
- **Editor de código** recomendado: VS Code

### Requisitos de Hardware

- RAM: Mínimo 4GB (recomendado 8GB)
- Espacio en disco: Mínimo 2GB libres
- Procesador: Dual-core o superior

## Pasos de Instalación

### 1. Descomprimir el Sistema

1. Descomprimir el archivo `SISUSFSanIsidro.zip` en la ubicación deseada
2. Abrir terminal/PowerShell en la carpeta descomprimida

### 2. Verificar Estructura del Proyecto

El proyecto debe tener la siguiente estructura:

```
SISUSFSanIsidro/
├── client/          # Frontend React
├── server/          # Backend Node.js
└── README.md
```

### 3. Configurar Base de Datos

#### Para MongoDB (Configuración Actual)

1. **Instalar MongoDB:**

   - Descargar e instalar MongoDB Community Server
   - Iniciar el servicio MongoDB
   - Por defecto corre en puerto 27017

2. **Verificar conexión:**
   ```bash
   mongosh
   ```
   - Si se conecta correctamente, MongoDB está funcionando

#### Para MySQL (Configuración Alternativa)

Si se desea cambiar a MySQL:

1. **Instalar MySQL:**
   - Descargar e instalar MySQL Server
   - Crear una base de datos llamada `USFDATABASE`
2. **Modificar configuración:**
   - Editar `server/config/mongoose.config.js` para usar MySQL con Sequelize

### 4. Configurar Variables de Entorno

1. **Navegar a la carpeta server:**

   ```bash
   cd server
   ```

2. **Verificar archivo .env:**
   El archivo `.env` debe contener:

   ```env
   DB_NAME=USFDATABASE
   PORT=8000
   SECRET=UrDumb4789@#4@3
   ```

   **⚠️ IMPORTANTE:** Cambiar la variable `SECRET` por una clave secreta segura en producción.

### 5. Instalar Dependencias del Backend

```bash
cd server
npm install
```

**Dependencias principales que se instalarán:**

- express (Framework web)
- mongoose (ODM para MongoDB)
- bcrypt (Hash de contraseñas)
- jsonwebtoken (Autenticación JWT)
- cors (Cross-Origin Resource Sharing)
- exceljs (Generación de reportes Excel)
- @faker-js/faker (Datos de prueba)

### 6. Instalar Dependencias del Frontend

```bash
cd ../client
npm install
```

**Dependencias principales que se instalarán:**

- react (Framework UI)
- vite (Bundler y dev server)
- tailwindcss (Framework CSS)
- flowbite-react (Componentes UI)
- axios (Cliente HTTP)
- formik (Manejo de formularios)
- sweetalert2 (Alertas)

### 7. Configurar Base de Datos Inicial

#### Crear Usuario Administrador

```bash
cd ../server
npm run seed:admin
```

Este comando creará un usuario administrador con:

- **Usuario:** 12345678 (CI)
- **Contraseña:** admin123
- **Rol:** Administrador

#### Generar Datos de Prueba (Opcional)

```bash
# Crear citas de prueba
npm run seed:citas

# Crear logs de actividad de prueba
npm run seed:logs
```

### 8. Ejecutar el Sistema

#### Opción 1: Ejecutar Backend y Frontend por separado

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

El servidor se ejecutará en: http://localhost:8000

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

El frontend se ejecutará en: http://localhost:5173

#### Opción 2: Script de inicio rápido

Crear un archivo `start.bat` (Windows) o `start.sh` (Linux/Mac) en la raíz del proyecto:

**Para Windows (start.bat):**

```batch
@echo off
echo Iniciando Sistema HISUSF San Isidro...
echo.

echo Iniciando Backend...
start cmd /k "cd server && npm run dev"

timeout /t 5

echo Iniciando Frontend...
start cmd /k "cd client && npm run dev"

echo.
echo Sistema iniciado correctamente!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause
```

**Para Linux/Mac (start.sh):**

```bash
#!/bin/bash
echo "Iniciando Sistema HISUSF San Isidro..."
echo

echo "Iniciando Backend..."
cd server && npm run dev &

sleep 5

echo "Iniciando Frontend..."
cd ../client && npm run dev &

echo
echo "Sistema iniciado correctamente!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo
```

### 9. Acceder al Sistema

1. **Abrir navegador web**
2. **Navegar a:** http://localhost:5173
3. **Iniciar sesión con:**
   - Usuario: `12345678`
   - Contraseña: `admin123`

## Configuración Adicional

### Puertos del Sistema

- **Frontend (React):** Puerto 5173
- **Backend (Node.js):** Puerto 8000
- **Base de datos (MongoDB):** Puerto 27017

### Comandos Útiles

#### Backend

```bash
cd server

# Iniciar en modo desarrollo
npm run dev

# Iniciar en producción
npm start

# Crear usuario administrador
npm run seed:admin

# Resetear contraseña admin
npm run reset:admin

# Generar citas de prueba
npm run seed:citas

# Gestionar citas (ver opciones)
npm run manage:citas
```

#### Frontend

```bash
cd client

# Iniciar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview

# Linting del código
npm run lint
```

## Solución de Problemas Comunes

### Error: "MongoDB connection failed"

- **Causa:** MongoDB no está ejecutándose
- **Solución:** Iniciar servicio MongoDB
  - Windows: `net start MongoDB`
  - Linux/Mac: `sudo systemctl start mongod`

### Error: "Port already in use"

- **Causa:** El puerto está siendo usado por otro proceso
- **Solución:**
  - Cambiar puerto en `.env` (backend) o `vite.config.js` (frontend)
  - O cerrar el proceso que usa el puerto

### Error: "Module not found"

- **Causa:** Dependencias no instaladas
- **Solución:** Ejecutar `npm install` en la carpeta correspondiente

### Frontend no se conecta al Backend

- **Causa:** URLs incorrectas o CORS
- **Solución:** Verificar que backend esté en puerto 8000 y frontend configure correctamente axios

### Error de autenticación

- **Causa:** JWT secret o token inválido
- **Solución:**
  - Verificar variable SECRET en `.env`
  - Limpiar localStorage del navegador
  - Reiniciar sesión

## Configuración de Producción

### Variables de Entorno para Producción

```env
DB_NAME=USFDATABASE_PROD
PORT=8000
SECRET=TU_CLAVE_SECRETA_MUY_SEGURA_AQUI
NODE_ENV=production
```

### Build de Producción

```bash
# Frontend
cd client
npm run build

# El build estará en client/dist/

# Backend
cd ../server
npm start
```

### Consideraciones de Seguridad

1. **Cambiar SECRET** en `.env` por una clave segura
2. **Configurar HTTPS** en producción
3. **Configurar firewall** para exponer solo puertos necesarios
4. **Hacer backup regular** de la base de datos
5. **Actualizar dependencias** regularmente

## Funcionalidades del Sistema

### Roles de Usuario

- **Administrador:** Gestión completa del sistema
- **Médico:** Gestión de citas y pacientes asignados
- **Enfermero:** Apoyo en gestión de citas y reportes

### Módulos Principales

- **Dashboard:** Indicadores y estadísticas
- **Gestión de Usuarios:** CRUD de usuarios del sistema
- **Gestión de Pacientes:** Registro y historial médico
- **Gestión de Médicos:** Especialidades y salas
- **Gestión de Citas:** Programación y seguimiento
- **Reportes:** Exportación a Excel con filtros
- **Log de Actividades:** Auditoría del sistema

### Características Técnicas

- **Autenticación JWT** con roles
- **Cifrado bcrypt** para contraseñas
- **Validaciones** frontend y backend
- **Responsive design** con TailwindCSS
- **Reportes Excel** dinámicos
- **Filtros avanzados** por fecha y estado
- **Paginación** en tablas grandes

## Soporte y Contacto

Para soporte técnico o consultas sobre el sistema:

- **Repositorio:** [GitHub - HISUSFSanIsidro](https://github.com/LizandroBritto/HISUSFSanIsidro)
- **Documentación adicional:** Ver README.md en cada módulo

---

**Versión:** 1.0.0  
**Fecha:** Agosto 2025  
**Desarrollado por:** LizandroBritto
