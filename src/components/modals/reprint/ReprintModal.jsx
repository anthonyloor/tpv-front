// src/components/modals/reprint/ReprintModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal'; 
import { useApiFetch } from '../../../components/utils/useApiFetch';
import ticketConfigData from '../../../data/ticket.json';

const ReprintModal = ({ isOpen, onClose }) => {
  const [orderId, setOrderId] = useState('');
  const [clientName, setClientName] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  const [allOrders, setAllOrders] = useState([]); 
  const [visibleCount, setVisibleCount] = useState(25); 

  const apiFetch = useApiFetch();

  useEffect(() => {
    if (isOpen) {
      loadRecentOrders();
    } else {
      setAllOrders([]);
      setVisibleCount(25);
      setOrderData(null);
      setError(null);
      setOrderId('');
      setClientName('');
    }
  }, [isOpen]);

  const loadRecentOrders = async () => {
    try {
      setError(null);
      const data = await apiFetch('https://apitpv.anthonyloor.com/get_orders', {
        method: 'GET',
      });
      setAllOrders(data);
    } catch (e) {
      console.error('Error fetching orders:', e);
      setError('No se pudo obtener la lista de ventas recientes.');
    }
  };

  const handleSearchOrder = async () => {
    if (!orderId.trim()) return;
    try {
      setError(null);
      const data = await apiFetch(
        `https://apitpv.anthonyloor.com/get_order?id_order=${encodeURIComponent(orderId)}`,
        {
          method: 'GET',
        }
      );
      setOrderData(data);
    } catch (e) {
      console.error('Error fetching order:', e);
      setError('No se pudo encontrar la orden o ocurrió un error al buscarla.');
      setOrderData(null);
    }
  };

  const handleReprint = (giftTicket = false) => {
    if (!orderData) return;
    const employee = JSON.parse(localStorage.getItem('employee'));
    const employeeName = employee ? employee.employee_name : 'Empleado';

    const html = generateTicketHTMLFromOrder(orderData, giftTicket, employeeName);
    printHTMLTicket(html);
  };

  const generateTicketHTMLFromOrder = (orderData, giftTicket, employeeName) => {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    }/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${
      date.getMinutes().toString().padStart(2, '0')
    }`;

    const ticketTypeText = giftTicket ? 'Ticket regalo' : 'Ticket compra';

    const productRows = orderData.order_details
      .map((item) => {
        return `
          <tr>
            <td style="text-align:left;">${item.product_quantity}</td>
            <td style="text-align:left;">${item.product_name}</td>
            ${
              !giftTicket
                ? `<td style="text-align:right;">${item.unit_price_tax_incl.toFixed(2)} €</td>
                   <td style="text-align:right;">${(item.unit_price_tax_incl * item.product_quantity).toFixed(2)} €</td>`
                : ''
            }
          </tr>
        `;
      })
      .join('');

    let paymentMethodsHTML = '';
    if (!giftTicket) {
      const IVA_RATE = 0.21;
      const baseAmount = orderData.total_paid / (1 + IVA_RATE);
      const ivaAmount = orderData.total_paid - baseAmount;
      paymentMethodsHTML += '<div><strong>Método de Pago:</strong></div>';
      paymentMethodsHTML += `<div>${orderData.payment.charAt(0).toUpperCase() + orderData.payment.slice(1)}: ${orderData.total_paid.toFixed(2)} €</div>`;
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
        ${!giftTicket ? `<hr/><div><strong>Total:</strong> ${orderData.total_paid.toFixed(2)} €</div>` : ''}
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

  const visibleOrders = allOrders.slice(0, visibleCount);

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + 25, 100));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reimprimir Ticket"
      showCloseButton={true}
      showBackButton={false}
    >
      <div className="bg-white rounded-lg p-6">
        <div className="mb-4 flex space-x-2">
          <input
            type="text"
            className="border rounded p-2 w-full"
            placeholder="ID de la Venta (id_order)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchOrder();
            }}
          />
          <input
            type="text"
            className="border rounded p-2 w-full"
            placeholder="Nombre de cliente (futuro)"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {visibleOrders.length > 0 && (
          <div className="max-h-64 overflow-auto border">
            <table className="min-w-full bg-white border">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left">ID Orden</th>
                  <th className="py-2 px-4 border-b text-left">Tienda</th>
                  <th className="py-2 px-4 border-b text-left">Cliente</th>
                  <th className="py-2 px-4 border-b text-left">Total</th>
                  <th className="py-2 px-4 border-b text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((o, idx) => (
                  <tr key={idx} className="cursor-pointer hover:bg-gray-200" onClick={() => setOrderData(o)}>
                    <td className="py-2 px-4 border-b">{o.id_order}</td>
                    <td className="py-2 px-4 border-b">{o.shop_name}</td>
                    <td className="py-2 px-4 border-b">{o.customer_name}</td>
                    <td className="py-2 px-4 border-b">{o.total_paid.toFixed(2)} €</td>
                    <td className="py-2 px-4 border-b">{o.date_add}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {allOrders.length > visibleCount && (
          <div className="mt-2">
            <button className="text-blue-600 hover:underline" onClick={handleShowMore}>
              Mostrar más ventas
            </button>
          </div>
        )}

        {orderData && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Información de la Venta</h3>
            <p><strong>ID Tienda:</strong> {orderData.id_shop}</p>
            <p><strong>ID Cliente:</strong> {orderData.id_customer}</p>
            <p><strong>Método de Pago:</strong> {orderData.payment}</p>
            <p><strong>Total:</strong> {orderData.total_paid.toFixed(2)} €</p>

            <h3 className="font-semibold mt-4 mb-2">Productos de la venta</h3>
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Producto</th>
                  <th className="py-2 px-4 border-b text-left">Cant.</th>
                  <th className="py-2 px-4 border-b text-right">P/U</th>
                  <th className="py-2 px-4 border-b text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orderData.order_details.map((prod, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-4 border-b">{prod.product_name}</td>
                    <td className="py-2 px-4 border-b">{prod.product_quantity}</td>
                    <td className="py-2 px-4 border-b text-right">
                      {prod.unit_price_tax_incl.toFixed(2)} €
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      {(prod.unit_price_tax_incl * prod.product_quantity).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 space-x-2">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={() => handleReprint(false)}
              >
                Generar Ticket Normal
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                onClick={() => handleReprint(true)}
              >
                Generar Ticket Regalo
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReprintModal;