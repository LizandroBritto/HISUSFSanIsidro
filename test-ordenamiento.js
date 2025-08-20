// Test de la lógica de ordenamiento mejorada
const testCitas = [
  {
    _id: "1",
    fecha: "2025-08-19T00:00:00.000Z",
    hora: "00:42",
    estado: "pendiente",
    paciente: { nombre: "Juan", apellido: "Pérez" },
  },
  {
    _id: "2",
    fecha: "2025-08-19T00:00:00.000Z",
    hora: "00:33",
    estado: "pendiente",
    paciente: { nombre: "María", apellido: "González" },
  },
  {
    _id: "3",
    fecha: "2025-08-20T00:00:00.000Z",
    hora: "09:15",
    estado: "confirmada",
    paciente: { nombre: "Carlos", apellido: "López" },
  },
  {
    _id: "4",
    fecha: "2025-08-20T00:00:00.000Z",
    hora: "08:30",
    estado: "pendiente",
    paciente: { nombre: "Ana", apellido: "Martín" },
  },
];

// Función de ordenamiento mejorada
function ordenarPorFechaHora(citas, ordenFecha = "reciente") {
  return [...citas].sort((a, b) => {
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
      console.error("Error al ordenar citas por fecha/hora:", error, { a, b });
      return 0; // En caso de error, mantener orden original
    }
  });
}

console.log("=== CITAS ORIGINALES ===");
testCitas.forEach((cita) => {
  console.log(
    `${cita.fecha.split("T")[0]} ${cita.hora} - ${cita.paciente.nombre} ${
      cita.paciente.apellido
    }`
  );
});

console.log("\n=== ORDENADAS MÁS RECIENTE PRIMERO ===");
const recientes = ordenarPorFechaHora(testCitas, "reciente");
recientes.forEach((cita) => {
  console.log(
    `${cita.fecha.split("T")[0]} ${cita.hora} - ${cita.paciente.nombre} ${
      cita.paciente.apellido
    }`
  );
});

console.log("\n=== ORDENADAS MÁS ANTIGUO PRIMERO ===");
const antiguas = ordenarPorFechaHora(testCitas, "antiguo");
antiguas.forEach((cita) => {
  console.log(
    `${cita.fecha.split("T")[0]} ${cita.hora} - ${cita.paciente.nombre} ${
      cita.paciente.apellido
    }`
  );
});

console.log("\n=== VERIFICACIÓN ESPECÍFICA PARA EL EJEMPLO DEL USUARIO ===");
const citasMismo19 = testCitas.filter((c) => c.fecha.includes("2025-08-19"));
console.log("Citas del 19/08/2025 ordenadas por más reciente:");
const recientes19 = ordenarPorFechaHora(citasMismo19, "reciente");
recientes19.forEach((cita) => {
  console.log(
    `${cita.hora} - ${cita.paciente.nombre} ${cita.paciente.apellido}`
  );
});
