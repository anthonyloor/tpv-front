// src/components/modals/config/CustomerSearchDialog.jsx

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../components/utils/useApiFetch";

const CustomerSearchDialog = ({ isOpen, onClose, onSelect }) => {
  const apiFetch = useApiFetch();
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [step, setStep] = useState(1); // 1: Buscar Cliente, 2: Seleccionar Dirección
  const dt = useRef(null);

  // Fetch Clientes
  const fetchCustomers = async (filter) => {
    try {
      const data = await apiFetch(
        `https://apitpv.anthonyloor.com/get_customers_filtered?filter=${encodeURIComponent(
          filter
        )}`,
        { method: "POST", body: JSON.stringify({}) }
      );
      setCustomers(data);
    } catch (error) {
      console.error("Error al buscar clientes:", error);
      setCustomers([]);
    }
  };

  // Fetch Direcciones
  const fetchAddresses = async (customerId) => {
    try {
      const data = await apiFetch(
        `https://apitpv.anthonyloor.com/get_addresses?customer=${customerId}`,
        { method: "POST", body: JSON.stringify({}) }
      );
      setAddresses(data);
    } catch (error) {
      console.error("Error al obtener direcciones:", error);
      setAddresses([]);
    }
  };

  useEffect(() => {
    if (isOpen && searchTerm.length >= 3) {
      fetchCustomers(searchTerm);
    } else {
      setCustomers([]);
      setAddresses([]);
      setSelectedCustomer(null);
      setSelectedAddress(null);
      setStep(1);
    }
  }, [isOpen, searchTerm, apiFetch]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    fetchAddresses(customer.id_customer);
    setStep(2);
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
  };

  const handleConfirm = () => {
    if (selectedCustomer && selectedAddress) {
      onSelect(selectedCustomer, selectedAddress);
      onClose();
    } else {
      alert("Por favor, selecciona un cliente y una dirección.");
    }
  };

  const renderCustomerTable = () => (
    <div>
      <DataTable
        ref={dt}
        value={customers}
        dataKey="id_customer"
        selectionMode="single"
        selection={selectedCustomer}
        onSelectionChange={(e) => handleCustomerSelect(e.value)}
        scrollable
        scrollHeight="300px"
        emptyMessage="No se encontraron clientes"
        className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
      >
        <Column field="id_customer" header="ID" style={{ width: "70px" }} />
        <Column field="firstname" header="Nombre" />
        <Column field="lastname" header="Apellidos" />
      </DataTable>
    </div>
  );

  const renderAddressTable = () => (
    <div>
      <DataTable
        value={addresses}
        dataKey="id_address"
        selectionMode="single"
        selection={selectedAddress}
        onSelectionChange={(e) => handleAddressSelect(e.value)}
        scrollable
        scrollHeight="300px"
        emptyMessage="No se encontraron direcciones"
        className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
      >
        <Column field="address1" header="Dirección" />
        <Column field="city" header="Ciudad" />
        <Column field="postcode" header="Código Postal" />
      </DataTable>
    </div>
  );

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" className="p-button-text" onClick={onClose} />
      {step === 2 && (
        <Button
          label="Aceptar"
          className="p-button-primary"
          onClick={handleConfirm}
          disabled={!selectedAddress}
        />
      )}
    </div>
  );

  return (
    <Dialog
      header={step === 1 ? "Buscar Cliente" : "Seleccionar Dirección"}
      visible={isOpen}
      onHide={onClose}
      modal
      style={{ width: "50vw" }}
      footer={footer}
    >
      {step === 1 ? (
        <div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">
              Buscar Cliente
            </label>
            <InputText
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {renderCustomerTable()}
        </div>
      ) : (
        <div>
          {selectedCustomer && (
            <p className="mb-3">
              Selecciona una dirección para {selectedCustomer.firstname}{" "}
              {selectedCustomer.lastname}
            </p>
          )}
          {renderAddressTable()}
        </div>
      )}
    </Dialog>
  );
};

export default CustomerSearchDialog;
