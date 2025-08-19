require("dotenv").config();
const PORT = process.env.PORT || 8000;
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());

// Configuración de CORS
const corsOptions = {
  origin: [
    "http://3.15.0.129:8000",
    "http://localhost:5173",
    "http://3.15.0.129", // Si el frontend está en el puerto 80
    "http://3.15.0.129:5173", // Si el frontend está en el puerto 5173
  ], // Reemplaza con la URL de tu frontend
  methods: "GET, POST, PUT, DELETE",
  credentials: true, // Si necesitas enviar cookies
  exposedHeaders: ["Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Maneja solicitudes preflight

app.use(express.json());

// Conexión a MongoDB (usando Mongoose)
require("./config/mongoose.config");

// Rutas
const pacientesRouter = require("./routes/paciente.route");
app.use("/api/pacientes", pacientesRouter);

const medicosRouter = require("./routes/medico.route");
app.use("/api/medicos", medicosRouter);

const citasRouter = require("./routes/cita.route");
app.use("/api/citas", citasRouter);

const enfermerosRouter = require("./routes/enfermero.route");
app.use("/api/enfermeros", enfermerosRouter);

const usuariosRouter = require("./routes/usuario.route");
app.use("/api/usuarios", usuariosRouter);

const logsRouter = require("./routes/logActividad.route");
app.use("/api/logs", logsRouter);

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
