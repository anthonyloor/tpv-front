// src/components/modals/transfers/TransfersModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal'; 
import TransferForm from './TransferForm';

const TransfersModal = ({ isOpen, onClose }) => {
  const [currentView, setCurrentView] = useState('main'); 

  const goBack = () => {
    if (['traspasos', 'entrada', 'salida'].includes(currentView)) {
      setCurrentView('main');
    } else {
      onClose();
    }
  };

  let title = 'Gestión de Mercadería';
  let showBackButton = false;

  if (['traspasos', 'entrada', 'salida'].includes(currentView)) {
    showBackButton = true;
    if (currentView === 'traspasos') title = 'Traspasos entre Tiendas';
    if (currentView === 'entrada') title = 'Entrada de Mercadería';
    if (currentView === 'salida') title = 'Salida de Mercadería';
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showBackButton={showBackButton}
      onBack={goBack}
      title={title}
      size="md"
      height="md"
    >
      {currentView === 'main' && (
        <div className="space-y-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded w-full" onClick={() => setCurrentView('traspasos')}>
            Traspasos entre Tiendas
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded w-full" onClick={() => setCurrentView('entrada')}>
            Entrada de Mercadería
          </button>
          <button className="bg-red-500 text-white px-4 py-2 rounded w-full" onClick={() => setCurrentView('salida')}>
            Salida de Mercadería
          </button>
        </div>
      )}

      {['traspasos', 'entrada', 'salida'].includes(currentView) && (
        <TransferForm
          type={currentView}
          onSave={() => onClose()}
        />
      )}
    </Modal>
  );
};

export default TransfersModal;