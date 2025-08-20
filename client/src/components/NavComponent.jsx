import {
  Button,
  MegaMenu,
  MegaMenuDropdown,
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
            Cerrar Sesion
          </Button>
        ) : null}
      </div>
      <NavbarToggle />
      <NavbarCollapse>
        <NavbarLink href="/dashboard">Home</NavbarLink>
        {user?.rol !== "medico" && (
          <MegaMenuDropdown
            toggle={<span className="text-white">Opciones</span>}
          >
            <ul className="grid grid-cols-3">
              <div className="space-y-4 p-4">
                {user?.rol === "medico" && (
                  <li>
                    <a
                      href="#"
                      className="group flex items-center hover:text-primary-600 dark:hover:text-primary-500"
                    >
                      <svg
                        className="me-2 h-3 w-3 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="m1.56 6.245 8 3.924a1 1 0 0 0 .88 0l8-3.924a1 1 0 0 0 0-1.8l-8-3.925a1 1 0 0 0-.88 0l-8 3.925a1 1 0 0 0 0 1.8Z" />
                        <path d="M18 8.376a1 1 0 0 0-1 1v.163l-7 3.434-7-3.434v-.163a1 1 0 0 0-2 0v.786a1 1 0 0 0 .56.9l8 3.925a1 1 0 0 0 .88 0l8-3.925a1 1 0 0 0 .56-.9v-.786a1 1 0 0 0-1-1Z" />
                        <path d="M17.993 13.191a1 1 0 0 0-1 1v.163l-7 3.435-7-3.435v-.163a1 1 0 1 0-2 0v.787a1 1 0 0 0 .56.9l8 3.925a1 1 0 0 0 .88 0l8-3.925a1 1 0 0 0 .56-.9v-.787a1 1 0 0 0-1-1Z" />
                      </svg>
                      Cambiar sala
                    </a>
                  </li>
                )}
              </div>
              <div className="space-y-4 p-4">
                <li>
                  {user?.rol == "administrador" && (
                    <Link
                      to="/dashboard/crearUsuario"
                      className="group flex items-center hover:text-primary-600 dark:hover:text-primary-500"
                    >
                      <svg
                        className="me-2 h-3 w-3 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 18 18"
                      >
                        <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10ZM17 13h-2v-2a1 1 0 0 0-2 0v2h-2a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 0-2Z" />
                      </svg>
                      Crear Usuario
                    </Link>
                  )}
                </li>
                <li>
                  {user?.rol == "administrador" && (
                    <Link
                      to="/dashboard/registro-actividad"
                      className="group flex items-center hover:text-primary-600 dark:hover:text-primary-500"
                    >
                      <svg
                        className="me-2 h-3 w-3 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M18 2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM2 18V7h16v11H2Z" />
                        <path d="M8.5 8.5a1 1 0 1 0-2 0v2a1 1 0 0 0 2 0v-2Zm0 0" />
                        <path d="M10.5 8.5a1 1 0 1 0-2 0v2a1 1 0 0 0 2 0v-2Zm0 0" />
                        <path d="M12.5 8.5a1 1 0 1 0-2 0v2a1 1 0 0 0 2 0v-2Zm0 0" />
                      </svg>
                      Registro de Actividad
                    </Link>
                  )}
                </li>
                <li>
                  {user?.rol == "administrador" && (
                    <Link
                      to="/dashboard/gestionar-salas"
                      className="group flex items-center hover:text-primary-600 dark:hover:text-primary-500"
                    >
                      <svg
                        className="me-2 h-3 w-3 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M19 4h-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2H1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6h1a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1ZM4 16V4h12v12H4Z" />
                      </svg>
                      Gestionar Salas
                    </Link>
                  )}
                </li>
                <li>
                  {user?.rol == "administrador" && (
                    <Link
                      to="/dashboard/gestionar-especialidades"
                      className="group flex items-center hover:text-primary-600 dark:hover:text-primary-500"
                    >
                      <svg
                        className="me-2 h-3 w-3 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 0C4.486 0 0 4.486 0 10s4.486 10 10 10 10-4.486 10-10S15.514 0 10 0Zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8Z" />
                        <path d="M13 7h-2.5l-.5-1H7v2h2.5l.5 1H13a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2.5l-.5 1H7v2h2.5l.5-1H13a3 3 0 0 0 3-3v-2a3 3 0 0 0-3-3Z" />
                      </svg>
                      Gestionar Especialidades
                    </Link>
                  )}
                </li>
                <li>
                  {user?.rol == "enfermero" && (
                    <Link
                      to="/dashboard/crearPaciente"
                      className="group flex items-center hover:text-primary-600 dark:hover:text-primary-500"
                    >
                      <svg
                        className="me-2 h-3 w-3 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 18 18"
                      >
                        <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10ZM17 13h-2v-2a1 1 0 0 0-2 0v2h-2a1 1 0 0 0 0 2h2v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 0-2Z" />
                      </svg>
                      Crear Paciente
                    </Link>
                  )}
                </li>
              </div>
            </ul>
          </MegaMenuDropdown>
        )}

        {user?.rol === "medico" && (
          <MegaMenuDropdown
            toggle={<span className="text-white">Configuración</span>}
          >
            <ul className="grid grid-cols-1">
              <div className="space-y-4 p-4">
                <li>
                  <button
                    onClick={() => setShowModal(true)}
                    className="group flex items-center hover:text-primary-600 dark:hover:text-primary-500"
                  >
                    <svg
                      className="me-2 h-3 w-3 text-gray-400 group-hover:text-primary-600 dark:text-gray-500 dark:group-hover:text-primary-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                    </svg>
                    Cambiar Estado y Sala
                  </button>
                </li>
              </div>
            </ul>
          </MegaMenuDropdown>
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
