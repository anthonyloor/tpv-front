// src/components/modals/reprint/ReprintModal.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../Modal'; 
import { useApiFetch } from '../../../components/utils/useApiFetch';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
// Nuestro TicketViewModal con mode="ticket"
import TicketViewModal from '../ticket/TicketViewModal';

const ReprintModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();

  const [mode, setMode] = useState('recent');     // "recent" o "search"
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ventas recientes
  const [allOrders, setAllOrders] = useState([]);
  // Venta buscada
  const [searchedOrder, setSearchedOrder] = useState(null);

  // Paginación
  const rows = 4;

  // Selección del pedido a reimprimir
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Para abrir el modal de ticket
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketGift, setTicketGift] = useState(false);
  const [viewTicketOrderId, setViewTicketOrderId] = useState(null);

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

  const handleReprintClick = (gift = false) => {
    if (!selectedOrderId) {
      alert('Selecciona una venta para reimprimir.');
      return;
    }

    let saleToReprint = null;
    if (mode === 'recent') {
      saleToReprint = allOrders.find(o => o.id_order === selectedOrderId);
    } else {
      // mode=search
      if (searchedOrder && searchedOrder.id_order === selectedOrderId) {
        saleToReprint = searchedOrder;
      }
    }
    if (!saleToReprint) {
      alert('No se encontró la venta seleccionada.');
      return;
    }

    // Actualizamos estados para abrir TicketViewModal
    setTicketModalOpen(true);
    setViewTicketOrderId(saleToReprint.id_order);
    setTicketGift(gift);
  };

  const CustomRow = ({ sale, isLoading }) => {
    const [expanded, setExpanded] = useState(false);
    const [maxHeight, setMaxHeight] = useState('0px');
    const contentRef = useRef(null);

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

    // Seleccionar
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

            {/* Radio de selección */}
            <div>
              <input
                type="radio"
                checked={isSelected}
                onChange={handleSelect}
                disabled={isLoading}
              />
            </div>

            {/* Botón expandir */}
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

        {/* Subtabla con transición */}
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

  // Skeleton
  const skeletonData = new Array(rows).fill(null).map((_, idx) => ({
    id_order: `skeleton-${idx}`,
    id_customer: '',
    payment: '',
    total_paid: 0,
    order_details: []
  }));

  // Cuerpo de la columna (primera y única) que renderiza CustomRow
  const singleColumnBodyTemplate = (sale) => {
    return <CustomRow sale={sale} isLoading={isLoading} />;
  };

  // Determinar qué data mostrar
  let displayData = [];
  if (isLoading) {
    displayData = skeletonData;
  } else {
    if (mode === 'recent') {
      displayData = allOrders;
    } else {
      // mode=search
      displayData = searchedOrder ? [searchedOrder] : [];
    }
  }

  if (!isOpen) return null;

  return (
    <>
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
          {/* Barra de búsqueda */}
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

          {/* Tabla */}
          <DataTable
            value={displayData}
            className="p-datatable-sm"
            paginator
            rows={rows}
            dataKey="id_order"
            emptyMessage={
              isLoading
                ? '' 
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
              onClick={() => handleReprintClick(false)}
              className="p-button-success p-button-sm"
            />
            <Button
              label="Ticket Regalo"
              icon="pi pi-gift"
              onClick={() => handleReprintClick(true)}
              className="p-button-help p-button-sm"
            />
          </div>
        </div>
      </Modal>

      {/* TicketViewModal con mode="ticket" */}
      {ticketModalOpen && viewTicketOrderId && (
        <TicketViewModal
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          mode="ticket"         // <-- Aquí indicamos el modo "ticket"
          orderId={viewTicketOrderId}
          giftTicket={ticketGift}
          printOnOpen={true}   // Si deseas que abra la impresión automáticamente, pon true
        />
      )}
    </>
  );
};

export default ReprintModal;