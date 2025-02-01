const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: [true, 'La fecha de la cita es requerida'],
  },
  hora: {
    type: String,
    required: [true, 'La hora de la cita es requerida'],
  },
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: [true, 'El paciente es requerido']
  },
  medico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medico',
    required: [true, 'El médico es requerido']
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada'],
    default: 'pendiente'
  },
  presionArterial: Number,
  temperatura: Number,
  estudios: String,
  observaciones: String,
});

const Cita = mongoose.model('Cita', citaSchema);

module.exports = Cita;