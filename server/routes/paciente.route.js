const express = require("express");
const { authenticate } = require("../middleware/auth.middleware"); 

const PacienteController = require("../controllers/paciente.controller"); 
const PacientesRouter = express.Router();

PacientesRouter.get("/", authenticate, PacienteController.getAllPacientes);

PacientesRouter.get("/:id", authenticate, PacienteController.getOnePaciente);

PacientesRouter.post("/new", authenticate, PacienteController.createPaciente);

PacientesRouter.put("/:id", authenticate, PacienteController.updateOnePacienteById);

PacientesRouter.delete("/:id", authenticate, PacienteController.deleteOnePacienteById);

PacientesRouter.get("/cedula/:cedula", authenticate, PacienteController.findByCedula); 

module.exports = PacientesRouter;