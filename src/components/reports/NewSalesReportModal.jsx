import React, { useState, useEffect, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useApiFetch } from "../../utils/useApiFetch";
import getApiBaseUrl from "../../utils/getApiBaseUrl";
import { useShopsDictionary } from "../../hooks/useShopsDictionary";
import { useEmployeesDictionary } from "../../hooks/useEmployeesDictionary";
import { ConfigContext } from "../../contexts/ConfigContext";
import { formatShortDate } from "../../utils/dateUtils";
import { generateSalesPdf } from "../../utils/generateSalesPdf";

const NewSalesReportModal = ({ isOpen, onClose, inlineMode = false }) => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const shopsDict = useShopsDictionary();
  const employeesDict = useEmployeesDictionary();
  const { configData } = useContext(ConfigContext);

  const [shopsOptions, setShopsOptions] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    const opts = Object.keys(shopsDict).map((key) => ({ id: Number(key), name: shopsDict[key] }));
    setShopsOptions(opts);
  }, [shopsDict]);

  const handleSearch = async () => {
    if (!selectedShop || !dateFrom || !dateTo) return;
    setLoading(true);
    try {
      const data = await apiFetch(`${API_BASE_URL}/get_pos_sessions`, { method: "GET" });
      if (Array.isArray(data)) {
        const fromTime = new Date(dateFrom);
        fromTime.setHours(0, 0, 0, 0);
        const toTime = new Date(dateTo);
        toTime.setHours(23, 59, 59, 999);
        const filtered = data.filter((s) => {
          if (s.id_shop !== selectedShop.id && s.id_shop !== selectedShop) return false;
          const sessionDate = new Date(s.date_add);
          return sessionDate >= fromTime && sessionDate <= toTime;
        });
        setSessions(filtered);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (id) => employeesDict[id] || id;

  const handleGenerateSessionPdf = async () => {
    if (!selectedSession) {
      alert("Seleccione primero una caja.");
      return;
    }
    try {
      const saleReportData = await apiFetch(`${API_BASE_URL}/get_pos_session_sale_report_orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pos_session: selectedSession.id_pos_session }),
      });
      if (!Array.isArray(saleReportData)) {
        alert("Datos del reporte no válidos.");
        return;
      }
      const { date_add, date_close, id_employee_open, id_employee_close, total_cash, total_card, total_bizum, id_shop } = selectedSession;
      const tc = parseFloat(total_cash) || 0;
      const tcard = parseFloat(total_card) || 0;
      const tbizum = parseFloat(total_bizum) || 0;
      const total = tc + tcard + tbizum;
      const iva = total - total / 1.21;
      const closureDate = date_close && date_close !== "" ? new Date(date_close) : new Date();
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
      const formattedDate = formatShortDate(date_add);
      const pdfName = `${closureData.shop_name} - ${formattedDate}`;
      const result = generateSalesPdf(saleReportData, pdfName, closureData, configData);
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
      <Button label="Buscar" icon="pi pi-search" onClick={handleSearch} />
      <Button label="Generar reporte ventas PDF" icon="pi pi-file-pdf" onClick={handleGenerateSessionPdf} />
    </div>
  );

  const getAppendTarget = () => {
    if (inlineMode) {
      const target = document.getElementById("mobile-modals-container");
      return target ? target : document.body;
    }
    return document.body;
  };

  const dataWithTotals = sessions.map((s) => {
    const tc = parseFloat(s.total_cash) || 0;
    const tcard = parseFloat(s.total_card) || 0;
    const tbizum = parseFloat(s.total_bizum) || 0;
    return { ...s, total: tc + tcard + tbizum };
  });

  return (
    <Dialog
      header="Reporte de Ventas (Nuevo)"
      visible={isOpen}
      onHide={onClose}
      modal
      appendTo={getAppendTarget()}
      style={{ width: "60%", height: "70%", minWidth: "800px", minHeight: "600px" }}
      draggable={false}
      resizable={false}
      footer={footer}
    >
      <div className="flex space-x-4 mb-4">
        <Dropdown
          value={selectedShop}
          options={shopsOptions}
          onChange={(e) => setSelectedShop(e.value)}
          optionLabel="name"
          placeholder="Elige una tienda"
          className="w-4"
        />
        <Calendar value={dateFrom} onChange={(e) => setDateFrom(e.value)} dateFormat="yy-mm-dd" placeholder="Desde" showIcon />
        <Calendar value={dateTo} onChange={(e) => setDateTo(e.value)} dateFormat="yy-mm-dd" placeholder="Hasta" showIcon />
      </div>
      <DataTable
        value={dataWithTotals}
        paginator
        rows={7}
        className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
        selectionMode="single"
        selection={selectedSession}
        onSelectionChange={(e) => setSelectedSession(e.value)}
        dataKey="id_pos_session"
        responsiveLayout="scroll"
        emptyMessage={loading ? "Cargando..." : "No hay resultados"}
      >
        <Column
          field="date_add"
          header="Fecha"
          body={(row) => formatShortDate(row.date_add)}
          style={{ textAlign: "center", width: "120px" }}
          alignHeader="center"
        ></Column>
        <Column field="total_cash" header="Total Efectivo" style={{ textAlign: "center", width: "120px" }} alignHeader="center"></Column>
        <Column field="total_card" header="Total Tarjeta" style={{ textAlign: "center", width: "120px" }} alignHeader="center"></Column>
        <Column field="total_bizum" header="Total Bizum" style={{ textAlign: "center", width: "120px" }} alignHeader="center"></Column>
        <Column field="total" header="Total" style={{ textAlign: "center", width: "120px" }} alignHeader="center"></Column>
      </DataTable>
    </Dialog>
  );
};

export default NewSalesReportModal;
