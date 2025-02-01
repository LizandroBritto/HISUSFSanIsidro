const Usuario = require("../models/usuario.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Medico = require("../models/medico.model"); // Importar modelo Medico
const Enfermero = require("../models/enfermero.model"); // Importar modelo Enfermero si existe
module.exports = {
  register: (req, res) => {
    const user = new Usuario(req.body);
    user
      .save()
      .then(() => {
        res.json({ msg: "success!", user: user });
      })
      .catch((err) => res.json(err));
  },
  login: async (req, res) => {
    try {
      const { ci, contrasena } = req.body;

      // 1. Validación de campos
      if (!ci || !contrasena) {
        return res.status(400).json({ msg: "CI y contraseña son requeridos" });
      }

      // 2. Buscar usuario
      const user = await Usuario.findOne({ ci });
      if (!user) {
        console.log(`Usuario con CI ${ci} no encontrado`);
        return res.status(401).json({ msg: "Credenciales inválidas" });
      }

      // 3. Comparar contraseñas
      const passwordIsValid = await bcrypt.compare(contrasena, user.contrasena);
      if (!passwordIsValid) {
        console.log("Contraseña incorrecta para usuario:", ci);
        return res.status(401).json({ msg: "Credenciales inválidas" });
      }

      // 4. Generar token JWT
      const secret = process.env.SECRET;
      if (!secret) {
        console.error("ERROR: Secret no definido en variables de entorno");
        return res
          .status(500)
          .json({ msg: "Error de configuración del servidor" });
      }

      const userInfo = {
        _id: user._id,
        ci: user.ci,
        name: user.nombre,
        rol: user.rol,
      };

      const token = jwt.sign(userInfo, secret, { expiresIn: "12h" });

      // 5. Enviar respuesta
      res
        .cookie("usertoken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
          sameSite: "strict",
          maxAge: 3600000, // 1 hora
        })
        .json({
          msg: "success!",
          user: userInfo,
          token: token, // ¡Importante enviar el token en el body!
        });

      console.log(`Login exitoso para usuario ${ci}`);
    } catch (error) {
      console.error("Error en proceso de login:", error);
      res.status(500).json({ msg: "Error interno del servidor" });
    }
  },

  // Obtener todos los usuarios
  getAllUsuarios: (req, res) => {
    Usuario.find()
      .then((usuarios) => res.json(usuarios))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Obtener un usuario por ID
  getOneUsuario: (req, res) => {
    Usuario.findById(req.params.id)
      .then((usuario) => res.json(usuario))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Crear un nuevo usuario

  createUsuario: async (req, res) => {
    try {
      const { nombre, apellido, ci, contrasena, rol, ...otrosCampos } =
        req.body;

      // Validar campos básicos
      if (!nombre || !apellido || !ci || !contrasena || !rol) {
        return res
          .status(400)
          .json({ error: "Todos los campos son requeridos" });
      }

      // Validar campos según el rol
      if (
        rol === "medico" &&
        (!otrosCampos.especialidad || !otrosCampos.sala)
      ) {
        return res
          .status(400)
          .json({ error: "Especialidad y sala son requeridos para médicos" });
      } else if (rol === "enfermero" && !otrosCampos.area) {
        return res
          .status(400)
          .json({ error: "Área es requerida para enfermeros" });
      }

      // Validar CI único
      const existeUsuario = await Usuario.findOne({ ci });
      if (existeUsuario) {
        return res.status(400).json({ error: "El CI ya está registrado" });
      }

      // Crear usuario
      const nuevoUsuario = new Usuario({
        nombre,
        apellido,
        ci,
        contrasena,
        rol,
      });
      await nuevoUsuario.save();

      // Crear registro específico según el rol
      if (rol === "medico") {
        const nuevoMedico = new Medico({
          usuario: nuevoUsuario._id,
          especialidad: otrosCampos.especialidad,
          sala: otrosCampos.sala,
        });
        await nuevoMedico.save();
      } else if (rol === "enfermero") {
        const nuevoEnfermero = new Enfermero({
          usuario: nuevoUsuario._id,
          area: otrosCampos.area,
        });
        await nuevoEnfermero.save(); // 
      }

      res.status(201).json({
        msg: "Usuario creado exitosamente",
        id: nuevoUsuario._id, // Enviar ID para completar datos en frontend si es necesario
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
  // Actualizar un usuario
  updateOneUsuarioById: (req, res) => {
    Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .then((usuario) => res.json(usuario))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Eliminar un usuario
  deleteOneUsuarioById: (req, res) => {
    Usuario.findByIdAndDelete(req.params.id)
      .then(() => res.json("Usuario eliminado."))
      .catch((err) => res.status(400).json("Error: " + err));
  },
};
