// src/ClientContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useApiFetch } from '../components/utils/useApiFetch';
import { ConfigContext } from './ConfigContext';

export const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [selectedClient, setSelectedClient] = useState({ id_customer: 0, firstname: '', lastname: '', full_name: 'Cliente genérico' });
  const [selectedAddress, setSelectedAddress] = useState(null);
  const { configData } = React.useContext(ConfigContext);
  const apiFetch = useApiFetch();

  // Función para obtener el cliente y dirección predeterminados
  const fetchDefaultClientAndAddress = useCallback(async () => {
    try {
      const idCustomerDefault = configData.id_customer_default;
      const idAddressDefault = configData.id_address_delivery_default;

      // Obtener información del cliente
      const clientsResponse = await apiFetch(`https://apitpv.anthonyloor.com/get_customers_filtered?filter=${idCustomerDefault}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (!clientsResponse || clientsResponse.length === 0) {
        console.error('No se encontró el cliente predeterminado');
        return;
      }

      const clientResponse = clientsResponse[0];

      const clientData = {
        id_customer: clientResponse.id_customer,
        firstname: clientResponse.firstname,
        lastname: clientResponse.lastname,
        full_name: `${clientResponse.firstname} ${clientResponse.lastname}`,
      };

      // Obtener direcciones del cliente
      const addressesResponse = await apiFetch(`https://apitpv.anthonyloor.com/get_addresses?customer=${idCustomerDefault}`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const validAddresses = addressesResponse.filter(
        (address) => !address.deleted && address.active
      );

      const selectedAddressData = validAddresses.find(
        (address) => address.id_address === idAddressDefault
      );

      if (!selectedAddressData) {
        console.error('No se encontró la dirección predeterminada');
        return;
      }

      // Establecer en el estado y en localStorage
      setSelectedClient(clientData);
      setSelectedAddress(selectedAddressData);

      localStorage.setItem('selectedClient', JSON.stringify(clientData));
      localStorage.setItem('selectedAddress', JSON.stringify(selectedAddressData));

    } catch (error) {
      console.error('Error al obtener el cliente y dirección predeterminados:', error);
    }
  }, [apiFetch, configData]);

  // Al montar el componente, cargar el cliente y dirección seleccionados
  useEffect(() => {
    const storedClient = JSON.parse(localStorage.getItem('selectedClient'));
    const storedAddress = JSON.parse(localStorage.getItem('selectedAddress'));

    if (storedClient && storedAddress) {
      setSelectedClient(storedClient);
      setSelectedAddress(storedAddress);
    } else if (configData && configData.id_customer_default && configData.id_address_delivery_default) {
      fetchDefaultClientAndAddress();
    }
  }, [configData, fetchDefaultClientAndAddress]);

  // Función para restablecer al cliente y dirección predeterminados
  const resetToDefaultClientAndAddress = useCallback(() => {
    fetchDefaultClientAndAddress();
  }, [fetchDefaultClientAndAddress]);

  return (
    <ClientContext.Provider value={{
      selectedClient,
      setSelectedClient,
      selectedAddress,
      setSelectedAddress,
      resetToDefaultClientAndAddress,
    }}>
      {children}
    </ClientContext.Provider>
  );
};
