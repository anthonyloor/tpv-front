// src/components/ProductSearch/ProductSearchCard.jsx

import React, { useState, useEffect, useContext } from 'react';
import Modal from '../modals/Modal';
import { useApiFetch } from '../utils/useApiFetch';
import { ConfigContext } from '../../contexts/ConfigContext';
import { toast } from 'sonner';

const ProductSearchCard = ({ onAddProduct, onAddDiscount, onClickProduct }) => {
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
  const apiFetch = useApiFetch();

  useEffect(() => {
    const shopData = JSON.parse(localStorage.getItem('shop'));
    setCurrentShop(shopData);
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleKeyDown = async (event) => {
    // Si se presiona Enter y el término empieza con '#', buscar un vale descuento
    if (event.key === 'Enter' && searchTerm.startsWith('#')) {
      const code = searchTerm.slice(1); // Quitar el '#'
      setIsLoading(true);
      try {
        const data = await apiFetch(`https://apitpv.anthonyloor.com/get_cart_rule?code=${encodeURIComponent(code)}`, {
          method: 'GET',
        });

        // Verificar si el vale está activo
        if (!data.active) {
          alert('Vale descuento no válido, motivo: no activo');
          setSearchTerm('');
          return;
        }

        // Verificar si el vale pertenece al cliente seleccionado (si se ha seleccionado uno)
        const client = JSON.parse(localStorage.getItem('selectedClient'));
        if (client && data.id_customer && client.id_customer !== data.id_customer) {
          alert('Vale descuento no válido, motivo: no pertenece al cliente seleccionado');
          setSearchTerm('');
          return;
        }

        if (data && onAddDiscount) {
          const discObj = {
            name: data.name || '',
            description: data.description || '',
            code: data.code || '',
            reduction_amount: data.reduction_amount || 0,
            reduction_percent: data.reduction_percent || 0,
          };
          onAddDiscount(discObj);
        }
        setSearchTerm('');
      } catch (error) {
        console.error('Error al buscar vale descuento:', error);
        alert('Error al buscar el vale. Intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
      return; // Salir para no continuar con búsqueda de productos
    }

    // Lógica existente para búsqueda de productos
    if (event.key === 'Enter' && searchTerm.length >= 3) {
      setIsLoading(true);
      try {
      const results = await apiFetch(
        `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(searchTerm)}`,
        { method: 'GET' }
      );
      const validResults = results.filter(product =>
        !(product.id_product_attribute === null &&
        product.ean13_combination === null &&
        product.ean13_combination_0 === null)
      );
      const filteredForCurrentShop = validResults.filter(
        (product) => product.id_shop === currentShop.id_shop
      );
      setFilteredProducts(groupProductsByProductName(validResults));
      if (filteredForCurrentShop.length === 1) {
        addProductToCart(filteredForCurrentShop[0]);
        setSearchTerm('');
      }
      } catch (error) {
      console.error('Error en la búsqueda:', error);
      alert('Error al buscar productos. Inténtalo de nuevo más tarde.');
      } finally {
      setIsLoading(false);
      }
    }
    };

    const groupProductsByProductName = (products) => {
    // Filtrar solo los productos donde los tres campos son nulos
    const validProducts = products.filter(product =>
      !(product.id_product_attribute === null &&
      product.ean13_combination === null &&
      product.ean13_combination_0 === null)
    );
    return validProducts.reduce((acc, product) => {
      const existingGroup = acc.find(
      (group) => group.product_name === product.product_name
      );
      if (existingGroup) {
      const existingCombination = existingGroup.combinations.find(
        (combination) =>
        combination.id_product_attribute === product.id_product_attribute
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
        stocks: [
          {
          shop_name: product.shop_name,
          id_shop: product.id_shop,
          quantity: product.quantity,
          id_stock_available: product.id_stock_available,
          },
        ],
        });
      }
      } else {
      acc.push({
        product_name: product.product_name,
        image_url: product.image_url,
        combinations: [
        {
          ...product,
          stocks: [
          {
            shop_name: product.shop_name,
            id_shop: product.id_shop,
            quantity: product.quantity,
            id_stock_available: product.id_stock_available,
          },
          ],
        },
        ],
      });
      }
      return acc;
    }, []);
    };

  const getStockForCurrentShop = (stocks) => {
    if (!Array.isArray(stocks) || !currentShop) return 0;
    const currentShopStock = stocks.find(
      (stock) => stock.id_shop === currentShop.id_shop
    );
    return currentShopStock ? currentShopStock.quantity : 0;
  };

  const addProductToCart = (product) => {
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
    if (!allowOutOfStockSales && stockQuantity <= 0) {
      toast.error('Sin stock disponible. No se permite la venta sin stock.');
      return;
    }
    const priceWithIVA = product.price;
    const productForCart = {
      id_product: product.id_product,
      id_product_attribute: product.id_product_attribute,
      id_stock_available: currentShopStock.id_stock_available,
      product_name: product.product_name,
      combination_name: product.combination_name,
      reference_combination: product.reference_combination,
      ean13_combination: product.id_product_attribute ? product.ean13_combination : product.ean13_combination_0,
      price_incl_tax: priceWithIVA,  // usando price directamente
      final_price_incl_tax: priceWithIVA,
      tax_rate: 0.21,
      image_url: product.image_url,
      quantity: 1,
      shop_name: currentShop.name,
      id_shop: currentShop.id_shop,
    };
    console.log('Product for cart:', productForCart);
    onAddProduct(productForCart, stockQuantity, (exceedsStock) => {
      if (exceedsStock) {
        setProductToConfirm(productForCart);
        setConfirmModalOpen(true);
      } else {
        toast.success('Producto añadido al ticket');
      }
    });
  };

  const handleProductClick = (imageUrl) => {
    setSelectedProductImage(imageUrl);
    setModalOpen(true);
  };

  const handleConfirmAdd = () => {
    onAddProduct(productToConfirm, null, null, true, 1);
    toast.success('Producto sin stock añadido al ticket');
    setConfirmModalOpen(false);
    setProductToConfirm(null);
  };

  const handleCancelAdd = () => {
    setConfirmModalOpen(false);
    setProductToConfirm(null);
  };

  const handleAddToCartWithAnimation = (product) => {
    addProductToCart(product);
    setClickedButtons((prev) => ({
      ...prev,
      [product.id_product_attribute]: true,
    }));
    setTimeout(() => {
      setClickedButtons((prev) => ({
        ...prev,
        [product.id_product_attribute]: false,
      }));
    }, 300);
  };

  return (
    <div className="p-4 h-full">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v8H4z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="overflow-y-auto">
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
                {productGroup.combinations.map((product, index) => {
                  const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                  return (
                    <tr key={`${product.id_product}_${product.id_product_attribute}`} className={rowClass}>
                      <td
                        onClick={() => onClickProduct?.(product)}
                        className="cursor-pointer hover:bg-gray-100">{product.combination_name}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{product.reference_combination}</td>
                      <td className="py-3 px-4 text-gray-700">{product.ean13_combination}</td>
                      <td className="py-3 px-4">
                        <span>{product.price} €</span>
                      </td>
                      <td className="py-3 px-4 relative group text-center">
                        <span>{getStockForCurrentShop(product.stocks)}</span>
                        <div className="absolute left-0 mt-1 hidden group-hover:block bg-white border border-gray-300 text-gray-700 text-xs rounded p-2 shadow-lg z-10">
                          {Array.isArray(product.stocks) ? (
                            product.stocks
                              .filter((s) => s.id_shop !== 1)
                              .map((stock, stockIndex) => (
                                <div key={`${stock.shop_name}_${stockIndex}`}>
                                  {stock.shop_name}: {stock.quantity}
                                </div>
                              ))
                          ) : (
                            <div>No hay información de stock</div>
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
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <img src={selectedProductImage} alt="Imagen del producto" className="w-full h-auto" />
      </Modal>

      <Modal isOpen={confirmModalOpen} onClose={handleCancelAdd}>
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Máximo de unidades</h2>
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