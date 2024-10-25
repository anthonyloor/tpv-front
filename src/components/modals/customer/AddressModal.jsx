// AddressModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal';

const AddressModal = ({ isOpen, onClose, clientId, handleSelectAddress, shop }) => {
  const [addresses, setAddresses] = useState([]);
  const [storeAddress, setStoreAddress] = useState(null);

  useEffect(() => {
    if (isOpen) {
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
        const storeAddressData = {
          id_address: 'store',
          alias: 'Vender en tienda',
          address1: `Calle ${shop.name}`,
          address2: '',
          postcode: '',
          city: '',
          phone: '',
        };
        setStoreAddress(storeAddressData);
      };

      fetchClientAddresses(clientId);
    }
  }, [isOpen, clientId, shop.name]);

  // Función para manejar la selección de la dirección
  const handleAddressSelect = (address) => {
    handleSelectAddress(address);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Seleccionar Dirección</h2>
        <div className="grid grid-cols-1 gap-4">
          {/* Opción de vender en tienda */}
          <div
            className="border p-4 rounded cursor-pointer hover:bg-gray-100"
            onClick={() => handleAddressSelect(storeAddress)}
          >
            <h3 className="font-bold">{storeAddress?.alias}</h3>
            <p>{storeAddress?.address1}</p>
          </div>
          {/* Direcciones del cliente */}
          {addresses.map((address) => (
            <div
              key={address.id_address}
              className="border p-4 rounded cursor-pointer hover:bg-gray-100"
              onClick={() => handleAddressSelect(address)}
            >
              <h3 className="font-bold">{address.alias}</h3>
              <p>
                {address.address1} {address.address2}
              </p>
              <p>
                {address.postcode} {address.city}
              </p>
              <p>{address.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default AddressModal;
