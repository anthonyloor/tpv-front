// src/components/modals/returns/ReturnsExchangesModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal';
import { useApiFetch } from '../../../components/utils/useApiFetch';

const ReturnsExchangesModal = ({ isOpen, onClose, onAddProduct }) => {
  const [orderId, setOrderId] = useState('');
  const [clientName, setClientName] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [returnQuantities, setReturnQuantities] = useState({});
  
  const apiFetch = useApiFetch();

  const handleSearchOrder = async () => {
    if (!orderId.trim()) return;
    try {
      setError(null);
      const data = await apiFetch(`https://apitpv.anthonyloor.com/get_order?id_order=${encodeURIComponent(orderId)}`, {
        method: 'GET',
      });
      setOrderData(data);
      setSelectedProducts([]);
      setReturnQuantities({});
    } catch (e) {
      console.error('Error fetching order:', e);
      setError('No se pudo encontrar la orden o ocurrió un error al buscarla.');
      setOrderData(null);
    }
  };

  const getProductKey = (product) => `${product.product_id}-${product.product_attribute_id}`;

  const handleToggleProduct = (product) => {
    const key = getProductKey(product);
    const exists = selectedProducts.find(
      (p) => p.product_id === product.product_id && p.product_attribute_id === product.product_attribute_id
    );
    if (exists) {
      setSelectedProducts((prev) =>
        prev.filter(
          (p) => !(p.product_id === product.product_id && p.product_attribute_id === product.product_attribute_id)
        )
      );
      setReturnQuantities((prev) => {
        const newObj = { ...prev };
        delete newObj[key];
        return newObj;
      });
    } else {
      setSelectedProducts((prev) => [...prev, product]);
      setReturnQuantities((prev) => ({
        ...prev,
        [key]: product.product_quantity
      }));
    }
  };

  const handleQuantityChange = (product, quantity) => {
    const key = getProductKey(product);
    setReturnQuantities((prev) => ({
      ...prev,
      [key]: quantity > 0 ? quantity : 1
    }));
  };

  const canProceed = selectedProducts.length > 0;

  const handleCambio = () => {
    selectedProducts.forEach((product) => {
      const key = getProductKey(product);
      const qtyToReturn = returnQuantities[key] || product.product_quantity;

      const productForCart = {
        id_product: product.product_id,
        id_product_attribute: product.product_attribute_id,
        id_stock_available: product.stock_available_id,
        product_name: product.product_name,
        combination_name: '', 
        reference_combination: product.product_reference,
        ean13_combination: product.product_ean13,
        price_incl_tax: product.unit_price_tax_incl,
        final_price_incl_tax: product.unit_price_tax_incl,
        tax_rate: 0.21, 
        image_url: '',
        shop_name: '',
        id_shop: product.id_shop,
      };

      onAddProduct(productForCart, null, null, false, -qtyToReturn);
    });

    alert('Los productos seleccionados se han añadido al carrito con cantidades negativas.');
    onClose();
  };

  const handleValeDescuento = () => {
    alert('Proceder con vale de descuento para productos seleccionados');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Devoluciones / Cambios"
      showCloseButton={true}
      showBackButton={false}
    >
      <div className="p-6 max-w-2xl">
        <div className="mb-4 flex space-x-2">
          <input
            type="text"
            className="border rounded p-2 w-full"
            placeholder="ID de la Venta (id_order)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchOrder();
            }}
          />
          <input
            type="text"
            className="border rounded p-2 w-full"
            placeholder="Nombre de cliente (futuro)"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {orderData && (
          <div className="mt-4">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Seleccionar</th>
                  <th className="py-2 px-4 border-b text-left">Producto</th>
                  <th className="py-2 px-4 border-b text-left">Cant.</th>
                  <th className="py-2 px-4 border-b text-left">Devolver</th>
                  <th className="py-2 px-4 border-b text-right">P/U</th>
                  <th className="py-2 px-4 border-b text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orderData.order_details.map((prod, idx) => {
                  const isSelected = selectedProducts.some(
                    (p) =>
                      p.product_id === prod.product_id &&
                      p.product_attribute_id === prod.product_attribute_id
                  );

                  const key = getProductKey(prod);
                  const returnQty = returnQuantities[key] || prod.product_quantity;

                  return (
                    <tr key={idx}>
                      <td className="py-2 px-4 border-b">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleProduct(prod)}
                        />
                      </td>
                      <td className="py-2 px-4 border-b">{prod.product_name}</td>
                      <td className="py-2 px-4 border-b">{prod.product_quantity}</td>
                      <td className="py-2 px-4 border-b">
                        {isSelected ? (
                          <input
                            type="number"
                            min="1"
                            max={prod.product_quantity}
                            value={returnQty}
                            onChange={(e) => handleQuantityChange(prod, parseInt(e.target.value, 10))}
                            className="border rounded p-1 w-16"
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td className="py-2 px-4 border-b text-right">
                        {prod.unit_price_tax_incl.toFixed(2)} €
                      </td>
                      <td className="py-2 px-4 border-b text-right">
                        {(prod.unit_price_tax_incl * prod.product_quantity).toFixed(2)} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 space-x-2">
              <button
                className={`px-4 py-2 rounded text-white ${
                  canProceed
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                onClick={canProceed ? handleCambio : undefined}
                disabled={!canProceed}
              >
                Cambiar
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${
                  canProceed
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                onClick={canProceed ? handleValeDescuento : undefined}
                disabled={!canProceed}
              >
                Vale descuento
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReturnsExchangesModal;