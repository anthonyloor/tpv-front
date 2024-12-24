// src/components/modals/transfers/ProductSelectionModal.jsx
import React from 'react';
import Modal from '../Modal'; 
import productsData from '../../../data/products.json';

const ProductSelectionModal = ({ isOpen, onClose, products, onSelectProduct, originShopId, destinationShopId }) => {
  // Si no hay productos, se muestra la tabla vacía
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar Producto"
      showBackButton={false} // No se requiere botón atrás
      showCloseButton={true}
      size="md"
      height="md"
    >
      <div className="overflow-y-auto max-h-[70vh]">
        <table className="min-w-full bg-white border">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              <th className="py-2 px-4 border-b text-left">Nombre Producto</th>
              <th className="py-2 px-4 border-b text-left">Combinación</th>
              <th className="py-2 px-4 border-b text-left">Origen</th>
              {destinationShopId && (
                <th className="py-2 px-4 border-b text-left">Destino</th>
              )}
              <th className="py-2 px-4 border-b text-left">Acción</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              let destinationQuantity = '-';
              if (destinationShopId) {
                const destProduct = productsData.find(
                  (p) =>
                    p.id_product_attribute === product.id_product_attribute &&
                    p.id_shop.toString() === destinationShopId
                );
                destinationQuantity = destProduct ? destProduct.quantity : 0;
              }

              return (
                <tr key={product.id_product_attribute}>
                  <td className="py-2 px-4 border-b">{product.product_name}</td>
                  <td className="py-2 px-4 border-b">{product.combination_name}</td>
                  <td className="py-2 px-4 border-b">{product.quantity}</td>
                  {destinationShopId && (
                    <td className="py-2 px-4 border-b">{destinationQuantity}</td>
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
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default ProductSelectionModal;