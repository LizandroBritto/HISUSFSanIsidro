const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const logActividadSchema = new mongoose.Schema(
  {
    // Usuario que realizó la acción
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    usuarioNombre: {
      type: String,
      required: true, // Guardamos el nombre para evitar lookups constantes
    },
    usuarioRol: {
      type: String,
      required: true,
    },

    // Detalles de la acción
    accion: {
      type: String,
      required: true,
      enum: [
        // Acciones de Usuario
        "CREAR_USUARIO",
        "EDITAR_USUARIO",
        "ELIMINAR_USUARIO",
        "LOGIN",
        "LOGOUT",

        // Acciones de Paciente
        "CREAR_PACIENTE",
        "EDITAR_PACIENTE",
        "ELIMINAR_PACIENTE",

        // Acciones de Cita
        "CREAR_CITA",
        "EDITAR_CITA",
        "CANCELAR_CITA",
        "CONFIRMAR_CITA",
        "COMPLETAR_CITA",

        // Acciones de Médico
        "CREAR_MEDICO",
        "EDITAR_MEDICO",
        "ELIMINAR_MEDICO",
        "CAMBIAR_SALA",
        "CAMBIAR_ESPECIALIDAD",

        // Acciones de Enfermero
        "CREAR_ENFERMERO",
        "EDITAR_ENFERMERO",
        "ELIMINAR_ENFERMERO",
        "CAMBIAR_AREA",

        // Acciones del Sistema
        "BACKUP_DB",
        "RESTORE_DB",
        "CONFIGURACION_SISTEMA",
      ],
    },

    // Entidad afectada
    entidad: {
      type: String,
      required: true,
      enum: ["Usuario", "Paciente", "Cita", "Medico", "Enfermero", "Sistema"],
    },
    entidadId: {
      type: String, // Puede ser ObjectId o un identificador personalizado
      required: false,
    },

    // Detalles de la acción
    descripcion: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // Datos antes y después (para auditoría completa)
    datosAntes: {
      type: mongoose.Schema.Types.Mixed, // JSON flexible
      required: false,
    },
    datosDespues: {
      type: mongoose.Schema.Types.Mixed, // JSON flexible
      required: false,
    },

    // Metadata adicional
    ip: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },

    // Información de sesión
    sesionId: {
      type: String,
      required: false,
    },

    // Resultado de la acción
    exitoso: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

// Índices para mejorar las consultas
logActividadSchema.index({ usuario: 1, createdAt: -1 });
logActividadSchema.index({ entidad: 1, entidadId: 1, createdAt: -1 });
logActividadSchema.index({ accion: 1, createdAt: -1 });
logActividadSchema.index({ createdAt: -1 }); // Para mostrar logs por fecha

// Plugin de paginación
logActividadSchema.plugin(mongoosePaginate);

const LogActividad = mongoose.model("LogActividad", logActividadSchema);

module.exports = LogActividad;
