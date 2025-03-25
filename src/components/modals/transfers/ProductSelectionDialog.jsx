import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { useApiFetch } from "../../../utils/useApiFetch";

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
  // Nuevo estado para celdas seleccionadas en la columna Cod. Barras
  const [selectedBarcodeItems, setSelectedBarcodeItems] = useState([]);
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

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

  // Cuerpo para columnas estándares
  const productNameBodyTemplate = (rowData) =>
    `${rowData.product_name} ${rowData.combination_name}`;

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
    <Dialog
      header="Seleccionar Producto"
      visible={visible}
      onHide={onHide}
      modal
      draggable={false}
      resizable={false}
      style={{
        width: "70vw",
        maxWidth: "900px",
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
      footer={renderFooter()}
    >
      <div className="overflow-auto" style={{ maxHeight: "65vh" }}>
        <DataTable
          value={products}
          responsiveLayout="scroll"
          emptyMessage="No hay productos para mostrar."
          style={{
            backgroundColor: "var(--surface-0)",
            color: "var(--text-color)",
          }}
        >
          <Column
            body={selectionBodyTemplate}
            style={{ textAlign: "center", width: "80px" }}
          />
          <Column header="Producto" body={productNameBodyTemplate} />
          {/* Se reemplaza la columna "EAN13" por "Cod. Barras" usando la función barcodeBodyTemplate */}
          <Column header="Cod. Barras" body={barcodeBodyTemplate} />
          {showOriginStock && (
            <Column
              header={`Stock ${originShopName}`}
              body={(rowData) => rowData.stockOrigin ?? 0}
            />
          )}
          {showDestinationStock && (
            <Column
              header={`Stock ${destinationShopName}`}
              body={(rowData) => rowData.stockDestination ?? 0}
            />
          )}
        </DataTable>
      </div>
    </Dialog>
  );
};

export default ProductSelectionDialog;
