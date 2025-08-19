const Usuario = require("../models/usuario.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Medico = require("../models/medico.model"); // Importar modelo Medico
const Enfermero = require("../models/enfermero.model"); // Importar modelo Enfermero si existe
const { crearLogManual } = require("../middleware/logging.middleware");
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

      // Crear log de login exitoso - simulamos el req.user para el log
      const fakeReq = {
        ...req,
        user: {
          _id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
        },
      };

      await crearLogManual(
        fakeReq,
        "LOGIN",
        "Usuario",
        `Inicio de sesión exitoso - ${user.nombre} ${user.apellido} (${user.ci})`,
        {
          entidadId: user._id,
          datosDespues: {
            ci: user.ci,
            rol: user.rol,
            fechaLogin: new Date(),
          },
        }
      );
    } catch (error) {
      console.error("Error en proceso de login:", error);
      res.status(500).json({ msg: "Error interno del servidor" });
    }
  },

  logout: async (req, res) => {
    try {
      // Crear log de logout
      await crearLogManual(
        req,
        "LOGOUT",
        "Usuario",
        `Cierre de sesión - ${req.user.nombre} ${req.user.apellido} (${req.user.ci})`,
        {
          entidadId: req.user._id,
          datosDespues: {
            fechaLogout: new Date(),
          },
        }
      );

      // Limpiar cookie
      res.clearCookie("usertoken");
      res.json({ msg: "Logout exitoso" });
    } catch (error) {
      console.error("Error en logout:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Obtener todos los usuarios
  getAllUsuarios: (req, res) => {
    Usuario.aggregate([
      {
        $lookup: {
          from: "medicos", // Nombre de la colección en MongoDB
          localField: "_id",
          foreignField: "usuario",
          as: "medicoInfo",
        },
      },
      {
        $lookup: {
          from: "especialidads", // Nombre de la colección de especialidades
          localField: "medicoInfo.especialidad",
          foreignField: "_id",
          as: "especialidadInfo",
        },
      },
      {
        $lookup: {
          from: "salas", // Nombre de la colección de salas
          localField: "medicoInfo.sala",
          foreignField: "_id",
          as: "salaInfo",
        },
      },
      {
        $project: {
          nombre: 1,
          apellido: 1,
          ci: 1,
          rol: 1,
          especialidad: { $arrayElemAt: ["$especialidadInfo.nombre", 0] },
          sala: { $arrayElemAt: ["$salaInfo.nombre", 0] },
        },
      },
    ])
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
      const {
        nombre,
        apellido,
        ci,
        contrasena,
        rol,
        especialidad,
        sala,
        area,
      } = req.body;

      // Validar campos básicos
      if (!nombre || !apellido || !ci || !contrasena || !rol) {
        return res
          .status(400)
          .json({ error: "Todos los campos son requeridos" });
      }

      // Validar campos según el rol
      if (rol === "medico" && (!especialidad || !sala)) {
        return res
          .status(400)
          .json({ error: "Especialidad y sala son requeridos para médicos" });
      } else if (rol === "enfermero" && !area) {
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
        console.log("Creando médico con datos:", {
          usuario: nuevoUsuario._id,
          especialidad,
          sala,
        });

        const nuevoMedico = new Medico({
          usuario: nuevoUsuario._id,
          especialidad: especialidad,
          sala: sala,
        });
        await nuevoMedico.save();
        console.log("Médico creado exitosamente:", nuevoMedico._id);
      } else if (rol === "enfermero") {
        const nuevoEnfermero = new Enfermero({
          usuario: nuevoUsuario._id,
          area: area,
        });
        await nuevoEnfermero.save(); //
      }

      // Crear log de creación de usuario
      await crearLogManual(
        req,
        "CREAR_USUARIO",
        "Usuario",
        `Nuevo usuario creado - ${nombre} ${apellido} (${ci}) - Rol: ${rol}`,
        {
          entidadId: nuevoUsuario._id,
          datosDespues: {
            nombre,
            apellido,
            ci,
            rol,
            especialidad: especialidad,
            sala: sala,
            area: area,
          },
        }
      );

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
  updateOneUsuarioById: async (req, res) => {
    try {
      // Obtener datos anteriores para el log
      const usuarioAnterior = await Usuario.findById(req.params.id);
      if (!usuarioAnterior) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const usuarioActualizado = await Usuario.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      // Crear log de actualización
      await crearLogManual(
        req,
        "EDITAR_USUARIO",
        "Usuario",
        `Usuario actualizado - ${usuarioActualizado.nombre} ${usuarioActualizado.apellido} (${usuarioActualizado.ci})`,
        {
          entidadId: req.params.id,
          datosAntes: {
            nombre: usuarioAnterior.nombre,
            apellido: usuarioAnterior.apellido,
            rol: usuarioAnterior.rol,
          },
          datosDespues: {
            nombre: usuarioActualizado.nombre,
            apellido: usuarioActualizado.apellido,
            rol: usuarioActualizado.rol,
          },
        }
      );

      res.json(usuarioActualizado);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      res.status(400).json({ error: error.message });
    }
  },

  // Eliminar un usuario
  deleteOneUsuarioById: async (req, res) => {
    try {
      // Primero obtener los datos del usuario antes de eliminarlo
      const usuario = await Usuario.findById(req.params.id);
      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Eliminar usuario
      await Usuario.findByIdAndDelete(req.params.id);

      // Crear log de eliminación
      await crearLogManual(
        req,
        "ELIMINAR_USUARIO",
        "Usuario",
        `Usuario eliminado - ${usuario.nombre} ${usuario.apellido} (${usuario.ci}) - Rol: ${usuario.rol}`,
        {
          entidadId: usuario._id,
          datosAntes: {
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            ci: usuario.ci,
            rol: usuario.rol,
          },
        }
      );

      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
};
