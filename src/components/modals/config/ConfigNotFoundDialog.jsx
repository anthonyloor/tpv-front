// src/components/modals/config/ConfigNotFoundDialog.jsx

import React, { useState } from "react";
import useToggle from "../../../hooks/useToggle";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import CustomerSearchDialog from "./CustomerSearchDialog"; // Importa el nuevo componente

const ConfigNotFoundDialog = ({
  isOpen,
  onClose,
  onConfigSubmit,
  errorMessage,
}) => {
  // Estados para los campos del formulario
  const [idCustomerDefault, setIdCustomerDefault] = useState("");
  const [idAddressDeliveryDefault, setIdAddressDeliveryDefault] = useState("");
  const [allowOutOfStockSales, setAllowOutOfStockSales] = useState(false);
  const [ticketTextHeader1, setTicketTextHeader1] = useState("");
  const [ticketTextHeader2, setTicketTextHeader2] = useState("");
  const [ticketTextFooter1, setTicketTextFooter1] = useState("");
  const [ticketTextFooter2, setTicketTextFooter2] = useState("");

  // Estado para controlar la visibilidad del diálogo de búsqueda
  const searchDialog = useToggle();

  // Handler para abrir el diálogo de búsqueda
  const handleOpenSearchDialog = () => {
    searchDialog.open();
  };

  // Handler para seleccionar un cliente y dirección desde el diálogo
  const handleSelectClientAndAddress = (client, address) => {
    setSelectedClient(client);
    setIdCustomerDefault(client.id_customer);
    setIdAddressDeliveryDefault(address.id_address);
    const fields = [
      address.address1,
      address.address2,
      address.postcode,
      address.city,
      address.phone,
      address.phone_mobile,
    ].filter(
      (field) => field !== null && field !== undefined && field.trim() !== ""
    );
    setTicketTextHeader1(fields.join(", "));
    setTicketTextFooter1(
      "Plazo de cambio máximo 15 días. Cambio por otro artículo o emisión de un vale."
    );
    setTicketTextFooter2("www.mayret.com");
    searchDialog.close();
  };

  // Estado para almacenar el cliente seleccionado
  const [selectedClient, setSelectedClient] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idCustomerDefault || !idAddressDeliveryDefault) {
      alert("Por favor, completa los campos obligatorios.");
      return;
    }
    const newConfig = {
      id_customer_default: Number(idCustomerDefault),
      id_address_delivery_default: Number(idAddressDeliveryDefault),
      allow_out_of_stock_sales: allowOutOfStockSales,
      ticket_text_header_1: ticketTextHeader1 || null,
      ticket_text_header_2: ticketTextHeader2 || null,
      ticket_text_footer_1: ticketTextFooter1 || null,
      ticket_text_footer_2: ticketTextFooter2 || null,
    };
    onConfigSubmit(newConfig);
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button
        label="Crear Configuración"
        className="p-button-primary"
        onClick={handleSubmit}
      />
    </div>
  );

  return (
    <>
      <Dialog
        header="Crear configuración TPV"
        visible={isOpen}
        onHide={onClose}
        modal
        style={{ width: "30rem", backgroundColor: "var(--surface-0)" }}
        footer={footer}
        closable={false}
        draggable={false}
        resizable={false}
      >
        <div className="p-4">
          <p className="mb-4">Introduce los datos básicos para tu TPV.</p>
          {errorMessage && <p className="text-red-500 mb-2">{errorMessage}</p>}

          {/* ID Cliente por defecto */}
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">
              ID Cliente por defecto <span className="text-red-500">*</span>
            </label>
            <div className="p-inputgroup">
              <InputText
                value={
                  selectedClient
                    ? `${selectedClient.firstname} ${selectedClient.lastname} (${idCustomerDefault})`
                    : idCustomerDefault
                    ? `(${idCustomerDefault})`
                    : ""
                }
                disabled
                className="w-full"
              />
              <Button
                icon="pi pi-search"
                onClick={handleOpenSearchDialog}
                className="p-button-secondary"
              />
            </div>
          </div>

          {/* ID Dirección de entrega por defecto */}
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">
              ID Dirección de entrega por defecto{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="p-inputgroup">
              <InputText
                value={idAddressDeliveryDefault}
                disabled
                className="w-full"
              />
              <Button
                icon="pi pi-search"
                onClick={handleOpenSearchDialog}
                className="p-button-secondary"
              />
            </div>
          </div>

          <div className="mb-3 flex items-center">
            <label className="block text-sm font-semibold mr-2">
              Permitir ventas sin stock
            </label>
            <InputSwitch
              checked={allowOutOfStockSales}
              onChange={(e) => setAllowOutOfStockSales(e.value)}
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">
              Texto de encabezado del ticket 1
            </label>
            <InputText
              value={ticketTextHeader1}
              onChange={(e) => setTicketTextHeader1(e.target.value)}
              className="w-full"
              disabled={true} // Deshabilitado para que solo se pueda seleccionar
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">
              Texto de encabezado del ticket 2
            </label>
            <InputText
              value={ticketTextHeader2}
              onChange={(e) => setTicketTextHeader2(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">
              Texto de pie de ticket 1
            </label>
            <InputText
              value={ticketTextFooter1}
              onChange={(e) => setTicketTextFooter1(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-semibold mb-1">
              Texto de pie de ticket 2
            </label>
            <InputText
              value={ticketTextFooter2}
              onChange={(e) => setTicketTextFooter2(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </Dialog>

      {/* Diálogo de búsqueda de cliente */}
      <CustomerSearchDialog
        isOpen={searchDialog.isOpen}
        onClose={searchDialog.close}
        onSelect={handleSelectClientAndAddress}
      />
    </>
  );
};

export default ConfigNotFoundDialog;
