const Sala = require("../models/sala.model");
const { crearLogManual } = require("../middleware/logging.middleware");

module.exports = {
  // Obtener todas las salas
  obtenerSalas: async (req, res) => {
    try {
      const { activo } = req.query;
      const filtros = {};

      if (activo !== undefined) {
        filtros.activo = activo === "true";
      }

      const salas = await Sala.find(filtros)
        .populate("creadoPor", "nombre apellido")
        .populate("modificadoPor", "nombre apellido")
        .sort({ numero: 1 });

      res.json({
        success: true,
        data: salas,
      });
    } catch (error) {
      console.error("Error al obtener salas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las salas",
        error: error.message,
      });
    }
  },

  // Obtener sala por ID
  obtenerSalaPorId: async (req, res) => {
    try {
      const sala = await Sala.findById(req.params.id)
        .populate("creadoPor", "nombre apellido")
        .populate("modificadoPor", "nombre apellido");

      if (!sala) {
        return res.status(404).json({
          success: false,
          message: "Sala no encontrada",
        });
      }

      res.json({
        success: true,
        data: sala,
      });
    } catch (error) {
      console.error("Error al obtener sala:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la sala",
        error: error.message,
      });
    }
  },

  // Crear nueva sala
  crearSala: async (req, res) => {
    try {
      console.log("=== CREANDO SALA ===");
      console.log("User from req:", req.user);
      console.log("Body received:", req.body);

      const { numero, nombre, descripcion, capacidad, equipamiento } = req.body;

      // Validar que no exista una sala con el mismo número
      const salaExistente = await Sala.findOne({ numero });
      if (salaExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una sala con ese número",
        });
      }

      const nuevaSala = new Sala({
        numero,
        nombre,
        descripcion,
        capacidad,
        equipamiento: equipamiento || [],
        creadoPor: req.user._id,
      });

      await nuevaSala.save();
      console.log("Sala creada:", nuevaSala._id);

      // Poblar los datos para el log
      const salaCompleta = await Sala.findById(nuevaSala._id).populate(
        "creadoPor",
        "nombre apellido"
      );

      // Crear log
      console.log("Creando log para sala...");
      await crearLogManual(
        req,
        "CREAR_SALA",
        "Sala",
        `Nueva sala creada - Número: ${numero}, Nombre: ${nombre}`,
        {
          entidadId: nuevaSala._id,
          datosDespues: {
            numero: nuevaSala.numero,
            nombre: nuevaSala.nombre,
            descripcion: nuevaSala.descripcion,
            capacidad: nuevaSala.capacidad,
          },
        }
      );

      res.status(201).json({
        success: true,
        message: "Sala creada exitosamente",
        data: salaCompleta,
      });
    } catch (error) {
      console.error("Error al crear sala:", error);
      res.status(400).json({
        success: false,
        message: "Error al crear la sala",
        error: error.message,
      });
    }
  },

  // Actualizar sala
  actualizarSala: async (req, res) => {
    try {
      const { numero, nombre, descripcion, capacidad, equipamiento, activo } =
        req.body;

      // Obtener datos anteriores para el log
      const salaAnterior = await Sala.findById(req.params.id);
      if (!salaAnterior) {
        return res.status(404).json({
          success: false,
          message: "Sala no encontrada",
        });
      }

      // Validar que no exista otra sala con el mismo número
      if (numero && numero !== salaAnterior.numero) {
        const salaExistente = await Sala.findOne({
          numero,
          _id: { $ne: req.params.id },
        });
        if (salaExistente) {
          return res.status(400).json({
            success: false,
            message: "Ya existe una sala con ese número",
          });
        }
      }

      const salaActualizada = await Sala.findByIdAndUpdate(
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
        "EDITAR_SALA",
        "Sala",
        `Sala actualizada - Número: ${salaActualizada.numero}, Nombre: ${salaActualizada.nombre}`,
        {
          entidadId: req.params.id,
          datosAntes: {
            numero: salaAnterior.numero,
            nombre: salaAnterior.nombre,
            descripcion: salaAnterior.descripcion,
            capacidad: salaAnterior.capacidad,
            activo: salaAnterior.activo,
          },
          datosDespues: {
            numero: salaActualizada.numero,
            nombre: salaActualizada.nombre,
            descripcion: salaActualizada.descripcion,
            capacidad: salaActualizada.capacidad,
            activo: salaActualizada.activo,
          },
        }
      );

      res.json({
        success: true,
        message: "Sala actualizada exitosamente",
        data: salaActualizada,
      });
    } catch (error) {
      console.error("Error al actualizar sala:", error);
      res.status(400).json({
        success: false,
        message: "Error al actualizar la sala",
        error: error.message,
      });
    }
  },

  // Eliminar sala (soft delete)
  eliminarSala: async (req, res) => {
    try {
      const sala = await Sala.findById(req.params.id);
      if (!sala) {
        return res.status(404).json({
          success: false,
          message: "Sala no encontrada",
        });
      }

      // Soft delete - marcar como inactiva
      const salaEliminada = await Sala.findByIdAndUpdate(
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
        "ELIMINAR_SALA",
        "Sala",
        `Sala eliminada - Número: ${sala.numero}, Nombre: ${sala.nombre}`,
        {
          entidadId: req.params.id,
          datosAntes: {
            activo: sala.activo,
          },
          datosDespues: {
            activo: false,
          },
        }
      );

      res.json({
        success: true,
        message: "Sala eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar sala:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar la sala",
        error: error.message,
      });
    }
  },
};
