// src/components/modals/returns/ReturnsExchangesModal.jsx

import React, { useState } from 'react';
import Modal from '../Modal';
import { useApiFetch } from '../../../components/utils/useApiFetch';

// PrimeReact
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const ReturnsExchangesModal = ({ isOpen, onClose, onAddProduct }) => {
  // ID de la venta a buscar
  const [orderId, setOrderId] = useState('');

  // Manejo de la venta obtenida
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  // Selección múltiple y cantidades a devolver
  const [selectedRows, setSelectedRows] = useState([]);
  const [returnQuantities, setReturnQuantities] = useState({});

  // Efecto de carga
  const [isLoading, setIsLoading] = useState(false);

  const apiFetch = useApiFetch();

  // Generar skeleton placeholders
  // Suponiendo máx. 6 productos
  const skeletonData = new Array(6).fill(null).map((_, idx) => ({
    uniqueLineId: `skeleton-${idx}`,
    product_name: 'Cargando...',
    product_quantity: 0,
    unit_price_tax_incl: 0,
  }));

  // Buscar la venta por ID
  const handleSearchOrder = async () => {
    if (!orderId.trim()) return;  
    try {
      setError(null);
      setIsLoading(true);

      // Llamada a la API
      const data = await apiFetch(
        `https://apitpv.anthonyloor.com/get_order?id_order=${encodeURIComponent(orderId)}`,
        { method: 'GET' }
      );

      if (!data || !data.order_details) {
        setError('No se encontró la venta o no tiene detalles.');
        setOrderData(null);
        return;
      }

      // Asegurar uniqueLineId en cada detail
      const details = data.order_details.map((item) => ({
        ...item,
        uniqueLineId: `${item.product_id}-${item.product_attribute_id}`,
      }));
      data.order_details = details;

      setOrderData(data);
      setSelectedRows([]);
      setReturnQuantities({});
    } catch (e) {
      console.error('Error al buscar la venta:', e);
      setError('No se encontró la venta o ocurrió un error.');
      setOrderData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Selección de filas
  const handleSelectionChange = (e) => {
    setSelectedRows(e.value);

    // Inicializar cantidades
    e.value.forEach((prod) => {
      if (!returnQuantities[prod.uniqueLineId]) {
        setReturnQuantities((prev) => ({
          ...prev,
          [prod.uniqueLineId]: prod.product_quantity,
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

    setReturnQuantities((prev) => ({
      ...prev,
      [key]: qty,
    }));
  };

  // Columna “Devolver”
  const devolverBodyTemplate = (rowData) => {
    const key = rowData.uniqueLineId;
    const currentQty = returnQuantities[key] ?? rowData.product_quantity;

    const isSelected = selectedRows.some((p) => p.uniqueLineId === key);
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

  // Aceptar
  const handleAceptar = () => {
    if (!orderData || selectedRows.length === 0) return;

    // Producto ficticio rectificación
    const rectificacionProduct = {
      id_product: 0,
      id_product_attribute: 0,
      id_stock_available: 0,
      product_name: `Rectificación del ticket #${orderId}`,
      combination_name: '',
      reference_combination: '',
      ean13_combination: '',
      price_incl_tax: 0,
      final_price_incl_tax: 0,
      tax_rate: 0,
      image_url: '',
      shop_name: '',
      id_shop: 0,
    };
    onAddProduct(rectificacionProduct, null, null, false, 1);

    // Añadir productos devueltos
    selectedRows.forEach((prod) => {
      const key = prod.uniqueLineId;
      const qtyToReturn = returnQuantities[key] ?? prod.product_quantity;
      const productForCart = {
        id_product: prod.product_id,
        id_product_attribute: prod.product_attribute_id,
        id_stock_available: prod.stock_available_id,
        product_name: prod.product_name,
        combination_name: '',
        reference_combination: prod.product_reference,
        ean13_combination: prod.product_ean13,
        price_incl_tax: prod.unit_price_tax_incl,
        final_price_incl_tax: prod.unit_price_tax_incl,
        tax_rate: 0.21,
        image_url: '',
        shop_name: '',
        id_shop: prod.id_shop,
      };
      onAddProduct(productForCart, null, null, false, -qtyToReturn);
    });

    alert('Rectificación añadida y productos devueltos al carrito.');

    // Reset
    setOrderId('');
    setOrderData(null);
    setSelectedRows([]);
    setReturnQuantities({});
    setError(null);
    onClose();
  };

  const canProceed = !!orderData && selectedRows.length > 0;

  if (!isOpen) return null;

  // Determinar data a mostrar en la tabla (skeleton vs real)
  const displayData = isLoading
    ? skeletonData
    : orderData?.order_details || [];

  return (
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
        {/* Barra de búsqueda */}
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Número de ticket"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchOrder();
              }}
              className="border rounded p-2 w-full"
            />
          </div>
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
            emptyMessage={
              isLoading
                ? '' // mientras carga no ponemos texto
                : 'No hay productos para mostrar.'
            }
          >
            {/* Checkbox */}
            <Column
              selectionMode="multiple"
              style={{ width: '3rem' }}
              headerStyle={{ textAlign: 'center' }}
            />

            {/* Si isLoading => simular skeleton */}
            <Column
              field="product_name"
              header="Producto"
              body={(row) => {
                if (isLoading) {  
                  // skeleton
                  return <div className="animate-pulse bg-gray-200 h-3 w-32 rounded" />;
                }
                return row.product_name;
              }}
            />
            <Column
              field="product_quantity"
              header="Cant."
              style={{ width: '70px', textAlign: 'right' }}
              body={(row) => {
                if (isLoading) {
                  return <div className="animate-pulse bg-gray-200 h-3 w-8 ml-auto rounded" />;
                }
                return row.product_quantity;
              }}
            />
            <Column
              header="P/U (€)"
              style={{ width: '90px', textAlign: 'right' }}
              body={(row) => {
                if (isLoading) {
                  return <div className="animate-pulse bg-gray-200 h-3 w-10 ml-auto rounded" />;
                }
                return row.unit_price_tax_incl
                  ? row.unit_price_tax_incl.toFixed(2)
                  : '0.00';
              }}
            />
            <Column
              header="Total (€)"
              style={{ width: '90px', textAlign: 'right' }}
              body={(row) => {
                if (isLoading) {
                  return <div className="animate-pulse bg-gray-200 h-3 w-12 ml-auto rounded" />;
                }
                if (row.unit_price_tax_incl && row.product_quantity) {
                  return (row.unit_price_tax_incl * row.product_quantity).toFixed(2);
                }
                return '0.00';
              }}
            />

            {/* Columna “Devolver” al final */}
            <Column
              header="Devolver"
              body={isLoading ? () => <div className="animate-pulse bg-gray-200 h-3 w-8 ml-auto rounded" /> : devolverBodyTemplate}
              style={{ width: '90px', textAlign: 'right' }}
            />
          </DataTable>
        </div>

        <div className="flex justify-end">
          <button
            className={`px-4 py-2 rounded text-white font-semibold transition-colors ${
              canProceed
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!canProceed}
            onClick={handleAceptar}
          >
            Aceptar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReturnsExchangesModal;