const Medico = require('../models/medico.model');

module.exports = {
  // Obtener todos los médicos
  getAllMedicos: (req, res) => {
    Medico.find()
      .populate({
        path: 'usuario',
        model: 'Usuario', // Asegurar el nombre correcto del modelo
        select: 'nombre apellido ci rol', // Seleccionar solo campos necesarios
      })
      .then(medicos => {
        // Filtrar médicos con usuario válido
        const medicosValidos = medicos.filter(m => m.usuario !== null);
        res.json(medicosValidos);
      })
      .catch(err => res.status(500).json('Error: ' + err));
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
  getMedicoByUsuarioId: async (req, res) => {
    try {
      const medico = await Medico.findOne({ usuario: req.params.id });
      if (!medico) return res.status(404).json({ error: "Médico no encontrado" });
      res.json(medico);
    } catch (err) {
      res.status(400).json("Error: " + err);
    }
  },
  actualizarSalaMedico: async (req, res) => {
    try {
      const { id } = req.params; // ID del médico (por ejemplo, user._id o el ID de medico)
      const { sala } = req.body; // La nueva sala que se envía en el body
  
      if (!sala || sala.trim() === "") {
        return res.status(400).json({ error: "La sala es requerida" });
      }
  
      const medico = await Medico.findById(id);
      if (!medico) {
        return res.status(404).json({ error: "Médico no encontrado" });
      }
  
      medico.sala = sala;
      await medico.save();
  
      res.status(200).json(medico);
    } catch (error) {
      console.error("Error al actualizar sala del médico:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
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