// ProductSelectionModal.jsx

import React, { useState } from 'react';
import Modal from '../Modal';

const ProductSelectionModal = ({
  isOpen,
  onClose,
  products,
  onSelectProducts,
  originShopName = 'Origen',
  destinationShopName = 'Destino',
  type = 'traspaso', // 'traspaso' | 'entrada' | 'salida'
}) => {
  const [selectedItems, setSelectedItems] = useState([]);

  // Chequeo checkbox
  const handleCheckboxChange = (product) => {
    setSelectedItems((prev) => {
      const alreadySelected = prev.find(
        (p) =>
          p.id_product === product.id_product &&
          p.id_product_attribute === product.id_product_attribute
      );
      if (alreadySelected) {
        // Si ya está seleccionado, lo quitamos
        return prev.filter(
          (p) =>
            !(
              p.id_product === product.id_product &&
              p.id_product_attribute === product.id_product_attribute
            )
        );
      } else {
        // Si no estaba, lo agregamos
        return [...prev, product];
      }
    });
  };

  const isProductSelected = (product) =>
    !!selectedItems.find(
      (p) =>
        p.id_product === product.id_product &&
        p.id_product_attribute === product.id_product_attribute
    );

  const handleAddAllSelected = () => {
    if (selectedItems.length === 0) {
      alert('No has seleccionado ningún producto.');
      return;
    }
    onSelectProducts(selectedItems);
    setSelectedItems([]);
  };

  // Determina si se muestra la columna de stock origen
  const showOriginStock = type === 'salida' || type === 'traspaso';
  // Determina si se muestra la columna de stock destino
  const showDestinationStock = type === 'entrada' || type === 'traspaso';

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
              {/* Columna de checkboxes */}
              <th className="py-2 px-4 border-b text-left">Selec.</th>
              <th className="py-2 px-4 border-b text-left">Nombre Producto</th>
              <th className="py-2 px-4 border-b text-left">Combinación</th>
              {/* Columna "Stock Origen" sólo si es salida o traspaso */}
              {showOriginStock && (
                <th className="py-2 px-4 border-b text-left">
                  Stock {originShopName}
                </th>
              )}

              {/* Columna "Stock Destino" sólo si es entrada o traspaso */}
              {showDestinationStock && (
                <th className="py-2 px-4 border-b text-left">
                  Stock {destinationShopName}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const selected = isProductSelected(product);

              return (
                <tr
                  key={`${product.id_product}_${product.id_product_attribute}`}
                  className="hover:bg-gray-50"
                >
                  <td className="py-2 px-4 border-b">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => handleCheckboxChange(product)}
                    />
                  </td>
                  <td className="py-2 px-4 border-b">{product.product_name}</td>
                  <td className="py-2 px-4 border-b">{product.combination_name}</td>

                  {/* Stock Origen */}
                  {showOriginStock && (
                    <td className="py-2 px-4 border-b">
                      {product.stockOrigin ?? 0}
                    </td>
                  )}

                  {/* Stock Destino */}
                  {showDestinationStock && (
                    <td className="py-2 px-4 border-b">
                      {product.stockDestination ?? 0}
                    </td>
                  )}
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={
                    4 +
                    (showOriginStock ? 1 : 0) +
                    (showDestinationStock ? 1 : 0)
                  }
                  className="text-center p-4"
                >
                  No hay productos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botón para añadir todos los seleccionados */}
      <div className="mt-4 flex justify-end">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleAddAllSelected}
        >
          Añadir
        </button>
      </div>
    </Modal>
  );
};

export default ProductSelectionModal;