import LoginForm from "../components/LoginForm";
import { useContext, useEffect } from "react";
import {jwtDecode} from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const Login = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user && token) {
      try {
        const decodedToken = jwtDecode(token);
        // jwt-decode devuelve el tiempo de expiración en segundos
        if (decodedToken.exp * 1000 > Date.now()) {
          // El token sigue siendo válido
          navigate("/dashboard");
        } else {
          // El token ha expirado: puedes limpiar el localStorage o manejarlo según tu lógica
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Error decodificando token:", error);
      }
    }
  }, [user, navigate]);

  return <LoginForm />;
};
export default Login;