import React, { useState, useContext, useMemo, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import useProductSearchOptimized from "../../../hooks/useProductSearchOptimized";
import { AuthContext } from "../../../contexts/AuthContext";
import { ClientContext } from "../../../contexts/ClientContext";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";

const StockFixedAddModal = ({ isOpen, onClose, onSuccess }) => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const { idProfile } = useContext(AuthContext);
  const { selectedClient } = useContext(ClientContext);
  const shopsDict = useShopsDictionary();
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState([]);
  const [quantities, setQuantities] = useState({});
  const toast = useRef(null);
  const stockShopIds = useMemo(
    () =>
      Object.keys(shopsDict)
        .map(Number)
        .filter((id) => id !== 1)
        .sort((a, b) => a - b),
    [shopsDict]
  );

  const {
    groupedProducts,
    isLoading,
    handleSearch: searchProducts,
  } = useProductSearchOptimized({
    apiFetch,
    shopId: "all",
    allowOutOfStockSales: true,
    onAddProduct: () => {},
    onAddDiscount: () => {},
    idProfile,
    selectedClient,
  });

  const flatResults = groupedProducts.flatMap((group) =>
    group.combinations.map((combo) => ({
      ...combo,
      product_name: group.product_name,
      uniqueKey: `${combo.id_product}_${combo.id_product_attribute}`,
    }))
  );

  const handleSearch = () => {
    const term = search.trim();
    if (term.length >= 3) {
      searchProducts(term);
    }
  };

  const updateQuantity = (key, shop, value) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: { ...prev[key], [shop]: value },
    }));
  };

  const handleAdd = async () => {
    const payload = selection.map((row) => {
      const ean = row.ean13_combination || row.ean13_combination_0 || row.ean13;
      const q = quantities[row.uniqueKey] || {};
      return {
        ean13: ean,
        quantity_shop_1: q.quantity_shop_1 || 0,
        quantity_shop_2: q.quantity_shop_2 || 0,
        quantity_shop_3: q.quantity_shop_3 || 0,
      };
    });
    if (payload.length === 0) return;
    try {
      await apiFetch(`${API_BASE_URL}/stock_fixed_add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (toast.current) {
        toast.current.show({
          severity: "success",
          summary: "Añadido",
          detail: "Se ha añadido la combinación correctamente",
          life: 3000,
        });
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error adding stock fixed:", err);
    }
  };

  const productNameTemplate = (row) => {
    const comb =
      row.combination_name && row.combination_name !== ""
        ? row.combination_name
        : row.product_name;
    return `${row.reference_combination} - ${comb}`;
  };

  const stockForShop = (row, shopId) => {
    if (!row.stocks) return 0;
    const s = row.stocks.find((stk) => Number(stk.id_shop) === Number(shopId));
    return s ? s.quantity : 0;
  };

  const quantityBody = (row, shopKey) => {
    const key = row.uniqueKey;
    const value = quantities[key]?.[shopKey] || 0;
    return (
      <InputNumber
        value={value}
        onChange={(e) => updateQuantity(key, shopKey, e.value)}
        showButtons
        buttonLayout="horizontal"
        decrementButtonClassName="p-button-secondary"
        incrementButtonClassName="p-button-secondary"
        incrementButtonIcon="pi pi-plus"
        decrementButtonIcon="pi pi-minus"
        min={0}
        inputClassName="w-14"
      />
    );
  };

  return (
    <Dialog
      header="Añadir productos"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{ width: "90vw", maxWidth: "1400px" }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            label="Cancelar"
            className="p-button-text"
            onClick={onClose}
          />
          <Button
            label="Añadir"
            onClick={handleAdd}
            disabled={selection.length === 0}
          />
        </div>
      }
    >
      <Toast ref={toast} />
      <div className="flex items-end gap-2 mb-3">
        <InputText
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Buscar producto"
          className="w-full"
        />
        <Button
          icon="pi pi-search"
          onClick={handleSearch}
          aria-label="Buscar"
        />
      </div>
      <DataTable
        value={flatResults}
        loading={isLoading}
        selection={selection}
        onSelectionChange={(e) => setSelection(e.value)}
        selectionMode="checkbox"
        dataKey="uniqueKey"
        responsiveLayout="scroll"
        paginator
        rows={5}
        emptyMessage="Sin resultados"
      >
        <Column
          selectionMode="multiple"
          style={{ width: "3rem" }}
          alignHeader={"center"}
        />
        <Column
          header="Nombre"
          body={productNameTemplate}
          style={{ minWidth: "190px", textAlign: "left" }}
          alignHeader={"left"}
        />
        <Column
          header="EAN13"
          body={(row) =>
            row.ean13_combination || row.ean13_combination_0 || row.ean13 || ""
          }
          style={{ minWidth: "150px", textAlign: "center" }}
          alignHeader={"center"}
        />
        {stockShopIds.map((id) => (
          <Column
            key={id}
            header={`${shopsDict[id] || id}`}
            body={(row) => stockForShop(row, id)}
            style={{ minWidth: "80px", textAlign: "center" }}
            alignHeader={"center"}
          />
        ))}
        <Column
          header={`Cantidad ${shopsDict[9] || "Tienda 1"}`}
          body={(row) => quantityBody(row, "quantity_shop_1")}
          style={{
            borderLeft: "1px solid var(--surface-border)",
            minWidth: "50px",
            textAlign: "center",
          }}
          alignHeader={"center"}
        />
        <Column
          header={`Cantidad ${shopsDict[11] || "Tienda 2"}`}
          body={(row) => quantityBody(row, "quantity_shop_2")}
          style={{ minWidth: "50px", textAlign: "center" }}
          alignHeader={"center"}
        />
        <Column
          header={`Cantidad ${shopsDict[14] || "Tienda 3"}`}
          body={(row) => quantityBody(row, "quantity_shop_3")}
          style={{ minWidth: "50px", textAlign: "center" }}
          alignHeader={"center"}
        />
      </DataTable>
    </Dialog>
  );
};

export default StockFixedAddModal;
