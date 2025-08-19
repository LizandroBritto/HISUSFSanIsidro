const Especialidad = require("../models/especialidad.model");
const { crearLogManual } = require("../middleware/logging.middleware");

module.exports = {
  // Obtener todas las especialidades
  obtenerEspecialidades: async (req, res) => {
    try {
      const { activo } = req.query;
      const filtros = {};

      if (activo !== undefined) {
        filtros.activo = activo === "true";
      }

      const especialidades = await Especialidad.find(filtros)
        .populate("creadoPor", "nombre apellido")
        .populate("modificadoPor", "nombre apellido")
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: especialidades,
      });
    } catch (error) {
      console.error("Error al obtener especialidades:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las especialidades",
        error: error.message,
      });
    }
  },

  // Obtener especialidad por ID
  obtenerEspecialidadPorId: async (req, res) => {
    try {
      const especialidad = await Especialidad.findById(req.params.id)
        .populate("creadoPor", "nombre apellido")
        .populate("modificadoPor", "nombre apellido");

      if (!especialidad) {
        return res.status(404).json({
          success: false,
          message: "Especialidad no encontrada",
        });
      }

      res.json({
        success: true,
        data: especialidad,
      });
    } catch (error) {
      console.error("Error al obtener especialidad:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la especialidad",
        error: error.message,
      });
    }
  },

  // Crear nueva especialidad
  crearEspecialidad: async (req, res) => {
    try {
      const { nombre, descripcion, codigo, duracionConsultaMinutos } = req.body;

      const nuevaEspecialidad = new Especialidad({
        nombre,
        descripcion,
        codigo,
        duracionConsultaMinutos,
        creadoPor: req.user._id,
      });

      await nuevaEspecialidad.save();

      // Poblar los datos para el log
      const especialidadCompleta = await Especialidad.findById(
        nuevaEspecialidad._id
      ).populate("creadoPor", "nombre apellido");

      // Crear log
      await crearLogManual(
        req,
        "CREAR_ESPECIALIDAD",
        "Especialidad",
        `Nueva especialidad creada - Nombre: ${nombre}, Código: ${especialidadCompleta.codigo}`,
        {
          entidadId: nuevaEspecialidad._id,
          datosDespues: {
            nombre: nuevaEspecialidad.nombre,
            codigo: especialidadCompleta.codigo,
            descripcion: nuevaEspecialidad.descripcion,
            duracionConsultaMinutos: nuevaEspecialidad.duracionConsultaMinutos,
          },
        }
      );

      res.status(201).json({
        success: true,
        message: "Especialidad creada exitosamente",
        data: especialidadCompleta,
      });
    } catch (error) {
      console.error("Error al crear especialidad:", error);
      res.status(400).json({
        success: false,
        message: "Error al crear la especialidad",
        error: error.message,
      });
    }
  },

  // Actualizar especialidad
  actualizarEspecialidad: async (req, res) => {
    try {
      const { nombre, descripcion, codigo, duracionConsultaMinutos, activo } =
        req.body;

      // Obtener datos anteriores para el log
      const especialidadAnterior = await Especialidad.findById(req.params.id);
      if (!especialidadAnterior) {
        return res.status(404).json({
          success: false,
          message: "Especialidad no encontrada",
        });
      }

      const especialidadActualizada = await Especialidad.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          modificadoPor: req.user._id,
        },
        { new: true, runValidators: true }
      )
        .populate("creadoPor", "nombre apellido")
        .populate("modificadoPor", "nombre apellido");

      // Crear log
      await crearLogManual(
        req,
        "EDITAR_ESPECIALIDAD",
        "Especialidad",
        `Especialidad actualizada - Nombre: ${especialidadActualizada.nombre}, Código: ${especialidadActualizada.codigo}`,
        {
          entidadId: req.params.id,
          datosAntes: {
            nombre: especialidadAnterior.nombre,
            codigo: especialidadAnterior.codigo,
            descripcion: especialidadAnterior.descripcion,
            duracionConsultaMinutos:
              especialidadAnterior.duracionConsultaMinutos,
            activo: especialidadAnterior.activo,
          },
          datosDespues: {
            nombre: especialidadActualizada.nombre,
            codigo: especialidadActualizada.codigo,
            descripcion: especialidadActualizada.descripcion,
            duracionConsultaMinutos:
              especialidadActualizada.duracionConsultaMinutos,
            activo: especialidadActualizada.activo,
          },
        }
      );

      res.json({
        success: true,
        message: "Especialidad actualizada exitosamente",
        data: especialidadActualizada,
      });
    } catch (error) {
      console.error("Error al actualizar especialidad:", error);
      res.status(400).json({
        success: false,
        message: "Error al actualizar la especialidad",
        error: error.message,
      });
    }
  },

  // Eliminar especialidad (soft delete)
  eliminarEspecialidad: async (req, res) => {
    try {
      const especialidad = await Especialidad.findById(req.params.id);
      if (!especialidad) {
        return res.status(404).json({
          success: false,
          message: "Especialidad no encontrada",
        });
      }

      // Soft delete - marcar como inactiva
      const especialidadEliminada = await Especialidad.findByIdAndUpdate(
        req.params.id,
        {
          activo: false,
          modificadoPor: req.user._id,
        },
        { new: true }
      );

      // Crear log
      await crearLogManual(
        req,
        "ELIMINAR_ESPECIALIDAD",
        "Especialidad",
        `Especialidad eliminada - Nombre: ${especialidad.nombre}, Código: ${especialidad.codigo}`,
        {
          entidadId: req.params.id,
          datosAntes: {
            activo: especialidad.activo,
          },
          datosDespues: {
            activo: false,
          },
        }
      );

      res.json({
        success: true,
        message: "Especialidad eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar especialidad:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar la especialidad",
        error: error.message,
      });
    }
  },
};
