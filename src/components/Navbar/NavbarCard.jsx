// src/components/Navbar/NavbarCard.jsx

import React, { useState, useContext, useEffect, useCallback } from "react";
import { isMobile } from "react-device-detect";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { Menubar } from "primereact/menubar";
import PortalOrNormal from "../../components/PortalOrNormal";
import TransfersModal from "../modals/transfers/TransfersModal";
import ConfigurationModal from "../modals/configuration/ConfigurationModal";
import SalesReportModal from "../reports/SalesReportModal";
import CloseCashRegisterModal from "../modals/cashRegister/CloseCashRegisterModal";
import { useTheme } from "../ThemeSwitcher";
import { SplitButton } from "primereact/splitbutton";
import { InputSwitch } from "primereact/inputswitch";
import PriceTags from "../modals/tags/PricesTags";
import PinPage from "../pages/PinPage";
import { Dialog } from "primereact/dialog";
import VersionInfoModal from "../modals/session/VersionInfoModal";
import OnlineOrdersModal from "../modals/online/OnlineOrdersModal";
import InventoryModal from "../modals/inventory/InventoryModal";

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

  const [showPricesTags, setShowPricesTags] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [configModalView] = useState("config");
  const [version, setVersion] = useState("");
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isOnlineOrdersModalOpen, setOnlineOrdersModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);

  const closeAllModals = () => {
    setTransfersModalOpen(false);
    setConfigurationModalOpen(false);
    setIsSalesReportModalOpen(false);
    setIsCashRegisterModalOpen(false);
    setIsPinDialogOpen(false);
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

  const openInventoryModal = () => {
    closeAllModals();
    setIsInventoryModalOpen(true);
  };

  useEffect(() => {
    if (openCloseCashModal) {
      closeAllModals();
      setIsCashRegisterModalOpen(true);
      setOpenCloseCashModal(false);
    }
  }, [openCloseCashModal, setOpenCloseCashModal]);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch("/version-lp.json", { cache: "no-store" });
        const data = await response.json();
        setVersion(data.version);
      } catch (err) {
        console.error("Error obteniendo versión:", err);
      }
    };
    fetchVersion();
  }, []);

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
    {
      label: "Gestion stock",
      icon: "pi pi-warehouse",
      command: openTransfers,
    },
    ...(idProfile === 1
      ? [
          {
            label: "Etiquetas",
            icon: "pi pi-barcode",
            command: () => setShowPricesTags(true),
          },
          {
            label: "Pedidos Online",
            icon: "pi pi-shopping-cart",
            command: () => setOnlineOrdersModalOpen(true),
          },
          {
            label: "Reportes",
            icon: "pi pi-chart-bar",
            command: openSalesReport,
          },
          {
            label: "PIN",
            icon: "pi pi-key",
            command: () => setIsPinDialogOpen(true),
          },
          {
            label: "Inventario",
            icon: "pi pi-list",
            command: openInventoryModal,
          },
        ]
      : []),
    {
      label: "Caja",
      icon: "pi pi-desktop",
      command: openCashRegister,
    },
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

  // Usar el hook para manejar el tema
  const { theme, setTheme } = useTheme();
  const isDarkTheme = theme === "lara-dark-indigo";

  const toggleTheme = useCallback(
    (e) => {
      setTheme(e.value ? "lara-dark-indigo" : "lara-light-indigo");
    },
    [setTheme]
  );

  // Opciones del SplitButton
  const menuItems = [
    {
      label: (
        <div className="flex items-center gap-2">
          <span>Tema Oscuro</span>
          <InputSwitch checked={isDarkTheme} onChange={toggleTheme} />
        </div>
      ),
    },
    {
      label: `Versión TPV: ${version || "N/A"}`,
      command: () => setIsVersionModalOpen(true),
    },
    {
      label: "Cerrar sesión",
      icon: "pi pi-sign-out",
      command: handleLogoutClick,
    },
  ];

  // Parte derecha del Menubar usando SplitButton
  const end = (
    <div className="flex items-center gap-4 mr-4">
      <SplitButton
        label={employeeName}
        icon="pi pi-user"
        dropdownIcon="pi pi-cog"
        model={menuItems}
        onClick={() => {}}
      />
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
        className="border rounded"
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

      {/* Modal de Etiquetas */}
      {showPricesTags && (
        <PriceTags
          isOpen={showPricesTags}
          onHide={() => setShowPricesTags(false)}
        />
      )}

      {/* Modal para PIN */}
      <Dialog
        visible={isPinDialogOpen}
        onHide={() => setIsPinDialogOpen(false)}
        modal
        draggable={false}
        resizable={false}
        style={{
          width: "25vw",
          height: "35vh",
          minWidth: "300px",
          minHeight: "300px",
        }}
      >
        <PinPage />
      </Dialog>

      {/* Modal de Versión y Resolución */}
      {isVersionModalOpen && (
        <VersionInfoModal
          isOpen={isVersionModalOpen}
          version={version}
          onClose={() => setIsVersionModalOpen(false)}
        />
      )}

      {/* Modal de Pedidos Online */}
      {isOnlineOrdersModalOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <OnlineOrdersModal
            isOpen
            onClose={() => setOnlineOrdersModalOpen(false)}
          />
        </PortalOrNormal>
      )}

      {/* Nuevo Dialog para Inventario */}
      {isInventoryModalOpen && (
        <InventoryModal
          isOpen={isInventoryModalOpen}
          onClose={() => setIsInventoryModalOpen(false)}
          shop={shop}
        />
      )}
    </>
  );
};

export default NavbarCard;
