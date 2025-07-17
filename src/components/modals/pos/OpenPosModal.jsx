// src/components/modals/pos/OpenPosModal.jsx

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

const OpenPosModal = ({ tokenParam, onSubmit, errorMessage }) => {
  const [initCash, setInitCash] = useState(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && initCash !== null) {
      onSubmit(initCash, tokenParam);
    }
  };

  const footer = (
    <div className="flex justify-end">
      <Button
        onClick={() => onSubmit(initCash, tokenParam)}
        disabled={initCash === null || initCash === 0}
        label="Aceptar"
        className={`py-2 px-4 rounded-md font-semibold transition-colors duration-200 ${
          initCash === null || initCash === 0
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
      style={{ width: "25rem" }}
      footer={footer}
    >
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Introduce el efectivo de la caja:
          </label>
          <InputNumber
            value={initCash}
            onValueChange={(e) => setInitCash(e.value)}
            onKeyDown={handleKeyDown}
            mode="currency"
            currency="EUR"
            locale="es-ES"
            min={0}
            className="w-full"
            inputClassName="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
