// src/hooks/useFinalizeSale.jsx
import { useState } from 'react';
import { useApiFetch } from '../components/utils/useApiFetch';

export default function useFinalizeSale() {
  const [isLoading, setIsLoading] = useState(false);
  const apiFetch = useApiFetch();

  const finalizeSale = async (
    {
      cartItems,
      appliedDiscounts = [],
      selectedMethods,
      amounts,
      changeAmount,
      giftTicket,
      onSuccess,
      onError
    },
    print = true
  ) => {
    setIsLoading(true);

    try {
      // 1) Cargar datos de sesión
      const shop = JSON.parse(localStorage.getItem('shop'));
      const employee = JSON.parse(localStorage.getItem('employee'));
      const client = JSON.parse(localStorage.getItem('selectedClient'));
      const address = JSON.parse(localStorage.getItem('selectedAddress'));
      const licenseData = JSON.parse(localStorage.getItem('licenseData'));

      const id_customer = client ? client.id_customer : 0;
      const id_address_delivery = address ? address.id_address : 0;

      // 2) Productos reales => order_details
      const normalItems = cartItems.filter((it) => it.id_product !== 0);

      // 2.1) Subtotal sin impuestos
      const total_paid_tax_excl = normalItems.reduce(
        (sum, item) => sum + (item.final_price_excl_tax * item.quantity),
        0
      );
      const total_products = total_paid_tax_excl;

      // 2.2) Subtotal con impuestos
      const subtotalInclTax = normalItems.reduce(
        (sum, item) => sum + (item.final_price_incl_tax * item.quantity),
        0
      );

      // 2.3) Construir order_details
      const order_details = normalItems.map((item) => ({
        product_id: item.id_product,
        product_attribute_id: item.id_product_attribute,
        stock_available_id: item.id_stock_available,
        product_name: `${item.product_name} ${item.combination_name || ''}`.trim(),
        product_quantity: item.quantity,
        product_price: item.unit_price_tax_excl,
        product_ean13: item.ean13_combination,
        product_reference: item.reference_combination,
        total_price_tax_incl: parseFloat((item.final_price_incl_tax * item.quantity).toFixed(2)),
        total_price_tax_excl: parseFloat((item.final_price_excl_tax * item.quantity).toFixed(2)),
        unit_price_tax_incl: item.final_price_incl_tax,
        unit_price_tax_excl: item.final_price_excl_tax,
        id_shop: item.id_shop,
      }));

      // 3) Calcular métodos de pago
      const total_cash = selectedMethods.includes('efectivo') ? parseFloat(amounts.efectivo || 0) : 0;
      const total_card = selectedMethods.includes('tarjeta') ? parseFloat(amounts.tarjeta || 0) : 0;
      const total_bizum = selectedMethods.includes('bizum') ? parseFloat(amounts.bizum || 0) : 0;

      // 4) Aplicar cupones secuencialmente al subtotalInclTax
      //    en lugar de usar 'total' del padre. 
      let remaining = subtotalInclTax; 
      let total_discounts = 0;
      const discountsArray = [];
      const leftoverArray = [];

      // Factor 21% IVA
      const factorTax = 1.21;

      appliedDiscounts.forEach((disc) => {
        let discountValue = 0;
        let leftoverValue = 0;

        const { reduction_percent = 0, reduction_amount = 0 } = disc;

        if (reduction_percent > 0) {
          // Consumir un % de lo que queda
          discountValue = (remaining * reduction_percent) / 100;
          leftoverValue = 0; 
        } else if (reduction_amount > 0) {
          // Cupón mayor a lo que queda => consume 'remaining', sobra la diferencia
          if (reduction_amount > remaining) {
            discountValue = remaining;
            leftoverValue = reduction_amount - remaining;
          } else {
            discountValue = reduction_amount;
            leftoverValue = 0;
          }
        }

        // Sumar
        total_discounts += discountValue;
        discountsArray.push({
          code: disc.code,
          amount: parseFloat(discountValue.toFixed(2)),
        });

        // Quitar lo que se consumió
        remaining -= discountValue;
        if (remaining < 0) remaining = 0; // no baje de 0

        // Guardar sobrante
        if (leftoverValue > 0) {
          leftoverArray.push({
            code: disc.code,
            leftover: leftoverValue,
          });
        }
      });

      // 5) total con impuestos, sin caer en negativo
      const finalTotalInclTax = Math.max(0, remaining);

      // 5.1) total de descuentos sin impuestos (prorrateo)
      const total_discounts_tax_excl = total_discounts / factorTax;

      // 6) Armar saleData
      const saleData = {
        id_shop: shop?.id_shop || 0,
        id_customer,
        id_address_delivery,
        payment: selectedMethods.join(', '),
        total_paid: parseFloat(finalTotalInclTax.toFixed(2)), 
        total_paid_tax_excl: parseFloat(total_paid_tax_excl.toFixed(2)),
        total_products: parseFloat(total_products.toFixed(2)),

        total_cash: parseFloat(total_cash.toFixed(2)),
        total_card: parseFloat(total_card.toFixed(2)),
        total_bizum: parseFloat(total_bizum.toFixed(2)),

        license: licenseData?.licenseKey || '',
        id_employee: employee ? employee.id_employee : 0,

        total_discounts: parseFloat(total_discounts.toFixed(2)),
        total_discounts_tax_excl: parseFloat(total_discounts_tax_excl.toFixed(2)),
        discounts: discountsArray,

        order_details,
      };

      console.log('Información del ticket de compra:', saleData);

      // 7) Llamar a create_order
      const response = await apiFetch(
        'https://apitpv.anthonyloor.com/create_order',
        {
          method: 'POST',
          body: JSON.stringify(saleData),
        }
      );

      const message = response.message || '';
      const orderIdMatch = message.match(/id (\d+)/);
      const newOrderId = orderIdMatch ? orderIdMatch[1] : null;

      setIsLoading(false);

      // 8) Lógica onSuccess
      if (onSuccess && newOrderId) {
        onSuccess({
          orderId: newOrderId,
          print,
          giftTicket,
          changeAmount,
          leftoverArray,
          newCartRuleCode: response.new_cart_rule_code || null,
        });
      }

      // 9) Si devuelven new_cart_rule_code => obtener get_cart_rule e informar al user
      if (response.new_cart_rule_code) {
        const leftoverCode = response.new_cart_rule_code;
        try {
          const leftoverResp = await apiFetch(
            `https://apitpv.anthonyloor.com/get_cart_rule?code=${leftoverCode}`,
            { method: 'GET' }
          );
          console.log('Respuesta get_cart_rule:', leftoverResp);

          alert(
            `Se va a imprimir un nuevo vale con la cantidad sobrante: ${leftoverCode}`
          );
        } catch (error) {
          console.error('Error al obtener el nuevo cart rule sobrante:', error);
        }
      }

    } catch (error) {
      console.error('Error al crear la orden:', error);
      setIsLoading(false);
      if (onError) onError(error);
    }
  };

  return { isLoading, finalizeSale };
}