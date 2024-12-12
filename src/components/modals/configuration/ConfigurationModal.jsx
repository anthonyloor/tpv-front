// src/components/modals/configuration/ConfigurationModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal';
import PermisosModal from './permissions/PermissionsModal';
import TicketConfigModal from './printers/TicketConfigModal';

const ConfigurationModal = ({ isOpen, onClose, empleadoActual, permisosGlobal, setPermisosGlobal }) => {
  const [currentView, setCurrentView] = useState('config'); 
  // 'config', 'permisos', 'impresoras', 'ticketConfig', 'etiquetaPrecios', etc.

  const goBack = () => {
    if (currentView === 'permisos' || currentView === 'impresoras') {
      setCurrentView('config');
    } else if (currentView === 'ticketConfig' || currentView === 'etiquetaPrecios') {
      setCurrentView('impresoras');
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {currentView === 'config' && (
        <div>
          <h2 className="text-xl font-bold mb-4">Configuración</h2>
          <div className="space-y-4">
            <button className="bg-gray-300 text-black px-4 py-2 rounded w-full" onClick={() => setCurrentView('permisos')}>
              Permisos
            </button>
            <button className="bg-gray-300 text-black px-4 py-2 rounded w-full" onClick={() => setCurrentView('impresoras')}>
              Impresoras
            </button>
            <button className="bg-gray-300 text-black px-4 py-2 rounded w-full">Inventario</button>
          </div>
        </div>
      )}

      {currentView === 'permisos' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={goBack}>
              Atrás
            </button>
            <h2 className="text-xl font-bold">Permisos</h2>
            <div className="invisible">Placeholder</div>
          </div>
          <PermisosModal
            onClose={onClose}
            empleadoActual={empleadoActual}
            setPermisosGlobal={setPermisosGlobal}
          />
        </div>
      )}

      {currentView === 'impresoras' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={goBack}>
              Atrás
            </button>
            <h2 className="text-xl font-bold">Impresoras</h2>
            <div className="invisible">Placeholder</div>
          </div>
          <div className="space-y-4">
            <button className="bg-gray-300 text-black px-4 py-2 rounded w-full" onClick={() => setCurrentView('ticketConfig')}>
              Tickets al Cliente
            </button>
            <button className="bg-gray-300 text-black px-4 py-2 rounded w-full">
              Etiqueta Precios
            </button>
          </div>
        </div>
      )}

      {currentView === 'ticketConfig' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={goBack}>
              Atrás
            </button>
            <h2 className="text-xl font-bold">Configuración de Tickets</h2>
            <div className="invisible">Placeholder</div>
          </div>
          <TicketConfigModal onClose={onClose} goBack={goBack} />
        </div>
      )}
    </Modal>
  );
};

export default ConfigurationModal;