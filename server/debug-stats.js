const mongoose = require("mongoose");
require("./config/mongoose.config");

const LogActividad = require("./models/logActividad.model");
const Usuario = require("./models/usuario.model");

async function investigarDatos() {
  try {
    console.log("🔍 INVESTIGANDO DATOS EN LA BASE DE DATOS...\n");

    // 1. Contar usuarios activos reales
    const usuariosActivos = await Usuario.countDocuments();
    console.log("👥 USUARIOS REALES EN LA BD:", usuariosActivos);

    const usuarios = await Usuario.find({}, "nombre apellido rol").lean();
    console.log("📋 Lista de usuarios:");
    usuarios.forEach((u) =>
      console.log("  -", u.nombre, u.apellido, "(", u.rol, ")")
    );

    console.log("\n" + "=".repeat(50) + "\n");

    // 2. Entidades únicas en logs
    const entidadesUnicas = await LogActividad.distinct("entidad");
    console.log("🏢 ENTIDADES ÚNICAS EN LOGS:", entidadesUnicas.length);
    console.log("📋 Lista de entidades:", entidadesUnicas);

    console.log("\n" + "=".repeat(50) + "\n");

    // 3. Estadísticas por entidad (últimos 30 días)
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const estadisticasPorEntidad = await LogActividad.aggregate([
      { $match: { createdAt: { $gte: hace30Dias } } },
      { $group: { _id: "$entidad", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    console.log("📊 ESTADÍSTICAS POR ENTIDAD (últimos 30 días):");
    estadisticasPorEntidad.forEach((stat) =>
      console.log("  -", stat._id, ":", stat.count, "logs")
    );

    console.log("\n" + "=".repeat(50) + "\n");

    // 4. Usuarios únicos en logs (últimos 30 días)
    const usuariosEnLogs = await LogActividad.aggregate([
      { $match: { createdAt: { $gte: hace30Dias } } },
      {
        $group: {
          _id: { usuario: "$usuario", nombre: "$usuarioNombre" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    console.log(
      "👤 USUARIOS EN LOGS (últimos 30 días):",
      usuariosEnLogs.length
    );
    usuariosEnLogs.forEach((stat) =>
      console.log(
        "  -",
        stat._id.nombre || "Sin nombre",
        ":",
        stat.count,
        "actividades"
      )
    );

    console.log("\n" + "=".repeat(50) + "\n");

    // 5. Total de logs
    const totalLogs = await LogActividad.countDocuments({
      createdAt: { $gte: hace30Dias },
    });
    console.log("📝 TOTAL DE LOGS (últimos 30 días):", totalLogs);

    // 6. Últimos 10 logs para ver qué está pasando
    const ultimosLogs = await LogActividad.find({
      createdAt: { $gte: hace30Dias },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("accion entidad usuarioNombre createdAt")
      .lean();

    console.log("\n📅 ÚLTIMOS 10 LOGS:");
    ultimosLogs.forEach((log) => {
      console.log(
        "  -",
        new Date(log.createdAt).toLocaleString(),
        "|",
        log.usuarioNombre || "Sin usuario",
        "|",
        log.accion,
        "|",
        log.entidad
      );
    });

    // 7. Verificar logs de usuarios eliminados
    console.log("\n🗑️ LOGS DE USUARIOS ELIMINADOS:");
    const logsEliminacion = await LogActividad.find({
      accion: "ELIMINAR_USUARIO",
      createdAt: { $gte: hace30Dias },
    })
      .select("usuarioNombre descripcion createdAt")
      .lean();

    logsEliminacion.forEach((log) => {
      console.log(
        "  -",
        new Date(log.createdAt).toLocaleString(),
        "|",
        log.usuarioNombre,
        "|",
        log.descripcion
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

investigarDatos();
