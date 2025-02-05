import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";

const CitaDetalle = () => {
  const { id } = useParams(); // Se espera que 'id' sea el ID de la cita
  const navigate = useNavigate();
  const [cita, setCita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user")); // Assuming user data is stored in localStorage

  // Obtener la cita, con datos de paciente y médico (se supone que el backend hace los populate)
  useEffect(() => {
    const fetchCita = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:8000/api/citas/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCita(response.data);
        console.log(response.data);
        setError("");
      } catch (err) {
        setError("Error al obtener los datos de la cita.");
      } finally {
        setLoading(false);
      }
    };
    fetchCita();
  }, [id]);

  // Esquema de validación para los campos editables de la cita.
  const validationSchema = Yup.object().shape({
    estado: Yup.string()
      .oneOf(["pendiente", "confirmada", "cancelada"], "Estado inválido")
      .required("Estado es requerido"),
    estudios: Yup.string().nullable(),
    observaciones: Yup.string().nullable(),
  });

  // Función para actualizar la cita
  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`http://localhost:8000/api/citas/${id}`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        Swal.fire({
          title: "Cita actualizada exitosamente",
          icon: "success",
          draggable: true,
        });
        navigate("/dashboard");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.error || "Error al actualizar la cita",
      });
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!cita) return <p className="text-red-500">Cita no encontrada</p>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Detalle de la Cita</h2>
      
      {/* Datos de la cita y del paciente */}
      <div className="mb-4">
        <p>
          <strong>Paciente:</strong>{" "}
          {cita.paciente?.nombre} {cita.paciente?.apellido}
        </p>
        <p>
          <strong>Cédula:</strong> {cita.paciente?.cedula}
        </p>
        <p>
          <strong>Enfermedad Base:</strong> {cita.paciente?.enfermedadesPreexistentes==="null" ? "Ninguna" : cita.paciente?.enfermedadesPreexistentes}
        </p>
        <p>
          <strong>Sexo:</strong> {cita.paciente?.sexo}
        </p>
        <p>
          <strong>Alergias:</strong> {cita.paciente?.alergias === "null" ? "Ninguna" : cita.paciente?.alergias}
        </p>
        <p>
          <strong>Grupo Sanguíneo:</strong> {cita.paciente?.grupoSanguineo}
        </p>
        <p>
          <strong>Teléfono:</strong> {cita.paciente?.telefono}
        </p>
        <p>
          <strong>Dirección:</strong> {cita.paciente?.direccion}
        </p>
        <p>
          <strong>Médico:</strong>{" "}
          {cita.medico?.usuario?.nombre} {cita.medico?.usuario?.apellido}
        </p>
        <p>
          <strong>Fecha:</strong>{" "}
          {new Date(cita.fecha).toLocaleDateString()}
        </p>
        <p>
          <strong>Hora:</strong> {cita.hora}
        </p>
      </div>

      {user?.rol === "enfermero" && (
        <>
        <p>
          <strong>Estudios:</strong> {cita.estudios || "Ninguno"}
        </p>
        <p>
          <strong>Observaciones:</strong> {cita.observaciones || "Ninguna"}
        </p>
        <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="bg-gray-500 text-white py-2 px-4 rounded m-5"
                >
                  Volver 
                </button>
        </>
      )}

      {/* Formulario para editar la cita */}
      {user?.rol === "medico" && (
          <Formik
          initialValues={{
            estado: cita.estado,
            estudios: cita.estudios || "",
            observaciones: cita.observaciones || "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {() => (
            <Form className="space-y-4">
              <div>
                <label className="block mb-1">Estado de la Cita</label>
                <Field
                  as="select"
                  name="estado"
                  className="w-full p-2 border rounded"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                </Field>
                <ErrorMessage
                  name="estado"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block mb-1">Estudios (Opcional)</label>
                <Field
                  type="text"
                  name="estudios"
                  className="w-full p-2 border rounded"
                />
                <ErrorMessage
                  name="estudios"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block mb-1">Observaciones (Opcional)</label>
                <Field
                  type="text"
                  name="observaciones"
                  className="w-full p-2 border rounded"
                />
                <ErrorMessage
                  name="observaciones"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="bg-gray-500 text-white py-2 px-4 rounded"
                >
                  Cancelar
                </button>
              </div>
            </Form>
          )}
        </Formik>
        )}
    
    </div>
  );
};

export default CitaDetalle;