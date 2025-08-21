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
    get: ["administrador", "enfermero"], // Enfermeros pueden acceder a sus propios endpoints
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
  "/api/salas": {
    get: ["administrador", "medico", "enfermero"], // Todos pueden ver salas
    post: ["administrador"], // Solo admin puede crear
    put: ["administrador"], // Solo admin puede editar
    delete: ["administrador"], // Solo admin puede eliminar
  },
  "/api/especialidades": {
    get: ["administrador", "medico", "enfermero"], // Todos pueden ver especialidades
    post: ["administrador"], // Solo admin puede crear
    put: ["administrador"], // Solo admin puede editar
    delete: ["administrador"], // Solo admin puede eliminar
  },
};

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  console.log(
    `🔐 Auth middleware - Ruta: ${req.method} ${req.baseUrl}${
      req.route?.path || req.path
    }`
  );
  console.log(`🔑 Token presente: ${token ? "Sí" : "No"}`);

  if (!token) {
    console.log("❌ No token provided");
    return res
      .status(401)
      .json({ verified: false, message: "No token provided" });
  }
  try {
    const decoded = verifyToken(token);
    console.log(
      `👤 Token decodificado para usuario: ${decoded._id}, rol: ${decoded.rol}`
    );

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
    const fullPath = baseRoute + (req.route?.path || ""); // Ruta completa con parámetros

    console.log(
      `🛣️  Verificando permisos - baseRoute: ${baseRoute}, method: ${httpMethod}, fullPath: ${fullPath}`
    );

    // Excepción especial: los médicos pueden actualizar su propio estado y sala
    if (
      fullPath === "/api/medicos/estado-sala/usuario/:usuarioId" &&
      httpMethod === "put" &&
      decoded.rol === "medico"
    ) {
      // Verificar que el médico solo puede actualizar su propia información
      const usuarioIdFromUrl = req.params.usuarioId;
      if (decoded._id.toString() === usuarioIdFromUrl) {
        return next(); // Permitir acceso
      } else {
        return res
          .status(403)
          .json({ message: "No puedes actualizar información de otro médico" });
      }
    }

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
      console.log(
        `❌ Rol no autorizado: ${decoded.rol} para ${httpMethod} ${baseRoute}`
      );
      return res.status(403).json({ message: "Rol no autorizado" });
    }

    console.log(
      `✅ Autenticación exitosa para ${decoded.rol} en ${httpMethod} ${baseRoute}`
    );
    next();
  } catch (error) {
    console.log("❌ Error en autenticación:", error.message);
    console.log("🔍 Tipo de error:", error.constructor.name);
    return res
      .status(401)
      .json({ verified: false, message: "Invalid or expired token" });
  }
};

module.exports = { authenticate };
