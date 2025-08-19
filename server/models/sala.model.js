const mongoose = require("mongoose");

const salaSchema = new mongoose.Schema(
  {
    numero: {
      type: Number,
      required: [true, "El número de sala es requerido"],
      unique: true,
      min: [1, "El número de sala debe ser mayor a 0"],
    },
    nombre: {
      type: String,
      required: [true, "El nombre de la sala es requerido"],
      trim: true,
      maxlength: [100, "El nombre de la sala no puede exceder 100 caracteres"],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },
    activo: {
      type: Boolean,
      default: true,
    },
    capacidad: {
      type: Number,
      min: [1, "La capacidad debe ser mayor a 0"],
      default: 1,
    },
    equipamiento: [
      {
        type: String,
        trim: true,
      },
    ],
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
salaSchema.index({ numero: 1 });
salaSchema.index({ activo: 1 });

const Sala = mongoose.model("Sala", salaSchema);

module.exports = Sala;
