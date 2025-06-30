import React, { useState, useRef, useEffect, useContext } from "react";
import { useApiFetch } from "../../../utils/useApiFetch";
import { ProgressSpinner } from "primereact/progressspinner";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import ProductSelectionDialog from "./ProductSelectionDialog";
import useProductSearchOptimized from "../../../hooks/useProductSearchOptimized";
import { ClientContext } from "../../../contexts/ClientContext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { playSound } from "../../../utils/playSound";

const ProductSearchCardForTransfer = ({
  onAddProduct,
  selectedOriginStore,
  selectedDestinationStore,
  type, // 'traspaso', 'entrada', 'salida'
  originShopName,
  destinationShopName,
}) => {
  const apiFetch = useApiFetch();
  const toast = useRef(null);

  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { selectedClient } = useContext(ClientContext);

  // Modo “Agregar Automático”
  const [autoAdd, setAutoAdd] = useState(false);

  // Para controlar el foco en el input
  const inputRef = useRef(null);

  // Nueva función para mantener el foco en el input si agregar automático está activo
  const handleInputBlur = () => {
    if (
      autoAdd &&
      document.querySelector('[role="dialog"]') === null &&
      inputRef.current
    ) {
      inputRef.current.focus();
    }
  };

  // (Opcional) Forzar el foco al hacer click en el contenedor si autoAdd está activo
  const handleContainerClick = () => {
    if (autoAdd && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Agregar useEffect para mantener el foco si autoAdd está activo y searchTerm está vacío
  useEffect(() => {
    if (autoAdd && searchTerm === "" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoAdd, searchTerm]);

  // Determinar si la búsqueda está deshabilitada
  let isSearchDisabled = false;
  if (type === "traspaso") {
    isSearchDisabled = !selectedOriginStore || !selectedDestinationStore;
  } else if (type === "entrada") {
    isSearchDisabled = !selectedDestinationStore;
  } else if (type === "salida") {
    isSearchDisabled = !selectedOriginStore;
  }

  // Definir shopId para la búsqueda: para "entrada" se usa selectedDestinationStore; para "salida"/"traspaso" se usa selectedOriginStore.
  const searchShopId =
    type === "traspaso"
      ? "all"
      : type === "entrada"
      ? selectedDestinationStore
      : selectedOriginStore;
  const { handleSearch: productSearch } = useProductSearchOptimized({
    apiFetch,
    shopId: searchShopId,
    allowOutOfStockSales: true,
    onAddProduct: () => {},
    onAddDiscount: () => {},
    idProfile: null,
    selectedClient,
  });

  // Manejar el cambio del input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Modificar handleKeyDown para mantener el foco en el input si autoAdd está marcado
  const handleKeyDown = async (e) => {
    if (e.key === "Enter" && !isSearchDisabled) {
      if (autoAdd) e.preventDefault();
      await performSearch();
      // Solo forzar el focus si autoAdd está activo
      if (autoAdd && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Realizar la búsqueda usando el código EAN13 ingresado
  const performSearch = async () => {
    if (isSearchDisabled || !searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const ean13Regex = /^\d{13}$/;
      const ean13ApostropheRegex = /^(\d{13})(\d+)$/;

      const groups = await productSearch(searchTerm, false, true);
      console.log("[ProductSearchCardForTransfer] Search results:", groups);
      const flatResults = groups
        ? groups.reduce((acc, group) => acc.concat(group.combinations), [])
        : [];
      console.log("[ProductSearchCardForTransfer] Flat results:", flatResults);
      if (flatResults.length === 0) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Producto no encontrado en base de datos",
        });
        playSound("error");
        return;
      }

      const transformed = transformProductsForTransfer(flatResults);

      if (
        !ean13Regex.test(searchTerm) &&
        !ean13ApostropheRegex.test(searchTerm)
      ) {
        setSearchResults(transformed);
        setIsDialogOpen(true);
        return;
      }
      if (transformed.length === 1) {
        // Agregar automáticamente si sólo hay un resultado
        handleAddSelectedProducts([transformed[0]]);
      } else {
        setSearchResults(transformed);
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error("[ProductSearchCardForTransfer] Error:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error al buscar productos.",
      });
      playSound("error");
    } finally {
      setIsLoading(false);
      setSearchTerm("");
      if (autoAdd && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // “Map” para asociar stock de origen y destino usando el array stocks
  const transformProductsForTransfer = (apiResults) => {
    const map = {};
    apiResults.forEach((prod) => {
      const key = `${prod.id_product}_${prod.id_product_attribute}`;
      if (!map[key]) {
        map[key] = {
          id_product: prod.id_product,
          id_product_attribute: prod.id_product_attribute,
          product_name: prod.combination_name
            ? `${prod.reference_combination} - ${prod.combination_name}`
            : prod.product_name,
          combination_name: prod.combination_name,
          reference_combination: prod.reference_combination,
          ean13: prod.ean13_combination || prod.ean13_combination_0 || "",
          stockOrigin: 0,
          stockDestination: 0,
          originControlStock: [],
          destinationControlStock: [],
          id_control_stock: prod.id_control_stock,
        };
      }
      if (prod.stocks && Array.isArray(prod.stocks)) {
        const originStock = prod.stocks.find(
          (s) => Number(s.id_shop) === Number(selectedOriginStore)
        );
        const destStock = prod.stocks.find(
          (s) => Number(s.id_shop) === Number(selectedDestinationStore)
        );
        if (originStock) {
          map[key].stockOrigin = originStock.quantity;
          map[key].originControlStock = originStock.control_stock || [];
        }
        if (destStock) {
          map[key].stockDestination = destStock.quantity;
          map[key].destinationControlStock = destStock.control_stock || [];
        }
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
        uniqueId: prod.id_control_stock
          ? prod.id_control_stock
          : prod.id_product_attribute,
        product_name: prod.product_name,
        reference_combination: prod.reference_combination,
        ean13: prod.ean13,
        id_control_stock: prod.id_control_stock,
        stock_origin: prod.stockOrigin,
        stock_destiny: prod.stockDestination,
        quantity: 1,
      };
      onAddProduct(item);
      playSound("success");
    });
    setIsDialogOpen(false);
    setSearchTerm("");
    // Solo mantener el focus si autoAdd está marcado
    if (autoAdd && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Clic en botón “Buscar”
  const handleClickSearch = async () => {
    if (!isSearchDisabled && searchTerm.trim().length >= 3) {
      await performSearch();
    }
  };

  return (
    <div
      className="mt-4 surface-card"
      onClick={handleContainerClick}
      style={{
        position: "sticky",
        top: 1,
        zIndex: 100,
      }}
    >
      <Toast ref={toast} position="top-center" />
      {/* Fila: input + botón Buscar */}
      <div className="flex items-end gap-2 mb-3">
        <div className="flex-1 relative">
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search"> </InputIcon>
            <InputText
              ref={inputRef}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              placeholder="Buscar por referencia o código de barras"
              disabled={isSearchDisabled || isLoading}
              className="w-full"
              autoFocus
            />
          </IconField>
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
