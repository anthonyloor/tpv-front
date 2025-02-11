// src/components/Navbar/NavbarCard.jsx

import React, { useState, useContext, useEffect } from "react";
import { isMobile } from "react-device-detect";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { Menubar } from "primereact/menubar";
import PortalOrNormal from "../../components/PortalOrNormal";

import TransfersModal from "../modals/transfers/TransfersModal";
import ConfigurationModal from "../modals/configuration/ConfigurationModal";
import SalesReportModal from "../reports/SalesReportModal";
import CloseCashRegisterModal from "../modals/cashRegister/CloseCashRegisterModal";
import ThemeSwitcher from "../ThemeSwitcher";
import { Button } from "primereact/button";

const NavbarCard = () => {
  const navigate = useNavigate();
  const {
    idProfile,
    employeeName,
    shopName,
    handleLogout,
    openCloseCashModal,
    setOpenCloseCashModal,
  } = useContext(AuthContext);

  const shop = JSON.parse(localStorage.getItem("shop"));

  const [isTransfersModalOpen, setTransfersModalOpen] = useState(false);
  const [isConfigurationModalOpen, setConfigurationModalOpen] = useState(false);
  const [isSalesReportModalOpen, setIsSalesReportModalOpen] = useState(false);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);

  const [configModalView] = useState("config");

  const closeAllModals = () => {
    setTransfersModalOpen(false);
    setConfigurationModalOpen(false);
    setIsSalesReportModalOpen(false);
    setIsCashRegisterModalOpen(false);
  };

  const openTransfers = () => {
    closeAllModals();
    setTransfersModalOpen(true);
  };
  /*
  const openConfig = (view = "config") => {
    closeAllModals();
    setConfigModalView(view);
    setConfigurationModalOpen(true);
  };
  */
  const openSalesReport = () => {
    closeAllModals();
    setIsSalesReportModalOpen(true);
  };

  const openCashRegister = () => {
    closeAllModals();
    setIsCashRegisterModalOpen(true);
  };

  useEffect(() => {
    if (openCloseCashModal) {
      closeAllModals();
      setIsCashRegisterModalOpen(true);
      setOpenCloseCashModal(false);
    }
  }, [openCloseCashModal, setOpenCloseCashModal]);

  const handleLogoutClick = () => {
    handleLogout();
    if (shop?.route) {
      navigate(`/${shop.route}`);
    } else {
      navigate("/");
    }
  };

  // Menubar items
  const items = [
    {
      label: shopName,
      icon: "pi pi-home",
      command: () => navigate(`/${shop.route}/app`),
    },
    ...(idProfile === 1
      ? [
          {
            label: "Gestion stock",
            icon: "pi pi-warehouse",
            command: openTransfers,
          },
        ]
      : []),
    {
      label: "Caja",
      icon: "pi pi-desktop",
      command: openCashRegister,
    },
    {
      label: "Etiquetas",
      icon: "pi pi-barcode",
      command: () => console.log("Clicked Labels"),
    },
    ...(idProfile === 1
      ? [
          {
            label: "Reportes",
            icon: "pi pi-chart-bar",
            command: openSalesReport,
          },
        ]
      : []),
    /*{
      label: "Configuración",
      icon: "pi pi-cog",
      items: [
        {
          label: "Permisos",
          icon: "pi pi-lock",
          command: () => openConfig("permisos"),
        },
        {
          label: "Impresoras",
          icon: "pi pi-print",
          command: () => openConfig("impresoras"),
        },
        {
          label: "Inventario",
          icon: "pi pi-folder-open",
          command: () => openConfig("inventory"),
        },
      ],
    },*/
  ];

  // Parte derecha del Menubar
  const end = (
    <div
      className="flex items-center gap-4 mr-4"
      style={{ color: "var(--text-color)" }}
    >
      <div className="flex items-center gap-2">
        <i className="pi pi-user" />
        <span className="font-bold">{employeeName}</span>
      </div>
      <Button
        icon="pi pi-sign-out"
        onClick={handleLogoutClick}
        className="p-button-text text-lg"
        style={{ color: "var(--text-color)" }}
      />
      <ThemeSwitcher />
    </div>
  );

  return (
    <>
      <Menubar
        model={items}
        end={end}
        style={{
          backgroundColor: "var(--surface-0)",
          borderColor: "var(--surface-border)",
          color: "var(--text-color)",
        }}
      />

      {/* (1) TransfersModal */}
      {isTransfersModalOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <TransfersModal
            isOpen
            inlineMode={isMobile}
            onClose={() => setTransfersModalOpen(false)}
          />
        </PortalOrNormal>
      )}

      {/* (2) ConfigurationModal */}
      {isConfigurationModalOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <ConfigurationModal
            isOpen
            inlineMode={isMobile}
            initialView={configModalView}
            onClose={() => setConfigurationModalOpen(false)}
          />
        </PortalOrNormal>
      )}

      {/* (3) SalesReportModal */}
      {isSalesReportModalOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <SalesReportModal
            isOpen
            inlineMode={isMobile}
            onClose={() => setIsSalesReportModalOpen(false)}
          />
        </PortalOrNormal>
      )}

      {/* (4) CloseCashRegisterModal */}
      {isCashRegisterModalOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <CloseCashRegisterModal
            isOpen
            inlineMode={isMobile}
            onClose={() => setIsCashRegisterModalOpen(false)}
          />
        </PortalOrNormal>
      )}
    </>
  );
};

export default NavbarCard;
