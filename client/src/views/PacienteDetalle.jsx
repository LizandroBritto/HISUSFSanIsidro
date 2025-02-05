import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const PacienteDetalle = () => {
  const { id } = useParams(); // Se espera que la ruta sea /paciente-detalle/:id
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:8000/api/pacientes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPaciente(response.data);
        setError("");
      } catch (err) {
        setError("Error al obtener los datos del paciente");
      } finally {
        setLoading(false);
      }
    };
    fetchPaciente();
  }, [id]);

  if (loading) return <p className="text-center">Cargando datos...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!paciente) return <p className="text-center text-red-500">Paciente no encontrado.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Detalle del Paciente</h1>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <span className="font-semibold">Nombre:</span> {paciente.nombre}
        </div>
        <div>
          <span className="font-semibold">Apellido:</span> {paciente.apellido}
        </div>
        <div>
          <span className="font-semibold">Cédula:</span> {paciente.cedula}
        </div>
        <div>
          <span className="font-semibold">Fecha de Nacimiento:</span>{" "}
          {new Date(paciente.fechaNacimiento).toLocaleDateString()}
        </div>
        <div>
          <span className="font-semibold">Sexo:</span> {paciente.sexo}
        </div>
        <div>
          <span className="font-semibold">Dirección:</span> {paciente.direccion}
        </div>
        <div>
          <span className="font-semibold">Teléfono:</span> {paciente.telefono}
        </div>
        <div>
          <span className="font-semibold">Grupo Sanguíneo:</span> {paciente.grupoSanguineo || "N/A"}
        </div>
        <div>
          <span className="font-semibold">Alergias:</span> {paciente.alergias || "N/A"}
        </div>
        <div>
          <span className="font-semibold">Enfermedades Preexistentes:</span> {paciente.enfermedadesPreexistentes || "N/A"}
        </div>
      </div>
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
      >
        Volver al Dashboard
      </button>
    </div>
  );
};

export default PacienteDetalle;
