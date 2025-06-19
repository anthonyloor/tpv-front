import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
import { Toast } from "primereact/toast";
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
  const { employeeId, shopId } = useContext(AuthContext);
  const [resultDialogVisible, setResultDialogVisible] = useState(false);
  const [resultDialogMessage, setResultDialogMessage] = useState("");
  const [resultDialogSuccess, setResultDialogSuccess] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [viewTicketOrderId, setViewTicketOrderId] = useState(null);
  const { configData } = useContext(ConfigContext);
  const employeesDict = useEmployeesDictionary();
  const { selectedClient } = useContext(ClientContext);
  const toast = useRef(null);

  const [controlStockModalVisible, setControlStockModalVisible] =
    useState(false);
  const [controlStockData, setControlStockData] = useState([]);
  const [controlStockShopName, setControlStockShopName] = useState("");
  const [selectedControlStock, setSelectedControlStock] = useState(null);
  const [updatedStockSelections, setUpdatedStockSelections] = useState({});
  const [currentCell, setCurrentCell] = useState(null);

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
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar los pedidos online.",
      });
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

  const handleOpenControlStock = (stockRecord, rowIndex, shopId) => {
    setCurrentCell({ rowIndex, shopId, stockRecord });
    setControlStockData(stockRecord.control_stock || []);
    setControlStockShopName(stockRecord.shop_name);
    setControlStockModalVisible(true);
  };

  const handleConfirmControlStock = () => {
    if (currentCell && selectedControlStock) {
      const key = `${currentCell.rowIndex}-${currentCell.shopId}`;
      setUpdatedStockSelections((prev) => ({
        ...prev,
        [key]: selectedControlStock,
      }));
    }
    setControlStockModalVisible(false);
    setSelectedControlStock(null);
    setCurrentCell(null);
  };

  const handleOpenStock = async (order) => {
    console.log("handleOpenStock", order);
    setSelectedOrderForStock(order);

    const movements = await apiFetch(
      `${API_BASE_URL}/get_warehouse_movements`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );
    const relevantMovements = Array.isArray(movements)
      ? movements.filter(
          (mov) =>
            mov.description && mov.description.includes(`#${order.id_order}`)
        )
      : [];
    console.log("Movimientos relevantes:", relevantMovements);

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
        if (managedMapping[detail.product_ean13]) {
          return {
            product_name: detail.product_name,
            id_product: detail.product_id,
            id_order_detail: detail.id_order_detail,
            id_product_attribute: detail.product_attribute_id,
            product_quantity: detail.product_quantity,
            product_ean13: detail.product_ean13,
            alreadyManaged: true,
            managedShop: managedMapping[detail.product_ean13],
          };
        }
        let ean = detail.product_ean13;
        const groups = await stockSearch.handleSearch(ean, true);
        let stocks = [];
        if (groups && groups.length > 0) {
          stocks = groups[0].combinations[0]?.stocks || [];
        }
        return {
          product_name: detail.product_name,
          id_product: detail.product_id,
          id_product_attribute: detail.product_attribute_id,
          product_quantity: detail.product_quantity,
          product_ean13: detail.product_ean13,
          stocks,
        };
      })
    );
    setStockData(productsStockData);
    setStockModalVisible(true);
  };

  const handleUpdateOnlineOrder = async () => {
    if (!selectedOrderForStock) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No hay un pedido seleccionado para gestionar.",
      });
      return;
    }

    const shopsMap = {};
    Object.entries(updatedStockSelections).forEach(([key, controlStock]) => {
      const [rowIndexStr, shopIdStr] = key.split("-");
      const shopId = Number(shopIdStr);
      const rowIndex = Number(rowIndexStr);
      const row = stockData[rowIndex];
      if (!row) return;
      if (!shopsMap[shopId]) {
        shopsMap[shopId] = { id_shop: shopId, products: [] };
      }
      const qty = row.product_quantity;
      const detail = selectedOrderForStock.order_details.find(
        (d) => d.product_ean13 === row.product_ean13
      );
      if (detail) {
        shopsMap[shopId].products.push({
          ean13: detail.product_ean13,
          id_control_stock: controlStock.id_control_stock,
          id_order_detail: detail.id_order_detail,
          quantity: qty,
          id_product: detail.product_id,
          id_product_attribute: detail.product_attribute_id,
          product_name: detail.product_name,
        });
      }
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
      num_pedido: "",
      identificador_rts: "",
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
        setUpdatedStockSelections({});
        setStockData([]);
        setSelectedOrderForStock(null);
        setSelectedControlStock(null);
        setCurrentCell(null);
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

  // Agregar nuevos estados para impresión manual
  const [orderDataForPrint, setOrderDataForPrint] = useState(null);
  const [manualPdfDataUrl, setManualPdfDataUrl] = useState(null);
  const [printOptionModalVisible, setPrintOptionModalVisible] = useState(false);

  // Modificar useEffect para imprimir ticket con opción manual
  useEffect(() => {
    if (ticketModalVisible && viewTicketOrderId) {
      (async () => {
        try {
          const data = await apiFetch(`${API_BASE_URL}/get_order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_order: viewTicketOrderId.id_order,
              origin: viewTicketOrderId.origin,
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
              employeesDict
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
        } catch (error) {
          console.error("Error en la consulta get_order para ticket:", error);
        } finally {
          setTicketModalVisible(false);
          setViewTicketOrderId(null);
        }
      })();
    }
  }, [
    ticketModalVisible,
    viewTicketOrderId,
    configData,
    employeesDict,
    apiFetch,
    API_BASE_URL,
  ]);

  // Añadir funciones para impresión manual y reintento
  const handleManualPrint = () => {
    if (manualPdfDataUrl) {
      const printWindow = window.open("", "_blank");
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
          employeesDict
        );
        if (response.success) {
          console.log("Reimpresión remota exitosa");
          setPrintOptionModalVisible(false);
        } else if (response.manual) {
          setManualPdfDataUrl(response.pdfDataUrl);
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

  const allProductsManaged =
    stockData.length > 0 && stockData.every((prod) => prod.alreadyManaged);

  const allProductsSelected =
    stockData.length > 0 &&
    stockData.every(
      (product, index) =>
        product.alreadyManaged ||
        Object.keys(updatedStockSelections).some((key) =>
          key.startsWith(`${index}-`)
        )
    );

  const stockDialogFooter = (
    <div className="flex justify-end w-full">
      {allProductsManaged ? (
        <Button label="Pedido Gestionado" disabled />
      ) : (
        <Button
          label="Guardar y marcar como gestionado"
          icon="pi pi-check"
          onClick={handleUpdateOnlineOrder}
          disabled={!allProductsSelected}
        />
      )}
    </div>
  );

  return (
    <>
      <Toast ref={toast} position="top-center" />
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
            rowClassName={(rowData) =>
              rowData.alreadyManaged ? "p-disabled" : ""
            }
          >
            <Column
              header="Producto"
              field="product_name"
              body={(row) => (
                <span style={{ pointerEvents: "none" }}>
                  {row.product_name}
                </span>
              )}
            />
            <Column
              header="Cantidad"
              field="product_quantity"
              body={(row) => (
                <span style={{ pointerEvents: "none" }}>
                  {row.product_quantity}
                </span>
              )}
            />
            {shops.map((shop) => (
              <Column
                key={shop.id_shop}
                header={shop.name}
                field={`${shop.id_shop}`}
                body={(row) => {
                  const rowIndex = stockData.indexOf(row);
                  const cellKey = `${rowIndex}-${shop.id_shop}`;
                  const rowSelected = Object.keys(updatedStockSelections).some(
                    (key) => key.startsWith(`${rowIndex}-`)
                  );
                  if (row.alreadyManaged && row.managedShop === shop.id_shop) {
                    return (
                      <span
                        className="p-tag p-tag-success"
                        style={{
                          fontWeight: "bold",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                        }}
                      >
                        {row.product_quantity}
                      </span>
                    );
                  } else if (row.alreadyManaged) {
                    return "-";
                  }
                  const stockRecord = row.stocks
                    ? row.stocks.find((s) => s.id_shop === shop.id_shop)
                    : null;
                  if (!stockRecord) {
                    return "-";
                  }
                  if (updatedStockSelections[cellKey]) {
                    return (
                      <span
                        className="p-tag p-tag-info"
                        style={{
                          fontWeight: "bold",
                          cursor: "default",
                        }}
                      >
                        {row.product_quantity}
                      </span>
                    );
                  }
                  if (rowSelected) {
                    return (
                      <span style={{ color: "grey" }}>
                        {stockRecord.quantity}
                      </span>
                    );
                  }
                  return (
                    <span
                      style={{
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      onClick={() =>
                        handleOpenControlStock(
                          stockRecord,
                          rowIndex,
                          shop.id_shop
                        )
                      }
                    >
                      {stockRecord.quantity}
                    </span>
                  );
                }}
              />
            ))}
          </DataTable>
        </div>
      </Dialog>

      <Dialog
        header={`Control Stock de ${controlStockShopName}`}
        visible={controlStockModalVisible}
        onHide={() => setControlStockModalVisible(false)}
        modal
        footer={
          <div className="flex justify-end w-full">
            <Button
              label="Aceptar"
              onClick={handleConfirmControlStock}
              disabled={!selectedControlStock}
            />
          </div>
        }
      >
        <div>
          <DataTable
            value={[
              ...(controlStockData && controlStockData.length > 0
                ? controlStockData
                : []),
              { id_control_stock: null, active_control_stock: false },
            ]}
            selectionMode="single"
            selection={selectedControlStock}
            onSelectionChange={(e) => setSelectedControlStock(e.value)}
            dataKey="id_control_stock"
          >
            <Column
              field="id_control_stock"
              header="ID Control Stock"
              body={(row) =>
                row.id_control_stock === null
                  ? "Sin seguimiento"
                  : row.id_control_stock
              }
            />
            <Column
              field="active_control_stock"
              header="Activo"
              body={(row) =>
                row.id_control_stock === null
                  ? "No"
                  : row.active_control_stock
                  ? "Sí"
                  : "No"
              }
            />
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

      <Dialog
        header="Error de impresión"
        visible={printOptionModalVisible}
        onHide={() => setPrintOptionModalVisible(false)}
        modal
        draggable={false}
        resizable={false}
        style={{ marginBottom: "150px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

export default OnlineOrdersModal;
