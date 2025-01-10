// src/hooks/useFinalizeSale.jsx
import { useState } from 'react';
import { useApiFetch } from '../components/utils/useApiFetch';

export default function useFinalizeSale() {
  const [isLoading, setIsLoading] = useState(false);
  const apiFetch = useApiFetch();

  const finalizeSale = async ({
    cartItems,
    total,
    selectedMethods,
    amounts,
    changeAmount,
    giftTicket,
    onSuccess,
    onError,
  }, print = true) => {
    setIsLoading(true);

    try {
      // Recuperar datos de sesión
      const shop = JSON.parse(localStorage.getItem('shop'));
      const employee = JSON.parse(localStorage.getItem('employee'));
      const client = JSON.parse(localStorage.getItem('selectedClient'));
      const address = JSON.parse(localStorage.getItem('selectedAddress'));
      const licenseData = JSON.parse(localStorage.getItem('licenseData'));

      const id_customer = client ? client.id_customer : 0; 
      const id_address_delivery = address ? address.id_address : 0; 

      // Calcular total sin impuestos
      const total_paid_tax_excl = cartItems.reduce(
        (sum, item) => sum + item.final_price_excl_tax * item.quantity,
        0
      );

      const total_products = total_paid_tax_excl;

      // Calcular totales por método de pago
      const total_cash = selectedMethods.includes('efectivo') ? parseFloat(amounts.efectivo || 0) : 0;
      const total_card = selectedMethods.includes('tarjeta') ? parseFloat(amounts.tarjeta || 0) : 0;
      const total_bizum = selectedMethods.includes('bizum') ? parseFloat(amounts.bizum || 0) : 0;

      // Armar order_details
      const order_details = cartItems.map((item) => ({
        product_id: item.id_product,
        product_attribute_id: item.id_product_attribute,
        stock_available_id: item.id_stock_available,
        product_name: `${item.product_name} ${item.combination_name}`,
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

      const saleData = {
        id_shop: shop.id_shop,
        id_customer: id_customer,
        id_address_delivery: id_address_delivery,
        payment: selectedMethods.join(', '),
        total_paid: parseFloat(total.toFixed(2)),
        total_paid_tax_excl: parseFloat(total_paid_tax_excl.toFixed(2)),
        total_products: parseFloat(total_products.toFixed(2)),
        total_cash: parseFloat(total_cash.toFixed(2)),   // Nuevo campo
        total_card: parseFloat(total_card.toFixed(2)),   // Nuevo campo
        total_bizum: parseFloat(total_bizum.toFixed(2)), // Nuevo campo
        license: licenseData.licenseKey,                            // Actualizado para usar licenseKey
        id_employee: employee ? employee.id_employee : 0, // Nuevo campo
        order_details: order_details,
      };

      console.log('Información del ticket de compra:', saleData);

      // Llamada a la API
      const response = await apiFetch('https://apitpv.anthonyloor.com/create_order', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });

      // Suponiendo que la respuesta es {"status":"OK","message":"Order created with id87542"}
      const message = response.message || '';
      const orderIdMatch = message.match(/id(\d+)/);
      const newOrderId = orderIdMatch ? orderIdMatch[1] : null;

      console.log('Orden creada: #', newOrderId);

      setIsLoading(false);
      if (onSuccess && newOrderId) {
        onSuccess({ orderId: newOrderId, print, giftTicket, changeAmount });
      }

    } catch (error) {
      console.error('Error al crear la orden:', error);
      setIsLoading(false);
      if (onError) onError(error);
    }
  };

  return {
    isLoading,
    finalizeSale,
  };
}