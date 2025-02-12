// src/components/modals/customer/ClientInfoDialog.jsx

import React from "react";
import { Dialog } from "primereact/dialog";

export default function ClientInfoDialog({ isOpen, onClose, client }) {
  if (!client) {
    return null;
  }

  // Podrías cargar direcciones, últimos pedidos, etc. con un useEffect
  // si necesitas más info. Aquí es un placeholder.
  const fullName = `${client.firstname} ${client.lastname}`;

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header="Información del Cliente"
      style={{ width: "50vw" }}
      modal
    >
      <div className="p-3">
        <h2 className="text-xl font-bold mb-4">{fullName}</h2>
        <p>ID Cliente: {client.id_customer}</p>
        {/* Muestra más campos que tengas guardados */}
        {/* en un futuro: direcciones, pedidos, etc. */}
      </div>
    </Dialog>
  );
}