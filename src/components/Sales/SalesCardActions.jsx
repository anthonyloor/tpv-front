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
import { useCartRuleCreator } from '../../hooks/useCartRuleCreator';

// (Opcional) la función simulateDiscountConsumption, si no la tienes separada en un util
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

/**
 * SalesCardActions
 * - Renderiza los botones: Devoluciones, Reimprimir, Añadir Manual, Descuento, Finalizar Venta
 * - Controla los modals correspondientes
 * - Se apoya en useFinalizeSale para finalizar la venta
 */
const SalesCardActions = ({
  cartItems,
  setCartItems,
  appliedDiscounts,
  addDiscount,
  removeDiscountByIndex,
  clearDiscounts,
  handleAddProduct, // por si lo necesitas en la devolución
}) => {
  const { idProfile } = useContext(AuthContext);
  const { isLoading, finalizeSale } = useFinalizeSale();
  const { createCartRuleWithResponse } = useCartRuleCreator();

  // Estados para modals
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

  // Cálculo de subtotal y descuentos
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

  // Manejo de modals -> Devoluciones
  const openReturnsModal = () => setIsReturnsModalOpen(true);
  const closeReturnsModal = () => setIsReturnsModalOpen(false);

  // Manejo de modals -> Reimprimir
  const openReprintModal = () => setIsReprintModalOpen(true);
  const closeReprintModal = () => setIsReprintModalOpen(false);

  // Añadir Manual
  const handleAddManual = () => {
    alert('Añadir Manualmente');
    // O tu lógica correspondiente
  };

  // Pin + Descuento
  const handleDescuentoClick = () => {
    // Si el perfil es admin (idProfile===1), abre el DiscountModal directamente;
    // sino abre PinValidationModal y si la pin es correcta => DiscountModal
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

  // Final Sale
  const handleFinalSale = () => {
    if (cartItems.length === 0) return;

    // Calcula leftoverPreview, etc.
    const { leftoverArray } = simulateDiscountConsumption(cartItems, appliedDiscounts);
    setLeftoverPreview(leftoverArray);
    setFinalSaleModalOpen(true);
  };
  const handleCloseFinalSaleModal = () => {
    setFinalSaleModalOpen(false);
  };

  // Confirmar la venta => useFinalizeSale
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
          setChangeAmount(changeAmount);
          setTicketModalOpen(true);
          setPrintOnOpen(print);

          if (newCartRuleCode) {
            setNewCartRuleCode(newCartRuleCode);
          }
          setLeftoverInfo(leftoverArray);

          // Limpia el carrito
          setCartItems([]);
          localStorage.removeItem('selectedAddress');
          localStorage.removeItem('selectedClient');
          // O las keys que tú uses

          // Limpia métodos de pago
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

  // Cerrar ticket normal => si total=0 => generar vale
  const handleCloseTicketNormal = async () => {
    setTicketModalOpen(false);

    if (Math.max(0, total) === 0) {
      const voucherAmount = Math.abs(subtotalProducts - totalDiscounts);
      try {
        const voucherResult = await createCartRuleWithResponse(
          { discountType: 'amount', value: voucherAmount },
          null,
          null,
          null,
          null
        );
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

  // Métodos de pago
  const totalEntered = Object.values(amounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const togglePaymentMethod = (method) => {
    if (selectedMethods.includes(method)) {
      const updatedAmounts = { ...amounts, [method]: '' };
      setSelectedMethods((prev) => prev.filter((m) => m !== method));
      setAmounts(updatedAmounts);
      updateChangeAmount(updatedAmounts);
    } else {
      setSelectedMethods((prev) => [...prev, method]);
      if (method === 'tarjeta' || method === 'bizum') {
        const remain =
          total - totalEntered > 0 ? (total - totalEntered).toFixed(2) : '';
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

  return (
    <div className="p-4">
      {/* Fila de botones: Devoluciones, Reimprimir */}
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

      {/* Fila de botones: Añadir Manual, Descuento */}
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

      {/* Botón Finalizar Venta */}
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

      {/* MODALS */}
      {/* ReturnsExchangesModal */}
      <ReturnsExchangesModal
        isOpen={isReturnsModalOpen}
        onClose={closeReturnsModal}
        onAddProduct={handleAddProduct}
      />

      {/* ReprintModal */}
      <ReprintModal
        isOpen={isReprintModalOpen}
        size="lg"
        height="tall"
        onClose={closeReprintModal}
      />

      {/* PinValidationModal para descuentos */}
      <PinValidationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />

      {/* DiscountModal */}
      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        onDiscountApplied={(discObj) => {
          addDiscount(discObj);
          setIsDiscountModalOpen(false);
        }}
      />

      {/* Modal de Final Sale (cobro) */}
      <Modal
        isOpen={isFinalSaleModalOpen}
        onClose={handleCloseFinalSaleModal}
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

          {Math.max(0, total) === 0 && (
            <div className="text-red-600 font-bold mb-4">
              Se generará un vale descuento de{' '}
              {Math.abs(subtotalProducts - totalDiscounts).toFixed(2)} €.
            </div>
          )}

          {/* Métodos de pago */}
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

      {/* TicketViewModal => muestra el ticket impreso */}
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
      {/* Si generamos vale al final (cart rule) */}
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
};

export default SalesCardActions;