// src/components/Navbar/NavbarCard.jsx

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { isMobile } from "react-device-detect";
import { createPortal } from "react-dom";

import { AuthContext } from "../../contexts/AuthContext";
import TransfersModal from "../modals/transfers/TransfersModal";
import ConfigurationModal from "../modals/configuration/ConfigurationModal";
import SalesReportModal from "../reports/SalesReportModal";
import CloseCashRegisterModal from "../modals/cashRegister/CloseCashRegisterModal";
import { Menubar } from "primereact/menubar";

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

  // Ejemplo con 4 booleans. Solo uno se abre a la vez => cierra el resto
  const [isTransfersModalOpen, setTransfersModalOpen] = useState(false);
  const [isConfigurationModalOpen, setConfigurationModalOpen] = useState(false);
  const [isSalesReportModalOpen, setSalesReportModalOpen] = useState(false);
  const [isCashRegisterModalOpen, setCashRegisterModalOpen] = useState(false);

  // Por si config tiene vistas
  const [configModalView, setConfigModalView] = useState("config");

  const closeAllModals = () => {
    setTransfersModalOpen(false);
    setConfigurationModalOpen(false);
    setSalesReportModalOpen(false);
    setCashRegisterModalOpen(false);
  };

  // Cada vez que abrimos uno => cerramos los demás
  const openTransfers = () => {
    closeAllModals();
    setTransfersModalOpen(true);
  };
  const openConfig = (view = "config") => {
    closeAllModals();
    setConfigModalView(view);
    setConfigurationModalOpen(true);
  };
  const openSalesReport = () => {
    closeAllModals();
    setSalesReportModalOpen(true);
  };
  const openCashRegister = () => {
    closeAllModals();
    setCashRegisterModalOpen(true);
  };

  // Si detectamos openCloseCashModal => abrimos Caja
  React.useEffect(() => {
    if (openCloseCashModal) {
      closeAllModals();
      setCashRegisterModalOpen(true);
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

  // Menubar
  const items = [
    {
      label: shopName ? shopName + " TPV" : "TPV",
      icon: "pi pi-home",
      command: () => {
        if (shop?.route) {
          navigate(`/${shop.route}/app`);
        }
      },
    },
    ...(idProfile === 1
      ? [
          {
            label: "Transferencias",
            icon: "pi pi-exchange",
            command: openTransfers,
          },
        ]
      : []),
    {
      label: "Labels",
      icon: "pi pi-tags",
      command: () => console.log("Clicked Labels"),
    },
    {
      label: "Caja",
      icon: "pi pi-wallet",
      command: openCashRegister,
    },
    {
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
  ];

  const end = (
    <div className="flex items-center space-x-3 mr-4">
      <div className="flex items-center space-x-1">
        <i className="pi pi-user" />
        <span className="font-semibold text-gray-700">{employeeName}</span>
      </div>
      <button
        onClick={handleLogoutClick}
        className="inline-flex items-center text-black hover:text-gray-600"
      >
        <i className="pi pi-sign-out" style={{ fontSize: "1.2rem" }}></i>
      </button>
    </div>
  );

  // -- RENDER --
  return (
    <>
      {/* Menú principal */}
      <Menubar model={items} end={end} />

      {/* 
        AHORA => Para cada modal => 
        si isMobile => lo inyectamos en #mobile-modals-container con createPortal
        si no => lo renderizamos normal (overlay)
      */}

      {/* TransfersModal */}
      {isTransfersModalOpen &&
        (isMobile ? (
          createPortal(
            <TransfersModal
              isOpen={true}
              onClose={() => setTransfersModalOpen(false)}
              inlineMode={true}
            />,
            document.getElementById("mobile-modals-container")
          )
        ) : (
          <TransfersModal
            isOpen={true}
            onClose={() => setTransfersModalOpen(false)}
            inlineMode={false}
          />
        ))}

      {/* Config */}
      {isConfigurationModalOpen &&
        (isMobile ? (
          createPortal(
            <ConfigurationModal
              isOpen={true}
              onClose={() => setConfigurationModalOpen(false)}
              initialView={configModalView}
              inlineMode={true}
            />,
            document.getElementById("mobile-modals-container")
          )
        ) : (
          <ConfigurationModal
            isOpen={true}
            onClose={() => setConfigurationModalOpen(false)}
            initialView={configModalView}
            inlineMode={false}
          />
        ))}

      {/* SalesReport */}
      {isSalesReportModalOpen &&
        (isMobile ? (
          createPortal(
            <SalesReportModal
              isOpen={true}
              onClose={() => setSalesReportModalOpen(false)}
              inlineMode={true}
            />,
            document.getElementById("mobile-modals-container")
          )
        ) : (
          <SalesReportModal
            isOpen={true}
            onClose={() => setSalesReportModalOpen(false)}
            inlineMode={false}
          />
        ))}

      {/* CashRegister */}
      {isCashRegisterModalOpen &&
        (isMobile ? (
          createPortal(
            <CloseCashRegisterModal
              isOpen={true}
              onClose={() => setCashRegisterModalOpen(false)}
              inlineMode={true}
            />,
            document.getElementById("mobile-modals-container")
          )
        ) : (
          <CloseCashRegisterModal
            isOpen={true}
            onClose={() => setCashRegisterModalOpen(false)}
            inlineMode={false}
          />
        ))}
    </>
  );
};

export default NavbarCard;