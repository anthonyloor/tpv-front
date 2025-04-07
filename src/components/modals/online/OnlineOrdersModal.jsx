import React, { useState, useEffect, useCallback, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
import { toast } from "sonner";
import { TabView, TabPanel } from "primereact/tabview";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import useProductSearch from "../../../hooks/useProductSearch";
import { AuthContext } from "../../../contexts/AuthContext";
import ActionResultDialog from "../../common/ActionResultDialog";
import generateTicket from "../../../utils/ticket";
import { ConfigContext } from "../../../contexts/ConfigContext";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";
import { ClientContext } from "../../../contexts/ClientContext";

const OnlineOrdersModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedOrderForStock, setSelectedOrderForStock] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const { employeeId, shopId } = useContext(AuthContext);
  const [resultDialogVisible, setResultDialogVisible] = useState(false);
  const [resultDialogMessage, setResultDialogMessage] = useState("");
  const [resultDialogSuccess, setResultDialogSuccess] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [viewTicketOrderId, setViewTicketOrderId] = useState(null);
  const { configData } = useContext(ConfigContext);
  const employeesDict = useEmployeesDictionary();
  const { selectedClient } = useContext(ClientContext);

  const API_BASE_URL = getApiBaseUrl();

  const stockSearch = useProductSearch({
    apiFetch,
    shopId: "all",
    allowOutOfStockSales: true,
    onAddProduct: () => {},
    onAddDiscount: () => {},
    idProfile: null,
    selectedClient,
  });

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

  const loadOnlineOrders = useCallback(async () => {
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
  }, [apiFetch, API_BASE_URL]);

  useEffect(() => {
    if (isOpen) {
      loadOnlineOrders();
      setSearchedOrder(null);
    }
  }, [isOpen, loadOnlineOrders]);

  useEffect(() => {
    const loadShops = async () => {
      try {
        const data = await apiFetch(`${API_BASE_URL}/shops`, { method: "GET" });
        setShops(data.filter((s) => s.id_shop !== 1));
      } catch (error) {
        console.error("Error loading shops:", error);
      }
    };
    loadShops();
  }, [apiFetch, API_BASE_URL]);

  const handleOpenOrder = (order) => {
    setSelectedOrder(order);
    setOrderDetailsVisible(true);
  };

  const handleOpenStock = async (order) => {
    console.log("handleOpenStock", order);
    setSelectedOrderForStock(order);

    // Obtener movimientos desde el almacén y filtrar por el id de orden
    const movements = await apiFetch(
      `${API_BASE_URL}/get_warehouse_movements`,
      {
        method: "POST",
        body: JSON.stringify({}), // Ajustar el body si es necesario
      }
    );
    const relevantMovements = Array.isArray(movements)
      ? movements.filter(
          (mov) =>
            mov.description && mov.description.includes(`#${order.id_order}`)
        )
      : [];
    console.log("Movimientos relevantes:", relevantMovements);

    // Crear un mapping ean13 => id_shop_origin
    let managedMapping = {};
    if (relevantMovements.length > 0) {
      const movementDetailsResponses = await Promise.all(
        relevantMovements.map((mov) =>
          apiFetch(
            `${API_BASE_URL}/get_warehouse_movement?id_warehouse_movement=${mov.id_warehouse_movement}`,
            {
              method: "GET",
            }
          )
        )
      );
      // Asumimos que el orden de respuestas coincide con el de relevantMovements
      movementDetailsResponses.forEach((movDetail, index) => {
        const movement = relevantMovements[index];
        if (movDetail && movDetail.movement_details) {
          movDetail.movement_details.forEach((detail) => {
            managedMapping[detail.ean13] = movement.id_shop_origin;
          });
        }
      });
      console.log("Mapping de EANs gestionados:", managedMapping);
    }

    const productsStockData = await Promise.all(
      order.order_details.map(async (detail) => {
        console.log("detail", detail);
        // Si el ean13 ya está gestionado, agregar managedShop
        if (managedMapping[detail.product_ean13]) {
          return {
            product_name: detail.product_name,
            id_product: detail.product_id,
            id_product_attribute: detail.product_attribute_id,
            product_quantity: detail.product_quantity,
            product_ean13: detail.product_ean13,
            alreadyManaged: true,
            managedShop: managedMapping[detail.product_ean13],
          };
        }
        // Consulta normal de stock si no está gestionado
        let ean = detail.product_ean13;
        const groups = await stockSearch.handleSearch(ean, true);
        let stockByShop = {};
        if (groups && groups.length > 0) {
          const stocks = groups[0].combinations[0]?.stocks || [];
          stocks.forEach((s) => {
            stockByShop[s.id_shop] = (stockByShop[s.id_shop] || 0) + s.quantity;
          });
        }
        return {
          product_name: detail.product_name,
          id_product: detail.product_id,
          id_product_attribute: detail.product_attribute_id,
          product_quantity: detail.product_quantity,
          product_ean13: detail.product_ean13,
          ...stockByShop,
        };
      })
    );
    setStockData(productsStockData);
    setStockModalVisible(true);
  };

  const handleUpdateOnlineOrder = async () => {
    if (!selectedOrderForStock) {
      toast.error("No hay un pedido seleccionado para actualizar.");
      return;
    }

    const shopsMap = {};
    selectedCells.forEach((cell) => {
      console.log("cell", cell);
      const shopId = Number(cell.field);
      const row = stockData[cell.rowIndex];
      if (!row) return;
      if (!shopsMap[shopId]) {
        shopsMap[shopId] = { id_shop: shopId, products: [] };
      }
      // Se usa la cantidad original de la order en lugar de la cantidad de la tienda
      const qty = row.product_quantity;
      shopsMap[shopId].products.push({
        ean13: row.product_ean13,
        quantity: qty,
        id_product: row.id_product,
        id_product_attribute: row.id_product_attribute,
        product_name: row.product_name,
      });
    });
    const paymentMethod = selectedOrderForStock.payment.toLowerCase();
    const total_cash = paymentMethod.includes("contra reembolso")
      ? selectedOrderForStock.total_paid
      : 0;
    const total_card = paymentMethod.includes("tarjeta")
      ? selectedOrderForStock.total_paid
      : 0;
    const total_bizum = paymentMethod.includes("bizum")
      ? selectedOrderForStock.total_paid
      : 0;

    const payload = {
      id_order: selectedOrderForStock.id_order,
      id_shop: shopId,
      license: configData.license,
      total_paid: selectedOrderForStock.total_paid,
      total_cash,
      total_card,
      total_bizum,
      status: 43,
      origin: selectedOrderForStock.origin,
      id_employee: employeeId,
      shops: Object.values(shopsMap),
    };
    console.log("Payload para update_online_orders:", payload);
    try {
      const res = await apiFetch(`${API_BASE_URL}/update_online_orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === "OK") {
        setResultDialogSuccess(true);
        setResultDialogMessage("Actualización realizada con éxito");
        setStockModalVisible(false);
        loadOnlineOrders();
      } else {
        setResultDialogSuccess(false);
        setResultDialogMessage(
          res.message || "Error al actualizar el pedido online"
        );
      }
    } catch (error) {
      console.error("Error en update_online_orders:", error);
      setResultDialogSuccess(false);
      setResultDialogMessage("Error: " + error.message);
    } finally {
      setResultDialogVisible(true);
    }
  };

  const handlePrintTicket = (order) => {
    setViewTicketOrderId(order);
    setTicketModalVisible(true);
  };

  const actionBodyTemplate = (rowData) => (
    <>
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-text"
        onClick={() => handleOpenOrder(rowData)}
      />
      <Button
        icon="pi pi-cog"
        className="p-button-rounded p-button-text"
        onClick={() => handleOpenStock(rowData)}
      />
      <Button
        icon="pi pi-receipt"
        className="p-button-rounded p-button-text"
        onClick={() => handlePrintTicket(rowData)}
      />
    </>
  );

  const ordersToDisplay = searchedOrder ? [searchedOrder] : orders;

  const pendingOrders = ordersToDisplay
    .filter((order) =>
      [1, 2, 3, 4, 9, 10, 11, 13].includes(Number(order.current_state))
    )
    .sort((a, b) => new Date(b.date_add) - new Date(a.date_add));

  const completedOrders = ordersToDisplay
    .filter((order) => [5, 43].includes(Number(order.current_state)))
    .sort((a, b) => new Date(b.date_add) - new Date(a.date_add));

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

  useEffect(() => {
    if (ticketModalVisible && viewTicketOrderId) {
      (async () => {
        const response = await generateTicket(
          "print",
          viewTicketOrderId,
          configData,
          employeesDict
        );
        if (!response.success) {
          console.error("Error al imprimir ticket:", response.message);
        }
        setTicketModalVisible(false);
      })();
    }
  }, [ticketModalVisible, viewTicketOrderId, configData, employeesDict]);

  // Añadir la comprobación: si todos los productos están gestionados
  const allProductsManaged =
    stockData.length > 0 && stockData.every((prod) => prod.alreadyManaged);

  // Actualizar el footer del Dialog de gestión de pedido online
  const stockDialogFooter = (
    <div className="flex justify-end w-full">
      {allProductsManaged ? (
        <Button label="Pedido Gestionado" disabled />
      ) : (
        <Button
          label="Guardar y marcar como gestionado"
          icon="pi pi-check"
          onClick={handleUpdateOnlineOrder}
        />
      )}
    </div>
  );

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
          maxWidth: "1300px",
          maxHeight: "850px",
          minWidth: "950px",
          minHeight: "650px",
          width: "60vw",
          height: "70vh",
        }}
      >
        <div className="p-2">
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
                    width: "1px",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
                  }}
                  alignHeader={"center"}
                />

                <Column
                  field="id_order"
                  header="# Pedido"
                  style={{
                    width: "auto",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Fecha"
                  body={(row) => formatDate(row.date_add)}
                  style={{
                    width: "auto",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Cliente"
                  field="customer_name"
                  style={{
                    width: "auto",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Dirección"
                  field="address_delivery_name"
                  style={{
                    width: "auto",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
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
                    width: "auto",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  field="total_paid"
                  header="Total (€)"
                  body={(data) => Number(data.total_paid)?.toFixed(2)}
                  style={{
                    width: "auto",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  header="Estado"
                  field="current_state_name"
                  style={{
                    width: "auto",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
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
                    width: "auto",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
                  }}
                  alignHeader={"center"}
                />
                <Column
                  body={actionBodyTemplate}
                  style={{
                    width: "auto",
                    textAlign: "center",
                    padding: "1rem 0.3rem",
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
                <Column
                  body={(rowData) => (
                    <>
                      <Button
                        icon="pi pi-eye"
                        className="p-button-rounded p-button-text"
                        onClick={() => handleOpenOrder(rowData)}
                      />
                      <Button
                        icon="pi pi-cog"
                        className="p-button-rounded p-button-text"
                        onClick={() => handleOpenStock(rowData)}
                      />
                      <Button
                        icon="pi pi-receipt"
                        className="p-button-rounded p-button-text"
                        onClick={() => handlePrintTicket(rowData)}
                      />
                    </>
                  )}
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
        header="Gestión de pedido online"
        visible={stockModalVisible}
        onHide={() => setStockModalVisible(false)}
        modal
        draggable={false}
        resizable={false}
        footer={stockDialogFooter}
        style={{
          maxWidth: "900px",
          maxHeight: "600px",
          minWidth: "800px",
          minHeight: "550px",
          width: "60vw",
          height: "60vh",
        }}
      >
        <div className="p-2">
          <DataTable
            value={stockData}
            emptyMessage="No hay productos"
            cellSelection
            selectionMode="multiple"
            selection={selectedCells}
            metaKeySelection={false}
            dragSelection
            rowClassName={(rowData) =>
              rowData.alreadyManaged ? "p-disabled" : ""
            }
            onSelectionChange={(e) => {
              const cells = Array.isArray(e.value) ? e.value : [e.value];
              const uniqueCells = [];
              const seenRows = new Set();
              cells.forEach((cell) => {
                if (
                  stockData[cell.rowIndex] &&
                  stockData[cell.rowIndex].alreadyManaged
                )
                  return;
                if (
                  cell.field === "product_name" ||
                  cell.field === "product_quantity"
                )
                  return;
                const rowId = cell.rowIndex;
                if (!seenRows.has(rowId)) {
                  seenRows.add(rowId);
                  uniqueCells.push(cell);
                }
              });
              setSelectedCells(uniqueCells);
            }}
          >
            <Column header="Producto" field="product_name" />
            <Column header="Cantidad" field="product_quantity" />
            {shops.map((shop) => (
              <Column
                key={shop.id_shop}
                header={shop.name}
                field={`${shop.id_shop}`}
                body={(row) => {
                  const value = row[shop.id_shop] || row.product_quantity
                  if (row.alreadyManaged && row.managedShop === shop.id_shop) {
                    return (
                      <span
                        className="p-tag p-tag-info"
                        style={{
                          fontWeight: "bold",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                        }}
                      >
                        {value}
                      </span>
                    );
                  }
                  return '-';
                }}
              />
            ))}
          </DataTable>
        </div>
      </Dialog>

      <ActionResultDialog
        visible={resultDialogVisible}
        onClose={() => setResultDialogVisible(false)}
        success={resultDialogSuccess}
        message={resultDialogMessage}
      />

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
