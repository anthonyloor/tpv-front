import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import AddStockFixedModal from "./AddStockFixedModal";

const StockFixedModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_BASE_URL}/stock_fixed_list`, { method: "GET" });
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading stock fixed list:", err);
      setRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
    }
  }, [isOpen]);

  const handleAddSuccess = () => {
    fetchRecords();
    setShowAddModal(false);
  };

  return (
    <>
      <Dialog
        header="Aviso Stock Correo"
        visible={isOpen}
        onHide={onClose}
        modal
        style={{ width: "60vw", maxHeight: "80vh" }}
      >
        <div className="mb-3 text-right">
          <Button label="Añadir producto" icon="pi pi-plus" onClick={() => setShowAddModal(true)} />
        </div>
        <DataTable
          value={records}
          loading={loading}
          paginator
          rows={10}
          emptyMessage="Sin registros"
        >
          <Column field="id_stock" header="ID" style={{ width: "80px", textAlign: "center" }} alignHeader="center" />
          <Column field="ean13" header="EAN13" style={{ width: "180px", textAlign: "center" }} alignHeader="center" />
          <Column field="quantity_shop_1" header="Tienda 1" style={{ width: "100px", textAlign: "center" }} alignHeader="center" />
          <Column field="quantity_shop_2" header="Tienda 2" style={{ width: "100px", textAlign: "center" }} alignHeader="center" />
          <Column field="quantity_shop_3" header="Tienda 3" style={{ width: "100px", textAlign: "center" }} alignHeader="center" />
        </DataTable>
      </Dialog>
      {showAddModal && (
        <AddStockFixedModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdded={handleAddSuccess}
        />
      )}
    </>
  );
};

export default StockFixedModal;
