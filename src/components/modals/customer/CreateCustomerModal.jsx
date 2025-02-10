// src/components/modals/customer/CreateCustomerModal.jsx

import React, { useState, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { AuthContext } from "../../../contexts/AuthContext";
import { useApiFetch } from "../../../components/utils/useApiFetch";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const CreateCustomerModal = ({ isOpen, onClose, onComplete }) => {
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

  const generateRandomString = (length) => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  };

  const handleNoWebToggle = (e) => {
    const checked = e.target.checked;
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
      const data = await apiFetch(
        "https://apitpv.anthonyloor.com/create_customer",
        {
          method: "POST",
          body: JSON.stringify(customerData),
        }
      );
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
      const addressPayload = { ...addressData, id_customer: newCustomerId };
      const createdAddress = await apiFetch(
        "https://apitpv.anthonyloor.com/create_address",
        {
          method: "POST",
          body: JSON.stringify(addressPayload),
        }
      );
      if (onComplete) {
        const createdClient = { ...customerData, id_customer: newCustomerId };
        onComplete(createdClient, createdAddress);
      }
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage("Error al crear la dirección.");
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <form onSubmit={handleCreateCustomer}>
          <h3
            className="p-mb-3"
            style={{ fontWeight: "bold", fontSize: "1.25rem" }}
          >
            Paso 1: Crear Cliente
          </h3>
          <div className="p-field p-mb-3">
            <span className="p-float-label" style={{ width: "100%" }}>
              <InputText
                name="firstname"
                value={customerData.firstname}
                onChange={handleCustomerChange}
                style={{ width: "100%" }}
              />
              <label>Nombre</label>
            </span>
          </div>
          <div className="p-field p-mb-3">
            <span className="p-float-label" style={{ width: "100%" }}>
              <InputText
                name="lastname"
                value={customerData.lastname}
                onChange={handleCustomerChange}
                style={{ width: "100%" }}
              />
              <label>Apellidos</label>
            </span>
          </div>
          <div className="p-mb-3">
            <label
              className="p-mb-0"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="checkbox"
                checked={isNoWeb}
                onChange={handleNoWebToggle}
                style={{ cursor: "pointer" }}
              />
              <span>Cliente no web</span>
            </label>
          </div>
          <div className="p-field p-mb-3">
            <span className="p-float-label" style={{ width: "100%" }}>
              <InputText
                type="email"
                name="email"
                value={customerData.email}
                onChange={handleCustomerChange}
                disabled={isNoWeb}
                style={{ width: "100%" }}
              />
              <label>Email</label>
            </span>
          </div>
          <div className="p-field p-mb-3">
            <span className="p-float-label" style={{ width: "100%" }}>
              <InputText
                type="password"
                name="password"
                value={customerData.password}
                onChange={handleCustomerChange}
                disabled={isNoWeb}
                style={{ width: "100%" }}
              />
              <label>Contraseña</label>
            </span>
          </div>
          {errorMessage && (
            <div className="p-mb-3" style={{ color: "var(--red-500)" }}>
              {errorMessage}
            </div>
          )}
          <div
            className="p-d-flex p-jc-end p-ai-center"
            style={{ gap: "0.5rem" }}
          >
            <Button
              label="Cancelar"
              onClick={onClose}
              className="p-button-text"
            />
            <Button
              label="Crear Cliente"
              type="submit"
              className="p-button-success"
            />
          </div>
        </form>
      );
    } else if (step === 2) {
      return (
        <form onSubmit={handleCreateAddress}>
          <h3
            className="p-mb-3"
            style={{ fontWeight: "bold", fontSize: "1.25rem" }}
          >
            Paso 2: Crear Dirección
          </h3>
          <div className="p-field p-mb-3">
            <span className="p-float-label" style={{ width: "100%" }}>
              <InputText
                name="address1"
                value={addressData.address1}
                onChange={handleAddressChange}
                style={{ width: "100%" }}
              />
              <label>Calle, Avenida, etc.</label>
            </span>
          </div>
          <div className="p-field p-mb-3">
            <span className="p-float-label" style={{ width: "100%" }}>
              <InputText
                name="address2"
                value={addressData.address2}
                onChange={handleAddressChange}
                style={{ width: "100%" }}
              />
              <label>Piso, puerta, etc.</label>
            </span>
          </div>
          <div className="p-field p-mb-3">
            <span className="p-float-label" style={{ width: "100%" }}>
              <InputText
                name="postcode"
                value={addressData.postcode}
                onChange={handleAddressChange}
                style={{ width: "100%" }}
              />
              <label>Código Postal</label>
            </span>
          </div>
          <div className="p-field p-mb-3">
            <span className="p-float-label" style={{ width: "100%" }}>
              <InputText
                name="city"
                value={addressData.city}
                onChange={handleAddressChange}
                style={{ width: "100%" }}
              />
              <label>Ciudad</label>
            </span>
          </div>
          <div className="p-field p-mb-3">
            <span className="p-float-label" style={{ width: "100%" }}>
              <InputText
                name="phone_combined"
                value={addressData.phone || addressData.phone_mobile}
                onChange={(e) => {
                  const value = e.target.value;
                  setAddressData((prev) => ({
                    ...prev,
                    phone: value,
                    phone_mobile: value,
                  }));
                }}
                style={{ width: "100%" }}
              />
              <label>Teléfono / Móvil</label>
            </span>
          </div>
          {addressData.isCompanyInvoice && (
            <div className="p-mb-3">
              <div className="p-field p-mb-3">
                <span className="p-float-label" style={{ width: "100%" }}>
                  <InputText
                    name="company"
                    value={addressData.company || ""}
                    onChange={handleAddressChange}
                    style={{ width: "100%" }}
                  />
                  <label>Nombre de la empresa</label>
                </span>
              </div>
              <div className="p-field p-mb-3">
                <span className="p-float-label" style={{ width: "100%" }}>
                  <InputText
                    name="dni"
                    value={addressData.dni || ""}
                    onChange={handleAddressChange}
                    style={{ width: "100%" }}
                  />
                  <label>DNI / CIF</label>
                </span>
              </div>
            </div>
          )}
          <div
            className="p-d-flex p-ai-center p-mb-3"
            style={{ gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              name="isCompanyInvoice"
              checked={addressData.isCompanyInvoice || false}
              onChange={(e) =>
                setAddressData((prev) => ({
                  ...prev,
                  isCompanyInvoice: e.target.checked,
                }))
              }
              style={{ cursor: "pointer" }}
            />
            <span>Empresa/Factura</span>
          </div>
          {errorMessage && (
            <div className="p-mb-3" style={{ color: "var(--red-500)" }}>
              {errorMessage}
            </div>
          )}
          <div
            className="p-d-flex p-jc-end p-ai-center"
            style={{ gap: "0.5rem" }}
          >
            <Button
              label="Cancelar"
              onClick={onClose}
              className="p-button-text"
            />
            <Button
              label="Crear Dirección"
              type="submit"
              className="p-button-success"
            />
          </div>
        </form>
      );
    }
  };

  const footer = (
    <div
      className="p-d-flex p-jc-end"
      style={{ gap: "0.5rem", marginTop: "1rem" }}
    >
      {step === 2 && (
        <Button
          label="Atrás"
          icon="pi pi-arrow-left"
          onClick={() => setStep(1)}
          className="p-button-text"
        />
      )}
      <Button label="Cerrar" onClick={onClose} className="p-button-text" />
    </div>
  );

  return (
    <Dialog
      header={step === 1 ? "Crear Cliente" : "Crear Dirección"}
      visible={isOpen}
      onHide={onClose}
      footer={footer}
      style={{ width: "60vw", minHeight: "60vh" }}
      modal
    >
      <div
        className="p-mb-3"
        style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}
      >
        {step === 1
          ? "Paso 1: Crear Cliente -> Paso 2: Crear Dirección"
          : "Paso 2: Crear Dirección"}
      </div>
      {renderStepContent()}
    </Dialog>
  );
};

export default CreateCustomerModal;
