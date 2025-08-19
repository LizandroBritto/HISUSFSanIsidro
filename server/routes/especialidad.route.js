const express = require("express");
const router = express.Router();
const {
  obtenerEspecialidades,
  obtenerEspecialidadPorId,
  crearEspecialidad,
  actualizarEspecialidad,
  eliminarEspecialidad,
} = require("../controllers/especialidad.controller");
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

// GET /api/especialidades - Obtener todas las especialidades (todos los roles pueden ver)
router.get("/", obtenerEspecialidades);

// GET /api/especialidades/:id - Obtener especialidad por ID (todos los roles pueden ver)
router.get("/:id", obtenerEspecialidadPorId);

// Las siguientes rutas requieren permisos de administrador
router.use(requireAdmin);

// POST /api/especialidades - Crear nueva especialidad (solo admin)
router.post("/", crearEspecialidad);

// PUT /api/especialidades/:id - Actualizar especialidad (solo admin)
router.put("/:id", actualizarEspecialidad);

// DELETE /api/especialidades/:id - Eliminar especialidad (solo admin)
router.delete("/:id", eliminarEspecialidad);

module.exports = router;
