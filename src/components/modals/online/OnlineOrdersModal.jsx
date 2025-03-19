import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);

  const shopsDict = useShopsDictionary();
  const employeesDict = useEmployeesDictionary();

  const API_BASE_URL = getApiBaseUrl();

  const ShopNameCell = ({ id_shop }) => (
    <span>{shopsDict[id_shop] || id_shop}</span>
  );
  const EmployeeNameCell = ({ id_employee }) => (
    <span>{employeesDict[id_employee] || id_employee}</span>
  );

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return dateString;

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

  const handleOpenOrder = (order) => {
    setSelectedOrder(order);
    setOrderDetailsVisible(true);
  };

  const actionBodyTemplate = (rowData) => (
    <Button
      icon="pi pi-eye"
      className="p-button-rounded p-button-text"
      onClick={() => handleOpenOrder(rowData)}
    />
  );

  const ordersToDisplay = searchedOrder ? [searchedOrder] : orders;

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

  const [pendingExpandedRows, setPendingExpandedRows] = useState(null);
  const [completedExpandedRows, setCompletedExpandedRows] = useState(null);

  const rowExpansionTemplate = (data) => {
    return (
      <div className="">
        <DataTable
          value={data.order_details || []}
          responsiveLayout="scroll"
          header="Detalles del pedido"
          className="p-datatable-sm"
        >
          <Column
            header="Und"
            field="product_quantity"
            bodyStyle={{ textAlign: "center", width: "5%" }}
          />
          <Column
            header="Producto"
            field="product_name"
            bodyStyle={{ textAlign: "left", width: "80%" }}
          />
          <Column
            header="Total €"
            field="total_price_tax_incl"
            body={(rowData) => Number(rowData.total_price_tax_incl).toFixed(2)}
            bodyStyle={{ textAlign: "center", width: "10%" }}
          />
        </DataTable>
      </div>
    );
  };

  return (
    <>
      <Dialog
        header="Pedidos Online"
        visible={isOpen}
        onHide={onClose}
        modal
        draggable={false}
        resizable={false}
        style={{
          maxWidth: "60vw",
          maxHeight: "70vh",
          minWidth: "900px",
          minHeight: "650px",
        }}
      >
        <div className="p-2">
          <div className="flex gap-2 mb-2">
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
                rows={8}
                expandedRows={pendingExpandedRows}
                onRowToggle={(e) => setPendingExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
                tableStyle={{ width: "100%" }}
              >
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
                  body={actionBodyTemplate}
                  header="Acción"
                  style={{
                    width: "50px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  field="id_order"
                  header="# Pedido"
                  style={{
                    width: "80px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Fecha"
                  body={(row) => formatDate(row.date_add)}
                  style={{
                    width: "230px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Cliente"
                  field="customer_name"
                  style={{
                    width: "150px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Dirección"
                  field="address_delivery_name"
                  style={{
                    width: "200px",
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
                  header="Total (€)"
                  body={(data) => Number(data.total_paid)?.toFixed(2)}
                  style={{
                    width: "100px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Estado"
                  field="current_state_name"
                  style={{
                    width: "150px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Origen"
                  field="origin"
                  body={(row) => {
                    const color =
                      row.origin === "mayret" ? "bg-blue-500" : "bg-green-500";
                    let originText =
                      row.origin === "fajasmaylu" ? "fajas\nmaylu" : row.origin;
                    return (
                      <div
                        className={`text-white py-1 px-2 rounded ${color} text-center`}
                      >
                        {originText}
                      </div>
                    );
                  }}
                  style={{
                    width: "80px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
              </DataTable>
            </TabPanel>
            <TabPanel header="Pedidos completados">
              <DataTable
                value={completedOrders}
                loading={isLoading}
                emptyMessage="No hay pedidos completados para mostrar."
                paginator
                rows={8}
                expandedRows={completedExpandedRows}
                onRowToggle={(e) => setCompletedExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
              >
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
                  body={actionBodyTemplate}
                  header="Acción"
                  style={{
                    width: "50px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  field="id_order"
                  header="# Pedido"
                  style={{
                    width: "80px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Fecha"
                  body={(row) => formatDate(row.date_add)}
                  style={{
                    width: "230px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Cliente"
                  field="customer_name"
                  style={{
                    width: "150px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Dirección"
                  field="address_delivery_name"
                  style={{
                    width: "200px",
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
                  header="Total (€)"
                  body={(data) => Number(data.total_paid)?.toFixed(2)}
                  style={{
                    width: "100px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Estado"
                  field="current_state_name"
                  style={{
                    width: "150px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Origen"
                  field="origin"
                  body={(row) => {
                    const color =
                      row.origin === "mayret" ? "bg-blue-500" : "bg-green-500";
                    let originText =
                      row.origin === "fajasmaylu" ? "fajas\nmaylu" : row.origin;
                    return (
                      <div
                        className={`text-white py-1 px-2 rounded ${color} text-center`}
                      >
                        {originText}
                      </div>
                    );
                  }}
                  style={{
                    width: "80px",
                    textAlign: "center",
                    padding: "0.5rem",
                  }}
                  alignHeader={"center"}
                />
              </DataTable>
            </TabPanel>
          </TabView>
        </div>
      </Dialog>

      <Dialog
        header="Detalles del Pedido"
        visible={orderDetailsVisible}
        onHide={() => {
          setOrderDetailsVisible(false);
          setSelectedOrder(null);
        }}
        modal
        style={{ width: "50vw" }}
      >
        {selectedOrder && (
          <div>
            <div className="p-grid p-fluid mb-3">
              <div className="p-col-6">
                <strong>ID Pedido:</strong> {selectedOrder.id_order}
              </div>
              <div className="p-col-6">
                <strong>Shop:</strong> {selectedOrder.id_shop}
              </div>
              <div className="p-col-6">
                <strong>Cliente:</strong> {selectedOrder.customer_name}
              </div>
              <div className="p-col-6">
                <strong>Empleado:</strong> {selectedOrder.id_employee}
              </div>
              <div className="p-col-6">
                <strong>Pago:</strong> {selectedOrder.payment}
              </div>
              <div className="p-col-6">
                <strong>Total (€):</strong>{" "}
                {Number(selectedOrder.total_paid)?.toFixed(2)}
              </div>
              <div className="p-col-6">
                <strong>Estado:</strong> {selectedOrder.current_state_name}
              </div>
              <div className="p-col-6">
                <strong>Fecha:</strong> {formatDate(selectedOrder.date_add)}
              </div>
              <div className="p-col-12">
                <strong>Origen:</strong> {selectedOrder.origin}
              </div>
            </div>
            <DataTable
              value={selectedOrder.order_details || []}
              responsiveLayout="scroll"
              header="Detalles del pedido"
              className="p-datatable-sm"
            >
              <Column
                header="Producto"
                field="product_name"
                bodyStyle={{ textAlign: "left" }}
              />
              <Column
                header="Und"
                field="product_quantity"
                bodyStyle={{ textAlign: "center" }}
              />
              <Column
                header="Precio"
                field="product_price"
                body={(rowData) => Number(rowData.product_price)?.toFixed(2)}
                bodyStyle={{ textAlign: "center" }}
              />
              <Column
                header="Total €"
                field="total_price_tax_incl"
                body={(rowData) =>
                  Number(rowData.total_price_tax_incl)?.toFixed(2)
                }
                bodyStyle={{ textAlign: "center" }}
              />
            </DataTable>
          </div>
        )}
      </Dialog>
    </>
  );
};

export default OnlineOrdersModal;
