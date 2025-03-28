// src/components/modals/cashRegister/CloseCashRegisterForm.jsx

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useApiFetch } from "../../../utils/useApiFetch";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import ActionResultDialog from "../../common/ActionResultDialog";
import { Divider } from "primereact/divider";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { generateClosureTicket } from "../../../utils/ticket";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";
import { ConfigContext } from "../../../contexts/ConfigContext";
import jsPDF from "jspdf";
import "jspdf-autotable";

function formatNumber(value) {
  return isNaN(Number(value)) || value === "" ? "0" : value;
}

const CloseCashRegisterForm = ({ onClose }) => {
  const [fetchedTotalCash, setFetchedTotalCash] = useState(0.0);
  const [fetchedTotalCard, setFetchedTotalCard] = useState(0.0);
  const [fetchedTotalBizum, setFetchedTotalBizum] = useState(0.0);
  const [inputTotalCash, setInputTotalCash] = useState("");
  const [inputTotalCard, setInputTotalCard] = useState("");
  const [inputTotalBizum, setInputTotalBizum] = useState("");
  const [isCloseButtonDisabled, setIsCloseButtonDisabled] = useState(true);
  const [salesCount, setSalesCount] = useState(0);
  const [returnsCount, setReturnsCount] = useState(0);
  const [closingModalVisible, setClosingModalVisible] = useState(false);
  const [closingModalMessage, setClosingModalMessage] = useState("");
  const [closingModalSuccess, setClosingModalSuccess] = useState(false);
  const [reportDateAdd, setReportDateAdd] = useState(null);
  const [pdfReportGenerated, setPdfReportGenerated] = useState(false);
  const [salesSummaryGenerated, setSalesSummaryGenerated] = useState(false);
  const employeesDict = useEmployeesDictionary();
  const { configData } = useContext(ConfigContext);

  const apiFetch = useApiFetch();
  const navigate = useNavigate();
  const { handleLogout, employeeId, employeeName, shopName } =
    useContext(AuthContext);
  const shop = JSON.parse(localStorage.getItem("shop"));
  const licenseData = JSON.parse(localStorage.getItem("licenseData")) || {};
  const license = licenseData.licenseKey;
  const API_BASE_URL = getApiBaseUrl();

  const showAlert = (message, success = false) => {
    setClosingModalSuccess(success);
    setClosingModalMessage(message);
    setClosingModalVisible(true);
  };

  useEffect(() => {
    const fetchReportAmounts = async () => {
      try {
        const data = await apiFetch(
          `${API_BASE_URL}/get_report_amounts?license=${license}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        if (data.status === "OK") {
          const totalCashNum = parseFloat(data.total_cash) || 0;
          const totalCardNum = parseFloat(data.total_card) || 0;
          const totalBizumNum = parseFloat(data.total_bizum) || 0;
          setFetchedTotalCash(totalCashNum);
          setFetchedTotalCard(totalCardNum);
          setFetchedTotalBizum(totalBizumNum);
          setReportDateAdd(data.date_add);
        } else {
          showAlert(data.message || "No se pudo obtener el reporte de caja");
        }
      } catch (error) {
        console.error("Error fetch report amounts:", error);
        showAlert("Error obteniendo reporte de caja: " + error.message);
      }
    };
    if (license) {
      fetchReportAmounts();
    }
  }, [license, apiFetch, API_BASE_URL]);

  useEffect(() => {
    const inputCashNum = inputTotalCash === "" ? 0 : parseFloat(inputTotalCash);
    const inputCardNum = inputTotalCard === "" ? 0 : parseFloat(inputTotalCard);
    const inputBizumNum =
      inputTotalBizum === "" ? 0 : parseFloat(inputTotalBizum);
    const validInput =
      inputCashNum === fetchedTotalCash &&
      inputCardNum === fetchedTotalCard &&
      inputBizumNum === fetchedTotalBizum;
    const reportsGenerated = pdfReportGenerated && salesSummaryGenerated;
    setIsCloseButtonDisabled(!(validInput && reportsGenerated));
  }, [
    inputTotalCash,
    inputTotalCard,
    inputTotalBizum,
    fetchedTotalCash,
    fetchedTotalCard,
    fetchedTotalBizum,
    pdfReportGenerated,
    salesSummaryGenerated,
  ]);

  useEffect(() => {
    const fetchSalesSummary = async () => {
      try {
        const today = new Date();
        const dateToWithTime = today
          .toLocaleString("en-GB", {
            timeZone: "Europe/Madrid",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
          .replace(
            /(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/,
            "$3-$2-$1 $4:$5:$6"
          );
        const data = await apiFetch(`${API_BASE_URL}/get_sale_report_orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            license,
            date1: reportDateAdd,
            date2: dateToWithTime,
          }),
        });
        if (Array.isArray(data)) {
          const salesSet = new Set();
          const returnsSet = new Set();
          data.forEach((order) => {
            const hasRectification = order.order_details.some(
              (detail) =>
                detail.product_name &&
                detail.product_name
                  .trim()
                  .toLowerCase()
                  .startsWith("rectificaci\u00f3n del ticket #")
            );
            if (hasRectification) {
              returnsSet.add(order.id_order);
            } else {
              salesSet.add(order.id_order);
            }
          });
          setSalesCount(salesSet.size);
          setReturnsCount(returnsSet.size);
        } else {
          showAlert(
            "No se recibieron datos o el formato no es el esperado para resumen de ventas."
          );
        }
      } catch (error) {
        console.error("Error obteniendo resumen de ventas:", error);
        showAlert("Error obteniendo resumen de ventas: " + error.message);
      }
    };

    if (license && reportDateAdd) {
      fetchSalesSummary();
    }
  }, [license, apiFetch, API_BASE_URL, reportDateAdd]);

  const handleCloseCashRegister = async () => {
    try {
      const data = await apiFetch(`${API_BASE_URL}/close_pos_session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license,
          id_employee: employeeId,
        }),
      });
      if (data.status === "OK") {
        showAlert("Cierre de caja realizado correctamente.", true);
      } else {
        showAlert(data.message || "No se pudo cerrar la caja");
      }
    } catch (error) {
      console.error("Error al cerrar la caja:", error);
      showAlert("Error al cerrar la caja: " + error.message);
    }
  };

  const handleGenerateSalesSummary = async () => {
    const closingDate = new Date();
    const reportData = await apiFetch(
      `${API_BASE_URL}/get_report_amounts?license=${license}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    const totalCash = parseFloat(reportData.total_cash) || 0;
    const totalCard = parseFloat(reportData.total_card) || 0;
    const totalBizum = parseFloat(reportData.total_bizum) || 0;
    const total = totalCash + totalCard + totalBizum;
    const iva = total - total / 1.21;
    const closureData = {
      date_add: reportData.date_add,
      date_close: closingDate,
      employee_open: reportData.id_employee_open,
      employee_close: reportData.id_employee_close,
      total_cash: totalCash,
      total_card: totalCard,
      total_bizum: totalBizum,
      shop_name: shopName,
      total,
      iva,
    };
    try {
      await generateClosureTicket(
        "print",
        closureData,
        configData,
        employeesDict,
        employeeName
      );
      setSalesSummaryGenerated(true);
    } catch (error) {
      console.error("Error generando el resumen:", error);
      alert("Error al generar el resumen del reporte de ventas.");
    }
  };

  const handleGeneratePdf = async () => {
    const today = new Date();
    if (!today) return;
    try {
      const dateToWithTime = today
        .toLocaleString("en-GB", {
          timeZone: "Europe/Madrid",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, "$3-$2-$1 $4:$5:$6");
      const data = await apiFetch(`${API_BASE_URL}/get_sale_report_orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license,
          date1: reportDateAdd,
          date2: dateToWithTime,
        }),
      });

      if (!Array.isArray(data)) {
        alert("Datos del reporte no válidos.");
        return;
      }

      const productLines = data.flatMap((order) =>
        order.order_details.map((detail) => {
          // Extract combination from product_name
          let combination = "";
          if (detail.product_name && detail.product_reference) {
            const refIndex = detail.product_name.indexOf(
              detail.product_reference
            );
            if (refIndex !== -1) {
              const afterRef = detail.product_name.substring(
                refIndex + detail.product_reference.length
              );
              // Get text after the dash (and trim whitespace)
              const dashIndex = afterRef.indexOf("-");
              if (dashIndex !== -1) {
                combination = afterRef.substring(dashIndex + 1).trim();
              }
            }
          }

          // Calcular texto de pago usando los amounts en la orden según reglas:
          const payments = order.payment
            .split(",")
            .map((p) => p.trim().toLowerCase());
          const cashAmount = order.total_cash || 0;
          const cardAmount = order.total_card || 0;
          const bizumAmount = order.total_bizum || 0;
          const includedMethods = [];
          if (payments.includes("efectivo")) {
            includedMethods.push({ method: "efectivo", amount: cashAmount });
          }
          if (payments.includes("tarjeta")) {
            includedMethods.push({ method: "tarjeta", amount: cardAmount });
          }
          if (payments.includes("bizum")) {
            includedMethods.push({ method: "bizum", amount: bizumAmount });
          }
          const nonZeroCount = includedMethods.filter(
            (m) => m.amount > 0
          ).length;
          const paymentText = includedMethods
            .map((m) =>
              nonZeroCount > 1 && m.amount > 0
                ? `${m.method}: ${m.amount.toFixed(2)}€`
                : m.method
            )
            .join(", ");
          return {
            id_order: order.id_order,
            customer_name: order.customer_name?.includes("TPV")
              ? "TPV"
              : order.customer_name,
            payment: paymentText,
            product_quantity: detail.product_quantity,
            product_reference: detail.product_reference,
            combination_name: combination,
            product_name: detail.product_name,
            total_price_tax_incl: detail.total_price_tax_incl,
            reduction_amount_tax_incl: detail.reduction_amount_tax_incl || 0,
            total_cash: order.total_cash || 0,
            total_card: order.total_card || 0,
            total_bizum: order.total_bizum || 0,
          };
        })
      );

      // Calcular suma de descuentos realizados en todas las líneas:
      let discountSum = 0;
      data.forEach((order) => {
        order.order_details.forEach((detail) => {
          const reduction = parseFloat(detail.reduction_amount_tax_incl) || 0;
          if (reduction !== 0) {
            const original = parseFloat(detail.total_price_tax_incl);
            discountSum += (original - reduction) * detail.product_quantity;
          }
        });
      });

      const tableRows = productLines.map((item) => {
        // Se genera el valor para "Importe" según si existe descuento
        let precio;
        if (
          item.reduction_amount_tax_incl &&
          item.reduction_amount_tax_incl !== 0
        ) {
          precio = {
            discount: true,
            original: Number(item.total_price_tax_incl).toFixed(2) + "€",
            discounted: Number(item.reduction_amount_tax_incl).toFixed(2) + "€",
          };
        } else {
          precio = Number(item.total_price_tax_incl).toFixed(2) + "€";
        }
        return [
          item.id_order,
          item.customer_name,
          item.product_quantity,
          item.product_reference,
          item.combination_name,
          item.payment,
          precio,
        ];
      });

      const totalCash = data.reduce(
        (acc, order) => acc + (order.total_cash || 0),
        0
      );
      const totalCard = data.reduce(
        (acc, order) => acc + (order.total_card || 0),
        0
      );
      const totalBizum = data.reduce(
        (acc, order) => acc + (order.total_bizum || 0),
        0
      );

      const doc = new jsPDF("p", "pt", "a4");
      const margin = 40;
      let yPos = margin;

      doc.setFontSize(18);
      doc.text(`Reporte de ventas: ${shopName}`, margin, yPos);
      yPos += 25;
      doc.setFontSize(12);
      doc.text(
        `Fecha generación reporte: ${new Date().toLocaleString()}`,
        margin,
        yPos
      );
      yPos += 30;

      const tableColumn = [
        "Ticket",
        "Cliente",
        "Cant.",
        "Referencia",
        "Combinación",
        "Pago",
        "Importe",
      ];
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: { fontSize: 12 },
        theme: "grid",
        // Nuevo hook para evitar que se imprima el objeto por defecto
        didParseCell: function (data) {
          if (
            data.column.index === 6 &&
            data.cell.raw &&
            data.cell.raw.discount
          ) {
            data.cell.text = [];
          }
        },
        didDrawCell: function (data) {
          // Verificar si es la columna de "Importe" y si el valor es un objeto de descuento
          if (
            data.column.index === 6 &&
            data.cell.raw &&
            data.cell.raw.discount
          ) {
            const originalText = data.cell.raw.original;
            const discountedText = data.cell.raw.discounted;
            const { x, y } = data.cell;
            // Dibujar importe original mas pequeño y con tachado
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            const origX = x + 2;
            const origY = y + 10;
            doc.text(originalText, origX, origY);
            const origTextWidth = doc.getTextWidth(originalText);
            doc.setDrawColor(255, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(origX, origY - 2, origX + origTextWidth, origY - 2);
            // Dibujar importe con descuento en rojo mas grande
            doc.setTextColor(255, 0, 0);
            doc.setFontSize(12);
            doc.text(discountedText, origX, origY + 10);
          }
        },
      });

      // Obtener posición final tras la tabla de productos
      let finalY = doc.lastAutoTable.finalY + 20;

      // Nueva tabla de pagos similar a la de productos
      const paymentTableHead = [
        ["Total Efectivo", "Total Tarjeta", "Total Bizum"],
      ];
      const paymentTableBody = [
        [
          totalCash.toFixed(2) + "€",
          totalCard.toFixed(2) + "€",
          totalBizum.toFixed(2) + "€",
        ],
      ];
      doc.autoTable({
        head: paymentTableHead,
        body: paymentTableBody,
        startY: finalY,
        margin: { left: margin, right: margin },
        styles: { fontSize: 12 },
        theme: "grid",
      });

      finalY = doc.lastAutoTable.finalY + 20;

      const totalPaid = data.reduce(
        (acc, order) => acc + (order.total_paid || 0),
        0
      );

      // Tabla de totales generales; se añade la fila de descuentos si corresponde.
      const totalsTableBody = [];
      if (discountSum > 0) {
        totalsTableBody.push([
          "TOTAL SIN DESCUENTOS:",
          (totalPaid + discountSum).toFixed(2) + "€",
        ]);
        totalsTableBody.push([
          "TOTAL DESCUENTOS:",
          discountSum.toFixed(2) + "€",
        ]);
      }
      totalsTableBody.push(["TOTAL:", totalPaid.toFixed(2) + "€"]);
      doc.autoTable({
        head: [],
        body: totalsTableBody,
        startY: finalY,
        margin: { left: margin, right: margin },
        styles: { fontSize: 12, halign: "right" },
        tableLineWidth: 0,
      });

      doc.save("reporte_ventas.pdf");
      setPdfReportGenerated(true);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF.");
    }
  };

  // Función para cerrar el modal de mensaje y continuar si fue éxito.
  const handleCloseResultModal = () => {
    setClosingModalVisible(false);
    if (closingModalSuccess) {
      onClose();
      handleLogout();
      navigate(`/${shop.route}`);
    }
  };

  return (
    <>
      {/* Grupo 1: Totales, ventas y devoluciones */}
      <div className="mb-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              Total Efectivo
            </label>
            <div className="p-inputgroup flex-1">
              <span className="p-inputgroup-addon">
                <i className="pi pi-money-bill" />
              </span>
              <InputText
                value={`${formatNumber(fetchedTotalCash.toFixed(2))} €`}
                disabled
                className="text-right"
              />
              <span className="p-inputgroup-addon">
                <i className="pi pi-euro" />
              </span>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              Total Tarjeta
            </label>
            <div className="p-inputgroup flex-1">
              <span className="p-inputgroup-addon">
                <i className="pi pi-credit-card" />
              </span>
              <InputText
                value={`${formatNumber(fetchedTotalCard.toFixed(2))} €`}
                disabled
                className="text-right"
              />
              <span className="p-inputgroup-addon">
                <i className="pi pi-euro" />
              </span>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              Total Bizum
            </label>
            <div className="p-inputgroup flex-1">
              <span className="p-inputgroup-addon">
                <i className="pi pi-phone" />
              </span>
              <InputText
                value={`${formatNumber(fetchedTotalBizum.toFixed(2))} €`}
                disabled
                className="text-right"
              />
              <span className="p-inputgroup-addon">
                <i className="pi pi-euro" />
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              Num. Ventas
            </label>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-arrow-up" />
              </span>
              <InputText
                value={formatNumber(salesCount)}
                disabled
                className="w-full text-right dark:text-gray-300"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium dark:text-gray-300 mb-1">
              Num. Devoluciones
            </label>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon">
                <i className="pi pi-arrow-down" />
              </span>
              <InputText
                value={formatNumber(returnsCount)}
                disabled
                className="w-full text-right dark:text-gray-300"
              />
            </div>
          </div>
        </div>
      </div>

      <Divider style={{ borderColor: "var(--surface-border)" }} />

      {/* Grupo 2: Inputs totales en una misma fila */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label
            htmlFor="inputTotalCash"
            className="block text-sm font-medium dark:text-gray-300 mb-1"
          >
            Total Efectivo
          </label>
          <InputNumber
            inputId="inputTotalCash"
            value={inputTotalCash}
            onValueChange={(e) => setInputTotalCash(e.value)}
            mode="decimal"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="inputTotalCard"
            className="block text-sm font-medium dark:text-gray-300 mb-1"
          >
            Total Tarjeta
          </label>
          <InputNumber
            inputId="inputTotalCard"
            value={inputTotalCard}
            onValueChange={(e) => setInputTotalCard(e.value)}
            mode="decimal"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="inputTotalBizum"
            className="block text-sm font-medium dark:text-gray-300 mb-1"
          >
            Total Bizum
          </label>
          <InputNumber
            inputId="inputTotalBizum"
            value={inputTotalBizum}
            onValueChange={(e) => setInputTotalBizum(e.value)}
            mode="decimal"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 mb-4"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          label="Generar Reporte PDF"
          className="p-button-success"
          onClick={handleGeneratePdf}
        />
        <Button
          label="Resumen Reporte Ventas"
          className="p-button-info"
          onClick={handleGenerateSalesSummary}
        />
        <Button
          label="Cerrar Caja"
          className="p-button-danger"
          onClick={handleCloseCashRegister}
        />
      </div>

      <ActionResultDialog
        visible={closingModalVisible}
        onClose={handleCloseResultModal}
        success={closingModalSuccess}
        message={closingModalMessage}
      />
    </>
  );
};

export default CloseCashRegisterForm;
