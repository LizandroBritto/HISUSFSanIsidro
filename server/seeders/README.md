# Seeders del Sistema Hospitalario

Este directorio contiene varios seeders para popular la base de datos con datos de prueba.

## Seeders Disponibles

### 1. Admin Seeder (`adminSeeder.js`)

Crea un usuario administrador por defecto.

```bash
npm run seed:admin
```

**Credenciales del admin:**

- CI: 12345678
- Contraseña: admin123
- Rol: administrador

### 2. Logs Seeder (`crearLogsPrueba.js`)

Genera logs de actividad de prueba para el sistema.

```bash
npm run seed:logs
```

### 3. Citas Seeder (`citasSeeder.js`)

Genera 100 citas médicas usando los pacientes y médicos existentes en la base de datos.

```bash
npm run seed:citas
```

**Características del seeder de citas:**

- Crea 100 citas por defecto
- Usa pacientes y médicos existentes
- Genera fechas desde 6 meses atrás hasta 3 meses en el futuro
- Asigna estados realistas basados en la fecha:
  - Citas pasadas: 85% confirmadas, 10% canceladas, 5% pendientes
  - Citas futuras: 70% pendientes, 25% confirmadas, 5% canceladas
- Incluye datos médicos realistas:
  - Presión arterial (80% de las citas confirmadas)
  - Temperatura (70% de las citas confirmadas)
  - Estudios médicos (60% de las citas confirmadas)
  - Observaciones médicas (90% de las citas confirmadas)

### 4. Gestor de Citas (`manageCitas.js`)

Herramienta avanzada para gestionar las citas en la base de datos.

```bash
# Ver estadísticas actuales
npm run manage:citas stats

# Limpiar todas las citas
npm run manage:citas clean

# Crear nuevas citas (mantiene las existentes)
npm run manage:citas seed [cantidad]

# Limpiar y crear nuevas citas
npm run manage:citas reset [cantidad]

# Ver ayuda
npm run manage:citas
```

**Ejemplos:**

```bash
# Crear 50 citas adicionales
npm run manage:citas seed 50

# Limpiar y crear 200 nuevas citas
npm run manage:citas reset 200

# Ver estadísticas del sistema
npm run manage:citas stats
```

## Datos Generados por el Seeder de Citas

### Tipos de Estudios Médicos

- Análisis de sangre completo
- Radiografía de tórax
- Electrocardiograma
- Ecografía abdominal
- Resonancia magnética
- Tomografía computarizada
- Análisis de orina
- Endoscopia digestiva
- Mamografía
- Densitometría ósea
- Y más...

### Observaciones Médicas de Ejemplo

- "Paciente presenta síntomas leves, se recomienda reposo"
- "Control rutinario, paciente en buen estado general"
- "Seguimiento post-operatorio satisfactorio"
- "Paciente refiere mejoría en los síntomas"
- Y más...

### Horarios de Citas

Las citas se generan en horarios realistas de 8:00 AM a 6:00 PM en intervalos de 30 minutos.

### Signos Vitales

- **Presión arterial:** Rangos realistas entre 100/60 y 180/110
- **Temperatura:** Entre 36.0°C y 39.5°C

## Requisitos Previos

Para usar los seeders de citas, asegúrate de tener:

1. **Pacientes en la base de datos**: Crea algunos pacientes antes de ejecutar el seeder de citas
2. **Médicos en la base de datos**: Crea algunos médicos antes de ejecutar el seeder de citas
3. **Conexión a MongoDB**: Los seeders se conectan a la base de datos local

## Notas Importantes

- Los seeders se conectan automáticamente a MongoDB usando la configuración del archivo `.env`
- El seeder de citas verifica que existan pacientes y médicos antes de crear citas
- Todos los seeders muestran estadísticas detalladas al finalizar
- Los datos generados son completamente aleatorios y realistas
- Los seeders pueden ejecutarse múltiples veces de forma segura

## Solución de Problemas

### Error: No hay pacientes/médicos disponibles

```
❌ No hay pacientes disponibles. Crea algunos pacientes primero.
```

**Solución:** Crea pacientes y médicos en el sistema antes de ejecutar el seeder de citas.

### Error de conexión a la base de datos

Verifica que:

1. MongoDB esté ejecutándose
2. El archivo `.env` tenga la configuración correcta
3. El nombre de la base de datos sea correcto

### Rendimiento

- El seeder de citas procesa aproximadamente 20 citas por segundo
- Se muestran actualizaciones de progreso cada 20 citas creadas
- El proceso completo para 100 citas toma menos de 10 segundos
