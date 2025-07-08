import React from "react";
import { Dialog } from "primereact/dialog";
import TransferForm from "./TransferForm";

const MovementDetailModal = ({ isOpen, onClose, movementData }) => {
  if (!movementData) return null;
  const type = movementData.type ? movementData.type.toLowerCase() : "";
  const title =
    type === "traspaso"
      ? "Traspaso entre tiendas"
      : type === "entrada"
      ? "Entrada de mercadería"
      : type === "salida"
      ? "Salida de mercadería"
      : "Movimiento";

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header={title}
      draggable={false}
      resizable={false}
      modal
      style={{ maxWidth: "70vw", maxHeight: "85vh", width: "65vw", height: "80vh" }}
    >
      <TransferForm movementData={movementData} type={movementData.type} hideFooter={true} />
    </Dialog>
  );
};

export default MovementDetailModal;
