// src/components/modals/customer/CreateAddressModal.jsx

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
import { Steps } from "primereact/steps";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import AddressForm from "./AddressForm";

export default function CreateAddressModal({
  isOpen,
  onClose,
  clientId,
  firstname = "",
  lastname = "",
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
  useEffect(() => {
    if (isOpen) {
      setAddressData((prev) => ({
        ...prev,
        firstname: firstname || prev.firstname,
        lastname: lastname || prev.lastname,
      }));
    }
  }, [isOpen, firstname, lastname]);
  const [errorMessage, setErrorMessage] = useState("");
  const API_BASE_URL = getApiBaseUrl();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    try {
      const addressPayload = {
        ...addressData,
        id_customer: clientId,
      };
      const result = await apiFetch(`${API_BASE_URL}/create_address`, {
        method: "POST",
        body: JSON.stringify(addressPayload),
      });
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

      <AddressForm
        addressData={addressData}
        onChange={handleChange}
        setAddressData={setAddressData}
        errorMessage={errorMessage}
      />
    </Dialog>
  );
}
