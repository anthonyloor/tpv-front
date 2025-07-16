import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import StockFixedAddModal from "./StockFixedAddModal";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";

const StockFixedModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const shopsDict = useShopsDictionary();

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/stock_fixed_list`, {
        method: "GET",
      });
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error fetching stock fixed list:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchList();
    }
  }, [isOpen]);

  const handleSuccessAdd = () => {
    setAddModalOpen(false);
    fetchList();
  };

  const filteredData = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 3) return data;
    return data.filter(
      (item) =>
        String(item.reference_combination).toLowerCase().includes(term) ||
        String(item.combination_name || "")
          .toLowerCase()
          .includes(term),
    );
  }, [data, search]);

  return (
    <>
      <Dialog
        header="Aviso Stock Correo"
        visible={isOpen}
        onHide={onClose}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "60vw", maxWidth: "800px" }}
      >
        <div className="flex items-end gap-2 mb-3">
          <Button
            label="Añadir producto"
            icon="pi pi-plus"
            onClick={() => setAddModalOpen(true)}
          />
          <span className="flex-1"></span>
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar referencia"
            className="w-40 md:w-60"
          />
        </div>
        <DataTable
          value={filteredData}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          emptyMessage="No hay registros"
          rowGroupMode="subheader"
          groupRowsBy="reference_combination"
          sortField="reference_combination"
          sortOrder={1}
          rowGroupHeaderTemplate={(row) => (
            <span className="font-bold">{row.reference_combination}</span>
          )}
        >
          <Column field="combination_name" header="Combinación" />
          <Column field="id_stock" header="ID" style={{ width: "80px" }} />
          <Column field="ean13" header="EAN13" style={{ width: "140px" }} />
          <Column
            field="quantity_shop_1"
            header={shopsDict[9] || "Tienda 1"}
            style={{
              width: "100px",
              borderLeft: "1px solid var(--surface-border)",
            }}
          />
          <Column
            field="quantity_shop_2"
            header={shopsDict[11] || "Tienda 2"}
            style={{ width: "100px" }}
          />
          <Column
            field="quantity_shop_3"
            header={shopsDict[14] || "Tienda 3"}
            style={{ width: "100px" }}
          />
        </DataTable>
      </Dialog>
      {addModalOpen && (
        <StockFixedAddModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleSuccessAdd}
        />
      )}
    </>
  );
};

export default StockFixedModal;
