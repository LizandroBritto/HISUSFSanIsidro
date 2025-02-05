import * as Yup from "yup";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext"; // Ajusta la ruta según corresponda
import Swal from "sweetalert2";

const CrearPaciente = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const validationSchema = Yup.object().shape({
    nombre: Yup.string()
      .min(3, "Mínimo 3 caracteres")
      .required("Nombre es requerido"),
    apellido: Yup.string()
      .min(3, "Mínimo 3 caracteres")
      .required("Apellido es requerido"),
    cedula: Yup.string()
      .matches(/^\d+$/, "Solo números")
      .required("Cédula es requerida"),
    fechaNacimiento: Yup.date()
      .max(new Date(), "Debe ser una fecha pasada")
      .required("Fecha de nacimiento es requerida"),
    sexo: Yup.string()
      .oneOf(["Masculino", "Femenino", "Otro"], "Seleccione una opción")
      .required("Sexo es requerido"),
    direccion: Yup.string().required("Dirección es requerida"),
    telefono: Yup.string()
      .matches(/^\d+$/, "Solo números")
      .required("Teléfono es requerido"),
    grupoSanguineo: Yup.string(),
    alergias: Yup.string(),
    enfermedadesPreexistentes: Yup.string(),
  });

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/pacientes/new",
        values,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 201) {
        Swal.fire({
          title: "Paciente creado exitosamente",
          icon: "success",
          draggable: true,
        });
        resetForm();
        navigate("/dashboard");
      }
    } catch (error) {
      // Si el backend responde con 401, mostramos un mensaje específico
      if (error.response) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.response.data.error,
        });
        toast.error(
          error.response.data?.error ||
            "No autorizado. Verifica tus credenciales o permisos."
        );
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.response.data.error,
        });
      }
    }
  };

  if (user?.rol !== "enfermero" && user?.rol !== "medico") {
    return (
      <div className="p-4">
        <p className="text-red-500">Acceso restringido a enfermeros</p>
      </div>
    );
  }

  return (
    <Formik
      initialValues={{
        nombre: "",
        apellido: "",
        cedula: "",
        fechaNacimiento: "",
        sexo: "",
        direccion: "",
        telefono: "",
        grupoSanguineo: "",
        alergias: "",
        enfermedadesPreexistentes: "",
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      <Form className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Crear Nuevo Paciente</h2>

        <div className="space-y-4">
          {[
            { name: "nombre", label: "Nombre" },
            { name: "apellido", label: "Apellido" },
            { name: "cedula", label: "Cédula" },
            {
              name: "fechaNacimiento",
              label: "Fecha de Nacimiento",
              type: "date",
            },
            { name: "direccion", label: "Dirección" },
            { name: "telefono", label: "Teléfono" },
          ].map(({ name, label, type = "text" }) => (
            <div key={name}>
              <label className="block mb-1">{label}</label>
              <Field
                type={type}
                name={name}
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name={name}
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
          ))}

          <div>
            <label className="block mb-1">Sexo</label>
            <Field
              as="select"
              name="sexo"
              className="w-full p-2 border rounded"
            >
              <option value="">Seleccione</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </Field>
            <ErrorMessage
              name="sexo"
              component="div"
              className="text-red-500 text-sm"
            />
          </div>

          {[
            { name: "grupoSanguineo", label: "Grupo Sanguíneo (Opcional)" },
            { name: "alergias", label: "Alergias (Opcional)" },
            {
              name: "enfermedadesPreexistentes",
              label: "Enfermedades Preexistentes (Opcional)",
            },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block mb-1">{label}</label>
              <Field
                type="text"
                name={name}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
          <div className="flex gap-1">
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Crear Paciente
            </button>
            <a
              type="submit"
              className="w-full flex justify-center bg-red-500 text-white py-2 rounded hover:bg-red-600"
              onClick={() => navigate("/dashboard")}
            >
              Cancelar
            </a>
          </div>
        </div>
      </Form>
    </Formik>
  );
};

export default CrearPaciente;
