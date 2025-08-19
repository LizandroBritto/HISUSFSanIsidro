require("dotenv").config();
const mongoose = require("mongoose");
const Usuario = require("../models/usuario.model");

// Configuración de conexión a MongoDB
const db_name = process.env.DB_NAME || "USFDATABASE";

const seedAdmin = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(`mongodb://localhost/${db_name}`);
    console.log(`Conectado a la base de datos: ${db_name}`);

    // Verificar si ya existe un administrador
    const existingAdmin = await Usuario.findOne({ rol: "administrador" });

    if (existingAdmin) {
      console.log("Ya existe un usuario administrador en la base de datos:");
      console.log(
        `- Nombre: ${existingAdmin.nombre} ${existingAdmin.apellido}`
      );
      console.log(`- CI: ${existingAdmin.ci}`);
      console.log(`- Rol: ${existingAdmin.rol}`);
      return;
    }

    // Crear usuario administrador
    const adminUser = new Usuario({
      nombre: "Admin",
      apellido: "Sistema",
      ci: "12345678",
      contrasena: "admin123",
      rol: "administrador",
    });

    // Guardar en la base de datos
    await adminUser.save();

    console.log("✅ Usuario administrador creado exitosamente:");
    console.log(`- Nombre: ${adminUser.nombre} ${adminUser.apellido}`);
    console.log(`- CI: ${adminUser.ci}`);
    console.log(`- Rol: ${adminUser.rol}`);
    console.log(`- Contraseña: admin123`);
    console.log(
      "\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión"
    );
  } catch (error) {
    console.error("❌ Error al crear el usuario administrador:", error.message);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log("Conexión a la base de datos cerrada");
  }
};

// Ejecutar el seeder
seedAdmin();
