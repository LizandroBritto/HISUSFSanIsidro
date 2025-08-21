import { useEffect, useState, useCallback } from "react";
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
  Badge,
  Modal,
  Label,
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

  // Estado para filtro de médicos (solo para enfermeros)
  const [filtroEstadoMedico, setFiltroEstadoMedico] = useState("todos");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("todos");

  // Estados para el modal de reporte de citas (solo para médicos)
  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);
  const [reporteFechaDesde, setReporteFechaDesde] = useState("");
  const [reporteFechaHasta, setReporteFechaHasta] = useState("");
  const [reporteEstado, setReporteEstado] = useState("todos");
  const [generandoReporte, setGenerandoReporte] = useState(false);

  // Estados para indicadores del médico
  const [indicadoresMedico, setIndicadoresMedico] = useState({
    pacientesAtendidosHoy: 0,
    pacientesAtendidosSemana: 0,
    pacientesAtendidosMes: 0,
    citasPendientes: 0,
    citasCanceladas: 0,
  });
  const [cargandoIndicadores, setCargandoIndicadores] = useState(false);

  // Estados para indicadores del enfermero (globales)
  const [indicadoresEnfermero, setIndicadoresEnfermero] = useState({
    pacientesAtendidosHoy: 0,
    pacientesAtendidosSemana: 0,
    pacientesAtendidosMes: 0,
    citasPendientes: 0,
    citasCanceladas: 0,
  });
  const [cargandoIndicadoresEnfermero, setCargandoIndicadoresEnfermero] =
    useState(false);

  // Función para alternar entre vistas (citas, pacientes y médicos)
  const toggleView = (mode) => {
    if (mode) {
      setViewMode(mode);
    } else {
      setViewMode((prev) => (prev === "citas" ? "pacientes" : "citas"));
    }
  }; // Función para cambiar el estado del paciente (activar/desactivar)
  const toggleEstadoPaciente = async (id) => {
    const token = localStorage.getItem("token");

    // Encontrar el paciente actual para determinar la acción
    const pacienteActual = data.find((p) => p._id === id);
    const accion =
      pacienteActual?.estadoPaciente === "Activo" ? "desactivar" : "activar";

    // Mostrar alerta de confirmación
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas ${accion} este paciente?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
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
          text: `El paciente ha sido ${
            updatedPaciente.estadoPaciente === "Activo"
              ? "activado"
              : "desactivado"
          }.`,
          icon: "success",
        });

        // Actualizar la lista: reemplazar el paciente modificado (ya no filtrar inactivos)
        setData((prevData) =>
          prevData.map((p) =>
            p._id === updatedPaciente._id ? updatedPaciente : p
          )
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

  // Función para generar reporte de citas
  const generarReporteCitas = async () => {
    // Validar que si se proporciona una fecha, la otra también sea válida
    if (
      reporteFechaDesde &&
      reporteFechaHasta &&
      new Date(reporteFechaDesde) > new Date(reporteFechaHasta)
    ) {
      Swal.fire({
        title: "Fechas inválidas",
        text: "La fecha 'desde' no puede ser mayor que la fecha 'hasta'.",
        icon: "warning",
      });
      return;
    }

    try {
      setGenerandoReporte(true);
      const token = localStorage.getItem("token");

      // Construir la URL con los parámetros de filtro opcionales
      let url = `http://localhost:8000/api/citas/reporte`;
      const params = new URLSearchParams();

      if (reporteFechaDesde) {
        params.append("fechaDesde", reporteFechaDesde);
      }
      if (reporteFechaHasta) {
        params.append("fechaHasta", reporteFechaHasta);
      }
      if (reporteEstado !== "todos") {
        params.append("estado", reporteEstado);
      }

      // Agregar parámetros solo si existen
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Error al generar el reporte");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Generar nombre del archivo dinámicamente
      const fecha = new Date().toISOString().split("T")[0];
      const estadoTexto = reporteEstado === "todos" ? "todas" : reporteEstado;

      let filename = `reporte_citas_${estadoTexto}`;
      if (reporteFechaDesde && reporteFechaHasta) {
        filename += `_${reporteFechaDesde}_${reporteFechaHasta}`;
      } else if (reporteFechaDesde) {
        filename += `_desde_${reporteFechaDesde}`;
      } else if (reporteFechaHasta) {
        filename += `_hasta_${reporteFechaHasta}`;
      } else {
        filename += `_completo`;
      }
      filename += `_${fecha}.xlsx`;

      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Cerrar el modal y resetear los campos
      setMostrarModalReporte(false);
      setReporteFechaDesde("");
      setReporteFechaHasta("");
      setReporteEstado("todos");

      Swal.fire({
        title: "¡Reporte generado!",
        text: "El reporte se ha descargado exitosamente.",
        icon: "success",
      });
    } catch (error) {
      console.error("Error al generar reporte:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo generar el reporte. Intenta nuevamente.",
        icon: "error",
      });
    } finally {
      setGenerandoReporte(false);
    }
  };

  // Función para obtener indicadores del médico
  const obtenerIndicadoresMedico = useCallback(async () => {
    if (user?.rol !== "medico") return;

    try {
      setCargandoIndicadores(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8000/api/medicos/indicadores`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener indicadores");
      }

      const data = await response.json();
      setIndicadoresMedico(data);
    } catch (error) {
      console.error("Error al obtener indicadores:", error);
      // Mantener valores por defecto en caso de error
      setIndicadoresMedico({
        pacientesAtendidosHoy: 0,
        pacientesAtendidosSemana: 0,
        pacientesAtendidosMes: 0,
        citasPendientes: 0,
        citasCanceladas: 0,
      });
    } finally {
      setCargandoIndicadores(false);
    }
  }, [user?.rol]); // Solo depende del rol del usuario

  // Función para obtener indicadores globales del enfermero
  const obtenerIndicadoresEnfermero = useCallback(async () => {
    if (user?.rol !== "enfermero") return;

    try {
      setCargandoIndicadoresEnfermero(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8000/api/enfermeros/indicadores/globales`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener indicadores globales");
      }

      const data = await response.json();
      setIndicadoresEnfermero(data);
    } catch (error) {
      console.error("Error al obtener indicadores globales:", error);
      // Mantener valores por defecto en caso de error
      setIndicadoresEnfermero({
        pacientesAtendidosHoy: 0,
        pacientesAtendidosSemana: 0,
        pacientesAtendidosMes: 0,
        citasPendientes: 0,
        citasCanceladas: 0,
      });
    } finally {
      setCargandoIndicadoresEnfermero(false);
    }
  }, [user?.rol]); // Solo depende del rol del usuario

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
        } else if (viewMode === "medicos") {
          // Para médicos con estadísticas (solo enfermeros)
          const token = localStorage.getItem("token");
          const params = new URLSearchParams();
          if (filtroEstadoMedico !== "todos") {
            params.append("estado", filtroEstadoMedico);
          }

          url = `http://localhost:8000/api/medicos/estadisticas${
            params.toString() ? `?${params.toString()}` : ""
          }`;
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error(`Error al obtener ${viewMode}`);
          result = await response.json();

          // Si hay búsqueda, filtrar por nombre, apellido, sala o especialidad del médico
          if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(
              (medico) =>
                medico.usuario?.nombre?.toLowerCase().includes(searchLower) ||
                medico.usuario?.apellido?.toLowerCase().includes(searchLower) ||
                medico.especialidad?.nombre
                  ?.toLowerCase()
                  .includes(searchLower) ||
                medico.sala?.nombre?.toLowerCase().includes(searchLower) ||
                medico.sala?.numero?.toString().includes(searchLower)
            );
          }

          // Si hay filtro de especialidad, aplicar filtro
          if (filtroEspecialidad !== "todos") {
            result = result.filter(
              (medico) => medico.especialidad?._id === filtroEspecialidad
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

        // El backend ya ordena los pacientes por estado (activos primero, inactivos al final)
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
    filtroEstadoMedico,
    filtroEspecialidad,
  ]);

  // useEffect para cargar indicadores del médico
  useEffect(() => {
    if (user?.rol === "medico") {
      obtenerIndicadoresMedico();
    }
  }, [user?.rol, obtenerIndicadoresMedico]); // Incluye ambas dependencias

  // useEffect para cargar indicadores globales del enfermero
  useEffect(() => {
    if (user?.rol === "enfermero") {
      obtenerIndicadoresEnfermero();
    }
  }, [user?.rol, obtenerIndicadoresEnfermero]); // Incluye ambas dependencias

  // Función para filtrar y ordenar los datos
  const getProcessedData = () => {
    let processed = [...data];

    // Aplicar filtros según el modo de vista
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
          // Verificar que los campos existen
          if (!a.fecha || !a.hora || !b.fecha || !b.hora) {
            return 0;
          }

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
    } else if (viewMode === "medicos") {
      // Para médicos, filtrar solo los que tengan usuario con nombre y apellido
      processed = processed.filter(
        (medico) =>
          medico.usuario &&
          medico.usuario.nombre &&
          medico.usuario.apellido &&
          medico.usuario.nombre.trim() !== "" &&
          medico.usuario.apellido.trim() !== ""
      );

      // Para médicos, ordenar por nombre
      processed.sort((a, b) => {
        const nombreA = `${a.usuario?.nombre || ""} ${
          a.usuario?.apellido || ""
        }`;
        const nombreB = `${b.usuario?.nombre || ""} ${
          b.usuario?.apellido || ""
        }`;
        return nombreA.localeCompare(nombreB);
      });
    } else if (viewMode === "pacientes") {
      // Para pacientes, el backend ya los ordena por estado (activos primero, luego inactivos)
      // No aplicamos ordenación adicional para mantener el orden del backend
      // que pone los activos primero, luego los inactivos
    }

    return processed;
  };

  const sortedData = getProcessedData();

  return (
    <div className="overflow-x-auto p-4">
      {/* Indicadores para médicos */}
      {user?.rol === "medico" && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Indicadores de Actividad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                    Pacientes Hoy
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {cargandoIndicadores
                      ? "..."
                      : indicadoresMedico.pacientesAtendidosHoy}
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400">
                    Citas confirmadas
                  </p>
                </div>
                <div className="text-blue-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-300 text-sm font-medium">
                    Esta Semana
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {cargandoIndicadores
                      ? "..."
                      : indicadoresMedico.pacientesAtendidosSemana}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400">
                    Pacientes atendidos
                  </p>
                </div>
                <div className="text-green-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-300 text-sm font-medium">
                    Este Mes
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {cargandoIndicadores
                      ? "..."
                      : indicadoresMedico.pacientesAtendidosMes}
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-400">
                    Pacientes atendidos
                  </p>
                </div>
                <div className="text-purple-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                    Pendientes
                  </p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {cargandoIndicadores
                      ? "..."
                      : indicadoresMedico.citasPendientes}
                  </p>
                  <p className="text-xs text-yellow-500 dark:text-yellow-400">
                    Citas por confirmar
                  </p>
                </div>
                <div className="text-yellow-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 dark:text-red-300 text-sm font-medium">
                    Canceladas
                  </p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {cargandoIndicadores
                      ? "..."
                      : indicadoresMedico.citasCanceladas}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400">
                    Citas canceladas
                  </p>
                </div>
                <div className="text-red-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicadores globales para enfermeros */}
      {user?.rol === "enfermero" && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Indicadores Globales del Sistema
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                    Pacientes Hoy
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {cargandoIndicadoresEnfermero
                      ? "..."
                      : indicadoresEnfermero.pacientesAtendidosHoy}
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400">
                    Citas confirmadas
                  </p>
                </div>
                <div className="text-blue-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-300 text-sm font-medium">
                    Esta Semana
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {cargandoIndicadoresEnfermero
                      ? "..."
                      : indicadoresEnfermero.pacientesAtendidosSemana}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400">
                    Pacientes atendidos
                  </p>
                </div>
                <div className="text-green-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-300 text-sm font-medium">
                    Este Mes
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {cargandoIndicadoresEnfermero
                      ? "..."
                      : indicadoresEnfermero.pacientesAtendidosMes}
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-400">
                    Pacientes atendidos
                  </p>
                </div>
                <div className="text-purple-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2v1a2 2 0 002 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                    Pendientes
                  </p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {cargandoIndicadoresEnfermero
                      ? "..."
                      : indicadoresEnfermero.citasPendientes}
                  </p>
                  <p className="text-xs text-yellow-500 dark:text-yellow-400">
                    Citas por confirmar
                  </p>
                </div>
                <div className="text-yellow-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 dark:text-red-300 text-sm font-medium">
                    Canceladas
                  </p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {cargandoIndicadoresEnfermero
                      ? "..."
                      : indicadoresEnfermero.citasCanceladas}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400">
                    Citas canceladas
                  </p>
                </div>
                <div className="text-red-500">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de búsqueda y botones de acción */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <TextInput
          type="text"
          placeholder={
            viewMode === "pacientes"
              ? "Buscar por cédula, nombre o apellido..."
              : viewMode === "medicos"
              ? "Buscar por nombre, apellido, sala o especialidad del médico..."
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

        <div className="flex gap-2">
          <Button
            onClick={() => toggleView("citas")}
            className={`w-full sm:w-auto ${
              viewMode === "citas" ? "bg-blue-600" : ""
            }`}
            color={viewMode === "citas" ? "blue" : "gray"}
          >
            Citas
          </Button>

          <Button
            onClick={() => toggleView("pacientes")}
            className={`w-full sm:w-auto ${
              viewMode === "pacientes" ? "bg-blue-600" : ""
            }`}
            color={viewMode === "pacientes" ? "blue" : "gray"}
          >
            Pacientes
          </Button>

          {user?.rol === "enfermero" && (
            <Button
              onClick={() => toggleView("medicos")}
              className={`w-full sm:w-auto ${
                viewMode === "medicos" ? "bg-blue-600" : ""
              }`}
              color={viewMode === "medicos" ? "blue" : "gray"}
            >
              Ver Médicos
            </Button>
          )}

          {user?.rol === "medico" && viewMode === "citas" && (
            <Button
              onClick={() => setMostrarModalReporte(true)}
              className="w-full sm:w-auto"
              color="green"
            >
              Generar reporte de citas
            </Button>
          )}
        </div>
      </div>

      {/* Filtros para citas */}
      {viewMode === "citas" && (
        <>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-200">
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
              <label className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-200">
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
              <label className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-200">
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
              <label className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-200">
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
              <label className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-200">
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

      {/* Filtros para médicos */}
      {viewMode === "medicos" && (
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-200">
              Filtrar por estado del médico:
            </label>
            <Select
              value={filtroEstadoMedico}
              onChange={(e) => setFiltroEstadoMedico(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="no disponible">No disponible</option>
              <option value="ausente">Ausente</option>
            </Select>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-slate-800 dark:text-slate-200">
              Filtrar por especialidad:
            </label>
            <Select
              value={filtroEspecialidad}
              onChange={(e) => setFiltroEspecialidad(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="todos">Todas las especialidades</option>
              {data
                .reduce((especialidades, medico) => {
                  const especialidad = medico.especialidad;
                  if (
                    especialidad &&
                    !especialidades.find((e) => e._id === especialidad._id)
                  ) {
                    especialidades.push(especialidad);
                  }
                  return especialidades;
                }, [])
                .map((especialidad) => (
                  <option key={especialidad._id} value={especialidad._id}>
                    {especialidad.nombre}
                  </option>
                ))}
            </Select>
          </div>
        </div>
      )}

      {loading && <p className="text-center text-gray-500">Cargando...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Tabla de médicos */}
      {viewMode === "medicos" && !loading && !error && (
        <div className="overflow-x-auto">
          <Table hoverable striped>
            <Table.Head>
              <Table.HeadCell>Nombre</Table.HeadCell>
              <Table.HeadCell>Especialidad</Table.HeadCell>
              <Table.HeadCell>Sala</Table.HeadCell>
              <Table.HeadCell>Estado</Table.HeadCell>
              <Table.HeadCell className="text-center">
                Pendientes
              </Table.HeadCell>
              <Table.HeadCell className="text-center">
                Confirmadas
              </Table.HeadCell>
              <Table.HeadCell className="text-center">
                Canceladas
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {getProcessedData().length > 0 ? (
                getProcessedData().map((medico) => (
                  <Table.Row
                    key={medico._id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {medico.usuario?.nombre} {medico.usuario?.apellido}
                    </Table.Cell>
                    <Table.Cell>
                      {medico.especialidad?.nombre || "Sin especialidad"}
                    </Table.Cell>
                    <Table.Cell>
                      {medico.sala?.numero
                        ? `Sala ${medico.sala.numero}`
                        : medico.sala?.nombre || "Sin sala"}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        color={
                          medico.estado === "disponible"
                            ? "green"
                            : medico.estado === "no disponible"
                            ? "warning"
                            : "failure"
                        }
                      >
                        {medico.estado}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Badge color="gray" size="sm">
                        {medico.estadisticasCitas?.pendientes || 0}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Badge color="green" size="sm">
                        {medico.estadisticasCitas?.confirmadas || 0}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <Badge color="red" size="sm">
                        {medico.estadisticasCitas?.canceladas || 0}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={7} className="text-center py-4">
                    No se encontraron médicos
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      )}

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

      {/* Tabla de citas y pacientes */}
      {(viewMode === "citas" || viewMode === "pacientes") &&
        !loading &&
        !error && (
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
        )}

      {/* Mensaje cuando no se encuentran resultados */}
      {!loading && data.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          No se encontraron{" "}
          {viewMode === "pacientes" ? "pacientes" : "citas pendientes"}
        </p>
      )}

      {/* Modal para generar reporte de citas */}
      <Modal
        show={mostrarModalReporte}
        onClose={() => setMostrarModalReporte(false)}
        size="md"
      >
        <Modal.Header>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">
            Generar reporte de citas
          </h3>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Selecciona filtros opcionales para el reporte. Si no se
              especifican fechas, se incluirán todas las citas.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="reporteFechaDesde"
                  value="Fecha desde (opcional):"
                />
                <TextInput
                  id="reporteFechaDesde"
                  type="date"
                  value={reporteFechaDesde}
                  onChange={(e) => setReporteFechaDesde(e.target.value)}
                />
              </div>
              <div>
                <Label
                  htmlFor="reporteFechaHasta"
                  value="Fecha hasta (opcional):"
                />
                <TextInput
                  id="reporteFechaHasta"
                  type="date"
                  value={reporteFechaHasta}
                  onChange={(e) => setReporteFechaHasta(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reporteEstado" value="Estado de las citas:" />
              <Select
                id="reporteEstado"
                value={reporteEstado}
                onChange={(e) => setReporteEstado(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
              </Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={generarReporteCitas}
            disabled={generandoReporte}
            color="success"
          >
            {generandoReporte ? "Generando..." : "Generar reporte"}
          </Button>
          <Button color="gray" onClick={() => setMostrarModalReporte(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DashboardTable;
