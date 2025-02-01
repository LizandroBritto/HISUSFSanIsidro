const Medico = require('../models/medico.model');

module.exports = {
  // Obtener todos los médicos
  getAllMedicos: (req, res) => {
    Medico.find()
      .populate("usuario") // Esto agrega los datos del usuario (nombre, apellido, etc.)
      .then(medicos => res.json(medicos))
      .catch(err => res.status(400).json('Error: ' + err));
  },

  // Obtener un médico por ID
  getOneMedico: (req, res) => {
    Medico.findById(req.params.id)
      .then(medico => res.json(medico))
      .catch(err => res.status(400).json('Error: ' + err));
  },

  // Crear un nuevo médico
  createMedico: async (req, res) => {
    try {
      const { usuarioId, especialidad, sala } = req.body;

      // Validar que el usuario exista y tenga rol 'medico'
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario || usuario.rol !== 'medico') {
        return res.status(400).json({ error: "Usuario no válido para médico" });
      }

      // Crear médico vinculado al usuario
      const nuevoMedico = new Medico({ 
        usuario: usuarioId, 
        especialidad, 
        sala 
      });
      await nuevoMedico.save();

      res.status(201).json(nuevoMedico);
    } catch (error) {
      res.status(500).json({ error: "Error al crear médico" });
    }
  },

  // Actualizar un médico
  updateOneMedicoById: (req, res) => {
    Medico.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .then(medico => res.json(medico))
      .catch(err => res.status(400).json('Error: ' + err));
  },

  // Eliminar un médico
  deleteOneMedicoById: (req, res) => {
    Medico.findByIdAndDelete(req.params.id)
      .then(() => res.json('Médico eliminado.'))
      .catch(err => res.status(400).json('Error: ' + err));
  },
  findByEspecialidad: (req, res) => {
    const especialidad = req.params.especialidad;

    Medico.find({ especialidad: especialidad })
      .then(medicos => {
        if (medicos.length === 0) {
          return res.status(404).json('No se encontraron médicos con esa especialidad');
        }
        res.json(medicos);
      })
      .catch(err => res.status(400).json('Error: ' + err));
  }
};