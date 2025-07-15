import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import useProductSearchOptimized from "../../../hooks/useProductSearchOptimized";
import { AuthContext } from "../../../contexts/AuthContext";
import { useContext } from "react";

const AddStockFixedModal = ({ isOpen, onClose, onAdded }) => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const { idProfile } = useContext(AuthContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [quantities, setQuantities] = useState({});

  const { handleSearch, isLoading, groupedProducts } = useProductSearchOptimized({
    apiFetch,
    shopId: "all",
    allowOutOfStockSales: true,
    onAddProduct: () => {},
    onAddDiscount: () => {},
    idProfile,
    selectedClient: null,
  });

  const transformResults = (groups) => {
    const map = {};
    groups.forEach((g) => {
      g.combinations.forEach((c) => {
        const key = `${c.id_product}_${c.id_product_attribute}`;
        if (!map[key]) {
          map[key] = {
            key,
            ean13: c.id_product_attribute ? c.ean13_combination : c.ean13_combination_0,
            name: c.combination_name
              ? `${c.reference_combination} - ${c.combination_name}`
              : c.product_name,
            stock1: 0,
            stock2: 0,
            stock3: 0,
          };
        }
        if (c.stocks) {
          c.stocks.forEach((s) => {
            if (s.id_shop === 1) map[key].stock1 = s.quantity;
            if (s.id_shop === 2) map[key].stock2 = s.quantity;
            if (s.id_shop === 3) map[key].stock3 = s.quantity;
          });
        }
      });
    });
    return Object.values(map);
  };

  const doSearch = async () => {
    await handleSearch(searchTerm);
    setProducts(transformResults(groupedProducts));
  };

  const handleAdd = async () => {
    const payload = selected.map((p) => ({
      ean13: p.ean13,
      quantity_shop_1: quantities[p.key]?.q1 || 0,
      quantity_shop_2: quantities[p.key]?.q2 || 0,
      quantity_shop_3: quantities[p.key]?.q3 || 0,
    }));
    try {
      await apiFetch(`${API_BASE_URL}/stock_fixed_add`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (onAdded) onAdded();
    } catch (err) {
      console.error("Error adding stock fixed:", err);
    }
  };

  const onQuantityChange = (key, field, value) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const enabled = (row) => selected.some((s) => s.key === row.key);

  return (
    <Dialog
      header="Añadir Productos"
      visible={isOpen}
      onHide={onClose}
      modal
      style={{ width: "70vw", maxHeight: "80vh" }}
      footer={
        <div className="flex justify-end gap-2">
          <Button label="Cancelar" className="p-button-text" onClick={onClose} />
          <Button label="Añadir" icon="pi pi-check" onClick={handleAdd} disabled={selected.length === 0} />
        </div>
      }
    >
      <div className="mb-3 flex gap-2">
        <InputText
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por referencia o código"
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
        />
        <Button label="Buscar" icon="pi pi-search" onClick={doSearch} loading={isLoading} />
      </div>
      <DataTable
        value={products}
        selectionMode="multiple"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        dataKey="key"
        paginator
        rows={10}
        emptyMessage="Sin resultados"
      >
        <Column selectionMode="multiple" style={{ width: "3rem" }} />
        <Column field="name" header="Producto" />
        <Column field="ean13" header="EAN13" style={{ width: "140px", textAlign: "center" }} alignHeader="center" />
        <Column field="stock1" header="Stock T1" style={{ width: "80px", textAlign: "center" }} alignHeader="center" />
        <Column field="stock2" header="Stock T2" style={{ width: "80px", textAlign: "center" }} alignHeader="center" />
        <Column field="stock3" header="Stock T3" style={{ width: "80px", textAlign: "center" }} alignHeader="center" />
        <Column
          header="Cant. T1"
          body={(row) => (
            <InputNumber
              value={quantities[row.key]?.q1 || 0}
              onValueChange={(e) => onQuantityChange(row.key, "q1", e.value)}
              disabled={!enabled(row)}
              showButtons
              buttonLayout="horizontal"
              style={{ width: "80px" }}
            />
          )}
        />
        <Column
          header="Cant. T2"
          body={(row) => (
            <InputNumber
              value={quantities[row.key]?.q2 || 0}
              onValueChange={(e) => onQuantityChange(row.key, "q2", e.value)}
              disabled={!enabled(row)}
              showButtons
              buttonLayout="horizontal"
              style={{ width: "80px" }}
            />
          )}
        />
        <Column
          header="Cant. T3"
          body={(row) => (
            <InputNumber
              value={quantities[row.key]?.q3 || 0}
              onValueChange={(e) => onQuantityChange(row.key, "q3", e.value)}
              disabled={!enabled(row)}
              showButtons
              buttonLayout="horizontal"
              style={{ width: "80px" }}
            />
          )}
        />
      </DataTable>
    </Dialog>
  );
};

export default AddStockFixedModal;
