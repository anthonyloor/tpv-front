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
      style={{ width: "50vw" }}
      draggable={false}
      resizable={false}
    >
      <CloseCashRegisterForm onClose={onClose} />
    </Dialog>
  );
};

export default CloseCashRegisterModal;
