// ReturnsExchangesModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal'; // Ajusta la ruta a tu Modal genérico
import { useApiFetch } from '../../../components/utils/useApiFetch';

const ReturnsExchangesModal = ({ isOpen, onClose }) => {
  const [orderId, setOrderId] = useState('');
  const [clientName, setClientName] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const apiFetch = useApiFetch();

  const handleSearchOrder = async () => {
    if (!orderId.trim()) return;
    try {
      setError(null);
      const data = await apiFetch(`https://apitpv.anthonyloor.com/get_order?id_order=${encodeURIComponent(orderId)}`, {
        method: 'GET',
      });
      setOrderData(data);
      setSelectedProducts([]); // Resetear la selección al buscar una nueva orden
    } catch (e) {
      console.error('Error fetching order:', e);
      setError('No se pudo encontrar la orden o ocurrió un error al buscarla.');
      setOrderData(null);
    }
  };

  const handleToggleProduct = (product) => {
    // Si el producto ya está en selectedProducts, lo quitamos. Si no, lo añadimos.
    const exists = selectedProducts.find(
      (p) => p.product_id === product.product_id && p.product_attribute_id === product.product_attribute_id
    );
    if (exists) {
      setSelectedProducts((prev) =>
        prev.filter(
          (p) => !(p.product_id === product.product_id && p.product_attribute_id === product.product_attribute_id)
        )
      );
    } else {
      setSelectedProducts((prev) => [...prev, product]);
    }
  };

  const canProceed = selectedProducts.length > 0;

  const handleCambio = () => {
    alert('Proceder con cambio de productos seleccionados');
    // Aquí iría la lógica para procesar el cambio
  };

  const handleValeDescuento = () => {
    alert('Proceder con vale de descuento para productos seleccionados');
    // Aquí iría la lógica para generar un vale de descuento
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-2xl">
        <h2 className="text-lg font-bold mb-4">Devoluciones / Cambios</h2>
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
            // Por ahora no hacemos nada con este input
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