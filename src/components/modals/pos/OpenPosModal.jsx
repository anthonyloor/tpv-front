// src/components/modals/pos/OpenPosModal.jsx

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const OpenPosModal = ({ tokenParam, onSubmit, errorMessage }) => {
  const [initCash, setInitCash] = useState("");

  const footer = (
    <div className="flex justify-end">
      <Button
        onClick={() => onSubmit(initCash, tokenParam)}
        disabled={!initCash}
        label="Aceptar"
        className={`py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
          !initCash
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      />
    </div>
  );

  return (
    <Dialog
      header="Abrir Caja"
      visible={true}
      modal
      closable={false}
      draggable={false}
      resizable={false}
      style={{ width: "25rem", backgroundColor: "var(--surface-0)" }}
      footer={footer}
    >
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Introduce el efectivo de la caja:
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={initCash}
            onChange={(e) => setInitCash(e.target.value)}
            className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {errorMessage && (
          <div className="mb-4 text-red-500 text-center">{errorMessage}</div>
        )}
      </div>
    </Dialog>
  );
};

export default OpenPosModal;
