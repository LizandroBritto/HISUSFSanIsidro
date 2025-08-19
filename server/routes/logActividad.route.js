const express = require("express");
const router = express.Router();
const {
  obtenerLogs,
  obtenerEstadisticas,
  obtenerLogPorId,
  descargarLogsExcel,
} = require("../controllers/logActividad.controller");
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

// Solo administradores pueden acceder a los logs
router.use(requireAdmin);

// GET /api/logs - Obtener todos los logs con filtros y paginación
router.get("/", obtenerLogs);

// GET /api/logs/estadisticas - Obtener estadísticas de actividad
router.get("/estadisticas", obtenerEstadisticas);

// GET /api/logs/descargar-excel - Descargar logs en Excel
router.get("/descargar-excel", descargarLogsExcel);

// GET /api/logs/:id - Obtener log específico por ID
router.get("/:id", obtenerLogPorId);

module.exports = router;
