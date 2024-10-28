// OpenPosModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal'; // Importamos el componente Modal existente

const OpenPosModal = ({ onSubmit, errorMessage }) => {
  const [initBalance, setInitBalance] = useState('');

  const handleOpenPos = () => {
    onSubmit(initBalance);
  };

  return (
    <Modal isOpen={true} onClose={() => {}}>
      <div>
        <h2 className="text-xl font-semibold mb-4">Abrir Caja</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Efectivo Inicial
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={initBalance}
            onChange={(e) => setInitBalance(e.target.value)}
            className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {errorMessage && (
          <div className="mb-4 text-red-500 text-center">{errorMessage}</div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleOpenPos}
            disabled={!initBalance}
            className={`py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
              !initBalance
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Abrir
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OpenPosModal;
