// src/hooks/useFinalizeSale.jsx

import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useApiFetch } from "../components/utils/useApiFetch";
import { toast } from "sonner";

export default function useFinalizeSale() {
  const [isLoading, setIsLoading] = useState(false);
  const apiFetch = useApiFetch();
  const { employeeId, shopId } = useContext(AuthContext);

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
      const client = JSON.parse(localStorage.getItem("selectedClient"));
      const address = JSON.parse(localStorage.getItem("selectedAddress"));
      const licenseData = JSON.parse(localStorage.getItem("licenseData"));

      const id_customer = client ? client.id_customer : 0;
      const id_address_delivery = address ? address.id_address : 0;

      const normalItems = cartItems.filter((it) => it.id_product !== 0);
      const total_paid_tax_excl = normalItems.reduce(
        (sum, item) => sum + item.final_price_excl_tax * item.quantity,
        0
      );
      const total_products = total_paid_tax_excl;
      const subtotalInclTax = normalItems.reduce(
        (sum, item) => sum + item.final_price_incl_tax * item.quantity,
        0
      );

      const order_details = normalItems.map((item) => ({
        product_id: item.id_product,
        product_attribute_id: item.id_product_attribute,
        stock_available_id: item.id_stock_available,
        product_name: `${item.product_name} ${
          item.combination_name || ""
        }`.trim(),
        product_quantity: item.quantity,
        product_price: item.unit_price_tax_excl,
        product_ean13: item.ean13_combination,
        product_reference: item.reference_combination,
        total_price_tax_incl: parseFloat(
          (item.final_price_incl_tax * item.quantity).toFixed(2)
        ),
        total_price_tax_excl: parseFloat(
          (item.final_price_excl_tax * item.quantity).toFixed(2)
        ),
        unit_price_tax_incl: item.final_price_incl_tax,
        unit_price_tax_excl: item.final_price_excl_tax,
        id_shop: item.id_shop,
      }));

      const total_cash = selectedMethods.includes("efectivo")
        ? parseFloat(amounts.efectivo || 0)
        : 0;
      const total_card = selectedMethods.includes("tarjeta")
        ? parseFloat(amounts.tarjeta || 0)
        : 0;
      const total_bizum = selectedMethods.includes("bizum")
        ? parseFloat(amounts.bizum || 0)
        : 0;

      let remaining = subtotalInclTax;
      let total_discounts = 0;
      const discountsArray = [];
      const leftoverArray = [];
      const factorTax = 1.21;

      appliedDiscounts.forEach((disc) => {
        let discountValue = 0;
        let leftoverValue = 0;
        const { reduction_percent = 0, reduction_amount = 0 } = disc;

        if (reduction_percent > 0) {
          discountValue = (remaining * reduction_percent) / 100;
        } else if (reduction_amount > 0) {
          if (reduction_amount > remaining) {
            discountValue = remaining;
            leftoverValue = reduction_amount - remaining;
          } else {
            discountValue = reduction_amount;
          }
        }
        total_discounts += discountValue;
        discountsArray.push({
          code: disc.code,
          amount: parseFloat(discountValue.toFixed(2)),
        });
        remaining -= discountValue;
        if (remaining < 0) remaining = 0;
        if (leftoverValue > 0) {
          leftoverArray.push({
            code: disc.code,
            leftover: leftoverValue,
          });
        }
      });

      const finalTotalInclTax = Math.max(0, remaining);
      const total_discounts_tax_excl = total_discounts / factorTax;

      const saleData = {
        id_shop: shopId,
        id_customer,
        id_address_delivery,
        payment: selectedMethods.join(", "),
        total_paid: parseFloat(finalTotalInclTax.toFixed(2)),
        total_paid_tax_excl: parseFloat(total_paid_tax_excl.toFixed(2)),
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

      const response = await apiFetch(
        "https://apitpv.anthonyloor.com/create_order",
        {
          method: "POST",
          body: JSON.stringify(saleData),
        }
      );

      const message = response.message || "";
      const orderIdMatch = message.match(/id (\d+)/);
      const newOrderId = orderIdMatch ? orderIdMatch[1] : null;

      setIsLoading(false);

      if (onSuccess && newOrderId) {
        toast.success("Venta finalizada correctamente");
        onSuccess({
          orderId: newOrderId,
          print,
          giftTicket,
          changeAmount,
          leftoverArray,
          newCartRuleCode: response.new_cart_rule_code || null,
        });
      }

      if (response.new_cart_rule_code) {
        const leftoverCode = response.new_cart_rule_code;
        try {
          const leftoverResp = await apiFetch(
            `https://apitpv.anthonyloor.com/get_cart_rule?code=${leftoverCode}`,
            { method: "GET" }
          );
          console.log("Respuesta get_cart_rule:", leftoverResp);
          alert(
            `Se va a imprimir un nuevo vale con la cantidad sobrante: ${leftoverCode}`
          );
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
