const Enfermero = require("../models/enfermero.model");

module.exports = {
  // Obtener todos los enfermeros
  getAllEnfermeros: (req, res) => {
    Enfermero.find()
      .then((enfermeros) => res.json(enfermeros))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Obtener un enfermero por ID
  getOneEnfermero: (req, res) => {
    Enfermero.findById(req.params.id)
      .then((enfermero) => res.json(enfermero))
      .catch((err) => res.status(400).json("Error: " + err));
  },
  getEnfermeroByUsuarioId: async (req, res) => {
    try {
      const enfermero = await Enfermero.findOne({ usuario: req.params.id });
      if (!enfermero)
        return res.status(404).json({ error: "Enfermero no encontrado" });
      res.json(enfermero);
    } catch (err) {
      res.status(400).json("Error: " + err);
    }
  },
  // Crear un nuevo enfermero
  createEnfermero: (req, res) => {
    const nuevoEnfermero = new Enfermero(req.body);

    nuevoEnfermero
      .save()
      .then(() => res.json("Enfermero agregado!"))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Actualizar un enfermero
  updateOneEnfermeroById: (req, res) => {
    Enfermero.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .then((enfermero) => res.json(enfermero))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Eliminar un enfermero
  deleteOneEnfermeroById: (req, res) => {
    Enfermero.findByIdAndDelete(req.params.id)
      .then(() => res.json("Enfermero eliminado."))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Obtener indicadores globales para enfermeros
  obtenerIndicadoresGlobales: async (req, res) => {
    try {
      const usuario = req.user;
      console.log("Usuario en obtenerIndicadoresGlobales:", {
        _id: usuario?._id,
        rol: usuario?.rol,
        nombre: usuario?.nombre,
      });

      // Solo enfermeros pueden acceder a estos indicadores
      if (usuario.rol !== "enfermero") {
        console.log("Acceso denegado. Rol del usuario:", usuario.rol);
        return res.status(403).json({
          success: false,
          message: "Solo los enfermeros pueden acceder a estos indicadores",
        });
      }

      // Obtener fechas para los cálculos
      const ahora = new Date();
      const hoy = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
      );
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo de esta semana
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

      const Cita = require("../models/cita.model");

      // Obtener indicadores globales del sistema
      const [
        pacientesAtendidosHoy,
        pacientesAtendidosSemana,
        pacientesAtendidosMes,
        citasPendientes,
        citasCanceladas,
      ] = await Promise.all([
        // Pacientes atendidos hoy (citas confirmadas de hoy) - GLOBAL
        Cita.countDocuments({
          fecha: {
            $gte: hoy,
            $lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000),
          },
          estado: "confirmada",
        }),

        // Pacientes atendidos esta semana (citas confirmadas de esta semana) - GLOBAL
        Cita.countDocuments({
          fecha: { $gte: inicioSemana, $lte: ahora },
          estado: "confirmada",
        }),

        // Pacientes atendidos este mes (citas confirmadas de este mes) - GLOBAL
        Cita.countDocuments({
          fecha: { $gte: inicioMes, $lte: ahora },
          estado: "confirmada",
        }),

        // Citas pendientes (todas las pendientes del sistema) - GLOBAL
        Cita.countDocuments({
          estado: "pendiente",
        }),

        // Citas canceladas (total de canceladas del sistema) - GLOBAL
        Cita.countDocuments({
          estado: "cancelada",
        }),
      ]);

      const indicadores = {
        pacientesAtendidosHoy,
        pacientesAtendidosSemana,
        pacientesAtendidosMes,
        citasPendientes,
        citasCanceladas,
      };

      res.json(indicadores);
    } catch (error) {
      console.error("Error al obtener indicadores globales:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener los indicadores globales",
        error: error.message,
      });
    }
  },
};
