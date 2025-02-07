// src/components/modals/reports/SalesReportModal.jsx
import React from "react";
import Modal from "../modals/Modal";
import SalesReportSearch from "./SalesReportSearch";

const SalesReportModal = ({ isOpen, onClose, inlineMode = false }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reporte de Ventas"
      size="6xl"
      height="default"
      inlineMode={inlineMode}
    >
      <SalesReportSearch />
    </Modal>
  );
};

export default SalesReportModal;
