// src/components/ProductSearch/ProductSearchCard.jsx

import React, { useState, useEffect, useContext } from "react";
import { Dialog } from "primereact/dialog";
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
    // Si se presiona Enter y el término empieza con '#', buscar un vale descuento
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
    <div style={{ padding: "1rem", height: "100%" }}>
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "0.75rem",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <svg
            style={{
              height: "1.25rem",
              width: "1.25rem",
              color: "var(--text-secondary)",
            }}
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
          value={searchTerm}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.5rem 2.5rem",
            border: "1px solid var(--surface-border)",
            borderRadius: "4px",
          }}
        />
        {isLoading && (
          <div
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <svg
              style={{
                height: "1.25rem",
                width: "1.25rem",
                animation: "spin 2s linear infinite",
                color: "var(--text-secondary)",
              }}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                style={{ opacity: 0.25 }}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                style={{ opacity: 0.75 }}
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v8H4z"
              />
            </svg>
          </div>
        )}
      </div>

      <div style={{ overflowY: "auto" }}>
        <table
          style={{
            width: "100%",
            backgroundColor: "white",
            border: "1px solid var(--surface-border)",
            borderRadius: "0.5rem",
          }}
        >
          <thead
            style={{
              backgroundColor: "var(--surface-100)",
              color: "var(--text-color)",
              position: "sticky",
              top: "0",
              zIndex: 1,
              borderBottom: "1px solid var(--surface-border)",
            }}
          >
            <tr>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              >
                Combinación
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              >
                Referencia
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              >
                Cod. Barras
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              >
                Precio
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              >
                Cantidad
              </th>
              <th
                style={{
                  padding: "0.75rem",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((productGroup) => (
              <React.Fragment key={productGroup.product_name}>
                <tr style={{ backgroundColor: "var(--surface-50)" }}>
                  <td
                    colSpan="6"
                    style={{
                      padding: "1rem",
                      fontWeight: "bold",
                      fontSize: "1.125rem",
                      cursor: "pointer",
                    }}
                    onClick={() => handleProductClick(productGroup.image_url)}
                  >
                    {productGroup.product_name}
                  </td>
                </tr>
                {productGroup.combinations.map((product, index) => {
                  const rowBg = index % 2 === 0 ? "white" : "var(--surface-50)";
                  return (
                    <tr
                      key={`${product.id_product}_${product.id_product_attribute}`}
                      style={{ backgroundColor: rowBg }}
                    >
                      <td
                        onClick={() => onClickProduct?.(product)}
                        style={{ cursor: "pointer", padding: "0.75rem" }}
                      >
                        {product.combination_name}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          color: "var(--text-color)",
                        }}
                      >
                        {product.reference_combination}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          color: "var(--text-color)",
                        }}
                      >
                        {product.ean13_combination}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span>{product.price} €</span>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "center",
                          position: "relative",
                        }}
                      >
                        <span>{getStockForCurrentShop(product.stocks)}</span>
                        <div
                          style={{
                            position: "absolute",
                            left: "0",
                            marginTop: "0.25rem",
                            display: "none",
                            backgroundColor: "white",
                            border: "1px solid var(--surface-border)",
                            color: "var(--text-color)",
                            fontSize: "0.75rem",
                            borderRadius: "4px",
                            padding: "0.25rem",
                            boxShadow: "var(--shadow-1)",
                            zIndex: 10,
                          }}
                          className="hover-tooltip"
                        >
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
                      <td style={{ padding: "0.75rem", textAlign: "center" }}>
                        <Button
                          icon="pi pi-plus"
                          style={{
                            backgroundColor: clickedButtons[
                              product.id_product_attribute
                            ]
                              ? "var(--success-color)"
                              : "var(--primary-color)",
                            color: "white",
                          }}
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
        header=""
        visible={isImageModalOpen}
        onHide={() => setImageModalOpen(false)}
        modal
        style={{ width: "50vw" }}
      >
        <img
          src={selectedProductImage}
          alt="Imagen del producto"
          style={{ width: "100%", height: "auto" }}
        />
      </Dialog>

      {/* Modal para confirmar producto sin stock */}
      <Dialog
        header="Máximo de unidades"
        visible={confirmModalOpen}
        onHide={handleCancelAdd}
        modal
        style={{ width: "30vw" }}
      >
        <div style={{ padding: "1rem" }}>
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            Máximo de unidades
          </h2>
          <p>¿Deseas vender sin stock?</p>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
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
