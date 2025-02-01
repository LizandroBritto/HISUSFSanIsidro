import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import TableComponent from "../components/TableComponent";

const Dashboard = () => {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Cargar datos del dashboard aquí
      setLoading(false);
    }
  }, [user]);
  if (loading) {
    return <div>Cargando...</div>; // Spinner o mensaje de carga
  }

  return (
    <div>
     
      <TableComponent />
    </div>
  );
};

export default Dashboard;