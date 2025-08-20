import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
} from "flowbite-react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

const TableAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/api/usuarios", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Agregar lógica adicional si necesitas obtener especialidades desde otra fuente
        setUsers(response.data);
      } catch (err) {
        setError("Error al cargar los usuarios");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
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
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el usuario", "error");
        console.error(error);
      }
    }
  };

  if (loading) return <p className="text-center">Cargando usuarios...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="overflow-x-auto p-4">
      <Table hoverable>
        <TableHead>
          <TableHeadCell>Nombre Completo</TableHeadCell>
          <TableHeadCell>CI</TableHeadCell>
          <TableHeadCell>Rol</TableHeadCell>
          <TableHeadCell>Especialidad</TableHeadCell>
          <TableHeadCell>Sala</TableHeadCell>
          <TableHeadCell>Acciones</TableHeadCell>
        </TableHead>
        <TableBody className="divide-y">
          {users.map((user) => (
            <TableRow
              key={user._id}
              className="bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              <TableCell className="font-medium text-gray-900 dark:text-white">
                {formatNombre(user)}
              </TableCell>
              <TableCell>{user.ci}</TableCell>
              <TableCell className="capitalize">{user.rol}</TableCell>
              <TableCell>{getEspecialidad(user)}</TableCell>
              <TableCell>{getSala(user)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    as={Link}
                    to={`/editar-usuario/${user._id}`}
                    color="blue"
                  >
                    Editar
                  </Button>
                  <Button
                    color="failure"
                    onClick={() => handleDelete(user._id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TableAdmin;
