import React, { useState } from 'react';
import Modal from '../Modal';
import { useApiFetch } from '../../../components/utils/useApiFetch';

const CreateCustomerModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const apiFetch = useApiFetch();
  const [customerData, setCustomerData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    id_shop: '', 
    id_default_group: '',
  });
  const [addressData, setAddressData] = useState({
    id_country: '',
    id_state: '',
    alias: '',
    company: '',
    lastname: '',
    firstname: '',
    address1: '',
    address2: '',
    postcode: '',
    city: '',
    other: '',
    phone: '',
    phone_mobile: '',
    vat_number: '',
    dni: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [newCustomerId, setNewCustomerId] = useState(null);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCustomer = async () => {
    try {
      const data = await apiFetch('https://apitpv.anthonyloor.com/create_customer', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });
      if (data && data.id_customer) {
        setNewCustomerId(data.id_customer);
        // Asumimos que los nombres y apellidos del address deben coincidir con los del cliente
        setAddressData(prev => ({
          ...prev,
          firstname: customerData.firstname,
          lastname: customerData.lastname,
        }));
        setStep(2);
        setErrorMessage('');
      } else {
        setErrorMessage('No se pudo crear el cliente.');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Error al crear el cliente.');
    }
  };

  const handleCreateAddress = async () => {
    try {
      const addressPayload = { ...addressData, id_customer: newCustomerId };
      const createdAddress = await apiFetch('https://apitpv.anthonyloor.com/create_address', {
        method: 'POST',
        body: JSON.stringify(addressPayload),
      });
      
      // Llamar a onComplete con cliente y dirección creados si se proporcionó
      if (onComplete) {
        const createdClient = { ...customerData, id_customer: newCustomerId };
        onComplete(createdClient, createdAddress);
      }
      // Si se crea correctamente la dirección, cerrar el modal o reiniciar el flujo
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage('Error al crear la dirección.');
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div>
          <h3 className="font-bold mb-2">Paso 1: Crear Cliente</h3>
          <input type="text" name="firstname" placeholder="Nombre" value={customerData.firstname} onChange={handleCustomerChange} className="w-full p-2 border rounded mb-2" />
          <input type="text" name="lastname" placeholder="Apellidos" value={customerData.lastname} onChange={handleCustomerChange} className="w-full p-2 border rounded mb-2" />
          <input type="email" name="email" placeholder="Email" value={customerData.email} onChange={handleCustomerChange} className="w-full p-2 border rounded mb-2" />
          <input type="password" name="password" placeholder="Contraseña" value={customerData.password} onChange={handleCustomerChange} className="w-full p-2 border rounded mb-2" />
          <input type="number" name="id_shop" placeholder="ID Tienda" value={customerData.id_shop} onChange={handleCustomerChange} className="w-full p-2 border rounded mb-2" />
          <input type="number" name="id_default_group" placeholder="ID Grupo Predeterminado" value={customerData.id_default_group} onChange={handleCustomerChange} className="w-full p-2 border rounded mb-2" />
          {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
          <div className="flex justify-end space-x-2">
            <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={onClose}>Cancelar</button>
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleCreateCustomer}>Crear Cliente</button>
          </div>
        </div>
      );
    } else if (step === 2) {
      return (
        <div>
          <h3 className="font-bold mb-2">Paso 2: Crear Dirección</h3>
          <input type="number" name="id_country" placeholder="ID País" value={addressData.id_country} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          <input type="number" name="id_state" placeholder="ID Estado" value={addressData.id_state} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          <input type="text" name="alias" placeholder="Alias" value={addressData.alias} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          <input type="text" name="company" placeholder="Empresa" value={addressData.company} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          {/* Repetir para otros campos de la dirección según sea necesario */}
          <input type="text" name="address1" placeholder="Dirección 1" value={addressData.address1} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          <input type="text" name="address2" placeholder="Dirección 2" value={addressData.address2} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          <input type="text" name="postcode" placeholder="Código Postal" value={addressData.postcode} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          <input type="text" name="city" placeholder="Ciudad" value={addressData.city} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          <input type="text" name="phone" placeholder="Teléfono" value={addressData.phone} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          <input type="text" name="phone_mobile" placeholder="Móvil" value={addressData.phone_mobile} onChange={handleAddressChange} className="w-full p-2 border rounded mb-2" />
          {/* Agrega campos adicionales según sea necesario */}
          {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}
          <div className="flex justify-end space-x-2">
            <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={onClose}>Cancelar</button>
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleCreateAddress}>Crear Dirección</button>
          </div>
        </div>
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'Crear Cliente' : 'Crear Dirección'}
      showCloseButton
      showBackButton={step === 2}
      onBack={() => step === 2 ? setStep(1) : onClose()}
      size="lg"
      height="tall"
    >
      <div className="mb-4 text-sm text-gray-500">
        {step === 1 
          ? 'Paso 1: Crear Cliente -> Paso 2: Crear Dirección'
          : 'Paso 2: Crear Dirección'}
      </div>
      {renderStepContent()}
    </Modal>
  );
};

export default CreateCustomerModal;