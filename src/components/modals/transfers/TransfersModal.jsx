// src/components/modals/transfers/TransfersModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal'; // Tu componente Modal genérico
import TransferForm from './TransferForm'; // El mismo TransferForm que usabas antes

const TransfersModal = ({ isOpen, onClose, permisosUsuario, permisosGlobal, setPermisosGlobal }) => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'traspasos', 'entrada', 'salida'

  const goBack = () => {
    if (['traspasos', 'entrada', 'salida'].includes(currentView)) {
      setCurrentView('main');
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {currentView === 'main' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Gestión de Mercadería</h2>
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
        </div>
      )}

      {['traspasos', 'entrada', 'salida'].includes(currentView) && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={goBack}>
              Atrás
            </button>
            <div className="invisible">Placeholder</div>
          </div>
          <TransferForm
            type={currentView}
            onSave={() => onClose()}
            permisosUsuario={permisosUsuario}
            permisosGlobal={permisosGlobal}
          />
        </div>
      )}
    </Modal>
  );
};

export default TransfersModal;