import React, { useState, useEffect } from 'react';
import Modal from '../modals/Modal';
import { jsPDF } from 'jspdf';
import sessionConfig from '../../data/sessionConfig.json';
import ticketConfigData from '../../data/ticket.json'; // Importa la configuración del ticket
import JsBarcode from 'jsbarcode';

// Datos de clientes de prueba
const testClients = [
  { id_customer: 1, full_name: 'Juan Pérez' },
  { id_customer: 2, full_name: 'María López' },
  { id_customer: 3, full_name: 'Carlos Sánchez' },
];

const SalesCard = ({
  cartItems,
  setCartItems, // Necesitamos esta función para vaciar el carrito
  onRemoveProduct,
  onDecreaseProduct,
  permisosUsuario,
  lastAction,
}) => {
  const [isFinalSaleModalOpen, setFinalSaleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Estado de carga para el botón
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({ efectivo: '', tarjeta: '', bizum: '' });
  const [changeAmount, setChangeAmount] = useState(0);
  const [copies, setCopies] = useState(1); // Número de copias del ticket
  const [giftTicket, setGiftTicket] = useState(false); // Estado del ticket de regalo
  const [highlightedItems, setHighlightedItems] = useState({});
  const [selectedClient, setSelectedClient] = useState({ id_customer: 0, full_name: 'Cliente genérico' });
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  useEffect(() => {
    if (lastAction !== null) {
      const { id, action } = lastAction;
      setHighlightedItems((prev) => ({ ...prev, [id]: action }));
      const timer = setTimeout(() => {
        setHighlightedItems((prev) => ({ ...prev, [id]: null }));
      }, 500); // Duración de la animación (más rápida)

      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleFinalSale = () => {
    setIsLoading(true); // Establecer el estado de carga a true
    setFinalSaleModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsLoading(false); // Restablecer el estado de carga a false al cerrar el modal
    setFinalSaleModalOpen(false);
  };

  const updateChangeAmount = (updatedAmounts) => {
    if (selectedMethods.length === 0) {
      setChangeAmount(0); // Si no hay métodos de pago seleccionados, el cambio es 0
    } else {
      const totalEnteredAmount = Object.values(updatedAmounts).reduce(
        (sum, value) => sum + (parseFloat(value) || 0),
        0
      );
      setChangeAmount(totalEnteredAmount - total); // Mostrar la diferencia, incluso si es negativa
    }
  };

  const togglePaymentMethod = (method) => {
    if (selectedMethods.includes(method)) {
      const updatedAmounts = { ...amounts, [method]: '' };
      setSelectedMethods((prevMethods) => prevMethods.filter((m) => m !== method));
      setAmounts(updatedAmounts);
      updateChangeAmount(updatedAmounts);
    } else {
      setSelectedMethods((prevMethods) => [...prevMethods, method]);
      if (method === 'tarjeta' || method === 'bizum') {
        const totalEnteredAmount = Object.values(amounts).reduce(
          (sum, amount) => sum + (parseFloat(amount) || 0),
          0
        );
        const updatedAmounts = {
          ...amounts,
          [method]: total - totalEnteredAmount > 0 ? (total - totalEnteredAmount).toFixed(2) : '',
        };
        setAmounts(updatedAmounts);
        updateChangeAmount(updatedAmounts);
      }
    }
  };

  const handleAmountChange = (method, amount) => {
    const updatedAmounts = { ...amounts, [method]: amount };
    setAmounts(updatedAmounts);
    updateChangeAmount(updatedAmounts);
  };

  const finalizeSale = () => {
    const saleData = {
      cartItems,
      total,
      selectedMethods,
      amounts,
      changeAmount,
      copies,
      giftTicket,
      date: new Date(),
      shop: sessionConfig,
      employeeName: sessionConfig.name_employee, // Asegúrate de que este campo existe
    };

    console.log('Información del ticket de compra:', saleData);

    // Generar el ticket de compra en PDF
    generatePDF(saleData);

    // Después de generar el PDF, vaciamos el carrito
    setCartItems([]);

    // Restablecer los estados
    setIsLoading(false);
    setFinalSaleModalOpen(false);
    setSelectedMethods([]);
    setAmounts({ efectivo: '', tarjeta: '', bizum: '' });
    setChangeAmount(0);
    setCopies(1);
    setGiftTicket(false);
  };

  const generatePDF = (saleData) => {
    const { copies, giftTicket } = saleData;
    const numCopies = giftTicket ? 1 : copies; // Si es ticket regalo, solo una copia
  
    const doc = new jsPDF({
      unit: 'mm',
      format: [72.11, 297],
    });
  
    for (let i = 0; i < numCopies; i++) {
      if (i > 0) {
        doc.addPage();
      }
  
      let yPosition = 10;
  
      // 1. Logo-imagen
      if (ticketConfigData.logo) {
        const img = new Image();
        img.src = ticketConfigData.logo;
        doc.addImage(img, 'PNG', 10, yPosition, 50, 30);
        yPosition += 35;
      }
  
      // 2. Texto cabecera 1
      if (ticketConfigData.headerText1) {
        doc.setFontSize(12);
        doc.text(ticketConfigData.headerText1, 36.055, yPosition, { align: 'center' });
        yPosition += 6;
      }
  
      // 3. Texto cabecera 2
      if (ticketConfigData.headerText2) {
        doc.setFontSize(12);
        doc.text(ticketConfigData.headerText2, 36.055, yPosition, { align: 'center' });
        yPosition += 6;
      }
  
      // 4. Separador
      doc.line(10, yPosition, 62.11, yPosition);
      yPosition += 3;
  
      // 5. "Ticket compra" o "Ticket regalo"
      const ticketTypeText = saleData.giftTicket ? 'Ticket regalo' : 'Ticket compra';
      doc.setFontSize(12);
      doc.text(ticketTypeText, 36.055, yPosition, { align: 'center' });
      yPosition += 6;
  
      // 6. Fecha: dd/mm/aaaa hh:mm
      const date = saleData.date;
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${
        (date.getMonth() + 1).toString().padStart(2, '0')
      }/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${
        date.getMinutes().toString().padStart(2, '0')
      }`;
  
      doc.setFontSize(10);
      doc.text(`Fecha: ${formattedDate}`, 10, yPosition);
      yPosition += 5;
  
      // 7. Atendido por: name_employee
      doc.text(`Atendido por: ${saleData.employeeName}`, 10, yPosition);
      yPosition += 5;
  
      // 8. Separador
      doc.line(10, yPosition, 62.11, yPosition);
      yPosition += 3;
  
      // 9. Tabla de productos del ticket
      doc.setFontSize(10);
      doc.text('Cant.', 10, yPosition);
      doc.text('Producto', 20, yPosition);
      if (!saleData.giftTicket) {
        doc.text('P/U', 50, yPosition, { align: 'right' });
        doc.text('Total', 70, yPosition, { align: 'right' });
      }
      yPosition += 5;
  
      saleData.cartItems.forEach((item) => {
        const productText = `${item.product_name} ${item.combination_name}`;
        const splittedText = doc.splitTextToSize(productText, 40);
  
        doc.text(`${item.quantity}`, 10, yPosition);
        doc.text(splittedText, 20, yPosition);
  
        if (!saleData.giftTicket) {
          doc.text(`${item.price.toFixed(2)} €`, 50, yPosition, { align: 'right' });
          doc.text(`${(item.price * item.quantity).toFixed(2)} €`, 70, yPosition, { align: 'right' });
        }
  
        const lineHeight = 5;
        const textHeight = splittedText.length * lineHeight;
  
        yPosition += textHeight + 2;
      });
  
      // 10. Separador
      doc.line(10, yPosition, 62.11, yPosition);
      yPosition += 3;
  
      if (!saleData.giftTicket) {
        // 11. Total
        doc.setFontSize(12);
        doc.text(`Total: ${saleData.total.toFixed(2)} €`, 70, yPosition, { align: 'right' });
        yPosition += 7;
  
        // 12. Métodos de pago y cambio
        doc.setFontSize(10);
        doc.text('Métodos de Pago:', 10, yPosition);
        yPosition += 5;
        saleData.selectedMethods.forEach((method) => {
          const amount = parseFloat(saleData.amounts[method]);
          if (!isNaN(amount) && amount > 0) {
            doc.text(
              `${method.charAt(0).toUpperCase() + method.slice(1)}: ${amount.toFixed(2)} €`,
              20,
              yPosition
            );
            yPosition += 5;
          }
        });
  
        // Cambio
        doc.text(`Cambio: ${saleData.changeAmount.toFixed(2)} €`, 10, yPosition);
        yPosition += 5;
  
        // 13. IVA
        const IVA_RATE = 0.21; // 21%
        const baseAmount = saleData.total / (1 + IVA_RATE);
        const ivaAmount = saleData.total - baseAmount;
        doc.text(`IVA (${(IVA_RATE * 100).toFixed(0)}%): ${ivaAmount.toFixed(2)} €`, 10, yPosition);
        yPosition += 7;
      }
  
      // 14. Separador
      doc.line(10, yPosition, 62.11, yPosition);
      yPosition += 3;
  
      // 15. Código de barras
      const barcodeValue = 'ticket-1234567890';
  
      // Crear un elemento canvas
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, barcodeValue, {
        format: 'CODE128',
        displayValue: false,
        width: 1,
        height: 40,
        margin: 0,
      });
  
      // Convertir el canvas a imagen base64
      const barcodeDataUrl = canvas.toDataURL('image/png');
  
      // Agregar la imagen al PDF
      doc.addImage(barcodeDataUrl, 'PNG', 10, yPosition, 50, 20);
      yPosition += 25;
  
      // 16. Texto footer 1
      doc.setFontSize(10);
      if (ticketConfigData.footerText1) {
        doc.text(ticketConfigData.footerText1, 36.055, yPosition, { align: 'center', maxWidth: 60 });
        yPosition += 5;
      }
  
      // 17. Texto footer 2
      if (ticketConfigData.footerText2) {
        doc.text(ticketConfigData.footerText2, 36.055, yPosition, { align: 'center', maxWidth: 60 });
        yPosition += 5;
      }
    }
  
    // Configuramos el documento para imprimir automáticamente
    doc.autoPrint();
  
    // Obtenemos el PDF como blob
    const pdfBlob = doc.output('blob');
  
    // Creamos un objeto URL para el blob
    const blobUrl = URL.createObjectURL(pdfBlob);
  
    // Creamos un iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
  
    document.body.appendChild(iframe);
  
    iframe.onload = () => {
      iframe.contentWindow.print();
    };
  };

  // Funciones para manejar el cliente seleccionado
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setIsClientModalOpen(false);
  };

  const handleResetClient = () => {
    setSelectedClient({ id_customer: 0, full_name: 'Cliente genérico' });
  };

  const isFinalizeDisabled =
    Object.values(amounts).reduce((sum, value) => sum + (parseFloat(value) || 0), 0) < total;

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col justify-between relative overflow-hidden">

      {/* Sección para el cliente seleccionado y los botones */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold">
          {selectedClient.full_name}
        </span>
        <div className="flex space-x-2">
          {/* Botón 'P' para volver al cliente predeterminado (solo se muestra si el cliente no es genérico) */}
          {selectedClient.id_customer !== 0 && (
            <button
              className="bg-gray-200 p-2 rounded font-bold text-black"
              onClick={handleResetClient}
            >
              P
            </button>
          )}
          {/* Botón para gestionar clientes */}
          <button
            className="bg-gray-200 p-2 rounded"
            onClick={() => setIsClientModalOpen(true)}
          >
            {/* Ícono de usuario */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {/* Icono de usuario */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A4 4 0 0112 15a4 4 0 016.879 2.804M12 15v7m0 0h8m-8 0H4"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-grow overflow-auto">
        <div className="grid grid-cols-5 gap-4 font-bold border-b py-2">
          <span>Und.</span>
          <span>Producto</span>
          <span>P/U</span>
          <span>Total</span>
        </div>
        {cartItems.length > 0 ? (
          <ul>
            {cartItems.map((item, index) => {
              const highlightClass =
                highlightedItems[item.id_product_attribute] === 'add'
                  ? 'bg-green-100'
                  : highlightedItems[item.id_product_attribute] === 'decrease'
                  ? 'bg-red-100'
                  : '';

              return (
                <li
                  key={index}
                  className={`grid grid-cols-5 gap-4 py-2 items-center border-b ${highlightClass}`}
                >
                  <span className="font-bold">{item.quantity}x</span>
                  <span>
                    {item.product_name} {item.combination_name}
                  </span>
                  <span>{item.price.toFixed(2)} €</span>
                  <span className="font-bold">{(item.price * item.quantity).toFixed(2)} €</span>
                  <div className="flex justify-end space-x-2">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => onDecreaseProduct(item.id_product_attribute)}
                    >
                      -
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => onRemoveProduct(item.id_product_attribute)}
                    >
                      X
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No hay productos en el ticket.</p>
        )}
      </div>
      <div className="relative mt-4">
        <div className="border-t pt-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold">Total: {total.toFixed(2)} €</h3>
        </div>
        <div className="mt-4 flex justify-between space-x-4">
          <button
            className="bg-gray-300 text-black px-4 py-2 rounded w-full"
            onClick={() => alert('Descuento aplicado')}
          >
            Descuento
          </button>
          <button className="bg-gray-300 text-black px-4 py-2 rounded w-full">
            Reimprimir Ticket
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded w-full">
            + Añadir Manualmente
          </button>
        </div>
        <div className="mt-4">
          <button
            className={`px-4 py-3 rounded w-full text-lg font-bold flex items-center justify-center ${
              cartItems.length === 0 || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white'
            }`}
            disabled={cartItems.length === 0 || isLoading}
            onClick={handleFinalSale}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-white rounded-full"
                  viewBox="0 0 24 24"
                ></svg>
                Procesando...
              </>
            ) : (
              'Finalizar Venta'
            )}
          </button>
        </div>
      </div>

      {/* Modal para gestionar clientes */}
      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)}>
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">Seleccionar Cliente</h2>
          <div className="space-y-2">
            {testClients.map((client) => (
              <div
                key={client.id_customer}
                className="flex justify-between items-center border-b pb-2"
              >
                <span>{client.full_name}</span>
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => handleSelectClient(client)}
                >
                  Seleccionar
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded w-full"
              onClick={() => alert('Crear nuevo cliente')}
            >
              Crear Cliente Nuevo
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal para finalizar la venta */}
      <Modal isOpen={isFinalSaleModalOpen} onClose={handleCloseModal}>
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">Finalizar Venta</h2>

          {/* Número de copias y ticket regalo */}
          <div className="flex justify-between mb-4">
            <div className="flex items-center">
              <label className="mr-2">Copias:</label>
              <input
                type="number"
                min="1"
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
                className="border rounded p-2 w-16"
              />
            </div>
            <div className="flex items-center">
              <span className="mr-2">Ticket Regalo:</span>
              <button
                className={`px-4 py-2 rounded ${
                  giftTicket ? 'bg-green-600 text-white' : 'bg-gray-300'
                }`}
                onClick={() => setGiftTicket(true)}
              >
                Sí
              </button>
              <button
                className={`ml-2 px-4 py-2 rounded ${
                  !giftTicket ? 'bg-red-600 text-white' : 'bg-gray-300'
                }`}
                onClick={() => setGiftTicket(false)}
              >
                No
              </button>
            </div>
          </div>

          {/* Importe total y detalles del pago */}
          <div className="mb-4">
            <h3 className="text-3xl font-bold">Importe Total: {total.toFixed(2)} €</h3>
            <p className="text-2xl font-bold">Cambio: {changeAmount.toFixed(2)} €</p>
          </div>

          {/* Métodos de pago con inputs alineados */}
          <div className="flex flex-col space-y-4 mb-4">
            {['efectivo', 'tarjeta', 'bizum'].map((method) => (
              <div key={method} className="flex items-center space-x-4">
                <button
                  className={`w-1/3 py-4 rounded ${
                    selectedMethods.includes(method)
                      ? method === 'efectivo'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                      : 'bg-gray-400'
                  } text-white`}
                  onClick={() => togglePaymentMethod(method)}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
                <input
                  className="border rounded w-2/3 p-3"
                  type="number"
                  placeholder={`Importe en ${method.charAt(0).toUpperCase() + method.slice(1)}`}
                  value={amounts[method]}
                  onChange={(e) => handleAmountChange(method, e.target.value)}
                  disabled={!selectedMethods.includes(method)}
                />
              </div>
            ))}
          </div>

          {/* Botón para finalizar la venta */}
          <button
            className={`w-full py-4 px-4 py-2 rounded text-white ${
              isFinalizeDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'
            }`}
            onClick={finalizeSale}
            disabled={isFinalizeDisabled}
          >
            Confirmar Venta
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SalesCard;
