// src/components/ProductSearch/ProductSearchCard.jsx

import React, { useState, useEffect, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { AuthContext } from "../../contexts/AuthContext";
import { useApiFetch } from "../utils/useApiFetch";
import { ConfigContext } from "../../contexts/ConfigContext";
import { toast } from "sonner";
import { Button } from "primereact/button";

const ProductSearchCard = ({ onAddProduct, onAddDiscount, onClickProduct }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [selectedProductImage, setSelectedProductImage] = useState("");
  const [currentShopId, setCurrentShopId] = useState(null);
  const [currentShopName, setCurrentShopName] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [productToConfirm, setProductToConfirm] = useState(null);
  const [clickedButtons, setClickedButtons] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { configData } = useContext(ConfigContext);
  const { shopId, shopName } = useContext(AuthContext);
  const allowOutOfStockSales = configData
    ? configData.allow_out_of_stock_sales
    : false;
  const apiFetch = useApiFetch();

  useEffect(() => {
    setCurrentShopId(shopId);
    setCurrentShopName(shopName);
  }, [shopId, shopName]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleKeyDown = async (event) => {
    // Si la búsqueda empieza con "#", se entiende que es un vale descuento
    if (event.key === "Enter" && searchTerm.startsWith("#")) {
      const code = searchTerm.slice(1);
      setIsLoading(true);
      try {
        const data = await apiFetch(
          `https://apitpv.anthonyloor.com/get_cart_rule?code=${encodeURIComponent(
            code
          )}`,
          { method: "GET" }
        );
        if (!data.active) {
          alert("Vale descuento no válido, motivo: no activo");
          setSearchTerm("");
          return;
        }
        const client = JSON.parse(localStorage.getItem("selectedClient"));
        if (
          client &&
          data.id_customer &&
          client.id_customer !== data.id_customer
        ) {
          alert(
            "Vale descuento no válido, motivo: no pertenece al cliente seleccionado"
          );
          setSearchTerm("");
          return;
        }
        if (data && onAddDiscount) {
          const discObj = {
            name: data.name || "",
            description: data.description || "",
            code: data.code || "",
            reduction_amount: data.reduction_amount || 0,
            reduction_percent: data.reduction_percent || 0,
          };
          onAddDiscount(discObj);
        }
        setSearchTerm("");
      } catch (error) {
        console.error("Error al buscar vale descuento:", error);
        alert("Error al buscar el vale. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Búsqueda de productos
    if (event.key === "Enter" && searchTerm.length >= 3) {
      setIsLoading(true);
      try {
        const results = await apiFetch(
          `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
            searchTerm
          )}`,
          { method: "GET" }
        );
        const validResults = results.filter(
          (product) =>
            !(
              product.id_product_attribute === null &&
              product.ean13_combination === null &&
              product.ean13_combination_0 === null
            )
        );
        const filteredForCurrentShop = validResults.filter(
          (product) => product.id_shop === currentShopId
        );
        setFilteredProducts(groupProductsByProductName(validResults));
        if (filteredForCurrentShop.length === 1) {
          addProductToCart(filteredForCurrentShop[0]);
          setSearchTerm("");
        }
      } catch (error) {
        console.error("Error en la búsqueda:", error);
        alert("Error al buscar productos. Inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const groupProductsByProductName = (products) => {
    const validProducts = products.filter(
      (product) =>
        !(
          product.id_product_attribute === null &&
          product.ean13_combination === null &&
          product.ean13_combination_0 === null
        )
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
    if (!Array.isArray(stocks) || !currentShopId) return 0;
    const currentShopStock = stocks.find(
      (stock) => stock.id_shop === currentShopId
    );
    return currentShopStock ? currentShopStock.quantity : 0;
  };

  const addProductToCart = (product) => {
    let currentShopStock = null;
    if (Array.isArray(product.stocks)) {
      currentShopStock = product.stocks.find(
        (stock) => stock.id_shop === currentShopId
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
      toast.error("Sin stock disponible. No se permite la venta sin stock.");
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
      ean13_combination: product.id_product_attribute
        ? product.ean13_combination
        : product.ean13_combination_0,
      price_incl_tax: priceWithIVA,
      final_price_incl_tax: priceWithIVA,
      tax_rate: 0.21,
      image_url: product.image_url,
      quantity: 1,
      shop_name: currentShopName,
      id_shop: currentShopId,
    };
    console.log("Product for cart:", productForCart);
    onAddProduct(productForCart, stockQuantity, (exceedsStock) => {
      if (exceedsStock) {
        setProductToConfirm(productForCart);
        setConfirmModalOpen(true);
      } else {
        toast.success("Producto añadido al ticket");
      }
    });
  };

  const handleProductClick = (imageUrl) => {
    setSelectedProductImage(imageUrl);
    setImageModalOpen(true);
  };

  const handleConfirmAdd = () => {
    onAddProduct(productToConfirm, null, null, true, 1);
    toast.success("Producto sin stock añadido al ticket");
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
    <div
      className="p-3 h-full flex flex-col"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      {/* Buscador */}
      <div className="relative mb-4">
        <span className="p-input-icon-left w-full">
          <div className="p-input-icon-left">
            <i
              className="pi pi-search absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-secondary)" }}
            />
          </div>
          <InputText
            placeholder="Buscar por referencia o código de barras..."
            value={searchTerm}
            onChange={handleSearch}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full pl-9 pr-9"
            style={{
              borderColor: "var(--surface-border)",
              backgroundColor: "var(--surface-50)",
              color: "var(--text-color)",
            }}
          />
        </span>
        {isLoading && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg
              className="animate-spin h-5 w-5"
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

      {/* Listado de productos */}
      <div className="flex-1 overflow-auto">
        <table
          className="w-full border rounded"
          style={{
            borderColor: "var(--surface-border)",
            backgroundColor: "var(--surface-0)",
            color: "var(--text-color)",
          }}
        >
          <thead
            className="sticky top-0 z-10 border-b"
            style={{
              backgroundColor: "var(--surface-100)",
              color: "var(--text-color)",
              borderColor: "var(--surface-border)",
            }}
          >
            <tr>
              <th className="py-2 px-3 text-left font-semibold">Combinación</th>
              <th className="py-2 px-3 text-left font-semibold">Referencia</th>
              <th className="py-2 px-3 text-left font-semibold">Cod. Barras</th>
              <th className="py-2 px-3 text-left font-semibold">Precio</th>
              <th className="py-2 px-3 text-left font-semibold">Cantidad</th>
              <th className="py-2 px-3 text-left font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((productGroup) => (
              <React.Fragment key={productGroup.product_name}>
                {/* Fila "título" con nombre del producto */}
                <tr
                  style={{
                    backgroundColor: "var(--surface-50)",
                    color: "var(--text-color)",
                  }}
                >
                  <td
                    colSpan={6}
                    className="py-3 px-4 font-bold text-lg cursor-pointer"
                    onClick={() => handleProductClick(productGroup.image_url)}
                  >
                    {productGroup.product_name}
                  </td>
                </tr>
                {productGroup.combinations.map((product, index) => {
                  const rowBg =
                    index % 2 === 0 ? "var(--surface-0)" : "var(--surface-50)";
                  const isClicked =
                    clickedButtons[product.id_product_attribute];

                  return (
                    <tr
                      key={`${product.id_product}_${product.id_product_attribute}`}
                      style={{
                        backgroundColor: rowBg,
                        color: "var(--text-color)",
                      }}
                    >
                      <td
                        className="py-2 px-3 cursor-pointer"
                        onClick={() => onClickProduct?.(product)}
                      >
                        {product.combination_name}
                      </td>
                      <td className="py-2 px-3">
                        {product.reference_combination}
                      </td>
                      <td className="py-2 px-3">{product.ean13_combination}</td>
                      <td className="py-2 px-3">{product.price} €</td>
                      <td className="py-2 px-3 text-center relative">
                        {getStockForCurrentShop(product.stocks)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Button
                          icon="pi pi-plus"
                          className={`${
                            isClicked
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          } text-white border-none`}
                          onClick={() => handleAddToCartWithAnimation(product)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para imagen del producto */}
      <Dialog
        header="Imagen del Producto"
        visible={isImageModalOpen}
        onHide={() => setImageModalOpen(false)}
        modal
        style={{ width: "50vw", backgroundColor: "var(--surface-0)" }}
      >
        <div className="p-2" style={{ color: "var(--text-color)" }}>
          <img
            src={selectedProductImage}
            alt="Imagen del producto"
            className="w-full h-auto"
            style={{ borderRadius: "0.25rem" }}
          />
        </div>
      </Dialog>

      {/* Modal para confirmar producto sin stock */}
      <Dialog
        header="Máximo de unidades"
        visible={confirmModalOpen}
        onHide={handleCancelAdd}
        modal
        style={{ width: "30vw", backgroundColor: "var(--surface-0)" }}
      >
        <div className="p-4" style={{ color: "var(--text-color)" }}>
          <h2 className="text-lg font-bold mb-4">Máximo de unidades</h2>
          <p>¿Deseas vender sin stock?</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              label="No"
              className="p-button-danger"
              onClick={handleCancelAdd}
            />
            <Button
              label="Sí"
              className="p-button-success"
              onClick={handleConfirmAdd}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ProductSearchCard;
