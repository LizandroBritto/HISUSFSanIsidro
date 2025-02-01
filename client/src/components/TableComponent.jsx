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

const DashboardTable = () => {
  // Estado para definir la vista actual: "citas" o "pacientes"
  // Se inicia mostrando las citas pendientes.
  const [viewMode, setViewMode] = useState("citas");
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Función para alternar entre las vistas.
  const toggleView = () => {
    setViewMode((prev) => (prev === "citas" ? "pacientes" : "citas"));
    setSearch(""); // Reiniciamos la búsqueda al cambiar de vista
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
          // Para citas, se obtienen todas y luego se filtran las pendientes.
          url = "http://localhost:8000/api/citas";
        }

        // Verifica que el token se esté obteniendo correctamente.
        const token = localStorage.getItem("token");

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Error al obtener ${viewMode}`);
        }
        let result = await response.json();
        // Si es citas, filtramos solo las pendientes
      
        setData(result);
        setError("");
      } catch (err) {
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    // Aplicamos un debounce para evitar llamadas excesivas
    const debounceTimer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, viewMode]);

  return (
    <div className="overflow-x-auto p-4">
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
        {/* Si se está en la vista de pacientes se muestra el botón para crear nuevo paciente */}
        {viewMode === "pacientes" && (
          <Button
            as={Link}
            to="/dashboard/crearPaciente"
            className="w-full sm:w-auto"
          >
            Nuevo Paciente
          </Button>
        )}
        {/* Botón para alternar entre vistas */}
        <Button onClick={toggleView} className="w-full sm:w-auto">
          {viewMode === "citas" ? "Mostrar Pacientes" : "Mostrar Citas"}
        </Button>
      </div>

      {loading && <p className="text-center text-gray-500">Cargando...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      <Table hoverable className="shadow-lg">
        <TableHead>
          {viewMode === "pacientes" ? (
            <>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Nombre
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Apellido
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Cédula
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Teléfono
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Acciones
              </TableHeadCell>
            </>
          ) : (
            <>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Fecha
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Hora
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Paciente
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Médico
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Estado
              </TableHeadCell>
              <TableHeadCell className="bg-gray-50 dark:bg-gray-800">
                Acciones
              </TableHeadCell>
            </>
          )}
        </TableHead>
        <TableBody className="divide-y">
          {viewMode === "pacientes"
            ? data.map((paciente) => (
                <TableRow
                  key={paciente._id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {paciente.nombre}
                  </TableCell>
                  <TableCell>{paciente.apellido}</TableCell>
                  <TableCell>{paciente.cedula}</TableCell>
                  <TableCell>{paciente.telefono}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        as={Link}
                        to={`/crear-cita/${paciente._id}`}
                        size="xs"
                        color="success"
                      >
                        Crear Cita
                      </Button>
                      <Button
                        as={Link}
                        to={`/editar-paciente/${paciente._id}`}
                        size="xs"
                        color="warning"
                      >
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            : data.map((cita) => (
                <TableRow
                  key={cita._id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {new Date(cita.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{cita.hora}</TableCell>
                  <TableCell>
                    {cita.paciente?.nombre
                      ? `${cita.paciente.nombre} ${cita.paciente.apellido}`
                      : cita.paciente}
                  </TableCell>
                  <TableCell>
                    {cita.medico?.usuario
                      ? `${cita.medico.usuario.nombre} ${cita.medico.usuario.apellido}`
                      : cita.medico}
                  </TableCell>
                  <TableCell>{cita.estado}</TableCell>
                  <TableCell>
                    {/* Ejemplo de acción: Editar cita */}
                    <div className="flex gap-2">
                      <Button
                        as={Link}
                        to={`/editar-cita/${cita._id}`}
                        size="xs"
                        color="warning"
                      >
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {!loading && data.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          No se encontraron{" "}
          {viewMode === "pacientes" ? "pacientes" : "citas pendientes"}
        </p>
      )}
    </div>
  );
};

export default DashboardTable;
