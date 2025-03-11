// src/components/modals/customer/CreateCustomerModal.jsx

import React, { useState, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { AuthContext } from "../../../contexts/AuthContext";
import { useApiFetch } from "../../../components/utils/useApiFetch";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Steps } from "primereact/steps";
import { Checkbox } from "primereact/checkbox";

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

  const items = [{ label: "Crear Cliente" }, { label: "Crear Dirección" }];

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <form onSubmit={handleCreateCustomer}>
          <div className="p-fluid">
            {/* Primera fila: Nombre y Apellidos */}
            <div className="p-grid">
              <div className="p-col-6">
                <span className="p-float-label">
                  <InputText
                    name="firstname"
                    value={customerData.firstname}
                    onChange={handleCustomerChange}
                  />
                  <label>Nombre</label>
                </span>
              </div>
              <div className="p-col-6">
                <span className="p-float-label">
                  <InputText
                    name="lastname"
                    value={customerData.lastname}
                    onChange={handleCustomerChange}
                  />
                  <label>Apellidos</label>
                </span>
              </div>
            </div>
            {/* Segunda fila: Email y Contraseña */}
            <div className="p-grid" style={{ marginTop: "1rem" }}>
              <div className="p-col-6">
                <span className="p-float-label">
                  <InputText
                    type="email"
                    name="email"
                    value={customerData.email}
                    onChange={handleCustomerChange}
                    disabled={isNoWeb}
                  />
                  <label>Email</label>
                </span>
              </div>
              <div className="p-col-6">
                <span className="p-float-label">
                  <InputText
                    type="password"
                    name="password"
                    value={customerData.password}
                    onChange={handleCustomerChange}
                    disabled={isNoWeb}
                  />
                  <label>Contraseña</label>
                </span>
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
    } else if (step === 2) {
      return (
        <form onSubmit={handleCreateAddress}>
          <h3
            className="p-mb-3"
            style={{ fontWeight: "bold", fontSize: "1.25rem" }}
          >
            Paso 2: Crear Dirección
          </h3>
          <div className="p-fluid">
            {/* Primera fila: Calle / Avenida y Piso/puerta */}
            <div className="p-grid">
              <div className="p-col-6">
                <span className="p-float-label">
                  <InputText
                    name="address1"
                    value={addressData.address1}
                    onChange={handleAddressChange}
                  />
                  <label>Calle, Avenida, etc.</label>
                </span>
              </div>
              <div className="p-col-6">
                <span className="p-float-label">
                  <InputText
                    name="address2"
                    value={addressData.address2}
                    onChange={handleAddressChange}
                  />
                  <label>Piso, puerta, etc.</label>
                </span>
              </div>
            </div>
            {/* Segunda fila: Código Postal y Ciudad */}
            <div className="p-grid" style={{ marginTop: "1rem" }}>
              <div className="p-col-6">
                <span className="p-float-label">
                  <InputText
                    name="postcode"
                    value={addressData.postcode}
                    onChange={handleAddressChange}
                  />
                  <label>Código Postal</label>
                </span>
              </div>
              <div className="p-col-6">
                <span className="p-float-label">
                  <InputText
                    name="city"
                    value={addressData.city}
                    onChange={handleAddressChange}
                  />
                  <label>Ciudad</label>
                </span>
              </div>
            </div>
            {/* Tercera fila: Teléfono/Móvil */}
            <div className="p-grid" style={{ marginTop: "1rem" }}>
              <div className="p-col-12">
                <span className="p-float-label">
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
                  />
                  <label>Teléfono / Móvil</label>
                </span>
              </div>
            </div>
            {addressData.isCompanyInvoice && (
              <div className="p-grid" style={{ marginTop: "1rem" }}>
                <div className="p-col-6">
                  <span className="p-float-label">
                    <InputText
                      name="company"
                      value={addressData.company || ""}
                      onChange={handleAddressChange}
                    />
                    <label>Nombre de la empresa</label>
                  </span>
                </div>
                <div className="p-col-6">
                  <span className="p-float-label">
                    <InputText
                      name="dni"
                      value={addressData.dni || ""}
                      onChange={handleAddressChange}
                    />
                    <label>DNI / CIF</label>
                  </span>
                </div>
              </div>
            )}
            <div
              className="p-d-flex p-ai-center p-mb-3"
              style={{ gap: "0.5rem", marginTop: "1rem" }}
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
            <div className="mt-4">
              <h3 className="font-bold mb-2">Ubicación</h3>
              <label htmlFor="id_state" className="block mb-1">
                Estado
              </label>
              <select
                name="id_state"
                value={addressData.id_state || ""}
                onChange={(e) => {
                  const newIdState = e.target.value;
                  let id_country = "";
                  switch (newIdState) {
                    case "313":
                      id_country = "ES";
                      break;
                    default:
                      id_country = addressData.id_country || "";
                  }
                  setAddressData((prev) => ({
                    ...prev,
                    id_state: newIdState,
                    id_country,
                  }));
                }}
                className="w-full p-2 border rounded mb-2"
              >
                <option value="">Seleccione un estado</option>
                <option value="343">Madrid</option>
                <option value="313">A Coruña</option>
                <option value="314">Álava</option>
                <option value="315">Albacete</option>
                <option value="316">Alacant</option>
                <option value="317">Almería</option>
                <option value="318">Asturias</option>
                <option value="319">Ávila</option>
                <option value="320">Badajoz</option>
                <option value="322">Barcelona</option>
                <option value="323">Burgos</option>
                <option value="324">Cáceres</option>
                <option value="325">Cádiz</option>
                <option value="326">Cantabria</option>
                <option value="327">Castelló</option>
                <option value="328">Ciudad Real</option>
                <option value="329">Córdoba</option>
                <option value="330">Cuenca</option>
                <option value="331">Girona</option>
                <option value="332">Granada</option>
                <option value="333">Guadalajara</option>
                <option value="334">Gipuzkoa</option>
                <option value="335">Huelva</option>
                <option value="336">Huesca</option>
                <option value="337">Jaén</option>
                <option value="338">La Rioja</option>
                <option value="340">León</option>
                <option value="341">Lleida</option>
                <option value="342">Lugo</option>
                <option value="344">Málaga</option>
                <option value="345">Murcia</option>
                <option value="346">Nafarroa</option>
                <option value="347">Ourense</option>
                <option value="348">Palencia</option>
                <option value="349">Pontevedra</option>
                <option value="350">Salamanca</option>
                <option value="352">Segovia</option>
                <option value="353">Sevilla</option>
                <option value="354">Soria</option>
                <option value="355">Tarragona</option>
                <option value="356">Teruel</option>
                <option value="357">Toledo</option>
                <option value="358">València</option>
                <option value="359">Valladolid</option>
                <option value="360">Bizkaia</option>
                <option value="361">Zamora</option>
                <option value="362">Zaragoza</option>
              </select>
            </div>

            {errorMessage && (
              <div className="p-mb-3" style={{ color: "var(--red-500)" }}>
                {errorMessage}
              </div>
            )}
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
      <Button
        label={step === 1 ? "Crear Cliente" : "Crear Dirección"}
        onClick={step === 1 ? handleCreateCustomer : handleCreateAddress}
        className="p-button-success"
      />
    </div>
  );

  return (
    <Dialog
      header={step === 1 ? "Crear Cliente" : "Crear Dirección"}
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
      <Steps model={items} activeIndex={step - 1} readOnly className="mb-3" />

      {/* Botón Atrás arriba */}
      {step === 2 && (
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
