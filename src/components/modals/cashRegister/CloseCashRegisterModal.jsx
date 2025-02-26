// src/components/modals/cashRegister/CloseCashRegisterModal.jsx

import React from "react";
import { Dialog } from "primereact/dialog";
import CloseCashRegisterForm from "./CloseCashRegisterForm";

const CloseCashRegisterModal = ({
  isOpen,
  onClose,
  inlineMode = false,
  widthPercent = "35%",
  heightPercent = "50%",
}) => {
  return (
    <Dialog
      header="Cierre de caja"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{
        width: widthPercent,
        height: heightPercent,
        minWidth: "700px",
        minHeight: "600px",
      }}
    >
      <CloseCashRegisterForm onClose={onClose} />
    </Dialog>
  );
};

export default CloseCashRegisterModal;
