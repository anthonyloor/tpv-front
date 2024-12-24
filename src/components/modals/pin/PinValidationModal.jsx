// src/components/modals/pin/PinValidationModal.jsx
import React, { useState, useContext } from 'react';
import Modal from '../Modal';
import { PinContext } from '../../../contexts/PinContext';

const PinValidationModal = ({ isOpen, onClose, onSuccess }) => {
  const { dailyPin, regeneratePin } = useContext(PinContext);
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerifyPin = () => {
    console.log('PIN ingresado:', enteredPin);
    console.log('PIN diario:', dailyPin);
    if (enteredPin === dailyPin) {
      setErrorMessage('');
      regeneratePin(); // Regenerar el PIN después de verificarlo
      setEnteredPin(''); // Limpiar el campo de PIN
      onSuccess(); // Ejecutar la acción de éxito (abrir DiscountModal)
      onClose(); // Cerrar el modal de validación del PIN
      console.log('PIN verificado correctamente.');
    } else {
      setErrorMessage('PIN incorrecto. Intenta nuevamente.');
      console.log('PIN incorrecto.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleVerifyPin();
    }
  };

  const handleClose = () => {
    setEnteredPin('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xs" height="medium" title="Verificación de PIN">
      <div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Introduce el PIN:</label>
          <input
            type="password"
            value={enteredPin}
            onChange={(e) => setEnteredPin(e.target.value)}
            className="w-full py-2 px-3 border rounded-md"
            onKeyDown={handleKeyDown}
            placeholder="4 dígitos"
          />
        </div>
        {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
        <div className="flex justify-end">
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={handleVerifyPin}
          >
            Verificar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PinValidationModal;