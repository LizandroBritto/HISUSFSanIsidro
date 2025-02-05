import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  Button,
} from "flowbite-react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

const DashboardTable = () => {
  const [viewMode, setViewMode] = useState("citas");
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));
  const [estadoAsc, setEstadoAsc] = useState(true);

  // Función para alternar entre vistas (citas y pacientes)
  const toggleView = () => {
    setViewMode((prev) => (prev === "citas" ? "pacientes" : "citas"));
  };

  // Función para cambiar el estado del paciente (activar/desactivar)
const toggleEstadoPaciente = async (id) => {
  const token = localStorage.getItem("token");

  // Mostrar alerta de confirmación
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "El paciente será desactivado y eliminado de la lista.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, confirmar",
    cancelButtonText: "Cancelar",
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch(`http://localhost:8000/api/pacientes/estado/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cambiar el estado del paciente");
      }

      const updatedPaciente = await response.json();

      // Mostrar alerta de éxito
      Swal.fire({
        title: "Estado actualizado",
        text: "El estado del paciente ha sido actualizado.",
        icon: "success",
      });

      // Actualizar la lista: reemplazar el paciente modificado y filtrar los que quedan inactivos.
      setData((prevData) =>
        prevData
          .map((p) => (p._id === updatedPaciente._id ? updatedPaciente : p))
          .filter((p) => p.estadoPaciente !== "Inactivo")
      );
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: "No se pudo cambiar el estado del paciente.",
        icon: "error",
      });
    }
  } else {
    // Si se cancela, opcionalmente puedes mostrar una notificación
    Swal.fire({
      title: "Cancelado",
      text: "La operación fue cancelada.",
      icon: "info",
    });
  }
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let url = "";
        if (viewMode === "pacientes") {
          url = search
            ? `http://localhost:8000/api/pacientes/cedula/${search}`
            : "http://localhost:8000/api/pacientes";
        } else {
          url = "http://localhost:8000/api/citas";
        }
        const token = localStorage.getItem("token");
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Error al obtener ${viewMode}`);
        let result = await response.json();
        // Si se busca por cédula en la vista de pacientes, se asegura de que sea un arreglo.
        if (viewMode === "pacientes" && search) {
          if (!result) result = [];
          else if (!Array.isArray(result)) result = [result];
        }
        // En la vista de citas, si se realiza búsqueda, se filtra por cédula en el objeto paciente.
        if (viewMode === "citas" && search) {
          result = result.filter(
            (cita) =>
              cita.paciente &&
              cita.paciente.cedula &&
              cita.paciente.cedula.includes(search)
          );
        }
        // En la vista de pacientes, filtramos los que tengan estadoPaciente "Inactivo"
        if (viewMode === "pacientes") {
          result = result.filter((paciente) => paciente.estadoPaciente !== "Inactivo");
        }
        setData(result);
        setError("");
      } catch (err) {
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    const debounceTimer = setTimeout(fetchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, viewMode]);

  // Ordenamiento para citas: prioridad: pendiente < confirmada < cancelada
  const sortPriority = (estado) => {
    if (estado === "pendiente") return 0;
    if (estado === "confirmada") return 1;
    if (estado === "cancelada") return 2;
    return 3;
  };

  const sortedData =
    viewMode === "citas"
      ? [...data].sort((a, b) =>
          estadoAsc
            ? sortPriority(a.estado) - sortPriority(b.estado)
            : sortPriority(b.estado) - sortPriority(a.estado)
        )
      : data;

  return (
    <div className="overflow-x-auto p-4">
      {/* Barra de búsqueda y botones de acción */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <TextInput
          type="text"
          placeholder={
            viewMode === "pacientes"
              ? "Buscar por número de cédula..."
              : "Buscar..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-grow"
        />
        {viewMode === "pacientes" && (
          <Button as={Link} to="/dashboard/crearPaciente" className="w-full sm:w-auto">
            Nuevo Paciente
          </Button>
        )}
        <Button onClick={toggleView} className="w-full sm:w-auto">
          {viewMode === "citas" ? "Mostrar Pacientes" : "Mostrar Citas"}
        </Button>
      </div>

      {loading && <p className="text-center text-gray-500">Cargando...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Tabla */}
      <Table hoverable className="shadow-lg">
        <TableHead>
          {viewMode === "pacientes" ? (
            <>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Nombre</TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Apellido</TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Cédula</TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Teléfono</TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Acciones</TableHeadCell>
            </>
          ) : (
            <>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Fecha</TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Hora</TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Paciente</TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Médico</TableHeadCell>
              <TableHeadCell
                className="bg-gray-50 dark:bg-gray-800 cursor-pointer"
                onClick={() => setEstadoAsc(!estadoAsc)}
                title="Ordenar por estado"
              >
                Estado {estadoAsc ? "▲" : "▼"}
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">Acciones</TableHeadCell>
            </>
          )}
        </TableHead>
        <TableBody className="divide-y">
          {viewMode === "pacientes"
            ? sortedData.map((paciente) => (
                <TableRow
                  key={paciente._id}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50"
                >
                  <TableCell className="font-medium text-gray-900 dark:text-white">{paciente.nombre}</TableCell>
                  <TableCell>{paciente.apellido}</TableCell>
                  <TableCell>{paciente.cedula}</TableCell>
                  <TableCell>{paciente.telefono}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button as={Link} to={`/crear-cita/${paciente._id}`} size="xs" color="success">
                        Crear Cita
                      </Button>
                      {user?.rol === "enfermero" && (
                        <Button as={Link} to={`/editar-paciente/${paciente._id}`} size="xs" color="warning">
                          Editar
                        </Button>
                      )}
                      <Button as={Link} to={`/paciente-detalle/${paciente._id}`} size="xs" color="info">
                        Ver Paciente
                      </Button>
                      <Button as={Link} to={`/paciente-citas/${paciente._id}`} size="xs" color="gray">
                        Ver Citas
                      </Button>
                      {user?.rol === "medico" &&  (
                        <Button
                          size="xs"
                          color={paciente.estadoPaciente === "Activo" ? "red" : "green"}
                          onClick={() => toggleEstadoPaciente(paciente._id)}
                        >
                          {paciente.estadoPaciente === "Activo" ? "Desactivar" : "Activar"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            : sortedData.map((cita) => (
                <TableRow
                  key={cita._id}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50"
                >
                  <TableCell>{new Date(cita.fecha).toLocaleDateString()}</TableCell>
                  <TableCell>{cita.hora}</TableCell>
                  <TableCell>{cita.paciente?.nombre} {cita.paciente?.apellido}</TableCell>
                  <TableCell>{cita.medico?.usuario?.nombre} {cita.medico?.usuario?.apellido}</TableCell>
                  <TableCell>{cita.estado}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user?.rol === "enfermero" && (
                        <Button as={Link} to={`/editar-cita/${cita._id}`} size="xs" color="warning">
                          Editar
                        </Button>
                      )}
                      {user?.rol === "enfermero" ? (
                        cita.estado === "confirmada" && (
                          <Button as={Link} to={`/cita-detalle/${cita._id}`} size="xs" color="info">
                            Ver Cita
                          </Button>
                        )
                      ) : (
                        <Button as={Link} to={`/cita-detalle/${cita._id}`} size="xs" color="info">
                          Ver Cita
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}  
        </TableBody>
      </Table>
      {!loading && data.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          No se encontraron {viewMode === "pacientes" ? "pacientes" : "citas pendientes"}
        </p>
      )}
    </div>
  );
};

export default DashboardTable;
