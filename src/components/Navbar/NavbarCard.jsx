// src/components/Navbar/NavbarCard.jsx

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TransfersModal from "../modals/transfers/TransfersModal";
import ConfigurationModal from "../modals/configuration/ConfigurationModal";
import SalesReportModal from "../../components/reports/SalesReportModal";
import CloseCashRegisterModal from "../modals/cashRegister/CloseCashRegisterModal";

const NavbarCard = () => {
  const [isTransfersModalOpen, setTransfersModalOpen] = useState(false);
  const [isConfigurationModalOpen, setConfigurationModalOpen] = useState(false);
  const [isSalesReportModalOpen, setIsSalesReportModalOpen] = useState(false);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);

  // Se han quitado las referencias a isClientModalOpen, isAddressModalOpen, etc.

  const navigate = useNavigate();
  const {
    idProfile,
    employeeName,
    shopName,
    handleLogout,
    openCloseCashModal,
    setOpenCloseCashModal,
  } = useContext(AuthContext);

  // También se retiran las referencias a selectedClient, selectedAddress, etc.
  // Pues ahora está en SalesCard.

  const shop = JSON.parse(localStorage.getItem("shop"));

  const handleLogoutClick = () => {
    handleLogout();
    navigate(`/${shop.route}`);
  };

  useEffect(() => {
    if (openCloseCashModal) {
      setIsCashRegisterModalOpen(true);
      setOpenCloseCashModal(false);
    }
  }, [openCloseCashModal, setOpenCloseCashModal]);

  const handleCloseCashRegisterModal = () => {
    setIsCashRegisterModalOpen(false);
  };

  const handleOpenSalesReport = () => {
    setIsSalesReportModalOpen(true);
  };

  const handleOpenCashRegister = () => {
    setIsCashRegisterModalOpen(true);
  };

  return (
    <div className="p-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">{shopName} TPV</h1>

      {/* Se ha eliminado el bloque de cliente/dirección que antes estaba aquí */}

      <div className="border-l h-6 mx-4"></div>

      <div className="flex items-center space-x-4">
        {idProfile === 1 && (
          <button
            className="text-black hover:text-gray-600"
            onClick={() => setTransfersModalOpen(true)}
          >
            Transferencias
          </button>
        )}
        <button className="text-black hover:text-gray-600">Labels</button>
        <button
          className="text-black hover:text-gray-600"
          onClick={handleOpenCashRegister}
        >
          Caja
        </button>
        <button
          className="text-black hover:text-gray-600"
          onClick={() => setConfigurationModalOpen(true)}
        >
          Configuración
        </button>
        {idProfile === 1 && (
          <button
            className="text-black hover:text-gray-600"
            onClick={handleOpenSalesReport}
          >
            Reportes de Ventas
          </button>
        )}
      </div>

      <div className="border-l h-6 mx-4"></div>

      {/* Bloque final: Empleado y logout */}
      <div className="flex items-center space-x-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="h-5 w-5"
        >
          <path d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Z" />
          <path d="M8.5 9.75a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0Z" />
        </svg>
        <span className="font-semibold text-gray-700">{employeeName}</span>
        <button
          onClick={handleLogoutClick}
          className="text-black hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="h-5 w-5"
          >
            <path d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>

      {/* Modales que se mantienen aquí */}
      <TransfersModal
        isOpen={isTransfersModalOpen}
        onClose={() => setTransfersModalOpen(false)}
      />

      <ConfigurationModal
        isOpen={isConfigurationModalOpen}
        onClose={() => setConfigurationModalOpen(false)}
      />

      <SalesReportModal
        isOpen={isSalesReportModalOpen}
        onClose={() => setIsSalesReportModalOpen(false)}
      />

      <CloseCashRegisterModal
        isOpen={isCashRegisterModalOpen}
        onClose={handleCloseCashRegisterModal}
      />
    </div>
  );
};

export default NavbarCard;