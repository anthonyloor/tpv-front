// src/components/modals/cashRegister/CloseCashRegisterModal.jsx

import React from "react";
import { Dialog } from "primereact/dialog";
import CloseCashRegisterForm from "./CloseCashRegisterForm";

const CloseCashRegisterModal = ({ isOpen, onClose, inlineMode = false }) => {
  return (
    <Dialog
      header="Cierre de caja"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{
        maxWidth: "800px",
        maxHeight: "550px",
        minWidth: "750px",
        minHeight: "500px",
        width: "50vw",
        height: "60vh",
      }}
    >
      <CloseCashRegisterForm onClose={onClose} />
    </Dialog>
  );
};

export default CloseCashRegisterModal;
