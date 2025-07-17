import React, { useState, useEffect, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { generateSalesPdf } from "../../../utils/generateSalesPdf";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";
import { ConfigContext } from "../../../contexts/ConfigContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { generateClosureTicket } from "../../../utils/ticket";
import { formatLongDate, formatFullDateTime } from "../../../utils/dateUtils";
import { formatCurrencyES } from "../../../utils/formatters";

const ListCashRegisterModal = ({ isOpen, onClose, inlineMode = false }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const shopsDict = useShopsDictionary();
  const employeesDict = useEmployeesDictionary();
  const { configData } = useContext(ConfigContext);
  const { employeeName } = useContext(AuthContext);

  const getEmployeeName = (id_employee) =>
    employeesDict[id_employee] || id_employee;

  const EmployeeNameCell = ({ id_employee }) => (
    <span>{getEmployeeName(id_employee)}</span>
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
      const {
        date_add,
        date_close,
        id_employee_open,
        id_employee_close,
        total_cash,
        total_card,
        total_bizum,
        id_shop,
      } = selectedSession;
      console.log(selectedSession)
      const tc = parseFloat(total_cash) || 0;
      const tcard = parseFloat(total_card) || 0;
      const tbizum = parseFloat(total_bizum) || 0;
      const total = tc + tcard + tbizum;
      const iva = total - total / 1.21;
      const closureDate =
        date_close && date_close !== "" ? new Date(date_close) : new Date();
      const closureData = {
        date_add,
        date_close: closureDate,
        employee_open: getEmployeeName(id_employee_open),
        employee_close: getEmployeeName(id_employee_close),
        total_cash: tc,
        total_card: tcard,
        total_bizum: tbizum,
        shop_name: shopsDict[id_shop],
        total,
        iva,
      };
      const formattedDate = formatLongDate(date_add);
      const pdfName = `${closureData.shop_name} - ${formattedDate}`;
      const result = generateSalesPdf(
        saleReportData,
        pdfName,
        closureData,
        configData
      );
      if (!result) {
        alert("Error generando el PDF.");
      }
    } catch (error) {
      console.error("Error generando PDF para la sesión:", error);
      alert("Error al generar el PDF.");
    }
  };

  const handleGenerateSalesSummaryTicket = async () => {
    if (!selectedSession) {
      alert("Seleccione primero una caja.");
      return;
    }
    const {
      date_add,
      date_close,
      id_employee_open,
      id_employee_close,
      total_cash,
      total_card,
      total_bizum,
      id_shop,
    } = selectedSession;
    const totalCashVal = parseFloat(total_cash) || 0;
    const totalCardVal = parseFloat(total_card) || 0;
    const totalBizumVal = parseFloat(total_bizum) || 0;
    const total = totalCashVal + totalCardVal + totalBizumVal;
    const iva = total - total / 1.21;
    const closureDate =
      date_close && date_close !== "" ? new Date(date_close) : new Date();
    const closureData = {
      date_add,
      date_close: closureDate,
      employee_open: id_employee_open,
      employee_close: id_employee_close,
      total_cash: totalCashVal,
      total_card: totalCardVal,
      total_bizum: totalBizumVal,
      shop_name: shopsDict[id_shop],
      total,
      iva,
    };
    try {
      const result = await generateClosureTicket(
        "print",
        closureData,
        configData,
        employeesDict,
        employeeName
      );
      if (result.success || result.manual) {
        alert(
          "Ticket Resumen Reporte de Ventas generado e impreso correctamente."
        );
        if (result.manual) {
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(
              `<html><head><title>Vista Previa del Ticket Resumen</title></head>
              <body style="margin:0">
                <iframe width="100%" height="100%" src="${result.pdfDataUrl}" frameborder="0"></iframe>
              </body></html>`
            );
            printWindow.document.close();
            printWindow.focus();
          }
        }
      } else {
        alert(
          result.message ||
            "Error al generar el ticket Resumen Reporte de Ventas."
        );
      }
    } catch (error) {
      console.error("Error generando ticket resumen:", error);
      alert("Error generando el ticket resumen: " + error.message);
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
        label="Generar ticket resumen ventas"
        icon="pi pi-print"
        onClick={handleGenerateSalesSummaryTicket}
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
              style={{ textAlign: "center", width: "200px" }}
              alignHeader="center"
              body={(rowData) => formatFullDateTime(rowData.date_add)}
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
              style={{ textAlign: "center", width: "200px" }}
              alignHeader="center"
              body={(rowData) =>
                rowData.date_close ? formatFullDateTime(rowData.date_close) : ""
              }
            ></Column>
            <Column
              field="id_employee_close"
              header="Empleado Cierre"
              style={{ textAlign: "center", width: "130px" }}
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
              body={(rowData) => formatCurrencyES(rowData.init_cash)}
            ></Column>
            <Column
              field="total_cash"
              header="Total Efectivo"
              style={{ textAlign: "center", width: "100px" }}
              alignHeader="center"
              body={(rowData) => formatCurrencyES(rowData.total_cash)}
            ></Column>
            <Column
              field="total_card"
              header="Total Tarjeta"
              style={{ textAlign: "center", width: "100px" }}
              alignHeader="center"
              body={(rowData) => formatCurrencyES(rowData.total_card)}
            ></Column>
            <Column
              field="total_bizum"
              header="Total Bizum"
              style={{ textAlign: "center", width: "100px" }}
              alignHeader="center"
              body={(rowData) => formatCurrencyES(rowData.total_bizum)}
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
