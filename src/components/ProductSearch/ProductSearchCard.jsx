// src/components/ProductSearch/ProductSearchCard.jsx

import React, { useState, useContext, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { AuthContext } from "../../contexts/AuthContext";
import { useApiFetch } from "../utils/useApiFetch";
import { ConfigContext } from "../../contexts/ConfigContext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import useProductSearch from "../../hooks/useProductSearch";
import { CartContext } from "../../contexts/CartContext";

const ProductSearchCard = ({ onAddProduct, onAddDiscount, onClickProduct }) => {
  const { setIsDevolution } = useContext(CartContext);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const { configData } = useContext(ConfigContext);
  const { shopId, shopName } = useContext(AuthContext);
  const allowOutOfStockSales = configData?.allow_out_of_stock_sales || false;
  const apiFetch = useApiFetch();

  // Función wrapper: al añadir producto, marcar isDevolution a false
  const handleAddProductWrapper = (
    product,
    stockQuantity,
    exceedsStockCallback,
    forceAdd = false,
    quantity = 1
  ) => {
    onAddProduct(
      product,
      stockQuantity,
      exceedsStockCallback,
      forceAdd,
      quantity
    );
  };

  const {
    groupedProducts,
    isLoading,
    confirmModalOpen,
    productToConfirm,
    handleSearch,
    addProductToCart,
    handleCancelAdd,
    handleConfirmAdd,
  } = useProductSearch({
    apiFetch,
    shopId,
    allowOutOfStockSales,
    onAddProduct: handleAddProductWrapper,
    onAddDiscount,
  });

  useEffect(() => {
    if (searchTerm === "" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTerm]);

  // Si existe algún modal abierto, se fuerza el foco en el input
  const isAnyModalOpen = () =>
    document.querySelector('[role="dialog"]') !== null;

  const handleContainerClick = () => {
    if (!isAnyModalOpen() && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleInputBlur = () => {
    if (!isAnyModalOpen() && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const onRowSelect = (e) => {
    if (onClickProduct) onClickProduct(e.data);
  };

  // Plantillas para las columnas del DataTable
  const combinationBodyTemplate = (rowData) => rowData.combination_name;
  const referenceBodyTemplate = (rowData) => rowData.reference_combination;
  const eanBodyTemplate = (rowData) => rowData.ean13_combination;
  const priceBodyTemplate = (rowData) => rowData.price.toFixed(2) + " €";
  const quantityBodyTemplate = (rowData) => rowData.quantity;

  const groupHeaderTemplate = (groupValue) => (
    <div
      className="p-2 font-bold"
      style={{
        backgroundColor: "var(--surface-100)",
        borderBottom: "1px solid var(--surface-border)",
      }}
    >
      {groupValue}
    </div>
  );

  // Aplanamos los grupos para el DataTable
  const flatProducts = groupedProducts.reduce((acc, group) => {
    const combos = group.combinations.map((combo) => ({
      ...combo,
      product_name: group.product_name,
    }));
    return acc.concat(combos);
  }, []);

  const handleKeyDown = async (event) => {
    if (event.key !== "Enter") return;
    await handleSearch(searchTerm);
    setSearchTerm("");
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  // Nueva plantilla para el ícono en la primera columna
  const selectionBodyTemplate = (rowData) => {
    const isSelected =
      selectedProduct &&
      selectedProduct.id_product_attribute === rowData.id_product_attribute;
    return (
      <span
        className={
          isSelected
            ? "pi pi-check-circle text-green-500"
            : "pi pi-circle text-gray-500"
        }
      ></span>
    );
  };

  return (
    <div
      className="p-3 h-full flex flex-col"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
      onClick={handleContainerClick}
    >
      {/* Fila de búsqueda */}
      <div className="mb-4 flex items-center">
        <span className="p-input-icon-left w-full">
          <div className="p-input-icon-left">
            <i
              className="pi pi-search absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-secondary)" }}
            />
          </div>
          <InputText
            ref={searchInputRef}
            placeholder="Buscar por referencia o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            disabled={isLoading}
            className="w-full pl-9 pr-9"
            style={{
              borderColor: "var(--surface-border)",
              backgroundColor: "var(--surface-50)",
              color: "var(--text-color)",
            }}
            autoFocus
          />
        </span>
      </div>

      {/* Tabla de productos agrupados */}
      <div className="flex-1 overflow-auto">
        <DataTable
          value={flatProducts}
          groupField="product_name"
          rowGroupMode="subheader"
          groupRowTemplate={groupHeaderTemplate}
          selectionMode="single"
          onSelectionChange={(e) => {
            setSelectedProduct(e.value);
            if (onClickProduct) onClickProduct(e.value);
          }}
          onRowSelect={onRowSelect}
          dataKey="id_product_attribute"
          scrollable
        >
          <Column
            header=""
            body={selectionBodyTemplate}
            style={{ width: "2rem", textAlign: "center" }}
          />

          <Column
            field="combination_name"
            header="Combinación"
            body={combinationBodyTemplate}
          />
          <Column
            field="reference_combination"
            header="Referencia"
            body={referenceBodyTemplate}
          />
          <Column
            field="ean13_combination"
            header="Cod. Barras"
            body={eanBodyTemplate}
          />
          <Column field="price" header="Precio" body={priceBodyTemplate} />
          <Column
            field="quantity"
            header="Cantidad"
            body={quantityBodyTemplate}
          />
        </DataTable>
      </div>

      {/* Modal de confirmación para venta sin stock */}
      <Dialog
        header="Máximo de unidades"
        visible={confirmModalOpen}
        onHide={handleCancelAdd}
        modal
        closable={false}
        draggable={false}
        resizable={false}
        style={{ width: "20vw", backgroundColor: "var(--surface-0)" }}
      >
        <div className="p-2" style={{ color: "var(--text-color)" }}>
          <p>¿Deseas vender sin stock?</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              label="No"
              className="p-button-danger"
              onClick={handleCancelAdd}
            />
            <Button
              label="Sí"
              className="p-button-success"
              onClick={handleConfirmAdd}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ProductSearchCard;
