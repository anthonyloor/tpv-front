import React, { useState } from "react";
import Modal from "../Modal";
import TicketViewModal from "../ticket/TicketViewModal"; // Ajusta la ruta según tu estructura
import { useApiFetch } from "../../../components/utils/useApiFetch";

// PrimeReact
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const ReturnsExchangesModal = ({ isOpen, onClose, onAddProduct }) => {
  const [orderId, setOrderId] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [returnedProductMap, setReturnedProductMap] = useState({});
  const [viewTicketId, setViewTicketId] = useState(null);

  const apiFetch = useApiFetch();

  const skeletonData = new Array(6).fill(null).map((_, idx) => ({
    uniqueLineId: `skeleton-${idx}`,
    product_name: "Cargando...",
    product_quantity: 0,
    unit_price_tax_incl: 0,
  }));

  const handleSearchOrder = async () => {
    if (!orderId.trim()) return;
    try {
      setError(null);
      setIsLoading(true);
      setReturnedProductMap({});

      // 1. Buscar el pedido original por ID
      const data = await apiFetch(
        `https://apitpv.anthonyloor.com/get_order?id_order=${encodeURIComponent(
          orderId
        )}`,
        { method: "GET" }
      );

      if (!data || !data.order_details) {
        setError("No se encontró la venta o no tiene detalles.");
        setOrderData(null);
        return;
      }

      // Asignar uniqueLineId a cada detalle del pedido original
      const details = data.order_details.map((item) => ({
        ...item,
        uniqueLineId: `${item.product_id}-${item.product_attribute_id}`,
        id_order: data.id_order,
      }));
      data.order_details = details;
      setOrderData(data);
      setSelectedRows([]);
      setReturnQuantities({});

      // 2. Obtener todas las órdenes recientes
      const allOrdersData = await apiFetch(
        "https://apitpv.anthonyloor.com/get_orders",
        {
          method: "GET",
        }
      );

      // 3. Filtrar órdenes que contienen una rectificación del ticket buscado
      const rectificationOrders = [];
      if (allOrdersData && Array.isArray(allOrdersData)) {
        for (let order of allOrdersData) {
          if (!order.order_details) continue;
          const hasRectification = order.order_details.some((line) => {
            const name = line.product_name?.trim().toLowerCase();
            return (
              name &&
              name.startsWith(`rectificaci\u00f3n del ticket #${orderId}`)
            );
          });
          if (hasRectification) {
            rectificationOrders.push(order);
          }
        }
      }

      // 4. Determinar qué productos del pedido original ya fueron devueltos
      const returnedMap = {};
      if (rectificationOrders.length > 0 && data.order_details) {
        for (let prod of data.order_details) {
          for (let rectOrder of rectificationOrders) {
            if (!rectOrder.order_details) continue;
            for (let detail of rectOrder.order_details) {
              if (
                detail.product_id === prod.product_id &&
                detail.product_attribute_id === prod.product_attribute_id
              ) {
                // Asociar el uniqueLineId con el id_order de rectificación
                returnedMap[prod.uniqueLineId] = rectOrder.id_order;
              }
            }
          }
        }
      }

      console.log("Returned Product Map:", returnedMap);
      setReturnedProductMap(returnedMap);
    } catch (e) {
      console.error("Error al buscar la venta:", e);
      setError("No se encontró la venta o ocurrió un error.");
      setOrderData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionChange = (e) => {
    // Filtrar para excluir productos ya devueltos
    const filtered = e.value.filter(
      (prod) => !returnedProductMap[prod.uniqueLineId]
    );
    setSelectedRows(filtered);

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

  const handleQuantityChange = (rowData, newValue) => {
    const key = rowData.uniqueLineId;
    let qty = parseInt(newValue, 10) || 1;
    if (qty < 1) qty = 1;
    if (qty > rowData.product_quantity) qty = rowData.product_quantity;
    setReturnQuantities((prev) => ({ ...prev, [key]: qty }));
  };

  const devolverBodyTemplate = (rowData) => {
    const key = rowData.uniqueLineId;
    const currentQty = returnQuantities[key] ?? rowData.product_quantity;
    const isSelected = selectedRows.some((p) => p.uniqueLineId === key);

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

    return (
      <input
        type="number"
        min="1"
        max={rowData.product_quantity}
        value={currentQty}
        onChange={(e) => handleQuantityChange(rowData, e.target.value)}
        className="border rounded p-1 w-16 text-right"
      />
    );
  };

  const handleAceptar = () => {
    if (!orderData || selectedRows.length === 0) return;

    const rectificacionProduct = {
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
    onAddProduct(rectificacionProduct, null, null, false, 1);

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
        id_shop: prod.id_shop,
      };
      onAddProduct(productForCart, null, null, false, -qtyToReturn);
    });

    alert("Rectificación añadida y productos devueltos al carrito.");

    setOrderId("");
    setOrderData(null);
    setError(null);
    setSelectedRows([]);
    setReturnQuantities({});
    setReturnedProductMap(new Set());
    onClose();
  };

  const canProceed = !!orderData && selectedRows.length > 0;

  const displayData = isLoading ? skeletonData : orderData?.order_details || [];

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Devoluciones / Cambios"
        showCloseButton
        showBackButton={false}
        size="3xl"
        height="tall"
      >
        <div className="w-full mx-auto space-y-4">
          <div className="flex items-end space-x-2">
            <input
              type="text"
              placeholder="Número de ticket"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchOrder();
              }}
              className="border rounded p-2 w-full"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="border border-gray-300 rounded-md p-2 bg-white shadow-sm">
            <DataTable
              value={displayData}
              className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
              selection={selectedRows}
              onSelectionChange={handleSelectionChange}
              selectionMode="multiple"
              dataKey="uniqueLineId"
              scrollable
              scrollHeight="350px"
              emptyMessage={isLoading ? "" : "No hay productos para mostrar."}
            >
              <Column
                selectionMode="multiple"
                style={{ width: "3rem" }}
                headerStyle={{ textAlign: "center" }}
              />
              <Column
                field="product_name"
                header="Producto"
                body={(row) => {
                  if (isLoading) {
                    return (
                      <div className="animate-pulse bg-gray-200 h-3 w-32 rounded" />
                    );
                  }
                  return row.product_name;
                }}
              />
              <Column
                field="product_quantity"
                header="Cant."
                style={{ width: "70px", textAlign: "right" }}
                body={(row) => {
                  if (isLoading) {
                    return (
                      <div className="animate-pulse bg-gray-200 h-3 w-8 ml-auto rounded" />
                    );
                  }
                  return row.product_quantity;
                }}
              />
              <Column
                header="P/U (€)"
                style={{ width: "90px", textAlign: "right" }}
                body={(row) => {
                  if (isLoading) {
                    return (
                      <div className="animate-pulse bg-gray-200 h-3 w-10 ml-auto rounded" />
                    );
                  }
                  return row.unit_price_tax_incl
                    ? row.unit_price_tax_incl.toFixed(2)
                    : "0.00";
                }}
              />
              <Column
                header="Total (€)"
                style={{ width: "90px", textAlign: "right" }}
                body={(row) => {
                  if (isLoading) {
                    return (
                      <div className="animate-pulse bg-gray-200 h-3 w-12 ml-auto rounded" />
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
                        <div className="animate-pulse bg-gray-200 h-3 w-8 ml-auto rounded" />
                      )
                    : devolverBodyTemplate
                }
                style={{ width: "90px", textAlign: "center" }}
              />
            </DataTable>
          </div>

          <div className="flex justify-end">
            <button
              className={`px-4 py-2 rounded text-white font-semibold transition-colors ${
                canProceed
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              disabled={!canProceed}
              onClick={handleAceptar}
            >
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
      {viewTicketId && (
        <TicketViewModal
          isOpen={true}
          onClose={() => setViewTicketId(null)}
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