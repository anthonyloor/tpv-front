// src/components/modals/customer/CustomerModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal';

const CustomerModal = ({ isOpen, onClose, handleSelectClientAndAddress }) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState('selectClient');
  const [selectedClient, setSelectedClient] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [storeAddress, setStoreAddress] = useState(null);
  const [selectedClientInfo, setSelectedClientInfo] = useState(null);

  const fetchAllClients = () => {
    const token = localStorage.getItem('token');
    fetch('https://apitpv.anthonyloor.com/get_all_customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al obtener clientes');
        }
        return response.json();
      })
      .then((data) => {
        setClients(data);
        setErrorMessage('');
      })
      .catch((error) => {
        console.error('Error al obtener clientes:', error);
        setErrorMessage('Error al obtener clientes. Inténtalo de nuevo.');
      });
  };

  const fetchFilteredClients = (filter) => {
    const token = localStorage.getItem('token');
    fetch(`https://apitpv.anthonyloor.com/get_customers_filtered?filter=${encodeURIComponent(filter)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al buscar clientes');
        }
        return response.json();
      })
      .then((data) => {
        setClients(data);
        setErrorMessage('');
      })
      .catch((error) => {
        console.error('Error al buscar clientes:', error);
        setErrorMessage('Error al buscar clientes. Inténtalo de nuevo.');
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllClients();
      setSearchTerm('');
      setStep('selectClient');
      setSelectedClient(null);
      setAddresses([]);
    }
  }, [isOpen]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      fetchAllClients();
    } else if (value.length >= 3) {
      fetchFilteredClients(value);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setStep('selectAddress');
    fetchClientAddresses(client.id_customer);
  };

  const fetchClientAddresses = (id_customer) => {
    const token = localStorage.getItem('token');
    fetch(`https://apitpv.anthonyloor.com/get_addresses?customer=${id_customer}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al obtener direcciones del cliente');
        }
        return response.json();
      })
      .then((data) => {
        const validAddresses = data
          .filter((address) => !address.deleted && address.active)
          .sort((a, b) => new Date(b.date_upd) - new Date(a.date_upd));
        setAddresses(validAddresses);
      })
      .catch((error) => {
        console.error('Error al obtener direcciones del cliente:', error);
      });

    const shop = JSON.parse(localStorage.getItem('shop'));
    const storeAddr = {
      id_address: 'store',
      alias: 'Vender en tienda',
      address1: `Calle ${shop.name}`,
      address2: '',
      postcode: '',
      city: '',
      phone: '',
    };
    setStoreAddress(storeAddr);
  };

  const handleAddressSelect = (address) => {
    handleSelectClientAndAddress(selectedClient, address);
    onClose();
  };

  const goBack = () => {
    if (step === 'selectAddress') {
      setStep('selectClient');
    } else {
      onClose();
    }
  };

  let title = 'Seleccionar Cliente';
  let showBackButton = false;
  if (step === 'selectAddress') {
    title = 'Seleccionar Dirección';
    showBackButton = true;
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        showCloseButton={true}
        showBackButton={showBackButton}
        onBack={goBack}
        size="md"
        height="md"
      >
        {step === 'selectClient' && (
          <div className="p-4">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            {errorMessage && (
              <div className="mb-4 text-red-600">
                {errorMessage}
              </div>
            )}
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
            <div className="grid grid-cols-1 gap-4">
              <div
                className="border p-4 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => handleAddressSelect(storeAddress)}
              >
                <h3 className="font-bold">{storeAddress.alias}</h3>
                <p>{storeAddress.address1}</p>
              </div>
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

      {selectedClientInfo && (
        <Modal isOpen={true} onClose={() => setSelectedClientInfo(null)} title="Detalles del Cliente">
          {/* Aquí el contenido del modal de detalles del cliente */}
        </Modal>
      )}
    </>
  );
};

export default CustomerModal;