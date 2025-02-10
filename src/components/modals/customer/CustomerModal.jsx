// src/components/modals/customer/CustomerModal.jsx

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";

const CustomerModal = ({
  isOpen,
  onClose,
  handleSelectClientAndAddress,
  onCreateNewCustomer,
}) => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState("selectClient");
  const [selectedClient, setSelectedClient] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [storeAddress, setStoreAddress] = useState(null);

  const dt = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep("selectClient");
      setSearchTerm("");
      setSelectedClient(null);
      setAddresses([]);
      fetchAllClients();
    }
  }, [isOpen]);

  const fetchAllClients = () => {
    const token = localStorage.getItem("token");
    fetch("https://apitpv.anthonyloor.com/get_all_customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener clientes");
        return res.json();
      })
      .then((data) => {
        setClients(data);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error("Error obtener clientes:", error);
        setErrorMessage("Error al obtener clientes. Inténtalo de nuevo.");
      });
  };

  const fetchFilteredClients = (filter) => {
    const token = localStorage.getItem("token");
    fetch(
      `https://apitpv.anthonyloor.com/get_customers_filtered?filter=${encodeURIComponent(
        filter
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Error al buscar clientes");
        return res.json();
      })
      .then((data) => {
        setClients(data);
        setErrorMessage("");
      })
      .catch((error) => {
        console.error("Error al buscar clientes:", error);
        setErrorMessage("Error al buscar clientes.");
      });
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setStep("selectAddress");
    fetchClientAddresses(client.id_customer);
  };

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
      .then((res) => {
        if (!res.ok)
          throw new Error("Error al obtener direcciones del cliente");
        return res.json();
      })
      .then((data) => {
        const validAddresses = data
          .filter((address) => !address.deleted && address.active)
          .sort((a, b) => new Date(b.date_upd) - new Date(a.date_upd));
        setAddresses(validAddresses);
      })
      .catch((error) => {
        console.error("Error direcciones cliente:", error);
      });

    const shop = JSON.parse(localStorage.getItem("shop"));
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

  const handleAddressSelect = (address) => {
    if (handleSelectClientAndAddress) {
      handleSelectClientAndAddress(selectedClient, address);
    }
    onClose();
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim() === "") {
      fetchAllClients();
    } else if (value.length >= 3) {
      fetchFilteredClients(value);
    }
  };

  const goBack = () => {
    if (step === "selectAddress") {
      setStep("selectClient");
    } else {
      onClose();
    }
  };

  let title = "Seleccionar Cliente";
  let showBackButton = false;
  if (step === "selectAddress") {
    title = "Seleccionar Dirección";
    showBackButton = true;
  }

  const leftToolbarTemplate = () => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        label=""
        icon="pi pi-refresh"
        onClick={() => {
          setSearchTerm("");
          fetchAllClients();
        }}
      />
    </div>
  );

  const rightToolbarTemplate = () => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        label="Crear Cliente"
        icon="pi pi-user-plus"
        severity="success"
        onClick={() => {
          onClose();
          onCreateNewCustomer && onCreateNewCustomer();
        }}
      />
    </div>
  );

  const renderSelectClient = () => {
    return (
      <div style={{ padding: "1rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--surface-border)",
              borderRadius: "4px",
            }}
          />
        </div>
        {errorMessage && (
          <div style={{ marginBottom: "1rem", color: "var(--red-500)" }}>
            {errorMessage}
          </div>
        )}
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} />
        <DataTable
          ref={dt}
          value={clients}
          dataKey="id_customer"
          scrollable
          size="large"
          scrollHeight="470px"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 15, 30]}
          emptyMessage={
            errorMessage ? errorMessage : "No se encontraron clientes."
          }
          className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
          onRowDoubleClick={(e) => handleClientSelect(e.data)}
        >
          <Column
            field="id_customer"
            header="ID"
            style={{ width: "70px" }}
            sortable
          />
          <Column field="firstname" header="Nombre" />
          <Column field="lastname" header="Apellidos" />
          <Column
            field="origin"
            header="Origen"
            style={{ width: "150px" }}
            body={(rowData) => rowData.origin}
          />
        </DataTable>
      </div>
    );
  };

  const renderSelectAddress = () => {
    return (
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
    );
  };

  let content = null;
  if (step === "selectClient") {
    content = renderSelectClient();
  } else if (step === "selectAddress") {
    content = renderSelectAddress();
  }

  const footer = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "1rem",
      }}
    >
      {showBackButton && (
        <Button
          label="Atrás"
          icon="pi pi-arrow-left"
          onClick={goBack}
          className="p-button-text"
        />
      )}
      <Button label="Cerrar" onClick={onClose} className="p-button-text" />
    </div>
  );

  return (
    <Dialog
      header={title}
      visible={isOpen}
      onHide={onClose}
      footer={footer}
      style={{ width: "80vw", minHeight: "70vh" }}
      modal
    >
      {content}
    </Dialog>
  );
};

export default CustomerModal;
