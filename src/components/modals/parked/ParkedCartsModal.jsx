// src/components/modals/parked/ParkedCartsModal.jsx

import React from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const ParkedCartsModal = ({
  isOpen,
  onClose,
  parkedCarts,
  onLoadCart,
  onDeleteCart,
}) => {
  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header="Tickets Aparcados"
      modal
      draggable={false}
      resizable={false}
      style={{ minWidth: "25%", minHeight: "20%" }}
    >
      <div className="p-4">
        {parkedCarts.length === 0 ? (
          <p>No hay tickets aparcados.</p>
        ) : (
          <ul>
            {parkedCarts.map((cart) => (
              <li key={cart.id} className="mb-4 border-b pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{cart.name}</h4>
                    <p className="text-sm text-gray-500">
                      Guardado el: {new Date(cart.savedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      label="Cargar Ticket"
                      icon="pi pi-check"
                      className="p-button-info"
                      onClick={() => onLoadCart(cart.id)}
                    />
                    <Button
                      label="Eliminar"
                      icon="pi pi-trash"
                      className="p-button-danger"
                      onClick={() => onDeleteCart(cart.id)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
};

export default ParkedCartsModal;
