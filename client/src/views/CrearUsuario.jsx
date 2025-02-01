import * as Yup from "yup";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { UserContext } from '../context/UserContext';
import { useContext } from "react";
import Swal from "sweetalert2";

const CrearUsuario = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    nombre: Yup.string().min(3, "Mínimo 3 caracteres").required("Nombre es requerido"),
    apellido: Yup.string().min(3, "Mínimo 3 caracteres").required("Apellido es requerido"),
    ci: Yup.string().min(7, "Mínimo 7 caracteres").required("CI es requerido"),
    contrasena: Yup.string().min(6, "Mínimo 6 caracteres").required("Contraseña es requerida"),
    confirmcontrasena: Yup.string()
      .oneOf([Yup.ref("contrasena"), null], "Las contraseñas no coinciden")
      .required("Confirma la contraseña"),
    rol: Yup.string()
      .required("Rol es requerido")
      .oneOf(["administrador", "medico", "enfermero", "personal de apoyo"], "Rol inválido"),
    especialidad: Yup.string().when("rol", {
      is: "medico",
      then: (schema) => schema.required("Especialidad es requerida"),
      otherwise: (schema) => schema.notRequired(),
    }),
    sala: Yup.string().when("rol", {
      is: "medico",
      then: (schema) => schema.required("Sala es requerida"),
      otherwise: (schema) => schema.notRequired(),
    }),
    area: Yup.string().when("rol", {
      is: "enfermero",
      then: (schema) => schema.required("Área es requerida"),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const response = await axios.post("http://localhost:8000/api/usuarios/new", values, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 201) {
       Swal.fire({
                title: "Usuario creado exitosamente",
                icon: "success",
                draggable: true
              });
        resetForm();
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

  if (user?.rol !== "administrador") {
    return <div className="p-4"><p className="text-red-500">Acceso restringido a administradores</p></div>;
  }

  return (
    <Formik
      initialValues={{ nombre: "", apellido: "", ci: "", contrasena: "", confirmcontrasena: "", rol: "", especialidad: "", sala: "", area: "" }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values }) => (
        <Form className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Crear Nuevo Usuario</h2>
          
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
              <label className="block mb-1">Rol</label>
              <Field as="select" name="rol" className="w-full p-2 border rounded">
                <option value="">Seleccionar rol</option>
                <option value="administrador">Administrador</option>
                <option value="medico">Médico</option>
                <option value="enfermero">Enfermero</option>
                <option value="personal de apoyo">Personal de Apoyo</option>
              </Field>
              <ErrorMessage name="rol" component="div" className="text-red-500 text-sm" />
            </div>
            
            {values.rol === "medico" && (
              <>
                <div>
                  <label className="block mb-1">Especialidad</label>
                  <Field type="text" name="especialidad" className="w-full p-2 border rounded" />
                  <ErrorMessage name="especialidad" component="div" className="text-red-500 text-sm" />
                </div>
                <div>
                  <label className="block mb-1">Sala</label>
                  <Field type="text" name="sala" className="w-full p-2 border rounded" />
                  <ErrorMessage name="sala" component="div" className="text-red-500 text-sm" />
                </div>
              </>
            )}
            
            {values.rol === "enfermero" && (
              <div>
                <label className="block mb-1">Área</label>
                <Field type="text" name="area" className="w-full p-2 border rounded" />
                <ErrorMessage name="area" component="div" className="text-red-500 text-sm" />
              </div>
            )}
            
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
            
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
              Crear Usuario
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CrearUsuario;
