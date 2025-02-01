const Cita = require('../models/cita.model');

module.exports = {
  // Obtener todas las citas
  getAllCitas: (req, res) => {
    Cita.find()
      .populate('paciente') // Obtiene los datos del paciente asociado
      .populate({
        path: 'medico',      // Obtiene los datos del médico
        populate: { path: 'usuario' }  // Y anida el populate del campo "usuario"
      })
      .then(citas => res.json(citas))
      .catch(err => res.status(400).json('Error: ' + err));
  },

  // Obtener una cita por ID
  getOneCita: (req, res) => {
    Cita.findById(req.params.id)
      .populate({
        path: "paciente", // ¡Asegúrate de que el path coincida con tu schema!
        select: "nombre apellido", // Selecciona solo los campos necesarios
      })
      .populate({
        path: "medico",
        populate: { path: "usuario" }, // Para anidar populate del médico
      })
      .then((cita) => res.json(cita))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Crear una nueva cita
  createCita: async (req, res) => {
    try {
      const { doctor, paciente, horario, estado } = req.body;
   
      // Validación 2: Un doctor no puede tener dos citas en el mismo horario
      const citaDoctorExistente = await Cita.findOne({ doctor, horario });
      if (citaDoctorExistente) {
        return res.status(400).json({ error: "El doctor ya tiene una cita en ese mismo horario" });
      }

      // Validación 3: Un paciente no puede tener más de una cita pendiente
      const citaPendientePaciente = await Cita.findOne({ paciente, estado: 'pendiente' });
      if (citaPendientePaciente) {
        return res.status(400).json({ error: "El paciente ya tiene una cita pendiente" });
      }

      // Validación 4: La fecha/hora de la cita debe ser en el futuro
      if (new Date(horario) <= new Date()) {
        return res.status(400).json({ error: "La cita debe tener un horario en el futuro" });
      }

      const nuevaCita = new Cita(req.body);
      await nuevaCita.save();
      return res.status(201).json({ msg: "Cita agregada exitosamente" });
    } catch (error) {
      console.error("Error al crear cita:", error);
      return res.status(400).json({ error: error.message });
    }
  },

  // Actualizar una cita
  updateOneCitaById: async (req, res) => {
    try {
      const { doctor, paciente, horario, estado } = req.body;

      // Si se actualiza el horario o el doctor, validamos que no exista conflicto:
      if (doctor && horario) {
        const citaConflict = await Cita.findOne({ 
          _id: { $ne: req.params.id },  // Excluimos la cita que se está actualizando
          doctor, 
          horario 
        });
        if (citaConflict) {
          return res.status(400).json({ error: "El doctor ya tiene una cita en ese mismo horario" });
        }
      }

      // Si se actualiza el estado a "pendiente", se debe validar que el paciente no tenga otra pendiente
      if (estado === 'pendiente') {
        const citaPendiente = await Cita.findOne({ 
          _id: { $ne: req.params.id },
          paciente, 
          estado: 'pendiente' 
        });
        if (citaPendiente) {
          return res.status(400).json({ error: "El paciente ya tiene una cita pendiente" });
        }
      }

      // Validar que, si se actualiza el horario, sea en el futuro
      if (horario && new Date(horario) <= new Date()) {
        return res.status(400).json({ error: "La cita debe tener un horario en el futuro" });
      }

      // (Opcional) Validar que si se actualiza el doctor o paciente, existan en sus respectivas colecciones.

      const citaActualizada = await Cita.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.json(citaActualizada);
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      return res.status(400).json({ error: error.message });
    }
  },

  // Eliminar una cita
  deleteOneCitaById: (req, res) => {
    Cita.findByIdAndDelete(req.params.id)
      .then(() => res.json('Cita eliminada.'))
      .catch(err => res.status(400).json('Error: ' + err));
  }
};