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
        maxWidth: "50vw",
        maxHeight: "60vh",
        width: "45vw",
        height: "55vh",
      }}
    >
      <CloseCashRegisterForm onClose={onClose} />
    </Dialog>
  );
};

export default CloseCashRegisterModal;
