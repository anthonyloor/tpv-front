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
import { AuthContext } from "../../../contexts/AuthContext";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { ConfigContext } from "../../../contexts/ConfigContext";
import generateTicket from "../../../utils/ticket";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";
import { formatCurrencyES } from "../../../utils/formatters";

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
  const shopsDict = useShopsDictionary();
  const API_BASE_URL = getApiBaseUrl();
  const { configData } = useContext(ConfigContext);
  const employeesDict = useEmployeesDictionary();

  const ShopNameCell = ({ id_shop }) => (
    <span>{shopsDict[id_shop] || id_shop}</span>
  );

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketGift, setTicketGift] = useState(false);
  const [viewTicketOrderId, setViewTicketOrderId] = useState(null);
  const [printOptionModalVisible, setPrintOptionModalVisible] = useState(false);
  const [manualPdfDataUrl, setManualPdfDataUrl] = useState(null);
  const [orderDataForPrint, setOrderDataForPrint] = useState(null);

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
      const data = await apiFetch(`${API_BASE_URL}/get_order`, {
        method: "POST",
        body: JSON.stringify({
          id_order: orderId,
          origin: "mayret",
        }),
      });
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
    console.log("Reprint initiated for order ID:", saleToReprint);
    setViewTicketOrderId(saleToReprint);
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
          const data = await apiFetch(`${API_BASE_URL}/get_order`, {
            method: "POST",
            body: JSON.stringify({
              id_order: order.id_order,
              origin: "mayret",
            }),
          });
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
                body={(data) => formatCurrencyES(data.unit_price_tax_incl)}
                style={{ textAlign: "right" }}
              />
              <Column
                header="Total (€)"
                body={(rowData) =>
                  formatCurrencyES(
                    rowData.unit_price_tax_incl * rowData.product_quantity
                  )
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
                    body={(data) => formatCurrencyES(data.value)}
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

  useEffect(() => {
    if (ticketModalOpen && viewTicketOrderId) {
      (async () => {
        try {
          const data = await apiFetch(`${API_BASE_URL}/get_order`, {
            method: "POST",
            body: JSON.stringify({
              id_order: viewTicketOrderId.id_order || viewTicketOrderId,
              origin: "mayret",
            }),
          });
          if (!data || !data.order_details) {
            console.error("Error al recuperar datos del ticket");
          } else {
            setOrderDataForPrint(data);
            const response = await generateTicket(
              "print",
              data,
              configData,
              employeesDict,
              ticketGift
            );
            if (response.success) {
              console.log("Ticket impreso remotamente correctamente");
            } else if (response.manual) {
              setManualPdfDataUrl(response.pdfDataUrl);
              setPrintOptionModalVisible(true);
            } else {
              console.error("Error al imprimir ticket:", response.message);
            }
          }
        } catch (err) {
          console.error("Error en la consulta get_order para ticket:", err);
        } finally {
          setTicketModalOpen(false);
        }
      })();
    }
  }, [
    ticketModalOpen,
    viewTicketOrderId,
    configData,
    employeesDict,
    apiFetch,
    API_BASE_URL,
    ticketGift,
  ]);

  const handleManualPrint = () => {
    if (manualPdfDataUrl) {
      const printWindow = window.open("", "_blank"); // abrir ventana vacía
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>Vista Previa del PDF</title></head>
           <body style="margin:0">
             <iframe width="100%" height="100%" src="${manualPdfDataUrl}" frameborder="0"></iframe>
           </body></html>`
        );
        printWindow.document.close();
        printWindow.focus();
        setPrintOptionModalVisible(false);
      } else {
        console.warn("No se pudo abrir la ventana de previsualización");
      }
    }
  };

  const handleRetryPrint = async () => {
    if (orderDataForPrint) {
      try {
        const response = await generateTicket(
          "print",
          orderDataForPrint,
          configData,
          employeesDict,
          ticketGift
        );
        if (response.success) {
          console.log("Reimpresión remota exitosa");
          setPrintOptionModalVisible(false);
        } else if (response.manual) {
          setManualPdfDataUrl(response.pdfDataUrl);
          // El modal permanece abierto para nueva elección
        } else {
          console.error(
            "Error al reintentar imprimir ticket:",
            response.message
          );
        }
      } catch (err) {
        console.error("Error al reintentar impresión:", err);
      }
    }
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
            <Column
              selectionMode="single"
              style={{ width: "5px", textAlign: "center", padding: "0.5rem" }}
              alignHeader={"center"}
            />
            <Column
              expander
              style={{
                width: "5px",
                textAlign: "center",
                padding: "0.5rem",
              }}
              alignHeader={"center"}
            />
            <Column
              field="id_order"
              header="# Ticket"
              style={{ width: "80px", textAlign: "center", padding: "0.5rem" }}
            />
            <Column
              field="date_add"
              header="Fecha compra"
              style={{
                width: "230px",
                textAlign: "center",
                padding: "0.5rem",
              }}
              alignHeader={"center"}
            />
            <Column
              header="Tienda"
              body={(row) => (
                <ShopNameCell
                  id_shop={row.id_shop}
                  style={{
                    width: "150px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
              )}
            />
            <Column
              header="Cliente"
              body={(row) =>
                row.id_customer === configData.id_customer_default
                  ? "TPV"
                  : row.customer_name
              }
              style={{
                width: "150px",
                textAlign: "center",
                padding: "0.5rem",
              }}
              alignHeader={"center"}
            />
            <Column
              header="Pago"
              field="payment"
              body={(rowData) => {
                const paymentMethod = rowData.payment
                  ? rowData.payment.toLowerCase()
                  : "";
                if (
                  paymentMethod.includes("redsys") ||
                  paymentMethod.includes("tarjeta")
                ) {
                  return <i className="pi pi-credit-card"></i>;
                } else if (
                  paymentMethod.includes("contra reembolso") ||
                  paymentMethod.includes("contrareembolso") ||
                  paymentMethod.includes("efectivo")
                ) {
                  return <i className="pi pi-wallet"></i>;
                }
                return rowData.payment;
              }}
              style={{
                width: "100px",
                textAlign: "center",
                padding: "0.5rem",
              }}
              alignHeader={"center"}
            />
            <Column
              field="total_paid"
              header="Total"
              body={(data) => formatCurrencyES(data.total_paid)}
              style={{
                width: "100px",
                textAlign: "center",
                padding: "0.5rem",
              }}
              alignHeader={"center"}
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
      <Dialog
        header="Error de impresión"
        visible={printOptionModalVisible}
        onHide={() => setPrintOptionModalVisible(false)}
        modal
        draggable={false}
        resizable={false}
        style={{ marginBottom: "150px" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <span>
            La impresión del ticket ha fallado. ¿Deseas imprimirlo manualmente o
            reintentar?
          </span>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button label="Imprimir manual" onClick={handleManualPrint} />
            <Button label="Reintentar" onClick={handleRetryPrint} />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ReprintModal;
