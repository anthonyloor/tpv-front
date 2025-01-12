// src/components/modals/pos/PosSessionOpenModal.jsx

import React from 'react';
import Modal from '../../modals/Modal';

const PosSessionOpenModal = ({ isOpen, onClose, onContinue, onCloseCash }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sesión de Caja Abierta"
      size="sm"
      height="auto"
    >
      <div className="p-4">
        <p className="mb-4">
          Ya tienes una sesión de caja abierta. ¿Qué deseas hacer?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={onContinue}
          >
            Continuar
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={onCloseCash}
          >
            Cerrar Caja
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PosSessionOpenModal;