import React, { useState } from 'react';
import { useApiFetch } from '../../utils/useApiFetch';
import ProductSelectionModal from './ProductSelectionModal';

const ProductSearchCardForTransfer = ({
  onAddProduct,
  selectedOriginStore,
  selectedDestinationStore,
  type, // 'traspaso', 'entrada', 'salida'
  originShopName,
  destinationShopName,
}) => {
  const apiFetch = useApiFetch();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [modalProducts, setModalProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Checkbox "Agregar Automático"
  const [autoAdd, setAutoAdd] = useState(false);

  let isSearchDisabled = false;
  if (type === 'traspaso') {
    isSearchDisabled = !selectedOriginStore || !selectedDestinationStore;
  } else if (type === 'entrada') {
    isSearchDisabled = !selectedDestinationStore;
  } else if (type === 'salida') {
    isSearchDisabled = !selectedOriginStore;
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && searchTerm.trim().length >= 3 && !isSearchDisabled) {
      await performSearch();
    }
  };

  const transformProductsForDisplay = (apiResults) => {
    const grouped = {};
    apiResults.forEach((prod) => {
      const key = `${prod.id_product}_${prod.id_product_attribute}`;
      if (!grouped[key]) {
        const ean13Val =
          prod.ean13_combination !== null
            ? prod.ean13_combination
            : prod.ean13_combination_0 || '';

        grouped[key] = {
          id_product: prod.id_product,
          id_product_attribute: prod.id_product_attribute,
          product_name: prod.product_name,
          combination_name: prod.combination_name,
          reference_combination: prod.reference_combination,
          ean13: ean13Val,
          stockOrigin: 0,
          stockDestination: 0,
        };
      }
      if (String(prod.id_shop) === String(selectedOriginStore)) {
        grouped[key].stockOrigin = prod.quantity ?? 0;
      }
      if (String(prod.id_shop) === String(selectedDestinationStore)) {
        grouped[key].stockDestination = prod.quantity ?? 0;
      }
    });
    return Object.values(grouped);
  };

  const performSearch = async () => {
    if (isSearchDisabled) return;
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiFetch(
        `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
          searchTerm.trim()
        )}`,
        { method: 'GET' }
      );
      const validResults = response.filter(
        (p) =>
          !(
            p.id_product_attribute === null &&
            p.ean13_combination === null &&
            p.ean13_combination_0 === null
          )
      );
      const transformed = transformProductsForDisplay(validResults);
      if (transformed.length === 0) {
        alert('No se encontraron productos.');
        return;
      }

      // Revisar si autoAdd está activo y hay exactamente 1 resultado
      if (autoAdd && transformed.length === 1) {
        handleAddSelectedProducts(transformed);
      } else {
        setModalProducts(transformed);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('[ProductSearchCardForTransfer] Error:', error);
      alert('Error al buscar productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSelectedProducts = (selected) => {
    selected.forEach((prod) => {
      const item = {
        id_product: prod.id_product,
        id_product_attribute: prod.id_product_attribute,
        product_name: prod.product_name,
        combination_name: prod.combination_name,
        reference_combination: prod.reference_combination,
        ean13: prod.ean13,
        stockOrigin: prod.stockOrigin,
        quantity: 1,
      };
      onAddProduct(item);
    });
    setIsModalOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="mt-6 bg-white rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Buscar Producto</h2>

      {/* Contenedor flex para alinear input y botón en la misma fila */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Buscar por nombre, referencia o código..."
            className="border rounded p-2 w-full"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            disabled={isSearchDisabled || isLoading}
          />
          {isLoading && (
            <div className="absolute right-2 top-2">
              <svg
                className="animate-spin h-5 w-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            </div>
          )}
        </div>

        <button
          onClick={performSearch}
          className="bg-blue-600 text-white px-3 py-2 rounded"
          disabled={
            isSearchDisabled || isLoading || searchTerm.trim().length < 3
          }
        >
          Buscar
        </button>
      </div>

      {/* Checkbox para "Agregar Automático" */}
      <label className="inline-flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          className="form-checkbox h-5 w-5"
          checked={autoAdd}
          onChange={(e) => setAutoAdd(e.target.checked)}
        />
        <span className="text-sm text-gray-700">Agregar Automático</span>
      </label>

      {isSearchDisabled && (
        <p className="mt-3 text-red-500">
          {type === 'traspaso'
            ? 'Selecciona ambas tiendas (origen y destino).'
            : type === 'entrada'
            ? 'Selecciona la tienda destino.'
            : 'Selecciona la tienda origen.'
          }
        </p>
      )}

      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={modalProducts}
        onSelectProducts={handleAddSelectedProducts}
        originShopName={originShopName}
        destinationShopName={destinationShopName}
        type={type}
      />
    </div>
  );
};

export default ProductSearchCardForTransfer;