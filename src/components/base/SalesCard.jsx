import React, { useState, useEffect, useContext } from 'react';
import Modal from '../modals/Modal';
import { jsPDF } from 'jspdf';
import ticketConfigData from '../../data/ticket.json'; // Importa la configuración del ticket
import JsBarcode from 'jsbarcode';
import { useApiFetch } from '../../components/utils/useApiFetch';
import { ConfigContext } from '../../ConfigContext';

const SalesCard = ({
  cartItems,
  setCartItems,
  onRemoveProduct,
  onDecreaseProduct,
  permisosUsuario,
  lastAction,
}) => {
  const [isFinalSaleModalOpen, setFinalSaleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({ efectivo: '', tarjeta: '', bizum: '' });
  const [changeAmount, setChangeAmount] = useState(0);
  const [copies, setCopies] = useState(1);
  const [giftTicket, setGiftTicket] = useState(false);
  const [highlightedItems, setHighlightedItems] = useState({});
  const apiFetch = useApiFetch();
  const { configData } = useContext(ConfigContext); // Obtenemos configData del contexto

  // Extraemos allow_out_of_stock_sales de configData
  const allowOutOfStockSales = configData ? configData.allow_out_of_stock_sales : false;

  useEffect(() => {
    if (lastAction !== null) {
      const { id, action } = lastAction;
      setHighlightedItems((prev) => ({ ...prev, [id]: action }));
      const timer = setTimeout(() => {
        setHighlightedItems((prev) => ({ ...prev, [id]: null }));
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  // Actualizamos el cálculo del total utilizando final_price_incl_tax
  const total = cartItems.reduce(
    (sum, item) => sum + item.final_price_incl_tax * item.quantity,
    0
  );

  // Funciones para los nuevos botones
  const handleParkCart = () => {
    alert('Carrito aparcado');
  };

  const handleApplyDiscount = () => {
    alert('Aplicar descuento');
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Determinar el número total de artículos en el carrito
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleFinalSale = () => {
    setIsLoading(true);
    setFinalSaleModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsLoading(false);
    setFinalSaleModalOpen(false);
  };

  const updateChangeAmount = (updatedAmounts) => {
    if (selectedMethods.length === 0) {
      setChangeAmount(0);
    } else {
      const totalEnteredAmount = Object.values(updatedAmounts).reduce(
        (sum, value) => sum + (parseFloat(value) || 0),
        0
      );
      setChangeAmount(totalEnteredAmount - total);
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

  const finalizeSale = async () => {
    setIsLoading(true);
    // Recuperar datos necesarios de localStorage
    const shop = JSON.parse(localStorage.getItem('shop'));
    const employee = JSON.parse(localStorage.getItem('employee'));
    const client = JSON.parse(localStorage.getItem('selectedClient'));
    const address = JSON.parse(localStorage.getItem('selectedAddress'));

    // Si no hay cliente o dirección seleccionados, usar valores predeterminados
    const id_customer = client ? client.id_customer : 0; // 0 para cliente genérico
    const id_address_delivery = address ? address.id_address : 0; // 0 para dirección predeterminada

    // Calcular total sin impuestos
    const total_paid_tax_excl = cartItems.reduce(
      (sum, item) => sum + item.final_price_excl_tax * item.quantity,
      0
    );

    // Total de productos (suma de total_price_tax_excl)
    const total_products = total_paid_tax_excl;

    // Preparar order_details
    const order_details = cartItems.map((item) => ({
      product_id: item.id_product,
      product_attribute_id: item.id_product_attribute,
      stock_available_id: item.id_stock_available,
      product_name: `${item.product_name} ${item.combination_name}`,
      product_quantity: item.quantity,
      product_price: item.unit_price_tax_excl, // Precio unitario sin impuestos
      product_ean13: item.ean13_combination,
      product_reference: item.reference_combination,
      total_price_tax_incl: parseFloat((item.final_price_incl_tax * item.quantity).toFixed(2)),
      total_price_tax_excl: parseFloat((item.final_price_excl_tax * item.quantity).toFixed(2)),
      unit_price_tax_incl: item.final_price_incl_tax,
      unit_price_tax_excl: item.final_price_excl_tax,
      id_shop: item.id_shop,
    }));

    // Preparar el objeto saleData para la API
    const saleData = {
      id_shop: shop.id_shop,
      id_customer: id_customer,
      id_address_delivery: id_address_delivery,
      payment: selectedMethods.join(', '),
      total_paid: parseFloat(total.toFixed(2)),
      total_paid_tax_excl: parseFloat(total_paid_tax_excl.toFixed(2)),
      total_products: parseFloat(total_products.toFixed(2)),
      order_details: order_details,
      // Puedes incluir otros campos si lo deseas
    };

    console.log('Información del ticket de compra:', saleData);

    try {
      // Realizar la llamada a la API
      const data = await apiFetch('https://apitpv.anthonyloor.com/create_order', {
        method: 'POST',
        body: JSON.stringify(saleData),
      });

      console.log('Orden creada:', data);

      // Después de crear la orden, vaciamos el carrito
      setCartItems([]);

      // Restablecer los estados
      setIsLoading(false);
      setFinalSaleModalOpen(false);
      setSelectedMethods([]);
      setAmounts({ efectivo: '', tarjeta: '', bizum: '' });
      setChangeAmount(0);
      setCopies(1);
      setGiftTicket(false);

      // Puedes mostrar un mensaje de éxito o redirigir al usuario
      alert('Venta finalizada con éxito');

      // Generar y imprimir el ticket
      generatePDF({
        cartItems,
        total,
        selectedMethods,
        amounts,
        changeAmount,
        copies,
        giftTicket,
        date: new Date(),
        employeeName: employee ? employee.employee_name : 'Empleado',
      });
    } catch (error) {
      console.error('Error al crear la orden:', error);
      // Manejar el error, mostrar mensaje al usuario, etc.
      alert('Error al finalizar la venta. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
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
          doc.text(`${item.final_price_incl_tax.toFixed(2)} €`, 50, yPosition, { align: 'right' });
          doc.text(`${(item.final_price_incl_tax * item.quantity).toFixed(2)} €`, 70, yPosition, { align: 'right' });
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

  const isFinalizeDisabled =
    Object.values(amounts).reduce((sum, value) => sum + (parseFloat(value) || 0), 0) < total;

    return (
      <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col relative">
        {/* Sección superior con indicador numérico y botones */}
        <div className="mb-4 flex items-center justify-between">
          {/* Indicador numérico con fondo naranja */}
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full">
            {totalItems}
          </div>
          {/* Botones */}
          <div className="flex space-x-2">
            {/* Botón para aparcar el carrito */}
            <button
              className="bg-gray-200 p-2 rounded"
              onClick={handleParkCart}
            >
              {/* Ícono de pasar página */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
              </svg>

            </button>
            {/* Botón de descuento */}
            <button
              className="bg-gray-200 p-2 rounded"
              onClick={handleApplyDiscount}
            >
              {/* Ícono de descuento */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M12 2.25C6.477 2.25 2.25 6.477 2.25 12S6.477 21.75 12 21.75 21.75 17.523 21.75 12 17.523 2.25 12 2.25ZM7.75 12.25a.75.75 0 0 1 0-1.5h8.5a.75.75 0 0 1 0 1.5h-8.5ZM8.5 9.75a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0Zm5.5 4.5a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0Z" clipRule="evenodd"/>
              </svg>
            </button>
            {/* Botón para vaciar el carrito */}
            <button
              className="bg-gray-200 p-2 rounded"
              onClick={handleClearCart}
            >
              {/* Ícono de X */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

      {/* Lista de productos en el ticket */}
      <div className="relative z-10 flex-grow overflow-auto">
        {/* Encabezados de las columnas */}
        <div className="grid grid-cols-5 gap-4 font-bold border-b py-2">
          <span className="text-center">Und.</span>
          <span>Producto</span>
          <span className="text-right">P/U</span>
          <span className="text-right">Total</span>
          <span className="text-right">Desc.</span>
        </div>
        {cartItems.length > 0 ? (
          <ul>
            {cartItems.map((item, index) => {
              const highlightClass =
                highlightedItems[item.id_stock_available] === 'add'
                  ? 'bg-green-100'
                  : highlightedItems[item.id_stock_available] === 'decrease'
                  ? 'bg-red-100'
                  : '';

              // Calculamos el porcentaje de descuento
              const discountPercentage =
                item.price_incl_tax !== 0
                  ? ((1 - item.final_price_incl_tax / item.price_incl_tax) * 100).toFixed(0)
                  : 0;

              return (
                <li
                  key={item.id_stock_available}
                  className={`grid grid-cols-5 gap-4 py-2 items-center border-b ${highlightClass}`}
                >
                  <span className="text-center">{item.quantity}x</span>
                  <span>
                    {item.product_name} {item.combination_name}
                  </span>
                  <span className="text-right">
                    {item.final_price_incl_tax.toFixed(2)} €
                  </span>
                  <span className="text-right font-bold">
                    {(item.final_price_incl_tax * item.quantity).toFixed(2)} €
                  </span>
                  <span className="text-right">
                    {discountPercentage > 0 ? `-${discountPercentage}%` : ''}
                  </span>
                  {/* Botones de acción */}
                  <div className="col-span-5 flex justify-end space-x-2 mt-2">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => onDecreaseProduct(item.id_stock_available)}
                    >
                      -
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => onRemoveProduct(item.id_stock_available)}
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
      {/* Área inferior con total y botones */}
      <div className="mt-4">
        <div className="border-t pt-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold">Total: {total.toFixed(2)} €</h3>
        </div>

        {/* Botones de acciones */}
        <div className="mt-4 flex justify-between space-x-2">
          <button
            className="bg-gray-300 text-black px-2 py-2 rounded w-1/3"
            onClick={() => alert('Devoluciones/Cambios')}
          >
            Devoluciones/Cambios
          </button>
          <button
            className="bg-gray-300 text-black px-2 py-2 rounded w-1/3"
            onClick={() => alert('Reimprimir')}
          >
            Reimprimir
          </button>
          <button
            className="bg-green-500 text-white px-2 py-2 rounded w-1/3"
            onClick={() => alert('Añadir Manualmente')}
          >
            + Añadir Manual
          </button>
        </div>

        {/* Botón de Finalizar Venta */}
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
