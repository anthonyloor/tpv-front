import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { generateSalesPdf } from "../../../utils/generateSalesPdf";

const ListCashRegisterModal = ({ isOpen, onClose, inlineMode = false }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const shop = JSON.parse(localStorage.getItem("shop"));

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const fetchData = async () => {
        try {
          const data = await apiFetch(`${API_BASE_URL}/get_pos_sessions`, {
            method: "GET",
          });
          setSessions(data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching data:", error);
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, apiFetch, API_BASE_URL]);

  // Función para generar PDF a partir de la caja seleccionada
  const handleGenerateSessionPdf = async () => {
    if (!selectedSession) {
      alert("Seleccione primero una caja.");
      return;
    }
    try {
      const saleReportData = await apiFetch(
        `${API_BASE_URL}/get_pos_session_sale_report_orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_pos_session: selectedSession.id_pos_session,
          }),
        }
      );
      if (!Array.isArray(saleReportData)) {
        alert("Datos del reporte no válidos.");
        return;
      }
      const result = generateSalesPdf(saleReportData, shop.name);
      if (!result) {
        alert("Error generando el PDF.");
      }
    } catch (error) {
      console.error("Error generando PDF para la sesión:", error);
      alert("Error al generar el PDF.");
    }
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Generar reporte venta PDF"
        icon="pi pi-file-pdf"
        onClick={handleGenerateSessionPdf}
      />
      <Button
        label="Cerrar"
        icon="pi pi-times"
        onClick={onClose}
        className="p-button-text"
      />
    </div>
  );

  return (
    <Dialog
      header="Lista de Cajas"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      footer={footer}
      style={{ width: "70vw" }}
    >
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <DataTable
            value={sessions}
            paginator
            rows={10}
            className="p-datatable-striped p-datatable-gridlines"
            selectionMode="single"
            selection={selectedSession}
            onSelectionChange={(e) => setSelectedSession(e.value)}
            dataKey="id_pos_session"
            sortField="active"
            sortOrder={-1}
            responsiveLayout="scroll"
          >
            <Column
              field="id_pos_session"
              header="ID"
              style={{ textAlign: "center" }}
              alignHeader="center"
            ></Column>
            <Column
              field="date_add"
              header="Fecha Apertura"
              style={{ textAlign: "center" }}
              alignHeader="center"
            ></Column>
            <Column
              field="date_close"
              header="Fecha Cierre"
              style={{ textAlign: "center" }}
              alignHeader="center"
            ></Column>
            <Column
              field="init_cash"
              header="Caja Inicial"
              style={{ textAlign: "center" }}
              alignHeader="center"
            ></Column>
            <Column
              field="total_cash"
              header="Total Efectivo"
              style={{ textAlign: "center" }}
              alignHeader="center"
            ></Column>
            <Column
              field="total_card"
              header="Total Tarjeta"
              style={{ textAlign: "center" }}
              alignHeader="center"
            ></Column>
            <Column
              field="total_bizum"
              header="Total Bizum"
              style={{ textAlign: "center" }}
              alignHeader="center"
            ></Column>
            <Column
              field="active"
              header="Activo"
              style={{ textAlign: "center" }}
              alignHeader="center"
              sortable
              body={(rowData) => (rowData.active ? "Sí" : "No")}
            ></Column>
          </DataTable>
        </>
      )}
    </Dialog>
  );
};

export default ListCashRegisterModal;
