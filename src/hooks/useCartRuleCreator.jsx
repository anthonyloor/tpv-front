import { useContext } from "react";
import { useApiFetch } from "../utils/useApiFetch";
import { AuthContext } from "../contexts/AuthContext";
import getApiBaseUrl from "../utils/getApiBaseUrl";

export function useCartRuleCreator() {
  const apiFetch = useApiFetch();
  const { employeeName, shopName } = useContext(AuthContext);
  const API_BASE_URL = getApiBaseUrl();

  // Se amplía el objeto de opciones para incluir voucherName, voucherDescription y quantity
  const createCartRuleWithResponse = async (
    { discountType, value, voucherName, voucherDescription, quantity },
    onDiscountApplied,
    onClose,
    resetDiscountValue,
    setErrorMessage,
    targetIdentifier, // Ej: "7371-24331"
    targetFullProductName // Ej: "Short Push Up Talle Alto Gina Beige - L"
  ) => {
    const now = new Date();
    const sixMonthsLater = new Date(now);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const date_from = now.toISOString().split("T")[0] + " 00:00:00";
    const date_to = sixMonthsLater.toISOString().split("T")[0] + " 23:59:59";

    const client = JSON.parse(localStorage.getItem("selectedClient"));
    // Si existe targetIdentifier se sigue la lógica normal, sino, si se pasó voucherName se usa la información de vale descuento
    let name, description;
    if (targetIdentifier) {
      name = `Descuento sobre ${targetFullProductName}`;
      description = `Producto: ${targetIdentifier}`;
    } else if (voucherName) {
      name = voucherName;
      description = voucherDescription || "";
    } else {
      name =
        discountType === "percentage"
          ? `Descuento de ${value}%`
          : `Descuento de ${value}€`;
      description = `Descuento sobre venta generado por ${employeeName} en ${shopName}`;
    }
    const reduction_percent = discountType === "percentage" ? value : 0;
    const reduction_amount = discountType === "amount" ? value : 0;

    const discountData = {
      name,
      date_from,
      date_to,
      description,
      id_customer: client ? client.id_customer : null,
      reduction_percent,
      reduction_amount,
      // Si se envía voucherName se añade la cantidad de vales
      ...(voucherName && { quantity }),
    };

    try {
      const result = await apiFetch(`${API_BASE_URL}/create_cart_rule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discountData),
      });
      console.log("createCartRuleWithResponse result:", result);

      if (result[0]) {
        // Si se generó un vale descuento, devolver todo el array
        if (voucherName) {
          if (onDiscountApplied) onDiscountApplied(result);
          if (resetDiscountValue) resetDiscountValue("");
          if (setErrorMessage) setErrorMessage("");
          if (onClose) onClose();
          return result;
        } else {
          const discObj = {
            name: name || "",
            description: description || "",
            code: result[0].code,
            reduction_amount: result[0].reduction_amount || 0,
            reduction_percent: result[0].reduction_percent || 0,
          };
          if (onDiscountApplied) onDiscountApplied(discObj);
          if (resetDiscountValue) resetDiscountValue("");
          if (setErrorMessage) setErrorMessage("");
          if (onClose) onClose();
          return result[0];
        }
      } else {
        if (setErrorMessage)
          setErrorMessage(result.message || "Error al crear el descuento.");
        return null;
      }
    } catch (error) {
      console.error("Error al enviar descuento:", error);
      if (setErrorMessage) setErrorMessage("Error al enviar el descuento.");
      return null;
    }
  };

  return { createCartRuleWithResponse };
}
