// ClientModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal';

const ClientModal = ({ isOpen, onClose, handleSelectClient }) => {
  // Estado para los clientes y el término de búsqueda
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // Estado para el mensaje de error

  // Función para obtener todos los clientes al abrir el modal
  const fetchAllClients = () => {
    const token = localStorage.getItem('token');
    fetch('https://apitpv.anthonyloor.com/get_all_customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Enviamos un cuerpo vacío si es necesario
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al obtener clientes');
        }
        return response.json();
      })
      .then((data) => {
        // La respuesta es un array de clientes
        setClients(data);
        setErrorMessage(''); // Limpiamos el mensaje de error
      })
      .catch((error) => {
        console.error('Error al obtener clientes:', error);
        setErrorMessage('Error al obtener clientes. Inténtalo de nuevo.');
      });
  };

  // Función para buscar clientes
  const fetchFilteredClients = (filter) => {
    const token = localStorage.getItem('token');
    fetch(`https://apitpv.anthonyloor.com/get_customers_filtered?filter=${encodeURIComponent(filter)}`, {
      method: 'POST', // Según tu ejemplo, seguimos usando POST
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Enviamos un cuerpo vacío si es necesario
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al buscar clientes');
        }
        return response.json();
      })
      .then((data) => {
        // La respuesta es un array de clientes
        setClients(data);
        setErrorMessage(''); // Limpiamos el mensaje de error
      })
      .catch((error) => {
        console.error('Error al buscar clientes:', error);
        setErrorMessage('Error al buscar clientes. Inténtalo de nuevo.');
      });
  };

  // useEffect para obtener todos los clientes cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchAllClients();
      setSearchTerm(''); // Reiniciamos el término de búsqueda
    }
  }, [isOpen]);

  // Función para manejar el cambio en el input de búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      // Si el input está vacío, volvemos a obtener todos los clientes
      fetchAllClients();
    } else if (value.length >= 3) {
      // Si hay texto y al menos 3 caracteres, buscamos clientes filtrados
      fetchFilteredClients(value);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Seleccionar Cliente</h2>
        {/* Input para buscar clientes */}
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        {/* Mostrar mensaje de error si existe */}
        {errorMessage && (
          <div className="mb-4 text-red-600">
            {errorMessage}
          </div>
        )}
        {/* Tabla de clientes */}
        <div className="overflow-y-auto max-h-64">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-2 py-1 border-b">ID</th>
                <th className="px-2 py-1 border-b">Nombre</th>
                <th className="px-2 py-1 border-b">Apellidos</th>
                <th className="px-2 py-1 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id_customer}>
                  <td className="px-2 py-1 border-b">{client.id_customer}</td>
                  <td className="px-2 py-1 border-b">{client.firstname}</td>
                  <td className="px-2 py-1 border-b">{client.lastname}</td>
                  <td className="px-2 py-1 border-b">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                      onClick={() => {
                        handleSelectClient(client);
                        onClose();
                      }}
                    >
                      Seleccionar
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                      onClick={() => alert('Editar cliente')}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && !errorMessage && (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Botón para crear nuevo cliente */}
        <div className="mt-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
            onClick={() => alert('Crear nuevo cliente')}
          >
            Crear Cliente Nuevo
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ClientModal;
