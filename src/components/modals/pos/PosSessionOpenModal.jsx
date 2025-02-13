// src/components/modals/pos/PosSessionOpenModal.jsx

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const PosSessionOpenModal = ({ isOpen, onContinue, onCloseCash }) => {
  const footer = (
    <div className="flex justify-end space-x-4">
      <Button
        label="Continuar"
        className="p-button-secondary"
        onClick={onContinue}
      />
      <Button
        label="Cerrar Caja"
        className="p-button-danger"
        onClick={onCloseCash}
      />
    </div>
  );

  return (
    <Dialog
      header="Sesión caja abierta"
      visible={isOpen}
      onHide={() => {}}
      modal
      closable={false}
      draggable={false}
      resizable={false}
      style={{ width: "25rem", backgroundColor: "var(--surface-0)" }}
      footer={footer}
    >
      <div className="p-4">
        <p className="mb-4">
          Ya hay una sesión de caja abierta. ¿Qué deseas hacer?
        </p>
      </div>
    </Dialog>
  );
};

export default PosSessionOpenModal;
