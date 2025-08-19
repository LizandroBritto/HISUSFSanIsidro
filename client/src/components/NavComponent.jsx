import {
  Button,
  MegaMenu,
  MegaMenuDropdown,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";

import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";

const NavComponent = () => {
  const { user, logout } = useContext(UserContext);

  const navigate = useNavigate();

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
          {" "}
          Bienvenido{" "}
          {user.rol === "enfermero"
            ? "Enfermero"
            : user.rol === "medico"
            ? "Dr."
            : ""}{" "}
          {user.name}{" "}
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
        {user?.rol != "medico" && (
          <MegaMenuDropdown toggle={<>Opciones</>}>
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
      </NavbarCollapse>
    </MegaMenu>
  );
};

export default NavComponent;
