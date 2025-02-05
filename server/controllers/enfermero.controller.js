const Enfermero = require('../models/enfermero.model');

module.exports = {
  // Obtener todos los enfermeros
  getAllEnfermeros: (req, res) => {
    Enfermero.find()
      .then(enfermeros => res.json(enfermeros))
      .catch(err => res.status(400).json('Error: ' + err));
  },

  // Obtener un enfermero por ID
  getOneEnfermero: (req, res) => {
    Enfermero.findById(req.params.id)
      .then(enfermero => res.json(enfermero))
      .catch(err => res.status(400).json('Error: ' + err));
  },
  getEnfermeroByUsuarioId: async (req, res) => {
    try {
      const enfermero = await Enfermero.findOne({ usuario: req.params.id });
      if (!enfermero) return res.status(404).json({ error: "Enfermero no encontrado" });
      res.json(enfermero);
    } catch (err) {
      res.status(400).json("Error: " + err);
    }
  },
  // Crear un nuevo enfermero
  createEnfermero: (req, res) => {
    const nuevoEnfermero = new Enfermero(req.body);

    nuevoEnfermero.save()
      .then(() => res.json('Enfermero agregado!'))
      .catch(err => res.status(400).json('Error: ' + err));
  },

  // Actualizar un enfermero
  updateOneEnfermeroById: (req, res) => {
    Enfermero.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .then(enfermero => res.json(enfermero))
      .catch(err => res.status(400).json('Error: ' + err));
  },

  // Eliminar un enfermero
  deleteOneEnfermeroById: (req, res) => {
    Enfermero.findByIdAndDelete(req.params.id)
      .then(() => res.json('Enfermero eliminado.'))
      .catch(err => res.status(400).json('Error: ' + err));
  }
};