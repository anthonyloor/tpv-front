// src/components/modals/customer/CreateAddressModal.jsx

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useApiFetch } from "../../../components/utils/useApiFetch";
import { Steps } from "primereact/steps";

export default function CreateAddressModal({
  isOpen,
  onClose,
  clientId,
  onAddressCreated,
}) {
  const apiFetch = useApiFetch();
  const [addressData, setAddressData] = useState({
    id_country: 6,
    id_state: "",
    alias: "nueva-direccion",
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
    isCompanyInvoice: false,
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleCompany = (e) => {
    setAddressData((prev) => ({
      ...prev,
      isCompanyInvoice: e.target.checked,
    }));
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    try {
      const addressPayload = {
        ...addressData,
        id_customer: clientId,
      };
      const result = await apiFetch(
        "https://apitpv.anthonyloor.com/create_address",
        {
          method: "POST",
          body: JSON.stringify(addressPayload),
        }
      );
      // Si result es ok, notifica
      if (onAddressCreated) {
        onAddressCreated(result);
      }
      onClose();
    } catch (error) {
      console.error("Error al crear dirección:", error);
      setErrorMessage("No se pudo crear la dirección");
    }
  };

  const items = [{ label: "Crear Dirección" }];

  const footer = (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        label="Crear Dirección"
        className="p-button-success"
        onClick={handleSubmitAddress}
      />
    </div>
  );

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header="Crear Dirección"
      footer={footer}
      style={{ width: "40vw" }}
      modal
    >
      <Steps model={items} activeIndex={0} readOnly className="mb-3" />

      <div className="p-fluid">
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}

        <div className="field mb-3">
          <label className="font-bold" htmlFor="address1">
            Calle / Avenida
          </label>
          <InputText
            id="address1"
            name="address1"
            value={addressData.address1}
            onChange={handleChange}
          />
        </div>

        <div className="field mb-3">
          <label className="font-bold" htmlFor="address2">
            Piso / Puerta
          </label>
          <InputText
            id="address2"
            name="address2"
            value={addressData.address2}
            onChange={handleChange}
          />
        </div>

        <div className="field mb-3">
          <label className="font-bold" htmlFor="postcode">
            Código Postal
          </label>
          <InputText
            id="postcode"
            name="postcode"
            value={addressData.postcode}
            onChange={handleChange}
          />
        </div>

        <div className="field mb-3">
          <label className="font-bold" htmlFor="city">
            Ciudad
          </label>
          <InputText
            id="city"
            name="city"
            value={addressData.city}
            onChange={handleChange}
          />
        </div>

        <div className="field mb-3">
          <label className="font-bold" htmlFor="phone">
            Teléfono / Móvil
          </label>
          <InputText
            id="phone"
            name="phone"
            value={addressData.phone || ""}
            onChange={(e) =>
              setAddressData((prev) => ({
                ...prev,
                phone: e.target.value,
                phone_mobile: e.target.value,
              }))
            }
          />
        </div>

        {/* Checkbox "Es empresa" */}
        <div className="field mb-3 flex align-items-center gap-2">
          <input
            type="checkbox"
            checked={addressData.isCompanyInvoice}
            onChange={handleToggleCompany}
          />
          <label className="font-bold m-0">¿Es Facturación de Empresa?</label>
        </div>

        {addressData.isCompanyInvoice && (
          <div className="field mb-3">
            <label className="font-bold" htmlFor="company">
              Nombre Empresa
            </label>
            <InputText
              id="company"
              name="company"
              value={addressData.company}
              onChange={handleChange}
            />
            <label className="font-bold mt-3" htmlFor="dni">
              CIF / DNI
            </label>
            <InputText
              id="dni"
              name="dni"
              value={addressData.dni}
              onChange={handleChange}
            />
          </div>
        )}
      </div>
    </Dialog>
  );
}