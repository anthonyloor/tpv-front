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

// Función auxiliar para simular el consumo de importe de un vale
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

const SalesCardActions = ({
  cartItems,
  setCartItems,
  appliedDiscounts,
  addDiscount,
  removeDiscountByIndex,
  clearDiscounts,
  handleAddProduct,
}) => {
  const { idProfile } = useContext(AuthContext);
  const { isLoading, finalizeSale } = useFinalizeSale();

  // Estados para la visualización de modales
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

  // Estados de pago
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({ efectivo: "", tarjeta: "", bizum: "" });
  const [changeAmount, setChangeAmount] = useState(0);

  // Para previsualización de "leftover"
  const [leftoverPreview, setLeftoverPreview] = useState([]);
  const [leftoverInfo, setLeftoverInfo] = useState([]);

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

  // Handlers para abrir y cerrar modales
  const openReturnsModal = () => setIsReturnsModalOpen(true);
  const closeReturnsModal = () => setIsReturnsModalOpen(false);
  const openReprintModal = () => setIsReprintModalOpen(true);
  const closeReprintModal = () => setIsReprintModalOpen(false);
  const handleAddManual = () => console.log("[AddManual] Clic en añadir manual");

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
    const { leftoverArray } = simulateDiscountConsumption(cartItems, appliedDiscounts);
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
          setTicketOrderId(orderId);
          setGiftTicketTM(giftTicket);
          setChangeAmount(changeAmount);
          setTicketModalOpen(true);
          setPrintOnOpen(print);

          if (newCartRuleCode) {
            setNewCartRuleCode(newCartRuleCode);
          }
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
          alert("Error al finalizar la venta. Inténtalo de nuevo.");
        },
      },
      true
    );
  };

  const handleCloseTicketNormal = async () => {
    setTicketModalOpen(false);
    if (newCartRuleCode) {
      setCartRuleModalOpen(true);
    }
  };

  const totalEntered = Object.values(amounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const togglePaymentMethod = (method) => {
    if (selectedMethods.includes(method)) {
      const updated = { ...amounts, [method]: "" };
      setSelectedMethods((prev) => prev.filter((m) => m !== method));
      setAmounts(updated);
      updateChangeAmount(updated);
    } else {
      setSelectedMethods((prev) => [...prev, method]);
      if (method === "tarjeta" || method === "bizum") {
        const remain = Math.max(0, total) - totalEntered;
        const newVal = remain > 0 ? remain.toFixed(2) : "";
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
    const finalTotal = Math.max(0, total);
    const totalEnteredAmount = Object.values(updatedAmounts).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
    const newChange = totalEnteredAmount - finalTotal;
    console.log("[updateChangeAmount]", finalTotal, totalEnteredAmount, newChange);
    setChangeAmount(newChange);
  };

  const closeCartRuleModal = () => setCartRuleModalOpen(false);

  return (
    <div style={{ padding: "1rem" }}>
      {/* Primera fila: Devoluciones y Reimprimir */}
      <div className="p-d-flex p-jc-between p-mb-2">
        <Button
          label="Devoluciones"
          className="p-button-secondary"
          style={{ flex: 1, marginRight: "0.5rem" }}
          onClick={openReturnsModal}
        />
        <Button
          label="Reimprimir"
          className="p-button-secondary"
          style={{ flex: 1 }}
          onClick={openReprintModal}
        />
      </div>

      {/* Segunda fila: Añadir Manual y Descuento */}
      <div className="p-d-flex p-jc-between p-mb-2">
        <Button
          label="Añadir Manual"
          className="p-button-success"
          style={{ flex: 1, marginRight: "0.5rem" }}
          onClick={handleAddManual}
        />
        <Button
          label="Descuento"
          className="p-button-help"
          style={{ flex: 1 }}
          onClick={handleDescuentoClick}
        />
      </div>

      {/* Botón Finalizar Venta */}
      <div className="p-d-flex p-jc-end">
        <Button
          label={isLoading ? "Procesando..." : "Finalizar Venta"}
          className="p-button-primary"
          style={{ padding: "1rem 2rem", fontSize: "1.125rem", fontWeight: "bold" }}
          disabled={
            cartItems.length === 0 ||
            isLoading ||
            (Math.max(0, total) > 0 && totalEntered < Math.max(0, total))
          }
          onClick={handleFinalSale}
        />
      </div>

      {/* Modal: Final Sale */}
      <Dialog
        header="Finalizar Venta"
        visible={isFinalSaleModalOpen}
        onHide={handleCloseFinalSaleModal}
        modal
        style={{ width: "70vw", minHeight: "70vh" }}
      >
        <div style={{ padding: "1.5rem" }}>
          {/* Resumen de Totales */}
          <div
            style={{
              marginBottom: "1rem",
              borderBottom: "1px solid var(--surface-border)",
              paddingBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1.125rem" }}>Subtotal Productos:</span>
              <span style={{ fontSize: "1.125rem", fontWeight: "bold" }}>
                {subtotalProducts.toFixed(2)} €
              </span>
            </div>
            {appliedDiscounts.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.5rem",
                }}
              >
                <span style={{ fontSize: "1.125rem" }}>Descuentos:</span>
                <span
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "bold",
                    color: "var(--red-500)",
                  }}
                >
                  -{totalDiscounts.toFixed(2)} €
                </span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "0.5rem",
              }}
            >
              <span style={{ fontSize: "2rem", fontWeight: "bold" }}>TOTAL:</span>
              <span style={{ fontSize: "2rem", fontWeight: 800 }}>
                {Math.max(0, total).toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div
            style={{
              marginBottom: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {["efectivo", "tarjeta", "bizum"].map((method) => (
              <div
                key={method}
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <Button
                  label={method.charAt(0).toUpperCase() + method.slice(1)}
                  className={
                    selectedMethods.includes(method) && total > 0
                      ? method === "efectivo"
                        ? "p-button-success"
                        : "p-button-primary"
                      : "p-button-secondary"
                  }
                  style={{ flex: 1 }}
                  onClick={() => total > 0 && togglePaymentMethod(method)}
                  disabled={total <= 0}
                />
                <input
                  type="number"
                  placeholder={`Importe en ${method}`}
                  value={amounts[method]}
                  onChange={(e) => handleAmountChange(method, e.target.value)}
                  disabled={!selectedMethods.includes(method) || total <= 0}
                  style={{
                    flex: 2,
                    padding: "0.5rem",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "4px",
                  }}
                />
              </div>
            ))}
          </div>

          <Button
            label={isLoading ? "Procesando..." : "Confirmar Venta"}
            className="p-button-primary"
            style={{
              width: "100%",
              padding: "1rem",
              fontSize: "1.125rem",
              fontWeight: "bold",
            }}
            disabled={
              (Math.max(0, total) > 0 && totalEntered < Math.max(0, total)) ||
              isLoading
            }
            onClick={handleConfirmSale}
          />
        </div>
      </Dialog>

      {/* TicketViewModal para ticket normal */}
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

      {/* Otros modales */}
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
    </div>
  );
};

export default SalesCardActions;