import { Button, TextInput, Label, Card, Alert } from "flowbite-react";
import { HiUser, HiLockClosed, HiExclamationCircle } from "react-icons/hi";
import * as Yup from "yup";
import { ErrorMessage, Formik, Form } from "formik";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

const LoginForm = ({ formType }) => {
  const { setUser, setToken } = useContext(UserContext); // Añade setToken
  const navigate = useNavigate();

  const handleSubmit = (values, { setSubmitting, setErrors, resetForm }) => {
    if (formType === "Registrarse") {
      registerUser(values, setErrors);
    } else {
      loginUser(values, setErrors);
    }
    setSubmitting(false);
    resetForm();
  };

  const registerUser = async (values, setErrors) => {
    try {
      // Si el registro es solo para administradores, quita esta función
      const res = await axios.post(
        "http://localhost:8000/api/usuarios/register",
        {
          nombre: "Nombre temporal", // Campos requeridos
          apellido: "Apellido temporal",
          ci: values.ci,
          contrasena: values.contrasena,
          rol: "paciente", // Rol por defecto
        },
        { withCredentials: true }
      );
      loginUser(values, setErrors);
    } catch (err) {
      setErrors({ general: err.response?.data?.error || "Error en registro" });
    }
  };

  const loginUser = async (values, setErrors) => {
    try {
      const res = await axios.post(
        "http://localhost:8000/api/usuarios/login",
        {
          ci: values.ci,
          contrasena: values.contrasena,
        },
        { withCredentials: true }
      );

      // Actualiza el estado ANTES de navegar
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      // Navegar después de actualizar el estado
      setTimeout(() => navigate("/dashboard"), 0); // Pequeño delay para asegurar la actualización
    } catch (err) {
      setErrors({ general: "Credenciales inválidas" });
    }
  };
  const validationSchema = Yup.object().shape({
    ci: Yup.string().required("Cédula es requerida"),
    contrasena: Yup.string()
      .min(6, "Mínimo 6 caracteres") // Coincide con el backend
      .required("Contraseña es requerida"),
    ...(formType === "Registrarse"
      ? {
          confirmcontrasena: Yup.string()
            .oneOf(
              [Yup.ref("contrasena"), null],
              "Las contraseñas deben coincidir"
            )
            .required("Confirme la contraseña"),
        }
      : {}),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header con logo/título de la USF */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">USF San Isidro</h1>
          <p className="text-gray-600 mt-2">Sistema de Información de Salud</p>
        </div>

        <Card className="shadow-xl border-0">
          <Formik
            initialValues={{
              ci: "",
              contrasena: "",
              ...(formType === "Registrarse" ? { confirmcontrasena: "" } : {}),
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, values, setFieldValue }) => (
              <Form className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    Iniciar Sesión
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Ingrese sus credenciales para acceder al sistema
                  </p>
                </div>

                {errors.general && (
                  <Alert color="failure" icon={HiExclamationCircle}>
                    <span className="font-medium">Error:</span> {errors.general}
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="ci" value="Cédula de Identidad" />
                    </div>
                    <TextInput
                      id="ci"
                      name="ci"
                      type="text"
                      placeholder="Ingrese su cédula"
                      value={values.ci}
                      onChange={(e) => setFieldValue("ci", e.target.value)}
                      icon={HiUser}
                      required
                      className="w-full"
                    />
                    <ErrorMessage
                      name="ci"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <div>
                    <div className="mb-2 block">
                      <Label htmlFor="contrasena" value="Contraseña" />
                    </div>
                    <TextInput
                      id="contrasena"
                      name="contrasena"
                      type="password"
                      placeholder="Ingrese su contraseña"
                      value={values.contrasena}
                      onChange={(e) =>
                        setFieldValue("contrasena", e.target.value)
                      }
                      icon={HiLockClosed}
                      required
                      className="w-full"
                    />
                    <ErrorMessage
                      name="contrasena"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {formType === "Registrarse" && (
                    <div>
                      <div className="mb-2 block">
                        <Label
                          htmlFor="confirmcontrasena"
                          value="Confirmar Contraseña"
                        />
                      </div>
                      <TextInput
                        id="confirmcontrasena"
                        name="confirmcontrasena"
                        type="password"
                        placeholder="Confirme su contraseña"
                        value={values.confirmcontrasena}
                        onChange={(e) =>
                          setFieldValue("confirmcontrasena", e.target.value)
                        }
                        icon={HiLockClosed}
                        required
                      />
                      <ErrorMessage
                        name="confirmcontrasena"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Ingresando...
                    </>
                  ) : (
                    "Ingresar al Sistema"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    ¿Olvidó su contraseña? Contacte al administrador
                  </p>
                </div>
              </Form>
            )}
          </Formik>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2025 USF San Isidro - Sistema de Información de Salud
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
