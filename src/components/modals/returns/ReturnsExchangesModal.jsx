// src/components/modals/returns/ReturnsExchangesModal.jsx

import React, { useState, useEffect, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useApiFetch } from "../../../utils/useApiFetch";
import { toast } from "sonner";
import { CartContext } from "../../../contexts/CartContext";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import generateTicket from "../../../utils/ticket";
import { ConfigContext } from "../../../contexts/ConfigContext";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";

const ReturnsExchangesModal = ({ isOpen, onClose, onAddProduct }) => {
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

  // Nueva variable de estado para origin con valor por defecto "mayret"
  const [selectedOrigin, setSelectedOrigin] = useState("mayret");

  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

  const {
    setIsDevolution,
    setOriginalPaymentMethods,
    setOriginalPaymentAmounts,
  } = useContext(CartContext);

  const { configData } = useContext(ConfigContext);
  const employeesDict = useEmployeesDictionary();

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
    }
  }, [isOpen]);

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
      const data = await apiFetch(`${API_BASE_URL}/get_order`, {
        method: "POST",
        body: JSON.stringify({
          id_order: orderId.trim(),
          origin: selectedOrigin,
        }),
      });
      if (!data || !data.order_details) {
        setError("No se encontró la venta o no tiene detalles.");
        setOrderData(null);
        return;
      }
      const details = data.order_details.map((item) => ({
        ...item,
        uniqueLineId: `${item.product_id}-${item.product_attribute_id}`,
        id_order: data.id_order,
      }));
      const orderWithDetails = {
        ...data,
        order_details: details,
      };
      setOrderData(orderWithDetails);

      // Procesar devoluciones para cada producto
      if (data.returns && Array.isArray(data.returns)) {
        let rpMap = {};
        data.returns.forEach((ret) => {
          ret.order_details.forEach((item) => {
            // Ignorar línea de rectificación
            if (item.product_reference === "rectificacion") return;
            const uniqueId = `${item.product_id}-${item.product_attribute_id}`;
            if (!rpMap[uniqueId]) {
              rpMap[uniqueId] = {
                totalReturned: Math.abs(item.product_quantity),
                returns: [ret.id_order],
              };
            } else {
              rpMap[uniqueId].totalReturned += Math.abs(item.product_quantity);
              if (!rpMap[uniqueId].returns.includes(ret.id_order)) {
                rpMap[uniqueId].returns.push(ret.id_order);
              }
            }
          });
        });
        setReturnedProductMap(rpMap);
      } else {
        setReturnedProductMap({});
      }
      setSelectedRows([]);
      setReturnQuantities({});
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
    const rp = returnedProductMap[key];
    const alreadyReturned = rp ? rp.totalReturned : 0;
    const maxQty = rowData.product_quantity - alreadyReturned;
    let qty = parseInt(newValue, 10) || 1;
    if (qty < 1) qty = 1;
    if (qty > maxQty) qty = maxQty;
    setReturnQuantities((prev) => ({ ...prev, [key]: qty }));
  };

  // Columna "Devolver"
  const devolverBodyTemplate = (rowData) => {
    const key = rowData.uniqueLineId;
    const rp = returnedProductMap[key];
    const alreadyReturned = rp ? rp.totalReturned : 0;
    const availableQty = rowData.product_quantity - alreadyReturned;
    const isSelected = selectedRows.some((p) => p.uniqueLineId === key);

    // Si existen devoluciones definidas para el producto
    if (rp && rp.returns.length > 0) {
      // Mostrar solo iconos si ya se alcanzó la devolución completa
      if (availableQty <= 0) {
        return (
          <span>
            {rp.returns.map((rid) => (
              <i
                key={rid}
                className="pi pi-receipt ml-1 cursor-pointer"
                onClick={() => setViewTicketId(rid)}
                title={`Devolución ${rid}`}
              ></i>
            ))}
          </span>
        );
      }
      // Si quedan unidades, mostrar iconos junto al input (o guión si no está seleccionado)
      if (!isSelected) {
        return (
          <span className="text-gray-400">
            -{" "}
            {rp.returns.map((rid) => (
              <i
                key={rid}
                className="pi pi-receipt ml-1 cursor-pointer"
                onClick={() => setViewTicketId(rid)}
                title={`Devolución ${rid}`}
              ></i>
            ))}
          </span>
        );
      }
      const currentQty = returnQuantities[key] ?? rowData.product_quantity;
      return (
        <>
          <input
            type="number"
            min="1"
            max={availableQty}
            value={currentQty}
            onChange={(e) => handleQuantityChange(rowData, e.target.value)}
            className="p-inputtext p-component p-filled w-16 text-right"
            style={{ borderColor: "var(--surface-border)" }}
          />
          {rp.returns.map((rid) => (
            <i
              key={rid}
              className="pi pi-receipt ml-1 cursor-pointer"
              onClick={() => setViewTicketId(rid)}
              title={`Devolución ${rid}`}
            ></i>
          ))}
        </>
      );
    }
    // Si no hay devoluciones y el producto ya se devolvió (caso anterior)
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
    if (!isSelected) {
      return <span className="text-gray-400">-</span>;
    }
    const currentQty = returnQuantities[key] ?? rowData.product_quantity;
    return (
      <input
        type="number"
        min="1"
        max={rowData.product_quantity}
        value={currentQty}
        onChange={(e) => handleQuantityChange(rowData, e.target.value)}
        className="p-inputtext p-component p-filled w-16 text-right"
        style={{ borderColor: "var(--surface-border)" }}
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
      reference_combination: "rectificacion",
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
    console.log("Productos seleccionados:", selectedRows);
    selectedRows.forEach((prod) => {
      const key = prod.uniqueLineId;
      const qtyToReturn = returnQuantities[key] ?? prod.product_quantity;

      const productForCart = {
        id_product: prod.product_id,
        id_product_attribute: prod.product_attribute_id,
        id_stock_available: prod.stock_available_id,
        product_name: prod.product_name,
        combination_name: prod.combination_name,
        reference_combination: prod.product_reference,
        ean13_combination: prod.product_ean13,
        price_incl_tax: prod.unit_price_tax_incl,
        reduction_amount_tax_incl: prod.reduction_amount_tax_incl,
        final_price_incl_tax: prod.unit_price_tax_incl,
        tax_rate: 0.21,
        image_url: "",
        shop_name: "",
        id_shop: prod.id_shop,
        discountApplied: prod.reduction_amount_tax_incl !== 0,
      };
      onAddProduct(productForCart, null, null, false, -qtyToReturn);
    });

    // Ahora, actualizar los valores originales de pago desde la venta obtenida
    if (orderData.payment) {
      const originalMethods = orderData.payment
        .split(",")
        .map((m) => m.trim().toLowerCase());
      setOriginalPaymentMethods(originalMethods);
    }
    if (orderData.payment_amounts) {
      setOriginalPaymentAmounts(orderData.payment_amounts);
    }

    setIsDevolution(true);

    toast.success("Rectificación añadida y productos devueltos al carrito.");
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

  // Agregamos useEffect para generar e imprimir el ticket cuando viewTicketId cambie
  useEffect(() => {
    if (viewTicketId) {
      (async () => {
        const orderData = {
          id_order: viewTicketId,
          origin: orderData?.origin || null,
        };
        const response = await generateTicket(
          "print",
          orderData,
          configData,
          employeesDict
        );
        if (!response.success) {
          console.error("Error al imprimir ticket:", response.message);
        }
        setViewTicketId(null);
      })();
    }
  }, [viewTicketId, configData, employeesDict]);

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
          width: "60vw",
          height: "65vh",
          minWidth: "900px",
          minHeight: "650px",
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
                  disabled={isLoading}
                />
              </span>
            </div>
            {/* Radio buttons para seleccionar origin */}
            <div className="flex flex-col gap-1">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="origin"
                  value="mayret"
                  checked={selectedOrigin === "mayret"}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                />
                <span className="ml-1">Mayret</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="origin"
                  value="fajasmaylu"
                  checked={selectedOrigin === "fajasmaylu"}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                />
                <span className="ml-1">Fajasmaylu</span>
              </label>
            </div>
            <Button
              label="Buscar"
              icon="pi pi-search"
              onClick={handleSearchOrder}
              disabled={isLoading || !orderId.trim()}
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
                style={{ width: "50%" }}
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
                header="Precio Und"
                style={{ width: "13%", textAlign: "center" }}
                body={(row) => {
                  if (isLoading) {
                    return (
                      <div className="bg-gray-200 h-3 w-10 ml-auto rounded animate-pulse" />
                    );
                  }
                  if (row.reference_combination === "rectificacion") {
                    return "-";
                  }
                  const originalPrice = row.unit_price_tax_incl;
                  if (
                    row.reduction_amount_tax_incl &&
                    row.reduction_amount_tax_incl < originalPrice
                  ) {
                    return (
                      <div>
                        <span
                          style={{
                            textDecoration: "line-through",
                            fontSize: "0.85em",
                            opacity: "0.8",
                          }}
                        >
                          {originalPrice.toFixed(2)} €
                        </span>
                        <br />
                        <span
                          style={{
                            color: "var(--red-500)",
                            fontWeight: "bold",
                          }}
                        >
                          {row.reduction_amount_tax_incl.toFixed(2)} €
                        </span>
                      </div>
                    );
                  }
                  return `${originalPrice.toFixed(2)} €`;
                }}
              />
              <Column
                header="Total"
                style={{ width: "13%", textAlign: "center" }}
                body={(row) => {
                  if (isLoading) {
                    return (
                      <div className="bg-gray-200 h-3 w-12 ml-auto rounded animate-pulse" />
                    );
                  }
                  if (row.reference_combination === "rectificacion") {
                    return "-";
                  }
                  const originalTotal =
                    row.unit_price_tax_incl * row.product_quantity;
                  if (
                    row.reduction_amount_tax_incl &&
                    row.reduction_amount_tax_incl < row.unit_price_tax_incl
                  ) {
                    const discountedTotal =
                      row.reduction_amount_tax_incl * row.product_quantity;
                    return (
                      <div>
                        <span
                          style={{
                            textDecoration: "line-through",
                            fontSize: "0.85em",
                            opacity: "0.8",
                          }}
                        >
                          {originalTotal.toFixed(2)} €
                        </span>
                        <br />
                        <span
                          style={{
                            color: "var(--red-500)",
                            fontWeight: "bold",
                          }}
                        >
                          {discountedTotal.toFixed(2)} €
                        </span>
                      </div>
                    );
                  }
                  return `${originalTotal.toFixed(2)} €`;
                }}
              />
              <Column
                field="product_quantity"
                header="Cant."
                style={{ textAlign: "center" }}
                body={(row) =>
                  isLoading ? (
                    <div className="bg-gray-200 h-3 w-8 ml-auto rounded animate-pulse" />
                  ) : (
                    <>
                      {row.reference_combination === "rectificacion"
                        ? "-"
                        : row.product_quantity}
                    </>
                  )
                }
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
                style={{ textAlign: "center" }}
              />
            </DataTable>
          </div>

          {/* Nueva sección: Descuentos aplicados (si existen) */}
          {orderData?.order_cart_rules &&
            orderData.order_cart_rules.length > 0 && (
              <div
                className="p-3 rounded mt-4"
                style={{
                  backgroundColor: "var(--surface-50)",
                  color: "var(--text-color)",
                }}
              >
                <h4 className="font-bold text-lg mb-2">Descuentos Aplicados</h4>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Código</th>
                      <th className="text-left">Nombre</th>
                      <th className="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.order_cart_rules.map((disc, index) => (
                      <tr
                        key={index}
                        className="border-b"
                        style={{ borderColor: "var(--surface-border)" }}
                      >
                        <td className="py-2">{disc.code}</td>
                        <td className="py-2">{disc.name}</td>
                        <td className="py-2 text-right">
                          {disc.value.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
    </>
  );
};

export default ReturnsExchangesModal;
