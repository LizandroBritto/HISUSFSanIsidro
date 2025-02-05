import * as Yup from "yup";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Registro = () => {
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    nombre: Yup.string().min(3, "Mínimo 3 caracteres").required("Nombre es requerido"),
    apellido: Yup.string().min(3, "Mínimo 3 caracteres").required("Apellido es requerido"),
    ci: Yup.string().min(7, "Mínimo 7 caracteres").required("CI es requerido"),
    contrasena: Yup.string().min(6, "Mínimo 6 caracteres").required("Contraseña es requerida"),
    confirmcontrasena: Yup.string()
      .oneOf([Yup.ref("contrasena"), null], "Las contraseñas no coinciden")
      .required("Confirma la contraseña"),
    rol: Yup.string().required("Rol es requerido"),
  });

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const response = await axios.post("http://localhost:8000/api/usuarios/register", values);
      if (response.status === 201) {
        Swal.fire({
          title: "Registro exitoso",
          icon: "success",
          draggable: true,
        });
        resetForm();
        navigate("/login");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.error || "Error en el registro",
      });
    }
  };

  return (
    <Formik
      initialValues={{ nombre: "", apellido: "", ci: "", contrasena: "", confirmcontrasena: "", rol: "" }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      <Form className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Registro</h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1">Nombre</label>
            <Field type="text" name="nombre" className="w-full p-2 border rounded" />
            <ErrorMessage name="nombre" component="div" className="text-red-500 text-sm" />
          </div>
          <div>
            <label className="block mb-1">Apellido</label>
            <Field type="text" name="apellido" className="w-full p-2 border rounded" />
            <ErrorMessage name="apellido" component="div" className="text-red-500 text-sm" />
          </div>
          <div>
            <label className="block mb-1">CI</label>
            <Field type="number" name="ci" className="w-full p-2 border rounded" />
            <ErrorMessage name="ci" component="div" className="text-red-500 text-sm" />
          </div>
          <div>
            <label className="block mb-1">Contraseña</label>
            <Field type="password" name="contrasena" className="w-full p-2 border rounded" />
            <ErrorMessage name="contrasena" component="div" className="text-red-500 text-sm" />
          </div>
          <div>
            <label className="block mb-1">Confirmar Contraseña</label>
            <Field type="password" name="confirmcontrasena" className="w-full p-2 border rounded" />
            <ErrorMessage name="confirmcontrasena" component="div" className="text-red-500 text-sm" />
          </div>
          <div>
            <label className="block mb-1">Rol</label>
            <Field as="select" name="rol" className="w-full p-2 border rounded">
              <option value="">Selecciona un rol</option>
              <option value="administrador">Administrador</option>
              <option value="medico">Médico</option>
              <option value="enfermero">Enfermero</option>
            </Field>
            <ErrorMessage name="rol" component="div" className="text-red-500 text-sm" />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Registrarse
          </button>
        </div>
      </Form>
    </Formik>
  );
};

export default Registro;
