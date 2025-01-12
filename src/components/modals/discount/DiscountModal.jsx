// src/components/modals/discount/DiscountModal.jsx

import React, { useState } from 'react';
import Modal from '../Modal';
import { useApiFetch } from '../../utils/useApiFetch';

const DiscountModal = ({ isOpen, onClose, onDiscountApplied }) => {
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' o 'amount'
  const [discountValue, setDiscountValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const apiFetch = useApiFetch();

  const handleApplyDiscount = async () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      setErrorMessage('Introduce un valor válido para el descuento.');
      return;
    }

    // Generar fechas (un año por defecto)
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const date_from = now.toISOString().split('T')[0] + ' 00:00:00';
    const date_to = oneYearLater.toISOString().split('T')[0] + ' 23:59:59';

    // Obtener info para descripción
    const employee = JSON.parse(localStorage.getItem('employee')) || {};
    const shop = JSON.parse(localStorage.getItem('shop')) || {};
    const client = JSON.parse(localStorage.getItem('selectedClient'));

    const employeeName = employee.employee_name || 'Empleado';
    const shopName = shop.name || 'Tienda';

    // Construir descripción y name
    const description = `Descuento generado por ${employeeName} en ${shopName}`;
    const name =
      discountType === 'percentage'
        ? `Descuento de ${value}%`
        : `Descuento de ${value}€`;

    // Determinar valores de reduction
    const reduction_percent = discountType === 'percentage' ? value : 0;
    const reduction_amount = discountType === 'amount' ? value : 0;

    // Construir el objeto para la API
    const discountData = {
      name,
      date_from,
      date_to,
      description,
      id_customer: client ? client.id_customer : null,
      reduction_percent,
      reduction_amount
    };

    try {
      const result = await apiFetch(
        'https://apitpv.anthonyloor.com/create_cart_rule',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discountData)
        }
      );

      if (result) {
        const finalName = name || '';
        const finalDescription = description || '';
        const finalCode = result.code || '';
        const finalReductionAmount = result.reduction_amount || 0;
        const finalReductionPercent = result.reduction_percent || 0;

        // Notificamos al padre la info exacta generada por la API
        const discObj = {
          name: finalName,
          description: finalDescription,
          code: finalCode,
          reduction_amount: finalReductionAmount,
          reduction_percent: finalReductionPercent
        };

        console.log('Descuento creado:', discObj);

        if (onDiscountApplied) {
          onDiscountApplied(discObj);
        }

        setDiscountValue('');
        setErrorMessage('');
        onClose();
      } else {
        setErrorMessage(result.message || 'Error al crear el descuento.');
      }
    } catch (error) {
      console.error('Error al enviar descuento:', error);
      setErrorMessage('Error al enviar el descuento.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      height="medium"
      title="Descuento"
    >
      <div>
        {/* Tipo de Descuento */}
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

        {/* Valor del Descuento */}
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
            <span className="ml-2">
              {discountType === 'percentage' ? '%' : '€'}
            </span>
          </div>
        </div>

        {errorMessage && (
          <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
        )}

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