import LoginForm from "../components/LoginForm";
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const Login = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard"); // Si ya está logueado, redirige
  }, [user]);

  return <LoginForm />;
};
export default Login;