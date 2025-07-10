import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { formatShortDate } from "../../../utils/dateUtils";

const DiscountsListModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDiscounts = async () => {
    const now = new Date();
    const date2 = now.toISOString().split("T")[0];
    const past = new Date(now);
    past.setMonth(past.getMonth() - 3);
    const date1 = past.toISOString().split("T")[0];
    setLoading(true);
    try {
      const data = await apiFetch(`${API_BASE_URL}/get_cart_rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date1, date2 }),
      });
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching cart rules:", err);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch(
        `${API_BASE_URL}/get_cart_rule?code=${encodeURIComponent(searchTerm)}`,
        { method: "GET" }
      );
      setDiscounts(data ? [data] : []);
    } catch (err) {
      console.error("Error searching cart rule:", err);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiscounts();
      setSearchTerm("");
    }
  }, [isOpen]);

  const resetSearch = () => {
    setSearchTerm("");
    fetchDiscounts();
  };

  const descuentoTemplate = (row) => {
    if (row.reduction_percent && Number(row.reduction_percent) !== 0) {
      return `${row.reduction_percent}%`;
    }
    return `${row.reduction_amount}€`;
  };

  return (
    <Dialog
      header="Descuentos"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{ width: "70vw", maxHeight: "85vh" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="p-input-icon-left w-full">
          <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Buscar por código"
            className="w-full pl-8"
          />
        </span>
        <Button label="Buscar" icon="pi pi-search" onClick={handleSearch} disabled={!searchTerm.trim()} />
        <Button label="Reset" icon="pi pi-refresh" onClick={resetSearch} />
      </div>
      <DataTable
        value={discounts}
        loading={loading}
        paginator
        rows={7}
        className="p-datatable-sm"
        responsiveLayout="scroll"
      >
        <Column
          field="date_from"
          header="Desde"
          body={(row) => formatShortDate(row.date_from)}
          style={{ textAlign: "center", width: "120px" }}
          alignHeader="center"
        />
        <Column
          field="date_to"
          header="Hasta"
          body={(row) => formatShortDate(row.date_to)}
          style={{ textAlign: "center", width: "120px" }}
          alignHeader="center"
        />
        <Column field="id_customer" header="Cliente" style={{ textAlign: "center", width: "80px" }} alignHeader="center" />
        <Column field="description" header="Descripción" />
        <Column field="quantity" header="Cantidad" style={{ textAlign: "center", width: "80px" }} alignHeader="center" />
        <Column header="Descuento" body={descuentoTemplate} style={{ textAlign: "center", width: "100px" }} alignHeader="center" />
        <Column field="code" header="Código" style={{ textAlign: "center", width: "120px" }} alignHeader="center" />
      </DataTable>
    </Dialog>
  );
};

export default DiscountsListModal;
