const express = require("express");
const router = express.Router();
const {
  obtenerSalas,
  obtenerSalaPorId,
  crearSala,
  actualizarSala,
  eliminarSala,
} = require("../controllers/sala.controller");
const { authenticate } = require("../middleware/auth.middleware");

// Middleware para verificar que el usuario sea administrador
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== "administrador") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requieren permisos de administrador.",
    });
  }
  next();
};

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// GET /api/salas - Obtener todas las salas (todos los roles pueden ver)
router.get("/", obtenerSalas);

// GET /api/salas/:id - Obtener sala por ID (todos los roles pueden ver)
router.get("/:id", obtenerSalaPorId);

// Las siguientes rutas requieren permisos de administrador
router.use(requireAdmin);

// POST /api/salas - Crear nueva sala (solo admin)
router.post("/", crearSala);

// PUT /api/salas/:id - Actualizar sala (solo admin)
router.put("/:id", actualizarSala);

// DELETE /api/salas/:id - Eliminar sala (solo admin)
router.delete("/:id", eliminarSala);

module.exports = router;
