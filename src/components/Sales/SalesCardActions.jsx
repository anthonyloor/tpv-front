// src/components/Sales/SalesCardActions.jsx

import React, { useState, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import ReturnsExchangesModal from "../modals/returns/ReturnsExchangesModal";
import ReprintModal from "../modals/reprint/ReprintModal";
import PinValidationModal from "../modals/pin/PinValidationModal";
import DiscountModal from "../modals/discount/DiscountModal";
import TicketViewModal from "../modals/ticket/TicketViewModal";
import useFinalizeSale from "../../hooks/useFinalizeSale";
import { AuthContext } from "../../contexts/AuthContext";

// Función auxiliar: simula consumo de importe de un vale
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
      leftoverArray.push({ code: disc.code, leftover: leftoverValue });
    }
  });

  return { leftoverArray, finalTotal: remaining, totalDiscounts };
}

function SalesCardActions({
  cartItems,
  setCartItems,
  appliedDiscounts,
  addDiscount,
  removeDiscountByIndex,
  clearDiscounts,
  handleAddProduct,
}) {
  const { idProfile } = useContext(AuthContext);
  const { isLoading, finalizeSale } = useFinalizeSale();

  // Modales
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

  // Métodos de pago
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({
    efectivo: "",
    tarjeta: "",
    bizum: "",
  });
  const [changeAmount, setChangeAmount] = useState(0);

  // Vale leftover
  const [leftoverPreview, setLeftoverPreview] = useState([]);
  const [leftoverInfo, setLeftoverInfo] = useState([]);

  // Cálculo de totales
  const subtotalProducts = cartItems.reduce(
    (sum, item) => sum + item.final_price_incl_tax * item.quantity,
    0
  );

  const isRectification = cartItems.some(
    (item) => item.reference_combination === "rectificacion"
  );

  const totalDiscounts = appliedDiscounts.reduce((sum, disc) => {
    const redPercent = disc.reduction_percent || 0;
    const redAmount = disc.reduction_amount || 0;
    const discountAmount = redPercent
      ? subtotalProducts * (redPercent / 100)
      : redAmount;
    return sum + discountAmount;
  }, 0);
  // total puede ser negativo
  const total = subtotalProducts - totalDiscounts;

  // Abrir/Cerrar modales
  const openReturnsModal = () => setIsReturnsModalOpen(true);
  const closeReturnsModal = () => setIsReturnsModalOpen(false);
  const openReprintModal = () => setIsReprintModalOpen(true);
  const closeReprintModal = () => setIsReprintModalOpen(false);
  const handleAddManual = () =>
    console.log("[AddManual] Clic en añadir manual");

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

  const handleFinalSale = () => {
    if (cartItems.length === 0) return;
    const { leftoverArray } = simulateDiscountConsumption(
      cartItems,
      appliedDiscounts
    );
    setLeftoverPreview(leftoverArray);
    console.log("[handleFinalSale] Subtotal:", subtotalProducts);
    console.log("[handleFinalSale] totalDiscounts:", totalDiscounts);
    console.log("[handleFinalSale] total final:", Math.max(0, total));
    setFinalSaleModalOpen(true);
  };

  const handleCloseFinalSaleModal = () => setFinalSaleModalOpen(false);

  const handleConfirmSale = () => {
    console.log("=== handleConfirmSale ===");
    console.log("cartItems:", cartItems);
    console.log("appliedDiscounts:", appliedDiscounts);
    console.log("selectedMethods:", selectedMethods);
    console.log("amounts:", amounts);
    console.log("changeAmount:", changeAmount);
    console.log("giftTicket:", giftTicket);
    console.log("final total =>", total);

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
          // Guardar estado
          setTicketOrderId(orderId);
          setGiftTicketTM(giftTicket);
          setChangeAmount(changeAmount);
          setTicketModalOpen(true);
          setPrintOnOpen(print);

          // Nuevo cart rule
          if (newCartRuleCode) setNewCartRuleCode(newCartRuleCode);
          setLeftoverInfo(leftoverArray);

          // Limpiar carrito y descuentos
          setCartItems([]);
          clearDiscounts();
          localStorage.removeItem("selectedAddress");
          localStorage.removeItem("selectedClient");

          setSelectedMethods([]);
          setAmounts({ efectivo: "", tarjeta: "", bizum: "" });
          setChangeAmount(0);
          setGiftTicket(false);
          setFinalSaleModalOpen(false);
        },
        onError: () => {
          alert("Error al finalizar la venta.");
        },
      },
      true
    );
  };

  const handleCloseTicketNormal = () => {
    setTicketModalOpen(false);
    if (newCartRuleCode) {
      setCartRuleModalOpen(true);
    }
  };
  const closeCartRuleModal = () => setCartRuleModalOpen(false);

  // Cantidad total introducida en los métodos de pago
  const totalEntered = Object.values(amounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  // Toggle de métodos
  const togglePaymentMethod = (method) => {
    if (selectedMethods.includes(method)) {
      // Quitar
      const updated = { ...amounts, [method]: "" };
      setSelectedMethods((prev) => prev.filter((m) => m !== method));
      setAmounts(updated);
      updateChangeAmount(updated);
    } else {
      // Agregar
      setSelectedMethods((prev) => [...prev, method]);
      // Si es rectificación, el importe se establece negativo
      if (method === "tarjeta" || method === "bizum" || method === "efectivo") {
        const remain = isRectification
          ? Math.abs(total)
          : Math.max(0, total) - totalEntered;
        const newVal =
          remain > 0
            ? isRectification
              ? (-remain).toFixed(2)
              : remain.toFixed(2)
            : "";
        const updated = { ...amounts, [method]: newVal };
        setAmounts(updated);
        updateChangeAmount(updated);
      }
    }
  };

  const handleAmountChange = (method, amount) => {
    const parsed = parseFloat(amount) || 0;
    const value = isRectification ? -Math.abs(parsed) : parsed;
    const updated = { ...amounts, [method]: value.toString() };
    setAmounts(updated);
    updateChangeAmount(updated);
  };

  const updateChangeAmount = (updatedAmounts) => {
    const finalTotal = Math.max(0, total);
    const totalEnteredAmount = Object.values(updatedAmounts).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
    const newChange = totalEnteredAmount - finalTotal;
    console.log(
      "[updateChangeAmount]",
      finalTotal,
      totalEnteredAmount,
      newChange
    );
    setChangeAmount(newChange);
  };

  // Mostrar mensaje de vale descuento si total es negativo y sin métodos de pago seleccionados
  // Voucher se genera solo si total < 0 y no se selecciona ningún método
  const voucherMessage =
    total < 0 && selectedMethods.length === 0
      ? `Se va a generar un vale descuento de ${Math.abs(total).toFixed(2)} €`
      : "";

  return (
    <div
      className="flex flex-col h-full p-3"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      {/* Columna Izquierda: 2 filas de 2 botones */}
      <div className="space-y-2">
        {/* 1) Devoluciones y Reimprimir */}
        <div className="flex gap-2">
          <Button
            label="Pedidos Online"
            icon="pi pi-shopping-cart"
            className="flex-1"
            onClick={() => {
              /* Aún sin acción */
            }}
          />
          <Button
            label="Devoluciones"
            icon="pi pi-undo"
            className="flex-1"
            onClick={openReturnsModal}
          />
          <Button
            label="Reimprimir"
            icon="pi pi-print"
            className="flex-1"
            onClick={openReprintModal}
          />
        </div>

        {/* 2) Añadir Manual y Descuento */}
        <div className="flex gap-2">
          <Button
            label="Añadir Manual"
            icon="pi pi-plus"
            className="flex-1"
            onClick={handleAddManual}
          />
          <Button
            label="Descuento"
            icon="pi pi-percentage"
            className="flex-1"
            onClick={handleDescuentoClick}
          />
        </div>
      </div>

      {/* Columna Derecha: Botón Finalizar Venta */}
      <div className="mt-auto">
        <Button
          label={isLoading ? "Procesando..." : "Finalizar Venta"}
          icon="pi pi-check"
          className="p-button-primary w-full"
          style={{ fontSize: "1.5rem", padding: "1.25rem" }}
          disabled={cartItems.length === 0 || isLoading}
          onClick={handleFinalSale}
        />
      </div>

      {/* Dialog: Finalizar Venta */}
      <Dialog
        header="Finalizar Venta"
        visible={isFinalSaleModalOpen}
        onHide={handleCloseFinalSaleModal}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "70vw", minHeight: "70vh" }}
      >
        <div
          className="p-6 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--surface-0)",
            color: "var(--text-color)",
          }}
        >
          {/* Resumen de Totales */}
          <div
            className="border-b pb-4"
            style={{ borderColor: "var(--surface-border)" }}
          >
            <div className="flex justify-between">
              <span className="text-base">Subtotal Productos:</span>
              <span className="text-base font-bold">
                {subtotalProducts.toFixed(2)} €
              </span>
            </div>
            {appliedDiscounts.length > 0 && (
              <div className="flex justify-between mt-2">
                <span className="text-base">Descuentos:</span>
                <span
                  className="text-base font-bold"
                  style={{ color: "var(--red-500)" }}
                >
                  -{totalDiscounts.toFixed(2)} €
                </span>
              </div>
            )}
            <div className="flex justify-between mt-2">
              <span className="text-2xl font-bold">TOTAL:</span>
              <span className="text-2xl font-extrabold">
                {Math.max(0, total).toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="flex flex-col gap-4">
            {["efectivo", "tarjeta", "bizum"].map((method) => (
              <div key={method} className="flex items-center gap-2">
                <Button
                  label={method.charAt(0).toUpperCase() + method.slice(1)}
                  severity={
                    selectedMethods.includes(method)
                      ? method === "efectivo"
                        ? "success"
                        : "primary"
                      : "secondary"
                  }
                  className="flex-1"
                  onClick={() => togglePaymentMethod(method)}
                  // Permitir selección si total > 0 o si es rectificación
                  disabled={total === 0 ? true : false}
                />
                <input
                  type="number"
                  placeholder={`Importe en ${method}`}
                  value={amounts[method]}
                  onChange={(e) => handleAmountChange(method, e.target.value)}
                  disabled={!selectedMethods.includes(method)}
                  className="flex-1 p-2 border rounded"
                  style={{
                    borderColor: "var(--surface-border)",
                    backgroundColor: "var(--surface-50)",
                    color: "var(--text-color)",
                  }}
                />
              </div>
            ))}
          </div>
          {/* Mostrar mensaje de vale descuento si corresponde */}
          {voucherMessage && (
            <div className="mt-2 text-red-500 font-bold">{voucherMessage}</div>
          )}
          <Button
            label={isLoading ? "Procesando..." : "Confirmar Venta"}
            className="p-button-success mt-3"
            style={{ padding: "1rem", fontSize: "1.125rem" }}
            disabled={
              (Math.max(0, total) > 0 && totalEntered < Math.max(0, total)) ||
              isLoading
            }
            onClick={handleConfirmSale}
          />
        </div>
      </Dialog>

      {/* TicketViewModal para ticket normal */}
      {ticketOrderId && (
        <TicketViewModal
          isOpen={ticketModalOpen}
          onClose={handleCloseTicketNormal}
          mode="ticket"
          orderId={ticketOrderId}
          printOnOpen={printOnOpen}
          giftTicket={giftTicketTM}
          changeAmount={changeAmount}
          showCloseButton
        />
      )}

      {/* TicketViewModal para cart rule */}
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

      {/* Modales varios */}
      <ReturnsExchangesModal
        isOpen={isReturnsModalOpen}
        onClose={closeReturnsModal}
        onAddProduct={handleAddProduct}
      />
      <ReprintModal isOpen={isReprintModalOpen} onClose={closeReprintModal} />
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
    </div>
  );
}

export default SalesCardActions;
