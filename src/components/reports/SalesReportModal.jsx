import React from "react";
import { Dialog } from "primereact/dialog";
import SalesReportSearch from "./SalesReportSearch";

const SalesReportModal = ({
  isOpen,
  onClose,
  inlineMode = false,
  initialDateFrom,
  initialDateTo,
  widthPercent = "50%",
  heightPercent = "70%",
}) => {
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
        width: widthPercent,
        height: heightPercent,
        minWidth: "700px",
        minHeight: "600px",
      }}
      draggable={false}
      resizable={false}
    >
      <SalesReportSearch
        initialDateFrom={initialDateFrom}
        initialDateTo={initialDateTo}
      />
    </Dialog>
  );
};

export default SalesReportModal;
