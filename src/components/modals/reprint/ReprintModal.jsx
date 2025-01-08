// src/components/modals/reprint/ReprintModal.jsx

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import Modal from '../Modal'; 
import { useApiFetch } from '../../../components/utils/useApiFetch';
//import ticketConfigData from '../../../data/ticket.json'; // si lo usas

import { ConfigContext } from '../../../contexts/ConfigContext'; // ajusta la ruta real

// PrimeReact
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';

const ReprintModal = ({ isOpen, onClose }) => {
  // Modo: "recent" o "search"
  const { configData } = useContext(ConfigContext);
  const [mode, setMode] = useState('recent');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState(null);

  // Ventas recientes o buscada
  const [allOrders, setAllOrders] = useState([]);
  const [searchedOrder, setSearchedOrder] = useState(null);

  // Loading y selección
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Paginación
  const rows = 4;

  const apiFetch = useApiFetch();

  // Cargar ventas recientes
  const loadRecentOrders = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      setMode('recent');
      const data = await apiFetch('https://apitpv.anthonyloor.com/get_orders', { method: 'GET' });
      setAllOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando ventas recientes:', err);
      setError('No se pudo obtener la lista de ventas recientes.');
      setAllOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  // Búsqueda puntual
  const handleSearchOrder = async () => {
    if (!orderId.trim()) return;
    try {
      setError(null);
      setIsLoading(true);
      setMode('search');
      const data = await apiFetch(
        `https://apitpv.anthonyloor.com/get_order?id_order=${encodeURIComponent(orderId)}`,
        { method: 'GET' }
      );
      setSearchedOrder(data);
    } catch (err) {
      console.error('Error buscando la orden:', err);
      setError('No se encontró la orden con ese ID o ocurrió un error.');
      setSearchedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      loadRecentOrders();
    } else {
      // Reset
      setAllOrders([]);
      setSearchedOrder(null);
      setOrderId('');
      setError(null);
      setSelectedOrderId(null);
      setIsLoading(false);
      setMode('recent');
    }
  }, [isOpen, loadRecentOrders]);

  // Reimprimir
  const handleReprint = (giftTicket = false) => {
    if (!selectedOrderId) {
      alert('Selecciona una venta para reimprimir.');
      return;
    }
    let saleToReprint = null;

    if (mode === 'recent') {
      saleToReprint = allOrders.find(o => o.id_order === selectedOrderId);
    } else {
      // mode = search
      saleToReprint = searchedOrder && searchedOrder.id_order === selectedOrderId 
        ? searchedOrder 
        : null;
    }
    if (!saleToReprint) {
      alert('No se encontró la venta seleccionada.');
      return;
    }

    // Lógica real
    const employee = JSON.parse(localStorage.getItem('employee'));
    const employeeName = employee ? employee.employee_name : 'Empleado';

    const htmlContent = generateTicketHTMLFromOrder(saleToReprint, giftTicket, employeeName);
    printHTMLTicket(htmlContent);
  };

  // Generar Ticket en HTML
  const generateTicketHTMLFromOrder = (orderData, giftTicket, employeeName) => {
    const header1 = configData?.ticket_text_header_1 || '';
    const header2 = configData?.ticket_text_header_2 || '';
    const footer1 = configData?.ticket_text_footer_1 || '';
    const footer2 = configData?.ticket_text_footer_2 || '';
    const date = new Date();
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${
      String(date.getMonth() + 1).padStart(2, '0')
    }/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${
      String(date.getMinutes()).padStart(2, '0')
    }`;

    const ticketTypeText = giftTicket ? 'Ticket regalo' : 'Ticket compra';
    const productRows = (orderData.order_details ?? [])
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

    return `
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
        ${header1 ? `<h3>${header1}</h3>` : ''}
        ${header2 ? `<h3>${header2}</h3>` : ''}
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
              ${
                !giftTicket 
                  ? '<th style="text-align:right;">P/U</th><th style="text-align:right;">Total</th>' 
                  : ''
              }
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
        ${
          !giftTicket 
            ? `<hr/><div><strong>Total:</strong> ${orderData.total_paid.toFixed(2)} €</div>` 
            : ''
        }
        ${!giftTicket ? paymentMethodsHTML : ''}

        ${
          footer1 
            ? `<div class="footer-text">${footer1}</div>` 
            : ''
        }
        ${
          footer2 
            ? `<div class="footer-text">${footer2}</div>` 
            : ''
        }
      </body>
      </html>
    `;
  };

  // Imprimir el ticket
  const printHTMLTicket = (htmlContent) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  /***********************************************************
   * CustomRow: Renderiza la "fila" + detalles con animación
   ***********************************************************/
  const CustomRow = ({ sale }) => {
    const [expanded, setExpanded] = useState(false);
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState('0px');

    const toggleExpand = () => {
      if (!isLoading && sale.order_details?.length > 0) {
        setExpanded(prev => !prev);
      }
    };

    useEffect(() => {
      if (expanded && contentRef.current) {
        const scrollHeight = contentRef.current.scrollHeight;
        setMaxHeight(`${scrollHeight}px`);
      } else {
        setMaxHeight('0px');
      }
    }, [expanded, sale.order_details]);

    const isSelected = sale.id_order === selectedOrderId;
    const handleSelect = () => {
      if (!isLoading) {
        setSelectedOrderId(sale.id_order);
      }
    };

    return (
      <div className="border rounded mb-2 p-2 bg-white shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between space-y-1 md:space-y-0">
          <div className="mr-2">
            {isLoading ? (
              // Skeleton
              <div className="animate-pulse">
                <div className="bg-gray-200 h-4 w-32 rounded mb-1" />
                <div className="bg-gray-200 h-3 w-24 rounded" />
              </div>
            ) : (
              <>
                <div className="font-semibold">
                  ID Venta: {sale.id_order}
                </div>
                <div className="text-gray-600">
                  ID Cliente: {sale.id_customer}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              // Skeleton
              <div className="animate-pulse flex space-x-2">
                <div className="bg-gray-200 h-4 w-16 rounded" />
                <div className="bg-gray-200 h-4 w-16 rounded" />
              </div>
            ) : (
              <>
                <div className="text-right">
                  <div className="text-gray-500 text-xs">Método Pago</div>
                  <div className="font-semibold">{sale.payment}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 text-xs">Total (€)</div>
                  <div className="font-semibold">
                    {sale.total_paid?.toFixed(2)}
                  </div>
                </div>
              </>
            )}

            {/* Radio */}
            <div>
              <input
                type="radio"
                checked={isSelected}
                onChange={handleSelect}
                disabled={isLoading}
              />
            </div>

            {/* Botón ver detalles */}
            {(!isLoading && sale.order_details?.length > 0) && (
              <Button
                label={expanded ? 'Ocultar' : 'Ver Detalles'}
                icon={`pi ${expanded ? 'pi-chevron-up' : 'pi-chevron-down'}`}
                className="p-button-text p-button-sm"
                onClick={toggleExpand}
              />
            )}
          </div>
        </div>

        {/* Subtabla con transición de altura */}
        <div
          ref={contentRef}
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight,
            marginTop: expanded ? '0.5rem' : '0',
          }}
        >
          <div className="border rounded p-2 bg-gray-50">
            {isLoading ? (
              // Skeleton en la subtabla
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-1 w-3/4" />
                <div className="h-4 bg-gray-200 rounded mb-1 w-2/3" />
                <div className="h-4 bg-gray-200 rounded mb-1 w-1/2" />
              </div>
            ) : (
              <table className="min-w-full text-xs md:text-sm">
                <thead className="bg-white text-gray-700">
                  <tr>
                    <th className="py-1 px-2 text-left">Producto</th>
                    <th className="py-1 px-2 text-right">Unid.</th>
                    <th className="py-1 px-2 text-right">P/U (€)</th>
                    <th className="py-1 px-2 text-right">Total (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.order_details?.map((item, idx) => {
                    const total = item.unit_price_tax_incl * item.product_quantity;
                    return (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="py-1 px-2">{item.product_name}</td>
                        <td className="py-1 px-2 text-right">
                          {item.product_quantity}
                        </td>
                        <td className="py-1 px-2 text-right">
                          {item.unit_price_tax_incl.toFixed(2)}
                        </td>
                        <td className="py-1 px-2 text-right">
                          {total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  /***********************************************************
   * singleColumnBodyTemplate => Renderiza CADA "fila"
   * Si isLoading => en lugar de data real, pon placeholders
   ***********************************************************/
  const singleColumnBodyTemplate = (sale) => {
    return <CustomRow sale={sale} isLoading={isLoading} />;
  };

  /***********************************************************
   * Generar "dummy" array con 6 elementos para skeleton
   ***********************************************************/
  const skeletonData = new Array(rows).fill(null).map((_, idx) => ({
    id_order: `skeleton-${idx}`,
    id_customer: '',
    payment: '',
    total_paid: 0,
    order_details: []
  }));

  /***********************************************************
   * Determinar qué data mostrar en la tabla:
   * si isLoading => 6 placeholders
   * else => modo "recent" => allOrders
   *      => modo "search" => [searchedOrder] o vacio
   ***********************************************************/
  let displayData = [];
  if (isLoading) {
    displayData = skeletonData; // 6 placeholders
  } else {
    if (mode === 'recent') {
      displayData = allOrders;
    } else {
      // mode = search
      displayData = searchedOrder ? [searchedOrder] : [];
    }
  }

  /***********************************************************
   * Render
   ***********************************************************/
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reimprimir Ticket"
      showCloseButton
      showBackButton={false}
      size="xl"
      height="md"
    >
      <div className="w-full mx-auto space-y-4">
        {/* Búsqueda ID */}
        <div className="flex space-x-2 items-end">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Número de ticket"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchOrder();
              }}
              className="border rounded p-2 w-full"
            />
          </div>
        </div>

        {error && <div className="text-red-500 font-semibold">{error}</div>}

        {/* Tabla: Si isLoading => 6 placeholders, sino => mode "recent" o "search" */}
        <DataTable
          value={displayData}
          className="p-datatable-sm"
          paginator
          rows={rows}
          dataKey="id_order"
          emptyMessage={
            isLoading
              ? '' /* no texto "Cargando..." */
              : mode === 'recent'
              ? 'No hay ventas recientes.'
              : 'No se encontró esa venta.'
          }
        >
          <Column body={singleColumnBodyTemplate} />
        </DataTable>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-2">
          <Button
            label="Ticket Normal"
            icon="pi pi-print"
            onClick={() => handleReprint(false)}
            className="p-button-success p-button-sm"
          />
          <Button
            label="Ticket Regalo"
            icon="pi pi-gift"
            onClick={() => handleReprint(true)}
            className="p-button-help p-button-sm"
          />
        </div>
      </div>
    </Modal>
  );
};

export default ReprintModal;