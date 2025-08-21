import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
  Card,
  TextInput,
  Select,
} from "flowbite-react";
import { Link } from "react-router-dom";
import {
  HiUser,
  HiUserGroup,
  HiAcademicCap,
  HiOfficeBuilding,
  HiSearch,
  HiFilter,
  HiUsers,
} from "react-icons/hi";
import Swal from "sweetalert2";
import axios from "axios";

const TableAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({
    rol: "",
    especialidad: "",
  });

  // Estados para los datos de filtros
  const [especialidades, setEspecialidades] = useState([]);

  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    administradores: 0,
    medicos: 0,
    enfermeros: 0,
    especialidades: 0,
    salas: 0,
    pacientesActivos: 0,
  });

  // Función para formatear el nombre completo
  const formatNombre = (user) => {
    if (!user.nombre && !user.apellido) return "Admin";
    return `${user.nombre || ""} ${user.apellido || ""}`.trim();
  };

  // Función para obtener la especialidad
  const getEspecialidad = (user) => {
    return user.rol === "medico"
      ? user.especialidad || "Sin especialidad"
      : "No aplica";
  };

  // Función para obtener la sala
  const getSala = (user) => {
    return user.rol === "medico" ? user.sala || "Sin sala" : "No aplica";
  };

  // Función para filtrar usuarios
  const filteredUsers = Array.isArray(users)
    ? users.filter((user) => {
        const matchesSearch =
          formatNombre(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.ci &&
            user.ci.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.rol === "medico" &&
            user.especialidad &&
            user.especialidad
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (user.rol === "medico" &&
            user.sala &&
            user.sala.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRol = !filtros.rol || user.rol === filtros.rol;
        const matchesEspecialidad =
          !filtros.especialidad ||
          (user.rol === "medico" && user.especialidad === filtros.especialidad);

        return matchesSearch && matchesRol && matchesEspecialidad;
      })
    : [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Obtener usuarios
        const usersResponse = await axios.get(
          "http://localhost:8000/api/usuarios",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Obtener especialidades
        const especialidadesResponse = await axios.get(
          "http://localhost:8000/api/especialidades",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Obtener salas
        const salasResponse = await axios.get(
          "http://localhost:8000/api/salas",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Obtener pacientes activos
        const pacientesResponse = await axios.get(
          "http://localhost:8000/api/pacientes",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);

        // Manejar respuesta de especialidades (viene envuelto en { success, data })
        const especialidadesData =
          especialidadesResponse.data?.data || especialidadesResponse.data;
        setEspecialidades(
          Array.isArray(especialidadesData) ? especialidadesData : []
        );

        // Manejar respuesta de salas (viene envuelto en { success, data })
        const salasData = salasResponse.data?.data || salasResponse.data;

        // Calcular estadísticas
        const usersByRole = Array.isArray(usersResponse.data)
          ? usersResponse.data.reduce((acc, user) => {
              acc[user.rol] = (acc[user.rol] || 0) + 1;
              return acc;
            }, {})
          : {};

        // Contar pacientes activos
        const pacientesActivos = Array.isArray(pacientesResponse.data)
          ? pacientesResponse.data.filter(
              (paciente) => paciente.estadoPaciente === "Activo"
            ).length
          : 0;

        setEstadisticas({
          administradores: usersByRole.administrador || 0,
          medicos: usersByRole.medico || 0,
          enfermeros: usersByRole.enfermero || 0,
          especialidades: Array.isArray(especialidadesData)
            ? especialidadesData.length
            : 0,
          salas: Array.isArray(salasData) ? salasData.length : 0,
          pacientesActivos: pacientesActivos,
        });
      } catch (err) {
        setError("Error al cargar los datos");
        console.error("Error en TableAdmin:", err);
        // Asegurar que los arrays estén inicializados aunque haya error
        setUsers([]);
        setEspecialidades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (userId) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:8000/api/usuarios/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(users.filter((user) => user._id !== userId));
        Swal.fire("¡Eliminado!", "El usuario ha sido eliminado.", "success");

        // Recalcular estadísticas
        const updatedUsers = users.filter((user) => user._id !== userId);
        const usersByRole = updatedUsers.reduce((acc, user) => {
          acc[user.rol] = (acc[user.rol] || 0) + 1;
          return acc;
        }, {});

        setEstadisticas((prev) => ({
          ...prev,
          administradores: usersByRole.administrador || 0,
          medicos: usersByRole.medico || 0,
          enfermeros: usersByRole.enfermero || 0,
        }));
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el usuario", "error");
        console.error(error);
      }
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltros({ rol: "", especialidad: "" });
  };

  if (loading) return <p className="text-center">Cargando datos...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 dark:text-white">
            Panel de Administración
          </h1>
          <p className="text-gray-300 dark:text-gray-300 mt-1">
            Gestión completa del sistema hospitalario
          </p>
        </div>
        <Button as={Link} to="/dashboard/crearUsuario" color="success">
          <HiUser className="w-4 h-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <HiUser className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                Administradores
              </p>
              <p className="text-2xl font-bold text-gray-100 dark:text-white">
                {estadisticas.administradores}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <HiAcademicCap className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                Médicos
              </p>
              <p className="text-2xl font-bold text-gray-100 dark:text-white">
                {estadisticas.medicos}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <HiUserGroup className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                Enfermeros
              </p>
              <p className="text-2xl font-bold text-gray-100 dark:text-white">
                {estadisticas.enfermeros}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <HiAcademicCap className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                Especialidades
              </p>
              <p className="text-2xl font-bold text-gray-100 dark:text-white">
                {estadisticas.especialidades}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <HiOfficeBuilding className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                Salas
              </p>
              <p className="text-2xl font-bold text-gray-100 dark:text-white">
                {estadisticas.salas}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-full">
              <HiUsers className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                Pacientes Activos
              </p>
              <p className="text-2xl font-bold text-gray-100 dark:text-white">
                {estadisticas.pacientesActivos}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Búsqueda y Filtros */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100 dark:text-white flex items-center">
            <HiFilter className="w-5 h-5 mr-2" />
            Búsqueda y Filtros
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Barra de búsqueda */}
            <TextInput
              icon={HiSearch}
              placeholder="Buscar por nombre, CI, especialidad, sala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2"
            />

            {/* Filtro por rol */}
            <Select
              value={filtros.rol}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, rol: e.target.value }))
              }
            >
              <option value="">Todos los roles</option>
              <option value="administrador">Administrador</option>
              <option value="medico">Médico</option>
              <option value="enfermero">Enfermero</option>
            </Select>

            {/* Filtro por especialidad */}
            <Select
              value={filtros.especialidad}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  especialidad: e.target.value,
                }))
              }
            >
              <option value="">Todas las especialidades</option>
              {Array.isArray(especialidades) &&
                especialidades.map((esp) => (
                  <option key={esp._id} value={esp.nombre}>
                    {esp.nombre}
                  </option>
                ))}
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-300">
              Mostrando {filteredUsers ? filteredUsers.length : 0} de{" "}
              {Array.isArray(users) ? users.length : 0} usuarios
            </p>
            <Button onClick={limpiarFiltros} color="gray" size="sm">
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabla de usuarios */}
      <div className="overflow-x-auto">
        <Table hoverable className="shadow-lg">
          <TableHead>
            <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
              Nombre Completo
            </TableHeadCell>
            <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
              CI
            </TableHeadCell>
            <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
              Rol
            </TableHeadCell>
            <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
              Especialidad
            </TableHeadCell>
            <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
              Sala
            </TableHeadCell>
            <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
              Acciones
            </TableHeadCell>
          </TableHead>
          <TableBody className="divide-y">
            {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow
                  key={user._id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50"
                >
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {formatNombre(user)}
                  </TableCell>
                  <TableCell>{user.ci}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.rol === "administrador"
                          ? "bg-blue-100 text-blue-800"
                          : user.rol === "medico"
                          ? "bg-green-100 text-green-800"
                          : user.rol === "enfermero"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.rol}
                    </span>
                  </TableCell>
                  <TableCell>{getEspecialidad(user)}</TableCell>
                  <TableCell>{getSala(user)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        as={Link}
                        to={`/editar-usuario/${user._id}`}
                        color="blue"
                        size="xs"
                      >
                        Editar
                      </Button>
                      <Button
                        color="failure"
                        size="xs"
                        onClick={() => handleDelete(user._id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="6" className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No se encontraron usuarios que coincidan con los criterios
                    de búsqueda
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TableAdmin;
