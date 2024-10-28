// ConfigModal.jsx
import React, { useState } from 'react';
import Modal from '../Modal'; // Asegúrate de que la ruta es correcta

function ConfigModal({ onSubmit, errorMessage }) {
  const [idCustomerDefault, setIdCustomerDefault] = useState('');
  const [idAddressDeliveryDefault, setIdAddressDeliveryDefault] = useState('');
  const [allowOutOfStockSales, setAllowOutOfStockSales] = useState(false);
  const [ticketTextHeader1, setTicketTextHeader1] = useState('');
  const [ticketTextHeader2, setTicketTextHeader2] = useState('');
  const [ticketTextFooter1, setTicketTextFooter1] = useState('');
  const [ticketTextFooter2, setTicketTextFooter2] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validar campos obligatorios
    if (!idCustomerDefault || !idAddressDeliveryDefault) {
      alert('Por favor, completa los campos obligatorios.');
      return;
    }

    const config = {
      id_customer_default: parseInt(idCustomerDefault, 10),
      id_address_delivery_default: parseInt(idAddressDeliveryDefault, 10),
      allow_out_of_stock_sales: allowOutOfStockSales,
      ticket_text_header_1: ticketTextHeader1 || null,
      ticket_text_header_2: ticketTextHeader2 || null,
      ticket_text_footer_1: ticketTextFooter1 || null,
      ticket_text_footer_2: ticketTextFooter2 || null,
    };

    onSubmit(config);
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

          {/* Campos opcionales */}
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
