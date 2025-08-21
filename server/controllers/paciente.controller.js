const Paciente = require("../models/paciente.model");
const { crearLogManual } = require("../middleware/logging.middleware");
const ExcelJS = require("exceljs");

module.exports = {
  // Obtener todos los pacientes
  getAllPacientes: (req, res) => {
    Paciente.find()
      .sort({
        estadoPaciente: -1, // Activos primero (A viene antes que I en orden alfabético descendente)
        nombre: 1, // Luego ordenar por nombre ascendente
        apellido: 1, // Y por apellido ascendente
      })
      .then((pacientes) => res.json(pacientes))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Obtener un paciente por ID
  getOnePaciente: (req, res) => {
    Paciente.findById(req.params.id)
      .then((paciente) => res.json(paciente))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Crear un nuevo paciente
  createPaciente: async (req, res) => {
    try {
      const { cedula } = req.body;

      // Validar si la cédula ya existe
      const pacienteExistente = await Paciente.findOne({ cedula });
      if (pacienteExistente) {
        return res
          .status(400)
          .json({ error: "Ya existe un paciente con esta cédula" });
      }

      const nuevoPaciente = new Paciente(req.body);
      await nuevoPaciente.save();

      // Crear log de creación de paciente
      await crearLogManual(
        req,
        "CREAR_PACIENTE",
        "Paciente",
        `Nuevo paciente registrado - ${nuevoPaciente.nombre} ${nuevoPaciente.apellido} (${nuevoPaciente.cedula})`,
        {
          entidadId: nuevoPaciente._id,
          datosDespues: {
            nombre: nuevoPaciente.nombre,
            apellido: nuevoPaciente.apellido,
            cedula: nuevoPaciente.cedula,
            estadoPaciente: nuevoPaciente.estadoPaciente,
          },
        }
      );

      res.status(201).json({ msg: "Paciente agregado exitosamente!" });
    } catch (error) {
      console.error("Error al crear paciente:", error);
      if (error.name === "ValidationError") {
        const mensajesError = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({ error: mensajesError });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Actualizar un paciente
  cambiarEstadoPaciente: async (req, res) => {
    try {
      const { id } = req.params;
      const paciente = await Paciente.findById(id);
      if (!paciente) {
        return res.status(404).json({ message: "Paciente no encontrado" });
      }

      // Alternar estado entre activo e inactivo
      paciente.estadoPaciente =
        paciente.estadoPaciente === "Activo" ? "Inactivo" : "Activo";
      await paciente.save();

      res.json(paciente);
    } catch (error) {
      res.status(500).json({ message: "Error al cambiar estado", error });
    }
  },

  updateOnePacienteById: async (req, res) => {
    try {
      const pacienteActualizado = await Paciente.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!pacienteActualizado) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      res.json(pacienteActualizado);
    } catch (error) {
      console.error("Error al actualizar paciente:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Eliminar un paciente
  deleteOnePacienteById: (req, res) => {
    Paciente.findByIdAndDelete(req.params.id)
      .then(() => res.json("Paciente eliminado."))
      .catch((err) => res.status(400).json("Error: " + err));
  },

  // Buscar paciente por número de cédula
  findByCedula: async (req, res) => {
    try {
      const { cedula } = req.params;

      if (!/^\d+$/.test(cedula)) {
        return res.status(400).json({ error: "Formato de cédula inválido" });
      }

      const paciente = await Paciente.findOne({ cedula });

      if (!paciente) {
        return res.status(404).json({ error: "Paciente no encontrado" });
      }

      res.json(paciente);
    } catch (error) {
      console.error("Error al buscar paciente por cédula:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // Generar historial médico completo del paciente
  generarHistorialMedico: async (req, res) => {
    try {
      const { id } = req.params;
      const usuario = req.user;

      // Solo médicos pueden generar historiales médicos
      if (usuario.rol !== "medico") {
        return res.status(403).json({
          success: false,
          message: "Solo los médicos pueden generar historiales médicos",
        });
      }

      // Obtener datos completos del paciente
      const paciente = await Paciente.findById(id);
      if (!paciente) {
        return res.status(404).json({
          success: false,
          message: "Paciente no encontrado",
        });
      }

      // Obtener todas las citas del paciente
      const Cita = require("../models/cita.model");
      const citas = await Cita.find({ paciente: id })
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

      // Hoja 1: Información del paciente
      const pacienteSheet = workbook.addWorksheet("Información del Paciente");

      // Encabezados de información del paciente
      pacienteSheet.addRow(["INFORMACIÓN PERSONAL DEL PACIENTE"]);
      pacienteSheet.addRow([]);
      pacienteSheet.addRow(["Campo", "Valor"]);

      // Datos del paciente
      pacienteSheet.addRow([
        "Nombre completo",
        `${paciente.nombre} ${paciente.apellido}`,
      ]);
      pacienteSheet.addRow(["Cédula", paciente.cedula]);
      pacienteSheet.addRow([
        "Fecha de nacimiento",
        paciente.fechaNacimiento
          ? new Date(paciente.fechaNacimiento).toLocaleDateString("es-ES")
          : "No registrada",
      ]);
      pacienteSheet.addRow(["Sexo", paciente.sexo || "No registrado"]);
      pacienteSheet.addRow([
        "Grupo sanguíneo",
        paciente.grupoSanguineo || "No registrado",
      ]);
      pacienteSheet.addRow(["Teléfono", paciente.telefono || "No registrado"]);
      pacienteSheet.addRow([
        "Dirección",
        paciente.direccion || "No registrada",
      ]);
      pacienteSheet.addRow(["Estado", paciente.estadoPaciente || "Activo"]);
      pacienteSheet.addRow([]);
      pacienteSheet.addRow(["INFORMACIÓN MÉDICA"]);
      pacienteSheet.addRow([
        "Enfermedades preexistentes",
        paciente.enfermedadesPreexistentes || "Ninguna registrada",
      ]);
      pacienteSheet.addRow([
        "Alergias",
        paciente.alergias || "Ninguna registrada",
      ]);

      // Estilizar la hoja del paciente
      pacienteSheet.getRow(1).font = { bold: true, size: 14 };
      pacienteSheet.getRow(3).font = { bold: true };
      pacienteSheet.getRow(11).font = { bold: true };

      // Ajustar ancho de columnas
      pacienteSheet.columns = [{ width: 25 }, { width: 50 }];

      // Hoja 2: Historial de citas
      const citasSheet = workbook.addWorksheet("Historial de Citas");

      // Encabezados de citas
      const citasHeaders = [
        "Fecha",
        "Hora",
        "Estado",
        "Médico",
        "Especialidad",
        "Sala",
        "Presión arterial",
        "Temperatura",
        "Estudios",
        "Observaciones",
      ];

      citasSheet.addRow(citasHeaders);

      // Estilizar encabezados de citas
      const headerRow = citasSheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Agregar datos de citas
      citas.forEach((cita) => {
        const row = [
          new Date(cita.fecha).toLocaleDateString("es-ES"),
          cita.hora,
          cita.estado,
          `${cita.medico?.usuario?.nombre || ""} ${
            cita.medico?.usuario?.apellido || ""
          }`.trim(),
          cita.medico?.especialidad?.nombre || "",
          cita.medico?.sala?.numero
            ? `${cita.medico.sala.numero} - ${cita.medico.sala.nombre || ""}`
            : "",
          cita.presionArterial || "",
          cita.temperatura || "",
          cita.estudios || "",
          cita.observaciones || "",
        ];
        citasSheet.addRow(row);
      });

      // Ajustar ancho de columnas en hoja de citas
      citasSheet.columns.forEach((column) => {
        column.width = 15;
      });

      // Configurar headers para descarga
      const fechaReporte = new Date().toISOString().split("T")[0];
      const filename = `historial_medico_${paciente.nombre}_${paciente.apellido}_${fechaReporte}.xlsx`;

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
      await crearLogManual(
        usuario._id,
        "reporte",
        "historial_medico",
        null,
        `Generó historial médico del paciente ${paciente.nombre} ${paciente.apellido} (${paciente.cedula})`
      );
    } catch (error) {
      console.error("Error al generar historial médico:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar el historial médico",
        error: error.message,
      });
    }
  },
};
