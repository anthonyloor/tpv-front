// src/components/Sales/SalesCardActions.jsx

import React, { useState, useContext } from 'react';
import ReturnsExchangesModal from '../modals/returns/ReturnsExchangesModal';
import ReprintModal from '../modals/reprint/ReprintModal';
import PinValidationModal from '../modals/pin/PinValidationModal';
import DiscountModal from '../modals/discount/DiscountModal';
import TicketViewModal from '../modals/ticket/TicketViewModal';
import Modal from '../modals/Modal';
import useFinalizeSale from '../../hooks/useFinalizeSale';
import { AuthContext } from '../../contexts/AuthContext';

// Función auxiliar para simular cómo se "consume" el importe de un vale
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

  return { leftoverArray, finalTotal: remaining, totalDiscounts };
}

const SalesCardActions = ({
  cartItems,
  setCartItems,
  appliedDiscounts,
  addDiscount,
  removeDiscountByIndex,
  clearDiscounts,
  handleAddProduct, // por si lo necesitas para devoluciones
}) => {
  const { idProfile } = useContext(AuthContext);
  const { isLoading, finalizeSale } = useFinalizeSale();

  // MODALS
  const [isReturnsModalOpen, setIsReturnsModalOpen] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isFinalSaleModalOpen, setFinalSaleModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketOrderId, setTicketOrderId] = useState(null);
  const [printOnOpen, setPrintOnOpen] = useState(false);
  const [giftTicket, setGiftTicket] = useState(false);
  const [giftTicketTM, setGiftTicketTM] = useState(false);
  const [cartRuleModalOpen, setCartRuleModalOpen] = useState(false);
  const [newCartRuleCode, setNewCartRuleCode] = useState(null);

  // Pago
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({ efectivo: '', tarjeta: '', bizum: '' });
  const [changeAmount, setChangeAmount] = useState(0);

  // Para leftover info, si te hace falta
  const [leftoverPreview, setLeftoverPreview] = useState([]);
  const [leftoverInfo, setLeftoverInfo] = useState([]);
  
  // Calcular subtotal y descuentos
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

  // Manejadores para modals
  const openReturnsModal = () => setIsReturnsModalOpen(true);
  const closeReturnsModal = () => setIsReturnsModalOpen(false);

  const openReprintModal = () => setIsReprintModalOpen(true);
  const closeReprintModal = () => setIsReprintModalOpen(false);

  const handleAddManual = () => {
    // tu lógica de "añadir manual"...
    console.log('[AddManual] Clic en añadir manual');
  };

  // Pin + Descuento
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

  // Al pulsar "Finalizar Venta" (abre el modal de cobro)
  const handleFinalSale = () => {
    if (cartItems.length === 0) return;

    // Previsualizamos leftover con "simulateDiscountConsumption"
    const { leftoverArray } = simulateDiscountConsumption(cartItems, appliedDiscounts);
    setLeftoverPreview(leftoverArray);

    // Logs de estado
    console.log('[handleFinalSale] Subtotal:', subtotalProducts);
    console.log('[handleFinalSale] totalDiscounts:', totalDiscounts);
    console.log('[handleFinalSale] total final (Max(0, total)):', Math.max(0, total));

    setFinalSaleModalOpen(true);
  };
  const handleCloseFinalSaleModal = () => {
    setFinalSaleModalOpen(false);
  };

  // Confirma la venta => useFinalizeSale
  const handleConfirmSale = () => {
    console.log('=== handleConfirmSale ===');
    console.log('cartItems:', cartItems);
    console.log('appliedDiscounts:', appliedDiscounts);
    console.log('selectedMethods:', selectedMethods);
    console.log('amounts:', amounts);
    console.log('changeAmount:', changeAmount);
    console.log('giftTicket:', giftTicket);
    console.log('final total =>', total);

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
          setChangeAmount(changeAmount);
          setTicketModalOpen(true);
          setPrintOnOpen(print);

          if (newCartRuleCode) {
            setNewCartRuleCode(newCartRuleCode);
          }
          setLeftoverInfo(leftoverArray);

          // Limpia el carrito y descuentos
          setCartItems([]);
          clearDiscounts();
          localStorage.removeItem('selectedAddress');
          localStorage.removeItem('selectedClient');

          // Limpia métodos de pago
          setSelectedMethods([]);
          setAmounts({ efectivo: '', tarjeta: '', bizum: '' });
          setChangeAmount(0);
          setGiftTicket(false);
          setFinalSaleModalOpen(false);
        },
        onError: () => {
          alert('Error al finalizar la venta. Intenta nuevamente.');
        },
      },
      true
    );
  };

  // Al cerrar el ticket normal => si total=0 => generar vale (opcional)
  const handleCloseTicketNormal = async () => {
    setTicketModalOpen(false);
    if (newCartRuleCode) {
      setCartRuleModalOpen(true);
    }
  };

  // Métodos de pago
  const totalEntered = Object.values(amounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const togglePaymentMethod = (method) => {
    // Si ya está seleccionado -> lo deseleccionamos y ponemos a '' su importe
    if (selectedMethods.includes(method)) {
      const updated = { ...amounts, [method]: '' };
      setSelectedMethods((prev) => prev.filter((m) => m !== method));
      setAmounts(updated);
      updateChangeAmount(updated);
    } else {
      // Lo activamos. Si tarjeta o bizum -> sugerir resto
      setSelectedMethods((prev) => [...prev, method]);
      if (method === 'tarjeta' || method === 'bizum') {
        const remain = Math.max(0, total) - totalEntered;
        const newVal = remain > 0 ? remain.toFixed(2) : '';
        const updated = { ...amounts, [method]: newVal };
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
    // Vamos a recalcular el cambio sobre el total final (>=0)
    const finalTotal = Math.max(0, total);
    const totalEnteredAmount = Object.values(updatedAmounts).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
    const newChange = totalEnteredAmount - finalTotal;

    // Logs
    console.log('[updateChangeAmount]');
    console.log('   finalTotal:', finalTotal);
    console.log('   totalEnteredAmount:', totalEnteredAmount);
    console.log('   newChange:', newChange);

    setChangeAmount(newChange);
  };

  // Cerrar ticket (vale cart rule)
  const closeCartRuleModal = () => {
    setCartRuleModalOpen(false);
  };

  return (
    <div className="p-4">

      {/* --- Botones 1era fila: Devolución / Reimprimir --- */}
      <div className="flex justify-between space-x-2 mb-2">
        <button
          className="bg-gray-300 text-black px-2 py-2 rounded w-1/2"
          onClick={openReturnsModal}
        >
          Devoluciones
        </button>
        <button
          className="bg-gray-300 text-black px-2 py-2 rounded w-1/2"
          onClick={openReprintModal}
        >
          Reimprimir
        </button>
      </div>

      {/* --- Botones 2da fila: Añadir Manual / Descuento --- */}
      <div className="flex justify-between space-x-2 mb-2">
        <button
          className="bg-green-500 text-white px-2 py-2 rounded w-1/2"
          onClick={handleAddManual}
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

      {/* --- Botón "Finalizar Venta" --- */}
      <div className="flex justify-end">
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

      {/* --- Modals varios --- */}
      <ReturnsExchangesModal
        isOpen={isReturnsModalOpen}
        onClose={closeReturnsModal}
        onAddProduct={handleAddProduct}
      />

      <ReprintModal
        isOpen={isReprintModalOpen}
        size="lg"
        height="tall"
        onClose={closeReprintModal}
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

      {/* --- MODAL DE COBRO (Final Sale) --- */}
      <Modal
        isOpen={isFinalSaleModalOpen}
        onClose={handleCloseFinalSaleModal}
        title="Finalizar Venta"
        showCloseButton
        size="lg"
        height="tall"
      >
        <div className="p-6">
          {/* Resumen Subtotal / Descuentos / Total */}
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
              <span className="text-xl font-bold">TOTAL:</span>
              <span className="text-xl font-extrabold">
                {Math.max(0, total).toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Display para ver importes y cambio */}
          <div className="mb-4">
            <h3 className="text-3xl font-bold">
              Importe a Pagar: {Math.max(0, total).toFixed(2)} €
            </h3>
            <p className="text-2xl font-bold mt-2">
              Cambio: {changeAmount.toFixed(2)} €
            </p>
          </div>

          {Math.max(0, total) === 0 && (
            <div className="text-red-600 font-bold mb-4">
              Se generará un vale descuento de {Math.abs(subtotalProducts - totalDiscounts).toFixed(2)} €.
            </div>
          )}

          {/* Métodos de pago */}
          <div className="flex flex-col space-y-4 mb-4">
            {['efectivo', 'tarjeta', 'bizum'].map((method) => (
              <div key={method} className="flex items-center space-x-4">
                <button
                  className={`w-1/3 py-4 rounded text-white ${
                    selectedMethods.includes(method) && total > 0
                      ? method === 'efectivo'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                      : 'bg-gray-400'
                  }`}
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

          {/* Botón Confirmar */}
          {/*
            - Deshabilitado si isLoading = true
            - Deshabilitado si totalEntered < total (cuando total>0)
            (Si total <=0, se habilita siempre)
          */}
          <button
            className={`w-full py-4 rounded text-white text-lg font-bold ${
              (Math.max(0, total) > 0 && totalEntered < Math.max(0, total)) || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={
              (Math.max(0, total) > 0 && totalEntered < Math.max(0, total)) ||
              isLoading
            }
            onClick={handleConfirmSale}
          >
            {isLoading ? 'Procesando...' : 'Confirmar Venta'}
          </button>
        </div>
      </Modal>

      {/* TicketViewModal => imprime ticket normal */}
      {ticketModalOpen && ticketOrderId && (
        <TicketViewModal
          isOpen={ticketModalOpen}
          onClose={handleCloseTicketNormal}
          mode="ticket"
          orderId={ticketOrderId}
          printOnOpen={printOnOpen}
          giftTicket={giftTicketTM}
          changeAmount={changeAmount}
          showCloseButton
          size="lg"
          height="tall"
        />
      )}

      {/* Si generamos vale (cart rule) al cerrar ticket normal */}
      {cartRuleModalOpen && newCartRuleCode && (
        <TicketViewModal
          isOpen={cartRuleModalOpen}
          onClose={closeCartRuleModal}
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
};

export default SalesCardActions;