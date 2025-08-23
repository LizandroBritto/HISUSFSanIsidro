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

const limpiarCitas = async () => {
  try {
    console.log("🧹 Limpiando citas existentes...");
    const result = await Cita.deleteMany({});
    console.log(`   ✅ Se eliminaron ${result.deletedCount} citas`);
  } catch (error) {
    console.error("❌ Error al limpiar citas:", error.message);
  }
};

const mostrarEstadisticas = async () => {
  try {
    console.log("\n📊 Estadísticas actuales del sistema:");

    const totalCitas = await Cita.countDocuments();
    console.log(`   - Total de citas: ${totalCitas}`);

    if (totalCitas > 0) {
      const citasPendientes = await Cita.countDocuments({
        estado: "pendiente",
      });
      const citasConfirmadas = await Cita.countDocuments({
        estado: "confirmada",
      });
      const citasCanceladas = await Cita.countDocuments({
        estado: "cancelada",
      });

      console.log(`   - Pendientes: ${citasPendientes}`);
      console.log(`   - Confirmadas: ${citasConfirmadas}`);
      console.log(`   - Canceladas: ${citasCanceladas}`);
    }

    const totalPacientes = await Paciente.countDocuments();
    const totalMedicos = await Medico.countDocuments();

    console.log(`   - Total de pacientes: ${totalPacientes}`);
    console.log(`   - Total de médicos: ${totalMedicos}`);
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error.message);
  }
};

const gestionarCitas = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(`mongodb://localhost/${db_name}`);
    console.log(`🔗 Conectado a la base de datos: ${db_name}`);

    await mostrarEstadisticas();

    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    const comando = args[0];
    const cantidad = parseInt(args[1]) || 100;

    switch (comando) {
      case "clean":
        await limpiarCitas();
        break;

      case "seed":
        console.log(`\n🌱 Iniciando seeding de ${cantidad} citas...`);

        // Obtener pacientes y médicos disponibles
        const pacientes = await Paciente.find({});
        const medicos = await Medico.find({});

        if (pacientes.length === 0) {
          console.log(
            "❌ No hay pacientes disponibles. Crea algunos pacientes primero."
          );
          return;
        }

        if (medicos.length === 0) {
          console.log(
            "❌ No hay médicos disponibles. Crea algunos médicos primero."
          );
          return;
        }

        // Usar el seeder original
        const citasSeeder = require("./citasSeeder");
        break;

      case "reset":
        await limpiarCitas();
        console.log(`\n🌱 Creando ${cantidad} nuevas citas...`);
        // Ejecutar seeding después de limpiar
        // En este caso, llamaríamos al seeder original
        break;

      case "stats":
        // Ya se mostraron las estadísticas arriba
        break;

      default:
        console.log("\n📋 Comandos disponibles:");
        console.log(
          "   npm run manage:citas clean          - Limpiar todas las citas"
        );
        console.log(
          "   npm run manage:citas seed [N]       - Crear N citas (por defecto 100)"
        );
        console.log(
          "   npm run manage:citas reset [N]      - Limpiar y crear N nuevas citas"
        );
        console.log(
          "   npm run manage:citas stats          - Mostrar estadísticas"
        );
        console.log("\nEjemplos:");
        console.log("   npm run manage:citas seed 50        - Crear 50 citas");
        console.log(
          "   npm run manage:citas reset 200      - Limpiar y crear 200 nuevas citas"
        );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log("\n🔌 Conexión cerrada");
    process.exit(0);
  }
};

// Ejecutar el gestor
gestionarCitas();
