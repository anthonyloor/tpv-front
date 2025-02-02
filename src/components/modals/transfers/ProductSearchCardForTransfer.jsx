// ProductSearchCardForTransfer.jsx

import React, { useState } from 'react';
import { useApiFetch } from '../../utils/useApiFetch';
import ProductSelectionModal from './ProductSelectionModal';

const ProductSearchCardForTransfer = ({ onAddProduct, selectedOriginStore, selectedDestinationStore, type}) => {
  const apiFetch = useApiFetch();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Múltiples productos => abrir modal
  const [modalProducts, setModalProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reglas para habilitar busqueda
  const isSearchDisabled =
    !selectedOriginStore ||
    (type === 'traspasos' && !selectedDestinationStore);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && searchTerm.trim().length >= 3 && !isSearchDisabled) {
      await performSearch();
    }
  };

  const handleSelectProduct = (product) => {
    // Añadir el producto con quantity=1 (u otra)
    onAddProduct(product);
    setSearchTerm('');
    setIsModalOpen(false);
  };

  // Determina ID de tienda en base a type
  const getRelevantShopId = () => {
    if (type === 'entrada') {
      return selectedDestinationStore;
    }
    // traspasos o salidas
    return selectedOriginStore;
  };

  const performSearch = async () => {
    if (isSearchDisabled) return;
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      // Llamamos a la API real de búsqueda, p. ej:
      // /product_search?q=xxx
      // O ajusta el endpoint como lo tengas:
      const response = await apiFetch(
        `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(searchTerm.trim())}`,
        { method: 'GET' }
      );

      const validResults = response.filter(product =>
        !(product.id_product_attribute === null &&
        product.ean13_combination === null &&
        product.ean13_combination_0 === null)
      );

      const shopId = getRelevantShopId();

      // Filtrar solo la tienda relevant
      let filtered = [];
      if (Array.isArray(validResults)) {
        filtered = validResults.filter(p => {
          return String(p.id_shop) === String(shopId);
        });
      }

      if (filtered.length === 1) {
        // un solo producto => se añade directo
        onAddProduct(filtered[0]);
        setSearchTerm('');
      } else if (filtered.length > 1) {
        // abrir modal de selección
        setModalProducts(filtered);
        setIsModalOpen(true);
      } else {
        alert('No se encontraron productos en la tienda seleccionada.');
      }
    } catch (error) {
      console.error('[ProductSearchCardForTransfer] Error en performSearch:', error);
      alert('Error al buscar productos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Buscar Producto</h2>

      <div className="relative mb-4">
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

      <div>
        <button
          onClick={performSearch}
          className="bg-blue-600 text-white px-3 py-2 rounded"
          disabled={
            isSearchDisabled ||
            isLoading ||
            searchTerm.trim().length < 3
          }
        >
          Buscar
        </button>
      </div>

      {isSearchDisabled && (
        <p className="mt-3 text-red-500">
          Por favor, seleccione { !selectedOriginStore ? 'la tienda origen' : 'la tienda destino' } antes de buscar.
        </p>
      )}

      {/* Modal para seleccionar el producto (cuando hay varios) */}
      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={modalProducts}
        onSelectProduct={handleSelectProduct}
        originShopId={selectedOriginStore}
        destinationShopId={selectedDestinationStore}
      />
    </div>
  );
};

export default ProductSearchCardForTransfer;