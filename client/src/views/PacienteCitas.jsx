import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Table, Button } from "flowbite-react";
import axios from "axios";

const PacienteCitas = () => {
  const { id } = useParams(); // id del paciente
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const token = localStorage.getItem("token");
        // Se asume que tienes un endpoint que devuelve las citas de un paciente.
        const response = await axios.get(`http://localhost:8000/api/citas/paciente/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCitas(response.data);
        setError("");
      } catch (err) {
        setError("Error al obtener las citas del paciente");
      } finally {
        setLoading(false);
      }
    };
    fetchCitas();
  }, [id]);

  if (loading) return <p className="text-center">Cargando citas...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="overflow-x-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Citas del Paciente</h1>
      {citas.length === 0 ? (
        <p className="text-center">No se encontraron citas para este paciente.</p>
      ) : (
        <Table hoverable className="shadow-lg">
          <Table.Head>
              <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">Fecha</Table.HeadCell>
              <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">Hora</Table.HeadCell>
              <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">Estado</Table.HeadCell>
              <Table.HeadCell className="bg-gray-50 dark:bg-gray-800">Acciones</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {citas.map((cita) => (
              <Table.Row key={cita._id}  className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Table.Cell>{new Date(cita.fecha).toLocaleDateString()}</Table.Cell>
                <Table.Cell>{cita.hora}</Table.Cell>
                <Table.Cell>{cita.estado}</Table.Cell>
                <Table.Cell>
                  <Button
                    as={Link}
                    to={`/cita-detalle/${cita._id}`}
                    size="xs"
                    color="info"
                  >
                    Ver Detalle
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      <Button
        onClick={() => navigate("/dashboard")}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
      >
        Volver al Dashboard
      </Button>
    </div>
  );
};

export default PacienteCitas;
