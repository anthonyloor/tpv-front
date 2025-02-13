// src/components/ProductSearch/ProductSearchCard.jsx

import React, { useState, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { AuthContext } from "../../contexts/AuthContext";
import { useApiFetch } from "../utils/useApiFetch";
import { ConfigContext } from "../../contexts/ConfigContext";
import { toast } from "sonner";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TabView, TabPanel } from "primereact/tabview";

const ProductSearchCard = ({ onAddProduct, onAddDiscount, onClickProduct }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [productToConfirm, setProductToConfirm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  const { configData } = useContext(ConfigContext);
  const { shopId, shopName } = useContext(AuthContext);
  const allowOutOfStockSales = configData?.allow_out_of_stock_sales || false;
  const apiFetch = useApiFetch();

  // Función de agrupación para el modo "tab"
  const groupProductsByProductName = (products) => {
    const validProducts = products.filter(
      (product) =>
        product.id_product_attribute !== null ||
        product.ean13_combination !== null ||
        product.ean13_combination_0 !== null
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
          name_category: product.name_category,
          link_rewrite: product.link_rewrite,
          id_product: product.id_product,
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

  // Lógica de búsqueda (similar a la anterior)
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
        setFilteredProducts([]);
        setSelectedProduct(null);
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
            product.id_product_attribute !== null ||
            product.ean13_combination !== null ||
            product.ean13_combination_0 !== null
        );
        const filteredForCurrentShop = validResults.filter(
          (product) => product.id_shop === shopId
        );
        if (filteredForCurrentShop.length === 1) {
          // Si solo hay un resultado, lo agregamos automáticamente
          addProductToCart(filteredForCurrentShop[0]);
          setSearchTerm("");
          setFilteredProducts([]);
          setSelectedProduct(null);
          return;
        }
        setFilteredProducts(validResults);
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
    // Búsqueda normal sin acción automática de añadir
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
          product.id_product_attribute !== null ||
          product.ean13_combination !== null ||
          product.ean13_combination_0 !== null
      );
      setFilteredProducts(validResults);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      alert("Error al buscar productos. Inténtalo de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para agregar producto al carrito
  const addProductToCart = (product) => {
    let currentShopStock = null;
    if (Array.isArray(product.stocks)) {
      currentShopStock = product.stocks.find(
        (stock) => stock.id_shop === shopId
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
      shop_name: shopName,
      id_shop: shopId,
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

  // Modo "tabla": al seleccionar una fila se asigna el producto
  const onRowSelect = (e) => {
    setSelectedProduct(e.data);
    if (onClickProduct) onClickProduct(e.data);
  };

  // Plantillas para el DataTable (modo tabla)
  const nameBodyTemplate = (rowData) => rowData.product_name;
  const colorBodyTemplate = (rowData) => {
    if (rowData.combination_name) {
      const parts = rowData.combination_name.split(" - ");
      return parts[0] || "";
    }
    return "";
  };
  const tallaBodyTemplate = (rowData) => {
    if (rowData.combination_name) {
      const parts = rowData.combination_name.split(" - ");
      return parts[1] || "";
    }
    return "";
  };
  const priceBodyTemplate = (rowData) => rowData.price.toFixed(2) + " €";
  const quantityBodyTemplate = (rowData) => rowData.quantity;

  // Función para renderizar stock (modo tabla) debajo del DataTable
  const renderStockInfo = () => {
    if (!selectedProduct || !selectedProduct.stocks) return null;
    return (
      <div
        className="mt-4 p-3 border rounded"
        style={{ borderColor: "var(--surface-border)" }}
      >
        <h5 className="font-bold mb-2">
          Stock para {selectedProduct.product_name}
        </h5>
        <ul>
          {selectedProduct.stocks.map((stock) => (
            <li key={stock.id_stock_available}>
              {stock.shop_name}: {stock.quantity}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Modo "tab": agrupar productos por nombre
  const groupedProducts = groupProductsByProductName(filteredProducts);

  // Nueva función para renderizar contenido en modo pestañas en formato horizontal
  const renderTabContent = (group) => {
    return (
      <div className="flex flex-row p-3 gap-4">
        {/* Área para imagen (placeholder o imagen real) */}
        <div
          className="w-1/4 flex items-center justify-center border rounded"
          style={{ minHeight: "150px" }}
        >
          {group.image_url ? (
            <img
              src={group.image_url}
              alt={group.product_name}
              className="max-h-32"
            />
          ) : (
            <span className="text-gray-500">Sin imagen</span>
          )}
        </div>
        {/* Información del producto */}
        <div className="flex-grow">
          <h5 className="font-bold text-lg">{group.product_name}</h5>
          {/* Mostrar cada combinación (color y talla) en formato horizontal */}
          {group.combinations.map((combo, index) => {
            const parts = combo.combination_name
              ? combo.combination_name.split(" - ")
              : ["Sin asignar", ""];
            const color = parts[0] || "";
            const talla = parts[1] || "";
            return (
              <div
                key={index}
                className="flex justify-between border-b pb-1 mb-1"
              >
                <div className="w-1/2">
                  <span className="font-medium">Color:</span> {color}
                </div>
                <div className="w-1/2">
                  <span className="font-medium">Talla:</span> {talla}
                </div>
              </div>
            );
          })}
          <div className="mt-2">
            <span className="font-bold">Precio: </span>
            {group.combinations[0]?.price?.toFixed(2)} €
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="p-3 h-full flex flex-col"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      {/* Fila de búsqueda y toggle de vista */}
      <div className="mb-4 flex items-center">
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
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full pl-9 pr-9 h-12"
            style={{
              borderColor: "var(--surface-border)",
              backgroundColor: "var(--surface-50)",
              color: "var(--text-color)",
            }}
          />
        </span>
        <div className="ml-2">
          <Button
            tooltip={
              viewMode === "table"
                ? "Cambiar a vista de pestañas"
                : "Cambiar a vista de tabla"
            }
            tooltipOptions={{ position: "bottom" }}
            icon={viewMode === "table" ? "pi pi-th-large" : "pi pi-table"}
            onClick={() => setViewMode(viewMode === "table" ? "tab" : "table")}
            className="p-button-secondary"
          />
        </div>
      </div>

      {/* Vista según modo seleccionado */}
      {viewMode === "table" ? (
        <>
          <div className="flex-1 overflow-auto">
            <DataTable
              value={filteredProducts}
              selectionMode="single"
              onRowSelect={onRowSelect}
              dataKey="id_stock_available"
              scrollable
              className="p-datatable-sm"
            >
              <Column
                field="product_name"
                header="Nombre producto"
                body={nameBodyTemplate}
              />
              <Column header="Color" body={colorBodyTemplate} />
              <Column header="Talla" body={tallaBodyTemplate} />
              <Column field="price" header="Precio" body={priceBodyTemplate} />
              <Column
                field="quantity"
                header="Cantidad"
                body={quantityBodyTemplate}
              />
            </DataTable>
          </div>
          {selectedProduct && renderStockInfo()}
        </>
      ) : (
        <div className="flex-1 overflow-auto">
          <TabView>
            {groupedProducts.map((group, index) => (
              <TabPanel key={index} header={group.product_name}>
                {renderTabContent(group)}
              </TabPanel>
            ))}
          </TabView>
        </div>
      )}

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
