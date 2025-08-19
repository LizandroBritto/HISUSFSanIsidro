const Cita = require("../models/cita.model");
const { crearLogManual } = require("../middleware/logging.middleware");

module.exports = {
  // Obtener todas las citas
  getAllCitas: (req, res) => {
    Cita.find()
      .populate("paciente") // Obtiene los datos del paciente asociado
      .populate({
        path: "medico", // Obtiene los datos del médico
        populate: { path: "usuario" }, // Y anida el populate del campo "usuario"
      })
      .then((citas) => res.json(citas))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Obtener una cita por ID
  getOneCita: (req, res) => {
    Cita.findById(req.params.id)
      .populate({
        path: "paciente", // ¡Asegúrate de que el path coincida con tu schema!
        select:
          "nombre apellido cedula enfermedadesPreexistentes alergias sexo grupoSanguineo telefono direccion fechaNacimiento", // Selecciona solo los campos necesarios
      })
      .populate({
        path: "medico",
        populate: { path: "usuario" }, // Para anidar populate del médico
      })
      .then((cita) => res.json(cita))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Crear una nueva cita
  createCita: async (req, res) => {
    try {
      const { medico, fecha, hora, estado, paciente } = req.body;

      const fechaObj = new Date(fecha);

      const inicioDelDia = new Date(fechaObj);
      inicioDelDia.setHours(0, 0, 0, 0);

      const finDelDia = new Date(fechaObj);
      finDelDia.setHours(23, 59, 59, 999);

      const citaExistente = await Cita.findOne({
        medico, // Campo 'medico' en el modelo
        fecha: { $gte: inicioDelDia, $lte: finDelDia },
        hora, // Campo 'hora' en el modelo
      });

      if (citaExistente) {
        return res
          .status(400)
          .json({ error: "El doctor ya tiene una cita en ese mismo horario" });
      }

      // Validar que no exista una cita con el mismo doctor y horario en la misma fecha

      const citaPendientePaciente = await Cita.findOne({
        paciente,
        estado: "pendiente",
      });
      if (citaPendientePaciente) {
        return res
          .status(400)
          .json({ error: "El paciente ya tiene una cita pendiente" });
      }

      if (new Date(hora) <= new Date()) {
        return res
          .status(400)
          .json({ error: "La cita debe tener un horario en el futuro" });
      }

      const nuevaCita = new Cita(req.body);
      await nuevaCita.save();

      // Poblar la cita para obtener datos del paciente para el log
      const citaCompleta = await Cita.findById(nuevaCita._id)
        .populate("paciente")
        .populate("medico");

      // Crear log de creación
      await crearLogManual(
        req,
        "CREAR_CITA",
        "Cita",
        `Nueva cita creada - Paciente: ${citaCompleta.paciente?.nombre} ${citaCompleta.paciente?.apellido} - Fecha: ${nuevaCita.fecha}`,
        {
          entidadId: nuevaCita._id,
          datosDespues: {
            fecha: nuevaCita.fecha,
            hora: nuevaCita.hora,
            estado: nuevaCita.estado,
          },
        }
      );

      return res.status(201).json({ msg: "Cita agregada exitosamente" });
    } catch (error) {
      console.error("Error al crear cita:", error);
      return res.status(400).json({ error: error.message });
    }
  },

  // Actualizar una cita
  updateOneCitaById: async (req, res) => {
    try {
      const { medico, fecha, hora, estado, paciente } = req.body;

      // Si se actualiza el horario o el médico, validamos que no exista conflicto.
      // Es importante considerar tanto la fecha como la hora.
      if (medico && fecha && hora) {
        // Convertimos la fecha y hora en un objeto Date.
        // Suponemos que `hora` viene en formato "HH:mm" y `fecha` en formato "YYYY-MM-DD".
        const fechaHoraActualizada = new Date(`${fecha}T${hora}:00`);

        // Creamos un rango para la fecha, en caso de que en la base se almacene la fecha sin la hora.
        const inicioDelDia = new Date(fecha);
        inicioDelDia.setHours(0, 0, 0, 0);
        const finDelDia = new Date(fecha);
        finDelDia.setHours(23, 59, 59, 999);

        const citaConflict = await Cita.findOne({
          _id: { $ne: req.params.id }, // Excluimos la cita que se está actualizando
          medico,
          // Comprobamos que la fecha se encuentre dentro del día y la hora sea la misma.
          fecha: { $gte: inicioDelDia, $lte: finDelDia },
          hora, // Se asume que la hora se almacena en el mismo formato (ej. "05:40")
        });
        if (citaConflict) {
          return res
            .status(400)
            .json({
              error: "El doctor ya tiene una cita en ese mismo horario",
            });
        }
      }

      // Si se actualiza el estado a "pendiente", se debe validar que el paciente no tenga otra pendiente.
      if (estado === "pendiente") {
        const citaPendiente = await Cita.findOne({
          _id: { $ne: req.params.id },
          paciente,
          estado: "pendiente",
        });
        if (citaPendiente) {
          return res
            .status(400)
            .json({ error: "El paciente ya tiene una cita pendiente" });
        }
      }

      // Validar que, si se actualiza el horario (fecha y hora), sea en el futuro.
      if (fecha && hora) {
        // Combinamos fecha y hora para crear el objeto Date.
        const fechaHora = new Date(`${fecha}T${hora}:00`);
        if (fechaHora <= new Date()) {
          return res
            .status(400)
            .json({ error: "La cita debe tener un horario en el futuro" });
        }
      }

      // (Opcional) Validar que si se actualiza el médico o paciente, existan en sus respectivas colecciones.

      // Obtener datos anteriores para el log
      const citaAnterior = await Cita.findById(req.params.id)
        .populate("paciente")
        .populate("medico");

      const citaActualizada = await Cita.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      )
        .populate("paciente")
        .populate("medico");

      // Crear log de la actualización
      let accion = "EDITAR_CITA";
      let descripcion = `Cita actualizada - ID: ${req.params.id}`;

      // Determinar la acción específica basada en los cambios
      if (citaAnterior.estado !== req.body.estado) {
        switch (req.body.estado) {
          case "confirmada":
            accion = "CONFIRMAR_CITA";
            descripcion = `Cita confirmada - Paciente: ${citaActualizada.paciente?.nombre} ${citaActualizada.paciente?.apellido}`;
            break;
          case "cancelada":
            accion = "CANCELAR_CITA";
            descripcion = `Cita cancelada - Paciente: ${citaActualizada.paciente?.nombre} ${citaActualizada.paciente?.apellido}`;
            break;
          case "completada":
            accion = "COMPLETAR_CITA";
            descripcion = `Cita completada - Paciente: ${citaActualizada.paciente?.nombre} ${citaActualizada.paciente?.apellido}`;
            break;
          default:
            descripcion = `Estado de cita cambiado a ${req.body.estado} - Paciente: ${citaActualizada.paciente?.nombre} ${citaActualizada.paciente?.apellido}`;
        }
      }

      // Crear el log
      await crearLogManual(req, accion, "Cita", descripcion, {
        entidadId: req.params.id,
        datosAntes: {
          estado: citaAnterior.estado,
          fecha: citaAnterior.fecha,
          hora: citaAnterior.hora,
        },
        datosDespues: {
          estado: citaActualizada.estado,
          fecha: citaActualizada.fecha,
          hora: citaActualizada.hora,
        },
      });

      return res.json(citaActualizada);
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      return res.status(400).json({ error: error.message });
    }
  },
  getCitasByPaciente: async (req, res) => {
    try {
      const pacienteId = req.params.id; // ID del paciente obtenido de la URL
      const citas = await Cita.find({ paciente: pacienteId })
        .populate("paciente") // Popula los datos del paciente
        .populate({
          path: "medico",
          populate: { path: "usuario" }, // Popula los datos del usuario asociado al médico
        });
      return res.json(citas);
    } catch (error) {
      console.error("Error al obtener citas del paciente:", error);
      return res.status(400).json({ error: error.message });
    }
  },

  // Eliminar una cita
  deleteOneCitaById: (req, res) => {
    Cita.findByIdAndDelete(req.params.id)
      .then(() => res.json("Cita eliminada."))
      .catch((err) => res.status(400).json("Error: " + err));
  },
};
