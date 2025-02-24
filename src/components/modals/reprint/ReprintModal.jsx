// src/components/modals/reprint/ReprintModal.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useApiFetch } from "../../../components/utils/useApiFetch";
import TicketViewModal from "../ticket/TicketViewModal";

const ReprintModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const [mode, setMode] = useState("recent");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketGift, setTicketGift] = useState(false);
  const [viewTicketOrderId, setViewTicketOrderId] = useState(null);

  const rows = 4;

  const loadRecentOrders = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      setMode("recent");
      const data = await apiFetch("https://apitpv.anthonyloor.com/get_orders", {
        method: "GET",
      });
      setAllOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando ventas recientes:", err);
      setError("No se pudo obtener la lista de ventas recientes.");
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
      setMode("search");
      const data = await apiFetch(
        `https://apitpv.anthonyloor.com/get_order?id_order=${encodeURIComponent(
          orderId
        )}`,
        { method: "GET" }
      );
      setSearchedOrder(data);
    } catch (err) {
      console.error("Error buscando la orden:", err);
      setError("No se encontró la orden con ese ID o ocurrió un error.");
      setSearchedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Cuando se abre, cargamos las ventas recientes
  useEffect(() => {
    if (isOpen) {
      loadRecentOrders();
    } else {
      setAllOrders([]);
      setSearchedOrder(null);
      setOrderId("");
      setError(null);
      setSelectedOrderId(null);
      setIsLoading(false);
      setMode("recent");
    }
  }, [isOpen, loadRecentOrders]);

  // Pulsar en “Ticket Normal” o “Ticket Regalo”
  const handleReprintClick = (gift = false) => {
    if (!selectedOrderId) {
      alert("Selecciona una venta para reimprimir.");
      return;
    }
    let saleToReprint = null;
    if (mode === "recent") {
      saleToReprint = allOrders.find((o) => o.id_order === selectedOrderId);
    } else {
      if (searchedOrder && searchedOrder.id_order === selectedOrderId) {
        saleToReprint = searchedOrder;
      }
    }
    if (!saleToReprint) {
      alert("No se encontró la venta seleccionada.");
      return;
    }
    setTicketModalOpen(true);
    setViewTicketOrderId(saleToReprint.id_order);
    setTicketGift(gift);
  };

  // Fila expandible
  const CustomRow = ({ sale, isLoading }) => {
    const [expanded, setExpanded] = useState(false);
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState("0px");

    const toggleExpand = () => {
      if (!isLoading && sale.order_details?.length > 0) {
        setExpanded((prev) => !prev);
      }
    };

    useEffect(() => {
      if (expanded && contentRef.current) {
        const scrollHeight = contentRef.current.scrollHeight;
        setMaxHeight(`${scrollHeight}px`);
      } else {
        setMaxHeight("0px");
      }
    }, [expanded, sale.order_details]);

    // Chequear si es la venta seleccionada
    const isSelected = sale.id_order === selectedOrderId;
    const handleSelect = () => {
      if (!isLoading) {
        setSelectedOrderId(sale.id_order);
      }
    };

    // Estilos inline con CSS variables
    const containerStyle = {
      backgroundColor: "var(--surface-0)",
      border: "1px solid var(--surface-border)",
      borderRadius: "4px",
      marginBottom: "0.5rem",
      padding: "1rem",
      transition: "background-color 0.2s",
    };

    const headerStyle = {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.5rem",
      color: "var(--text-color)",
    };

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            {isLoading ? (
              <div className="p-mb-2">
                <div className="bg-gray-200 h-4 w-32 rounded mb-1" />
                <div className="bg-gray-200 h-3 w-24 rounded" />
              </div>
            ) : (
              <>
                <div className="font-bold mb-1">ID Venta: {sale.id_order}</div>
                <div className="text-sm">ID Cliente: {sale.id_customer}</div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="flex gap-2">
                <div className="bg-gray-200 h-4 w-16 rounded" />
                <div className="bg-gray-200 h-4 w-16 rounded" />
              </div>
            ) : (
              <>
                <div className="text-right">
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Método Pago
                  </div>
                  <div className="font-bold">{sale.payment}</div>
                </div>
                <div className="text-right">
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Total (€)
                  </div>
                  <div className="font-bold">{sale.total_paid?.toFixed(2)}</div>
                </div>
              </>
            )}

            {/* Radio => seleccionar la venta */}
            <input
              type="radio"
              checked={isSelected}
              onChange={handleSelect}
              disabled={isLoading}
            />

            {/* Botón expandir */}
            {!isLoading && sale.order_details?.length > 0 && (
              <Button
                label={expanded ? "Ocultar" : "Ver Detalles"}
                icon={`pi ${expanded ? "pi-chevron-up" : "pi-chevron-down"}`}
                className="p-button-text p-button-sm"
                onClick={toggleExpand}
              />
            )}
          </div>
        </div>

        {/* Contenido expandible */}
        <div
          ref={contentRef}
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight,
            marginTop: expanded ? "0.5rem" : "0",
          }}
        >
          <div
            className="p-2"
            style={{
              backgroundColor: "var(--surface-50)",
              border: "1px solid var(--surface-border)",
              borderRadius: "4px",
            }}
          >
            {isLoading ? (
              <div style={{ color: "var(--text-secondary)" }}>
                Cargando detalles...
              </div>
            ) : !sale.order_details?.length ? (
              <div className="text-sm">Sin detalles.</div>
            ) : (
              <table style={{ width: "100%", fontSize: "0.875rem" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: "var(--surface-100)",
                      color: "var(--text-color)",
                    }}
                  >
                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                      Producto
                    </th>
                    <th style={{ textAlign: "right", padding: "0.5rem" }}>
                      Unid.
                    </th>
                    <th style={{ textAlign: "right", padding: "0.5rem" }}>
                      P/U (€)
                    </th>
                    <th style={{ textAlign: "right", padding: "0.5rem" }}>
                      Total (€)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sale.order_details.map((item, idx) => {
                    const total =
                      item.unit_price_tax_incl * item.product_quantity;
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #ddd" }}>
                        <td style={{ padding: "0.5rem" }}>
                          {item.product_name}
                        </td>
                        <td style={{ padding: "0.5rem", textAlign: "right" }}>
                          {item.product_quantity}
                        </td>
                        <td style={{ padding: "0.5rem", textAlign: "right" }}>
                          {item.unit_price_tax_incl.toFixed(2)}
                        </td>
                        <td style={{ padding: "0.5rem", textAlign: "right" }}>
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

  // Datos “skeleton”
  const skeletonData = new Array(rows).fill(null).map((_, idx) => ({
    id_order: `skeleton-${idx}`,
    id_customer: "",
    payment: "",
    total_paid: 0,
    order_details: [],
  }));

  // singleColumnBodyTemplate
  const singleColumnBodyTemplate = (sale) => {
    return <CustomRow sale={sale} isLoading={isLoading} />;
  };

  let displayData = [];
  if (isLoading) {
    displayData = skeletonData;
  } else {
    if (mode === "recent") {
      displayData = allOrders;
    } else {
      displayData = searchedOrder ? [searchedOrder] : [];
    }
  }

  return (
    <>
      <Dialog
        visible={isOpen}
        onHide={onClose}
        header="Reimprimir Ticket"
        modal
        style={{
          width: "70vw",
          maxWidth: "900px",
          backgroundColor: "var(--surface-0)",
          color: "var(--text-color)",
        }}
      >
        <div className="p-2">
          {/* Input para buscar ticket */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1">
              <span className="p-input-icon-left w-full">
                <i
                  className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-secondary)" }}
                />
                <InputText
                  placeholder="Número de ticket"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchOrder();
                  }}
                  className="w-full pl-8"
                />
              </span>
            </div>
            <Button
              label="Buscar"
              icon="pi pi-search"
              onClick={handleSearchOrder}
              disabled={!orderId.trim()}
            />
          </div>

          {error && (
            <div className="text-red-500 font-semibold mb-2">{error}</div>
          )}

          {/* DataTable con las órdenes */}
          <DataTable
            value={displayData}
            className="p-datatable-sm p-datatable-gridlines"
            paginator
            rows={rows}
            dataKey="id_order"
            emptyMessage={
              isLoading
                ? ""
                : mode === "recent"
                ? "No hay ventas recientes."
                : "No se encontró esa venta."
            }
          >
            <Column body={singleColumnBodyTemplate} />
          </DataTable>

          {/* Botones para reimprimir */}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              label="Ticket Normal"
              icon="pi pi-print"
              onClick={() => handleReprintClick(false)}
              className="p-button-success"
            />
            <Button
              label="Ticket Regalo"
              icon="pi pi-gift"
              onClick={() => handleReprintClick(true)}
              className="p-button-help"
            />
          </div>
        </div>
      </Dialog>

      {ticketModalOpen && viewTicketOrderId && (
        <TicketViewModal
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          mode="ticket"
          orderId={viewTicketOrderId}
          giftTicket={ticketGift}
          printOnOpen
        />
      )}
    </>
  );
};

export default ReprintModal;
