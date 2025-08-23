# MANUAL DE USUARIO - Sistema HISUSF San Isidro

## 🚀 Acceso al Sistema

### Credenciales por Defecto

Al instalar el sistema, se crea automáticamente un usuario administrador:

- **Usuario (CI):** `12345678`
- **Contraseña:** `admin123`
- **Rol:** Administrador

**⚠️ IMPORTANTE:** Cambiar esta contraseña después del primer acceso por seguridad.

### URL de Acceso

Una vez iniciado el sistema, acceder a: **http://localhost:5173**

---

## 👑 MANUAL DEL ADMINISTRADOR

### Funciones Principales

El administrador tiene acceso completo al sistema y puede gestionar todos los aspectos operativos.

### 🔄 Flujo de Trabajo del Administrador

#### 1. **Primer Acceso y Configuración**

1. Iniciar sesión con credenciales por defecto
2. **Cambiar contraseña** desde el perfil de usuario
3. Acceder al **Dashboard** para ver estadísticas generales del sistema

#### 2. **Gestión de Usuarios del Sistema**

1. **Ir a "Gestión de Usuarios"**
2. **Crear Médicos:**
   - Registrar datos personales del médico
   - Asignar especialidad
   - Asignar sala/consultorio
   - Definir credenciales de acceso
3. **Crear Enfermeros:**
   - Registrar datos personales
   - Definir credenciales de acceso
   - Establecer permisos específicos
4. **Gestionar Usuarios Existentes:**
   - Editar información personal
   - Cambiar estados (activo/inactivo)
   - Resetear contraseñas si es necesario
   - Eliminar usuarios (con precaución)

#### 3. **Configuración del Sistema**

1. **Gestión de Especialidades:**
   - Crear nuevas especialidades médicas
   - Modificar especialidades existentes
   - Asignar médicos a especialidades
2. **Gestión de Salas/Consultorios:**
   - Crear nuevas salas
   - Asignar médicos a salas
   - Gestionar disponibilidad

#### 4. **Supervisión y Reportes**

1. **Dashboard Principal:**
   - Monitorear estadísticas generales
   - Ver resumen de citas del día
   - Verificar indicadores de rendimiento
2. **Reportes Avanzados:**
   - Generar reportes de citas por períodos
   - Exportar datos a Excel
   - Filtrar por médico, especialidad, estado
3. **Auditoría del Sistema:**
   - Revisar logs de actividad
   - Monitorear acciones de usuarios
   - Verificar integridad de datos

---

## 👨‍⚕️ MANUAL DEL MÉDICO

### Funciones Principales

El médico gestiona sus citas asignadas, actualiza historiales médicos y genera reportes de su actividad.

### 🔄 Flujo de Trabajo del Médico

#### 1. **Acceso y Configuración Personal**

1. Iniciar sesión con credenciales proporcionadas por el administrador
2. **Cambiar contraseña** en el primer acceso
3. Verificar datos de perfil (especialidad, sala asignada)

#### 2. **Gestión de Pacientes**

1. **Acceder a "Gestión de Pacientes"**
2. **Consultar Pacientes:**
   - Buscar pacientes por nombre, cédula o código
   - Ver historial médico completo
   - Revisar citas anteriores y tratamientos
3. **Registrar Nuevos Pacientes:** (si tiene permisos)
   - Crear ficha del paciente
   - Registrar datos personales y médicos básicos
   - Establecer historial inicial

#### 3. **Gestión de Citas Médicas**

1. **Ver Agenda Personal:**
   - Acceder a "Mis Citas" o dashboard personal
   - Visualizar citas del día/semana
   - Identificar citas pendientes, confirmadas
2. **Durante la Consulta:**
   - Abrir detalle de la cita
   - **Actualizar Información Médica:**
     - Registrar síntomas presentados
     - Anotar diagnósticos
     - Especificar tratamientos prescritos
   - **Solicitar Estudios:**
     - Indicar estudios complementarios necesarios
     - Radiografías, análisis, etc.
   - **Observaciones Generales:**
     - Registrar notas adicionales
     - Recomendaciones al paciente
     - Próximos seguimientos
3. **Después de la Consulta:**
   - Cambiar estado de cita a "completada"

#### 4. **Seguimiento de Pacientes**

1. **Historial de Paciente:**
   - Revisar evolución en citas anteriores
   - Verificar adherencia a tratamientos
   - Identificar patrones o cambios
2. **Pacientes con Citas:**
   - Ver lista de pacientes asignados
   - Descargar historial médico completo en Excel
   - Preparar consultas revisando antecedentes

#### 5. **Reportes y Estadísticas Personales**

1. **Dashboard Médico:**
   - Ver indicadores personales de rendimiento
   - Número de citas atendidas
   - Tipos de casos más frecuentes
2. **Reportes de Actividad:**
   - Generar reportes de citas por período
   - Exportar datos de pacientes atendidos
   - Análisis de carga de trabajo

---

## 👩‍⚕️ MANUAL DEL ENFERMERO

### Funciones Principales

El enfermero apoya la gestión administrativa, maneja reportes globales y asiste en la coordinación de citas.

### 🔄 Flujo de Trabajo del Enfermero

#### 1. **Acceso y Configuración**

1. Iniciar sesión con credenciales proporcionadas por el administrador
2. **Cambiar contraseña** en el primer acceso
3. Familiarizarse con el dashboard de enfermería

#### 2. **Apoyo en Gestión de Citas**

1. **Programación de Citas:**
   - Acceder a "Gestión de Citas"
   - Crear nuevas citas para pacientes
   - Asignar médico según especialidad requerida
   - Coordinar horarios disponibles
2. **Seguimiento de Citas:**
   - Verificar confirmaciones de citas
   - Contactar pacientes para recordatorios (proceso manual)
   - Actualizar estados según situación
3. **Gestión de Cancelaciones:**
   - Procesar cancelaciones de pacientes
   - Reprogramar citas cuando sea necesario
   - Optimizar agenda de médicos

#### 3. **Soporte Administrativo**

1. **Registro de Pacientes:**

   - Ayudar en registro de nuevos pacientes
   - Verificar completitud de datos
   - Actualizar información de contacto

---

## 🔄 FLUJOS DE TRABAJO INTEGRADOS

### Flujo Completo de Atención al Paciente

1. **Registro Inicial (Admin/Enfermero):**

   - Paciente llega por primera vez
   - Crear ficha en sistema
   - Registrar datos personales y médicos básicos
2. **Programación de Cita (Enfermero):**

   - Verificar disponibilidad de médico
   - Crear cita en sistema
   - Asignar fecha, hora y médico
3. **Preparación de Consulta (Enfermero):**

   - Preparar historial del paciente
   - Verificar confirmación de cita
   - Organizar documentación necesaria
4. **Atención Médica (Médico):**

   - Revisar historial previo
   - Realizar consulta médica
   - Registrar signos vitales
   - Actualizar información clínica
   - Solicitar estudios si necesario
   - Registrar diagnóstico y tratamiento
5. **Seguimiento (Médico/Enfermero):**

   - Programar próxima cita si necesario
   - Actualizar estado de cita actual
   - Registrar indicaciones al paciente
6. **Reportes y Análisis (Admin):**

   - Generar reportes periódicos
   - Analizar estadísticas de atención
   - Evaluar rendimiento del sistema

---

## 📞 Soporte y Ayuda

### Problemas Comunes

- **No puedo iniciar sesión:** Verificar credenciales o contactar administrador
- **No veo mis citas:** Verificar que el médico esté correctamente asignado
- **Error al guardar:** Verificar conexión a internet y completitud de datos
- **No puedo generar reportes:** Verificar permisos de usuario

### Contacto Técnico

Para soporte técnico o problemas del sistema:

- Contactar al administrador del sistema
- Revisar **MANUAL_INSTALACION.md** para problemas técnicos
- Verificar que todos los servicios estén funcionando correctamente

---

**Versión:** 1.0.0
**Sistema:** HISUSF San Isidro
**Fecha:** Agosto 2025
