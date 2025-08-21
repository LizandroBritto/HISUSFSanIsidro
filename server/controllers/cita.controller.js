const Cita = require("../models/cita.model");
const { crearLogManual } = require("../middleware/logging.middleware");
const ExcelJS = require("exceljs");

module.exports = {
  // Obtener todas las citas
  getAllCitas: (req, res) => {
    Cita.find()
      .populate("paciente") // Obtiene los datos del paciente asociado
      .populate({
        path: "medico", // Obtiene los datos del médico
        populate: [
          { path: "usuario", select: "nombre apellido ci rol" }, // Y anida el populate del campo "usuario"
          { path: "especialidad", select: "nombre descripcion" }, // Popula la especialidad del médico
          { path: "sala", select: "numero nombre" }, // Popula la sala del médico
        ],
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
        populate: [
          { path: "usuario", select: "nombre apellido ci rol" }, // Para anidar populate del médico
          { path: "especialidad", select: "nombre descripcion" }, // Popula la especialidad del médico
          { path: "sala", select: "numero nombre" }, // Popula la sala del médico
        ],
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
          return res.status(400).json({
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
          populate: [
            { path: "usuario", select: "nombre apellido ci rol" }, // Popula los datos del usuario asociado al médico
            { path: "especialidad", select: "nombre descripcion" }, // Popula la especialidad del médico
            { path: "sala", select: "numero nombre" }, // Popula la sala del médico
          ],
        });
      return res.json(citas);
    } catch (error) {
      console.error("Error al obtener citas del paciente:", error);
      return res.status(400).json({ error: error.message });
    }
  },

  // Obtener citas por médico
  getCitasByMedico: async (req, res) => {
    try {
      const medicoId = req.params.id; // ID del médico obtenido de la URL
      const citas = await Cita.find({ medico: medicoId })
        .populate("paciente") // Popula los datos del paciente
        .populate({
          path: "medico",
          populate: [
            { path: "usuario", select: "nombre apellido ci rol" }, // Popula los datos del usuario asociado al médico
            { path: "especialidad", select: "nombre descripcion" }, // Popula la especialidad del médico
            { path: "sala", select: "numero nombre" }, // Popula la sala del médico
          ],
        })
        .sort({ fecha: 1, hora: 1 }); // Ordenar por fecha y hora
      return res.json(citas);
    } catch (error) {
      console.error("Error al obtener citas del médico:", error);
      return res.status(400).json({ error: error.message });
    }
  },

  // Eliminar una cita
  deleteOneCitaById: (req, res) => {
    Cita.findByIdAndDelete(req.params.id)
      .then(() => res.json("Cita eliminada."))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Generar reporte de citas en Excel
  generarReporteCitas: async (req, res) => {
    try {
      const { fechaDesde, fechaHasta, estado } = req.query;
      const usuario = req.user;

      // Construir el filtro base
      let filtro = {};

      // Agregar filtro de fecha solo si se proporcionan ambas fechas
      if (fechaDesde && fechaHasta) {
        filtro.fecha = {
          $gte: new Date(fechaDesde),
          $lte: new Date(fechaHasta + "T23:59:59.999Z"),
        };
      } else if (fechaDesde) {
        // Solo fecha desde
        filtro.fecha = { $gte: new Date(fechaDesde) };
      } else if (fechaHasta) {
        // Solo fecha hasta
        filtro.fecha = { $lte: new Date(fechaHasta + "T23:59:59.999Z") };
      }

      // Si el usuario es médico, filtrar solo sus citas
      if (usuario.rol === "medico") {
        // Buscar el médico correspondiente al usuario
        const Medico = require("../models/medico.model");
        const medico = await Medico.findOne({ usuario: usuario._id });
        if (medico) {
          filtro.medico = medico._id;
        }
      }

      // Agregar filtro por estado si se especifica
      if (estado && estado !== "todos") {
        filtro.estado = estado;
      }

      // Obtener las citas
      const citas = await Cita.find(filtro)
        .populate({
          path: "paciente",
          select:
            "nombre apellido cedula telefono fechaNacimiento sexo grupoSanguineo",
        })
        .populate({
          path: "medico",
          populate: [
            { path: "usuario", select: "nombre apellido" },
            { path: "especialidad", select: "nombre" },
            { path: "sala", select: "numero nombre" },
          ],
        })
        .sort({ fecha: 1, hora: 1 });

      // Crear libro de Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reporte de Citas");

      // Configurar encabezados
      const headers = [
        "Fecha",
        "Hora",
        "Estado",
        "Paciente",
        "Cédula",
        "Teléfono",
        "Médico",
        "Especialidad",
        "Sala",
        "Estudios",
        "Observaciones",
      ];

      worksheet.addRow(headers);

      // Estilizar encabezados
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Agregar datos
      citas.forEach((cita) => {
        const row = [
          new Date(cita.fecha).toLocaleDateString("es-ES"),
          cita.hora,
          cita.estado,
          `${cita.paciente?.nombre || ""} ${
            cita.paciente?.apellido || ""
          }`.trim(),
          cita.paciente?.cedula || "",
          cita.paciente?.telefono || "",
          `${cita.medico?.usuario?.nombre || ""} ${
            cita.medico?.usuario?.apellido || ""
          }`.trim(),
          cita.medico?.especialidad?.nombre || "",
          cita.medico?.sala?.numero
            ? `${cita.medico.sala.numero} - ${cita.medico.sala.nombre || ""}`
            : "",
          cita.estudios || "",
          cita.observaciones || "",
        ];
        worksheet.addRow(row);
      });

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });

      // Configurar headers para descarga
      const fechaReporte = new Date().toISOString().split("T")[0];
      const estadoTexto = estado === "todos" || !estado ? "todas" : estado;

      // Construir el nombre del archivo dinámicamente
      let filename = `reporte_citas_${estadoTexto}`;
      if (fechaDesde && fechaHasta) {
        filename += `_${fechaDesde}_${fechaHasta}`;
      } else if (fechaDesde) {
        filename += `_desde_${fechaDesde}`;
      } else if (fechaHasta) {
        filename += `_hasta_${fechaHasta}`;
      } else {
        filename += "_completo";
      }
      filename += `_${fechaReporte}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // Escribir el archivo
      await workbook.xlsx.write(res);
      res.end();

      // Log de la actividad
      let mensajeLog = `Generó reporte de citas (`;
      if (fechaDesde && fechaHasta) {
        mensajeLog += `${fechaDesde} a ${fechaHasta}`;
      } else if (fechaDesde) {
        mensajeLog += `desde ${fechaDesde}`;
      } else if (fechaHasta) {
        mensajeLog += `hasta ${fechaHasta}`;
      } else {
        mensajeLog += `todas las fechas`;
      }
      mensajeLog += `, estado: ${estadoTexto})`;

      await crearLogManual(
        usuario._id,
        "reporte",
        "reporte_citas",
        null,
        mensajeLog
      );
    } catch (error) {
      console.error("Error al generar reporte:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar el reporte",
        error: error.message,
      });
    }
  },
};
