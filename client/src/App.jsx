import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext"; // Importa UserProvider
import NavComponent from "./components/NavComponent";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./views/Login";
import Dashboard from "./views/Dashboard";
import CrearUsuario from "./views/CrearUsuario";
import CrearPaciente from "./views/CrearPaciente";
import CrearCita from "./views/CrearCita";
import EditarPaciente from "./views/EditarPaciente";
import EditarCita from "./views/EditarCita";
import CitaDetalle from "./views/CitaDetalle";
import PacienteDetalle from "./views/PacienteDetalle";
import PacienteCitas from "./views/PacienteCitas";
import EditarUsuario from "./views/EditarUsuario";
import Register from "./views/Register";
import RegistroActividad from "./views/RegistroActividad";
import GestionarSalas from "./views/GestionarSalas";
import GestionarEspecialidades from "./views/GestionarEspecialidades";

function App() {
  return (
    <UserProvider>
      {" "}
      {/* Envuelve todo con UserProvider */}
      <NavComponent />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/crearUsuario" element={<CrearUsuario />} />
        <Route path="/dashboard/crearPaciente" element={<CrearPaciente />} />
        <Route
          path="/dashboard/registro-actividad"
          element={
            <ProtectedRoute allowedRoles={["administrador"]}>
              <RegistroActividad />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/gestionar-salas"
          element={
            <ProtectedRoute allowedRoles={["administrador"]}>
              <GestionarSalas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/gestionar-especialidades"
          element={
            <ProtectedRoute allowedRoles={["administrador"]}>
              <GestionarEspecialidades />
            </ProtectedRoute>
          }
        />
        <Route path="/crear-cita/:pacienteId" element={<CrearCita />} />
        <Route path="/editar-paciente/:id" element={<EditarPaciente />} />
        <Route path="/editar-cita/:id" element={<EditarCita />} />
        <Route path="/crear-paciente" element={<CrearPaciente />} />
        <Route path="/cita-detalle/:id" element={<CitaDetalle />} />
        <Route path="/paciente-detalle/:id" element={<PacienteDetalle />} />
        <Route path="/paciente-citas/:id" element={<PacienteCitas />} />
        <Route path="/editar-usuario/:id" element={<EditarUsuario />} />
        <Route path="/tuHermana" element={<Register />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
