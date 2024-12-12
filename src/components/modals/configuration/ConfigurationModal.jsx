// src/components/modals/configuration/ConfigurationModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal';
import PermisosModal from './permissions/PermissionsModal';
import TicketConfigModal from './printers/TicketConfigModal';

const ConfigurationModal = ({ isOpen, onClose, empleadoActual, permisosGlobal, setPermisosGlobal }) => {
  const [currentView, setCurrentView] = useState('config'); 

  const goBack = () => {
    if (currentView === 'permisos' || currentView === 'impresoras') {
      setCurrentView('config');
    } else if (currentView === 'ticketConfig' || currentView === 'etiquetaPrecios') {
      setCurrentView('impresoras');
    } else {
      onClose();
    }
  };

  let title = 'Configuración';
  let showBackButton = false;

  if (currentView === 'permisos') {
    title = 'Permisos';
    showBackButton = true;
  } else if (currentView === 'impresoras') {
    title = 'Impresoras';
    showBackButton = true;
  } else if (currentView === 'ticketConfig') {
    title = 'Configuración de Tickets';
    showBackButton = true;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showBackButton={showBackButton}
      onBack={goBack}
      title={title}
    >
      {currentView === 'config' && (
        <div>
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
          {/* Ya no tenemos la barra interna, solo el contenido de PermisosModal */}
          <PermisosModal
            onClose={onClose}
            empleadoActual={empleadoActual}
            setPermisosGlobal={setPermisosGlobal}
          />
        </div>
      )}

      {currentView === 'impresoras' && (
        <div>
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
          {/* Solo el contenido de TicketConfigModal */}
          <TicketConfigModal onClose={onClose} goBack={goBack} />
        </div>
      )}
    </Modal>
  );
};

export default ConfigurationModal;