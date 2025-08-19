import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import Swal from "sweetalert2";

const EditarUsuario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [relatedData, setRelatedData] = useState({});

  const validationSchema = Yup.object().shape({
    nombre: Yup.string()
      .min(3, "Mínimo 3 caracteres")
      .required("Nombre es requerido"),
    apellido: Yup.string()
      .min(3, "Mínimo 3 caracteres")
      .required("Apellido es requerido"),
    ci: Yup.string().min(7, "Mínimo 7 caracteres").required("CI es requerido"),
    contrasena: Yup.string().min(6, "Mínimo 6 caracteres"),
    confirmcontrasena: Yup.string().oneOf(
      [Yup.ref("contrasena"), null],
      "Las contraseñas no coinciden"
    ),
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Obtener usuario principal
        const userResponse = await axios.get(
          `http://localhost:8000/api/usuarios/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Obtener datos específicos del rol
        let roleData = {};
        if (userResponse.data.rol === "medico") {
          const medicoResponse = await axios.get(
            `http://localhost:8000/api/medicos/usuario/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          roleData = medicoResponse.data;
        } else if (userResponse.data.rol === "enfermero") {
          const enfermeroResponse = await axios.get(
            `http://localhost:8000/api/enfermeros/usuario/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          roleData = enfermeroResponse.data;
        }

        setUsuario(userResponse.data);
        setRelatedData(roleData);
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire("Error", "No se pudo cargar el usuario", "error");
        navigate("/dashboard");
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const payload = { ...values };

      // Eliminar campos vacíos de contraseña
      if (!payload.contrasena) {
        delete payload.contrasena;
        delete payload.confirmcontrasena;
      }

      // Actualizar usuario principal
      await axios.put(`http://localhost:8000/api/usuarios/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Actualizar datos específicos del rol
      if (values.rol === "medico") {
        await axios.put(
          `http://localhost:8000/api/medicos/${relatedData._id}`,
          {
            especialidad: values.especialidad,
            sala: values.sala,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (values.rol === "enfermero") {
        await axios.put(
          `http://localhost:8000/api/enfermeros/${relatedData._id}`,
          {
            area: values.area,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      Swal.fire(
        "¡Actualizado!",
        "Usuario actualizado correctamente",
        "success"
      );
      navigate("/dashboard");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Error al actualizar el usuario",
      });
    }
  };

  if (!usuario) return <div className="text-center p-4">Cargando...</div>;

  return (
    <Formik
      initialValues={{
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        ci: usuario.ci,
        contrasena: "",
        confirmcontrasena: "",
        rol: usuario.rol,
        especialidad: relatedData.especialidad || "",
        sala: relatedData.sala || "",
        area: relatedData.area || "",
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values }) => (
        <Form className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Editar Usuario</h2>

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
                    type="text"
                    name="especialidad"
                    className="w-full p-2 border rounded"
                  />
                  <ErrorMessage
                    name="especialidad"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-1">Sala</label>
                  <Field
                    type="text"
                    name="sala"
                    className="w-full p-2 border rounded"
                  />
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
                  type="text"
                  name="area"
                  className="w-full p-2 border rounded"
                />
                <ErrorMessage
                  name="area"
                  component="div"
                  className="text-red-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block mb-1">
                Nueva Contraseña (dejar en blanco para no cambiar)
              </label>
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
              <label className="block mb-1">Confirmar Nueva Contraseña</label>
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
              Actualizar Usuario
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default EditarUsuario;
