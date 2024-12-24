// src/components/Sales/SalesCard.jsx
import React, { useState, useEffect, useContext } from 'react';
import Modal from '../modals/Modal';
import ReturnsExchangesModal from '../modals/returns/ReturnsExchangesModal';
import ReprintModal from '../modals/reprint/ReprintModal';
import ParkedCartsModal from '../modals/parked/ParkedCartsModal'; // Importamos el nuevo modal
import useFinalizeSale from '../../hooks/useFinalizeSale';
import DiscountModal from '../modals/discount/DiscountModal';
import PinValidationModal from '../modals/pin/PinValidationModal';
import { AuthContext } from '../../contexts/AuthContext'; // Importar AuthContext

const SalesCard = ({
  cartItems,
  setCartItems,
  onRemoveProduct,
  onDecreaseProduct,
  lastAction,
  handleAddProduct,
  saveCurrentCartAsParked, // Función para guardar carrito
  getParkedCarts,           // Función para obtener carritos aparcados
  loadParkedCart,           // Función para cargar un carrito aparcado
  deleteParkedCart,         // Función para eliminar un carrito aparcado
}) => {
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false); // Estado para DiscountModal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false); // Estado para PinValidationModal
  const [isFinalSaleModalOpen, setFinalSaleModalOpen] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({
    efectivo: '',
    tarjeta: '',
    bizum: '',
  });
  const [changeAmount, setChangeAmount] = useState(0);
  const [copies, setCopies] = useState(1);
  const [giftTicket, setGiftTicket] = useState(false);
  const [highlightedItems, setHighlightedItems] = useState({});
  const [isReturnsModalOpen, setIsReturnsModalOpen] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [isParkedCartsModalOpen, setIsParkedCartsModalOpen] = useState(false); // Estado para el nuevo modal

  // Estados para el modal de nombre del ticket
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [ticketName, setTicketName] = useState('');

  const { isLoading, finalizeSale } = useFinalizeSale();

  const { idProfile } = useContext(AuthContext);

  const handleDescuentoClick = () => {
    if (idProfile === 1) {
      // Si es administrador, abrir directamente DiscountModal
      setIsDiscountModalOpen(true);
    } else {
      // Si no es administrador, abrir PinValidationModal primero
      setIsPinModalOpen(true);
    }
  };

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

  // Función para abrir el modal de nombre al aparcar el carrito
  const handleParkCart = () => {
    if (cartItems.length === 0) {
      alert('No hay productos en el carrito para aparcar.');
      return;
    }
    setIsNameModalOpen(true);
  };

  // Función para guardar el carrito aparcado con el nombre
  const handleSaveParkedCart = () => {
    if (ticketName.trim() === '') {
      alert('Por favor, introduce un nombre para el ticket.');
      return;
    }
    saveCurrentCartAsParked(ticketName.trim());
    setTicketName('');
    setIsNameModalOpen(false);
    handleClearCart();
  };

  const handleClearCart = () => {
    setCartItems([]);
    // Limpiar el carrito de localStorage
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      const cartKey = `cart_shop_${storedShop.id_shop}`;
      localStorage.removeItem(cartKey);
    }
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
      setSelectedMethods((prevMethods) =>
        prevMethods.filter((m) => m !== method)
      );
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
          [method]:
            total - totalEnteredAmount > 0
              ? (total - totalEnteredAmount).toFixed(2)
              : '',
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
        // Limpiar el carrito de localStorage
        const storedShop = JSON.parse(localStorage.getItem('shop'));
        if (storedShop) {
          const cartKey = `cart_shop_${storedShop.id_shop}`;
          localStorage.removeItem(cartKey);
        }
        setSelectedMethods([]);
        setAmounts({ efectivo: '', tarjeta: '', bizum: '' });
        setChangeAmount(0);
        setCopies(1);
        setGiftTicket(false);
        setFinalSaleModalOpen(false);
      },
      onError: (error) => {
        alert('Error al finalizar la venta. Por favor, intenta nuevamente.');
      },
    });
  };

  const isFinalizeDisabled =
    Object.values(amounts).reduce(
      (sum, value) => sum + (parseFloat(value) || 0),
      0
    ) < total;

  // Funciones para el modal de carritos aparcados
  const handleLoadCart = (cartId) => {
    loadParkedCart(cartId);
    setIsParkedCartsModalOpen(false);
  };

  const handleDeleteCart = (cartId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este carrito aparcado?')) {
      deleteParkedCart(cartId);
      // Opcional: Puedes actualizar la lista de carritos aparcados aquí si es necesario
    }
  };

  const parkedCarts = getParkedCarts();

  // Función que se ejecuta al verificar el PIN correctamente
  const handlePinSuccess = () => {
    setIsPinModalOpen(false); // Cerrar PinValidationModal
    setIsDiscountModalOpen(true); // Abrir DiscountModal
  };

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

          {/* Botón para Tickets Aparcados con el mismo ícono de ticket */}
          <button
            className="bg-yellow-500 text-white p-2 rounded flex items-center justify-center relative"
            onClick={() => setIsParkedCartsModalOpen(true)}
          >
            {/* Ícono de ticket */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 mr-2"
            >
              <path d="M4 4h16v6H4V4zm0 8h16v6H4v-6z" />
            </svg>
            <span>Tickets Aparcados</span>
            {/*
             {parkedCartsCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                {parkedCartsCount}
              </span>
            )} */}
          </button>
          
          {/* Botón para Guardar Ticket con ícono de guardar */}
          <button
            className="bg-gray-200 p-2 rounded flex items-center justify-center"
            onClick={handleParkCart}
          >
            {/* Ícono de guardar */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 mr-2"
            >
              <path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H7V5h10v14zm-5-9.5L9.5 12l1.5 1.5L15.5 10l-1.5-1.5L12 10.5z" />
            </svg>
            <span>Guardar Ticket</span>
          </button>

          {/* Botón de Borrar Ticket */}
          <button
            className="bg-gray-200 p-2 rounded flex items-center justify-center"
            onClick={handleClearCart}
          >
            {/* Ícono de X */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 mr-2"
            >
              <path d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" />
            </svg>
            <span className="ml-2">Borrar Ticket</span>
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

        <div className="mt-4 flex flex-col space-y-2">
          <div className="flex justify-between space-x-2">
            <button
              className="bg-gray-300 text-black px-2 py-2 rounded w-1/3 flex items-center justify-center"
              onClick={() => setIsReturnsModalOpen(true)}
            >
              Devoluciones/Cambios
            </button>
            <button
              className="bg-gray-300 text-black px-2 py-2 rounded w-1/3 flex items-center justify-center"
              onClick={() => setIsReprintModalOpen(true)}
            >
              Reimprimir
            </button>
            <button
              className="bg-green-500 text-white px-2 py-2 rounded w-1/3 flex items-center justify-center"
              onClick={() => alert('Añadir Manualmente')}
            >
              + Añadir Manual
            </button>
          </div>
          <div className="flex justify-between space-x-2">

            {/* Botón de Descuento Modificado */}
            <button
              className="bg-purple-500 text-white px-2 py-2 rounded w-full flex items-center justify-center"
              onClick={handleDescuentoClick} // Cambiado para usar handleDescuentoClick
            >
              Descuento
            </button>
          </div>
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

      {/* Modal de Tickets Aparcados */}
      <ParkedCartsModal
        isOpen={isParkedCartsModalOpen}
        onClose={() => setIsParkedCartsModalOpen(false)}
        parkedCarts={parkedCarts}
        onLoadCart={handleLoadCart}
        onDeleteCart={handleDeleteCart}
      />

      {/* Modal para Solicitar Nombre del Ticket Aparcado */}
      <Modal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        title="Guardar Ticket Aparcado"
        showCloseButton={true}
      >
        <div className="p-4">
          <label className="block mb-2 font-semibold">Nombre del Ticket:</label>
          <input
            type="text"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            className="w-full border rounded p-2 mb-4"
            placeholder="Introduce un nombre para el ticket"
          />
          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-300 text-black px-4 py-2 rounded"
              onClick={() => setIsNameModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={handleSaveParkedCart}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Devoluciones/Cambios */}
      <ReturnsExchangesModal
        isOpen={isReturnsModalOpen}
        onClose={() => setIsReturnsModalOpen(false)}
        onAddProduct={handleAddProduct} // <-- Aquí pasamos handleAddProduct al modal
      />

      {/* Modal de Reimpresión */}
      <ReprintModal
        isOpen={isReprintModalOpen}
        onClose={() => setIsReprintModalOpen(false)}
      />

      {/* Modal de descuento */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
      />

      {/* PinValidationModal */}
      <PinValidationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      {/* Modal para finalizar la venta */}
      <Modal
        isOpen={isFinalSaleModalOpen}
        onClose={handleCloseModal}
        title="Finalizar Venta"
        showCloseButton={true}
        showBackButton={false}
        size="lg"
        height="tall"
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
                className={`px-4 py-2 rounded ${
                  giftTicket
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300'
                }`}
                onClick={() => setGiftTicket(true)}
              >
                Sí
              </button>
              <button
                className={`ml-2 px-4 py-2 rounded ${
                  !giftTicket
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-300'
                }`}
                onClick={() => setGiftTicket(false)}
              >
                No
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-3xl font-bold">
              Importe Total: {total.toFixed(2)} €
            </h3>
            <p className="text-2xl font-bold">
              Cambio: {changeAmount.toFixed(2)} €
            </p>
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
              isFinalizeDisabled || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600'
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