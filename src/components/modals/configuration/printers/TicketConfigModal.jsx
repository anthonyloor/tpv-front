// Ruta: src/components/modals/configuration/printers/TicketConfigModal.jsx

import React, { useState, useEffect } from 'react';
import ticketConfigData from '../../../../data/ticket.json'; // Importamos la configuración del ticket

const TicketConfigModal = ({ onClose, goBack }) => {
  const [ticketConfig, setTicketConfig] = useState({
    logo: '',
    headerText1: '',
    headerText2: '',
    footerText1: '',
    footerText2: '',
  });

  useEffect(() => {
    // Cargamos la configuración del ticket desde ticket.json
    setTicketConfig(ticketConfigData);
  }, []);

  return (
    <div className="transition-opacity duration-300 ease-in-out">
      <div className="flex justify-between items-center mb-4">
        <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={goBack}>
          Atrás
        </button>
        <h2 className="text-xl font-bold">Configuración de Tickets</h2>
        <div className="invisible">Placeholder</div>
      </div>
      <div className="space-y-4">
        {/* Mostrar la imagen del logo si existe */}
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
            disabled // Deshabilitado por ahora
          />
          <p className="text-sm text-gray-500">*Esta funcionalidad estará disponible próximamente.</p>
        </div>
        <div>
          <label className="font-bold">Texto Cabecera 1:</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={ticketConfig.headerText1}
            disabled // Deshabilitado por ahora
          />
        </div>
        <div>
          <label className="font-bold">Texto Cabecera 2:</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={ticketConfig.headerText2}
            disabled // Deshabilitado por ahora
          />
        </div>
        <div>
          <label className="font-bold">Texto Final 1:</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={ticketConfig.footerText1}
            disabled // Deshabilitado por ahora
          />
        </div>
        <div>
          <label className="font-bold">Texto Final 2:</label>
          <input
            type="text"
            className="border rounded p-2 w-full"
            value={ticketConfig.footerText2}
            disabled // Deshabilitado por ahora
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded" disabled>
          Guardar Cambios
        </button>
        <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default TicketConfigModal;
