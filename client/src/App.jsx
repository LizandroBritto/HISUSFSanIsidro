import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext"; // Importa UserProvider
import NavComponent from "./components/NavComponent";
import Login from "./views/Login";
import Dashboard from "./views/Dashboard";
import CrearUsuario from "./views/CrearUsuario";
import CrearPaciente from "./views/CrearPaciente";
import CrearCita from "./views/CrearCita";
import EditarPaciente from "./views/EditarPaciente";
import EditarCita from "./views/EditarCita";

function App() {
  return (
    <UserProvider> {/* Envuelve todo con UserProvider */}
      <NavComponent />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/crearUsuario" element={<CrearUsuario />} />
        <Route path="/dashboard/crearPaciente" element={<CrearPaciente />} />
        <Route path="/crear-cita/:pacienteId" element={<CrearCita />} />
        <Route path="/editar-paciente/:id" element={<EditarPaciente />} />
        <Route path="/editar-cita/:id" element={<EditarCita />} />
        <Route path="/crear-paciente" element={<CrearPaciente />} />
      </Routes>
    </UserProvider>
  );
}

export default App;