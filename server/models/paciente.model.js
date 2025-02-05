const mongoose = require('mongoose');

const pacienteSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: [true, "El nombre del paciente es requerido"],
    minlength: [3, "El nombre debe tener al menos 3 caracteres"] 
  },
  apellido: { 
    type: String, 
    required: [true, "El apellido del paciente es requerido"],
    minlength: [3, "El apellido debe tener al menos 3 caracteres"] 
  },
  cedula: { 
    type: String, 
    required: [true, "La cédula del paciente es requerida"],
    unique: [true, "Ya existe un paciente con esta cédula"],
    validate: {
      validator: function(v) {
        return /^\d+$/.test(v); // Expresión regular para validar que solo sean números
      },
      message: props => `${props.value} no es una cédula válida!`
    }
  },
  fechaNacimiento: {
    type: Date,
    validate: {
      validator: function(value) {
        return value < new Date(); 
      },
      message: "La fecha de nacimiento debe ser anterior a la fecha actual"
    }
  }, 
  sexo: {
    type: String,
    enum: {
      values: ['Masculino', 'Femenino', 'Otro'],
      message: 'El sexo debe ser Masculino, Femenino u Otro'
    }
  },
  direccion: String,
  telefono: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\d{8,15}$/.test(v); // Solo números, entre 8 y 15 dígitos
      },
      message: props => `${props.value} no es un número de teléfono válido!`
    }
  },
  estadoPaciente: { 
    type: String, 
    enum: {
      values: ['Activo', 'Inactivo'],
      message: 'El estado del paciente debe ser Activo o Inactivo'
    },
    default: 'Activo'
  },
  grupoSanguineo: String,
  alergias: String,
  enfermedadesPreexistentes: String 
});

const Paciente = mongoose.model('Paciente', pacienteSchema);

module.exports = Paciente;