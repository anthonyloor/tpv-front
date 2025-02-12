// src/components/ProductSearch/ProductSearchCard.jsx

import React, { useState, useEffect, useContext, useRef } from "react";
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
  const [isLoading, setIsLoading] = useState(false);

  const { configData } = useContext(ConfigContext);
  const { shopId, shopName } = useContext(AuthContext);
  const allowOutOfStockSales = configData?.allow_out_of_stock_sales || false;
  const apiFetch = useApiFetch();

  // Ref para el input de búsqueda
  const searchInputRef = useRef(null);

  useEffect(() => {
    setCurrentShopId(shopId);
    setCurrentShopName(shopName);
  }, [shopId, shopName]);

  // Función auxiliar para agrupar productos (se conserva la lógica original)
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

  // Función auxiliar para detectar si existe algún modal o dialog abierto
  const isAnyModalOpen = () => {
    return document.querySelector('[role="dialog"]') !== null;
  };

  // Solo re-enfocar el input si no hay ningún modal abierto
  const handleContainerClick = () => {
    if (
      !isAnyModalOpen() &&
      !isImageModalOpen &&
      !confirmModalOpen &&
      searchInputRef.current
    ) {
      searchInputRef.current.focus();
    }
  };

  const handleInputBlur = () => {
    if (
      !isAnyModalOpen() &&
      !isImageModalOpen &&
      !confirmModalOpen &&
      searchInputRef.current
    ) {
      searchInputRef.current.focus();
    }
  };

  // Nueva lógica en el onKeyDown
  const handleKeyDown = async (event) => {
    if (event.key !== "Enter") return;
    // Si el texto empieza con "#", se procesa como descuento
    if (searchTerm.startsWith("#")) {
      setIsLoading(true);
      try {
        const code = searchTerm.slice(1);
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

    // Expresiones regulares para detectar EAN13
    const ean13Regex = /^\d{13}$/;
    const ean13HyphenRegex = /^\d{13}-\d+$/;

    if (ean13Regex.test(searchTerm)) {
      // Caso: EAN13 puro
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
          // Agregar producto automáticamente
          addProductToCart(filteredForCurrentShop[0]);
          setSearchTerm("");
        }
      } catch (error) {
        console.error("Error en la búsqueda por EAN13:", error);
        alert("Error al buscar producto por EAN13. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (ean13HyphenRegex.test(searchTerm)) {
      // Caso: EAN13 con guion y número (por ejemplo, "5006503289541-50")
      alert("Se añade producto por ean13 + id_stock");
      setSearchTerm("");
      return;
    }

    // Caso normal: búsqueda sin acción automática de añadir
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
      setFilteredProducts(groupProductsByProductName(validResults));
      // En este caso no se añade producto automáticamente
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      alert("Error al buscar productos. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para agregar producto (lógica actual)
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

  return (
    <div
      className="p-3 h-full flex flex-col"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
      onClick={handleContainerClick}
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
            ref={searchInputRef}
            placeholder="Buscar por referencia o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            disabled={isLoading}
            className="w-full pl-9 pr-9"
            style={{
              borderColor: "var(--surface-border)",
              backgroundColor: "var(--surface-50)",
              color: "var(--text-color)",
            }}
            autoFocus
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
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((productGroup) => (
              <React.Fragment key={productGroup.product_name}>
                <tr
                  style={{
                    backgroundColor: "var(--surface-50)",
                    color: "var(--text-color)",
                  }}
                  onClick={() => handleProductClick(productGroup.image_url)}
                >
                  <td
                    colSpan={5}
                    className="py-3 px-4 font-bold text-lg cursor-pointer"
                  >
                    {productGroup.product_name}
                  </td>
                </tr>
                {productGroup.combinations.map((product, index) => {
                  const rowBg =
                    index % 2 === 0 ? "var(--surface-0)" : "var(--surface-50)";
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
                      <td className="py-2 px-3 text-center">
                        {product.quantity || 0}
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
        closable={false}
        draggable={false}
        resizable={false}
        style={{ width: "20vw", backgroundColor: "var(--surface-0)" }}
      >
        <div className="p-2" style={{ color: "var(--text-color)" }}>
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
