import React, { useState, useEffect } from 'react';
import Modal from '../Modal';

const CustomerModal = ({ isOpen, onClose, handleSelectClientAndAddress }) => {
  // Estados
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState('selectClient'); // 'selectClient' o 'selectAddress'
  const [selectedClient, setSelectedClient] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [storeAddress, setStoreAddress] = useState(null);
  const [selectedClientInfo, setSelectedClientInfo] = useState(null);

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
      setSearchTerm('');
      setStep('selectClient');
      setSelectedClient(null);
      setAddresses([]);
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

  // Función para manejar la selección del cliente
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setStep('selectAddress');
    fetchClientAddresses(client.id_customer);
  };

  // Función para obtener las direcciones del cliente
  const fetchClientAddresses = (id_customer) => {
    const token = localStorage.getItem('token');
    fetch(`https://apitpv.anthonyloor.com/get_addresses?customer=${id_customer}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}), // Enviamos un cuerpo vacío si es necesario
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al obtener direcciones del cliente');
        }
        return response.json();
      })
      .then((data) => {
        // Filtrar y ordenar direcciones
        const validAddresses = data
          .filter((address) => !address.deleted && address.active)
          .sort((a, b) => new Date(b.date_upd) - new Date(a.date_upd));
          setAddresses(validAddresses);
      })
      .catch((error) => {
        console.error('Error al obtener direcciones del cliente:', error);
      });

    // Obtener la dirección de la tienda actual
    const shop = JSON.parse(localStorage.getItem('shop'));
    const storeAddress = {
      id_address: 'store',
      alias: 'Vender en tienda',
      address1: `Calle ${shop.name}`,
      address2: '',
      postcode: '',
      city: '',
      phone: '',
    };
    setStoreAddress(storeAddress);
  };

  // Función para manejar la selección de la dirección
  const handleAddressSelect = (address) => {
    handleSelectClientAndAddress(selectedClient, address);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
      {step === 'selectClient' && (
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
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id_customer}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleClientSelect(client)}
                    >
                    <td className="px-2 py-1 border-b">{client.id_customer}</td>
                    <td className="px-2 py-1 border-b">{client.firstname}</td>
                    <td className="px-2 py-1 border-b">{client.lastname}</td>
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
      )}
      {step === 'selectAddress' && (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Seleccionar Dirección</h2>
            <div className="grid grid-cols-1 gap-4">
              {/* Opción de vender en tienda */}
              <div
                className="border p-4 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => handleAddressSelect(storeAddress)}
              >
                <h3 className="font-bold">{storeAddress.alias}</h3>
                <p>{storeAddress.address1}</p>
              </div>
              {/* Direcciones del cliente */}
              {addresses.map((address) => (
                <div
                  key={address.id_address}
                  className="border p-4 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => handleAddressSelect(address)}
                >
                  <h3 className="font-bold">{address.alias}</h3>
                  <p>{address.address1} {address.address2}</p>
                  <p>{address.postcode} {address.city}</p>
                  <p>{address.phone}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de detalles del cliente */}
      {selectedClientInfo && (
        <Modal isOpen={true} onClose={() => setSelectedClientInfo(null)}>
          {/* Aquí puedes reutilizar el código del modal de detalles del cliente */}
        </Modal>
      )}
    </>
  );
};

export default CustomerModal;