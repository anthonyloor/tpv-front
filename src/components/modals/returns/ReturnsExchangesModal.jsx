// src/components/modals/returns/ReturnsExchangesModal.jsx

import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import TicketViewModal from "../ticket/TicketViewModal";
import { useApiFetch } from "../../../components/utils/useApiFetch";
import { AuthContext } from "../../../contexts/AuthContext";

/**
 * Modal para gestionar devoluciones/cambios.
 *
 * @param {boolean} isOpen           - Indica si se muestra el diálogo.
 * @param {function} onClose         - Función para cerrar el modal.
 * @param {function} onAddProduct    - Para añadir productos negativos (rectificación) al ticket.
 */
const ReturnsExchangesModal = ({ isOpen, onClose, onAddProduct }) => {
  const { shopId } = React.useContext(AuthContext); // o de donde obtengas tu shopId
  const [orderId, setOrderId] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  // Para la selección de productos a devolver
  const [selectedRows, setSelectedRows] = useState([]);
  const [returnQuantities, setReturnQuantities] = useState({});

  // Control de carga y de comprobación
  const [isLoading, setIsLoading] = useState(false);

  // Mapa de productos que ya fueron devueltos
  const [returnedProductMap, setReturnedProductMap] = useState({});

  // Para mostrar ticket devuelto
  const [viewTicketId, setViewTicketId] = useState(null);

  const apiFetch = useApiFetch();

  // Guardar en un estado local los pedidos de la tienda
  const [shopOrders, setShopOrders] = useState([]);

  // Skeleton
  const skeletonData = new Array(6).fill(null).map((_, idx) => ({
    uniqueLineId: `skeleton-${idx}`,
    product_name: "Cargando...",
    product_quantity: 0,
    unit_price_tax_incl: 0,
  }));

  // Al abrir el modal, limpiamos estados
  useEffect(() => {
    if (isOpen) {
      setOrderId("");
      setOrderData(null);
      setError(null);
      setSelectedRows([]);
      setReturnQuantities({});
      setReturnedProductMap({});
      setIsLoading(false);

      // Cargar pedidos de la tienda
      loadShopOrders();
    } else {
      // Al cerrar => limpiar
      setShopOrders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /**
   * Cargar todos los pedidos de la tienda actual usando /get_shop_orders.
   * origin = "mayret" (según tu requisito).
   */
  const loadShopOrders = async () => {
    if (!shopId) return;
    try {
      setIsLoading(true);
      setError(null);

      const payload = {
        id_shop: shopId,
        origin: "mayret",
      };
      const data = await apiFetch(
        "https://apitpv.anthonyloor.com/get_shop_orders",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      if (!Array.isArray(data) || !data.length) {
        // Podría venir un response con status=error, message=...
        setError("No se encontraron pedidos para la tienda.");
        setShopOrders([]);
      } else {
        setShopOrders(data);
      }
    } catch (error) {
      console.error("Error al cargar pedidos de la tienda:", error);
      setError("Error al cargar los pedidos de la tienda.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Buscar un pedido en shopOrders que coincida con el orderId introducido.
   * Luego setOrderData con sus detalles y comprueba rectificaciones.
   */
  const handleSearchOrder = async () => {
    if (!orderId.trim()) return;
    try {
      setError(null);
      setIsLoading(true);
      setReturnedProductMap({});

      // Buscar en shopOrders el pedido con ID = orderId
      const foundOrder = shopOrders.find(
        (od) => String(od.id_order) === String(orderId.trim())
      );

      if (!foundOrder || !foundOrder.order_details) {
        setError("No se encontró la venta o no tiene detalles.");
        setOrderData(null);
        return;
      }

      // Clonar la info y añadir uniqueLineId
      const details = foundOrder.order_details.map((item) => ({
        ...item,
        uniqueLineId: `${item.product_id}-${item.product_attribute_id}`,
        id_order: foundOrder.id_order,
      }));
      const orderWithDetails = {
        ...foundOrder,
        order_details: details,
      };
      setOrderData(orderWithDetails);
      setSelectedRows([]);
      setReturnQuantities({});

      // Comprobar rectificaciones en TODOS los pedidos de la tienda.
      // (Ya tenemos shopOrders, no hace falta otra llamada.)
      const rectificationOrders = [];
      shopOrders.forEach((ord) => {
        if (!ord.order_details) return;
        const hasRect = ord.order_details.some((line) => {
          const name = line.product_name?.trim().toLowerCase();
          return (
            name && name.startsWith(`rectificaci\u00f3n del ticket #${orderId}`)
          );
        });
        if (hasRect) {
          rectificationOrders.push(ord);
        }
      });

      // Construir mapa de productos devueltos
      const returnedMap = {};
      if (rectificationOrders.length > 0) {
        // Recorremos rectOrders y si coinciden con details
        for (let prod of details) {
          for (let rOrder of rectificationOrders) {
            if (!rOrder.order_details) continue;
            for (let line of rOrder.order_details) {
              if (
                line.product_id === prod.product_id &&
                line.product_attribute_id === prod.product_attribute_id
              ) {
                returnedMap[prod.uniqueLineId] = rOrder.id_order;
              }
            }
          }
        }
      }
      setReturnedProductMap(returnedMap);
    } catch (e) {
      console.error("Error al buscar la venta:", e);
      setError("No se encontró la venta o ocurrió un error.");
      setOrderData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar selección de filas (ver si algún producto ya devuelto => no se puede)
  const handleSelectionChange = (e) => {
    // Filtrar los que no estén "ya devueltos"
    const filtered = e.value.filter(
      (prod) => !returnedProductMap[prod.uniqueLineId]
    );
    setSelectedRows(filtered);

    // Inicializamos la cantidad de devolución
    filtered.forEach((prod) => {
      const key = prod.uniqueLineId;
      if (!returnQuantities[key]) {
        setReturnQuantities((prev) => ({
          ...prev,
          [key]: prod.product_quantity,
        }));
      }
    });
  };

  // Cambiar la cantidad a devolver
  const handleQuantityChange = (rowData, newValue) => {
    const key = rowData.uniqueLineId;
    let qty = parseInt(newValue, 10) || 1;
    if (qty < 1) qty = 1;
    if (qty > rowData.product_quantity) qty = rowData.product_quantity;
    setReturnQuantities((prev) => ({ ...prev, [key]: qty }));
  };

  // Columna "Devolver"
  const devolverBodyTemplate = (rowData) => {
    const key = rowData.uniqueLineId;
    const currentQty = returnQuantities[key] ?? rowData.product_quantity;
    const isSelected = selectedRows.some((p) => p.uniqueLineId === key);

    // Si ya se devolvió
    if (returnedProductMap[key]) {
      return (
        <span
          className="text-red-500 cursor-pointer underline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewTicketId(returnedProductMap[key]);
          }}
          title="Ver ticket de devolución"
        >
          Ya devuelto
        </span>
      );
    }

    // Si no está seleccionado => “-”
    if (!isSelected) {
      return <span className="text-gray-400">-</span>;
    }

    // Campo para modificar la cantidad a devolver
    return (
      <input
        type="number"
        min="1"
        max={rowData.product_quantity}
        value={currentQty}
        onChange={(e) => handleQuantityChange(rowData, e.target.value)}
        className="p-inputtext p-component p-filled w-16 text-right"
        style={{
          borderColor: "var(--surface-border)",
        }}
      />
    );
  };

  // Manejar confirmación => añadir rectificaciones al ticket
  const handleAceptar = () => {
    if (!orderData || selectedRows.length === 0) return;

    // 1) Añadir la línea “Rectificación del ticket #xxx”
    const rectProduct = {
      id_product: 0,
      id_product_attribute: 0,
      id_stock_available: 0,
      product_name: `Rectificación del ticket #${orderId}`,
      combination_name: "",
      reference_combination: "",
      ean13_combination: "",
      price_incl_tax: 0,
      final_price_incl_tax: 0,
      tax_rate: 0,
      image_url: "",
      shop_name: "",
      id_shop: 0,
    };
    onAddProduct(rectProduct, null, null, false, 1);

    // 2) Añadir las líneas con cantidades negativas
    selectedRows.forEach((prod) => {
      const key = prod.uniqueLineId;
      const qtyToReturn = returnQuantities[key] ?? prod.product_quantity;

      const productForCart = {
        id_product: prod.product_id,
        id_product_attribute: prod.product_attribute_id,
        id_stock_available: prod.stock_available_id,
        product_name: prod.product_name,
        combination_name: "",
        reference_combination: prod.product_reference,
        ean13_combination: prod.product_ean13,
        price_incl_tax: prod.unit_price_tax_incl,
        final_price_incl_tax: prod.unit_price_tax_incl,
        tax_rate: 0.21,
        image_url: "",
        shop_name: "",
        id_shop: prod.id_shop, // o la tienda original
      };
      // Cantidad negativa
      onAddProduct(productForCart, null, null, false, -qtyToReturn);
    });

    alert("Rectificación añadida y productos devueltos al carrito.");

    // Limpieza
    setOrderId("");
    setOrderData(null);
    setError(null);
    setSelectedRows([]);
    setReturnQuantities({});
    setReturnedProductMap({});
    onClose();
  };

  const canProceed = !!orderData && selectedRows.length > 0;
  const displayData = isLoading ? skeletonData : orderData?.order_details || [];

  // Render
  return (
    <>
      <Dialog
        visible={isOpen}
        onHide={onClose}
        header="Devoluciones / Cambios"
        modal
        draggable={false}
        resizable={false}
        style={{
          width: "80vw",
          maxWidth: "800px",
          backgroundColor: "var(--surface-0)",
          color: "var(--text-color)",
        }}
      >
        <div className="p-2">
          {/* Input para buscar ticket */}
          <div className="flex gap-2 items-end mb-3">
            <div className="flex-1">
              <span className="p-input-icon-left w-full">
                <i
                  className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--text-secondary)" }}
                />
                <InputText
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchOrder();
                  }}
                  className="w-full pl-8"
                  placeholder="Número de ticket"
                  disabled={isLoading || !shopOrders.length}
                />
              </span>
            </div>
            <Button
              label="Buscar"
              icon="pi pi-search"
              onClick={handleSearchOrder}
              disabled={isLoading || !orderId.trim() || !shopOrders.length}
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          {/* Tabla con DataTable */}
          <div
            className="p-2"
            style={{
              border: "1px solid var(--surface-border)",
              backgroundColor: "var(--surface-50)",
              borderRadius: "4px",
            }}
          >
            <DataTable
              value={displayData}
              className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
              selection={selectedRows}
              onSelectionChange={handleSelectionChange}
              selectionMode="multiple"
              dataKey="uniqueLineId"
              scrollable
              scrollHeight="350px"
              emptyMessage={
                isLoading
                  ? ""
                  : !orderData
                  ? "No hay productos para mostrar."
                  : "No se encontraron productos."
              }
            >
              <Column
                selectionMode="multiple"
                style={{ width: "3rem" }}
                headerStyle={{ textAlign: "center" }}
              />
              <Column
                field="product_name"
                header="Producto"
                style={{ minWidth: "150px" }}
                body={(row) => {
                  if (isLoading) {
                    return (
                      <div className="bg-gray-200 h-3 w-32 rounded animate-pulse" />
                    );
                  }
                  return row.product_name;
                }}
              />
              <Column
                field="product_quantity"
                header="Cant."
                style={{ width: "70px", textAlign: "right" }}
                body={(row) =>
                  isLoading ? (
                    <div className="bg-gray-200 h-3 w-8 ml-auto rounded animate-pulse" />
                  ) : (
                    row.product_quantity
                  )
                }
              />
              <Column
                header="P/U (€)"
                style={{ width: "90px", textAlign: "right" }}
                body={(row) =>
                  isLoading ? (
                    <div className="bg-gray-200 h-3 w-10 ml-auto rounded animate-pulse" />
                  ) : row.unit_price_tax_incl ? (
                    row.unit_price_tax_incl.toFixed(2)
                  ) : (
                    "0.00"
                  )
                }
              />
              <Column
                header="Total (€)"
                style={{ width: "90px", textAlign: "right" }}
                body={(row) => {
                  if (isLoading) {
                    return (
                      <div className="bg-gray-200 h-3 w-12 ml-auto rounded animate-pulse" />
                    );
                  }
                  return row.unit_price_tax_incl && row.product_quantity
                    ? (row.unit_price_tax_incl * row.product_quantity).toFixed(
                        2
                      )
                    : "0.00";
                }}
              />
              <Column
                header="Devolver"
                body={
                  isLoading
                    ? () => (
                        <div className="bg-gray-200 h-3 w-8 ml-auto rounded animate-pulse" />
                      )
                    : devolverBodyTemplate
                }
                style={{ width: "90px", textAlign: "center" }}
              />
            </DataTable>
          </div>

          {/* Botón Aceptar */}
          <div className="flex justify-end mt-3">
            <Button
              label="Aceptar"
              className="p-button p-button-primary"
              disabled={!canProceed}
              onClick={handleAceptar}
            />
          </div>
        </div>
      </Dialog>

      {/* Ver ticket devuelto => TicketViewModal */}
      {viewTicketId && (
        <TicketViewModal
          isOpen
          onClose={() => setViewTicketId(null)}
          mode="ticket"
          orderId={viewTicketId}
          showCloseButton
          showBackButton={false}
          size="lg"
          height="tall"
        />
      )}
    </>
  );
};

export default ReturnsExchangesModal;
