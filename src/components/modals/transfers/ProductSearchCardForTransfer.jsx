import React, { useState, useRef } from "react";
import { useApiFetch } from "../../utils/useApiFetch";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import ProductSelectionDialog from "./ProductSelectionDialog";

const ProductSearchCardForTransfer = ({
  onAddProduct,
  selectedOriginStore,
  selectedDestinationStore,
  type, // 'traspaso', 'entrada', 'salida'
  originShopName,
  destinationShopName,
}) => {
  const apiFetch = useApiFetch();

  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Modo “Agregar Automático”
  const [autoAdd, setAutoAdd] = useState(false);

  // Para controlar el foco en el input
  const inputRef = useRef(null);

  // Determinar si la búsqueda está deshabilitada
  let isSearchDisabled = false;
  if (type === "traspaso") {
    isSearchDisabled = !selectedOriginStore || !selectedDestinationStore;
  } else if (type === "entrada") {
    isSearchDisabled = !selectedDestinationStore;
  } else if (type === "salida") {
    isSearchDisabled = !selectedOriginStore;
  }

  // Manejar el cambio del input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Modificar la condición de búsqueda en handleKeyDown para no depender de longitud mínima
  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && !isSearchDisabled) {
      await performSearch();
    }
  };

  // Lógica para filtrar productos válidos (que tengan combination o EAN)
  const isProductValid = (prod) => {
    return !(
      prod.id_product_attribute === null &&
      prod.ean13_combination === null &&
      prod.ean13_combination_0 === null
    );
  };

  // Realizar la búsqueda usando el código EAN13 ingresado
  const performSearch = async () => {
    if (isSearchDisabled || !searchTerm.trim()) return;
    const term = searchTerm.trim();
    setIsLoading(true);
    try {
      const plainEanRegex = /^\d{13}$/;
      const eanApostropheRegex = /^(\d{13})'(\d+)$/;
      let code = "";
      let results = [];
      
      if (eanApostropheRegex.test(term)) {
        // Caso: EAN13 con id control stock
        const [, eanCode, control] = term.match(eanApostropheRegex);
        code = eanCode;
        const resp = await apiFetch(
          `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(code)}`,
          { method: "GET" }
        );
        const valid = resp.filter(isProductValid);
        results = valid.filter(
          (prod) =>
            (prod.ean13_combination === code ||
             prod.ean13_combination_0 === code) &&
            String(prod.id_control_stock) === control
        );
      } else if (plainEanRegex.test(term)) {
        // Caso: EAN13 sin id control stock
        code = term;
        const resp = await apiFetch(
          `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(code)}`,
          { method: "GET" }
        );
        const valid = resp.filter(isProductValid);
        results = valid.filter(
          (prod) =>
            prod.ean13_combination === code ||
            prod.ean13_combination_0 === code
        );
      } else {
        alert("Formato de búsqueda incorrecto. Ingresa un EAN13 o EAN13'id.");
        return;
      }

      if (results.length === 0) {
        alert("No se encontró producto con el código especificado.");
        return;
      }

      // Transformar solo los productos que cumplen con la condición
      const transformed = transformProductsForTransfer(results);

      if (transformed.length === 1) {
        handleAddSelectedProducts(transformed);
      } else {
        setSearchResults(transformed);
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error("[ProductSearchCardForTransfer] Error:", error);
      alert("Error al buscar productos");
    } finally {
      setIsLoading(false);
      setSearchTerm("");
      inputRef.current?.focus();
    }
  };

  // “Map” para asociar stock de origen y destino
  const transformProductsForTransfer = (apiResults) => {
    const map = {};
    apiResults.forEach((prod) => {
      const key = `${prod.id_product}_${prod.id_product_attribute}`;
      if (!map[key]) {
        map[key] = {
          id_product: prod.id_product,
          id_product_attribute: prod.id_product_attribute,
          product_name: prod.product_name,
          combination_name: prod.combination_name,
          reference_combination: prod.reference_combination,
          ean13: prod.ean13_combination || prod.ean13_combination_0 || "",
          stockOrigin: 0,
          stockDestination: 0,
          id_control_stock: prod.id_control_stock,
        };
      }
      // Stock de Origen
      if (String(prod.id_shop) === String(selectedOriginStore)) {
        map[key].stockOrigin = prod.quantity ?? 0;
      }
      // Stock de Destino
      if (String(prod.id_shop) === String(selectedDestinationStore)) {
        map[key].stockDestination = prod.quantity ?? 0;
      }
    });
    return Object.values(map);
  };

  // Agregar los productos seleccionados
  const handleAddSelectedProducts = (selected) => {
    selected.forEach((prod) => {
      const item = {
        id_product: prod.id_product,
        id_product_attribute: prod.id_product_attribute,
        product_name: `${prod.product_name} ${prod.combination_name}`,
        reference_combination: prod.reference_combination,
        ean13: prod.ean13,
        id_control_stock: prod.id_control_stock,
        stockOrigin: prod.stockOrigin,
        quantity: 1,
      };
      onAddProduct(item);
    });
    setIsDialogOpen(false);
    // Reforzar el foco
    inputRef.current?.focus();
  };

  // Clic en botón “Buscar”
  const handleClickSearch = async () => {
    if (!isSearchDisabled && searchTerm.trim().length >= 3) {
      await performSearch();
    }
  };

  return (
    <div className="mt-6">
      {/* Fila: input + botón Buscar */}
      <div className="flex items-end gap-2 mb-3">
        <div className="flex-1 relative">
          <span className="p-input-icon-left w-full">
            <i
              className="pi pi-search absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none"
              style={{ color: "#999" }}
            />
            <InputText
              ref={inputRef}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por referencia o código de barras"
              disabled={isSearchDisabled || isLoading}
              className="w-full pl-8 pr-8"
              autoFocus
            />
          </span>
          {isLoading && (
            <ProgressSpinner
              style={{
                width: "24px",
                height: "24px",
                position: "absolute",
                top: "50%",
                right: "0.5rem",
                transform: "translateY(-50%)",
              }}
              strokeWidth="8"
            />
          )}
        </div>
        <div className="flex-none">
          <Button
            label="Buscar"
            icon="pi pi-search"
            onClick={handleClickSearch}
            disabled={
              isSearchDisabled || isLoading || searchTerm.trim().length < 3
            }
          />
        </div>
      </div>

      {/* Checkbox autoAdd */}
      <div className="flex items-center mb-2">
        <Checkbox
          inputId="autoAdd"
          checked={autoAdd}
          onChange={(e) => setAutoAdd(e.checked)}
          disabled={isSearchDisabled}
        />
        <label htmlFor="autoAdd" className="ml-2">
          Agregar Automático
        </label>
      </div>

      {isSearchDisabled && (
        <p className="p-text-danger mt-2">
          {type === "traspaso"
            ? "Selecciona ambas tiendas (origen y destino)."
            : type === "entrada"
            ? "Selecciona la tienda destino."
            : "Selecciona la tienda origen."}
        </p>
      )}

      {/* Dialogo para seleccionar productos */}
      <ProductSelectionDialog
        visible={isDialogOpen}
        onHide={() => setIsDialogOpen(false)}
        products={searchResults}
        onSelectProducts={handleAddSelectedProducts}
        originShopName={originShopName}
        destinationShopName={destinationShopName}
        type={type}
      />
    </div>
  );
};

export default ProductSearchCardForTransfer;
