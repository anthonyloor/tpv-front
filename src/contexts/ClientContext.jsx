// src/contexts/ClientContext.jsx

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { ConfigContext } from "./ConfigContext";
import useCustomers from "../hooks/useCustomers";
import useAddresses from "../hooks/useAddresses";

export const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [selectedClient, setSelectedClient] = useState({});
  const [selectedAddress, setSelectedAddress] = useState(null);
  const { configData } = useContext(ConfigContext);
  const { getFilteredCustomers } = useCustomers();
  const { getAddresses } = useAddresses();

  const fetchDefaultClientAndAddress = useCallback(async () => {
    try {
      const idCustomerDefault = configData.id_customer_default;
      const idAddressDefault = configData.id_address_delivery_default;

      const clientsResponse = await getFilteredCustomers({
        filter: "",
        id_customer: idCustomerDefault,
      });
      if (!clientsResponse || clientsResponse.length === 0) {
        console.error("No se encontró el cliente predeterminado");
        return;
      }
      const clientResponse = clientsResponse[0];
      const clientData = {
        id_customer: clientResponse.id_customer,
        id_default_group: clientResponse.id_default_group,
        firstname: clientResponse.firstname,
        lastname: clientResponse.lastname,
        full_name: `${clientResponse.firstname} ${clientResponse.lastname}`,
      };

      const addressesResponse = await getAddresses(idCustomerDefault, "mayret");
      const validAddresses = addressesResponse.filter(
        (address) => !address.deleted && address.active
      );
      const selectedAddressData = validAddresses.find(
        (address) => address.id_address === idAddressDefault
      );

      if (!selectedAddressData) {
        console.error("No se encontró la dirección predeterminada");
        return;
      }

      setSelectedClient(clientData);
      setSelectedAddress(selectedAddressData);
      localStorage.setItem("selectedClient", JSON.stringify(clientData));
      localStorage.setItem(
        "selectedAddress",
        JSON.stringify(selectedAddressData)
      );
    } catch (error) {
      console.error(
        "Error al obtener el cliente y dirección predeterminados:",
        error
      );
    }
  }, [configData, getFilteredCustomers, getAddresses]);

  useEffect(() => {
    const storedClient = JSON.parse(localStorage.getItem("selectedClient"));
    const storedAddress = JSON.parse(localStorage.getItem("selectedAddress"));

    if (storedClient && storedAddress) {
      setSelectedClient(storedClient);
      setSelectedAddress(storedAddress);
    } else if (
      configData &&
      configData.id_customer_default &&
      configData.id_address_delivery_default
    ) {
      fetchDefaultClientAndAddress();
    }
  }, [configData, fetchDefaultClientAndAddress]);

  const resetToDefaultClientAndAddress = useCallback(() => {
    fetchDefaultClientAndAddress();
  }, [fetchDefaultClientAndAddress]);

  return (
    <ClientContext.Provider
      value={{
        selectedClient,
        setSelectedClient,
        selectedAddress,
        setSelectedAddress,
        resetToDefaultClientAndAddress,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};
