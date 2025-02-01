const { verifyToken } = require('../config/jwt.config');

const allowedRoles = {
  '/api/pacientes': {
    get: ['administrador', 'medico', 'enfermero'],
    post: ['administrador', 'enfermero'],
    put: ['administrador', 'enfermero'],
    delete: ['administrador'],
  },
  '/api/medicos': {
    get: ['administrador', 'medico', 'enfermero'],
    post: ['administrador'],
    put: ['administrador'],
    delete: ['administrador'],
  },
  '/api/citas': {
    get: ['administrador', 'medico', 'enfermero'],
    post: ['administrador', 'enfermero'],
    put: ['administrador', 'enfermero'],
    delete: ['administrador'],
  },
  '/api/enfermeros': {
    get: ['administrador'],
    post: ['administrador'],
    put: ['administrador'],
    delete: ['administrador'],
  },
  '/api/usuarios': {
    get: ['administrador'],
    post: ['administrador'],
    put: ['administrador'],
    delete: ['administrador'],
  },
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ verified: false, message: 'No token provided' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    const baseRoute = req.baseUrl; // Ej: /api/usuarios
    const httpMethod = req.method.toLowerCase(); // Ej: post

    // Validar que la ruta esté en la configuración de permisos
    const permissions = allowedRoles[baseRoute];
    if (!permissions) {
      console.log("Ruta no definida en permisos:", baseRoute);
      return res.status(403).json({ message: 'Ruta no autorizada' });
    }

    // Validar que el método HTTP tenga roles asignados
    const allowedRolesForMethod = permissions[httpMethod];
    if (!allowedRolesForMethod) {
      console.log("Método no permitido:", httpMethod);
      return res.status(403).json({ message: 'Método no permitido' });
    }

    // Validar que el usuario tenga un rol autorizado
    if (!allowedRolesForMethod.includes(decoded.rol)) {
      console.log("Rol no permitido:", decoded.rol);
      return res.status(403).json({ message: 'Rol no autorizado' });
    }

    console.log("Acceso permitido");
    next();
  } catch (error) {
    return res.status(401).json({ verified: false, message: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
