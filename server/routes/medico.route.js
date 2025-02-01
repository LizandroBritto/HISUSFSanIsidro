const express = require("express");
const { authenticate } = require("../middleware/auth.middleware"); // Importa el middleware

const MedicoController = require("../controllers/medico.controller"); 
const MedicoRouter = express.Router();

MedicoRouter.get("/", authenticate, MedicoController.getAllMedicos); // Ruta protegida

MedicoRouter.get("/:id", authenticate, MedicoController.getOneMedico); // Ruta protegida

MedicoRouter.post("/new", authenticate, MedicoController.createMedico); // Ruta protegida

MedicoRouter.put("/:id", authenticate, MedicoController.updateOneMedicoById); // Ruta protegida

MedicoRouter.delete("/:id", authenticate, MedicoController.deleteOneMedicoById); // Ruta protegida

MedicoRouter.get("/especialidad/:especialidad", authenticate, MedicoController.findByEspecialidad);  // Ruta protegida

module.exports = MedicoRouter;