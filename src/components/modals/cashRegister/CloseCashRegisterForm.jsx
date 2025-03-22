// src/components/modals/cashRegister/CloseCashRegisterForm.jsx

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SalesReportModal from "../../reports/SalesReportModal";
import { useApiFetch } from "../../../utils/useApiFetch";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import ActionResultDialog from "../../common/ActionResultDialog";
import { Divider } from "primereact/divider";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { generateClosureTicket } from "../../../utils/ticket";

function formatNumber(value) {
  return isNaN(Number(value)) || value === "" ? "-" : value;
}

const CloseCashRegisterForm = ({ onClose }) => {
  const [fetchedTotalCash, setFetchedTotalCash] = useState(0.0);
  const [fetchedTotalCard, setFetchedTotalCard] = useState(0.0);
  const [fetchedTotalBizum, setFetchedTotalBizum] = useState(0.0);
  const [inputTotalCash, setInputTotalCash] = useState("");
  const [inputTotalCard, setInputTotalCard] = useState("");
  const [inputTotalBizum, setInputTotalBizum] = useState("");
  const [isCloseButtonDisabled, setIsCloseButtonDisabled] = useState(true);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);
  const [salesCount, setSalesCount] = useState(0);
  const [returnsCount, setReturnsCount] = useState(0);
  const [closingModalVisible, setClosingModalVisible] = useState(false);
  const [closingModalMessage, setClosingModalMessage] = useState("");
  const [closingModalSuccess, setClosingModalSuccess] = useState(false);

  const apiFetch = useApiFetch();
  const navigate = useNavigate();
  const { handleLogout, employeeId, employeeName } = useContext(AuthContext);
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
          const totalCashNum = parseFloat(data.total_cash);
          const totalCardNum = parseFloat(data.total_card);
          const totalBizumNum = parseFloat(data.total_bizum);
          setFetchedTotalCash(totalCashNum);
          setFetchedTotalCard(totalCardNum);
          setFetchedTotalBizum(totalBizumNum);
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
    const cashMatches = parseFloat(inputTotalCash) === fetchedTotalCash;
    const cardMatches = parseFloat(inputTotalCard) === fetchedTotalCard;
    const bizumMatches = parseFloat(inputTotalBizum) === fetchedTotalBizum;
    const allFilled =
      inputTotalCash !== "" && inputTotalCard !== "" && inputTotalBizum !== "";
    setIsCloseButtonDisabled(
      !(allFilled && cashMatches && cardMatches && bizumMatches)
    );
  }, [
    inputTotalCash,
    inputTotalCard,
    inputTotalBizum,
    fetchedTotalCash,
    fetchedTotalCard,
    fetchedTotalBizum,
  ]);

  useEffect(() => {
    const fetchSalesSummary = async () => {
      try {
        const today = new Date();
        const dateToStr = today.toISOString().split("T")[0] + " 23:59:59";
        const data = await apiFetch(`${API_BASE_URL}/get_sale_report_orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            license,
            date1: null,
            date2: dateToStr,
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

    if (license) {
      fetchSalesSummary();
    }
  }, [license, apiFetch, API_BASE_URL]);

  const handleCloseSalesReport = () => {
    setIsSalesReportOpen(false);
  };

  const handleOpenSalesReport = () => {
    setIsSalesReportOpen(true);
  };

  const handleCloseCashRegister = async () => {
    const closingDate = new Date();
    // Obtener datos de cierre desde get_report_amounts
    const reportData = await apiFetch(
      `${API_BASE_URL}/get_report_amounts?license=${license}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    // Construir objeto closureData con datos de reportData y metadatos
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
      total,
      iva,
    };
    const ticketConfig = JSON.parse(
      localStorage.getItem("ticketConfig") || "{}"
    );
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
        await generateClosureTicket("print", closureData, ticketConfig, employeeName);
      } else {
        showAlert(data.message || "No se pudo cerrar la caja");
      }
    } catch (error) {
      console.error("Error al cerrar la caja:", error);
      showAlert("Error al cerrar la caja: " + error.message);
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
          label="Reporte de Ventas"
          className="p-button-secondary"
          onClick={handleOpenSalesReport}
        />
        <Button
          label="Cerrar Caja"
          className="p-button-danger"
          disabled={isCloseButtonDisabled}
          onClick={handleCloseCashRegister}
        />
      </div>

      {isSalesReportOpen && (
        <SalesReportModal
          isOpen={isSalesReportOpen}
          onClose={handleCloseSalesReport}
        />
      )}

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
