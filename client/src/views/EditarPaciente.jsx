import * as Yup from "yup";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";

const EditarPaciente = () => {
  const { id } = useParams(); // Se asume que la ruta es algo como /dashboard/editar-paciente/:id
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);

  // Esquema de validación, igual al de creación
  const validationSchema = Yup.object().shape({
    nombre: Yup.string().min(3, "Mínimo 3 caracteres").required("Nombre es requerido"),
    apellido: Yup.string().min(3, "Mínimo 3 caracteres").required("Apellido es requerido"),
    cedula: Yup.string().matches(/^\d+$/, "Solo números").required("Cédula es requerida"),
    fechaNacimiento: Yup.date().max(new Date(), "Debe ser una fecha pasada").required("Fecha de nacimiento es requerida"),
    sexo: Yup.string().oneOf(["Masculino", "Femenino", "Otro"], "Seleccione una opción").required("Sexo es requerido"),
    direccion: Yup.string().required("Dirección es requerida"),
    telefono: Yup.string().matches(/^\d+$/, "Solo números").required("Teléfono es requerido"),
    grupoSanguineo: Yup.string(),
    alergias: Yup.string(),
    enfermedadesPreexistentes: Yup.string(),
  });

  // Obtener los datos del paciente al montar el componente
  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/pacientes/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setPaciente(response.data);
      } catch (error) {
        toast.error(error.response?.data?.error || "Error al obtener el paciente");
      } finally {
        setLoading(false);
      }
    };

    fetchPaciente();
  }, [id]);

  // Función para enviar la actualización
  const handleSubmit = async (values) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/pacientes/${id}`, values, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.status === 200) {
         Swal.fire({
                 title: "Paciente actualizado exitosamente",
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
    return <div className="p-4"><p className="text-red-500">Acceso restringido a enfermeros</p></div>;
  }

  // Mientras se cargan los datos, mostrar un mensaje de carga
  if (loading) {
    return <p className="text-center text-gray-500">Cargando paciente...</p>;
  }

  return (
    <Formik
      // Utilizamos enableReinitialize para que cuando se carguen los datos se actualicen los valores iniciales
      initialValues={{
        nombre: paciente?.nombre || "",
        apellido: paciente?.apellido || "",
        cedula: paciente?.cedula || "",
        fechaNacimiento: paciente?.fechaNacimiento ? paciente.fechaNacimiento.split("T")[0] : "", // Convertir la fecha a formato YYYY-MM-DD
        sexo: paciente?.sexo || "",
        direccion: paciente?.direccion || "",
        telefono: paciente?.telefono || "",
        grupoSanguineo: paciente?.grupoSanguineo || "",
        alergias: paciente?.alergias || "",
        enfermedadesPreexistentes: paciente?.enfermedadesPreexistentes || "",
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      <Form className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Editar Paciente</h2>
        
        <div className="space-y-4">
          {[
            { name: "nombre", label: "Nombre", type: "text" },
            { name: "apellido", label: "Apellido", type: "text" },
            { name: "cedula", label: "Cédula", type: "text" },
            { name: "fechaNacimiento", label: "Fecha de Nacimiento", type: "date" },
            { name: "direccion", label: "Dirección", type: "text" },
            { name: "telefono", label: "Teléfono", type: "text" },
          ].map(({ name, label, type }) => (
            <div key={name}>
              <label className="block mb-1">{label}</label>
              <Field type={type} name={name} className="w-full p-2 border rounded" />
              <ErrorMessage name={name} component="div" className="text-red-500 text-sm" />
            </div>
          ))}

          <div>
            <label className="block mb-1">Sexo</label>
            <Field as="select" name="sexo" className="w-full p-2 border rounded">
              <option value="">Seleccione</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </Field>
            <ErrorMessage name="sexo" component="div" className="text-red-500 text-sm" />
          </div>

          {[
            { name: "grupoSanguineo", label: "Grupo Sanguíneo (Opcional)" },
            { name: "alergias", label: "Alergias (Opcional)" },
            { name: "enfermedadesPreexistentes", label: "Enfermedades Preexistentes (Opcional)" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block mb-1">{label}</label>
              <Field type="text" name={name} className="w-full p-2 border rounded" />
            </div>
          ))}
          
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Actualizar Paciente
          </button>
          <a
              type="submit"
              className="w-full flex justify-center bg-red-500 text-white py-2 rounded hover:bg-red-600"
              onClick={() => navigate("/dashboard")}>
              Cancelar
            </a>
        </div>
      </Form>
    </Formik>
  );
};

export default EditarPaciente;
