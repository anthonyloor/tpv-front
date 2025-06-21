// src/components/modals/customer/CreateCustomerModal.jsx

import React, { useState, useContext, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { AuthContext } from "../../../contexts/AuthContext";
import { useApiFetch } from "../../../utils/useApiFetch";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Steps } from "primereact/steps";
import { Checkbox } from "primereact/checkbox";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import AddressForm from "./AddressForm";

const CreateCustomerModal = ({
  isOpen,
  onClose,
  onComplete,
  clientId = null,
  firstname = "",
  lastname = "",
}) => {
  const [step, setStep] = useState(1);
  const apiFetch = useApiFetch();
  const { shopId } = useContext(AuthContext);

  const [customerData, setCustomerData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    id_shop: shopId,
    id_default_group: 3,
  });

  const [addressData, setAddressData] = useState({
    id_country: 6,
    id_state: "",
    alias: "direccion-tpv",
    company: "",
    lastname: "",
    firstname: "",
    address1: "",
    address2: "",
    postcode: "",
    city: "",
    other: "",
    phone: "",
    phone_mobile: "",
    vat_number: "",
    dni: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [newCustomerId, setNewCustomerId] = useState(null);
  const [isNoWeb, setIsNoWeb] = useState(false);
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    if (isOpen) {
      if (clientId) {
        setStep(1);
        setNewCustomerId(clientId);
        setAddressData((prev) => ({
          ...prev,
          firstname: firstname || prev.firstname,
          lastname: lastname || prev.lastname,
        }));
      } else {
        setStep(1);
        setNewCustomerId(null);
        setCustomerData((prev) => ({
          ...prev,
          firstname: "",
          lastname: "",
          email: "",
          password: "",
          id_shop: shopId,
          id_default_group: 3,
        }));
        setAddressData((prev) => ({
          ...prev,
          firstname: "",
          lastname: "",
          address1: "",
          address2: "",
          postcode: "",
          city: "",
          phone: "",
          phone_mobile: "",
          company: "",
          dni: "",
        }));
        setIsNoWeb(false);
      }
    }
  }, [isOpen, clientId, firstname, lastname, shopId]);

  const generateRandomString = (length) => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  };

  const handleNoWebToggle = (e) => {
    const checked = e.checked;
    setIsNoWeb(checked);
    if (checked) {
      const localPart = generateRandomString(7);
      const domain = generateRandomString(5);
      const email = `${localPart}@${domain}.com`;
      setCustomerData((prev) => ({
        ...prev,
        email,
        password: localPart,
      }));
    } else {
      setCustomerData((prev) => ({
        ...prev,
        email: "",
        password: "",
      }));
    }
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  // Paso 1: Crear cliente
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch(`${API_BASE_URL}/create_customer`, {
        method: "POST",
        body: JSON.stringify(customerData),
      });
      if (data && data.id_customer) {
        setNewCustomerId(data.id_customer);
        // Se asume que los nombres y apellidos de la dirección deben coincidir con los del cliente
        setAddressData((prev) => ({
          ...prev,
          firstname: customerData.firstname,
          lastname: customerData.lastname,
        }));
        setStep(2);
        setErrorMessage("");
      } else {
        setErrorMessage("No se pudo crear el cliente.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al crear el cliente.");
    }
  };

  // Paso 2: Crear dirección
  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const customerId = clientId || newCustomerId;
      const addressPayload = { ...addressData, id_customer: customerId };
      const createdAddress = await apiFetch(`${API_BASE_URL}/create_address`, {
        method: "POST",
        body: JSON.stringify(addressPayload),
      });
      if (onComplete) {
        const createdClient = clientId
          ? null
          : { ...customerData, id_customer: newCustomerId };
        onComplete(createdClient, createdAddress);
      }
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al crear la dirección.");
    }
  };

  const items = clientId
    ? [{ label: "Crear Dirección" }]
    : [{ label: "Crear Cliente" }, { label: "Crear Dirección" }];

  const renderStepContent = () => {
    if (step === 1 && !clientId) {
      return (
        <form onSubmit={handleCreateCustomer}>
          <div className="p-fluid">
            {/* Primera fila: Nombre y Apellidos */}
            <div className="p-grid">
              <div className="p-col-6">
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">
                    <i className="pi pi-user" />
                  </span>
                  <InputText
                    name="firstname"
                    value={customerData.firstname}
                    onChange={handleCustomerChange}
                    placeholder="Nombre"
                  />
                </div>
              </div>
              <div className="p-col-6">
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">
                    <i className="pi pi-user" />
                  </span>
                  <InputText
                    name="lastname"
                    value={customerData.lastname}
                    onChange={handleCustomerChange}
                    placeholder="Apellidos"
                  />
                </div>
              </div>
            </div>
            {/* Segunda fila: Email y Contraseña */}
            <div className="p-grid" style={{ marginTop: "1rem" }}>
              <div className="p-col-6">
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">
                    <i className="pi pi-envelope" />
                  </span>
                  <InputText
                    type="email"
                    name="email"
                    value={customerData.email}
                    onChange={handleCustomerChange}
                    disabled={isNoWeb}
                    placeholder="Email"
                  />
                </div>
              </div>
              <div className="p-col-6">
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">
                    <i className="pi pi-lock" />
                  </span>
                  <InputText
                    type="password"
                    name="password"
                    value={customerData.password}
                    onChange={handleCustomerChange}
                    disabled={isNoWeb}
                    placeholder="Contraseña"
                  />
                </div>
              </div>
            </div>
            {/* Checkbox "Cliente no web" usando PrimeReact */}
            <div className="p-field-checkbox" style={{ marginTop: "1rem" }}>
              <Checkbox
                inputId="noWeb"
                checked={isNoWeb}
                onChange={handleNoWebToggle}
              />
              <label
                htmlFor="noWeb"
                className="p-checkbox-label"
                style={{ marginLeft: "0.5rem" }}
              >
                Cliente no web
              </label>
            </div>
            {errorMessage && (
              <div className="p-mb-3" style={{ color: "var(--red-500)" }}>
                {errorMessage}
              </div>
            )}
          </div>
        </form>
      );
    } else {
      return (
        <form onSubmit={handleCreateAddress}>
          <h3
            className="p-mb-3"
            style={{ fontWeight: "bold", fontSize: "1.25rem" }}
          >
            {clientId ? "Crear Dirección" : "Paso 2: Crear Dirección"}
          </h3>
          <AddressForm
            addressData={addressData}
            onChange={handleAddressChange}
            setAddressData={setAddressData}
            errorMessage={errorMessage}
          />
        </form>
      );
    }
  };

  const footer = (
    <div
      className="p-d-flex p-jc-end"
      style={{ gap: "0.5rem", marginTop: "1rem" }}
    >
      {step === 2 && !clientId && (
        <Button
          label="Atrás"
          icon="pi pi-arrow-left"
          onClick={() => setStep(1)}
          className="p-button-text"
        />
      )}
      <Button
        label={step === 1 && !clientId ? "Crear Cliente" : "Crear Dirección"}
        onClick={step === 1 && !clientId ? handleCreateCustomer : handleCreateAddress}
        className="p-button-success"
      />
    </div>
  );

  return (
    <Dialog
      header={step === 1 && !clientId ? "Crear Cliente" : "Crear Dirección"}
      visible={isOpen}
      onHide={onClose}
      footer={footer}
      modal
      draggable={false}
      resizable={false}
      style={{
        width: "80vw",
        maxWidth: "800px",
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      <Steps
        model={items}
        activeIndex={clientId ? 0 : step - 1}
        readOnly
        className="mb-3"
      />

      {/* Botón Atrás arriba */}
      {step === 2 && !clientId && (
        <Button
          label="Atrás"
          icon="pi pi-arrow-left"
          onClick={() => setStep(1)}
          className="p-button-text mb-3"
        />
      )}
      {renderStepContent()}
    </Dialog>
  );
};

export default CreateCustomerModal;
