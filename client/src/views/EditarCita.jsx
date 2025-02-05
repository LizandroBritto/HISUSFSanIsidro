import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

const EditarCita = () => {
  const { id } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [cita, setCita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [medicos, setMedicos] = useState([]);

  useEffect(() => {
    const fetchCita = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/citas/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setCita(response.data);
      } catch (error) {
        toast.error(error.response?.data?.error || "Error al obtener la cita");
      } finally {
        setLoading(false);
      }
    };

    fetchCita();
  }, [id]);

  useEffect(() => {
    const fetchMedicos = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/medicos", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setMedicos(response.data);
      } catch (error) {
        console.error("Error al obtener médicos:", error);
      }
    };

    fetchMedicos();
  }, []);

  const validationSchema = Yup.object().shape({
    fecha: Yup.date().required("Fecha es requerida"),
    hora: Yup.string().required("Hora es requerida"),
    paciente: Yup.string().required("Paciente es requerido"),
    medico: Yup.string().required("Médico es requerido"),
    estado: Yup.string()
      .oneOf(["pendiente", "confirmada", "cancelada"])
      .default("pendiente"),
    presionArterial: Yup.number().optional(),
    temperatura: Yup.number().optional(),
    estudios: Yup.string().optional(),
    observaciones: Yup.string().optional(),
  });

  const handleSubmit = async (values) => {
    try {
      const response = await axios.put(
        `http://localhost:8000/api/citas/${id}`,
        values,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.status === 200) {
        Swal.fire({
          title: "Cita actualizada exitosamente",
          icon: "success",
          draggable: true,
        });
        navigate("/dashboard");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response.data.error,
      });
    }
  };

  if (user?.rol !== "enfermero" && user?.rol !== "medico") {
    return (
      <div className="p-4">
        <p className="text-red-500">Acceso restringido</p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-center text-gray-500">Cargando cita...</p>;
  }

  return (
    <Formik
      initialValues={{
        fecha: cita?.fecha ? cita.fecha.split("T")[0] : "",
        hora: cita?.hora || "",
        paciente: cita?.paciente?._id || "", // Usa el ID del paciente, no el de la cita
        medico: cita?.medico?._id || cita?.medico || "",
        estado: cita?.estado || "pendiente",
        presionArterial: cita?.presionArterial || "",
        temperatura: cita?.temperatura || "",
        estudios: cita?.estudios || "",
        observaciones: cita?.observaciones || "",
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {() => (
        <Form className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Editar Cita</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-1">Fecha</label>
              <Field
                type="date"
                name="fecha"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="fecha"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">Hora</label>
              <Field
                type="time"
                name="hora"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="hora"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">Paciente</label>
              <Field
                type="text"
                name="pacienteDisplay"
                className="w-full p-2 border rounded"
                value={
                  cita?.paciente?.nombre
                    ? `${cita.paciente.nombre} ${cita.paciente.apellido}`
                    : "Cargando paciente..." // Mensaje de respaldo
                }
                disabled
              />
              <Field
                type="hidden"
                name="paciente"
                value={cita?.paciente?._id || cita?.paciente}
              />
              <ErrorMessage
                name="paciente"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">Médico</label>
              <Field
                as="select"
                name="medico"
                className="w-full p-2 border rounded"
              >
                <option value="">Selecciona un médico</option>
                {medicos.map((medico) => (
                  <option key={medico._id} value={medico._id}>
                    {medico.usuario?.nombre} {medico.usuario?.apellido} -{" "}
                    {medico.especialidad}
                  </option>
                ))}
              </Field>
              <ErrorMessage
                name="medico"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">Estado</label>
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
              <label className="block mb-1">Presión Arterial</label>
              <Field
                type="number"
                name="presionArterial"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="presionArterial"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">Temperatura</label>
              <Field
                type="number"
                name="temperatura"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="temperatura"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {user?.rol === "medico" && (
              <>
                <div>
                  <label className="block mb-1">Estudios</label>
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
                  <label className="block mb-1">Observaciones</label>
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
              </>
            )}

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Actualizar Cita
            </button>
            <a
              type="submit"
              className="w-full flex justify-center bg-red-500 text-white py-2 rounded hover:bg-red-600"
              onClick={() => navigate("/dashboard")}
            >
              Cancelar
            </a>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default EditarCita;
