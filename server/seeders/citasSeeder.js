require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const Cita = require("../models/cita.model");
const Paciente = require("../models/paciente.model");
const Medico = require("../models/medico.model");
const Usuario = require("../models/usuario.model");
const Especialidad = require("../models/especialidad.model");

// Configuración de la base de datos
const db_name = process.env.DB_NAME || "USFDATABASE";

// Arrays de datos médicos realistas
const tiposEstudios = [
  "Análisis de sangre completo",
  "Radiografía de tórax",
  "Electrocardiograma",
  "Ecografía abdominal",
  "Resonancia magnética",
  "Tomografía computarizada",
  "Análisis de orina",
  "Endoscopia digestiva",
  "Mamografía",
  "Densitometría ósea",
  "Prueba de esfuerzo",
  "Holter cardíaco",
  "Ecocardiograma",
  "Colonoscopia",
  "Biopsia",
  "Análisis hormonal",
  "Cultivo bacteriano",
  "Pruebas de función hepática",
  "Perfil lipídico",
  "Hemoglobina glicosilada",
];

const observacionesMedicas = [
  "Paciente presenta síntomas leves, se recomienda reposo",
  "Control rutinario, paciente en buen estado general",
  "Seguimiento post-operatorio satisfactorio",
  "Paciente refiere mejoría en los síntomas",
  "Se solicitan estudios complementarios",
  "Tratamiento farmacológico bien tolerado",
  "Paciente requiere seguimiento especializado",
  "Síntomas estables, continuar con medicación actual",
  "Se observa evolución favorable del cuadro",
  "Paciente presenta signos de recuperación",
  "Control de presión arterial dentro de parámetros normales",
  "Evaluación pre-quirúrgica completa",
  "Seguimiento de tratamiento crónico",
  "Paciente asintomático en la consulta",
  "Se programa nueva cita de control en 30 días",
];

// Función para generar presión arterial realista
const generarPresionArterial = () => {
  const sistolica = faker.number.int({ min: 100, max: 180 });
  const diastolica = faker.number.int({ min: 60, max: 110 });
  return `${sistolica}/${diastolica}`;
};

// Función para generar temperatura realista
const generarTemperatura = () => {
  const temp = faker.number.float({ min: 36.0, max: 39.5, fractionDigits: 1 });
  return `${temp}°C`;
};

// Función para generar horas de citas realistas
const generarHoraCita = () => {
  const horas = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ];
  return faker.helpers.arrayElement(horas);
};

// Función para generar fecha de cita (últimos 6 meses y próximos 3 meses)
const generarFechaCita = () => {
  const fechaInicio = new Date();
  fechaInicio.setMonth(fechaInicio.getMonth() - 6);

  const fechaFin = new Date();
  fechaFin.setMonth(fechaFin.getMonth() + 3);

  return faker.date.between({ from: fechaInicio, to: fechaFin });
};

const seedCitas = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(`mongodb://localhost/${db_name}`);
    console.log(`🔗 Conectado a la base de datos: ${db_name}`);

    // Verificar si ya existen citas en la base de datos
    const citasExistentes = await Cita.countDocuments();
    console.log(`📊 Citas existentes en la base de datos: ${citasExistentes}`);

    // Obtener todos los pacientes y médicos disponibles
    const pacientes = await Paciente.find({});
    const medicos = await Medico.find({});

    if (pacientes.length === 0) {
      console.log("❌ No se encontraron pacientes en la base de datos.");
      console.log("   Por favor, crea algunos pacientes primero.");
      return;
    }

    if (medicos.length === 0) {
      console.log("❌ No se encontraron médicos en la base de datos.");
      console.log("   Por favor, crea algunos médicos primero.");
      return;
    }

    console.log(`👥 Pacientes disponibles: ${pacientes.length}`);
    console.log(`👨‍⚕️ Médicos disponibles: ${medicos.length}`);

    // Generar 100 citas
    const numerosCitas = 100;
    const citasCreadas = [];

    console.log(`🚀 Iniciando creación de ${numerosCitas} citas...`);

    for (let i = 0; i < numerosCitas; i++) {
      try {
        // Seleccionar paciente y médico aleatorios
        const pacienteAleatorio = faker.helpers.arrayElement(pacientes);
        const medicoAleatorio = faker.helpers.arrayElement(medicos);

        // Generar datos de la cita
        const fecha = generarFechaCita();
        const hora = generarHoraCita();

        // Determinar estado basado en la fecha
        let estado;
        const ahora = new Date();
        if (fecha < ahora) {
          // Citas pasadas: 85% confirmadas, 10% canceladas, 5% pendientes
          const random = Math.random();
          if (random < 0.85) estado = "confirmada";
          else if (random < 0.95) estado = "cancelada";
          else estado = "pendiente";
        } else {
          // Citas futuras: 70% pendientes, 25% confirmadas, 5% canceladas
          const random = Math.random();
          if (random < 0.7) estado = "pendiente";
          else if (random < 0.95) estado = "confirmada";
          else estado = "cancelada";
        }

        // Crear objeto de cita
        const nuevaCita = {
          fecha: fecha,
          hora: hora,
          paciente: pacienteAleatorio._id,
          medico: medicoAleatorio._id,
          estado: estado,
        };

        // Agregar datos médicos solo para citas confirmadas o pasadas
        if (
          estado === "confirmada" ||
          (estado === "pendiente" && fecha < ahora)
        ) {
          // 80% de las citas tienen presión arterial
          if (Math.random() < 0.8) {
            nuevaCita.presionArterial = generarPresionArterial();
          }

          // 70% de las citas tienen temperatura
          if (Math.random() < 0.7) {
            nuevaCita.temperatura = generarTemperatura();
          }

          // 60% de las citas tienen estudios
          if (Math.random() < 0.6) {
            const numEstudios = faker.number.int({ min: 1, max: 3 });
            const estudiosSeleccionados = faker.helpers.arrayElements(
              tiposEstudios,
              numEstudios
            );
            nuevaCita.estudios = estudiosSeleccionados.join(", ");
          }

          // 90% de las citas tienen observaciones
          if (Math.random() < 0.9) {
            nuevaCita.observaciones =
              faker.helpers.arrayElement(observacionesMedicas);
          }
        }

        // Crear la cita
        const cita = new Cita(nuevaCita);
        await cita.save();
        citasCreadas.push(cita);

        // Mostrar progreso cada 20 citas
        if ((i + 1) % 20 === 0) {
          console.log(`   ✅ Creadas ${i + 1}/${numerosCitas} citas...`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error creando cita ${i + 1}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Seeding de citas completado!`);
    console.log(`📈 Estadísticas:`);
    console.log(`   - Total de citas creadas: ${citasCreadas.length}`);

    // Contar por estado
    const estadisticas = {
      pendiente: 0,
      confirmada: 0,
      cancelada: 0,
    };

    citasCreadas.forEach((cita) => {
      estadisticas[cita.estado]++;
    });

    console.log(`   - Pendientes: ${estadisticas.pendiente}`);
    console.log(`   - Confirmadas: ${estadisticas.confirmada}`);
    console.log(`   - Canceladas: ${estadisticas.cancelada}`);

    // Mostrar distribución por médico
    const citasPorMedico = {};
    citasCreadas.forEach((cita) => {
      const medicoId = cita.medico.toString();
      citasPorMedico[medicoId] = (citasPorMedico[medicoId] || 0) + 1;
    });

    console.log(`\n👨‍⚕️ Distribución por médico:`);
    for (const [medicoId, cantidad] of Object.entries(citasPorMedico)) {
      console.log(`   - Médico ID ${medicoId}: ${cantidad} citas`);
    }

    // Mostrar rango de fechas
    const fechas = citasCreadas.map((c) => c.fecha).sort();
    console.log(`\n📅 Rango de fechas:`);
    console.log(`   - Desde: ${fechas[0].toLocaleDateString()}`);
    console.log(
      `   - Hasta: ${fechas[fechas.length - 1].toLocaleDateString()}`
    );
  } catch (error) {
    console.error("❌ Error durante el seeding:", error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log("\n🔌 Conexión cerrada");
    process.exit(0);
  }
};

// Ejecutar el seeder
seedCitas();
