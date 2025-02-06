// src/components/Navbar/NavbarCard.jsx

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import TransfersModal from "../modals/transfers/TransfersModal";
import ConfigurationModal from "../modals/configuration/ConfigurationModal";
import SalesReportModal from "../reports/SalesReportModal";
import CloseCashRegisterModal from "../modals/cashRegister/CloseCashRegisterModal";

// Importamos Menubar de PrimeReact
import { Menubar } from 'primereact/menubar';

const NavbarCard = () => {
  // Estados y contexto
  const [isTransfersModalOpen, setTransfersModalOpen] = useState(false);
  const [isConfigurationModalOpen, setConfigurationModalOpen] = useState(false);
  const [isSalesReportModalOpen, setIsSalesReportModalOpen] = useState(false);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);

  const [configModalView, setConfigModalView] = useState("config"); 
  // Para abrir config directamente en “permisos”, “impresoras”, etc.

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

  useEffect(() => {
    if (openCloseCashModal) {
      setIsCashRegisterModalOpen(true);
      setOpenCloseCashModal(false);
    }
  }, [openCloseCashModal, setOpenCloseCashModal]);

  const handleLogoutClick = () => {
    handleLogout();
    navigate(`/${shop.route}`);
  };

  // Para abrir Configuración en una vista específica
  const openConfigView = (viewName) => {
    setConfigModalView(viewName);
    setConfigurationModalOpen(true);
  };

  // Construimos el modelo para Menubar (items principales)
  const items = [
    {
      label: shopName ? shopName + " TPV" : "TPV",
      icon: "pi pi-home",
      command: () => {
        // Podríamos navegar a la home de la tienda si quisieras
        navigate(`/${shop.route}/app`);
      },
    },
    // Transferencias solo si es Admin
    ...(idProfile === 1
      ? [
          {
            label: "Transferencias",
            icon: "pi pi-exchange",
            command: () => setTransfersModalOpen(true),
          },
        ]
      : []),
    {
      label: "Labels",
      icon: "pi pi-tags",
      command: () => {
        // Lógica para “Labels” (si existe o en construcción)
        console.log("Clicked on Labels");
      },
    },
    {
      label: "Caja",
      icon: "pi pi-wallet",
      command: () => setIsCashRegisterModalOpen(true),
    },
    {
      label: "Configuración",
      icon: "pi pi-cog",
      items: [
        // Submenú para la configuración
        {
          label: "Permisos",
          icon: "pi pi-lock",
          command: () => openConfigView("permisos"),
        },
        {
          label: "Impresoras",
          icon: "pi pi-print",
          command: () => openConfigView("impresoras"),
        },
        {
          label: "Inventario",
          icon: "pi pi-folder-open",
          command: () => openConfigView("inventory"),
        },
      ],
    },
    // Reportes solo si es Admin
    ...(idProfile === 1
      ? [
          {
            label: "Reportes",
            icon: "pi pi-chart-bar",
            command: () => setIsSalesReportModalOpen(true),
          },
        ]
      : []),
  ];

  // Bloque “usuario actual + logout” lo podemos poner a la derecha (end)
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

  return (
    <div className="w-full">
      {/* Menubar principal */}
      <Menubar model={items} end={end} />

      {/* Modales (idénticos, solo que ahora se abren al pulsar items del menú) */}
      <TransfersModal
        isOpen={isTransfersModalOpen}
        onClose={() => setTransfersModalOpen(false)}
      />

      <ConfigurationModal
        isOpen={isConfigurationModalOpen}
        onClose={() => setConfigurationModalOpen(false)}
        initialView={configModalView}
      />

      <SalesReportModal
        isOpen={isSalesReportModalOpen}
        onClose={() => setIsSalesReportModalOpen(false)}
      />

      <CloseCashRegisterModal
        isOpen={isCashRegisterModalOpen}
        onClose={() => setIsCashRegisterModalOpen(false)}
      />
    </div>
  );
};

export default NavbarCard;