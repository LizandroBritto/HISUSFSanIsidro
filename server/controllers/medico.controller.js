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

      // Hacer populate para devolver los datos completos
      const medicoCompleto = await Medico.findById(nuevoMedico._id)
        .populate("usuario", "nombre apellido ci rol")
        .populate("especialidad", "nombre descripcion")
        .populate("sala", "numero nombre");

      res.status(201).json(medicoCompleto);
    } catch (error) {
      res.status(500).json({ error: "Error al crear médico" });
    }
  },

  // Actualizar un médico
  updateOneMedicoById: (req, res) => {
    Medico.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("usuario", "nombre apellido ci rol")
      .populate("especialidad", "nombre descripcion")
      .populate("sala", "numero nombre")
      .then((medico) => res.json(medico))
      .catch((err) => res.status(400).json("Error: " + err));
  },
  getMedicoByUsuarioId: async (req, res) => {
    try {
      const medico = await Medico.findOne({ usuario: req.params.id })
        .populate("usuario", "nombre apellido ci rol")
        .populate("especialidad", "nombre")
        .populate("sala", "numero nombre");

      if (!medico) {
        return res.status(404).json({ error: "Médico no encontrado" });
      }

      res.json(medico);
    } catch (err) {
      console.error("Error al buscar médico por usuario:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
  actualizarSalaMedico: async (req, res) => {
    try {
      const { id } = req.params; // ID del médico (por ejemplo, user._id o el ID de medico)
      const { sala } = req.body; // La nueva sala que se envía en el body

      if (!sala || sala.trim() === "") {
        return res.status(400).json({ error: "La sala es requerida" });
      }

      const medico = await Medico.findByIdAndUpdate(id, { sala }, { new: true })
        .populate("usuario", "nombre apellido ci rol")
        .populate("especialidad", "nombre descripcion")
        .populate("sala", "numero nombre");

      if (!medico) {
        return res.status(404).json({ error: "Médico no encontrado" });
      }

      res.status(200).json(medico);
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
};
