import * as Yup from "yup";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { useContext, useState, useEffect } from "react";
import Swal from "sweetalert2";

const CrearUsuario = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // Estado para especialidades y salas
  const [especialidades, setEspecialidades] = useState([]);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar especialidades y salas activas
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar especialidades activas
        const especialidadesResponse = await axios.get(
          "http://localhost:8000/api/especialidades?activo=true",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Cargar salas activas
        const salasResponse = await axios.get(
          "http://localhost:8000/api/salas?activo=true",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (especialidadesResponse.data.success) {
          setEspecialidades(especialidadesResponse.data.data);
        }

        if (salasResponse.data.success) {
          setSalas(salasResponse.data.data);
        }
      } catch (error) {
        console.error("Error cargando especialidades y salas:", error);
      }
      setLoading(false);
    };

    cargarDatos();
  }, []);

  const validationSchema = Yup.object().shape({
    nombre: Yup.string()
      .min(3, "Mínimo 3 caracteres")
      .required("Nombre es requerido"),
    apellido: Yup.string()
      .min(3, "Mínimo 3 caracteres")
      .required("Apellido es requerido"),
    ci: Yup.string().min(7, "Mínimo 7 caracteres").required("CI es requerido"),
    contrasena: Yup.string()
      .min(6, "Mínimo 6 caracteres")
      .required("Contraseña es requerida"),
    confirmcontrasena: Yup.string()
      .oneOf([Yup.ref("contrasena"), null], "Las contraseñas no coinciden")
      .required("Confirma la contraseña"),
    rol: Yup.string()
      .required("Rol es requerido")
      .oneOf(["administrador", "medico", "enfermero"], "Rol inválido"),
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
      const response = await axios.post(
        "http://localhost:8000/api/usuarios/new",
        values,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 201) {
        Swal.fire({
          title: "Usuario creado exitosamente",
          icon: "success",
          draggable: true,
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
    return (
      <div className="p-4">
        <p className="text-red-500">Acceso restringido a administradores</p>
      </div>
    );
  }

  return (
    <Formik
      initialValues={{
        nombre: "",
        apellido: "",
        ci: "",
        contrasena: "",
        confirmcontrasena: "",
        rol: "",
        especialidad: "",
        sala: "",
        area: "",
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ values }) => (
        <Form className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Crear Nuevo Usuario</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-1">Nombre</label>
              <Field
                type="text"
                name="nombre"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="nombre"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">Apellido</label>
              <Field
                type="text"
                name="apellido"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="apellido"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">CI</label>
              <Field
                type="number"
                name="ci"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="ci"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">Rol</label>
              <Field
                as="select"
                name="rol"
                className="w-full p-2 border rounded"
              >
                <option value="">Seleccionar rol</option>
                <option value="administrador">Administrador</option>
                <option value="medico">Médico</option>
                <option value="enfermero">Enfermero</option>
              </Field>
              <ErrorMessage
                name="rol"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {values.rol === "medico" && (
              <>
                <div>
                  <label className="block mb-1">Especialidad</label>
                  <Field
                    as="select"
                    name="especialidad"
                    className="w-full p-2 border rounded"
                    disabled={loading}
                  >
                    <option value="">
                      {loading
                        ? "Cargando especialidades..."
                        : "Seleccionar especialidad"}
                    </option>
                    {especialidades.map((esp) => (
                      <option key={esp._id} value={esp._id}>
                        {esp.nombre}
                      </option>
                    ))}
                    {!loading && especialidades.length === 0 && (
                      <option value="" disabled>
                        No hay especialidades activas
                      </option>
                    )}
                  </Field>
                  <ErrorMessage
                    name="especialidad"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1">Sala</label>
                  <Field
                    as="select"
                    name="sala"
                    className="w-full p-2 border rounded"
                    disabled={loading}
                  >
                    <option value="">
                      {loading ? "Cargando salas..." : "Seleccionar sala"}
                    </option>
                    {salas.map((sala) => (
                      <option key={sala._id} value={sala._id}>
                        Sala {sala.numero} - {sala.nombre}
                      </option>
                    ))}
                    {!loading && salas.length === 0 && (
                      <option value="" disabled>
                        No hay salas activas
                      </option>
                    )}
                  </Field>
                  <ErrorMessage
                    name="sala"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
              </>
            )}

            {values.rol === "enfermero" && (
              <div>
                <label className="block mb-1">Área</label>
                <Field
                  as="select"
                  name="area"
                  className="w-full p-2 border rounded"
                >
                  <option value="">Seleccionar área</option>
                  <option value="Administrativa">Administrativa</option>
                  <option value="Recepcion">Recepción</option>
                  <option value="Otra">Otra</option>
                </Field>
                <ErrorMessage
                  name="area"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block mb-1">Contraseña</label>
              <Field
                type="password"
                name="contrasena"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="contrasena"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1">Confirmar Contraseña</label>
              <Field
                type="password"
                name="confirmcontrasena"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="confirmcontrasena"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Crear Usuario
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CrearUsuario;
