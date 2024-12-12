
import React, { useState, useEffect, useContext } from 'react';
import Modal from '../modals/Modal';
import { useApiFetch } from '../utils/useApiFetch';
import { ConfigContext } from '../../contexts/ConfigContext'

const ProductSearchCard = ({ onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedProductImage, setSelectedProductImage] = useState('');
  const [currentShop, setCurrentShop] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [productToConfirm, setProductToConfirm] = useState(null);
  const [clickedButtons, setClickedButtons] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { configData } = useContext(ConfigContext);
  const allowOutOfStockSales = configData ? configData.allow_out_of_stock_sales : false;

  const apiFetch = useApiFetch(); // Usamos el hook personalizado

  useEffect(() => {
    // Cargamos la configuración de la sesión para obtener la tienda en curso
    const shopData = JSON.parse(localStorage.getItem('shop'));
    setCurrentShop(shopData);
  }, []);

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
  };

  const handleKeyDown = async (event) => {
    // Solo realiza la búsqueda si el término tiene al menos 3 caracteres y se presiona Enter
    if (event.key === 'Enter' && searchTerm.length >= 3) {
      setIsLoading(true); // Inicia la carga
      try {
        const results = await apiFetch(`https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(searchTerm)}`, {
          method: 'GET',
        });

        const filteredForCurrentShop = results.filter(
          (product) => product.id_shop === currentShop.id_shop
        );

        setFilteredProducts(groupProductsByProductName(results));

        // Verificamos si solo hay un producto para la tienda actual
        if (filteredForCurrentShop.length === 1) {
          addProductToCart(filteredForCurrentShop[0]);
          // Limpiamos el campo de búsqueda
          setSearchTerm('');
        }
      } catch (error) {
        console.error('Error en la búsqueda:', error);
        alert('Error al buscar productos. Inténtalo de nuevo más tarde.');
      } finally {
        setIsLoading(false); // Finaliza la carga
      }
    }
  };

  const groupProductsByProductName = (products) => {
    const grouped = products.reduce((acc, product) => {
      const existingGroup = acc.find((group) => group.product_name === product.product_name);
      if (existingGroup) {
        const existingCombination = existingGroup.combinations.find(
          (combination) => combination.id_product_attribute === product.id_product_attribute
        );
        if (existingCombination) {
          existingCombination.stocks.push({
            shop_name: product.shop_name,
            id_shop: product.id_shop,
            quantity: product.quantity,
            id_stock_available: product.id_stock_available,
          });
        } else {
          existingGroup.combinations.push({
            ...product,
            stocks: [{
              shop_name: product.shop_name,
              id_shop: product.id_shop,
              quantity: product.quantity,
              id_stock_available: product.id_stock_available,
            }],
          });
        }
      } else {
        acc.push({
          product_name: product.product_name,
          image_url: product.image_url,
          combinations: [
            {
              ...product,
              stocks: [{
                shop_name: product.shop_name,
                id_shop: product.id_shop,
                quantity: product.quantity,
                id_stock_available: product.id_stock_available,
              }],
            },
          ],
        });
      }
      return acc;
    }, []);
    return grouped;
  };

  const getStockForCurrentShop = (stocks) => {
    if (!Array.isArray(stocks) || !currentShop) {
      return 0; // Devolvemos 0 si stocks no es un array o si no hay tienda configurada
    }

    const currentShopStock = stocks.find((stock) => stock.id_shop === currentShop.id_shop);
    return currentShopStock ? currentShopStock.quantity : 0;
  };

  const addProductToCart = (product) => {
    // Filtrar los stocks para obtener solo el stock de la tienda actual

    console.log('product:', product);

    let currentShopStock = null;
    if (Array.isArray(product.stocks)) {
      currentShopStock = product.stocks.find(
        (stock) => stock.id_shop === currentShop.id_shop
      );
    } else {
      currentShopStock = {
        shop_name: product.shop_name,
        id_shop: product.id_shop,
        quantity: product.quantity,
        id_stock_available: product.id_stock_available,
      };
    }
    const stockQuantity = currentShopStock ? currentShopStock.quantity : 0;

    // Verificar si se permite vender sin stock
    if (!allowOutOfStockSales && stockQuantity <= 0) {
      alert('No puedes añadir este producto porque no hay stock disponible.');
      return;
    }

    console.log('currentShopStock:', currentShopStock);

    // Crear un nuevo objeto de producto que solo contenga los datos de la tienda actual
    const productForCart = {
      id_product: product.id_product,
      id_product_attribute: product.id_product_attribute,
      id_stock_available: currentShopStock.id_stock_available, // Aseguramos que está incluido
      product_name: product.product_name,
      combination_name: product.combination_name,
      reference_combination: product.reference_combination,
      ean13_combination: product.ean13_combination,
      price_incl_tax: product.price_incl_tax,
      final_price_incl_tax: product.final_price_incl_tax,
      tax_rate: product.tax_rate,
      image_url: product.image_url,
      quantity: 1,
      shop_name: currentShop.name,
      id_shop: currentShop.id_shop,
      // Agrega otros campos necesarios específicos de la tienda actual
    };

    // Llamamos a la función onAddProduct y pasamos el stockQuantity para que se maneje en el carrito
    onAddProduct(
      productForCart,
      stockQuantity,
      (exceedsStock) => {
        if (exceedsStock) {
          // Si se excede el stock y allowOutOfStockSales es true, mostramos el modal de confirmación
          setProductToConfirm(productForCart);
          setConfirmModalOpen(true);
        }
      }
    );
  };

  const handleProductClick = (imageUrl) => {
    setSelectedProductImage(imageUrl);
    setModalOpen(true);
  };

  const handleConfirmAdd = () => {
    // Añadimos el producto aunque supere el stock
    onAddProduct(productToConfirm, null, null, null, true);
    setConfirmModalOpen(false);
    setProductToConfirm(null);
  };

  const handleCancelAdd = () => {
    setConfirmModalOpen(false);
    setProductToConfirm(null);
  };

  // Función para manejar la animación del botón "Añadir"
  const handleAddToCartWithAnimation = (product) => {
    addProductToCart(product);
    setClickedButtons((prev) => ({ ...prev, [product.id_product_attribute]: true }));
    setTimeout(() => {
      setClickedButtons((prev) => ({ ...prev, [product.id_product_attribute]: false }));
    }, 300); // Duración de la animación (más rápida)
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {/* Ícono de lupa */}
          <svg
            className="h-5 w-5 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar por referencia o código de barras..."
          className="border rounded pl-10 pr-10 py-2 w-full"
          value={searchTerm}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
          </div>
        )}
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 226px)' }}>
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 text-left font-semibold">Combinación</th>
              <th className="py-3 px-4 text-left font-semibold">Referencia</th>
              <th className="py-3 px-4 text-left font-semibold">Cod. Barras</th>
              <th className="py-3 px-4 text-left font-semibold">Precio</th>
              <th className="py-3 px-4 text-left font-semibold">Cantidad</th>
              <th className="py-3 px-4 text-left font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((productGroup) => (
              <React.Fragment key={productGroup.product_name}>
                <tr className="bg-gray-50">
                  <td
                    colSpan="6"
                    className="py-4 px-4 font-bold text-lg cursor-pointer"
                    onClick={() => handleProductClick(productGroup.image_url)}
                  >
                    {productGroup.product_name}
                  </td>
                </tr>
                {productGroup.combinations.map((product, index) => (
                  <tr
                    key={`${product.id_product}_${product.id_product_attribute}`}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="py-3 px-4 text-gray-700">
                      {product.combination_name}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {product.reference_combination}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {product.ean13_combination}
                    </td>
                    <td className="py-3 px-4">
                      {product.final_price_incl_tax !== product.price_incl_tax ? (
                        <div>
                          <span className="line-through text-sm text-gray-500">
                            {product.price_incl_tax.toFixed(2)} €
                          </span>
                          <br />
                          <span className="text-red-500 font-semibold">
                            {product.final_price_incl_tax.toFixed(2)} €
                          </span>
                        </div>
                      ) : (
                        <span>{product.price_incl_tax.toFixed(2)} €</span>
                      )}
                    </td>
                    <td className="py-3 px-4 relative group text-center">
                      <span>{getStockForCurrentShop(product.stocks)}</span>
                      <div className="absolute left-0 mt-1 hidden group-hover:block bg-white border border-gray-300 text-gray-700 text-xs rounded p-2 shadow-lg z-10">
                        {Array.isArray(product.stocks) ? (
                          product.stocks
                            .filter((stock) => stock.id_shop !== 1)
                            .map((stock, stockIndex) => (
                              <div key={`${stock.shop_name}_${stockIndex}`}>
                                {stock.shop_name}: {stock.quantity}
                              </div>
                            ))
                        ) : (
                          <div>No hay información de stock disponible</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        className={`px-3 py-2 rounded transition-colors duration-300 ${
                          clickedButtons[product.id_product_attribute]
                            ? 'bg-green-500'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                        onClick={() => handleAddToCartWithAnimation(product)}
                      >
                        {/* Ícono de añadir */}
                        <svg
                          className="h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para mostrar la imagen del producto */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <img src={selectedProductImage} alt="Imagen del producto" className="w-full h-auto" />
      </Modal>

      {/* Modal de confirmación para vender sin stock */}
      <Modal isOpen={confirmModalOpen} onClose={handleCancelAdd}>
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Máximo de unidades disponibles</h2>
          <p>¿Deseas vender sin stock?</p>
          <div className="mt-4 flex justify-end space-x-2">
            <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleCancelAdd}>
              No
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleConfirmAdd}>
              Sí
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductSearchCard;
