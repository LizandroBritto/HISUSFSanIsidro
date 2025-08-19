const LogActividad = require("../models/logActividad.model");
const Usuario = require("../models/usuario.model");
const xlsx = require("xlsx");

// Función helper para crear logs
const crearLog = async (datos) => {
  try {
    const nuevoLog = new LogActividad(datos);
    await nuevoLog.save();
    return nuevoLog;
  } catch (error) {
    console.error("Error al crear log de actividad:", error);
    // No lanzamos error para que no interrumpa la operación principal
  }
};

// Obtener todos los logs con paginación y filtros
const obtenerLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      accion,
      entidad,
      usuario,
      fechaInicio,
      fechaFin,
      exitoso,
    } = req.query;

    // Construir filtros
    const filtros = {};

    if (accion) filtros.accion = accion;
    if (entidad) filtros.entidad = entidad;
    if (usuario) filtros.usuario = usuario;
    if (exitoso !== undefined && exitoso !== "")
      filtros.exitoso = exitoso === "true";

    // Filtros de fecha
    if (fechaInicio || fechaFin) {
      filtros.createdAt = {};
      if (fechaInicio) {
        filtros.createdAt.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999); // Incluir todo el día
        filtros.createdAt.$lte = fechaFinDate;
      }
    }

    // Opciones de paginación
    const opciones = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }, // Más recientes primero
      populate: {
        path: "usuario",
        select: "nombre apellido ci rol",
      },
    };

    const logs = await LogActividad.paginate(filtros, opciones);

    res.json({
      success: true,
      data: logs.docs,
      pagination: {
        currentPage: logs.page,
        totalPages: logs.totalPages,
        totalDocs: logs.totalDocs,
        limit: logs.limit,
        hasNextPage: logs.hasNextPage,
        hasPrevPage: logs.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error al obtener logs:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener estadísticas de actividad
const obtenerEstadisticas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    // Filtro de fecha por defecto: últimos 30 días
    const filtroFecha = {};
    const fechaLimite = fechaFin ? new Date(fechaFin) : new Date();
    const fechaInicioPorDefecto = fechaInicio
      ? new Date(fechaInicio)
      : new Date(fechaLimite.getTime() - 30 * 24 * 60 * 60 * 1000);

    filtroFecha.createdAt = {
      $gte: fechaInicioPorDefecto,
      $lte: fechaLimite,
    };

    // Estadísticas por acción
    const estadisticasPorAccion = await LogActividad.aggregate([
      { $match: filtroFecha },
      { $group: { _id: "$accion", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Estadísticas por entidad
    const estadisticasPorEntidad = await LogActividad.aggregate([
      { $match: filtroFecha },
      { $group: { _id: "$entidad", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Estadísticas por usuario (top 10)
    const estadisticasPorUsuario = await LogActividad.aggregate([
      { $match: filtroFecha },
      {
        $group: {
          _id: { usuario: "$usuario", nombre: "$usuarioNombre" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Actividad por día (últimos 7 días)
    const actividadPorDia = await LogActividad.aggregate([
      { $match: filtroFecha },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      { $limit: 7 },
    ]);

    // Total de logs en el período
    const totalLogs = await LogActividad.countDocuments(filtroFecha);

    res.json({
      success: true,
      data: {
        totalLogs,
        estadisticasPorAccion,
        estadisticasPorEntidad,
        estadisticasPorUsuario,
        actividadPorDia,
        periodo: {
          inicio: fechaInicioPorDefecto,
          fin: fechaLimite,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Obtener log específico por ID
const obtenerLogPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await LogActividad.findById(id).populate(
      "usuario",
      "nombre apellido ci rol"
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Log no encontrado",
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Error al obtener log:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// Descargar logs en Excel
const descargarLogsExcel = async (req, res) => {
  try {
    const {
      accion,
      entidad,
      usuario,
      fechaInicio,
      fechaFin,
      exitoso,
    } = req.query;

    // Construir filtros (mismo código que obtenerLogs)
    const filtros = {};

    if (accion) filtros.accion = accion;
    if (entidad) filtros.entidad = entidad;
    if (usuario) filtros.usuario = usuario;
    if (exitoso !== undefined && exitoso !== "") filtros.exitoso = exitoso === "true";

    // Filtros de fecha
    if (fechaInicio || fechaFin) {
      filtros.createdAt = {};
      if (fechaInicio) {
        filtros.createdAt.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechaFinDate.setHours(23, 59, 59, 999);
        filtros.createdAt.$lte = fechaFinDate;
      }
    }

    // Obtener TODOS los logs que coincidan con los filtros (sin paginación)
    const logs = await LogActividad.find(filtros)
      .sort({ createdAt: -1 })
      .populate({
        path: "usuario",
        select: "nombre apellido ci rol",
      })
      .lean(); // .lean() para mejor performance

    // Mapear acciones a textos amigables
    const accionesTexto = {
      CREAR_USUARIO: "Crear Usuario",
      EDITAR_USUARIO: "Editar Usuario", 
      ELIMINAR_USUARIO: "Eliminar Usuario",
      LOGIN: "Iniciar Sesión",
      LOGOUT: "Cerrar Sesión",
      CREAR_PACIENTE: "Crear Paciente",
      EDITAR_PACIENTE: "Editar Paciente",
      CREAR_CITA: "Crear Cita",
      EDITAR_CITA: "Editar Cita",
      CANCELAR_CITA: "Cancelar Cita",
      CONFIRMAR_CITA: "Confirmar Cita",
      COMPLETAR_CITA: "Completar Cita"
    };

    // Preparar datos para el Excel
    const datosExcel = logs.map(log => ({
      'Fecha/Hora': log.createdAt ? new Date(log.createdAt).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : '',
      'Usuario': log.usuarioNombre || 'N/A',
      'Rol': log.usuarioRol || 'N/A',
      'Acción': accionesTexto[log.accion] || log.accion,
      'Entidad': log.entidad || 'N/A',
      'Descripción': log.descripcion || 'N/A',
      'Estado': log.exitoso ? 'Exitoso' : 'Error',
      'IP': log.ip || 'N/A',
      'Navegador': log.userAgent || 'N/A',
      'Mensaje de Error': log.errorMessage || ''
    }));

    // Crear libro de trabajo
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(datosExcel);

    // Configurar ancho de columnas
    const columnWidths = [
      { wch: 20 }, // Fecha/Hora
      { wch: 25 }, // Usuario  
      { wch: 15 }, // Rol
      { wch: 20 }, // Acción
      { wch: 15 }, // Entidad
      { wch: 40 }, // Descripción
      { wch: 10 }, // Estado
      { wch: 15 }, // IP
      { wch: 30 }, // Navegador
      { wch: 30 }  // Mensaje de Error
    ];
    worksheet['!cols'] = columnWidths;

    // Agregar hoja al libro
    xlsx.utils.book_append_sheet(workbook, worksheet, "Registro de Actividad");

    // Generar buffer del Excel
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers para descarga
    const fechaActual = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `registro-actividad-${fechaActual}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', excelBuffer.length);

    // Enviar archivo
    res.send(excelBuffer);

  } catch (error) {
    console.error("Error al generar Excel:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar archivo Excel",
      error: error.message,
    });
  }
};

module.exports = {
  crearLog,
  obtenerLogs,
  obtenerEstadisticas,
  obtenerLogPorId,
  descargarLogsExcel,
};
