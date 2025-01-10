// src/components/modals/TicketViewModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { useApiFetch } from '../../utils/useApiFetch';

const TicketViewModal = ({ 
  isOpen, 
  onClose, 
  orderId, 
  printOnOpen = false, 
  giftTicket = false, 
  changeAmount = 0 
}) => {
  const [ticketHtml, setTicketHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiFetch = useApiFetch();

  // Función para generar el HTML del ticket según si es regalo o no
  const generateTicketHtml = (orderData, gift, changeAmt) => {
    if (!orderData) return '';
    const date = new Date(orderData.date_add || Date.now());
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes()
    ).padStart(2, '0')}`;
    // Obtener ID de empleado desde orderData o localStorage, según disponibilidad
    const employeeId = orderData.id_employee || localStorage.getItem('employeeId') || 'N/A';
    const clientId = orderData.id_customer || 'N/A';
    const paymentMethod = orderData.payment || '';
    const totalPaid = orderData.total_paid?.toFixed(2) || '0.00';
    const change = changeAmt ? changeAmt.toFixed(2) : '0.00';
  
    const productRows = orderData.order_details.map(item => {
      const productName = `${item.product_name} ${item.combination_name || ''}`.trim();
      if (gift) {
        return `
          <tr>
            <td style="text-align:left;">${item.product_quantity}</td>
            <td style="text-align:left;">${productName}</td>
          </tr>
        `;
      } else {
        return `
          <tr>
            <td style="text-align:left;">${item.product_quantity}</td>
            <td style="text-align:left;">${productName}</td>
            <td style="text-align:right;">${item.unit_price_tax_incl.toFixed(2)} €</td>
            <td style="text-align:right;">${(item.unit_price_tax_incl * item.product_quantity).toFixed(2)} €</td>
          </tr>
        `;
      }
    }).join('');
  
    let paymentMethodsHTML = '';
    if (!gift) {
      paymentMethodsHTML = `
        <div><strong>Método de pago:</strong> ${paymentMethod}</div>
        <div><strong>Total Pagado:</strong> ${totalPaid} €</div>
        <div><strong>Cambio:</strong> ${change} €</div>
      `;
    }
  
    return `
      <div>
        <h2>${gift ? 'Ticket Regalo' : 'Ticket Compra'} #${orderData.id_order}</h2>
        <div>Fecha: ${formattedDate}</div>
        <div>Empleado ID: ${employeeId}</div>
        <div>Cliente ID: ${clientId}</div>
        <hr/>
        <table style="width:100%; border-collapse:collapse; margin-top:10px;">
          <thead>
            <tr>
              <th style="padding:5px; border-bottom:1px solid #ccc;">Cant.</th>
              <th style="padding:5px; border-bottom:1px solid #ccc;">Producto</th>
              ${
                !gift 
                  ? '<th style="padding:5px; border-bottom:1px solid #ccc; text-align:right;">P/U (€)</th><th style="padding:5px; border-bottom:1px solid #ccc; text-align:right;">Total (€)</th>'
                  : ''
              }
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
        ${!gift ? paymentMethodsHTML : ''}
      </div>
    `;
  };

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const orderData = await apiFetch(`https://apitpv.anthonyloor.com/get_order?id_order=${orderId}`, { method: 'GET' });
        // Generar HTML del ticket normal para visualización
        const htmlContent = generateTicketHtml(orderData, false, changeAmount);
        setTicketHtml(htmlContent);
      } catch (err) {
        setError('Error al cargar el ticket.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId && isOpen) {
      fetchTicket();
    }
  }, [orderId, isOpen, changeAmount, apiFetch]);

  useEffect(() => {
    const printTicket = async () => {
      if (printOnOpen && ticketHtml) {
        // Construir un documento completo para impresión usando el contenido generado
        const fullHtml = `
          <html>
            <head>
              <meta charset="UTF-8" />
              <style>
                body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; }
                h2 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { padding: 5px; border-bottom: 1px solid #ccc; }
                hr { border: none; border-top: 1px solid #000; margin: 10px 0; }
              </style>
            </head>
            <body>
              ${ticketHtml}
            </body>
          </html>
        `;
        const printWindow = window.open('', '_blank', 'width=600,height=1200');
        printWindow.document.open();
        printWindow.document.write(fullHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        console.log('Ticket impreso');
      }
      
    };
    printTicket();
  }, [printOnOpen, ticketHtml, giftTicket, orderId, changeAmount, apiFetch]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ticket #${orderId}`} size="lg" height="tall">
      <div className="p-4">
        {loading && <p>Cargando ticket...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div dangerouslySetInnerHTML={{ __html: ticketHtml }} />
        )}
      </div>
    </Modal>
  );
};

export default TicketViewModal;