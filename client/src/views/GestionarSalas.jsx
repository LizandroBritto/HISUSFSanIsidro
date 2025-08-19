import { useState, useEffect, useCallback } from "react";
import { Card, Button, TextInput, Label, Modal, Table } from "flowbite-react";
import axios from "axios";

const GestionarSalas = () => {
  const [salas, setSalas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSala, setCurrentSala] = useState(null);
  const [formData, setFormData] = useState({
    numero: "",
    nombre: "",
    capacidad: "",
    descripcion: "",
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSalas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/salas`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("Response salas:", response.data);
      if (response.data && response.data.data) {
        setSalas(response.data.data);
      }
    } catch (error) {
      setError("Error al cargar las salas");
      console.error("Error loading salas:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSalas();
  }, [loadSalas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = `http://localhost:8000/api/salas${
        editMode ? `/${currentSala._id}` : ""
      }`;

      console.log("Sending formData:", formData);

      let response;
      if (editMode) {
        response = await axios.put(url, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      } else {
        response = await axios.post(url, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }

      if (response.data && response.data.data) {
        await loadSalas();
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al guardar la sala");
    }
    setLoading(false);
  };

  const handleEdit = (sala) => {
    setCurrentSala(sala);
    setFormData({
      numero: sala.numero.toString(),
      nombre: sala.nombre,
      capacidad: sala.capacidad.toString(),
      descripcion: sala.descripcion || "",
      activo: sala.activo,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Está seguro de que desea eliminar esta sala?")) return;

    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/salas/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      await loadSalas();
    } catch (error) {
      setError(error.response?.data?.message || "Error al eliminar la sala");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      numero: "",
      nombre: "",
      capacidad: "",
      descripcion: "",
      activo: true,
    });
    setCurrentSala(null);
    setEditMode(false);
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (loading && salas.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Cargando salas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestionar Salas
        </h1>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-primary-700 hover:bg-primary-800"
        >
          Nueva Sala
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400">
          {error}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Número</Table.HeadCell>
              <Table.HeadCell>Nombre</Table.HeadCell>
              <Table.HeadCell>Capacidad</Table.HeadCell>
              <Table.HeadCell>Estado</Table.HeadCell>
              <Table.HeadCell>Descripción</Table.HeadCell>
              <Table.HeadCell>Acciones</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {Array.isArray(salas) &&
                salas.map((sala) => (
                  <Table.Row
                    key={sala._id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {sala.numero}
                    </Table.Cell>
                    <Table.Cell>{sala.nombre}</Table.Cell>
                    <Table.Cell>{sala.capacidad}</Table.Cell>
                    <Table.Cell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sala.activo
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {sala.activo ? "Activo" : "Inactivo"}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="max-w-xs truncate">
                      {sala.descripcion || "Sin descripción"}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(sala)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          color="failure"
                          onClick={() => handleDelete(sala._id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              {(!Array.isArray(salas) || salas.length === 0) && (
                <Table.Row>
                  <Table.Cell
                    colSpan="6"
                    className="text-center py-8 text-gray-500"
                  >
                    No hay salas registradas
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      </Card>

      {/* Modal para crear/editar sala */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="lg">
        <Modal.Header>{editMode ? "Editar Sala" : "Nueva Sala"}</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="numero">Número de Sala *</Label>
              <TextInput
                id="numero"
                name="numero"
                type="number"
                min="1"
                value={formData.numero}
                onChange={handleInputChange}
                required
                placeholder="Ej: 101, 202, etc."
              />
            </div>

            <div>
              <Label htmlFor="nombre">Nombre de la Sala *</Label>
              <TextInput
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Ej: Sala de Emergencias"
              />
            </div>

            <div>
              <Label htmlFor="capacidad">Capacidad *</Label>
              <TextInput
                id="capacidad"
                name="capacidad"
                type="number"
                min="1"
                value={formData.capacidad}
                onChange={handleInputChange}
                required
                placeholder="Número de personas"
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="3"
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500"
                placeholder="Descripción adicional de la sala"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="activo"
                name="activo"
                type="checkbox"
                checked={formData.activo}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-primary-600 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600"
              />
              <Label htmlFor="activo">Sala activa</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                color="gray"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary-700 hover:bg-primary-800"
              >
                {loading ? "Guardando..." : editMode ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default GestionarSalas;
