const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRET || 'tu_clave_secreta'; // Usa la variable de entorno o define una clave secreta aquí

const generateToken = (usuario) => {
  const payload = {
    id: usuario._id, // ID del usuario
    rol: usuario.rol, // Incluye el rol del usuario
  };
  return jwt.sign(payload, secretKey, { expiresIn: '12h' }); // Token válido por 1 hora
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = { generateToken, verifyToken };