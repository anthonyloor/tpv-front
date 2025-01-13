// src/components/modals/discount/DiscountModal.jsx

import React, { useState } from 'react';
import Modal from '../Modal';
import { useCartRuleCreator } from '../../../hooks/useCartRuleCreator';

const DiscountModal = ({ isOpen, onClose, onDiscountApplied }) => {
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { createCartRuleWithResponse } = useCartRuleCreator();

  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      setErrorMessage('Introduce un valor válido para el descuento.');
      return;
    }
    createCartRuleWithResponse(
      { discountType, value },
      onDiscountApplied,
      onClose,
      setDiscountValue,
      setErrorMessage
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" height="medium" title="Descuento">
      <div>
        <div className="mb-4">
          <label className="block font-medium mb-1">Tipo de Descuento:</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="percentage">Porcentaje (%)</option>
            <option value="amount">Importe (€)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">
            {discountType === 'percentage'
              ? 'Porcentaje de Descuento (%):'
              : 'Importe de Descuento (€):'}
          </label>
          <div className="flex items-center">
            <input
              type="number"
              min="0"
              max={discountType === 'percentage' ? '100' : undefined}
              step="1"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="flex-grow border rounded-md px-3 py-2"
            />
            <span className="ml-2">{discountType === 'percentage' ? '%' : '€'}</span>
          </div>
        </div>

        {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}

        <div className="flex justify-end space-x-2">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleApplyDiscount}
          >
            Aplicar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DiscountModal;