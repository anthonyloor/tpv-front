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
import NewSalesReportModal from "../reports/NewSalesReportModal";
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
import ListCashRegisterModal from "../modals/cashRegister/ListCashRegisterModal";
import ControlStockModal from "../modals/controlStock/ControlStockModal";
import DiscountsListModal from "../modals/discount/DiscountsListModal";
import useToggle from "../../hooks/useToggle";

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

  const transfersModal = useToggle();
  const configurationModal = useToggle();
  const salesReportModal = useToggle();
  const newSalesReportModal = useToggle();
  const cashRegisterModal = useToggle();
  const listCashRegisterModal = useToggle();

  const [showPricesTags, setShowPricesTags] = useState(false);
  const pinDialog = useToggle();
  const [configModalView] = useState("config");
  const [version, setVersion] = useState("");
  const versionModal = useToggle();
  const onlineOrdersModal = useToggle();
  const inventoryModal = useToggle();
  const controlStockModal = useToggle();
  const discountsListModal = useToggle();

  const closeAllModals = () => {
    transfersModal.close();
    configurationModal.close();
    salesReportModal.close();
    newSalesReportModal.close();
    cashRegisterModal.close();
    pinDialog.close();
    listCashRegisterModal.close();
    controlStockModal.close();
    inventoryModal.close();
    discountsListModal.close();
    onlineOrdersModal.close();
    versionModal.close();
  };

  const openTransfers = () => {
    closeAllModals();
    transfersModal.open();
  };
  /*
  const openConfig = (view = "config") => {
    closeAllModals();
    setConfigModalView(view);
    setConfigurationModalOpen(true);
  };
  */

  const openCashRegister = () => {
    closeAllModals();
    cashRegisterModal.open();
  };

  const openListCashRegisterModal = () => {
    closeAllModals();
    listCashRegisterModal.open();
  };

  const openSalesReport = () => {
    closeAllModals();
    salesReportModal.open();
  };

  const openNewSalesReport = () => {
    closeAllModals();
    newSalesReportModal.open();
  };

  const openInventoryModal = () => {
    closeAllModals();
    inventoryModal.open();
  };

  const openDiscountsList = () => {
    closeAllModals();
    discountsListModal.open();
  };

  const openControlStock = () => {
    closeAllModals();
    controlStockModal.open();
  };

  useEffect(() => {
    if (openCloseCashModal) {
      closeAllModals();
      cashRegisterModal.open();
      setOpenCloseCashModal(false);
    }
  }, [openCloseCashModal, setOpenCloseCashModal, cashRegisterModal]);

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
    ...(idProfile === 1
      ? [
          {
            label: "Gestion stock",
            icon: "pi pi-warehouse",
            items: [
              {
                label: "Transferencias",
                icon: "pi pi-arrow-right-arrow-left",
                command: openTransfers,
              },
              {
                label: "Seguimiento",
                icon: "pi pi-link",
                command: openControlStock,
              },
            ],
          },
          {
            label: "Caja",
            icon: "pi pi-desktop",
            items: [
              {
                label: "Cierre de caja",
                icon: "pi pi-sign-in",
                command: openCashRegister,
              },
              {
                label: "Ver cajas",
                icon: "pi pi-list",
                command: openListCashRegisterModal,
              },
            ],
          },
          {
            label: "Etiquetas",
            icon: "pi pi-barcode",
            command: () => setShowPricesTags(true),
          },
          {
            label: "Pedidos Online",
            icon: "pi pi-shopping-cart",
            command: onlineOrdersModal.open,
          },
          {
            label: "Reportes",
            icon: "pi pi-chart-bar",
            items: [
              {
                label: "Reporte de ventas",
                icon: "pi pi-file",
                command: openSalesReport,
              },
              {
                label: "Reporte de ventas (Nuevo)",
                icon: "pi pi-file",
                command: openNewSalesReport,
              },
            ],
          },
          {
            label: "PIN",
            icon: "pi pi-key",
            command: pinDialog.open,
          },
          {
            label: "Inventario",
            icon: "pi pi-list",
            command: openInventoryModal,
          },
          {
            label: "Descuentos",
            icon: "pi pi-percentage",
            command: openDiscountsList,
          },
        ]
      : [
          {
            label: "Gestion stock",
            icon: "pi pi-warehouse",
            command: openTransfers,
          },
          {
            label: "Caja",
            icon: "pi pi-desktop",
            command: openCashRegister,
          },
          {
            label: "Descuentos",
            icon: "pi pi-percentage",
            command: openDiscountsList,
          },
        ]),
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

  // Cambio en el menú de opciones (SplitButton)
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
      command: () => versionModal.open(),
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
      {transfersModal.isOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <TransfersModal
            isOpen
            inlineMode={isMobile}
            onClose={transfersModal.close}
          />
        </PortalOrNormal>
      )}

      {/* (2) ConfigurationModal */}
      {configurationModal.isOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <ConfigurationModal
            isOpen
            inlineMode={isMobile}
            initialView={configModalView}
            onClose={configurationModal.close}
          />
        </PortalOrNormal>
      )}

      {/* (3) SalesReportModal */}
      {salesReportModal.isOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <SalesReportModal
            isOpen
            inlineMode={isMobile}
            onClose={salesReportModal.close}
          />
        </PortalOrNormal>
      )}

      {/* (3b) NewSalesReportModal */}
      {newSalesReportModal.isOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <NewSalesReportModal
            isOpen
            inlineMode={isMobile}
            onClose={newSalesReportModal.close}
          />
        </PortalOrNormal>
      )}

      {/* (4) CloseCashRegisterModal */}
      {cashRegisterModal.isOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <CloseCashRegisterModal
            isOpen
            inlineMode={isMobile}
            onClose={cashRegisterModal.close}
          />
        </PortalOrNormal>
      )}

      {/* Nuevo Modal para Lista de Cajas */}
      {listCashRegisterModal.isOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <ListCashRegisterModal isOpen onClose={listCashRegisterModal.close} />
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
        visible={pinDialog.isOpen}
        onHide={pinDialog.close}
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
      {versionModal.isOpen && (
        <VersionInfoModal
          isOpen={versionModal.isOpen}
          version={version}
          onClose={versionModal.close}
        />
      )}

      {/* Modal de Pedidos Online */}
      {onlineOrdersModal.isOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <OnlineOrdersModal isOpen onClose={onlineOrdersModal.close} />
        </PortalOrNormal>
      )}

      {/* Nuevo Dialog para Inventario */}
      {inventoryModal.isOpen && (
        <InventoryModal
          isOpen={inventoryModal.isOpen}
          onClose={inventoryModal.close}
          shop={shop}
        />
      )}

      {/* Nuevo modal de Control Stock */}
      {controlStockModal.isOpen && (
        <ControlStockModal
          isOpen={controlStockModal.isOpen}
          onClose={controlStockModal.close}
        />
      )}

      {discountsListModal.isOpen && (
        <PortalOrNormal isInlineMode={isMobile}>
          <DiscountsListModal isOpen onClose={discountsListModal.close} />
        </PortalOrNormal>
      )}
    </>
  );
};

export default NavbarCard;
