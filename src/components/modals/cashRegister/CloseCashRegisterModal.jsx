// src/components/modals/cashRegister/CloseCashRegisterModal.jsx

import React from "react";
import { Dialog } from "primereact/dialog";
import CloseCashRegisterForm from "./CloseCashRegisterForm";

const CloseCashRegisterModal = ({
  isOpen,
  onClose,
  inlineMode = false,
  widthPercent = "40%",
  heightPercent = "40%",
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
        minWidth: "800px",
        minHeight: "500px",
      }}
    >
      <CloseCashRegisterForm onClose={onClose} />
    </Dialog>
  );
};

export default CloseCashRegisterModal;
