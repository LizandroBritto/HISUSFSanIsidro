const mongoose = require('mongoose');

const medicoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true, // Asegúrate de vincular siempre un usuario
  },
  especialidad: {
    type: String,
    required: [true, 'La especialidad del médico es requerida'],
    index: true // Agrega un índice al campo 'especialidad'
  },
  sala: {
    type: Number,
    required: [true, 'La sala del médico es requerida'],
  },
});

const Medico = mongoose.model('Medico', medicoSchema);

module.exports = Medico;