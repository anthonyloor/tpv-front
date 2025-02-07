// src/components/modals/customer/CustomerModal.jsx

import React, { useState, useEffect, useRef } from "react";
import Modal from "../Modal";
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

  // Referencia a la DataTable (opcional, para export, etc.)
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

  // Toolbar (ejemplo) - parte izquierda
  const leftToolbarTemplate = () => (
    <div className="flex flex-wrap gap-2">
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

  // (opcional) parte derecha
  const rightToolbarTemplate = () => (
    <div className="flex flex-wrap gap-2">
      <Button
        label="Crear Cliente"
        icon="pi pi-user-plus"
        severity="success"
        onClick={() => {
          // Cierra modal actual y dispara onCreateNewCustomer
          onClose();
          onCreateNewCustomer && onCreateNewCustomer();
        }}
      />
    </div>
  );

  const renderSelectClient = () => {
    return (
      <div className="p-4">
        <div className="mb-2">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        {errorMessage && (
          <div className="mb-4 text-red-600">{errorMessage}</div>
        )}

        <Toolbar
          className="mb-2"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

        <DataTable
          ref={dt}
          value={clients}
          dataKey="id_customer"
          scrollable
          scrollHeight="400px"
          paginator
          rows={8}
          rowsPerPageOptions={[8, 15, 20]}
          className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
          emptyMessage={
            errorMessage ? errorMessage : "No se encontraron clientes."
          }
          // Single click => Seleccionar
          onRowClick={(e) => handleClientSelect(e.data)}
        >
          <Column
            field="id_customer"
            header="ID"
            style={{ width: "70px" }}
            sortable
          />
          <Column field="firstname" header="Nombre" sortable />
          <Column field="lastname" header="Apellidos" sortable />
          <Column
            field="origin"
            header="Origen"
            style={{ width: "150px" }}
            body={(rowData) => {
              return rowData.origin;
            }}
          />
        </DataTable>
      </div>
    );
  };

  // ==================== Lista de direcciones ====================
  const renderSelectAddress = () => {
    return (
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
    );
  };

  // ==================== Render principal ====================
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton
      showBackButton={showBackButton}
      onBack={goBack}
      size="lg"
      height="tall"
    >
      {step === "selectClient" && renderSelectClient()}
      {step === "selectAddress" && renderSelectAddress()}
    </Modal>
  );
};

export default CustomerModal;
