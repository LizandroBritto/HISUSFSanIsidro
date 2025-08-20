const jwt = require("jsonwebtoken");

const secretKey = process.env.SECRET || "tu_clave_secreta"; // Usa la variable de entorno o define una clave secreta aquí

const generateToken = (usuario) => {
  const payload = {
    _id: usuario._id, // ID del usuario (consistente con el resto del código)
    rol: usuario.rol, // Incluye el rol del usuario
  };
  return jwt.sign(payload, secretKey, { expiresIn: "12h" }); // Token válido por 12 horas
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

module.exports = { generateToken, verifyToken };
