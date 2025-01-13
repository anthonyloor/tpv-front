// src/components/Sales/SalesCard.jsx
import React, { useState, useContext } from 'react';
import Modal from '../modals/Modal';
import ReturnsExchangesModal from '../modals/returns/ReturnsExchangesModal';
import ReprintModal from '../modals/reprint/ReprintModal';
import ParkedCartsModal from '../modals/parked/ParkedCartsModal';
import PinValidationModal from '../modals/pin/PinValidationModal';
import DiscountModal from '../modals/discount/DiscountModal';
import TicketViewModal from '../modals/ticket/TicketViewModal';
import useFinalizeSale from '../../hooks/useFinalizeSale';
import { AuthContext } from '../../contexts/AuthContext';
import { useCartRuleCreator } from '../../hooks/useCartRuleCreator';

function simulateDiscountConsumption(cartItems, appliedDiscounts) {
  const subtotalInclTax = cartItems.reduce(
    (acc, item) => acc + item.final_price_incl_tax * item.quantity,
    0
  );
  let remaining = subtotalInclTax;
  const leftoverArray = [];
  let totalDiscounts = 0;

  appliedDiscounts.forEach((disc) => {
    const { reduction_amount = 0, reduction_percent = 0 } = disc;
    let discountValue = 0;
    let leftoverValue = 0;
    if (reduction_percent > 0) {
      discountValue = (remaining * reduction_percent) / 100;
    } else if (reduction_amount > 0) {
      if (reduction_amount > remaining) {
        discountValue = remaining;
        leftoverValue = reduction_amount - remaining;
      } else {
        discountValue = reduction_amount;
      }
    }
    remaining -= discountValue;
    if (remaining < 0) remaining = 0;
    totalDiscounts += discountValue;
    if (leftoverValue > 0) {
      leftoverArray.push({
        code: disc.code,
        leftover: leftoverValue,
      });
    }
  });

  return { leftoverArray, finalTotal: remaining };
}

function SalesCard({
  cartItems,
  setCartItems,
  onRemoveProduct,
  onDecreaseProduct,
  lastAction,
  handleAddProduct,
  saveCurrentCartAsParked,
  getParkedCarts,
  loadParkedCart,
  deleteParkedCart,
  appliedDiscounts,
  addDiscount,
  removeDiscountByIndex,
  clearDiscounts,
}) {
  const { isLoading, finalizeSale } = useFinalizeSale();
  const { idProfile } = useContext(AuthContext);
  const [leftoverPreview, setLeftoverPreview] = useState([]);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isReturnsModalOpen, setIsReturnsModalOpen] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [isParkedCartsModalOpen, setIsParkedCartsModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isFinalSaleModalOpen, setFinalSaleModalOpen] = useState(false);
  const [ticketName, setTicketName] = useState('');
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({ efectivo: '', tarjeta: '', bizum: '' });
  const [changeAmount, setChangeAmount] = useState(0);
  const [giftTicket, setGiftTicket] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketOrderId, setTicketOrderId] = useState(null);
  const [printOnOpen, setPrintOnOpen] = useState(false);
  const [changeAmountTM, setChangeAmountTM] = useState(0);
  const [giftTicketTM, setGiftTicketTM] = useState(false);
  const [cartRuleModalOpen, setCartRuleModalOpen] = useState(false);
  const [newCartRuleCode, setNewCartRuleCode] = useState(null);
  const { createCartRuleWithResponse } = useCartRuleCreator();

  const subtotalProducts = cartItems.reduce(
    (sum, item) => sum + item.final_price_incl_tax * item.quantity,
    0
  );

  let totalDiscounts = 0;
  appliedDiscounts.forEach((disc) => {
    const { reduction_amount = 0, reduction_percent = 0 } = disc;
    if (reduction_percent > 0) {
      totalDiscounts += (subtotalProducts * reduction_percent) / 100;
    } else if (reduction_amount > 0) {
      totalDiscounts += Math.min(subtotalProducts, reduction_amount);
    }
  });

  const total = subtotalProducts - totalDiscounts;

  const handleParkCart = () => {
    if (cartItems.length === 0) {
      alert('No hay productos en el carrito para aparcar.');
      return;
    }
    setIsNameModalOpen(true);
  };

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
    clearDiscounts();
  };

  const parkedCarts = getParkedCarts();
  const handleLoadCart = (cartId) => {
    loadParkedCart(cartId);
    setIsParkedCartsModalOpen(false);
  };
  const handleDeleteCart = (cartId) => {
    if (window.confirm('¿Estás seguro de eliminar este ticket aparcado?')) {
      deleteParkedCart(cartId);
    }
  };

  const togglePaymentMethod = (method) => {
    if (selectedMethods.includes(method)) {
      const updatedAmounts = { ...amounts, [method]: '' };
      setSelectedMethods((prev) => prev.filter((m) => m !== method));
      setAmounts(updatedAmounts);
      updateChangeAmount(updatedAmounts);
    } else {
      setSelectedMethods((prev) => [...prev, method]);
      if (method === 'tarjeta' || method === 'bizum') {
        const totalEntered = Object.values(amounts).reduce(
          (sum, val) => sum + (parseFloat(val) || 0),
          0
        );
        const remain = total - totalEntered > 0 ? (total - totalEntered).toFixed(2) : '';
        const updated = { ...amounts, [method]: remain };
        setAmounts(updated);
        updateChangeAmount(updated);
      }
    }
  };

  const handleAmountChange = (method, amount) => {
    const updated = { ...amounts, [method]: amount };
    setAmounts(updated);
    updateChangeAmount(updated);
  };

  const updateChangeAmount = (updatedAmounts) => {
    if (selectedMethods.length === 0) {
      setChangeAmount(0);
      return;
    }
    const totalEnteredAmount = Object.values(updatedAmounts).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
    setChangeAmount(totalEnteredAmount - total);
  };

  const [leftoverInfo, setLeftoverInfo] = useState([]);
  const handleFinalSale = () => {
    if (cartItems.length === 0) return;
    const { leftoverArray } = simulateDiscountConsumption(cartItems, appliedDiscounts);
    setLeftoverPreview(leftoverArray);
    setFinalSaleModalOpen(true);
  };

  const handleCloseModal = () => {
    setFinalSaleModalOpen(false);
  };

  const handleConfirmSale = () => {
    finalizeSale(
      {
        cartItems,
        appliedDiscounts,
        total,
        selectedMethods,
        amounts,
        changeAmount,
        giftTicket,
        onSuccess: async ({
          orderId,
          print,
          giftTicket,
          changeAmount,
          leftoverArray,
          newCartRuleCode,
        }) => {
          setTicketOrderId(orderId);
          setGiftTicketTM(giftTicket);
          setChangeAmountTM(changeAmount);
          setTicketModalOpen(true);
          setPrintOnOpen(print);
          if (newCartRuleCode) {
            setNewCartRuleCode(newCartRuleCode);
          }
          setLeftoverInfo(leftoverArray);
          setCartItems([]);
          const storedShop = JSON.parse(localStorage.getItem('shop'));
          if (storedShop) {
            localStorage.removeItem(`cart_shop_${storedShop.id_shop}`);
          }
          setSelectedMethods([]);
          setAmounts({ efectivo: '', tarjeta: '', bizum: '' });
          setChangeAmount(0);
          setGiftTicket(false);
          setFinalSaleModalOpen(false);
          clearDiscounts();
        },
        onError: () => {
          alert('Error al finalizar la venta. Intenta nuevamente.');
        },
      },
      true
    );
  };

  const handleCloseTicketNormal = async () => {
    setTicketModalOpen(false);
    if (Math.max(0, total) === 0) {
      const voucherAmount = Math.abs(subtotalProducts - totalDiscounts);
      try {
        const voucherResult = await createCartRuleWithResponse({
          discountType: 'amount',
          value: voucherAmount,
        }, null, null, null, null);
        console.log('Vale generado tras cerrar ticket normal:', voucherResult);
        if (voucherResult && voucherResult.code) {
          setNewCartRuleCode(voucherResult.code);
          setCartRuleModalOpen(true);
        }
      } catch (err) {
        console.error('Error al crear vale tras cerrar ticket:', err);
      }
    }
  };

  const totalEntered = Object.values(amounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const handleDescuentoClick = () => {
    if (idProfile === 1) {
      setIsDiscountModalOpen(true);
    } else {
      setIsPinModalOpen(true);
    }
  };
  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    setIsDiscountModalOpen(true);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col relative">
      <div className="mb-4 flex items-center justify-between">
        <div className="bg-orange-500 text-white px-3 py-1 rounded-full">
          {totalItems}
        </div>
        <div className="flex space-x-2">
          <button
            className="bg-yellow-500 text-white p-2 rounded"
            onClick={() => setIsParkedCartsModalOpen(true)}
          >
            Tickets Aparcados
          </button>
          <button className="bg-gray-200 p-2 rounded" onClick={handleParkCart}>
            Guardar Ticket
          </button>
          <button className="bg-gray-200 p-2 rounded" onClick={handleClearCart}>
            Borrar Ticket
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-grow overflow-auto">
        <h4 className="font-bold text-lg mb-2">Productos en el Ticket</h4>
        {cartItems.length > 0 ? (
          <ul className="space-y-2">
            {cartItems.map((item) => {
              const totalItem = item.final_price_incl_tax * item.quantity;
              return (
                <li
                  key={item.id_stock_available}
                  className="p-2 border rounded flex flex-col md:flex-row md:justify-between md:items-center"
                >
                  <div>
                    <span className="font-bold">{item.quantity}x </span>
                    {item.product_name} {item.combination_name}
                  </div>
                  <div className="text-right md:text-left md:w-32">
                    <div>P/U: {item.final_price_incl_tax.toFixed(2)} €</div>
                    <div className="font-semibold">
                      Total: {totalItem.toFixed(2)} €
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0 flex space-x-2">
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

      {appliedDiscounts.length > 0 && (
        <div className="mt-4 bg-green-50 p-3 rounded">
          <h4 className="font-bold text-lg mb-2">Descuentos Aplicados</h4>
          <ul className="space-y-2">
            {appliedDiscounts.map((disc, index) => {
              const label = disc.reduction_percent > 0
                ? `${disc.reduction_percent}%`
                : `${disc.reduction_amount?.toFixed(2) || '0.00'} €`;
              return (
                <li
                  key={index}
                  className="p-2 border rounded flex flex-col md:flex-row md:justify-between md:items-center"
                >
                  <div>
                    <div className="font-bold">
                      {disc.name || disc.code}
                    </div>
                    {disc.code && disc.name && (
                      <div className="text-xs text-gray-600">({disc.code})</div>
                    )}
                  </div>
                  <div className="text-right md:text-left md:w-32 font-semibold">
                    {label}
                  </div>
                  <div className="mt-2 md:mt-0 flex space-x-2">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => removeDiscountByIndex(index)}
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-xl font-medium">Subtotal Productos:</span>
          <span className="text-xl font-bold">{subtotalProducts.toFixed(2)} €</span>
        </div>
        {appliedDiscounts.length > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-xl font-medium">Total Descuentos:</span>
            <span className="text-xl font-bold text-red-600">
              {totalDiscounts.toFixed(2)} €
            </span>
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <span className="text-2xl font-bold">TOTAL:</span>
          <span className="text-2xl font-extrabold">
            {Math.max(0, total).toFixed(2)} €
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col space-y-2">
        <div className="flex justify-between space-x-2">
          <button
            className="bg-gray-300 text-black px-2 py-2 rounded w-1/2"
            onClick={() => setIsReturnsModalOpen(true)}
          >
            Devoluciones
          </button>
          <button
            className="bg-gray-300 text-black px-2 py-2 rounded w-1/2"
            onClick={() => setIsReprintModalOpen(true)}
          >
            Reimprimir
          </button>
        </div>
        <div className="flex justify-between space-x-2">
          <button
            className="bg-green-500 text-white px-2 py-2 rounded w-1/2"
            onClick={() => alert('Añadir Manualmente')}
          >
            Añadir Manual
          </button>
          <button
            className="bg-purple-500 text-white px-2 py-2 rounded w-1/2"
            onClick={handleDescuentoClick}
          >
            Descuento
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          className={`px-6 py-3 rounded text-lg font-bold ${
            cartItems.length === 0 || isLoading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={cartItems.length === 0 || isLoading}
          onClick={handleFinalSale}
        >
          {isLoading ? 'Procesando...' : 'Finalizar Venta'}
        </button>
      </div>

      <ParkedCartsModal
        isOpen={isParkedCartsModalOpen}
        onClose={() => setIsParkedCartsModalOpen(false)}
        parkedCarts={parkedCarts}
        onLoadCart={handleLoadCart}
        onDeleteCart={handleDeleteCart}
      />

      <Modal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        title="Guardar Ticket Aparcado"
        showCloseButton
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
            <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={() => setIsNameModalOpen(false)}>
              Cancelar
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleSaveParkedCart}>
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      <ReturnsExchangesModal
        isOpen={isReturnsModalOpen}
        onClose={() => setIsReturnsModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

      <ReprintModal
        isOpen={isReprintModalOpen}
        size="lg"
        height="tall"
        onClose={() => setIsReprintModalOpen(false)}
      />

      <PinValidationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        onDiscountApplied={(discObj) => {
          addDiscount(discObj);
          setIsDiscountModalOpen(false);
        }}
      />

      <Modal
        isOpen={isFinalSaleModalOpen}
        onClose={handleCloseModal}
        title="Finalizar Venta"
        showCloseButton
        size="lg"
        height="tall"
      >
        <div className="p-6">
          <div className="mb-4 border-b pb-4">
            <div className="flex justify-between">
              <span className="text-lg">Subtotal Productos:</span>
              <span className="text-lg font-semibold">
                {subtotalProducts.toFixed(2)} €
              </span>
            </div>
            {appliedDiscounts.length > 0 && (
              <div className="flex justify-between mt-2">
                <span className="text-lg">Descuentos:</span>
                <span className="text-lg font-semibold text-red-600">
                  -{totalDiscounts.toFixed(2)} €
                </span>
              </div>
            )}
            {leftoverPreview?.length > 0 && (
              <div className="mt-2">
                {leftoverPreview.map((left, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Importe restante del vale {left.code}:
                    </span>
                    <span className="text-sm text-gray-800 font-semibold">
                      {left.leftover.toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-2">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-xl font-extrabold">
                {Math.max(0, total).toFixed(2)} €
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-3xl font-bold">
              Importe Total: {Math.max(0, total).toFixed(2)} €
            </h3>
            <p className="text-2xl font-bold">
              Cambio: {changeAmount.toFixed(2)} €
            </p>
          </div>

          {/* Mostrar mensaje de vale descuento si total es 0 */}
          {Math.max(0, total) === 0 && (
            <div className="text-red-600 font-bold mb-4">
              Se generará un vale descuento de {Math.abs(subtotalProducts - totalDiscounts).toFixed(2)} €.
            </div>
          )}

          {/* Métodos de pago - deshabilitar si total es 0 */}
          <div className="flex flex-col space-y-4 mb-4">
            {['efectivo', 'tarjeta', 'bizum'].map((method) => (
              <div key={method} className="flex items-center space-x-4">
                <button
                  className={`w-1/3 py-4 rounded ${
                    selectedMethods.includes(method) && total > 0
                      ? method === 'efectivo'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                      : 'bg-gray-400'
                  } text-white`}
                  onClick={() => total > 0 && togglePaymentMethod(method)}
                  disabled={total <= 0}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
                <input
                  className="border rounded w-2/3 p-3"
                  type="number"
                  placeholder={`Importe en ${method}`}
                  value={amounts[method]}
                  onChange={(e) => handleAmountChange(method, e.target.value)}
                  disabled={!selectedMethods.includes(method) || total <= 0}
                />
              </div>
            ))}
          </div>

          {/* Botón Confirmar Venta */}
          <button
            className={`w-full py-4 px-4 py-2 rounded text-white ${
              (totalEntered < total) || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600'
            }`}
            disabled={(totalEntered < total) || isLoading}
            onClick={handleConfirmSale}
          >
            {isLoading ? 'Procesando...' : 'Confirmar Venta'}
          </button>
        </div>
      </Modal>

      {ticketModalOpen && ticketOrderId && (
        <TicketViewModal
          isOpen={ticketModalOpen}
          onClose={handleCloseTicketNormal}
          mode="ticket"
          orderId={ticketOrderId}
          printOnOpen={printOnOpen}
          giftTicket={giftTicketTM}
          changeAmount={changeAmountTM}
          showCloseButton
          size="lg"
          height="tall"
        />
      )}
      {cartRuleModalOpen && newCartRuleCode && (
        <TicketViewModal
          isOpen={cartRuleModalOpen}
          onClose={() => setCartRuleModalOpen(false)}
          mode="cart_rule"
          cartRuleCode={newCartRuleCode}
          printOnOpen
          showCloseButton
          size="lg"
          height="tall"
        />
      )}
    </div>
  );
}

export default SalesCard;