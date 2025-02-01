const mongoose = require('mongoose');

const enfermeroSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
   area: {
    type: String, // O puedes usar una referencia a un modelo de 'Area' si lo creas
    required: [true, 'El área del enfermero es requerida'],
  },
});

const Enfermero = mongoose.model('Enfermero', enfermeroSchema);

module.exports = Enfermero;