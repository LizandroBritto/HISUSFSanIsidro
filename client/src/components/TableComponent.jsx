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
  Select,
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

  // Nuevos estados para filtros y ordenamiento
  const [filtroEstado, setFiltroEstado] = useState(
    user?.rol === "medico" ? "pendiente" : "todos"
  );
  const [ordenFecha, setOrdenFecha] = useState("reciente"); // "reciente" o "antiguo"

  // Estados para filtro de rango de fechas
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

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
        const response = await fetch(
          `http://localhost:8000/api/pacientes/estado/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
        let result = [];

        if (viewMode === "pacientes") {
          // Para pacientes, siempre obtener todos y filtrar localmente
          url = "http://localhost:8000/api/pacientes";
          const token = localStorage.getItem("token");
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error(`Error al obtener ${viewMode}`);
          result = await response.json();

          // Si hay búsqueda, filtrar por cédula, nombre o apellido
          if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(
              (paciente) =>
                paciente.cedula?.includes(search) ||
                paciente.nombre?.toLowerCase().includes(searchLower) ||
                paciente.apellido?.toLowerCase().includes(searchLower)
            );
          }
        } else {
          // Para citas, verificar si es médico y obtener solo sus citas
          if (user?.rol === "medico") {
            // Primero obtener el ID del médico usando el user._id
            const token = localStorage.getItem("token");
            const medicoResponse = await fetch(
              `http://localhost:8000/api/medicos/usuario/${user._id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (medicoResponse.ok) {
              const medicoData = await medicoResponse.json();
              // Ahora obtener solo las citas de este médico
              url = `http://localhost:8000/api/citas/medico/${medicoData._id}`;
            } else {
              throw new Error("Error al obtener datos del médico");
            }
          } else {
            // Para administradores y otros roles, obtener todas las citas
            url = "http://localhost:8000/api/citas";
          }

          const token = localStorage.getItem("token");
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error(`Error al obtener ${viewMode}`);
          result = await response.json();

          // En la vista de citas, búsqueda mejorada por nombre, apellido y CI del paciente
          if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(
              (cita) =>
                cita.paciente &&
                (cita.paciente.cedula?.includes(search) ||
                  cita.paciente.nombre?.toLowerCase().includes(searchLower) ||
                  cita.paciente.apellido?.toLowerCase().includes(searchLower))
            );
          }
        }

        // En la vista de pacientes, filtramos los que tengan estadoPaciente "Inactivo"
        if (viewMode === "pacientes") {
          result = result.filter(
            (paciente) => paciente.estadoPaciente !== "Inactivo"
          );
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
  }, [
    search,
    viewMode,
    user?._id,
    user?.rol,
    filtroEstado,
    ordenFecha,
    fechaDesde,
    fechaHasta,
  ]);

  // Función para filtrar y ordenar los datos
  const getProcessedData = () => {
    let processed = [...data];

    // Solo aplicar filtros y ordenamiento a las citas
    if (viewMode === "citas") {
      // Filtrar por estado
      if (filtroEstado !== "todos") {
        processed = processed.filter((cita) => cita.estado === filtroEstado);
      }

      // Filtrar por rango de fechas
      if (fechaDesde || fechaHasta) {
        processed = processed.filter((cita) => {
          const fechaCita = new Date(cita.fecha);
          let cumpleDesde = true;
          let cumpleHasta = true;

          if (fechaDesde) {
            const desde = new Date(fechaDesde);
            cumpleDesde = fechaCita >= desde;
          }

          if (fechaHasta) {
            const hasta = new Date(fechaHasta);
            // Agregar 23:59:59 al día "hasta" para incluir todo el día
            hasta.setHours(23, 59, 59, 999);
            cumpleHasta = fechaCita <= hasta;
          }

          return cumpleDesde && cumpleHasta;
        });
      }

      // Ordenar por fecha y hora
      processed.sort((a, b) => {
        try {
          // Convertir fecha a objeto Date
          const fechaA = new Date(a.fecha);
          const fechaB = new Date(b.fecha);

          // Parsear la hora (formato esperado: "HH:MM" o "HH:MM:SS")
          const horaPartsA = a.hora.split(":").map((num) => parseInt(num, 10));
          const horaPartsB = b.hora.split(":").map((num) => parseInt(num, 10));

          // Crear objetos Date completos combinando fecha y hora
          const fechaHoraA = new Date(
            fechaA.getFullYear(),
            fechaA.getMonth(),
            fechaA.getDate(),
            horaPartsA[0] || 0, // horas
            horaPartsA[1] || 0, // minutos
            horaPartsA[2] || 0 // segundos (opcional)
          );

          const fechaHoraB = new Date(
            fechaB.getFullYear(),
            fechaB.getMonth(),
            fechaB.getDate(),
            horaPartsB[0] || 0, // horas
            horaPartsB[1] || 0, // minutos
            horaPartsB[2] || 0 // segundos (opcional)
          );

          if (ordenFecha === "reciente") {
            return fechaHoraB.getTime() - fechaHoraA.getTime(); // Más reciente primero
          } else {
            return fechaHoraA.getTime() - fechaHoraB.getTime(); // Más antiguo primero
          }
        } catch (error) {
          console.error("Error al ordenar citas por fecha/hora:", error, {
            a,
            b,
          });
          return 0; // En caso de error, mantener orden original
        }
      });
    }

    return processed;
  };

  const sortedData = getProcessedData();

  return (
    <div className="overflow-x-auto p-4">
      {/* Barra de búsqueda y botones de acción */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <TextInput
          type="text"
          placeholder={
            viewMode === "pacientes"
              ? "Buscar por cédula, nombre o apellido..."
              : "Buscar por cédula, nombre o apellido del paciente..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-grow"
        />
        {viewMode === "pacientes" && (
          <Button
            as={Link}
            to="/dashboard/crearPaciente"
            className="w-full sm:w-auto"
          >
            Nuevo Paciente
          </Button>
        )}
        <Button onClick={toggleView} className="w-full sm:w-auto">
          {viewMode === "citas" ? "Mostrar Pacientes" : "Mostrar Citas"}
        </Button>
      </div>

      {/* Filtros para citas */}
      {viewMode === "citas" && (
        <>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Filtrar por estado:
              </label>
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
              </Select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Ordenar por fecha:
              </label>
              <Select
                value={ordenFecha}
                onChange={(e) => setOrdenFecha(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="reciente">Más reciente primero</option>
                <option value="antiguo">Más antiguo primero</option>
              </Select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Desde fecha:
              </label>
              <TextInput
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full sm:w-48"
                placeholder="Fecha inicial"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Hasta fecha:
              </label>
              <TextInput
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full sm:w-48"
                placeholder="Fecha final"
              />
            </div>

            <div className="flex flex-col justify-end">
              <Button
                onClick={() => {
                  setFechaDesde("");
                  setFechaHasta("");
                }}
                className="w-full sm:w-auto mb-2"
                color="gray"
              >
                Limpiar fechas
              </Button>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Filtros rápidos:
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="xs"
                  color="blue"
                  onClick={() => {
                    const hoy = new Date().toISOString().split("T")[0];
                    setFechaDesde(hoy);
                    setFechaHasta(hoy);
                  }}
                >
                  Hoy
                </Button>
                <Button
                  size="xs"
                  color="blue"
                  onClick={() => {
                    const hoy = new Date();
                    const ayer = new Date(hoy);
                    ayer.setDate(hoy.getDate() - 1);
                    const semana = new Date(hoy);
                    semana.setDate(hoy.getDate() - 7);
                    setFechaDesde(semana.toISOString().split("T")[0]);
                    setFechaHasta(hoy.toISOString().split("T")[0]);
                  }}
                >
                  Última semana
                </Button>
                <Button
                  size="xs"
                  color="blue"
                  onClick={() => {
                    const hoy = new Date();
                    const mes = new Date(hoy);
                    mes.setDate(1); // Primer día del mes
                    setFechaDesde(mes.toISOString().split("T")[0]);
                    setFechaHasta(hoy.toISOString().split("T")[0]);
                  }}
                >
                  Este mes
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {loading && <p className="text-center text-gray-500">Cargando...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Contador de resultados para citas */}
      {viewMode === "citas" && !loading && !error && (
        <div className="mb-4 text-sm text-gray-600">
          {(() => {
            let texto = `Mostrando ${sortedData.length} citas`;

            // Agregar información del filtro de estado
            if (filtroEstado !== "todos") {
              texto += ` con estado "${filtroEstado}"`;
            }

            // Agregar información del filtro de fechas
            if (fechaDesde && fechaHasta) {
              texto += ` del ${fechaDesde} al ${fechaHasta}`;
            } else if (fechaDesde) {
              texto += ` desde ${fechaDesde}`;
            } else if (fechaHasta) {
              texto += ` hasta ${fechaHasta}`;
            }

            texto += ` de ${data.length} totales`;
            return texto;
          })()}
        </div>
      )}

      {/* Tabla */}
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
                Estado
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
            ? sortedData.map((paciente) => (
                <TableRow
                  key={paciente._id}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50"
                >
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {paciente.nombre}
                  </TableCell>
                  <TableCell>{paciente.apellido}</TableCell>
                  <TableCell>{paciente.cedula}</TableCell>
                  <TableCell>{paciente.telefono}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        paciente.estadoPaciente === "Activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {paciente.estadoPaciente}
                    </span>
                  </TableCell>
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
                      {user?.rol === "enfermero" && (
                        <Button
                          as={Link}
                          to={`/editar-paciente/${paciente._id}`}
                          size="xs"
                          color="warning"
                        >
                          Editar
                        </Button>
                      )}
                      <Button
                        as={Link}
                        to={`/paciente-detalle/${paciente._id}`}
                        size="xs"
                        color="info"
                      >
                        Ver Paciente
                      </Button>
                      <Button
                        as={Link}
                        to={`/paciente-citas/${paciente._id}`}
                        size="xs"
                        color="gray"
                      >
                        Ver Citas
                      </Button>
                      {user?.rol === "medico" && (
                        <Button
                          size="xs"
                          color={
                            paciente.estadoPaciente === "Activo"
                              ? "red"
                              : "green"
                          }
                          onClick={() => toggleEstadoPaciente(paciente._id)}
                        >
                          {paciente.estadoPaciente === "Activo"
                            ? "Desactivar"
                            : "Activar"}
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
                  <TableCell>
                    {new Date(cita.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{cita.hora}</TableCell>
                  <TableCell>
                    {cita.paciente?.nombre} {cita.paciente?.apellido}
                  </TableCell>
                  <TableCell>
                    {cita.medico?.usuario?.nombre}{" "}
                    {cita.medico?.usuario?.apellido}
                  </TableCell>
                  <TableCell>{cita.estado}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user?.rol === "enfermero" && (
                        <Button
                          as={Link}
                          to={`/editar-cita/${cita._id}`}
                          size="xs"
                          color="warning"
                        >
                          Editar
                        </Button>
                      )}
                      {user?.rol === "enfermero" ? (
                        cita.estado === "confirmada" && (
                          <Button
                            as={Link}
                            to={`/cita-detalle/${cita._id}`}
                            size="xs"
                            color="info"
                          >
                            Ver Cita
                          </Button>
                        )
                      ) : (
                        <Button
                          as={Link}
                          to={`/cita-detalle/${cita._id}`}
                          size="xs"
                          color="info"
                        >
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
          No se encontraron{" "}
          {viewMode === "pacientes" ? "pacientes" : "citas pendientes"}
        </p>
      )}
    </div>
  );
};

export default DashboardTable;
