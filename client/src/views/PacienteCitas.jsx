import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Table, Button, Select, TextInput } from "flowbite-react";
import axios from "axios";

const PacienteCitas = () => {
  const { id } = useParams(); // id del paciente
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [citasOriginales, setCitasOriginales] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para filtros
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroMedico, setFiltroMedico] = useState("todos");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Obtener las citas del paciente
        const citasResponse = await axios.get(
          `http://localhost:8000/api/citas/paciente/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setCitas(citasResponse.data || []);
        setCitasOriginales(citasResponse.data || []);
        console.log("Citas obtenidas:", citasResponse.data);

        // Extraer especialidades únicas de las citas obtenidas
        const especialidadesUnicas = [];
        const especialidadesVistas = new Set();

        (citasResponse.data || []).forEach((cita) => {
          if (
            cita.medico?.especialidad &&
            !especialidadesVistas.has(cita.medico.especialidad._id)
          ) {
            especialidadesUnicas.push(cita.medico.especialidad);
            especialidadesVistas.add(cita.medico.especialidad._id);
          }
        });

        console.log(
          "Especialidades únicas de las citas:",
          especialidadesUnicas
        );
        setEspecialidades(especialidadesUnicas);

        // También extraer médicos únicos de las citas obtenidas
        const medicosUnicos = [];
        const medicosVistos = new Set();

        (citasResponse.data || []).forEach((cita) => {
          if (cita.medico && !medicosVistos.has(cita.medico._id)) {
            medicosUnicos.push(cita.medico);
            medicosVistos.add(cita.medico._id);
          }
        });

        console.log("Médicos únicos de las citas:", medicosUnicos);
        setMedicos(medicosUnicos);

        setError("");
      } catch (err) {
        console.error("Error al obtener datos:", err);
        setError("Error al obtener los datos");
        // Asegurar que los arrays estén inicializados incluso si hay error
        setCitas([]);
        setCitasOriginales([]);
        setMedicos([]);
        setEspecialidades([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Aplicar filtros cada vez que cambien
  useEffect(() => {
    let filteredCitas = [...citasOriginales];

    // Filtrar por rango de fechas
    if (fechaDesde || fechaHasta) {
      filteredCitas = filteredCitas.filter((cita) => {
        const fechaCita = new Date(cita.fecha);
        let cumpleDesde = true;
        let cumpleHasta = true;

        if (fechaDesde) {
          const desde = new Date(fechaDesde);
          cumpleDesde = fechaCita >= desde;
        }

        if (fechaHasta) {
          const hasta = new Date(fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          cumpleHasta = fechaCita <= hasta;
        }

        return cumpleDesde && cumpleHasta;
      });
    }

    // Filtrar por estado
    if (filtroEstado !== "todos") {
      filteredCitas = filteredCitas.filter(
        (cita) => cita.estado === filtroEstado
      );
    }

    // Filtrar por médico
    if (filtroMedico !== "todos") {
      filteredCitas = filteredCitas.filter(
        (cita) => cita.medico?._id === filtroMedico
      );
    }

    // Filtrar por especialidad
    if (filtroEspecialidad !== "todos") {
      filteredCitas = filteredCitas.filter(
        (cita) => cita.medico?.especialidad?._id === filtroEspecialidad
      );
    }

    setCitas(filteredCitas);
  }, [
    fechaDesde,
    fechaHasta,
    filtroEstado,
    filtroMedico,
    filtroEspecialidad,
    citasOriginales,
  ]);

  if (loading) return <p className="text-center">Cargando citas...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="overflow-x-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Citas del Paciente</h1>

      {/* Filtros */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Filtros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Filtro de fecha desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Desde
            </label>
            <TextInput
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              placeholder="Fecha inicial"
            />
          </div>

          {/* Filtro de fecha hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hasta
            </label>
            <TextInput
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              placeholder="Fecha final"
            />
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
            </Select>
          </div>

          {/* Filtro por médico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Médico
            </label>
            <Select
              value={filtroMedico}
              onChange={(e) => setFiltroMedico(e.target.value)}
            >
              <option value="todos">Todos los médicos</option>
              {loading ? (
                <option disabled>Cargando médicos...</option>
              ) : (
                Array.isArray(medicos) &&
                medicos.map((medico) => (
                  <option key={medico._id} value={medico._id}>
                    {medico.usuario?.nombre} {medico.usuario?.apellido}
                  </option>
                ))
              )}
            </Select>
          </div>

          {/* Filtro por especialidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Especialidad
            </label>
            <Select
              value={filtroEspecialidad}
              onChange={(e) => setFiltroEspecialidad(e.target.value)}
            >
              <option value="todos">Todas las especialidades</option>
              {loading ? (
                <option disabled>Cargando especialidades...</option>
              ) : (
                Array.isArray(especialidades) &&
                especialidades.map((especialidad) => (
                  <option key={especialidad._id} value={especialidad._id}>
                    {especialidad.nombre}
                  </option>
                ))
              )}
            </Select>
          </div>
        </div>

        {/* Botón para limpiar filtros */}
        <div className="mt-4">
          <Button
            color="gray"
            size="sm"
            onClick={() => {
              setFechaDesde("");
              setFechaHasta("");
              setFiltroEstado("todos");
              setFiltroMedico("todos");
              setFiltroEspecialidad("todos");
            }}
          >
            Limpiar Filtros
          </Button>
        </div>
      </div>
      {/* Información de resultados */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Mostrando {citas.length} de {citasOriginales.length} citas
      </div>

      {citas.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {citasOriginales.length === 0
              ? "No se encontraron citas para este paciente."
              : "No se encontraron citas con los filtros aplicados."}
          </p>
        </div>
      ) : (
        <Table hoverable className="shadow-lg">
          <Table.Head>
            <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">
              Fecha
            </Table.HeadCell>
            <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">
              Hora
            </Table.HeadCell>
            <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">
              Médico
            </Table.HeadCell>
            <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">
              Especialidad
            </Table.HeadCell>
            <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">
              Estado
            </Table.HeadCell>
            <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">
              Acciones
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {citas.map((cita) => (
              <Table.Row
                key={cita._id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Table.Cell className="font-medium">
                  {new Date(cita.fecha).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell>{cita.hora}</Table.Cell>
                <Table.Cell>
                  {cita.medico?.usuario?.nombre}{" "}
                  {cita.medico?.usuario?.apellido}
                </Table.Cell>
                <Table.Cell>
                  {cita.medico?.especialidad?.nombre || "Sin especialidad"}
                </Table.Cell>
                <Table.Cell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      cita.estado === "confirmada"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : cita.estado === "pendiente"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        : cita.estado === "cancelada"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    }`}
                  >
                    {cita.estado}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    as={Link}
                    to={`/cita-detalle/${cita._id}`}
                    size="xs"
                    color="info"
                  >
                    Ver Detalle
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      <Button
        onClick={() => navigate("/dashboard")}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
      >
        Volver al Dashboard
      </Button>
    </div>
  );
};

export default PacienteCitas;
