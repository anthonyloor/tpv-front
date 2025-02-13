// src/components/modals/cashRegister/CloseCashRegisterForm.jsx

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SalesReportModal from "../../reports/SalesReportModal";
import { useApiFetch } from "../../../components/utils/useApiFetch";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

const CloseCashRegisterForm = ({ onClose }) => {
  const [numberOfSales, setNumberOfSales] = useState(0);
  const [totalSalesTPV, setTotalSalesTPV] = useState(0);
  const [totalSalesStore, setTotalSalesStore] = useState("");
  const [fetchedTotalCash, setFetchedTotalCash] = useState(0.0);
  const [fetchedTotalCard, setFetchedTotalCard] = useState(0.0);
  const [fetchedTotalBizum, setFetchedTotalBizum] = useState(0.0);
  const [inputTotalCash, setInputTotalCash] = useState("");
  const [inputTotalCard, setInputTotalCard] = useState("");
  const [inputTotalBizum, setInputTotalBizum] = useState("");
  const [isCloseButtonDisabled, setIsCloseButtonDisabled] = useState(true);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);

  const apiFetch = useApiFetch();
  const navigate = useNavigate();
  const { handleLogout, employeeId } = useContext(AuthContext);
  const shop = JSON.parse(localStorage.getItem("shop"));
  const licenseData = JSON.parse(localStorage.getItem("licenseData")) || {};
  const license = licenseData.licenseKey;

  useEffect(() => {
    const fetchReportAmounts = async () => {
      try {
        const data = await apiFetch(
          `https://apitpv.anthonyloor.com/get_report_amounts?license=${license}`,
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
          const dummyNumberOfSales = 10;
          const dummyTotalSalesTPV =
            totalCashNum + totalCardNum + totalBizumNum;
          setNumberOfSales(dummyNumberOfSales);
          setTotalSalesTPV(totalSalesTPV);
        } else {
          alert(data.message || "No se pudo obtener el reporte de caja");
        }
      } catch (error) {
        console.error("Error fetch report amounts:", error);
      }
    };
    if (license) {
      fetchReportAmounts();
    }
  }, [license, apiFetch]);

  useEffect(() => {
    const cashMatches = parseFloat(inputTotalCash) === fetchedTotalCash;
    const cardMatches = parseFloat(inputTotalCard) === fetchedTotalCard;
    const bizumMatches = parseFloat(inputTotalBizum) === fetchedTotalBizum;
    const salesMatches =
      parseFloat(totalSalesStore) === parseFloat(totalSalesTPV);
    setIsCloseButtonDisabled(
      !(cashMatches && cardMatches && bizumMatches && salesMatches)
    );
  }, [
    inputTotalCash,
    inputTotalCard,
    inputTotalBizum,
    totalSalesStore,
    fetchedTotalCash,
    fetchedTotalCard,
    fetchedTotalBizum,
    totalSalesTPV,
  ]);

  const handleInputChange = (e) => {
    setTotalSalesStore(e.value);
  };

  const handleCloseSalesReport = () => {
    setIsSalesReportOpen(false);
  };

  const handleOpenSalesReport = () => {
    setIsSalesReportOpen(true);
  };

  const handleCloseCashRegister = async () => {
    try {
      const data = await apiFetch(
        "https://apitpv.anthonyloor.com/close_pos_session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            license,
            employeeId,
          }),
        }
      );
      if (data.status === "OK") {
        alert("Cierre de caja realizado exitosamente.");
        onClose();
        handleLogout();
        navigate(`/${shop.route}`);
      } else {
        alert(data.message || "No se pudo cerrar la caja.");
      }
    } catch (error) {
      console.error("Error al cerrar la caja:", error);
      alert("Error al cerrar la caja.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">
              <i className="pi pi-money-bill" />
            </span>
            <InputText
              value={`${fetchedTotalCash.toFixed(2)} €`}
              disabled
              className="text-right"
            />
            <span className="p-inputgroup-addon">
              <i className="pi pi-euro" />
            </span>
          </div>

          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">
              <i className="pi pi-credit-card" />
            </span>
            <InputText
              value={`${fetchedTotalCard.toFixed(2)} €`}
              disabled
              className="text-right"
            />
            <span className="p-inputgroup-addon">
              <i className="pi pi-euro" />
            </span>
          </div>

          <div className="p-inputgroup flex-1">
            <span className="p-inputgroup-addon">
              <i className="pi pi-phone" />
            </span>
            <InputText
              value={`${fetchedTotalBizum.toFixed(2)} €`}
              disabled
              className="text-right"
            />
            <span className="p-inputgroup-addon">
              <i className="pi pi-euro" />
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="totalSalesStore"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total de Ventas Tienda
          </label>
          <InputNumber
            inputId="totalSalesStore"
            value={totalSalesStore}
            onValueChange={handleInputChange}
            mode="decimal"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="Ingresa el total de ventas de la tienda"
          />
        </div>

        <div>
          <label
            htmlFor="inputTotalCash"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total Efectivo (coincidir con {fetchedTotalCash.toFixed(2)} €)
          </label>
          <InputNumber
            inputId="inputTotalCash"
            value={inputTotalCash}
            onValueChange={(e) => setInputTotalCash(e.value)}
            mode="decimal"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 mb-4"
          />
          <label
            htmlFor="inputTotalCard"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total Tarjeta (coincidir con {fetchedTotalCard.toFixed(2)} €)
          </label>
          <InputNumber
            inputId="inputTotalCard"
            value={inputTotalCard}
            onValueChange={(e) => setInputTotalCard(e.value)}
            mode="decimal"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 mb-4"
          />
          <label
            htmlFor="inputTotalBizum"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total Bizum (coincidir con {fetchedTotalBizum.toFixed(2)} €)
          </label>
          <InputNumber
            inputId="inputTotalBizum"
            value={inputTotalBizum}
            onValueChange={(e) => setInputTotalBizum(e.value)}
            mode="decimal"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 mb-4"
          />
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
      </div>

      {isSalesReportOpen && (
        <SalesReportModal onClose={handleCloseSalesReport} />
      )}
    </>
  );
};

export default CloseCashRegisterForm;
