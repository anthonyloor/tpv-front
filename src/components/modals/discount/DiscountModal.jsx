// src/components/modals/discount/DiscountModal.jsx

// TO-DO: Si es cliente generico (id_customer no recuperado) no se puede crear el descuento.

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { useCartRuleCreator } from "../../../hooks/useCartRuleCreator";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

const DiscountModal = ({
  isOpen,
  onClose,
  onDiscountApplied,
  onProductDiscountApplied,
  targetProduct,
  cartTotal = 0,
}) => {
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { createCartRuleWithResponse } = useCartRuleCreator();

  // Verificar que el identificador se calcule correctamente utilizando ambas propiedades
  const newTargetIdentifier =
    targetProduct &&
    targetProduct.id_product &&
    targetProduct.id_product_attribute
      ? `${targetProduct.id_product}-${targetProduct.id_product_attribute}`
      : "";

  const productName =
    targetProduct && targetProduct.product_name
      ? `${targetProduct.product_name}${""}`
      : "";

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      setErrorMessage("Introduce un valor válido para el descuento.");
      return;
    }
    // Validación para porcentaje
    if (discountType === "percentage" && value > 100) {
      setErrorMessage("El descuento porcentual no puede ser mayor a 100%.");
      return;
    }
    // Validación para importe: calcular máximo permitido
    if (discountType === "amount") {
      let maxAllowed = 0;
      if (targetProduct) {
        maxAllowed =
          targetProduct.final_price_incl_tax * targetProduct.quantity;
      } else {
        maxAllowed = cartTotal;
      }
      if (value > maxAllowed) {
        setErrorMessage(
          targetProduct
            ? "El descuento no puede superar el total del producto."
            : "El descuento no puede superar el total de la venta."
        );
        return;
      }
    }
    createCartRuleWithResponse(
      { discountType, value },
      (discObj) => {
        console.log(
          "[DiscountModal] Resultado de la creación de descuento:",
          discObj
        );
        if (newTargetIdentifier) {
          let newPrice;
          if (discountType === "amount") {
            newPrice =
              (targetProduct.final_price_incl_tax * targetProduct.quantity -
                value) /
              targetProduct.quantity;
          } else if (discountType === "percentage") {
            newPrice = targetProduct.final_price_incl_tax * (1 - value / 100);
          }
          if (newPrice < 0) newPrice = 0;

          if (onProductDiscountApplied) {
            onProductDiscountApplied(
              targetProduct.id_stock_available,
              newPrice
            );
          }
        }
        if (onDiscountApplied) {
          onDiscountApplied(discObj);
        }
        setDiscountValue("");
        setErrorMessage("");
        onClose();
      },
      onClose,
      setDiscountValue,
      setErrorMessage,
      newTargetIdentifier,
      productName
    );
  };

  const discountOptions = [
    { label: "Porcentaje (%)", value: "percentage" },
    { label: "Importe (€)", value: "amount" },
  ];

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header={
        targetProduct && targetProduct.id_product
          ? `Descuento sobre producto: ${productName}`
          : "Descuento sobre venta"
      }
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
          {discountType === "percentage" ? "Porcentaje (%)" : "Importe (€)"}
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
