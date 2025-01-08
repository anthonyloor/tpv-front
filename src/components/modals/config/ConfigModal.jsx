// src/components/modals/ConfigModal.jsx
import React, { useState, useContext } from 'react';
import Modal from '../Modal'; 
import { ConfigContext } from '../../../contexts/ConfigContext';

function ConfigModal({ isOpen, onClose, errorMessage }) {
  // Obtenemos el contexto para actualizar la config global
  const { configData, setConfigData } = useContext(ConfigContext);
  // Estados locales para cada campo (puedes inicializar con lo que haya en configData)
  const [idCustomerDefault, setIdCustomerDefault] = useState(
    configData?.id_customer_default || ''
  );
  const [idAddressDeliveryDefault, setIdAddressDeliveryDefault] = useState(
    configData?.id_address_delivery_default || ''
  );
  const [allowOutOfStockSales, setAllowOutOfStockSales] = useState(
    configData?.allow_out_of_stock_sales || false
  );
  const [ticketTextHeader1, setTicketTextHeader1] = useState(
    configData?.ticket_text_header_1 || ''
  );
  const [ticketTextHeader2, setTicketTextHeader2] = useState(
    configData?.ticket_text_header_2 || ''
  );
  const [ticketTextFooter1, setTicketTextFooter1] = useState(
    configData?.ticket_text_footer_1 || ''
  );
  const [ticketTextFooter2, setTicketTextFooter2] = useState(
    configData?.ticket_text_footer_2 || ''
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validar campos obligatorios
    if (!idCustomerDefault || !idAddressDeliveryDefault) {
      alert('Por favor, completa los campos obligatorios.');
      return;
    }

    const newConfig = {
      id_customer_default: parseInt(idCustomerDefault, 10),
      id_address_delivery_default: parseInt(idAddressDeliveryDefault, 10),
      allow_out_of_stock_sales: allowOutOfStockSales,
      ticket_text_header_1: ticketTextHeader1 || null,
      ticket_text_header_2: ticketTextHeader2 || null,
      ticket_text_footer_1: ticketTextFooter1 || null,
      ticket_text_footer_2: ticketTextFooter2 || null,
    };

    // Guardamos en el contexto
    setConfigData(newConfig);
  };

  return (
    <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
      <div>
        <h2 className="text-xl font-semibold mb-4">Configurar TPV</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">
              ID Cliente por defecto <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={idCustomerDefault}
              onChange={(e) => setIdCustomerDefault(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              ID Dirección de entrega por defecto <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={idAddressDeliveryDefault}
              onChange={(e) => setIdAddressDeliveryDefault(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={allowOutOfStockSales}
              onChange={(e) => setAllowOutOfStockSales(e.target.checked)}
              className="mr-2"
            />
            <label className="font-medium">Permitir ventas sin stock</label>
          </div>

          {/* Campos opcionales para ticket */}
          <div>
            <label className="block font-medium mb-1">Texto de encabezado del ticket 1</label>
            <input
              type="text"
              value={ticketTextHeader1}
              onChange={(e) => setTicketTextHeader1(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Texto de encabezado del ticket 2</label>
            <input
              type="text"
              value={ticketTextHeader2}
              onChange={(e) => setTicketTextHeader2(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Texto de pie de ticket 1</label>
            <input
              type="text"
              value={ticketTextFooter1}
              onChange={(e) => setTicketTextFooter1(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Texto de pie de ticket 2</label>
            <input
              type="text"
              value={ticketTextFooter2}
              onChange={(e) => setTicketTextFooter2(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>

          {errorMessage && (
            <div className="text-red-500 text-center">{errorMessage}</div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default ConfigModal;