import React, { useState, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import useProductSearchOptimized from "../../../hooks/useProductSearchOptimized";
import { AuthContext } from "../../../contexts/AuthContext";
import { ClientContext } from "../../../contexts/ClientContext";

const StockFixedAddModal = ({ isOpen, onClose, onSuccess }) => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const { idProfile } = useContext(AuthContext);
  const { selectedClient } = useContext(ClientContext);
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState([]);
  const [quantities, setQuantities] = useState({});

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

  const handleSearch = async () => {
    if (!search.trim()) return;
    await searchProducts(search);
  };

  const updateQuantity = (ean, shop, value) => {
    setQuantities((prev) => ({
      ...prev,
      [ean]: { ...prev[ean], [shop]: value },
    }));
  };

  const handleAdd = async () => {
    const payload = selection.map((row) => {
      const ean = row.ean13_combination || row.ean13_combination_0 || row.ean13;
      const q = quantities[ean] || {};
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
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error adding stock fixed:", err);
    }
  };

  const productNameTemplate = (row) => {
    const comb = row.combination_name && row.combination_name !== ""
      ? row.combination_name
      : row.product_name;
    return `${row.reference_combination} - ${comb}`;
  };

  const stockForShop = (row, shopId) => {
    if (!row.stocks) return 0;
    const s = row.stocks.find((stk) => Number(stk.id_shop) === Number(shopId));
    return s ? s.quantity : 0;
  };

  const quantityBody = (ean, shopKey) => {
    const value = quantities[ean]?.[shopKey] || 0;
    const disabled = !selection.some((sel) => {
      const e = sel.ean13_combination || sel.ean13_combination_0 || sel.ean13;
      return e === ean;
    });
    return (
      <InputNumber
        value={value}
        disabled={disabled}
        onChange={(e) => updateQuantity(ean, shopKey, e.value)}
        showButtons
        buttonLayout="horizontal"
        decrementButtonClassName="p-button-secondary"
        incrementButtonClassName="p-button-secondary"
        incrementButtonIcon="pi pi-plus"
        decrementButtonIcon="pi pi-minus"
        min={0}
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
      style={{ width: "70vw", maxWidth: "900px" }}
      footer={
        <div className="flex justify-end gap-2">
          <Button label="Cancelar" className="p-button-text" onClick={onClose} />
          <Button label="Añadir" onClick={handleAdd} disabled={selection.length === 0} />
        </div>
      }
    >
      <div className="flex items-end gap-2 mb-3">
        <InputText
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          placeholder="Buscar producto"
          className="w-full"
        />
        <Button label="Buscar" icon="pi pi-search" onClick={handleSearch} />
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
        <Column selectionMode="multiple" headerStyle={{ width: "3em" }}></Column>
        <Column header="Nombre" body={productNameTemplate} />
        <Column header="EAN13" body={(row) => row.ean13_combination || row.ean13_combination_0 || row.ean13 || ""} />
        <Column header="Stock tienda 1" body={(row) => stockForShop(row, 1)} />
        <Column header="Stock tienda 2" body={(row) => stockForShop(row, 2)} />
        <Column header="Stock tienda 3" body={(row) => stockForShop(row, 3)} />
        <Column
          header="Cantidad tienda 1"
          body={(row) => {
            const ean = row.ean13_combination || row.ean13_combination_0 || row.ean13;
            return quantityBody(ean, "quantity_shop_1");
          }}
        />
        <Column
          header="Cantidad tienda 2"
          body={(row) => {
            const ean = row.ean13_combination || row.ean13_combination_0 || row.ean13;
            return quantityBody(ean, "quantity_shop_2");
          }}
        />
        <Column
          header="Cantidad tienda 3"
          body={(row) => {
            const ean = row.ean13_combination || row.ean13_combination_0 || row.ean13;
            return quantityBody(ean, "quantity_shop_3");
          }}
        />
      </DataTable>
    </Dialog>
  );
};

export default StockFixedAddModal;
