require("dotenv").config();
const mongoose = require("mongoose");
const { crearLog } = require("../controllers/logActividad.controller");

const db_name = process.env.DB_NAME || "USFDATABASE";

const crearLogsPrueba = async () => {
  try {
    await mongoose.connect(`mongodb://localhost/${db_name}`);
    console.log(`Conectado a la base de datos: ${db_name}`);

    const usuarioAdmin = "679811ce72f29ebe498016b5"; // Tu ID de administrador

    const logsPrueba = [
      {
        usuario: usuarioAdmin,
        usuarioNombre: "admin admin",
        usuarioRol: "administrador",
        accion: "LOGIN",
        entidad: "Usuario",
        entidadId: usuarioAdmin,
        descripcion: "Inicio de sesión del administrador",
        ip: "127.0.0.1",
        exitoso: true,
      },
      {
        usuario: usuarioAdmin,
        usuarioNombre: "admin admin",
        usuarioRol: "administrador",
        accion: "CREAR_PACIENTE",
        entidad: "Paciente",
        descripcion: "Nuevo paciente registrado - Juan Pérez (12345678)",
        ip: "127.0.0.1",
        exitoso: true,
      },
      {
        usuario: usuarioAdmin,
        usuarioNombre: "admin admin",
        usuarioRol: "administrador",
        accion: "CREAR_CITA",
        entidad: "Cita",
        descripcion: "Nueva cita creada para paciente Juan Pérez",
        ip: "127.0.0.1",
        exitoso: true,
      },
      {
        usuario: usuarioAdmin,
        usuarioNombre: "admin admin",
        usuarioRol: "administrador",
        accion: "CONFIRMAR_CITA",
        entidad: "Cita",
        descripcion: "Cita confirmada para paciente Juan Pérez",
        ip: "127.0.0.1",
        exitoso: true,
        datosAntes: { estado: "pendiente" },
        datosDespues: { estado: "confirmada" },
      },
      {
        usuario: usuarioAdmin,
        usuarioNombre: "admin admin",
        usuarioRol: "administrador",
        accion: "CREAR_USUARIO",
        entidad: "Usuario",
        descripcion: "Nuevo usuario creado - Dr. García (medico)",
        ip: "127.0.0.1",
        exitoso: true,
      },
    ];

    for (const logData of logsPrueba) {
      await crearLog(logData);
      console.log(`✅ Log creado: ${logData.accion} - ${logData.descripcion}`);
    }

    console.log("\n🎉 Logs de prueba creados exitosamente!");
    console.log("Ahora puedes ver actividad en el registro de logs.");
  } catch (error) {
    console.error("❌ Error al crear logs de prueba:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Conexión cerrada");
  }
};

crearLogsPrueba();
