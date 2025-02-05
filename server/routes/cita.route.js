const express = require("express");
const { authenticate } = require("../middleware/auth.middleware"); 

const CitaController = require("../controllers/cita.controller"); 
const CitaRouter = express.Router();

CitaRouter.get("/", authenticate, CitaController.getAllCitas);

CitaRouter.get("/:id", authenticate, CitaController.getOneCita);

CitaRouter.post("/new", authenticate, CitaController.createCita);

CitaRouter.put("/:id", authenticate, CitaController.updateOneCitaById);

CitaRouter.get("/paciente/:id", CitaController.getCitasByPaciente);

CitaRouter.delete("/:id", authenticate, CitaController.deleteOneCitaById);

module.exports = CitaRouter;