import React, { useState, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { AuthContext } from "../../../contexts/AuthContext";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";

const PinValidationModal = ({ isOpen, onClose, onSuccess }) => {
  const { employeeId } = useContext(AuthContext);
  const apiFetch = useApiFetch();
  const [enteredPin, setEnteredPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerifyPin = async () => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await apiFetch(`${API_BASE_URL}/check_pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: enteredPin,
          id_employee_used: employeeId,
          reason: "descuento",
        }),
      });
      if (response && response.usable) {
        setErrorMessage("");
        setEnteredPin("");
        onSuccess();
        onClose();
      }
    } catch (error) {
      setErrorMessage("PIN incorrecto.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleVerifyPin();
  };

  const handleClose = () => {
    setEnteredPin("");
    setErrorMessage("");
    onClose();
  };

  return (
    <Dialog
      visible={isOpen}
      onHide={handleClose}
      header="PIN de autorización"
      modal
      draggable={false}
      resizable={false}
      style={{
        width: "20vw",
        height: "25vh",
        minWidth: "200px",
        minHeight: "200px",
      }}
    >
      <div>
        <div className="mb-4">
          <label className="block font-medium mb-3">
            Solicita e ingresa el PIN de autorización:
          </label>
          <InputText
            type="password"
            value={enteredPin}
            onChange={(e) => setEnteredPin(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="4 dígitos"
            maxLength={4}
            className="w-full py-3 px-3 border rounded-md"
          />
        </div>
        {errorMessage && (
          <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
        )}
        <div className="flex justify-end">
          <Button
            label="Verificar"
            className="p-button-success"
            onClick={handleVerifyPin}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default PinValidationModal;
