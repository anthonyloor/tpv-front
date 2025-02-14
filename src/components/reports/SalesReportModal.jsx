import React from "react";
import { Dialog } from "primereact/dialog";
import SalesReportSearch from "./SalesReportSearch";

const SalesReportModal = ({ isOpen, onClose, inlineMode = false }) => {
  const getAppendTarget = () => {
    if (inlineMode) {
      const target = document.getElementById("mobile-modals-container");
      return target ? target : document.body;
    }
    return document.body;
  };

  return (
    <Dialog
      header="Reporte de Ventas"
      visible={isOpen}
      onHide={onClose}
      modal
      appendTo={getAppendTarget()}
      style={{
        width: inlineMode ? "100vw" : "80vw",
        maxWidth: inlineMode ? "none" : "1200px",
      }}
      draggable={false}
      resizable={false}
    >
      <SalesReportSearch />
    </Dialog>
  );
};

export default SalesReportModal;
