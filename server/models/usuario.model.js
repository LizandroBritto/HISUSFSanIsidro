const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, "El nombre del usuario es requerido"],
    minlength: [3, "El nombre debe tener al menos 3 caracteres"],
  },
  apellido: {
    type: String,
    required: [true, "El nombre del usuario es requerido"],
    minlength: [3, "El nombre debe tener al menos 3 caracteres"],
  },
  ci: {
    type: String,
    required: [true, "El CI del usuario es requerido"],
    minlength: [7, "El CI debe tener al menos 7 caracteres"],
  },
  contrasena: {
    type: String,
    required: [true, "La contraseña es requerida"],
    minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
  },
  rol: {
    type: String,
    enum: ["administrador", "medico", "enfermero"],
    required: [true, "El rol del usuario es requerido"],
  },
});

// Middleware pre-save para hashear la contraseña antes de guardarla
usuarioSchema.pre("save", async function (next) {
  const usuario = this;
  if (!usuario.isModified("contrasena")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

module.exports = Usuario;
