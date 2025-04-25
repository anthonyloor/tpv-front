import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { generateSalesPdf } from "../../../utils/generateSalesPdf";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";

const ListCashRegisterModal = ({ isOpen, onClose, inlineMode = false }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const shop = JSON.parse(localStorage.getItem("shop"));
  const shopsDict = useShopsDictionary();
  const employeesDict = useEmployeesDictionary();
  const EmployeeNameCell = ({ id_employee }) => (
    <span>{employeesDict[id_employee] || id_employee}</span>
  );

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const fetchData = async () => {
        try {
          const data = await apiFetch(`${API_BASE_URL}/get_pos_sessions`, {
            method: "GET",
          });
          const res = data.filter((s) => s.id_shop !== 1);
          setSessions(res);
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
      style={{
        axWidth: "70vw",
        maxHeight: "85vh",
        width: "65vw",
        height: "80vh",
      }}
    >
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <DataTable
            value={sessions}
            paginator
            rows={7}
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
              style={{ textAlign: "center", width: "5px" }}
              alignHeader="center"
            ></Column>
            <Column
              field="id_shop"
              header="Tienda"
              body={(rowData) => <span>{shopsDict[rowData.id_shop]}</span>}
              style={{ textAlign: "center", width: "100px" }}
              alignHeader="center"
            ></Column>
            <Column
              field="date_add"
              header="Fecha Apertura"
              style={{ textAlign: "center", width: "130px" }}
              alignHeader="center"
            ></Column>
            <Column
              field="id_employee_open"
              header="Empleado Apertura"
              body={(rowData) => (
                <EmployeeNameCell id_employee={rowData.id_employee_open} />
              )}
              style={{ textAlign: "center", width: "130px" }}
              alignHeader="center"
            ></Column>
            <Column
              field="date_close"
              header="Fecha Cierre"
              style={{ textAlign: "center", width: "130px" }}
              alignHeader="center"
            ></Column>
            <Column
              field="id_employee_close"
              header="Empleado Cierre"
              style={{ textAlign: "center" }}
              body={(rowData) => (
                <EmployeeNameCell id_employee={rowData.id_employee_close} />
              )}
              alignHeader="center"
            ></Column>
            <Column
              field="init_cash"
              header="Caja Inicial"
              style={{ textAlign: "center", width: "100px" }}
              alignHeader="center"
            ></Column>
            <Column
              field="total_cash"
              header="Total Efectivo"
              style={{ textAlign: "center", width: "100px" }}
              alignHeader="center"
            ></Column>
            <Column
              field="total_card"
              header="Total Tarjeta"
              style={{ textAlign: "center", width: "100px" }}
              alignHeader="center"
            ></Column>
            <Column
              field="total_bizum"
              header="Total Bizum"
              style={{ textAlign: "center", width: "100px" }}
              alignHeader="center"
            ></Column>
            <Column
              field="active"
              header="Activo"
              style={{ textAlign: "center", width: "50px" }}
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
