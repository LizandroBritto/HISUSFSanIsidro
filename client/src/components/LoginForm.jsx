import { Button } from "flowbite-react";
import * as Yup from 'yup';
import { ErrorMessage, Formik, Field, Form } from 'formik';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import {  UserContext } from '../context/UserContext';

const LoginForm = ({ formType }) => {
    const { setUser, setToken } = useContext(UserContext); // Añade setToken
    const navigate = useNavigate();

    const handleSubmit = (values, { setSubmitting, setErrors, resetForm }) => {
        if (formType === 'Registrarse') {
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
                    rol: "paciente" // Rol por defecto
                },
                { withCredentials: true }
            );
            loginUser(values, setErrors);
        } catch (err) {
            setErrors({ general: err.response?.data?.error || 'Error en registro' });
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
            .min(6, 'Mínimo 6 caracteres') // Coincide con el backend
            .required("Contraseña es requerida"),
        ...(formType === 'Registrarse' ? {
            confirmcontrasena: Yup.string()
                .oneOf([Yup.ref('contrasena'), null], 'Las contraseñas deben coincidir')
                .required("Confirme la contraseña")
        } : {})
    });

    return (
        <Formik
            initialValues={{
                ci: '',
                contrasena: '',
                ...(formType === 'Registrarse' ? { confirmcontrasena: '' } : {})
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
        >
            {({ isSubmitting, errors }) => (
                <Form className="flex flex-col gap-4 justify-center max-w-2xl ml-72">
                    <h2 className="text-xl font-bold text-white ">
                        {formType === "Iniciar Sesion" ? "Iniciar Sesión" : "Iniciar Sesión"}
                    </h2>
                    
                    {errors.general && (
                        <div className="text-red-500 text-sm">{errors.general}</div>
                    )}

                    <div className="">
                        <Field 
                            type="text" 
                            name="ci" 
                            placeholder="Cédula" 
                            className="w-full p-2 rounded text-white"
                        />
                        <ErrorMessage name="ci" component="div" className="text-red-500 text-sm" />
                    </div>

                    <div>
                        <Field 
                            type="password" // Corregido a "password"
                            name="contrasena" 
                            placeholder="Contraseña" 
                            className="w-full p-2 rounded  text-white"
                        />
                        <ErrorMessage name="contrasena" component="div" className="text-red-500 text-sm" />
                    </div>

                    {formType === 'Registrarse' && (
                        <div>
                            <Field 
                                type="password" 
                                name="confirmcontrasena" 
                                placeholder="Confirmar Contraseña" 
                                className="w-full p-2 rounded text-gray-900"
                            />
                            <ErrorMessage name="confirmcontrasena" component="div" className="text-red-500 text-sm" />
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                        {formType === 'Iniciar Sesion' ? 'Ingresar' : 'Registrarme'}
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default LoginForm;