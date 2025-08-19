require("dotenv").config();
const mongoose = require("mongoose");
const Usuario = require("../models/usuario.model");

// Configuración de conexión a MongoDB
const db_name = process.env.DB_NAME || "USFDATABASE";

const resetAdminPassword = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(`mongodb://localhost/${db_name}`);
    console.log(`Conectado a la base de datos: ${db_name}`);

    // Buscar el usuario administrador
    const admin = await Usuario.findOne({ rol: "administrador" });

    if (!admin) {
      console.log(
        "❌ No se encontró ningún usuario administrador en la base de datos"
      );
      console.log("Ejecuta: npm run seed:admin para crear uno");
      return;
    }

    console.log(
      `🔍 Usuario administrador encontrado: ${admin.nombre} ${admin.apellido} (CI: ${admin.ci})`
    );

    // Nueva contraseña
    const nuevaContrasena = "admin123";

    // Actualizar la contraseña
    admin.contrasena = nuevaContrasena;
    await admin.save(); // El middleware pre-save se encargará del hash automáticamente

    console.log("✅ Contraseña del administrador actualizada exitosamente:");
    console.log(`- Nombre: ${admin.nombre} ${admin.apellido}`);
    console.log(`- CI: ${admin.ci}`);
    console.log(`- Nueva contraseña: ${nuevaContrasena}`);
    console.log(
      "\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer inicio de sesión"
    );
  } catch (error) {
    console.error("❌ Error al actualizar la contraseña:", error.message);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log("Conexión a la base de datos cerrada");
  }
};

// Ejecutar el reset de contraseña
resetAdminPassword();
