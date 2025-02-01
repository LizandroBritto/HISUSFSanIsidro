const express = require("express");
const { authenticate } = require("../middleware/auth.middleware"); 

const EnfermeroController = require("../controllers/enfermero.controller"); 
const EnfermeroRouter = express.Router();

EnfermeroRouter.get("/", authenticate, EnfermeroController.getAllEnfermeros);

EnfermeroRouter.get("/:id", authenticate, EnfermeroController.getOneEnfermero);

EnfermeroRouter.post("/new", authenticate, EnfermeroController.createEnfermero);

EnfermeroRouter.put("/:id", authenticate, EnfermeroController.updateOneEnfermeroById);

EnfermeroRouter.delete("/:id", authenticate, EnfermeroController.deleteOneEnfermeroById);

module.exports = EnfermeroRouter;