const { verifyToken } = require("../config/jwt.config");
const Usuario = require("../models/usuario.model");
const Medico = require("../models/medico.model");
const Enfermero = require("../models/enfermero.model");

const allowedRoles = {
  "/api/pacientes": {
    get: ["administrador", "medico", "enfermero"],
    post: ["administrador", "medico", "enfermero"],
    put: ["administrador", "medico", "enfermero"],
    delete: ["administrador"],
  },
  "/api/medicos": {
    get: ["administrador", "medico", "enfermero"],
    post: ["administrador"],
    put: ["administrador"],
    delete: ["administrador"],
  },
  "/api/citas": {
    get: ["administrador", "medico", "enfermero"],
    post: ["administrador", "medico", "enfermero"],
    put: ["administrador", "medico", "enfermero"],
    delete: ["administrador"],
  },
  "/api/enfermeros": {
    get: ["administrador"],
    post: ["administrador"],
    put: ["administrador"],
    delete: ["administrador"],
  },
  "/api/usuarios": {
    get: ["administrador"],
    post: ["administrador"],
    put: ["administrador"],
    delete: ["administrador"],
  },
  "/api/logs": {
    get: ["administrador"], // Solo administrador puede ver logs
    post: ["administrador"],
    put: ["administrador"],
    delete: ["administrador"],
  },
};

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ verified: false, message: "No token provided" });
  }
  try {
    const decoded = verifyToken(token);

    // Buscar la información completa del usuario basado en su rol
    let usuarioCompleto = null;

    try {
      console.log("🔍 Buscando usuario:", {
        id: decoded._id,
        rol: decoded.rol,
      });

      // Buscar siempre en la colección Usuario ya que ahí está toda la información básica
      usuarioCompleto = await Usuario.findById(decoded._id).select(
        "nombre apellido ci rol"
      );

      console.log(
        "� Usuario encontrado:",
        usuarioCompleto
          ? {
              nombre: usuarioCompleto.nombre,
              apellido: usuarioCompleto.apellido,
              rol: usuarioCompleto.rol,
            }
          : "No encontrado"
      );
    } catch (dbError) {
      console.error("Error al buscar usuario en BD:", dbError);
    }

    // Si no encontramos el usuario completo, usar la información del token
    if (usuarioCompleto) {
      req.user = {
        _id: usuarioCompleto._id,
        nombre: usuarioCompleto.nombre,
        apellido: usuarioCompleto.apellido,
        ci: usuarioCompleto.ci,
        rol: decoded.rol,
      };
    } else {
      // Fallback: usar solo la información del token
      req.user = {
        _id: decoded._id,
        nombre: "Usuario",
        apellido: "",
        ci: "",
        rol: decoded.rol,
      };
    }

    const baseRoute = req.baseUrl; // Ej: /api/usuarios
    const httpMethod = req.method.toLowerCase(); // Ej: post

    // Validar que la ruta esté en la configuración de permisos
    const permissions = allowedRoles[baseRoute];
    if (!permissions) {
      return res.status(403).json({ message: "Ruta no autorizada" });
    }

    // Validar que el método HTTP tenga roles asignados
    const allowedRolesForMethod = permissions[httpMethod];
    if (!allowedRolesForMethod) {
      return res.status(403).json({ message: "Método no permitido" });
    }

    // Validar que el usuario tenga un rol autorizado
    if (!allowedRolesForMethod.includes(decoded.rol)) {
      return res.status(403).json({ message: "Rol no autorizado" });
    }

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ verified: false, message: "Invalid or expired token" });
  }
};

module.exports = { authenticate };
