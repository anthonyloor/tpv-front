// src/components/modals/discount/DiscountModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal';

const DiscountModal = ({ isOpen, onClose }) => {
  const [discount, setDiscount] = useState(''); // Estado para el descuento
  const [errorMessage, setErrorMessage] = useState('');

  const handleApplyDiscount = () => {
    if (discount >= 0 && discount <= 100) {
      alert(`Descuento aplicado: ${discount}%`);
      // Aquí puedes manejar la lógica para aplicar el descuento, como actualizar el estado del carrito o enviar una petición al backend
      setDiscount(''); // Limpiar el campo de descuento después de aplicarlo
      onClose(); // Cerrar el modal de descuentos
    } else {
      setErrorMessage('Por favor, introduce un porcentaje válido entre 0 y 100.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xs" height="medium" title="Descuento">
      <div>
        <h3 className="text-lg font-bold mb-4">Descuento</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Porcentaje de Descuento:</label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="Ejemplo: 10 para 10%"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-full py-2 px-3 border rounded-md"
          />
        </div>
        {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
        <div className="flex justify-end space-x-2">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleApplyDiscount}
          >
            Aplicar
          </button>
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscountModal;