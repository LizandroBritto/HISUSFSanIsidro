const { crearLog } = require("../controllers/logActividad.controller");

// Middleware para crear logs automáticamente
const logActividad = (accion, entidad, descripcionBase = "") => {
  return async (req, res, next) => {
    // Guardar el método original de res.json
    const originalJson = res.json;

    // Sobrescribir res.json para capturar la respuesta
    res.json = async function (body) {
      try {
        // Solo crear log si la operación fue exitosa (status 2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const usuario = req.user;

          if (usuario) {
            // Construir descripción dinámica
            let descripcion = descripcionBase;

            // Agregar información específica basada en la acción
            if (req.params.id) {
              descripcion += ` ID: ${req.params.id}`;
            }

            if (req.body) {
              // Para crear/editar, agregar algunos campos clave
              if (accion.includes("CREAR") || accion.includes("EDITAR")) {
                if (req.body.nombre)
                  descripcion += ` - Nombre: ${req.body.nombre}`;
                if (req.body.apellido) descripcion += ` ${req.body.apellido}`;
                if (req.body.ci) descripcion += ` - CI: ${req.body.ci}`;
                if (req.body.rol) descripcion += ` - Rol: ${req.body.rol}`;
              }
            }

            // Datos para el log
            const datosLog = {
              usuario: usuario._id,
              usuarioNombre: `${usuario.nombre} ${usuario.apellido}`,
              usuarioRol: usuario.rol,
              accion: accion,
              entidad: entidad,
              entidadId: req.params.id || body?.data?._id || body?.data?.id,
              descripcion:
                descripcion ||
                `${accion.replace("_", " ").toLowerCase()} en ${entidad}`,
              datosAntes: req.datosAntes || null, // Se puede setear en el controlador
              datosDespues: body?.data || null,
              ip: req.ip || req.socket?.remoteAddress || "127.0.0.1",
              userAgent: req.get("User-Agent"),
              exitoso: true,
            };

            // Crear el log de forma asíncrona sin bloquear la respuesta
            crearLog(datosLog).catch((error) => {
              console.error("Error al crear log:", error);
            });
          }
        }
      } catch (error) {
        console.error("Error en middleware de logging:", error);
      }

      // Llamar al método original
      return originalJson.call(this, body);
    };

    next();
  };
};

// Función para crear logs manuales
const crearLogManual = async (
  req,
  accion,
  entidad,
  descripcion,
  datosExtra = {}
) => {
  try {
    const usuario = req.user;

    if (!usuario) {
      console.log("❌ No hay usuario en req.user para crear log");
      return;
    }

    const datosLog = {
      usuario: usuario._id,
      usuarioNombre: `${usuario.nombre || "N/A"} ${usuario.apellido || "N/A"}`,
      usuarioRol: usuario.rol,
      accion: accion,
      entidad: entidad,
      descripcion: descripcion,
      ip: req.ip || req.socket?.remoteAddress || "127.0.0.1",
      userAgent: req.get("User-Agent"),
      exitoso: true,
      ...datosExtra,
    };

    await crearLog(datosLog);
  } catch (error) {
    console.error("Error al crear log manual:", error);
  }
};

// Función para logs de error
const crearLogError = async (req, accion, entidad, error, descripcion = "") => {
  try {
    const usuario = req.user;

    const datosLog = {
      usuario: usuario?._id,
      usuarioNombre: usuario
        ? `${usuario.nombre} ${usuario.apellido}`
        : "Usuario desconocido",
      usuarioRol: usuario?.rol || "desconocido",
      accion: accion,
      entidad: entidad,
      descripcion: descripcion || `Error en ${accion}: ${error.message}`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      exitoso: false,
      errorMessage: error.message,
    };

    await crearLog(datosLog);
  } catch (logError) {
    console.error("Error al crear log de error:", logError);
  }
};

module.exports = {
  logActividad,
  crearLogManual,
  crearLogError,
};
