const mongoose = require("mongoose");

const especialidadSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la especialidad es requerido"],
      unique: true,
      trim: true,
      maxlength: [
        100,
        "El nombre de la especialidad no puede exceder 100 caracteres",
      ],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    codigo: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [10, "El código no puede exceder 10 caracteres"],
    },
    activo: {
      type: Boolean,
      default: true,
    },
    duracionConsultaMinutos: {
      type: Number,
      default: 30,
      min: [15, "La duración mínima de consulta es 15 minutos"],
      max: [180, "La duración máxima de consulta es 180 minutos"],
    },
    // Auditoría
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    modificadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
  },
  {
    timestamps: true,
  }
);

// Índices
especialidadSchema.index({ nombre: 1 });
especialidadSchema.index({ codigo: 1 });
especialidadSchema.index({ activo: 1 });

// Middleware para generar código automáticamente si no se proporciona
especialidadSchema.pre("save", function (next) {
  if (!this.codigo && this.nombre) {
    // Generar código basado en las primeras letras del nombre
    this.codigo = this.nombre
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 5);
  }
  next();
});

const Especialidad = mongoose.model("Especialidad", especialidadSchema);

module.exports = Especialidad;
