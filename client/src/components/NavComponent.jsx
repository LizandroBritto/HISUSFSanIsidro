import {
  Button,
  MegaMenu,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
  Modal,
  Select,
  Label,
} from "flowbite-react";

import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const NavComponent = () => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  // Estados para médicos
  const [medicoData, setMedicoData] = useState(null);
  const [salas, setSalas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nuevaSala, setNuevaSala] = useState("");

  const cargarDatosMedico = useCallback(async () => {
    if (!user?._id) return;

    try {
      console.log(
        "🏥 Intentando cargar datos del médico para user ID:",
        user._id
      );
      const token = localStorage.getItem("token");
      console.log(
        "🔑 Token para cargar médico:",
        token ? `${token.substring(0, 20)}...` : "No hay token"
      );

      const response = await axios.get(
        `http://localhost:8000/api/medicos/usuario/${user._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ Datos del médico cargados exitosamente");
      setMedicoData(response.data);
      setNuevoEstado(response.data.estado);
      setNuevaSala(response.data.sala._id);
    } catch (error) {
      console.error("❌ Error al cargar datos del médico:", error);

      // Si es error 401, el token podría haber expirado
      if (error.response?.status === 401) {
        console.error(
          "🚨 Token expirado o inválido detectado en cargarDatosMedico"
        );
        Swal.fire({
          title: "Sesión expirada",
          text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          icon: "warning",
          confirmButtonText: "OK",
        }).then(() => {
          logout();
          navigate("/login");
        });
      }
    }
  }, [user?._id, logout, navigate]);

  const cargarSalas = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      console.log(
        "Token para cargar salas:",
        token ? "Token presente" : "No hay token"
      );

      if (!token) {
        console.error("No hay token para cargar salas");
        setSalas([]);
        return;
      }

      const response = await axios.get("http://localhost:8000/api/salas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // El controlador devuelve { success: true, data: salas }
      if (response.data.success && Array.isArray(response.data.data)) {
        setSalas(response.data.data);
        console.log("Salas cargadas:", response.data.data.length);
      } else {
        console.error("La respuesta de salas no es válida:", response.data);
        setSalas([]);
      }
    } catch (error) {
      console.error("Error al cargar salas:", error);
      console.error("Status del error:", error.response?.status);
      console.error("Mensaje del error:", error.response?.data);

      // Si es error 401, el token podría haber expirado
      if (error.response?.status === 401) {
        console.error(
          "Token expirado o inválido. Haciendo logout automático..."
        );
        Swal.fire({
          title: "Sesión expirada",
          text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          icon: "warning",
          confirmButtonText: "OK",
        }).then(() => {
          logout();
          navigate("/login");
        });
        return; // Salir de la función para evitar continuar con el error
      }

      setSalas([]); // Asegurar que salas sea un array vacío en caso de error
    }
  }, [logout, navigate]);

  // Cargar datos del médico si el usuario es médico
  useEffect(() => {
    if (user?.rol === "medico") {
      // Verificar que tengamos un token válido antes de hacer las peticiones
      const token = localStorage.getItem("token");
      if (token) {
        cargarDatosMedico();
        cargarSalas();
      } else {
        console.error("No hay token disponible para cargar datos del médico");
      }
    }
  }, [user, cargarDatosMedico, cargarSalas]);

  const actualizarEstadoYSala = async () => {
    try {
      await axios.put(
        `http://localhost:8000/api/medicos/estado-sala/usuario/${user._id}`,
        {
          estado: nuevoEstado,
          sala: nuevaSala,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      Swal.fire({
        title: "Estado y sala actualizados",
        icon: "success",
        draggable: true,
      });

      setShowModal(false);
      cargarDatosMedico(); // Recargar datos
    } catch (error) {
      console.error("Error al actualizar estado y sala:", error);

      // Si es error 401, el token podría haber expirado
      if (error.response?.status === 401) {
        Swal.fire({
          title: "Sesión expirada",
          text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          icon: "warning",
          confirmButtonText: "OK",
        }).then(() => {
          logout();
          navigate("/login");
        });
      }
      // Si es error 409, la sala ya está ocupada
      else if (
        error.response?.status === 409 &&
        error.response?.data?.error === "SALA_OCUPADA"
      ) {
        const medicoExistente = error.response.data.medicoExistente;

        Swal.fire({
          title: "⚠️ Sala ya ocupada",
          html: `
            <p><strong>La sala seleccionada ya está asignada al Dr. ${medicoExistente.nombre} ${medicoExistente.apellido}</strong></p>
            <br>
            <p>Tener dos médicos en la misma sala puede causar confusión para los pacientes y el personal.</p>
            <br>
            <p><strong>Se recomienda consultar con el administrador antes de continuar.</strong></p>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Continuar de todos modos",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#d33",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            // El usuario decidió continuar, hacer una segunda petición forzada
            actualizarEstadoYSalaForzado();
          }
          // Si cancela, no hacer nada (el modal se cierra automáticamente)
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar el estado y sala",
        });
      }
    }
  };

  const actualizarEstadoYSalaForzado = async () => {
    try {
      await axios.put(
        `http://localhost:8000/api/medicos/estado-sala/usuario/${user._id}`,
        {
          estado: nuevoEstado,
          sala: nuevaSala,
          forzar: true, // Parámetro para indicar que se debe ignorar la validación
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      Swal.fire({
        title: "Estado y sala actualizados",
        text: "Se ha asignado la sala a pesar de que otro médico ya la tenía asignada.",
        icon: "success",
        draggable: true,
      });

      setShowModal(false);
      cargarDatosMedico(); // Recargar datos
    } catch (error) {
      console.error("Error al actualizar estado y sala (forzado):", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado y sala",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirige al login
  };

  if (!user) return null; // No mostrar si no hay usuario
  return (
    <MegaMenu>
      <NavbarBrand href="/">
        <img alt="" src="/favicon.svg" className="mr-3 h-6 sm:h-9" />
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
          Bienvenido{" "}
          {user.rol === "enfermero"
            ? "Enfermero"
            : user.rol === "medico"
            ? "Dr."
            : ""}{" "}
          {user.name}
          {user.rol === "medico" && medicoData && (
            <div className="text-sm text-gray-300 mt-1">
              Estado:{" "}
              <span
                className={`font-medium ${
                  medicoData.estado === "disponible"
                    ? "text-green-400"
                    : medicoData.estado === "no disponible"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {medicoData.estado}
              </span>{" "}
              | Sala:{" "}
              <span className="text-blue-400">
                {medicoData.sala?.nombre || medicoData.sala?.numero}
              </span>
            </div>
          )}
        </span>
      </NavbarBrand>
      <div className="order-2 hidden items-center md:flex">
        {user ? (
          <Button color="red" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        ) : null}
      </div>
      <NavbarToggle />
      <NavbarCollapse>
        <NavbarLink href="/dashboard">Inicio</NavbarLink>

        {/* Opciones para Administrador */}
        {user?.rol === "administrador" && (
          <>
            <NavbarLink as={Link} to="/dashboard/crearUsuario">
              Crear Usuario
            </NavbarLink>
            <NavbarLink as={Link} to="/dashboard/registro-actividad">
              Registro de Actividad
            </NavbarLink>
            <NavbarLink as={Link} to="/dashboard/gestionar-salas">
              Gestionar Salas
            </NavbarLink>
            <NavbarLink as={Link} to="/dashboard/gestionar-especialidades">
              Gestionar Especialidades
            </NavbarLink>
          </>
        )}

        {/* Opciones para Enfermero */}
        {user?.rol === "enfermero" && (
          <NavbarLink as={Link} to="/dashboard/crearPaciente">
            Crear Paciente
          </NavbarLink>
        )}

        {/* Opciones para Médico */}
        {user?.rol === "medico" && (
          <NavbarLink
            as="button"
            onClick={() => setShowModal(true)}
            className="cursor-pointer"
          >
            Estado/Sala
          </NavbarLink>
        )}
      </NavbarCollapse>

      {/* Modal para cambiar estado y sala */}
      {showModal && (
        <Modal show={showModal} onClose={() => setShowModal(false)}>
          <Modal.Header>Actualizar Estado y Sala</Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <Label htmlFor="estado" value="Estado" />
                <Select
                  id="estado"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  <option value="disponible">Disponible</option>
                  <option value="no disponible">No Disponible</option>
                  <option value="ausente">Ausente</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="sala" value="Sala" />
                <Select
                  id="sala"
                  value={nuevaSala}
                  onChange={(e) => setNuevaSala(e.target.value)}
                >
                  {Array.isArray(salas) && salas.length > 0 ? (
                    salas.map((sala) => (
                      <option key={sala._id} value={sala._id}>
                        {sala.nombre} - {sala.numero}
                      </option>
                    ))
                  ) : (
                    <option value="">No hay salas disponibles</option>
                  )}
                </Select>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={actualizarEstadoYSala}>Actualizar</Button>
            <Button color="gray" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </MegaMenu>
  );
};

export default NavComponent;
