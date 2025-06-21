// src/components/modals/customer/AddressModal.jsx

import React, { useState, useEffect } from "react";
import useToggle from "../../../hooks/useToggle";
import useAddresses from "../../../hooks/useAddresses";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import CreateCustomerModal from "./CreateCustomerModal";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";

const AddressModal = ({
  isOpen,
  onClose,
  clientId,
  handleSelectAddress,
}) => {
  const [addresses, setAddresses] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const createAddressModal = useToggle();
  const API_BASE_URL = getApiBaseUrl();
  const { getAddresses } = useAddresses();

  // Al abrir, cargamos direcciones
  useEffect(() => {
    const loadAddresses = async () => {
      if (!isOpen) return;
      const data = await getAddresses(clientId);
      setAddresses(data);
      setErrorMessage(data.length ? "" : "No se pudo cargar la lista de direcciones.");
    };
    loadAddresses();
  }, [isOpen, clientId, getAddresses]);

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
  const handleAddressCreated = async (_client, newAddressData) => {
    createAddressModal.close();
    if (newAddressData) {
      const refreshed = await getAddresses(clientId);
      setAddresses(refreshed);
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
        <CreateCustomerModal
          isOpen
          onClose={createAddressModal.close}
          clientId={clientId}
          onComplete={handleAddressCreated}
        />
      )}
    </>
  );
};

export default AddressModal;
