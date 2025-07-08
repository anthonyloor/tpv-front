import React, { useState, useEffect, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";
import { ConfigContext } from "../../../contexts/ConfigContext";
import generateTicket from "../../../utils/ticket";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";

const ControlStockModal = ({
  isOpen,
  onClose,
  inlineMode = false,
  initialQuery = "",
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const shopsDict = useShopsDictionary();
  const { configData } = useContext(ConfigContext);
  const employeesDict = useEmployeesDictionary();

  const [printOptionModalVisible, setPrintOptionModalVisible] = useState(false);
  const [manualPdfDataUrl, setManualPdfDataUrl] = useState(null);
  const [orderDataForPrint, setOrderDataForPrint] = useState(null);

  useEffect(() => {
    if (isOpen && initialQuery) {
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `${API_BASE_URL}/get_controll_stock?id=${encodeURIComponent(
          query ?? searchQuery
        )}`
      );
      // Si no hay resultados o el objeto está vacío, se limpia la data
      if (!data) {
        setResults(null);
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error("Error en control stock:", error);
      setResults(null);
    }
    setLoading(false);
  };

  const handleTransactionClick = async (rowData) => {
    const type = rowData.type ? rowData.type.toLowerCase() : "";
    const isOrder = type === "venta" || type === "devolución";
    try {
      const origin = await apiFetch(`${API_BASE_URL}/get_transaction_origin`, {
        method: "POST",
        body: JSON.stringify({
          id_transaction_detail: rowData.id_transaction_detail,
          type: isOrder ? "order" : "movement",
        }),
      });
      if (isOrder && origin && origin.id_order) {
        const order = await apiFetch(`${API_BASE_URL}/get_order`, {
          method: "POST",
          body: JSON.stringify({ id_order: origin.id_order, origin: "mayret" }),
        });
        if (order && order.order_details) {
          setOrderDataForPrint(order);
          const response = await generateTicket(
            "print",
            order,
            configData,
            employeesDict
          );
          if (!response.success) {
            if (response.manual) {
              setManualPdfDataUrl(response.pdfDataUrl);
              setPrintOptionModalVisible(true);
            } else {
              console.error("Error al imprimir ticket:", response.message);
            }
          }
        } else {
          console.error("Error al recuperar datos del ticket");
        }
      }
    } catch (err) {
      console.error("Error obteniendo origen de transacción:", err);
    }
  };

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
          console.error("Error al reintentar imprimir ticket:", response.message);
        }
      } catch (err) {
        console.error("Error al reintentar impresión:", err);
      }
    }
  };

  return (
    <>
    <Dialog
      header="Seguimiento de productos"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{
        maxWidth: "50vw",
        maxHeight: "75vh",
        width: "45vw",
        height: "70vh",
      }}
    >
      <div className="p-fluid">
        {/* Región de búsqueda */}
        <div className="p-inputgroup" style={{ marginBottom: "1rem" }}>
          <InputText
            placeholder="Buscar por control stock"
            value={searchQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            icon="pi pi-search"
            label="Buscar"
            onClick={() => handleSearch()}
          />
        </div>
        {/* Visualización de resultados */}
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            {results && (
              <>
                <div className="p-grid" style={{ marginBottom: "1rem" }}>
                  <div className="p-col">
                    <strong>Producto:</strong> {results.product_name || "-"}
                  </div>
                  <div className="p-col">
                    <strong>Seguimiento:</strong> {results.id_control_stock}{" "}
                    <i className="pi pi-link" />
                  </div>
                  <div className="p-col">
                    <strong>Codigo de barras:</strong> {results.ean13}
                  </div>
                  <div className="p-col">
                    <strong>Tienda:</strong> {shopsDict[results.id_shop] || "-"}
                  </div>
                  <div className="p-col">
                    <strong>Fecha creación seguimiento:</strong>{" "}
                    {results.date_add}
                  </div>
                  <div className="p-col">
                    <strong>Activo:</strong> {results.active ? "Sí" : "No"}
                  </div>
                </div>
                {results.history && results.history.length > 0 ? (
                  <DataTable
                    value={results.history}
                    paginator
                    rows={10}
                    className="p-datatable-striped p-datatable-gridlines"
                    emptyMessage="No hay resultados"
                    sortField="id_control_stock_history"
                    responsiveLayout="scroll"
                  >
                    <Column
                      field="date"
                      header="Fecha movimiento"
                      style={{ textAlign: "center" }}
                      alignHeader="center"
                    />
                    <Column
                      body={(rowData) => (
                        <span>
                          {shopsDict[rowData.id_shop] || "Tienda no encontrada"}
                        </span>
                      )}
                      header="Tienda"
                      style={{ textAlign: "center" }}
                      alignHeader="center"
                    />
                    <Column
                      field="reason"
                      header="Movimiento"
                      style={{ textAlign: "left" }}
                      alignHeader="left"
                    />
                    <Column
                      field="type"
                      header="Tipo"
                      style={{ textAlign: "center" }}
                      alignHeader="center"
                    />
                    <Column
                      field="id_transaction_detail"
                      header="ID Transacción"
                      style={{ textAlign: "center", cursor: "pointer" }}
                      alignHeader="center"
                      body={(rowData) => {
                        const type = rowData.type ? rowData.type.toLowerCase() : "";
                        const icons = [];
                        if (type === "venta") {
                          icons.push(<i key="print" className="pi pi-print mr-1" />);
                        } else if (type === "devolución") {
                          icons.push(<i key="print" className="pi pi-print mr-1" />);
                          icons.push(<i key="undo" className="pi pi-undo mr-1" />);
                        } else if (type === "entrada") {
                          icons.push(<i key="in" className="pi pi-download mr-1" />);
                        } else if (type === "salida") {
                          icons.push(<i key="out" className="pi pi-upload mr-1" />);
                        } else if (type === "traspaso") {
                          icons.push(
                            <i key="move" className="pi pi-arrow-right-arrow-left mr-1" />
                          );
                        }
                        return (
                          <span onClick={() => handleTransactionClick(rowData)}>
                            {icons} {rowData.id_transaction_detail}
                          </span>
                        );
                      }}
                    />
                  </DataTable>
                ) : (
                  <p>Sin seguimiento.</p>
                )}
              </>
            )}
          </>
        )}
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

export default ControlStockModal;
