import { useState, useEffect } from "react";
import {
  Table,
  Badge,
  Card,
  TextInput,
  Select,
  Button,
  Pagination,
  Alert,
  Modal,
} from "flowbite-react";
import {
  HiFilter,
  HiEye,
  HiCalendar,
  HiUser,
  HiCog,
  HiDownload,
} from "react-icons/hi";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const RegistroActividad = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtros, setFiltros] = useState({
    accion: "",
    entidad: "",
    fechaInicio: "",
    fechaFin: "",
    exitoso: "",
  });
  const [estadisticas, setEstadisticas] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Mapeo de acciones a colores y textos amigables
  const accionesConfig = {
    CREAR_USUARIO: { color: "success", text: "Crear Usuario", icon: "👤" },
    EDITAR_USUARIO: { color: "info", text: "Editar Usuario", icon: "✏️" },
    ELIMINAR_USUARIO: {
      color: "failure",
      text: "Eliminar Usuario",
      icon: "🗑️",
    },
    LOGIN: { color: "success", text: "Iniciar Sesión", icon: "🔐" },
    LOGOUT: { color: "gray", text: "Cerrar Sesión", icon: "🚪" },
    CREAR_PACIENTE: { color: "success", text: "Crear Paciente", icon: "🏥" },
    EDITAR_PACIENTE: { color: "info", text: "Editar Paciente", icon: "✏️" },
    CREAR_CITA: { color: "success", text: "Crear Cita", icon: "📅" },
    EDITAR_CITA: { color: "info", text: "Editar Cita", icon: "📝" },
    CANCELAR_CITA: { color: "failure", text: "Cancelar Cita", icon: "❌" },
    CONFIRMAR_CITA: { color: "success", text: "Confirmar Cita", icon: "✅" },
    COMPLETAR_CITA: { color: "purple", text: "Completar Cita", icon: "✔️" },
    CREAR_SALA: { color: "success", text: "Crear Sala", icon: "🏢" },
    EDITAR_SALA: { color: "info", text: "Editar Sala", icon: "✏️" },
    ELIMINAR_SALA: { color: "failure", text: "Eliminar Sala", icon: "🗑️" },
    CREAR_ESPECIALIDAD: {
      color: "success",
      text: "Crear Especialidad",
      icon: "🩺",
    },
    EDITAR_ESPECIALIDAD: {
      color: "info",
      text: "Editar Especialidad",
      icon: "✏️",
    },
    ELIMINAR_ESPECIALIDAD: {
      color: "failure",
      text: "Eliminar Especialidad",
      icon: "🗑️",
    },
  };

  const entidadesConfig = {
    Usuario: { color: "blue", icon: "👤" },
    Paciente: { color: "green", icon: "🏥" },
    Cita: { color: "yellow", icon: "📅" },
    Medico: { color: "purple", icon: "👨‍⚕️" },
    Enfermero: { color: "pink", icon: "👩‍⚕️" },
    Sistema: { color: "gray", icon: "⚙️" },
    Sala: { color: "indigo", icon: "🏢" },
    Especialidad: { color: "teal", icon: "🩺" },
  };

  // Cargar logs
  const cargarLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...filtros,
      });

      const response = await axios.get(
        `http://localhost:8000/api/logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setLogs(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setCurrentPage(response.data.pagination.currentPage);
      }
    } catch (error) {
      console.error("Error al cargar logs:", error);
      setError("Error al cargar el registro de actividad");
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const params = new URLSearchParams(filtros);
      const response = await axios.get(
        `http://localhost:8000/api/logs/estadisticas?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  useEffect(() => {
    const loadInitialData = () => {
      cargarLogs();
      cargarEstadisticas();
    };
    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadFilteredData = () => {
      cargarLogs(1);
      cargarEstadisticas();
    };
    loadFilteredData();
  }, [filtros]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      accion: "",
      entidad: "",
      fechaInicio: "",
      fechaFin: "",
      exitoso: "",
    });
  };

  const descargarExcel = async () => {
    try {
      const params = new URLSearchParams(filtros);
      const response = await axios.get(
        `http://localhost:8000/api/logs/descargar-excel?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob", // Importante para descargar archivos
        }
      );

      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Obtener el nombre del archivo de la respuesta (si está disponible)
      const contentDisposition = response.headers["content-disposition"];
      let fileName = "registro-actividad.xlsx";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar Excel:", error);
      setError("Error al descargar el archivo Excel");
    }
  };

  const verDetalle = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const formatearFecha = (fecha) => {
    return format(new Date(fecha), "dd/MM/yyyy HH:mm:ss", { locale: es });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 dark:text-white">
            Registro de Actividad
          </h1>
          <p className="text-gray-300 dark:text-gray-300 mt-1">
            Monitor de todas las actividades del sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <HiCog className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-300">Solo administradores</span>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <HiUser className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                  Total Actividades
                </p>
                <p className="text-2xl font-bold text-gray-100 dark:text-white">
                  {estadisticas.totalLogs}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <HiCalendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                  Hoy
                </p>
                <p className="text-2xl font-bold text-gray-100 dark:text-white">
                  {estadisticas.actividadPorDia?.[
                    estadisticas.actividadPorDia.length - 1
                  ]?.count || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <HiEye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                  Usuarios Activos
                </p>
                <p className="text-2xl font-bold text-gray-100 dark:text-white">
                  {estadisticas.usuariosActivosReales || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <HiFilter className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                  Entidades
                </p>
                <p className="text-2xl font-bold text-gray-100 dark:text-white">
                  {estadisticas.estadisticasPorEntidad?.length || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-full">
                <HiUser className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300 dark:text-gray-300">
                  En Logs
                </p>
                <p className="text-2xl font-bold text-gray-100 dark:text-white">
                  {estadisticas.estadisticasPorUsuario?.length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-100 dark:text-white flex items-center">
            <HiFilter className="w-5 h-5 mr-2" />
            Filtros
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Select
              value={filtros.accion}
              onChange={(e) => handleFiltroChange("accion", e.target.value)}
            >
              <option value="">Todas las acciones</option>
              {Object.entries(accionesConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.text}
                </option>
              ))}
            </Select>

            <Select
              value={filtros.entidad}
              onChange={(e) => handleFiltroChange("entidad", e.target.value)}
            >
              <option value="">Todas las entidades</option>
              {Object.keys(entidadesConfig).map((entidad) => (
                <option key={entidad} value={entidad}>
                  {entidad}
                </option>
              ))}
            </Select>

            <TextInput
              type="date"
              placeholder="Fecha inicio"
              value={filtros.fechaInicio}
              onChange={(e) =>
                handleFiltroChange("fechaInicio", e.target.value)
              }
            />

            <TextInput
              type="date"
              placeholder="Fecha fin"
              value={filtros.fechaFin}
              onChange={(e) => handleFiltroChange("fechaFin", e.target.value)}
            />

            <Select
              value={filtros.exitoso}
              onChange={(e) => handleFiltroChange("exitoso", e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="true">Exitosos</option>
              <option value="false">Con errores</option>
            </Select>

            <Button onClick={limpiarFiltros} color="gray">
              Limpiar Filtros
            </Button>

            <Button onClick={descargarExcel} color="green" disabled={loading}>
              <HiDownload className="w-4 h-4 mr-2" />
              Descargar Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert color="failure">
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      {/* Tabla de Logs */}
      <Card>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Fecha/Hora</Table.HeadCell>
              <Table.HeadCell>Usuario</Table.HeadCell>
              <Table.HeadCell>Acción</Table.HeadCell>
              <Table.HeadCell>Entidad</Table.HeadCell>
              <Table.HeadCell>Descripción</Table.HeadCell>
              <Table.HeadCell>Estado</Table.HeadCell>
              <Table.HeadCell>Acciones</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {logs.map((log) => (
                <Table.Row
                  key={log._id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-100 dark:text-white">
                    <div className="text-sm text-gray-100 dark:text-white">
                      {formatearFecha(log.createdAt)}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-100 dark:text-white">
                          {log.usuarioNombre}
                        </div>
                        <div className="text-sm text-gray-300 dark:text-gray-300">
                          {log.usuarioRol}
                        </div>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={accionesConfig[log.accion]?.color || "gray"}
                      className="flex items-center"
                    >
                      <span className="mr-1">
                        {accionesConfig[log.accion]?.icon}
                      </span>
                      {accionesConfig[log.accion]?.text || log.accion}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={entidadesConfig[log.entidad]?.color || "gray"}
                    >
                      <span className="mr-1">
                        {entidadesConfig[log.entidad]?.icon}
                      </span>
                      {log.entidad}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-sm text-gray-100 dark:text-white max-w-xs truncate">
                      {log.descripcion}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={log.exitoso ? "success" : "failure"}>
                      {log.exitoso ? "✅ Exitoso" : "❌ Error"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="sm"
                      color="blue"
                      onClick={() => verDetalle(log)}
                    >
                      <HiEye className="w-4 h-4" />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                cargarLogs(page);
              }}
              showIcons
            />
          </div>
        )}
      </Card>

      {/* Modal de Detalle */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="2xl">
        <Modal.Header>Detalle de Actividad</Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 dark:text-gray-200">
                    Fecha/Hora
                  </label>
                  <p className="text-sm text-gray-100 dark:text-white">
                    {formatearFecha(selectedLog.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 dark:text-gray-200">
                    Usuario
                  </label>
                  <p className="text-sm text-gray-100 dark:text-white">
                    {selectedLog.usuarioNombre} ({selectedLog.usuarioRol})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 dark:text-gray-200">
                    Acción
                  </label>
                  <Badge
                    color={accionesConfig[selectedLog.accion]?.color || "gray"}
                  >
                    {accionesConfig[selectedLog.accion]?.text ||
                      selectedLog.accion}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 dark:text-gray-200">
                    Entidad
                  </label>
                  <Badge
                    color={
                      entidadesConfig[selectedLog.entidad]?.color || "gray"
                    }
                  >
                    {selectedLog.entidad}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 dark:text-gray-200">
                  Descripción
                </label>
                <p className="text-sm text-gray-100 dark:text-white">
                  {selectedLog.descripcion}
                </p>
              </div>

              {selectedLog.ip && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 dark:text-gray-200">
                    Dirección IP
                  </label>
                  <p className="text-sm text-gray-100 dark:text-white">
                    {selectedLog.ip}
                  </p>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div>
                  <label className="block text-sm font-medium text-red-400">
                    Error
                  </label>
                  <p className="text-sm text-red-200 bg-red-900 p-2 rounded">
                    {selectedLog.errorMessage}
                  </p>
                </div>
              )}

              {selectedLog.datosAntes && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 dark:text-gray-200">
                    Datos Anteriores
                  </label>
                  <pre className="text-xs bg-gray-800 text-gray-200 p-2 rounded overflow-auto">
                    {JSON.stringify(selectedLog.datosAntes, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.datosDespues && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 dark:text-gray-200">
                    Datos Posteriores
                  </label>
                  <pre className="text-xs bg-gray-800 text-gray-200 p-2 rounded overflow-auto">
                    {JSON.stringify(selectedLog.datosDespues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RegistroActividad;
