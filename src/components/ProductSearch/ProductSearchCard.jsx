// src/components/ProductSearch/ProductSearchCard.jsx

import React, { useState, useContext, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { AuthContext } from "../../contexts/AuthContext";
import { useApiFetch } from "../utils/useApiFetch";
import { ConfigContext } from "../../contexts/ConfigContext";
import { toast } from "sonner";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const ProductSearchCard = ({ onAddProduct, onAddDiscount, onClickProduct }) => {
  const [searchTerm, setSearchTerm] = useState("");
  // groupedProducts contendrá el resultado de agrupar los productos por nombre
  const [groupedProducts, setGroupedProducts] = useState([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [productToConfirm, setProductToConfirm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { configData } = useContext(ConfigContext);
  const { shopId, shopName } = useContext(AuthContext);
  const allowOutOfStockSales = configData?.allow_out_of_stock_sales || false;
  const apiFetch = useApiFetch();

  const searchInputRef = useRef(null);

  // Efecto que asegura que, cuando searchTerm queda vacío, se haga focus en el input
  useEffect(() => {
    if (searchTerm === "" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTerm]);

  // Función de agrupación (se conserva la lógica original)
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
      const productStock = {
        shop_name: product.shop_name,
        id_shop: product.id_shop,
        quantity: product.quantity,
        id_stock_available: product.id_stock_available,
      };
      if (existingGroup) {
        const existingCombination = existingGroup.combinations.find(
          (combination) =>
            combination.id_product_attribute === product.id_product_attribute
        );
        if (existingCombination) {
          existingCombination.stocks.push(productStock);
        } else {
          existingGroup.combinations.push({
            ...product,
            stocks: [productStock],
          });
        }
      } else {
        acc.push({
          product_name: product.product_name,
          image_url: product.image_url,
          combinations: [
            {
              ...product,
              stocks: [productStock],
            },
          ],
        });
      }
      return acc;
    }, []);
  };

  // Para detectar si hay algún modal abierto y así forzar el foco en el input
  const isAnyModalOpen = () => {
    return document.querySelector('[role="dialog"]') !== null;
  };

  const handleContainerClick = () => {
    if (!isAnyModalOpen() && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleInputBlur = () => {
    if (!isAnyModalOpen() && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Funciones para el modal de confirmación (definidas para corregir ESLint)
  const handleCancelAdd = () => {
    setConfirmModalOpen(false);
    setProductToConfirm(null);
  };

  const handleConfirmAdd = () => {
    // Se fuerza la adición aunque exceda stock
    onAddProduct(productToConfirm, null, null, true, 1);
    toast.success("Producto sin stock añadido al ticket");
    setConfirmModalOpen(false);
    setProductToConfirm(null);
  };

  // Lógica de búsqueda
  const handleKeyDown = async (event) => {
    if (event.key !== "Enter") return;
    // Caso descuento: si inicia con "#"
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
          setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 100);
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
          setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 100);
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
        setGroupedProducts([]);
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 100);
      } catch (error) {
        console.error("Error al buscar vale descuento:", error);
        alert("Error al buscar el vale. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Expresiones regulares para EAN13
    const ean13Regex = /^\d{13}$/;
    const ean13ApostropheRegex = /^(\d{13})'(\d+)$/;
    if (ean13Regex.test(searchTerm)) {
      // Caso EAN13
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
        // Filtrar solo los productos de la tienda actual
        const filteredForCurrentShop = validResults.filter(
          (product) => product.id_shop === shopId
        );
        const groups = groupProductsByProductName(validResults);
        setGroupedProducts(groups);
        if (filteredForCurrentShop.length === 1) {
          // Si solo hay un resultado para la tienda actual, agregar automáticamente
          addProductToCart(filteredForCurrentShop[0]);
          setSearchTerm("");
          setGroupedProducts([]);
          setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 100);
          return;
        }
      } catch (error) {
        console.error("Error en la búsqueda por EAN13:", error);
        alert("Error al buscar producto por EAN13. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (ean13ApostropheRegex.test(searchTerm)) {
      setIsLoading(true);
      try {
        const [, eanCode, controlId] = searchTerm.match(ean13ApostropheRegex);
        const results = await apiFetch(
          `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
            eanCode
          )}`,
          { method: "GET" }
        );
        const validResults = results.filter(
          (p) =>
            (p.ean13_combination === eanCode ||
              p.ean13_combination_0 === eanCode) &&
            `${p.id_control_stock}` === controlId
        );
        if (validResults.length === 1) {
          addProductToCart(validResults[0]);
          setSearchTerm("");
          setGroupedProducts([]);
        } else {
          setGroupedProducts(groupProductsByProductName(validResults));
        }
      } catch (error) {
        console.error("Error en la búsqueda por EAN13 con apóstrofe:", error);
        alert(
          "Error al buscar producto por EAN13 con apóstrofe. Inténtalo de nuevo."
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Búsqueda normal sin acción automática
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
      const groups = groupProductsByProductName(validResults);
      setGroupedProducts(groups);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
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
      product_name: `${product.product_name} ${product.combination_name}`,
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
      id_control_stock: product.id_control_stock,
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

  // Al seleccionar una fila en el DataTable, asigna el producto (combinación) seleccionada
  const onRowSelect = (e) => {
    if (onClickProduct) onClickProduct(e.data);
  };

  // --- Plantillas para las columnas del DataTable ---
  const combinationBodyTemplate = (rowData) => rowData.combination_name;
  const referenceBodyTemplate = (rowData) => rowData.reference_combination;
  const eanBodyTemplate = (rowData) => rowData.ean13_combination;
  const priceBodyTemplate = (rowData) => rowData.price.toFixed(2) + " €";
  const quantityBodyTemplate = (rowData) => rowData.quantity;

  // Template para el encabezado de grupo
  const groupHeaderTemplate = (groupValue) => {
    return (
      <div
        className="p-2 font-bold"
        style={{
          backgroundColor: "var(--surface-100)",
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        {groupValue}
      </div>
    );
  };

  // Aplanamos los grupos para usarlos en el DataTable (la propiedad groupField usará product_name)
  const flatProducts = groupedProducts.reduce((acc, group) => {
    const combos = group.combinations.map((combo) => ({
      ...combo,
      product_name: group.product_name,
    }));
    return acc.concat(combos);
  }, []);

  return (
    <div
      className="p-3 h-full flex flex-col"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
      onClick={handleContainerClick}
    >
      {/* Fila de búsqueda */}
      <div className="mb-4 flex items-center">
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
      </div>

      {/* DataTable con agrupación por product_name */}
      <div className="flex-1 overflow-auto">
        <DataTable
          value={flatProducts}
          groupField="product_name"
          rowGroupMode="subheader"
          groupRowTemplate={groupHeaderTemplate}
          selectionMode="single"
          onRowSelect={onRowSelect}
          dataKey="id_product_attribute"
          scrollable
          className="p-datatable-sm"
        >
          {/* eslint-enable react/no-unknown-property */}
          <Column
            field="combination_name"
            header="Combinación"
            body={combinationBodyTemplate}
          />
          <Column
            field="reference_combination"
            header="Referencia"
            body={referenceBodyTemplate}
          />
          <Column
            field="ean13_combination"
            header="Cod. Barras"
            body={eanBodyTemplate}
          />
          <Column field="price" header="Precio" body={priceBodyTemplate} />
          <Column
            field="quantity"
            header="Cantidad"
            body={quantityBodyTemplate}
          />
        </DataTable>
      </div>

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
