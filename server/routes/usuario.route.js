const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");

const UsuarioController = require("../controllers/usuario.controller");
const UsuarioRouter = express.Router();

// Rutas protegidas para usuarios
UsuarioRouter.get("/", authenticate, UsuarioController.getAllUsuarios);
UsuarioRouter.get("/:id", authenticate, UsuarioController.getOneUsuario);
UsuarioRouter.post("/new", authenticate, UsuarioController.createUsuario); 
UsuarioRouter.post("/register", UsuarioController.register);
UsuarioRouter.put("/:id", authenticate, UsuarioController.updateOneUsuarioById);
UsuarioRouter.delete("/:id", authenticate, UsuarioController.deleteOneUsuarioById);

// Rutas públicas
UsuarioRouter.post("/login", UsuarioController.login);

module.exports = UsuarioRouter;
