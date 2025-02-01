const Paciente = require("../models/paciente.model");

module.exports = {
  // Obtener todos los pacientes
  getAllPacientes: (req, res) => {
    Paciente.find()
      .then((pacientes) => res.json(pacientes))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Obtener un paciente por ID
  getOnePaciente: (req, res) => {
    Paciente.findById(req.params.id)
      .then((paciente) => res.json(paciente))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Crear un nuevo paciente
  createPaciente: async (req, res) => {
    try {
      const { cedula } = req.body;

      // Validar si la cédula ya existe
      const pacienteExistente = await Paciente.findOne({ cedula });
      if (pacienteExistente) {
        return res
          .status(400)
          .json({ error: "Ya existe un paciente con esta cédula" });
      }

      const nuevoPaciente = new Paciente(req.body);
      await nuevoPaciente.save();

      res.status(201).json({ msg: "Paciente agregado exitosamente!" });
    } catch (error) {
      console.error("Error al crear paciente:", error);
      if (error.name === "ValidationError") {
        const mensajesError = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({ error: mensajesError });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Actualizar un paciente
  updateOnePacienteById: async (req, res) => {
    try {
      const pacienteActualizado = await Paciente.findByIdAndUpdate(req.params.id, req.body, { new: true });
  
      if (!pacienteActualizado) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }
  
      res.json(pacienteActualizado);
    } catch (error) {
      console.error("Error al actualizar paciente:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Eliminar un paciente
  deleteOnePacienteById: (req, res) => {
    Paciente.findByIdAndDelete(req.params.id)
      .then(() => res.json("Paciente eliminado."))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Buscar paciente por número de cédula
  findByCedula: async (req, res) => {
    try {
      const { cedula } = req.params;
  
      if (!/^\d+$/.test(cedula)) {
        return res.status(400).json({ error: "Formato de cédula inválido" });
      }
  
      const paciente = await Paciente.findOne({ cedula });
  
      if (!paciente) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }
  
      res.json(paciente);
    } catch (error) {
      console.error("Error al buscar paciente por cédula:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
};
