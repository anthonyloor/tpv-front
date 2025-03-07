// src/components/Sales/SalesCardActions.jsx

import React, { useState, useContext, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import ReturnsExchangesModal from "../modals/returns/ReturnsExchangesModal";
import ReprintModal from "../modals/reprint/ReprintModal";
import PinValidationModal from "../modals/pin/PinValidationModal";
import DiscountModal from "../modals/discount/DiscountModal";
import TicketViewModal from "../modals/ticket/TicketViewModal";
import ActionResultDialog from "../common/ActionResultDialog";
import useFinalizeSale from "../../hooks/useFinalizeSale";
import { AuthContext } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { InputNumber } from "primereact/inputnumber";
import { DevolutionContext } from "../../contexts/DevolutionContext";

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
  selectedProductForDiscount,
  widthPercent = "35%",
  heightPercent = "60%",
  subtotal = 0,
  total = 0,
}) {
  const {
    isDevolution,
    setIsDevolution,
    originalPaymentMethods,
    setOriginalPaymentMethods,
    originalPaymentAmounts,
    setOriginalPaymentAmounts,
    setIsDiscount,
  } = useContext(DevolutionContext);
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

  useEffect(() => {
    // Leer payment methods originales de localStorage si existen
    const stored = localStorage.getItem("originalPaymentMethods");
    if (stored) {
      setOriginalPaymentMethods(JSON.parse(stored));
    }
    const storedAmounts = localStorage.getItem("originalPaymentAmounts");
    if (storedAmounts) {
      setOriginalPaymentAmounts(JSON.parse(storedAmounts));
    }
  }, [setOriginalPaymentMethods, setOriginalPaymentAmounts]);

  const isRectification = cartItems.some(
    (item) => item.reference_combination === "rectificacion"
  );

  const totalDiscounts = appliedDiscounts.reduce((sum, disc) => {
    const redPercent = disc.reduction_percent || 0;
    const redAmount = disc.reduction_amount || 0;
    const discountAmount = redPercent
      ? subtotal * (redPercent / 100)
      : redAmount;
    return sum + discountAmount;
  }, 0);

  // Si es devolución, se muestran valores en negativo
  const displayTotal = isDevolution ? Math.abs(total) : total;

  // Estados para alertas
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSuccess, setAlertSuccess] = useState(false);

  const showAlert = (message, success = false) => {
    setAlertSuccess(success);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
  };

  // Abrir/Cerrar modales
  const openReturnsModal = () => setIsReturnsModalOpen(true);
  const closeReturnsModal = () => setIsReturnsModalOpen(false);
  const openReprintModal = () => setIsReprintModalOpen(true);
  const closeReprintModal = () => setIsReprintModalOpen(false);
  const handleAddManual = () => {
    toast.success("Producto añadido manualmente");
  };

  const handleDescuentoClick = () => {
    if (cartItems.length === 0) {
      toast.error(
        "El carrito está vacío. Añade productos antes de aplicar descuentos."
      );
      return;
    }
    setIsDiscountModalOpen(true);
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
    // setLeftoverPreview(leftoverArray);
    console.log("[handleFinalSale] Subtotal:", subtotal);
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
    setOriginalPaymentMethods(originalPaymentMethods);
    setOriginalPaymentAmounts(originalPaymentAmounts);

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
          showAlert("Venta finalizada correctamente", true);
          // Guardar estado
          setTicketOrderId(orderId);
          setGiftTicketTM(giftTicket);
          setChangeAmount(changeAmount);
          setTicketModalOpen(true);
          setPrintOnOpen(print);

          // Nuevo cart rule
          if (newCartRuleCode) setNewCartRuleCode(newCartRuleCode);
          // setLeftoverInfo(leftoverArray);

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
          setIsDevolution(false);
          setIsDiscount(false);
        },
        onError: (error) => {
          showAlert("Error al finalizar la venta: " + error.message, false);
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
    // Si se va a agregar un método nuevo, deseleccionar aquellos sin importe válido.
    if (!selectedMethods.includes(method)) {
      const validMethods = selectedMethods.filter((m) => {
        const val = amounts[m];
        return val !== "" && !isNaN(parseFloat(val)) && parseFloat(val) > 0;
      });
      if (validMethods.length !== selectedMethods.length) {
        const updatedAmounts = { ...amounts };
        selectedMethods.forEach((m) => {
          if (!validMethods.includes(m)) {
            updatedAmounts[m] = "";
          }
        });
        setSelectedMethods(validMethods);
        setAmounts(updatedAmounts);
        updateChangeAmount(updatedAmounts);
      }
    }
    if (isDevolution) {
      // Solo se permite si el método es "vale" o si pertenece a originalPaymentMethods
      if (method !== "vale" && !originalPaymentMethods.includes(method)) return;
      // Si ya se seleccionó "vale", no se permite añadir otro método
      if (selectedMethods.includes("vale") && method !== "vale") return;
      // Si se intenta seleccionar "vale" y ya hay otros métodos, no se permite
      if (
        method === "vale" &&
        selectedMethods.length > 0 &&
        !selectedMethods.includes("vale")
      )
        return;
    }
    if (selectedMethods.includes(method)) {
      // Quitar
      const updated = { ...amounts, [method]: "" };
      setSelectedMethods((prev) => prev.filter((m) => m !== method));
      setAmounts(updated);
      updateChangeAmount(updated);
    } else {
      // Si se selecciona "vale", escribir su importe fijo y deseleccionar cualquier otro
      if (method === "vale") {
        const updated = { ...amounts, vale: Math.abs(total).toFixed(2) };
        setSelectedMethods(["vale"]);
        setAmounts(updated);
        updateChangeAmount(updated);
        return;
      }
      // Si se intenta seleccionar otro método y "vale" ya está seleccionado, no se permite
      if (selectedMethods.includes("vale")) return;
      // Agregar método original
      setSelectedMethods((prev) => [...prev, method]);
      if (["efectivo", "tarjeta", "bizum"].includes(method)) {
        const remain = isRectification
          ? Math.abs(total)
          : Math.max(0, total) - totalEntered;
        // Limitar al monto original disponible para este método, si existe
        const available = originalPaymentAmounts[method]
          ? parseFloat(originalPaymentAmounts[method])
          : remain;
        const newVal =
          remain > available ? available.toFixed(2) : remain.toFixed(2);
        const updated = { ...amounts, [method]: newVal };
        setAmounts(updated);
        updateChangeAmount(updated);
      }
    }
  };

  const handleAmountChange = (method, val) => {
    let parsed = isRectification ? -Math.abs(val || 0) : val || 0;
    if (isDevolution && method !== "vale" && originalPaymentAmounts[method]) {
      const available = parseFloat(originalPaymentAmounts[method]);
      if (Math.abs(parsed) > available) {
        parsed = isRectification ? -available : available;
      }
    }
    const updated = { ...amounts, [method]: parsed.toString() };
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
  const voucherMessage = selectedMethods.includes("vale")
    ? `Se va a generar un vale descuento de ${Math.abs(total).toFixed(2)} €`
    : "";

  // Agregar updateProductDiscount para aplicar descuento a un producto
  const updateProductDiscount = (idStockAvailable, newDiscountedPrice) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id_stock_available === idStockAvailable
          ? { ...item, reduction_amount_tax_incl: newDiscountedPrice }
          : item
      )
    );
  };

  // Función para actualizar productos según el descuento aplicado
  const updateDiscountsForIdentifier = (discObj) => {
    if (discObj.description.includes("producto")) {
      // Descuento sobre producto específico
      const match = discObj.description.match(/producto\s+([^\s]+)\s+generado/);
      if (!match) return;
      const identifier = match[1]; // ej: "EAN13'1234"
      const matchingItems = cartItems.filter((item) => {
        const prodId = item.EAN13 || "";
        const ctrl = item.id_control_stock ? "'" + item.id_control_stock : "";
        return prodId + ctrl === identifier;
      });
      if (matchingItems.length === 0) return;
      if (discObj.reduction_amount > 0) {
        const totalUnits = matchingItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const discountPerUnit = discObj.reduction_amount / totalUnits;
        setCartItems((prevItems) =>
          prevItems.map((item) => {
            const prodId = item.EAN13 || "";
            const ctrl = item.id_control_stock
              ? "'" + item.id_control_stock
              : "";
            if (prodId + ctrl === identifier) {
              return {
                ...item,
                reduction_amount_tax_incl: Math.max(
                  0,
                  item.final_price_incl_tax - discountPerUnit
                ),
              };
            }
            return item;
          })
        );
      } else if (discObj.reduction_percent > 0) {
        setCartItems((prevItems) =>
          prevItems.map((item) => {
            const newPrice =
              item.final_price_incl_tax * (1 - discObj.reduction_percent / 100);
            return {
              ...item,
              reduction_amount_tax_incl: Math.max(0, newPrice),
            };
          })
        );
      }
    } else if (discObj.description.includes("venta")) {
      // Descuento global para toda la venta
      if (discObj.reduction_amount > 0) {
        const totalUnits = cartItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const discountPerUnit = discObj.reduction_amount / totalUnits;
        setCartItems((prevItems) =>
          prevItems.map((item) => ({
            ...item,
            reduction_amount_tax_incl: Math.max(
              0,
              item.final_price_incl_tax - discountPerUnit
            ),
          }))
        );
      } else if (discObj.reduction_percent > 0) {
        setCartItems((prevItems) =>
          prevItems.map((item) => {
            const newPrice =
              item.final_price_incl_tax * (1 - discObj.reduction_percent / 100);
            return {
              ...item,
              reduction_amount_tax_incl: Math.max(0, newPrice),
            };
          })
        );
      }
    }
  };

  const handleDiscountApplied = (discObj) => {
    addDiscount(discObj);
    if (!selectedProductForDiscount) {
      updateDiscountsForIdentifier(discObj);
    }
    setIsDiscount(true);
    setIsDiscountModalOpen(false);
  };

  console.log(
    "[SalesCardActions] selectedProductForDiscount:",
    selectedProductForDiscount
  );

  // Agregar variable para definir los métodos de pago según modo de devolución
  const paymentMethods = isDevolution
    ? ["efectivo", "tarjeta", "bizum", "vale"]
    : ["efectivo", "tarjeta", "bizum"];

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
        style={{
          width: widthPercent,
          height: heightPercent,
          minWidth: "700px",
          minHeight: "600px",
        }}
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
                {subtotal.toFixed(2)} €
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
                {total.toFixed(2)} €
              </span>
            </div>
            {/* Mostrar cambio a devolver en venta normal */}
            {!isDevolution && totalEntered > total && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xl font-medium">Cambio a devolver:</span>
                <span className="text-xl font-bold">
                  {(totalEntered - total).toFixed(2)} €
                </span>
              </div>
            )}
          </div>

          {/* Métodos de Pago */}
          <div className="flex flex-col gap-4">
            {paymentMethods.map((method) => {
              // Definir label; para "vale" se muestra el importe fijo
              const label =
                method === "vale"
                  ? `Vale descuento: ${Math.abs(total).toFixed(2)} €`
                  : method.charAt(0).toUpperCase() + method.slice(1);
              // Para métodos originales: solo se habilita si están en originalPaymentMethods
              // y, si "vale" está seleccionado, se deshabilitan
              const disabled = isDevolution
                ? method === "vale"
                  ? selectedMethods.some((m) => m !== "vale")
                  : !originalPaymentMethods.includes(method) ||
                    selectedMethods.includes("vale")
                : false;
              return (
                <div key={method} className="flex items-center gap-2">
                  <Button
                    label={label}
                    severity={
                      selectedMethods.includes(method)
                        ? method === "efectivo"
                          ? "success"
                          : "primary"
                        : "secondary"
                    }
                    className="flex-1"
                    onClick={() => togglePaymentMethod(method)}
                    disabled={disabled}
                  />
                  <InputNumber
                    value={
                      method === "vale"
                        ? parseFloat(Math.abs(total).toFixed(2))
                        : amounts[method]
                        ? parseFloat(amounts[method])
                        : null
                    }
                    onValueChange={(e) =>
                      method === "vale"
                        ? null
                        : handleAmountChange(method, e.value)
                    }
                    // Si es devolución, o el método no está seleccionado, deshabilitar el input
                    disabled={
                      isDevolution ||
                      (method === "vale"
                        ? true
                        : !selectedMethods.includes(method))
                    }
                    placeholder={`Importe en ${method}`}
                    className="flex-1"
                  />
                </div>
              );
            })}
          </div>

          {/* Mostrar mensaje de vale descuento */}
          {voucherMessage && (
            <div className="mt-2 text-red-500 font-bold">{voucherMessage}</div>
          )}
          <Button
            label={isLoading ? "Procesando..." : "Confirmar Venta"}
            className="p-button-success mt-3"
            style={{ padding: "1rem", fontSize: "1.125rem" }}
            disabled={
              (Math.max(0, displayTotal) > 0 &&
                totalEntered < Math.max(0, displayTotal)) ||
              isLoading
            }
            onClick={handleConfirmSale}
          />
        </div>
      </Dialog>

      <ActionResultDialog
        visible={alertVisible}
        onClose={handleAlertClose}
        success={alertSuccess}
        message={alertMessage}
      />

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
        onDiscountApplied={handleDiscountApplied}
        onProductDiscountApplied={updateProductDiscount}
        targetProduct={selectedProductForDiscount}
      />
    </div>
  );
}

export default SalesCardActions;
