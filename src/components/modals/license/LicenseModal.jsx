// src/components/modals/license/LicenseModal.jsx

import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

function LicenseModal({ onSubmit, errorMessage }) {
  const [licenseKey, setLicenseKey] = useState("");

  const handleLicenseSubmit = () => {
    onSubmit(licenseKey);
  };

  return (
    <Dialog
      header="Ingrese su Licencia"
      visible={true}
      modal
      closable={false}
      style={{ width: "30vw" }}
    >
      {errorMessage && (
        <div className="mb-4 text-red-500 text-center">{errorMessage}</div>
      )}
      <InputText
        placeholder="Licencia"
        value={licenseKey}
        onChange={(e) => setLicenseKey(e.target.value)}
        className="w-full mb-4"
      />
      <div className="flex justify-end">
        <Button
          label="Verificar Licencia"
          onClick={handleLicenseSubmit}
          disabled={!licenseKey}
          className={`py-2 px-4 ${
            !licenseKey ? "p-button-secondary" : "p-button-success"
          }`}
        />
      </div>
    </Dialog>
  );
}

export default LicenseModal;
