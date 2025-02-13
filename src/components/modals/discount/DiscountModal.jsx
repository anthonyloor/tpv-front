// src/components/modals/discount/DiscountModal.jsx

// TO-DO: Si es cliente generico (id_customer no recuperado) no se puede crear el descuento.

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { useCartRuleCreator } from "../../../hooks/useCartRuleCreator";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

const DiscountModal = ({ isOpen, onClose, onDiscountApplied }) => {
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { createCartRuleWithResponse } = useCartRuleCreator();

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      setErrorMessage("Introduce un valor válido para el descuento.");
      return;
    }
    createCartRuleWithResponse(
      { discountType, value },
      onDiscountApplied,
      onClose,
      setDiscountValue,
      setErrorMessage
    );
  };

  // Opcional: podemos usar un Dropdown de PrimeReact para "Tipo de Descuento"
  const discountOptions = [
    { label: "Porcentaje (%)", value: "percentage" },
    { label: "Importe (€)", value: "amount" },
  ];

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header="Descuento"
      modal
      style={{ width: "40vw", maxWidth: "500px" }}
    >
      <div className="mb-4">
        <label className="block font-medium mb-1">Tipo de Descuento:</label>
        <Dropdown
          value={discountType}
          options={discountOptions}
          onChange={(e) => setDiscountType(e.value)}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
          {discountType === "percentage"
            ? "Porcentaje de Descuento (%):"
            : "Importe de Descuento (€):"}
        </label>
        <div className="flex items-center">
          <InputNumber
            value={discountValue ? parseFloat(discountValue) : null}
            onValueChange={(e) =>
              setDiscountValue(e.value != null ? e.value.toString() : "")
            }
            min={0}
            max={discountType === "percentage" ? 100 : undefined}
            showButtons={false}
            className="flex-grow"
            placeholder={discountType === "percentage" ? "0-100" : ">= 0"}
          />
          <span className="ml-2">
            {discountType === "percentage" ? "%" : "€"}
          </span>
        </div>
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          label="Aplicar"
          className="p-button-success"
          onClick={handleApplyDiscount}
        />
      </div>
    </Dialog>
  );
};

export default DiscountModal;
