// src/hooks/useFinalizeSale.jsx

import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useApiFetch } from "../utils/useApiFetch";
import getApiBaseUrl from "../utils/getApiBaseUrl";

export default function useFinalizeSale() {
  const { employeeId, shopId, defaultClient, defaultAddress } =
    useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

  const finalizeSale = async (
    {
      cartItems,
      appliedDiscounts = [],
      selectedMethods,
      amounts,
      changeAmount,
      giftTicket,
      onSuccess,
      onError,
    },
    print = true
  ) => {
    setIsLoading(true);
    try {
      const localClient = localStorage.getItem("selectedClient");
      const localAddress = localStorage.getItem("selectedAddress");
      const client = localClient ? JSON.parse(localClient) : defaultClient;
      const address = localAddress ? JSON.parse(localAddress) : defaultAddress;
      const licenseData = JSON.parse(localStorage.getItem("licenseData"));

      const id_customer = client ? client.id_customer : 0;
      const id_address_delivery = address ? address.id_address : 0;

      const normalItems = cartItems.filter(
        (it) =>
          it.id_product !== 0 || it.reference_combination === "rectificacion"
      );
      const factorTax = 1.21;
      const subtotalInclTax = normalItems.reduce(
        (sum, item) =>
          sum +
          (parseFloat(item.final_price_incl_tax) / factorTax) * item.quantity,
        0
      );
      const total_products = subtotalInclTax;
      const subtotalInclTaxCalc = normalItems.reduce(
        (sum, item) => sum + item.final_price_incl_tax * item.quantity,
        0
      );

      const order_details = normalItems.map((item) => ({
        product_id: item.id_product,
        product_attribute_id: item.id_product_attribute,
        stock_available_id: item.id_stock_available,
        id_control_stock: item.id_control_stock,
        product_name: `${item.product_name} - ${item.combination_name}`,
        product_quantity: item.quantity,
        product_price: parseFloat(
          (item.final_price_incl_tax / factorTax).toFixed(2)
        ),
        product_ean13: item.ean13_combination,
        product_reference: item.reference_combination,
        reduction_amount_tax_incl:
          typeof item.reduction_amount_tax_incl === "number"
            ? item.reduction_amount_tax_incl
            : 0,
        total_price_tax_incl: parseFloat(
          (item.final_price_incl_tax * item.quantity).toFixed(2)
        ),
        total_price_tax_excl: parseFloat(
          ((item.final_price_incl_tax / factorTax) * item.quantity).toFixed(2)
        ),
        unit_price_tax_excl: parseFloat(
          (item.final_price_incl_tax / factorTax).toFixed(2)
        ),
        unit_price_tax_incl: item.final_price_incl_tax,
        id_shop: item.id_shop,
      }));

      let remaining = subtotalInclTaxCalc;

      let total_cash = 0;
      if (selectedMethods.includes("efectivo")) {
        if (parseFloat(amounts.efectivo) !== parseFloat(remaining.toFixed(2))) {
          total_cash = parseFloat(
            (
              remaining -
              (selectedMethods.includes("tarjeta")
                ? parseFloat(amounts.tarjeta || 0)
                : 0) -
              (selectedMethods.includes("bizum")
                ? parseFloat(amounts.bizum || 0)
                : 0)
            ).toFixed(2)
          );
          console.log("Remaining amount to be paid:", remaining.toFixed(2));
        } else {
          total_cash = parseFloat(amounts.efectivo);
        }
      }
      const total_card = selectedMethods.includes("tarjeta")
        ? parseFloat(amounts.tarjeta || 0)
        : 0;
      const total_bizum = selectedMethods.includes("bizum")
        ? parseFloat(amounts.bizum || 0)
        : 0;

      let total_discounts = 0;
      const discountsArray = [];

      appliedDiscounts.forEach((disc) => {
        let discountValue = 0;
        const { reduction_percent = 0, reduction_amount = 0 } = disc;

        if (reduction_percent > 0) {
          discountValue = (remaining * reduction_percent) / 100;
        } else if (reduction_amount > 0) {
          discountValue =
            reduction_amount > remaining ? remaining : reduction_amount;
        }
        total_discounts += discountValue;
        discountsArray.push({
          code: disc.code,
          amount: parseFloat(discountValue.toFixed(2)),
        });
        remaining -= discountValue;
      });

      // Si remaining es negativo, definir voucherAmount; de lo contrario es 0.
      const voucherAmount = remaining < 0 ? Math.abs(remaining) : 0;
      const finalTotalInclTax = Math.max(0, remaining);
      const total_discounts_tax_excl = total_discounts / factorTax;

      const saleData = {
        id_shop: shopId,
        id_customer,
        id_address_delivery,
        payment: selectedMethods.join(", "),
        total_paid: parseFloat(finalTotalInclTax.toFixed(2)),
        total_paid_tax_excl: parseFloat(subtotalInclTax.toFixed(2)),
        total_products: parseFloat(total_products.toFixed(2)),
        total_cash: parseFloat(total_cash.toFixed(2)),
        total_card: parseFloat(total_card.toFixed(2)),
        total_bizum: parseFloat(total_bizum.toFixed(2)),
        license: licenseData?.licenseKey || "",
        id_employee: employeeId,
        total_discounts: parseFloat(total_discounts.toFixed(2)),
        total_discounts_tax_excl: parseFloat(
          total_discounts_tax_excl.toFixed(2)
        ),
        order_details,
      };

      if (discountsArray.length > 0) {
        saleData.discounts = discountsArray;
      }

      // Solo se crea vale descuento si voucherAmount > 0 y no se seleccionó ningún método de pago
      let newCartRuleCode = null;
      if (voucherAmount > 0 && selectedMethods.length === 0) {
        const cartRulePayload = {
          reduction_amount: parseFloat(voucherAmount.toFixed(2)),
          reduction_percent: 0,
          id_customer,
          description: `Vale descuento generado automáticamente por superar el descuento.`,
          name: `Vale descuento por ${voucherAmount.toFixed(2)}€`,
          date_from: new Date().toISOString().split("T")[0] + " 00:00:00",
          date_to:
            new Date(new Date().setMonth(new Date().getMonth() + 6))
              .toISOString()
              .split("T")[0] + " 23:59:59",
        };
        const cartRuleResponse = await apiFetch(
          `${API_BASE_URL}/create_cart_rule`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cartRulePayload),
          }
        );
        if (cartRuleResponse && cartRuleResponse.code) {
          newCartRuleCode = cartRuleResponse.code;
          // Se asigna voucher_amount a la orden solo si se crea el vale
          saleData.voucher_amount = parseFloat(voucherAmount.toFixed(2));
        }
      }
      // Si se selecciona al menos un método de pago, no se crea vale descuento.

      const response = await apiFetch(`${API_BASE_URL}/create_order`, {
        method: "POST",
        body: JSON.stringify(saleData),
      });

      const message = response.message || "";
      const orderIdMatch = message.match(/id (\d+)/);
      const newOrderId = orderIdMatch ? orderIdMatch[1] : null;

      setIsLoading(false);

      if (onSuccess && newOrderId) {
        onSuccess({
          orderId: newOrderId,
          print,
          giftTicket,
          changeAmount,
          newCartRuleCode,
        });
      }

      // Imprimir vale descuento si se generó (new_cart_rule_code)
      if (response.new_cart_rule_code) {
        try {
          const leftoverResp = await apiFetch(
            `${API_BASE_URL}/get_cart_rule?code=${response.new_cart_rule_code}`,
            { method: "GET" }
          );
          console.log("Respuesta get_cart_rule:", leftoverResp);
        } catch (error) {
          console.error("Error al obtener el nuevo cart rule sobrante:", error);
        }
      }
    } catch (error) {
      console.error("Error al crear la orden:", error);
      setIsLoading(false);
      if (onError) onError(error);
    }
  };

  return { isLoading, finalizeSale };
}
