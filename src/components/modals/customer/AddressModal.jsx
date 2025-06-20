// src/components/modals/customer/AddressModal.jsx

import React, { useState, useEffect } from "react";
import useToggle from "../../../hooks/useToggle";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import CreateAddressModal from "./CreateAddressModal";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";

const AddressModal = ({
  isOpen,
  onClose,
  clientId,
  handleSelectAddress,
  shop,
}) => {
  const [addresses, setAddresses] = useState([]);
  const [storeAddress, setStoreAddress] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const createAddressModal = useToggle();
  const API_BASE_URL = getApiBaseUrl();

  // Al abrir, cargamos direcciones
  useEffect(() => {
    if (isOpen) {
      fetchClientAddresses(clientId);
    }
  }, [isOpen, clientId]);

  const fetchClientAddresses = (id_customer) => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/get_addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id_customer: id_customer,
        origin,
      }),
    })
      .then((response) => {
        if (response.status === 404) {
          // Significa que no hay direcciones
          setAddresses([]);
          return Promise.resolve([]);
        }
        if (!response.ok) {
          throw new Error("Error al obtener direcciones");
        }
        return response.json();
      })
      .then((data) => {
        const validAddresses = (data || [])
          .filter((address) => !address.deleted && address.active)
          .sort((a, b) => new Date(b.date_upd) - new Date(a.date_upd));
        setAddresses(validAddresses);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error("Error direcciones:", error);
        setErrorMessage("No se pudo cargar la lista de direcciones.");
        setAddresses([]);
      });
  };

  // Seleccionar
  const handleAddressSelectInternal = (address) => {
    handleSelectAddress(address);
    onClose();
  };

  // Abrir createAddress
  const handleOpenCreateAddress = () => {
    createAddressModal.open();
  };

  // Al crear dirección => refrescamos la lista
  const handleAddressCreated = (newAddressData) => {
    createAddressModal.close();
    if (newAddressData) {
      // Opcional: si quieres seleccionar la dirección recién creada al volver:
      // handleSelectAddress(newAddressData);
      // onClose();
      // O si prefieres recargar la lista:
      fetchClientAddresses(clientId);
    }
  };

  // Footer del Dialog principal
  const footer = (
    <div style={{ textAlign: "right" }}>
      <Button label="Cerrar" onClick={onClose} className="p-button-text" />
    </div>
  );

  return (
    <>
      <Dialog
        header="Seleccionar Dirección"
        visible={isOpen}
        onHide={onClose}
        footer={footer}
        style={{ width: "50vw" }}
        modal
      >
        <div style={{ padding: "1rem" }}>
          {errorMessage && (
            <p style={{ marginBottom: "1rem", color: "var(--red-500)" }}>
              {errorMessage}
            </p>
          )}

          {/* Crear dirección si no hay direcciones */}
          {addresses.length === 0 && (
            <div className="mb-3" style={{ textAlign: "center" }}>
              <p>No hay direcciones creadas para este cliente.</p>
              <Button
                label="Crear dirección"
                icon="pi pi-plus"
                onClick={handleOpenCreateAddress}
                className="p-button-success"
              />
            </div>
          )}

          {/* Dirección de tienda */}
          {storeAddress && (
            <Card
              title={storeAddress.alias}
              subTitle={storeAddress.address1}
              style={{ cursor: "pointer" }}
              className="mb-3"
              onClick={() => handleAddressSelectInternal(storeAddress)}
            >
              <p className="m-0">
                {storeAddress.postcode} {storeAddress.city}
              </p>
              <p className="m-0">{storeAddress.phone}</p>
            </Card>
          )}

          {/* Lista de direcciones en Card */}
          {addresses.map((addr) => (
            <Card
              key={addr.id_address}
              title={addr.alias}
              subTitle={`${addr.address1} ${addr.address2 || ""}`}
              style={{ cursor: "pointer", marginBottom: "1rem" }}
              onClick={() => handleAddressSelectInternal(addr)}
            >
              <p className="m-0">
                {addr.postcode} {addr.city}
              </p>
              <p className="m-0">{addr.phone}</p>
            </Card>
          ))}
        </div>
      </Dialog>

      {/* Dialog para Crear Direccion */}
      {createAddressModal.isOpen && (
        <CreateAddressModal
          isOpen
          onClose={createAddressModal.close}
          clientId={clientId}
          onAddressCreated={handleAddressCreated}
        />
      )}
    </>
  );
};

export default AddressModal;
