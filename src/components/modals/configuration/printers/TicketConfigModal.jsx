// src/components/modals/configuration/printers/TicketConfigModal.jsx
import React, { useState, useEffect } from 'react';
import ticketConfigData from '../../../../data/ticket.json';

const TicketConfigModal = ({ onClose, goBack }) => {
  const [ticketConfig, setTicketConfig] = useState({
    logo: '',
    headerText1: '',
    headerText2: '',
    footerText1: '',
    footerText2: '',
  });

  useEffect(() => {
    setTicketConfig(ticketConfigData);
  }, []);

  return (
    <div className="transition-opacity duration-300 ease-in-out space-y-4">
      {/* Barra interna eliminada, ya no es necesaria */}

      {ticketConfig.logo && (
        <div>
          <p className="font-bold">Logo Actual:</p>
          <img src={ticketConfig.logo} alt="Logo del Ticket" className="w-32 h-auto" />
        </div>
      )}

      <div>
        <label className="font-bold">Logo de Cabecera:</label>
        <input
          type="file"
          accept="image/png, image/jpeg, image/svg+xml"
          className="border rounded p-2 w-full"
          disabled
        />
        <p className="text-sm text-gray-500">*Esta funcionalidad estará disponible próximamente.</p>
      </div>

      <div>
        <label className="font-bold">Texto Cabecera 1:</label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          value={ticketConfig.headerText1}
          disabled
        />
      </div>
      <div>
        <label className="font-bold">Texto Cabecera 2:</label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          value={ticketConfig.headerText2}
          disabled
        />
      </div>
      <div>
        <label className="font-bold">Texto Final 1:</label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          value={ticketConfig.footerText1}
          disabled
        />
      </div>
      <div>
        <label className="font-bold">Texto Final 2:</label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          value={ticketConfig.footerText2}
          disabled
        />
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded" disabled>
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default TicketConfigModal;