import React, { useState, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { useApiFetch } from "../../../utils/useApiFetch";
import { OverlayPanel } from "primereact/overlaypanel";

/**
 * Componente para mostrar un diálogo (PrimeReact) con la lista de productos
 * y permitir su selección.
 *
 * @param {boolean} visible        - Controla si se muestra el diálogo.
 * @param {function} onHide        - Función para cerrar el diálogo.
 * @param {Array} products         - Lista de productos transformados (stockOrigin, stockDestination).
 * @param {function} onSelectProducts - Callback para añadir los productos seleccionados.
 * @param {string} originShopName
 * @param {string} destinationShopName
 * @param {string} type            - 'traspaso', 'entrada' o 'salida'
 */
const ProductSelectionDialog = ({
  visible,
  onHide,
  products,
  onSelectProducts,
  originShopName = "Origen",
  destinationShopName = "Destino",
  type = "traspaso", // 'traspaso' | 'entrada' | 'salida'
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedBarcodeItems, setSelectedBarcodeItems] = useState([]);
  // Nuevo estado y ref para mostrar el OverlayPanel del control stock
  const [currentControlStock, setCurrentControlStock] = useState([]);
  const overlayPanelRef = useRef(null);

  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

  // Limpiar el modal al mostrarse
  useEffect(() => {
    if (visible) {
      setSelectedItems([]);
      setSelectedBarcodeItems([]);
    }
  }, [visible]);

  // Al hacer check
  const handleCheckboxChange = (product) => {
    setSelectedItems((prev) => {
      const found = prev.find(
        (p) =>
          p.id_product === product.id_product &&
          p.id_product_attribute === product.id_product_attribute
      );
      if (found) {
        // Quitar
        return prev.filter(
          (p) =>
            !(
              p.id_product === product.id_product &&
              p.id_product_attribute === product.id_product_attribute
            )
        );
      } else {
        // Agregar
        return [...prev, product];
      }
    });
  };

  const isSelected = (product) =>
    !!selectedItems.find(
      (p) =>
        p.id_product === product.id_product &&
        p.id_product_attribute === product.id_product_attribute
    );

  // Nuevas funciones para manejar la selección en la columna Cod. Barras
  const handleBarcodeClick = (product) => {
    setSelectedBarcodeItems((prev) => {
      const exists = prev.find(
        (p) =>
          p.id_product === product.id_product &&
          p.id_product_attribute === product.id_product_attribute
      );
      if (exists) {
        return prev.filter(
          (p) =>
            !(
              p.id_product === product.id_product &&
              p.id_product_attribute === product.id_product_attribute
            )
        );
      } else {
        return [...prev, product];
      }
    });
  };

  const isBarcodeSelected = (product) =>
    !!selectedBarcodeItems.find(
      (p) =>
        p.id_product === product.id_product &&
        p.id_product_attribute === product.id_product_attribute
    );

  // Función para llamar a /generate_ean13 con datos de las celdas seleccionadas
  const handleGenerateBarcode = async () => {
    const payload = {
      products: selectedBarcodeItems.map((p) => ({
        id_product: p.id_product,
        id_product_attribute: p.id_product_attribute,
      })),
    };
    try {
      const response = await apiFetch(`${API_BASE_URL}/generate_ean13`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (response && !response.error) {
        setSelectedBarcodeItems([]);
        onHide();
      } else {
        alert("Error al generar código de barras.");
      }
    } catch (error) {
      alert("Error al generar código de barras.");
    }
  };

  // Función para mostrar el OverlayPanel con el listado de control_stock
  const handleShowControlStock = (event, controlData) => {
    setCurrentControlStock(controlData);
    overlayPanelRef.current.toggle(event);
  };

  // Mostrar columnas según el tipo
  const showOriginStock = type === "salida" || type === "traspaso";
  const showDestinationStock = type === "entrada" || type === "traspaso";

  // Al pulsar "Añadir" en el footer
  const handleConfirm = () => {
    if (selectedItems.length === 0) {
      alert("No has seleccionado ningún producto.");
      return;
    }
    onSelectProducts(selectedItems);
    setSelectedItems([]);
  };

  // Footer del diálogo adaptado a PrimeReact, se agrega botón "Generar codigo de barras" si hay selección en la columna
  const renderFooter = () => {
    return (
      <div className="flex justify-end gap-2">
        <Button
          label="Cancelar"
          className="p-button-text"
          onClick={() => {
            setSelectedItems([]);
            setSelectedBarcodeItems([]);
            onHide();
          }}
        />
        {selectedBarcodeItems.length > 0 && (
          <Button
            label="Generar codigo de barras"
            className="p-button-warning"
            onClick={handleGenerateBarcode}
          />
        )}
        <Button
          label="Añadir"
          className="p-button-primary"
          onClick={handleConfirm}
        />
      </div>
    );
  };

  // Función para renderizar la columna de selección (Checkbox) modificada para permitir selección múltiple en todos los registros
  const selectionBodyTemplate = (rowData) => {
    return (
      <Checkbox
        checked={isSelected(rowData)}
        onChange={() => handleCheckboxChange(rowData)}
      />
    );
  };

  // Se modifica la función para renderizar el código de barras, haciéndola clickable
  const barcodeBodyTemplate = (rowData) => {
    return (
      <div
        onClick={() => handleBarcodeClick(rowData)}
        style={{
          cursor: "pointer",
          backgroundColor: isBarcodeSelected(rowData) ? "#c8e6c9" : "inherit",
        }}
      >
        {rowData.ean13 === "" ? (
          <>
            <i className="pi pi-refresh"></i> <i className="pi pi-barcode"></i>
          </>
        ) : rowData.id_control_stock ? (
          `${rowData.ean13} - ${rowData.id_control_stock}`
        ) : (
          rowData.ean13
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog
        header="Seleccionar Producto"
        visible={visible}
        onHide={onHide}
        modal
        draggable={false}
        resizable={false}
        style={{
          maxWidth: "70vw",
          maxHeight: "85vh",
          width: "45vw",
          height: "80vh",
        }}
        footer={renderFooter()}
      >
        <div className="overflow-auto" style={{ maxHeight: "65vh" }}>
          <DataTable
            value={products}
            responsiveLayout="scroll"
            emptyMessage="No hay productos para mostrar."
            dataKey="uniqueKey"
            style={{
              backgroundColor: "var(--surface-0)",
              color: "var(--text-color)",
            }}
          >
            <Column
              body={selectionBodyTemplate}
              style={{ textAlign: "center", width: "80px" }}
            />
            <Column header="Producto" field="product_name" />
            {/* Columna para Cod. Barras */}
            <Column header="Cod. Barras" body={barcodeBodyTemplate} />
            {showOriginStock && (
              <Column
                header={`Stock ${originShopName}`}
                body={(rowData) => (
                  <>
                    {rowData.stockOrigin ?? 0}
                    {Number(rowData.originTrackingCount) > 0
                      ? ` | ${rowData.originTrackingCount} `
                      : ""}
                    {rowData.originControlStock &&
                      rowData.originControlStock.length > 0 && (
                        <Button
                          icon="pi pi-link"
                          className="p-button-text p-button-sm"
                          onClick={(e) =>
                            handleShowControlStock(
                              e,
                              rowData.originControlStock
                            )
                          }
                        />
                      )}
                  </>
                )}
              />
            )}
            {showDestinationStock && (
              <Column
                header={`Stock ${destinationShopName}`}
                body={(rowData) => (
                  <>
                    {rowData.stockDestination ?? 0}
                    {Number(rowData.destinationTrackingCount) > 0
                      ? ` | ${rowData.destinationTrackingCount} `
                      : ""}
                    {rowData.destinationControlStock &&
                      rowData.destinationControlStock.length > 0 && (
                        <Button
                          icon="pi pi-link"
                          className="p-button-text p-button-sm"
                          onClick={(e) =>
                            handleShowControlStock(
                              e,
                              rowData.destinationControlStock
                            )
                          }
                        />
                      )}
                  </>
                )}
              />
            )}
          </DataTable>
        </div>
      </Dialog>
      <OverlayPanel ref={overlayPanelRef}>
        {currentControlStock.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex items-center">
              {item.id_control_stock}
              <i className="pi pi-link" style={{ marginLeft: "0.5rem" }}></i>
            </span>
            <i
              className={`pi ${
                item.active_control_stock ? "pi-check" : "pi-times"
              }`}
              style={{ color: item.active_control_stock ? "green" : "red" }}
            ></i>
          </div>
        ))}
      </OverlayPanel>
    </>
  );
};

export default ProductSelectionDialog;
