import React, { useState } from "react";
import { useApiFetch } from "../../utils/useApiFetch";
import ProductSelectionModal from "./ProductSelectionModal";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { ProgressSpinner } from "primereact/progressspinner";

const ProductSearchCardForTransfer = ({
  onAddProduct,
  selectedOriginStore,
  selectedDestinationStore,
  type, // 'traspaso', 'entrada', 'salida'
  originShopName,
  destinationShopName,
}) => {
  const apiFetch = useApiFetch();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalProducts, setModalProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Checkbox "Agregar Automático"
  const [autoAdd, setAutoAdd] = useState(false);

  let isSearchDisabled = false;
  if (type === "traspaso") {
    isSearchDisabled = !selectedOriginStore || !selectedDestinationStore;
  } else if (type === "entrada") {
    isSearchDisabled = !selectedDestinationStore;
  } else if (type === "salida") {
    isSearchDisabled = !selectedOriginStore;
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if (
      e.key === "Enter" &&
      searchTerm.trim().length >= 3 &&
      !isSearchDisabled
    ) {
      await performSearch();
    }
  };

  const transformProductsForDisplay = (apiResults) => {
    const grouped = {};
    apiResults.forEach((prod) => {
      const key = `${prod.id_product}_${prod.id_product_attribute}`;
      if (!grouped[key]) {
        const ean13Val =
          prod.ean13_combination !== null
            ? prod.ean13_combination
            : prod.ean13_combination_0 || "";

        grouped[key] = {
          id_product: prod.id_product,
          id_product_attribute: prod.id_product_attribute,
          product_name: prod.product_name,
          combination_name: prod.combination_name,
          reference_combination: prod.reference_combination,
          ean13: ean13Val,
          stockOrigin: 0,
          stockDestination: 0,
        };
      }
      if (String(prod.id_shop) === String(selectedOriginStore)) {
        grouped[key].stockOrigin = prod.quantity ?? 0;
      }
      if (String(prod.id_shop) === String(selectedDestinationStore)) {
        grouped[key].stockDestination = prod.quantity ?? 0;
      }
    });
    return Object.values(grouped);
  };

  const performSearch = async () => {
    if (isSearchDisabled) return;
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await apiFetch(
        `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
          searchTerm.trim()
        )}`,
        { method: "GET" }
      );
      const validResults = response.filter(
        (p) =>
          !(
            p.id_product_attribute === null &&
            p.ean13_combination === null &&
            p.ean13_combination_0 === null
          )
      );
      const transformed = transformProductsForDisplay(validResults);
      if (transformed.length === 0) {
        alert("No se encontraron productos.");
        return;
      }

      // Si autoAdd está activo y solo hay un resultado, lo añade automáticamente
      if (autoAdd && transformed.length === 1) {
        handleAddSelectedProducts(transformed);
      } else {
        setModalProducts(transformed);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("[ProductSearchCardForTransfer] Error:", error);
      alert("Error al buscar productos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSelectedProducts = (selected) => {
    selected.forEach((prod) => {
      const item = {
        id_product: prod.id_product,
        id_product_attribute: prod.id_product_attribute,
        product_name: prod.product_name,
        combination_name: prod.combination_name,
        reference_combination: prod.reference_combination,
        ean13: prod.ean13,
        stockOrigin: prod.stockOrigin,
        quantity: 1,
      };
      onAddProduct(item);
    });
    setIsModalOpen(false);
    setSearchTerm("");
  };

  return (
    <Card className="mt-6" title="Buscar Producto">
      <div className="p-fluid">
        <div className="p-field p-grid">
          <div className="p-col-12 p-md-9">
            <InputText
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por referencia o código de barras"
              disabled={isSearchDisabled || isLoading}
            />
          </div>
          <div className="p-col-12 p-md-3">
            <Button
              label="Buscar"
              icon="pi pi-search"
              onClick={performSearch}
              disabled={
                isSearchDisabled || isLoading || searchTerm.trim().length < 3
              }
              className="w-full"
            />
          </div>
        </div>
        {isLoading && (
          <div className="p-d-flex p-jc-center">
            <ProgressSpinner
              style={{ width: "30px", height: "30px" }}
              strokeWidth="8"
            />
          </div>
        )}
        <div className="p-field">
          <Checkbox
            inputId="autoAdd"
            checked={autoAdd}
            onChange={(e) => setAutoAdd(e.checked)}
          />
          <label htmlFor="autoAdd" className="p-checkbox-label">
            Agregar Automático
          </label>
        </div>
        {isSearchDisabled && (
          <p className="p-text-danger">
            {type === "traspaso"
              ? "Selecciona ambas tiendas (origen y destino)."
              : type === "entrada"
              ? "Selecciona la tienda destino."
              : "Selecciona la tienda origen."}
          </p>
        )}
      </div>
      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={modalProducts}
        onSelectProducts={handleAddSelectedProducts}
        originShopName={originShopName}
        destinationShopName={destinationShopName}
        type={type}
      />
    </Card>
  );
};

export default ProductSearchCardForTransfer;
