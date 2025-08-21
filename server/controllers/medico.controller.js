const Medico = require("../models/medico.model");
const Usuario = require("../models/usuario.model");

module.exports = {
  // Obtener todos los médicos
  getAllMedicos: (req, res) => {
    Medico.find()
      .populate({
        path: "usuario",
        model: "Usuario", // Asegurar el nombre correcto del modelo
        select: "nombre apellido ci rol", // Seleccionar solo campos necesarios
      })
      .populate("especialidad", "nombre descripcion")
      .populate("sala", "numero nombre")
      .then((medicos) => {
        // Filtrar médicos con usuario válido
        const medicosValidos = medicos.filter((m) => m.usuario !== null);
        res.json(medicosValidos);
      })
      .catch((err) => res.status(500).json("Error: " + err));
  },

  // Obtener un médico por ID
  getOneMedico: (req, res) => {
    Medico.findById(req.params.id)
      .populate("usuario", "nombre apellido ci rol")
      .populate("especialidad", "nombre descripcion")
      .populate("sala", "numero nombre")
      .then((medico) => res.json(medico))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Crear un nuevo médico
  createMedico: async (req, res) => {
    try {
      const { usuarioId, especialidad, sala } = req.body;

      // Validar que el usuario exista y tenga rol 'medico'
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario || usuario.rol !== "medico") {
        return res.status(400).json({ error: "Usuario no válido para médico" });
      }

      // Crear médico vinculado al usuario
      const nuevoMedico = new Medico({
        usuario: usuarioId,
        especialidad,
        sala,
      });
      await nuevoMedico.save();

      // Obtener el médico con populate para respuesta
      const medicoCompleto = await Medico.findById(nuevoMedico._id)
        .populate("usuario", "nombre apellido ci rol")
        .populate("especialidad", "nombre descripcion")
        .populate("sala", "numero nombre");

      return res.status(201).json({
        message: "Médico creado exitosamente",
        medico: medicoCompleto,
      });
    } catch (error) {
      console.error("Error al crear médico:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "Ya existe un médico con este usuario" });
      }
      return res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    }
  },

  // Actualizar un médico
  updateOneMedicoById: (req, res) => {
    Medico.findByIdAndUpdate(req.params.id, req.body)
      .then(() => res.json("Médico actualizado."))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Obtener médico por ID de usuario
  getMedicoByUsuarioId: async (req, res) => {
    try {
      console.log("🔍 Buscando médico para usuario ID:", req.params.id);
      const medico = await Medico.findOne({ usuario: req.params.id })
        .populate("usuario", "nombre apellido ci rol")
        .populate("especialidad", "nombre descripcion")
        .populate("sala", "numero nombre");

      console.log("👨‍⚕️ Médico encontrado:", medico ? "Sí" : "No");

      if (!medico) {
        return res.status(404).json({ error: "Médico no encontrado" });
      }

      res.json(medico);
    } catch (error) {
      console.error("Error al obtener médico por usuario:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Actualizar solo la sala del médico
  actualizarSalaMedico: async (req, res) => {
    try {
      const { usuarioId } = req.params; // ID del usuario (médico)
      const { sala } = req.body;

      // Buscar el médico por usuario
      const medico = await Medico.findOne({ usuario: usuarioId });
      if (!medico) {
        return res.status(404).json({ error: "Médico no encontrado" });
      }

      // Actualizar la sala
      medico.sala = sala;
      await medico.save();

      // Devolver médico actualizado con populate
      const medicoActualizado = await Medico.findById(medico._id)
        .populate("usuario", "nombre apellido ci rol")
        .populate("especialidad", "nombre descripcion")
        .populate("sala", "numero nombre");

      res.json(medicoActualizado);
    } catch (error) {
      console.error("Error al actualizar sala del médico:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Actualizar estado y sala del médico (para que el médico se auto-gestione)
  actualizarEstadoYSala: async (req, res) => {
    try {
      const { usuarioId } = req.params; // ID del usuario (médico)
      const { estado, sala, forzar } = req.body;

      // Buscar el médico por usuario
      const medico = await Medico.findOne({ usuario: usuarioId });
      if (!medico) {
        return res.status(404).json({ error: "Médico no encontrado" });
      }

      // Si se está cambiando la sala y NO se está forzando, verificar conflictos
      if (sala && sala !== medico.sala.toString() && !forzar) {
        const medicoEnSala = await Medico.findOne({
          sala: sala,
          _id: { $ne: medico._id }, // Excluir el médico actual
        }).populate("usuario", "nombre apellido");

        if (medicoEnSala) {
          return res.status(409).json({
            error: "SALA_OCUPADA",
            message: `La sala ya está asignada al Dr. ${medicoEnSala.usuario.nombre} ${medicoEnSala.usuario.apellido}`,
            medicoExistente: {
              nombre: medicoEnSala.usuario.nombre,
              apellido: medicoEnSala.usuario.apellido,
            },
          });
        }
      }

      // Actualizar campos si se proporcionan
      if (estado) medico.estado = estado;
      if (sala) medico.sala = sala;

      await medico.save();

      // Devolver médico actualizado con populate
      const medicoActualizado = await Medico.findById(medico._id)
        .populate("usuario", "nombre apellido ci rol")
        .populate("especialidad", "nombre descripcion")
        .populate("sala", "numero nombre");

      res.json(medicoActualizado);
    } catch (error) {
      console.error("Error al actualizar estado y sala del médico:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Eliminar un médico
  deleteOneMedicoById: (req, res) => {
    Medico.findByIdAndDelete(req.params.id)
      .then(() => res.json("Médico eliminado."))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  findByEspecialidad: (req, res) => {
    const especialidad = req.params.especialidad;

    Medico.find({ especialidad: especialidad })
      .populate("usuario", "nombre apellido ci rol")
      .populate("especialidad", "nombre descripcion")
      .populate("sala", "numero nombre")
      .then((medicos) => {
        if (medicos.length === 0) {
          return res
            .status(404)
            .json("No se encontraron médicos con esa especialidad");
        }
        res.json(medicos);
      })
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Obtener médicos con estadísticas de citas para enfermeros
  getMedicosConEstadisticas: async (req, res) => {
    try {
      const { estado } = req.query; // Filtro opcional por estado del médico

      // Construir filtro
      const filtro = {};
      if (estado) {
        filtro.estado = estado;
      }

      // Asegurar que el médico tenga un usuario asociado
      filtro.usuario = { $exists: true, $ne: null };

      // Obtener médicos con populate
      const medicosRaw = await Medico.find(filtro)
        .populate("usuario", "nombre apellido ci rol")
        .populate("especialidad", "nombre descripcion")
        .populate("sala", "numero nombre");

      // Filtrar médicos que tengan usuario con nombre y apellido válidos
      const medicos = medicosRaw.filter(
        (medico) =>
          medico.usuario &&
          medico.usuario.nombre &&
          medico.usuario.apellido &&
          medico.usuario.nombre.trim() !== "" &&
          medico.usuario.apellido.trim() !== ""
      );

      // Obtener estadísticas de citas para cada médico usando agregación
      const Cita = require("../models/cita.model");

      const medicosConEstadisticas = await Promise.all(
        medicos.map(async (medico) => {
          const estadisticas = await Cita.aggregate([
            { $match: { medico: medico._id } },
            {
              $group: {
                _id: "$estado",
                count: { $sum: 1 },
              },
            },
          ]);

          // Formatear estadísticas
          const stats = {
            pendientes: 0,
            confirmadas: 0,
            canceladas: 0,
          };

          estadisticas.forEach((stat) => {
            if (stat._id === "pendiente") stats.pendientes = stat.count;
            if (stat._id === "confirmada") stats.confirmadas = stat.count;
            if (stat._id === "cancelada") stats.canceladas = stat.count;
          });

          return {
            ...medico.toObject(),
            estadisticasCitas: stats,
          };
        })
      );

      res.json(medicosConEstadisticas);
    } catch (error) {
      console.error("Error al obtener médicos con estadísticas:", error);
      res
        .status(500)
        .json({ error: "Error al obtener médicos con estadísticas" });
    }
  },
};
