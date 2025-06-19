// src/components/ProductSearch/ProductSearchCard.jsx

import React, { useState, useContext, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { AuthContext } from "../../contexts/AuthContext";
import { useApiFetch } from "../../utils/useApiFetch";
import { Divider } from "primereact/divider";
import { ConfigContext } from "../../contexts/ConfigContext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import useProductSearch from "../../hooks/useProductSearch";
import { CartContext } from "../../contexts/CartContext";
import { ClientContext } from "../../contexts/ClientContext";
import { OverlayPanel } from "primereact/overlaypanel";
import { Toast } from "primereact/toast";

const ProductSearchCard = ({
  onAddProduct,
  onAddDiscount,
  onClickProduct,
  disableAutoFocus = false,
}) => {
  const { setIsDevolution } = useContext(CartContext);
  const { selectedClient } = useContext(ClientContext);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [trackingList, setTrackingList] = useState([]);
  const overlayPanelRef = useRef(null);

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

  const ean13Regex = /^\d{13}$/;

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
    toast,
  } = useProductSearch({
    apiFetch,
    shopId: ean13Regex.test(searchTerm) ? shopId : "all",
    allowOutOfStockSales,
    onAddProduct: handleAddProductWrapper,
    onAddDiscount,
    idProfile,
    selectedClient,
  });

  useEffect(() => {
    if (!disableAutoFocus && searchTerm === "" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTerm, disableAutoFocus]);

  // Si existe algún modal abierto, se fuerza el foco en el input
  const isAnyModalOpen = () =>
    document.querySelector('[role="dialog"]') !== null;

  const handleContainerClick = () => {
    if (
      !disableAutoFocus &&
      !isAnyModalOpen() &&
      searchInputRef.current
    ) {
      searchInputRef.current.focus();
    }
  };

  const handleInputBlur = () => {
    if (
      !disableAutoFocus &&
      !isAnyModalOpen() &&
      searchInputRef.current
    ) {
      searchInputRef.current.focus();
    }
  };

  const onRowSelect = (e) => {
    if (onClickProduct) onClickProduct(e.data);
  };

  // Aplanamos y ordenamos los grupos para el DataTable
  const flatProducts = groupedProducts
    .reduce((acc, group) => {
      const combos = group.combinations.map((combo) => {
        const {
          active_control_stock,
          id_control_stock,
          id_shop,
          id_stock_available,
          quantity,
          shop_name,
          ...rest
        } = combo;
        return {
          ...rest,
          product_name: group.product_name,
        };
      });
      return acc.concat(combos);
    }, [])
    .sort((a, b) => a.product_name.localeCompare(b.product_name));

  // Nuevo mapeo para definir el grupo (sin seguimiento vs con seguimiento)
  const finalProducts = flatProducts
    .map((product) => {
      const currentStock = product.stocks
        ? product.stocks.find(
            (stock) => Number(stock.id_shop) === Number(shopId)
          )
        : null;
      const hasTracking =
        currentStock &&
        currentStock.control_stock &&
        currentStock.control_stock.length > 0;
      const trackingCount = hasTracking
        ? currentStock.control_stock.filter((cs) => cs.active_control_stock)
            .length
        : 0;
      return {
        ...product,
        group: hasTracking
          ? "Productos con seguimiento"
          : "Productos sin seguimiento",
        trackingCount,
        // Usar el id_stock_available del stock actual y agregar la lista de control_stock
        id_stock_available: currentStock
          ? currentStock.id_stock_available
          : product.id_stock_available,
        controlStockList: hasTracking ? currentStock.control_stock : [],
      };
    })
    .sort((a, b) => a.group.localeCompare(b.group));

  const handleKeyDown = async (event) => {
    if (event.key !== "Enter") return;
    await handleSearch(searchTerm);
    setSearchTerm("");
    setTimeout(() => {
      if (!disableAutoFocus && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  // Función para abrir el overlay panel con los seguimientos
  const handleTrackingClick = (event, rowData) => {
    setTrackingList(rowData.controlStockList || []);
    overlayPanelRef.current.toggle(event);
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
      <Toast ref={toast} position="top-center" />
      {/* Fila de búsqueda */}
      <div className="flex items-center">
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
            autoFocus={!disableAutoFocus}
          />
        </span>
      </div>

      <Divider style={{ borderColor: "var(--surface-border)" }} />

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
          emptyMessage=" "
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
            body={(rowData) => {
              // Buscar cantidad de la tienda actual. Se asume que shopId es numérico.
              const currentStock = rowData.stocks
                ? rowData.stocks.find(
                    (stock) => stock.id_shop === Number(shopId)
                  )
                : null;
              const displayedQuantity = currentStock
                ? currentStock.quantity
                : rowData.quantity;
              return (
                <>
                  {displayedQuantity}
                  {Number(rowData.trackingCount) > 0
                    ? ` | ${rowData.trackingCount} `
                    : ""}
                  {Number(rowData.trackingCount) > 0 && (
                    <i
                      className="pi pi-link"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => handleTrackingClick(e, rowData)}
                    ></i>
                  )}
                </>
              );
            }}
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

      <OverlayPanel ref={overlayPanelRef}>
        {trackingList.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex items-center">
              {item.id_control_stock}
              <i className="pi pi-link" style={{ marginLeft: "0.5rem" }}></i>
            </span>
            <i
              className={`pi ${
                item.active_control_stock ? "pi-check" : "pi-times"
              }`}
              style={{
                color: item.active_control_stock ? "green" : "red",
              }}
            ></i>
          </div>
        ))}
      </OverlayPanel>
    </div>
  );
};

export default ProductSearchCard;
