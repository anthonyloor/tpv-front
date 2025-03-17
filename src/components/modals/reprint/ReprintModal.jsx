// src/components/modals/reprint/ReprintModal.jsx

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useApiFetch } from "../../../utils/useApiFetch";
import TicketViewModal from "../ticket/TicketViewModal";
import { AuthContext } from "../../../contexts/AuthContext";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";

const ReprintModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const { shopId } = useContext(AuthContext);
  const [mode, setMode] = useState("recent");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const toast = useRef(null);
  // Obtención una sola vez de los diccionarios
  const shopsDict = useShopsDictionary();
  const employeesDict = useEmployeesDictionary();
  const API_BASE_URL = getApiBaseUrl();

  const ShopNameCell = ({ id_shop }) => (
    <span>{shopsDict[id_shop] || id_shop}</span>
  );
  const EmployeeNameCell = ({ id_employee }) => (
    <span>{employeesDict[id_employee] || id_employee}</span>
  );

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketGift, setTicketGift] = useState(false);
  const [viewTicketOrderId, setViewTicketOrderId] = useState(null);

  const rows = 4;

  const loadRecentOrders = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      setMode("recent");
      const data = await apiFetch(`${API_BASE_URL}/get_shop_orders`, {
        method: "POST",
        body: JSON.stringify({
          id_shop: shopId,
          origin: "mayret",
        }),
      });
      setAllOrders(
        Array.isArray(data)
          ? data.map((order) => ({
              ...order,
              order_cart_rules: order.order_cart_rules || [],
            }))
          : []
      );
    } catch (err) {
      console.error("Error cargando ventas recientes:", err);
      setError("No se pudo obtener la lista de ventas recientes.");
      setAllOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, shopId, API_BASE_URL]);

  const handleSearchOrder = async () => {
    if (!orderId.trim()) return;
    try {
      setError(null);
      setIsLoading(true);
      setMode("search");
      const data = await apiFetch(
        `${API_BASE_URL}/get_order?id_order=${encodeURIComponent(orderId)}`,
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
      setExpandedRows(null);
    }
  }, [isOpen, loadRecentOrders]);

  // Pulsar en “Ticket Normal” o “Ticket Regalo”
  const handleReprintClick = (gift = false) => {
    if (!selectedOrderId) {
      alert("Selecciona una venta para reimprimir.");
      return;
    }
    // Usar directamente el objeto seleccionado si es un objeto.
    const saleToReprint =
      typeof selectedOrderId === "object"
        ? selectedOrderId
        : mode === "recent"
        ? allOrders.find((o) => o.id_order === selectedOrderId)
        : searchedOrder && searchedOrder.id_order === selectedOrderId
        ? searchedOrder
        : null;

    if (!saleToReprint) {
      alert("No se encontró la venta seleccionada.");
      return;
    }
    setTicketModalOpen(true);
    setViewTicketOrderId(saleToReprint.id_order);
    setTicketGift(gift);
  };

  // Unificar las órdenes a mostrar según el modo
  const displayOrders =
    mode === "recent" ? allOrders : searchedOrder ? [searchedOrder] : [];

  // Nuevo componente para la expansión de filas
  const OrderExpansion = ({ order, apiFetch }) => {
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState([]);

    useEffect(() => {
      setLoading(true);
      (async () => {
        try {
          const data = await apiFetch(
            `${API_BASE_URL}/get_order?id_order=${encodeURIComponent(
              order.id_order
            )}`,
            { method: "GET" }
          );
          setDetails(data.order_details || []);
          order.order_cart_rules = data.order_cart_rules || [];
        } catch (err) {
          console.error("Error cargando detalles:", err);
        } finally {
          setLoading(false);
        }
      })();
    }, [order, apiFetch]);

    return (
      <div className="p-3">
        {loading ? (
          <div>Cargando detalles...</div>
        ) : details.length > 0 ? (
          <>
            <h5>Detalles de la venta #{order.id_order}</h5>
            <DataTable value={details}>
              <Column field="product_name" header="Producto" />
              <Column
                field="product_quantity"
                header="Cant."
                style={{ textAlign: "right" }}
              />
              <Column
                field="unit_price_tax_incl"
                header="P/U (€)"
                body={(data) => data.unit_price_tax_incl.toFixed(2)}
                style={{ textAlign: "right" }}
              />
              <Column
                header="Total (€)"
                body={(rowData) =>
                  (
                    rowData.unit_price_tax_incl * rowData.product_quantity
                  ).toFixed(2)
                }
                style={{ textAlign: "right" }}
              />
            </DataTable>
            {order.order_cart_rules && order.order_cart_rules.length > 0 && (
              <>
                <h5 style={{ marginTop: "1rem" }}>Descuentos</h5>
                <DataTable value={order.order_cart_rules}>
                  <Column field="code" header="Código" />
                  <Column field="name" header="Nombre" />
                  <Column
                    field="value"
                    header="Valor"
                    body={(data) => data.value.toFixed(2) + " €"}
                    style={{ textAlign: "right" }}
                  />
                </DataTable>
              </>
            )}
          </>
        ) : (
          <div>No hay detalles.</div>
        )}
      </div>
    );
  };

  // Reemplazar rowExpansionTemplate con una función que retorne OrderExpansion
  const rowExpansionTemplate = (order) => {
    return <OrderExpansion order={order} apiFetch={apiFetch} />;
  };

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
        draggable={false}
        resizable={false}
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
          <Toast ref={toast} />
          <DataTable
            value={displayOrders}
            dataKey="id_order"
            selection={selectedOrderId}
            onSelectionChange={(e) => setSelectedOrderId(e.value)}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={rowExpansionTemplate}
            paginator
            rows={rows}
            emptyMessage={
              isLoading
                ? ""
                : mode === "recent"
                ? "No hay ventas recientes."
                : "No se encontró esa venta."
            }
          >
            <Column selectionMode="single" headerStyle={{ width: "1px" }} />
            <Column expander style={{ width: "1px" }} />
            <Column field="id_order" header="# Ticket" />
            <Column
              field="date_add"
              header="Fecha"
              body={(rowData) => {
                const date = new Date(rowData.date_add);
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                const hh = String(date.getHours()).padStart(2, "0");
                const mm = String(date.getMinutes()).padStart(2, "0");
                return `${y}-${m}-${d} ${hh}:${mm}`;
              }}
            />
            <Column
              header="Tienda"
              body={(row) => <ShopNameCell id_shop={row.id_shop} />}
            />
            <Column field="id_customer" header="Cliente" />
            <Column field="payment" header="Pago" />
            <Column
              field="total_paid"
              header="Total (€)"
              body={(data) => data.total_paid?.toFixed(2)}
              sortable
              style={{ textAlign: "right" }}
            />
          </DataTable>
          {/* Botones para reimprimir basados en la venta seleccionada */}
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
