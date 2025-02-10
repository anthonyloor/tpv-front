// src/components/modals/customer/AddressModal.jsx

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const AddressModal = ({
  isOpen,
  onClose,
  clientId,
  handleSelectAddress,
  shop,
}) => {
  const [addresses, setAddresses] = useState([]);
  const [storeAddress, setStoreAddress] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchClientAddresses = (id_customer) => {
        const token = localStorage.getItem("token");
        fetch(
          `https://apitpv.anthonyloor.com/get_addresses?customer=${id_customer}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          }
        )
          .then((response) => {
            if (!response.ok) throw new Error("Error al obtener direcciones");
            return response.json();
          })
          .then((data) => {
            const validAddresses = data
              .filter((address) => !address.deleted && address.active)
              .sort((a, b) => new Date(b.date_upd) - new Date(a.date_upd));
            setAddresses(validAddresses);
          })
          .catch((error) => console.error("Error direcciones:", error));

        // Configuramos la dirección de tienda
        setStoreAddress({
          id_address: "store",
          alias: "Vender en tienda",
          address1: `Calle ${shop.name}`,
          address2: "",
          postcode: "",
          city: "",
          phone: "",
        });
      };
      fetchClientAddresses(clientId);
    }
  }, [isOpen, clientId, shop.name]);

  const handleAddressSelect = (address) => {
    handleSelectAddress(address);
    onClose();
  };

  const footer = (
    <div style={{ textAlign: "right" }}>
      <Button label="Cerrar" onClick={onClose} className="p-button-text" />
    </div>
  );

  return (
    <Dialog
      header="Seleccionar Dirección"
      visible={isOpen}
      onHide={onClose}
      footer={footer}
      style={{ width: "50vw" }}
      modal
    >
      <div style={{ padding: "1rem" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div
            style={{
              border: "1px solid var(--surface-border)",
              padding: "1rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => handleAddressSelect(storeAddress)}
          >
            <h3 style={{ fontWeight: "bold", margin: 0 }}>
              {storeAddress?.alias}
            </h3>
            <p style={{ margin: "0.5rem 0 0" }}>{storeAddress?.address1}</p>
          </div>
          {addresses.map((address) => (
            <div
              key={address.id_address}
              style={{
                border: "1px solid var(--surface-border)",
                padding: "1rem",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => handleAddressSelect(address)}
            >
              <h3 style={{ fontWeight: "bold", margin: 0 }}>{address.alias}</h3>
              <p style={{ margin: "0.5rem 0 0" }}>
                {address.address1} {address.address2}
              </p>
              <p style={{ margin: "0.5rem 0 0" }}>
                {address.postcode} {address.city}
              </p>
              <p style={{ margin: "0.5rem 0 0" }}>{address.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </Dialog>
  );
};

export default AddressModal;
