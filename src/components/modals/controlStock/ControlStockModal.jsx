import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";

const ControlStockModal = ({ isOpen, onClose, inlineMode = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(
        `${API_BASE_URL}/get_controll_stock?id=${encodeURIComponent(
          searchQuery
        )}`
      );
      // Si no hay resultados o el objeto está vacío, se limpia la data
      if (!data) {
        setResults(null);
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error("Error en control stock:", error);
      setResults(null);
    }
    setLoading(false);
  };

  return (
    <Dialog
      header="Seguimiento de productos"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{ width: "70vw" }}
    >
      <div className="p-fluid">
        {/* Región de búsqueda */}
        <div className="p-inputgroup" style={{ marginBottom: "1rem" }}>
          <InputText
            placeholder="Buscar por control stock"
            value={searchQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button icon="pi pi-search" label="Buscar" onClick={handleSearch} />
        </div>
        {/* Visualización de resultados */}
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            {results && (
              <>
                <div className="p-grid" style={{ marginBottom: "1rem" }}>
                  <div className="p-col">
                    <strong>Producto:</strong> {results.product_name || "-"}
                  </div>
                  <div className="p-col">
                    <strong>Seguimiento:</strong> {results.id_control_stock}{" "}
                    <i className="pi pi-link" />
                  </div>
                  <div className="p-col">
                    <strong>Codigo de barras:</strong> {results.ean13}
                  </div>
                  <div className="p-col">
                    <strong>Fecha creación seguimiento:</strong>{" "}
                    {results.date_add}
                  </div>
                  <div className="p-col">
                    <strong>Activo:</strong> {results.active ? "Sí" : "No"}
                  </div>
                  <div className="p-col">
                    <strong>Impreso:</strong> {results.printed ? "Sí" : "No"}
                  </div>
                </div>
                {results.history && results.history.length > 0 ? (
                  <DataTable
                    value={results.history}
                    paginator
                    rows={10}
                    className="p-datatable-striped p-datatable-gridlines"
                    emptyMessage="No hay resultados"
                    sortField="id_control_stock_history"
                    responsiveLayout="scroll"
                  >
                    <Column
                      field="id_control_stock_history"
                      header="ID"
                      sortable
                      style={{ textAlign: "center" }}
                      alignHeader="center"
                    />
                    <Column
                      field="reason"
                      header="Movimiento"
                      style={{ textAlign: "left" }}
                      alignHeader="left"
                    />
                    <Column
                      field="type"
                      header="Tipo"
                      style={{ textAlign: "center" }}
                      alignHeader="center"
                    />
                    <Column
                      field="date"
                      header="Fecha movimiento"
                      style={{ textAlign: "center" }}
                      alignHeader="center"
                    />
                  </DataTable>
                ) : (
                  <p>No hay historial disponible.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
};

export default ControlStockModal;
