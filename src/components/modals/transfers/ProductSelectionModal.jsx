// src/components/modals/transfers/ProductSelectionModal.jsx
import React from 'react';
import Modal from '../Modal';

const ProductSelectionModal = ({ isOpen, onClose, products, onSelectProduct, originShopId, destinationShopId }) => {
  // Si no hay productos, se muestra la tabla vacía
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar Producto"
      showBackButton={false}
      showCloseButton={true}
      size="3xl"
      height="default"
    >
      <div className="overflow-y-auto max-h-[70vh]">
        <table className="min-w-full bg-white border">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th className="py-2 px-4 border-b text-left">Nombre Producto</th>
              <th className="py-2 px-4 border-b text-left">Combinación</th>
              <th className="py-2 px-4 border-b text-left">Stock Origen</th>
              {destinationShopId && (
                <th className="py-2 px-4 border-b text-left">Stock Destino</th>
              )}
              <th className="py-2 px-4 border-b text-left">Acción</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              // Suponiendo que product.quantity es el stock en la tienda "origen"
              // y si hay destino, lo calculas o lo muestras. Ajusta según tu API.
              let destinyQty = '-';
              if (destinationShopId) {
                // Este trozo es opcional, si la API no da esa info, podrías omitirlo
                // o llamarlo "stockDestiny"
              }

              return (
                <tr key={product.id_product_attribute}>
                  <td className="py-2 px-4 border-b">{product.product_name}</td>
                  <td className="py-2 px-4 border-b">{product.combination_name}</td>
                  <td className="py-2 px-4 border-b">
                    {product.quantity ?? 0}
                  </td>
                  {destinationShopId && (
                    <td className="py-2 px-4 border-b">
                      {destinyQty}
                    </td>
                  )}
                  <td className="py-2 px-4 border-b">
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                      onClick={() => onSelectProduct(product)}
                    >
                      Añadir
                    </button>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={destinationShopId ? 4 : 3} className="text-center p-4">
                  No hay productos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default ProductSelectionModal;