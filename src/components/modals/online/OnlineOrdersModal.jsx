import React, { useState, useEffect, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
import { AuthContext } from "../../../contexts/AuthContext";
import { toast } from "sonner";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";
import { TabView, TabPanel } from "primereact/tabview";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";

const OnlineOrdersModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { shopId } = useContext(AuthContext);

  // Obtención una sola vez de los diccionarios
  const shopsDict = useShopsDictionary();
  const employeesDict = useEmployeesDictionary();

  const API_BASE_URL = getApiBaseUrl();

  // Nuevo diccionario de estados de órdenes
  const orderStateDict = {
    1: "Bizum",
    2: "Pago aceptado",
    3: "Preparación en curso",
    4: "Enviado",
    5: "Entregado",
    6: "Cancelado",
    7: "Reembolsado",
    8: "Error en pago",
    9: "Pedido pendiente por falta de stock (pagado)",
    10: "En espera de pago por transferencia bancaria",
    11: "Pago remoto aceptado",
    12: "Pedido pendiente por falta de stock (no pagado)",
    13: "En espera de validación por contra reembolso.",
    14: "Awaiting for PayPal payment",
    15: "Listo para recoger",
    18: "Parcialmente enviado",
    19: "Venta en TPV",
    20: "Presupuesto",
    21: "Facturación externa",
    22: "Modificación de pedido",
    23: "Awaiting for PayPal payment",
    26: "En espera de pago de vencimientos",
    27: "Bizum",
    28: "Redsys - Esperando pago",
    29: "Redsys - Pago por adelantado",
    30: "Redsys - Esperando confirmación",
    31: "En espera de la aplicación móvil de pago de PayPal",
    32: "Mobile App PayPal Payment Accepted",
    34: "Redsys - Revisar pago",
    35: "SEUR: Envío con Incidencia",
    36: "SEUR: Envío en tránsito",
    37: "SEUR: Devolución en progreso",
    38: "SEUR: Disponible en tienda",
    39: "SEUR: Intervención requerida",
    40: "SEUR Pago reembolso",
  };

  const ShopNameCell = ({ id_shop }) => (
    <span>{shopsDict[id_shop] || id_shop}</span>
  );
  const EmployeeNameCell = ({ id_employee }) => (
    <span>{employeesDict[id_employee] || id_employee}</span>
  );

  // Función para formatear fecha => dd-mm-yyyy hh:mm
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return dateString; // Si no es fecha válida, devuelves la cadena original

    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = dateObj.getFullYear();

    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");

    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  };

  useEffect(() => {
    if (isOpen) {
      loadOnlineOrders();
      setSearchedOrder(null);
      setSearchOrderId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadOnlineOrders = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch(`${API_BASE_URL}/get_shop_orders`, {
        method: "POST",
        body: JSON.stringify({ origin: "all", id_shop: 1 }),
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar las órdenes online.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchOrder = async () => {
    if (!searchOrderId.trim()) return;
    try {
      setIsLoading(true);
      const data = await apiFetch(
        `${API_BASE_URL}/get_order?id_order=${encodeURIComponent(
          searchOrderId.trim()
        )}`,
        { method: "GET" }
      );
      if (data) {
        setSearchedOrder(data);
      } else {
        toast.error("No se encontró el pedido.");
      }
    } catch (error) {
      toast.error("Error al buscar el pedido.");
    } finally {
      setIsLoading(false);
    }
  };

  const ordersToDisplay = searchedOrder ? [searchedOrder] : orders;

  // Nuevos arreglos filtrados según condiciones
  const pendingOrders = ordersToDisplay.filter(
    (order) =>
      order.valid !== true &&
      ![5, 6, 7, 19].includes(Number(order.current_state))
  );
  const completedOrders = ordersToDisplay.filter(
    (order) =>
      order.valid === true &&
      [5, 6, 7, 19].includes(Number(order.current_state))
  );

  // Estados para filas expandidas por tabla
  const [pendingExpandedRows, setPendingExpandedRows] = useState(null);
  const [completedExpandedRows, setCompletedExpandedRows] = useState(null);

  // Template para mostrar detalles de pedido (order_details) usando DataTable
  const rowExpansionTemplate = (data) => {
    return (
      <div className="p-3">
        <DataTable
          value={data.order_details || []}
          responsiveLayout="scroll"
          header="Detalles del pedido"
          tableStyle={{ minWidth: "50rem" }}
        >
          <Column
            header="Cantidad"
            field="product_quantity"
            bodyStyle={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
          />
          <Column
            header="Producto"
            field="product_name"
            bodyStyle={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
          />
          <Column
            header="Total (€)"
            field="total_price_tax_incl"
            body={(rowData) => Number(rowData.total_price_tax_incl).toFixed(2)}
            bodyStyle={{ textAlign: "left", borderBottom: "1px solid #ddd" }}
          />
        </DataTable>
      </div>
    );
  };

  return (
    <Dialog
      header="Pedidos Online"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{
        width: "60vw",
        height: "70vh",
        minWidth: "900px",
        minHeight: "650px",
      }}
    >
      <div className="p-3">
        {/* Sección de búsqueda */}
        <div className="flex gap-2 mb-3">
          <InputText
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchOrder();
            }}
            placeholder="Número de pedido"
            className="flex-1"
          />
          <Button
            label="Buscar"
            onClick={handleSearchOrder}
            disabled={isLoading || !searchOrderId.trim()}
          />
        </div>
        <TabView>
          <TabPanel header="Pedidos pendientes">
            <DataTable
              value={pendingOrders}
              loading={isLoading}
              emptyMessage="No hay pedidos pendientes para mostrar."
              paginator
              rows={7}
              expandedRows={pendingExpandedRows}
              onRowToggle={(e) => setPendingExpandedRows(e.data)}
              rowExpansionTemplate={rowExpansionTemplate}
            >
              <Column expander style={{ width: "5px" }} />
              <Column
                field="id_order"
                header="# Pedido"
                style={{ width: "5px", textAlign: "center" }}
              />
              <Column
                header="Fecha"
                body={(row) => formatDate(row.date_add)}
                style={{ width: "130px", textAlign: "center" }}
              />
              <Column
                header="ID Cliente"
                field="id_customer"
                style={{ width: "5px", textAlign: "center" }}
              />
              <Column
                header="ID Dirección"
                field="id_address_delivery"
                style={{ width: "5px", textAlign: "center" }}
              />
              <Column
                field="payment"
                header="Forma de pago"
                style={{ width: "100px", textAlign: "center" }}
              />
              <Column
                field="total_paid"
                header="Total (€)"
                body={(data) => Number(data.total_paid)?.toFixed(2)}
                style={{ width: "50px", textAlign: "center" }}
              />
              <Column
                header="Estado"
                body={(row) =>
                  orderStateDict[row.current_state] || row.current_state
                }
                style={{ width: "5px", textAlign: "center" }}
              />
              <Column
                field="origin"
                header="Origen"
                body={(row) => {
                  const color =
                    row.origin === "mayret" ? "bg-blue-500" : "bg-green-500";
                  return (
                    <span className={`text-white py-1 px-2 rounded ${color}`}>
                      {row.origin}
                    </span>
                  );
                }}
                style={{ width: "5px", textAlign: "center" }}
              />
            </DataTable>
          </TabPanel>
          <TabPanel header="Pedidos completados">
            <DataTable
              value={completedOrders}
              loading={isLoading}
              emptyMessage="No hay pedidos completados para mostrar."
              paginator
              rows={7}
              expandedRows={completedExpandedRows}
              onRowToggle={(e) => setCompletedExpandedRows(e.data)}
              rowExpansionTemplate={rowExpansionTemplate}
            >
              <Column expander style={{ width: "5px", textAlign: "left" }} />
              <Column
                field="id_order"
                header="# Pedido"
                style={{ width: "5px", textAlign: "left" }}
              />
              <Column
                header="Fecha"
                body={(row) => formatDate(row.date_add)}
                style={{ width: "130px", textAlign: "left" }}
              />
              <Column
                header="ID Cliente"
                field="id_customer"
                style={{ width: "5px", textAlign: "left" }}
              />
              <Column
                header="ID Dirección"
                field="id_address_delivery"
                style={{ width: "5px", textAlign: "left" }}
              />
              <Column
                field="payment"
                header="Forma de pago"
                style={{ width: "100px", textAlign: "left" }}
              />
              <Column
                field="total_paid"
                header="Total (€)"
                body={(data) => Number(data.total_paid)?.toFixed(2)}
                style={{ width: "50px", textAlign: "left" }}
              />
              <Column
                header="Estado"
                body={(row) =>
                  orderStateDict[row.current_state] || row.current_state
                }
                style={{ width: "5px", textAlign: "left" }}
              />
              <Column
                field="origin"
                header="Origen"
                body={(row) => {
                  const color =
                    row.origin === "mayret" ? "bg-blue-500" : "bg-green-500";
                  return (
                    <span className={`text-white py-1 px-2 rounded ${color}`}>
                      {row.origin}
                    </span>
                  );
                }}
                style={{ width: "5px", textAlign: "left" }}
              />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>
    </Dialog>
  );
};

export default OnlineOrdersModal;
