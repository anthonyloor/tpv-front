// src/components/ProductSearch/ProductSearchCard.jsx

import React, { useState, useContext, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { AuthContext } from "../../contexts/AuthContext";
import { useApiFetch } from "../../utils/useApiFetch";
import { ConfigContext } from "../../contexts/ConfigContext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import useProductSearch from "../../hooks/useProductSearch";
import { CartContext } from "../../contexts/CartContext";
import { ClientContext } from "../../contexts/ClientContext";

const ProductSearchCard = ({ onAddProduct, onAddDiscount, onClickProduct }) => {
  const { setIsDevolution } = useContext(CartContext);
  const { selectedClient } = useContext(ClientContext);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const { configData } = useContext(ConfigContext);
  const { shopId, idProfile } = useContext(AuthContext);
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
    foreignConfirmDialogOpen,
    foreignProductCandidate,
    handleForeignConfirmAdd,
    handleForeignCancelAdd,
    soldLabelConfirmDialogOpen,
    handleSoldLabelConfirmAdd,
    handleSoldLabelCancelAdd,
  } = useProductSearch({
    apiFetch,
    shopId,
    allowOutOfStockSales,
    onAddProduct: handleAddProductWrapper,
    onAddDiscount,
    idProfile,
    selectedClient,
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

  // Aplanamos y ordenamos los grupos para el DataTable
  const flatProducts = groupedProducts
    .reduce((acc, group) => {
      const combos = group.combinations.map((combo) => ({
        ...combo,
        product_name: group.product_name,
      }));
      return acc.concat(combos);
    }, [])
    .sort((a, b) => a.product_name.localeCompare(b.product_name));

  // Nuevo mapeo para definir el grupo (sin seguimiento vs con seguimiento)
  const productsWithGroup = flatProducts
    .map((product) => ({
      ...product,
      group: product.id_control_stock
        ? "Productos con seguimiento"
        : "Productos sin seguimiento",
    }))
    .sort((a, b) => a.group.localeCompare(b.group));

  // Agrupar TODOS los productos (con y sin seguimiento) por clave única
  const finalProducts = productsWithGroup
    .reduce((unique, item) => {
      const key = `${item.id_product}_${item.id_product_attribute}_${
        item.id_stock_available || ""
      }`;
      if (!unique.some((u) => u.uniqueKey === key)) {
        // Contar los registros con id_control_stock para la misma clave
        const trackingCount = productsWithGroup.filter((p) => {
          const pKey = `${p.id_product}_${p.id_product_attribute}_${
            p.id_stock_available || ""
          }`;
          return pKey === key && p.id_control_stock;
        }).length;
        const { id_control_stock, active_control_stock, ...rest } = item;
        unique.push({ ...rest, uniqueKey: key, trackingCount });
      }
      return unique;
    }, [])
    .map(({ uniqueKey, ...rest }) => rest);

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

      {/* Tabla de productos */}
      <div className="flex-1 overflow-auto">
        <DataTable
          value={finalProducts}
          selectionMode="single"
          selection={selectedProduct}
          onSelectionChange={(e) => {
            setSelectedProduct(e.value);
            if (onClickProduct) onClickProduct(e.value);
          }}
          onRowSelect={onRowSelect}
          dataKey="id_product_attribute"
          scrollable
          tableStyle={{ width: "100%" }}
        >
          <Column
            selectionMode="single"
            style={{
              width: "1px",
              textAlign: "center",
              padding: "1rem 0.3rem",
            }}
            alignHeader={"center"}
          />
          <Column
            header="Referencia"
            body={(rowData) => rowData.reference_combination}
            style={{
              width: "100px",
              textAlign: "center",
              padding: "1rem 0.3rem",
            }}
            alignHeader={"center"}
          />
          <Column
            header="Combinación"
            body={(rowData) =>
              rowData.combination_name && rowData.combination_name !== ""
                ? rowData.combination_name
                : rowData.product_name
            }
            style={{
              width: "100px",
              textAlign: "center",
              padding: "1rem 0.3rem",
            }}
            alignHeader={"center"}
          />
          <Column
            header="Precio"
            body={(rowData) =>
              rowData.price ? rowData.price.toFixed(2) + " €" : ""
            }
            style={{
              width: "50px",
              textAlign: "center",
              padding: "1rem 0.3rem",
            }}
            alignHeader={"center"}
          />
          <Column
            header="Cod. Barras"
            body={(rowData) =>
              rowData.ean13_combination || rowData.ean13_combination_0 || ""
            }
            style={{
              width: "100px",
              textAlign: "center",
              padding: "1rem 0.3rem",
            }}
            alignHeader={"center"}
          />
          <Column
            header="Cantidad"
            body={(rowData) => (
              <>
                {rowData.quantity}
                {Number(rowData.trackingCount) > 0
                  ? ` | ${rowData.trackingCount} `
                  : ""}
                {Number(rowData.trackingCount) > 0 && (
                  <i className="pi pi-link"></i>
                )}
              </>
            )}
            style={{
              width: "50px",
              textAlign: "center",
              padding: "1rem 0.3rem",
            }}
            alignHeader={"center"}
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

      {/* Nuevo Dialog para confirmar venta de producto de otra tienda */}
      <Dialog
        header="Confirmar venta en otra tienda"
        visible={foreignConfirmDialogOpen}
        onHide={handleForeignCancelAdd}
        modal
        closable={false}
        draggable={false}
        resizable={false}
        style={{ width: "20vw", backgroundColor: "var(--surface-0)" }}
      >
        <div className="p-2" style={{ color: "var(--text-color)" }}>
          <p>
            El producto pertenece a la tienda {foreignProductCandidate?.id_shop}
            . ¿Deseas venderlo?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              label="No"
              className="p-button-danger"
              onClick={handleForeignCancelAdd}
            />
            <Button
              label="Sí"
              className="p-button-success"
              onClick={handleForeignConfirmAdd}
            />
          </div>
        </div>
      </Dialog>

      {/* Nuevo Dialog para confirmar venta de producto con etiqueta ya vendida */}
      <Dialog
        header="Producto con etiqueta ya vendida"
        visible={soldLabelConfirmDialogOpen}
        onHide={handleSoldLabelCancelAdd}
        modal
        closable={false}
        draggable={false}
        resizable={false}
        style={{ width: "20vw", backgroundColor: "var(--surface-0)" }}
      >
        <div className="p-2" style={{ color: "var(--text-color)" }}>
          <p>Producto con etiqueta ya vendida. ¿Deseas venderlo?</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              label="No"
              className="p-button-danger"
              onClick={handleSoldLabelCancelAdd}
            />
            <Button
              label="Sí"
              className="p-button-success"
              onClick={handleSoldLabelConfirmAdd}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ProductSearchCard;
