// src/hooks/useFinalizeSale.js
import { useState, useContext } from 'react';
import { ConfigContext } from '../contexts/ConfigContext';
import { useApiFetch } from '../components/utils/useApiFetch';
import ticketConfigData from '../data/ticket.json';

export default function useFinalizeSale() {
  const { configData } = useContext(ConfigContext);
  const allowOutOfStockSales = configData ? configData.allow_out_of_stock_sales : false;

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
    onError
  }) => {
    setIsLoading(true);

    try {
      // Recuperar datos de sesión
      const shop = JSON.parse(localStorage.getItem('shop'));
      const employee = JSON.parse(localStorage.getItem('employee'));
      const client = JSON.parse(localStorage.getItem('selectedClient'));
      const address = JSON.parse(localStorage.getItem('selectedAddress'));

      const id_customer = client ? client.id_customer : 0; 
      const id_address_delivery = address ? address.id_address : 0; 

      // Calcular total sin impuestos
      const total_paid_tax_excl = cartItems.reduce(
        (sum, item) => sum + item.final_price_excl_tax * item.quantity,
        0
      );

      const total_products = total_paid_tax_excl;

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
        order_details: order_details,
      };

      console.log('Información del ticket de compra:', saleData);

      // Llamada a la API
      const data = await apiFetch('https://apitpv.anthonyloor.com/create_order', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });

      console.log('Orden creada:', data);

      // Generar e imprimir el ticket normal
      const normalTicketHTML = generateTicketHTML({
        cartItems,
        total,
        selectedMethods,
        amounts,
        changeAmount,
        giftTicket: false, // Ticket normal
        date: new Date(),
        employeeName: employee ? employee.employee_name : 'Empleado',
      });

      printHTMLTicket(normalTicketHTML);

      // Si giftTicket es true, también imprimimos el ticket regalo
      if (giftTicket) {
        const giftTicketHTML = generateTicketHTML({
          cartItems,
          total,
          selectedMethods,
          amounts,
          changeAmount,
          giftTicket: true,
          date: new Date(),
          employeeName: employee ? employee.employee_name : 'Empleado',
        });

        printHTMLTicket(giftTicketHTML);
      }

      setIsLoading(false);
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error al crear la orden:', error);
      setIsLoading(false);
      if (onError) onError(error);
    }
  };

  const generateTicketHTML = (saleData) => {
    const { 
      cartItems,
      total,
      selectedMethods,
      amounts,
      changeAmount,
      giftTicket,
      date,
      employeeName
    } = saleData;

    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    }/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${
      date.getMinutes().toString().padStart(2, '0')
    }`;

    const ticketTypeText = giftTicket ? 'Ticket regalo' : 'Ticket compra';

    // Generar las filas de productos
    const productRows = cartItems.map((item) => {
      const productName = `${item.product_name} ${item.combination_name}`.trim();
      return `
        <tr>
          <td style="text-align:left;">${item.quantity}</td>
          <td style="text-align:left;">${productName}</td>
          ${
            !giftTicket
              ? `<td style="text-align:right;">${item.final_price_incl_tax.toFixed(2)} €</td>
                 <td style="text-align:right;">${(item.final_price_incl_tax * item.quantity).toFixed(2)} €</td>`
              : ''
          }
        </tr>
      `;
    }).join('');

    // Métodos de pago solo en el ticket normal
    let paymentMethodsHTML = '';
    if (!giftTicket) {
      paymentMethodsHTML += '<div><strong>Métodos de Pago:</strong></div>';
      selectedMethods.forEach((method) => {
        const amount = parseFloat(amounts[method]) || 0;
        if (amount > 0) {
          paymentMethodsHTML += `<div>${method.charAt(0).toUpperCase() + method.slice(1)}: ${amount.toFixed(2)} €</div>`;
        }
      });

      paymentMethodsHTML += `<div><strong>Cambio:</strong> ${changeAmount.toFixed(2)} €</div>`;

      const IVA_RATE = 0.21;
      const baseAmount = total / (1 + IVA_RATE);
      const ivaAmount = total - baseAmount;
      paymentMethodsHTML += `<div><strong>IVA (${(IVA_RATE * 100).toFixed(0)}%):</strong> ${ivaAmount.toFixed(2)} €</div>`;
    }

    const html = `
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
          }
          h1, h2, h3 {
            margin: 0 0 10px;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          td, th {
            padding: 5px;
            border-bottom: 1px solid #ccc;
          }
          .footer-text {
            text-align: center;
            margin-top: 10px;
          }
          hr {
            border: none;
            border-top: 1px solid #000;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        ${ticketConfigData.logo ? `<div style="text-align:center;"><img src="${ticketConfigData.logo}" alt="Logo" style="max-width:100px;"></div>` : ''}
        ${ticketConfigData.headerText1 ? `<h3>${ticketConfigData.headerText1}</h3>` : ''}
        ${ticketConfigData.headerText2 ? `<h3>${ticketConfigData.headerText2}</h3>` : ''}
        <hr/>
        <h2>${ticketTypeText}</h2>
        <div>Fecha: ${formattedDate}</div>
        <div>Atendido por: ${employeeName}</div>
        <hr/>
        <table>
          <thead>
            <tr>
              <th style="text-align:left;">Cant.</th>
              <th style="text-align:left;">Producto</th>
              ${!giftTicket ? '<th style="text-align:right;">P/U</th><th style="text-align:right;">Total</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
        ${!giftTicket ? `<hr/><div><strong>Total:</strong> ${total.toFixed(2)} €</div>` : ''}
        ${!giftTicket ? paymentMethodsHTML : ''}

        ${ticketConfigData.footerText1 ? `<div class="footer-text">${ticketConfigData.footerText1}</div>` : ''}
        ${ticketConfigData.footerText2 ? `<div class="footer-text">${ticketConfigData.footerText2}</div>` : ''}
      </body>
      </html>
    `;
    return html;
  };

  const printHTMLTicket = (htmlContent) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return {
    isLoading,
    finalizeSale,
  };
}