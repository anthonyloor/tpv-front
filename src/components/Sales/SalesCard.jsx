// src/components/Sales/SalesCard.jsx
import React, { useState, useEffect, useContext } from 'react';
import Modal from '../modals/Modal';
import ReturnsExchangesModal from '../modals/returns/ReturnsExchangesModal'
import ReprintModal from '../modals/reprint/ReprintModal';
import useFinalizeSale from '../../hooks/useFinalizeSale';
import { ConfigContext } from '../../contexts/ConfigContext';

const SalesCard = ({
  cartItems,
  setCartItems,
  onRemoveProduct,
  onDecreaseProduct,
  lastAction,
  handleAddProduct,
}) => {
  const { configData } = useContext(ConfigContext);
  const allowOutOfStockSales = configData ? configData.allow_out_of_stock_sales : false;

  const [isFinalSaleModalOpen, setFinalSaleModalOpen] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({ efectivo: '', tarjeta: '', bizum: '' });
  const [changeAmount, setChangeAmount] = useState(0);
  const [copies, setCopies] = useState(1);
  const [giftTicket, setGiftTicket] = useState(false);
  const [highlightedItems, setHighlightedItems] = useState({});
  const [isReturnsModalOpen, setIsReturnsModalOpen] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  
  const { isLoading, finalizeSale } = useFinalizeSale();

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

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleFinalSale = () => {
    setFinalSaleModalOpen(true);
  };

  const handleCloseModal = () => {
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

  const handleConfirmSale = () => {
    finalizeSale({
      cartItems,
      total,
      selectedMethods,
      amounts,
      changeAmount,
      copies,
      giftTicket,
      onSuccess: () => {
        alert('Venta finalizada con éxito');
        // Vaciar el carrito y restaurar el estado inicial
        setCartItems([]);
        setSelectedMethods([]);
        setAmounts({ efectivo: '', tarjeta: '', bizum: '' });
        setChangeAmount(0);
        setCopies(1);
        setGiftTicket(false);
        setFinalSaleModalOpen(false);
      },
      onError: (error) => {
        alert('Error al finalizar la venta. Por favor, intenta nuevamente.');
      }
    });
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

      {/* Lista de productos */}
      <div className="relative z-10 flex-grow overflow-auto">
        <div className="grid grid-cols-5 gap-4 font-bold border-b py-2">
          <span className="text-center">Und.</span>
          <span>Producto</span>
          <span className="text-right">P/U</span>
          <span className="text-right">Total</span>
          <span className="text-right">Desc.</span>
        </div>
        {cartItems.length > 0 ? (
          <ul>
            {cartItems.map((item) => {
              const highlightClass =
                highlightedItems[item.id_stock_available] === 'add'
                  ? 'bg-green-100'
                  : highlightedItems[item.id_stock_available] === 'decrease'
                  ? 'bg-red-100'
                  : '';

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

      {/* Área inferior con total y acciones */}
      <div className="mt-4">
        <div className="border-t pt-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold">Total: {total.toFixed(2)} €</h3>
        </div>

        <div className="mt-4 flex justify-between space-x-2">
          <button className="bg-gray-300 text-black px-2 py-2 rounded w-1/3" onClick={() => setIsReturnsModalOpen(true)}>
            Devoluciones/Cambios
          </button>
          <button className="bg-gray-300 text-black px-2 py-2 rounded w-1/3" onClick={() => setIsReprintModalOpen(true)}>
            Reimprimir
          </button>
          <button className="bg-green-500 text-white px-2 py-2 rounded w-1/3" onClick={() => alert('Añadir Manualmente')}>
            + Añadir Manual
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

      <ReturnsExchangesModal
        isOpen={isReturnsModalOpen}
        onClose={() => setIsReturnsModalOpen(false)}
        onAddProduct={handleAddProduct} // <-- Aquí pasamos handleAddProduct al modal
      />

<ReprintModal
  isOpen={isReprintModalOpen}
  onClose={() => setIsReprintModalOpen(false)}/>

      {/* Modal para finalizar la venta */}
      <Modal
  isOpen={isFinalSaleModalOpen}
  onClose={handleCloseModal}
  title="Finalizar Venta"
  showCloseButton={true}
  showBackButton={false}
>
  <div className="p-6">
    {/* Ya no ponemos el h2 aquí, el título lo maneja el modal */}
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
          className={`px-4 py-2 rounded ${giftTicket ? 'bg-green-600 text-white' : 'bg-gray-300'}`}
          onClick={() => setGiftTicket(true)}
        >
          Sí
        </button>
        <button
          className={`ml-2 px-4 py-2 rounded ${!giftTicket ? 'bg-red-600 text-white' : 'bg-gray-300'}`}
          onClick={() => setGiftTicket(false)}
        >
          No
        </button>
      </div>
    </div>

    <div className="mb-4">
      <h3 className="text-3xl font-bold">Importe Total: {total.toFixed(2)} €</h3>
      <p className="text-2xl font-bold">Cambio: {changeAmount.toFixed(2)} €</p>
    </div>

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

    <button
      className={`w-full py-4 px-4 py-2 rounded text-white ${
        isFinalizeDisabled || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'
      }`}
      onClick={handleConfirmSale}
      disabled={isFinalizeDisabled || isLoading}
    >
      {isLoading ? 'Procesando...' : 'Confirmar Venta'}
    </button>
  </div>
</Modal>
    </div>
  );
};

export default SalesCard;