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
  const [especialidades, setEspecialidades] = useState([]);
  const [salas, setSalas] = useState([]);

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
      then: (schema) =>
        schema
          .required("Área es requerida")
          .oneOf(["Administrativa", "Recepcion", "Otra"], "Área inválida"),
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

        // Obtener especialidades y salas para los selects
        const [especialidadesResponse, salasResponse] = await Promise.all([
          axios.get("http://localhost:8000/api/especialidades", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/api/salas", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        console.log("Especialidades recibidas:", especialidadesResponse.data);
        console.log("Salas recibidas:", salasResponse.data);

        // Extraer el array de datos de la respuesta
        const especialidadesData =
          especialidadesResponse.data?.data ||
          especialidadesResponse.data ||
          [];
        const salasData = salasResponse.data?.data || salasResponse.data || [];

        console.log("Especialidades procesadas:", especialidadesData);
        console.log("Salas procesadas:", salasData);

        setEspecialidades(especialidadesData);
        setSalas(salasData);

        // Obtener datos específicos del rol
        let roleData = {};
        if (userResponse.data.rol === "medico") {
          try {
            const medicoResponse = await axios.get(
              `http://localhost:8000/api/medicos/usuario/${id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            roleData = medicoResponse.data;
            console.log("Datos del médico:", roleData);
          } catch (error) {
            console.log(
              "No se encontraron datos de médico para este usuario",
              error.message
            );
            roleData = { especialidad: null, sala: null };
          }
        } else if (userResponse.data.rol === "enfermero") {
          try {
            const enfermeroResponse = await axios.get(
              `http://localhost:8000/api/enfermeros/usuario/${id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            roleData = enfermeroResponse.data;
          } catch (error) {
            console.log(
              "No se encontraron datos de enfermero para este usuario",
              error.message
            );
            roleData = { area: "" };
          }
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

  // Función para extraer ID de especialidad
  const getEspecialidadId = () => {
    if (!relatedData?.especialidad) return "";
    if (typeof relatedData.especialidad === "string")
      return relatedData.especialidad;
    const id = relatedData.especialidad._id || "";
    console.log("Especialidad ID extraído:", id);
    return id;
  };

  // Función para extraer ID de sala
  const getSalaId = () => {
    if (!relatedData?.sala) return "";
    if (typeof relatedData.sala === "string") return relatedData.sala;
    const id = relatedData.sala._id || "";
    console.log("Sala ID extraído:", id);
    return id;
  };

  return (
    <Formik
      initialValues={{
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        ci: usuario.ci,
        contrasena: "",
        confirmcontrasena: "",
        rol: usuario.rol,
        especialidad: getEspecialidadId(),
        sala: getSalaId(),
        area: relatedData?.area || "",
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values }) => {
        console.log("Valores actuales del formulario:", values);
        return (
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
                      as="select"
                      name="especialidad"
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Seleccionar especialidad</option>
                      {(() => {
                        console.log(
                          "Renderizando especialidades:",
                          especialidades,
                          "Es array?",
                          Array.isArray(especialidades)
                        );
                        return (
                          Array.isArray(especialidades) &&
                          especialidades.map((esp) => (
                            <option key={esp._id} value={esp._id}>
                              {esp.nombre}
                            </option>
                          ))
                        );
                      })()}
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
                    >
                      <option value="">Seleccionar sala</option>
                      {(() => {
                        console.log(
                          "Renderizando salas:",
                          salas,
                          "Es array?",
                          Array.isArray(salas)
                        );
                        return (
                          Array.isArray(salas) &&
                          salas.map((sala) => (
                            <option key={sala._id} value={sala._id}>
                              {sala.nombre}
                            </option>
                          ))
                        );
                      })()}
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
                    <option value="">Seleccionar área de trabajo</option>
                    <option value="Administrativa">Área Administrativa</option>
                    <option value="Recepcion">
                      Recepción y Atención al Paciente
                    </option>
                    <option value="Otra">Otra área</option>
                  </Field>
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
        );
      }}
    </Formik>
  );
};

export default EditarUsuario;
