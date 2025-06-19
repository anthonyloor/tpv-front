// src/components/Sales/SalesCardActions.jsx

import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import ReturnsExchangesModal from "../modals/returns/ReturnsExchangesModal";
import ReprintModal from "../modals/reprint/ReprintModal";
import PinValidationModal from "../modals/pin/PinValidationModal";
import DiscountModal from "../modals/discount/DiscountModal";
import ActionResultDialog from "../common/ActionResultDialog";
import useFinalizeSale from "../../hooks/useFinalizeSale";
import { AuthContext } from "../../contexts/AuthContext";
import { Toast } from "primereact/toast";
import { InputNumber } from "primereact/inputnumber";
import { CartContext } from "../../contexts/CartContext";
import { ClientContext } from "../../contexts/ClientContext";
import { useIsCompact } from "../../utils/responsive";
import generateTicket from "../../utils/ticket";
import { ConfigContext } from "../../contexts/ConfigContext";
import { useEmployeesDictionary } from "../../hooks/useEmployeesDictionary";
import getApiBaseUrl from "../../utils/getApiBaseUrl";
import { useApiFetch } from "../../utils/useApiFetch";
import { openCashRegister } from "../../utils/ticket";
import { generateDiscountVoucherTicket } from "../../utils/ticket";
import ManualProductModal from "../modals/manual/ManualProductModal";

function SalesCardActions({
  cartItems,
  setCartItems,
  appliedDiscounts,
  addDiscount,
  removeDiscountByIndex,
  clearDiscounts,
  handleAddProduct,
  selectedProductForDiscount,
  setSelectedProductForDiscount,
  widthPercent = "35%",
  heightPercent = "60%",
  subtotal = 0,
  total = 0,
  totalDiscounts = 0,
}) {
  const {
    isDevolution,
    setIsDevolution,
    originalPaymentMethods,
    setOriginalPaymentMethods,
    originalPaymentAmounts,
    setOriginalPaymentAmounts,
    setIsDiscount,
  } = useContext(CartContext);
  const { idProfile } = useContext(AuthContext);
  const { resetToDefaultClientAndAddress } = useContext(ClientContext);
  const { isLoading, finalizeSale } = useFinalizeSale();
  const { configData } = useContext(ConfigContext);
  const employeesDict = useEmployeesDictionary();
  const toast = useRef(null);

  // Modales
  const [isReturnsModalOpen, setIsReturnsModalOpen] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isFinalSaleModalOpen, setFinalSaleModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketOrderId, setTicketOrderId] = useState(null);
  const [ticketOrderOrigin, setTicketOrderOrigin] = useState(null);
  const [printOnOpen, setPrintOnOpen] = useState(false);
  const [giftTicket, setGiftTicket] = useState(false);
  const [giftTicketTM, setGiftTicketTM] = useState(false);
  const [cartRuleModalOpen, setCartRuleModalOpen] = useState(false);
  const [newCartRuleCode, setNewCartRuleCode] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const apiFetch = useApiFetch();

  // Métodos de pago
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [amounts, setAmounts] = useState({
    efectivo: "",
    tarjeta: "",
    bizum: "",
  });
  const [changeAmount, setChangeAmount] = useState(0);

  // NUEVOS ESTADOS para control de impresión fallida
  const [printOptionModalVisible, setPrintOptionModalVisible] = useState(false);
  const [manualPdfDataUrl, setManualPdfDataUrl] = useState(null);
  const [orderDataForPrint, setOrderDataForPrint] = useState(null);

  // NUEVOS estados para impresión del vale
  const [voucherPrintOptionModalVisible, setVoucherPrintOptionModalVisible] =
    useState(false);
  const [voucherManualPdfDataUrl, setVoucherManualPdfDataUrl] = useState(null);

  useEffect(() => {
    // Leer datos de pago actualizados al dispararse el evento personalizado
    const handlePaymentDataUpdated = () => {
      const storedMethods = localStorage.getItem("originalPaymentMethods");
      if (storedMethods) {
        setOriginalPaymentMethods(JSON.parse(storedMethods));
      }
      const storedAmounts = localStorage.getItem("originalPaymentAmounts");
      if (storedAmounts) {
        const parsed = JSON.parse(storedAmounts);
        const mapped = {
          efectivo: parsed.total_cash,
          tarjeta: parsed.total_card,
          bizum: parsed.total_bizum,
        };
        setOriginalPaymentAmounts(mapped);
      }
    };
    window.addEventListener("paymentDataUpdated", handlePaymentDataUpdated);
    return () =>
      window.removeEventListener(
        "paymentDataUpdated",
        handlePaymentDataUpdated
      );
  }, [setOriginalPaymentMethods, setOriginalPaymentAmounts]);

  const isRectification = cartItems.some(
    (item) => item.reference_combination === "rectificacion"
  );

  // Si es devolución, se muestran valores en negativo
  const displayTotal = isDevolution ? Math.abs(total) : total;

  // Agregar el efecto para desactivar isDevolution cuando total >= 0
  useEffect(() => {
    if (total >= 0 && isDevolution) {
      setIsDevolution(false);
    }
  }, [total, isDevolution, setIsDevolution]);

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
    setIsManualModalOpen(true);
  };

  const handleDescuentoClick = () => {
    if (cartItems.length === 0) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Ticket vacio. Añade productos antes de aplicar descuentos.",
      });
      return;
    }
    console.log("[handleDescuentoClick] appliedDiscounts:", appliedDiscounts);
    if (
      appliedDiscounts.some(
        (d) => d.description && d.description.includes("venta")
      )
    ) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          "Ya existe un descuento sobre el total de la venta, no se puede añadir otro descuento.",
      });
      setSelectedProductForDiscount(null);
      return;
    }
    if (selectedProductForDiscount) {
      // Intentando aplicar descuento a producto

      if (selectedProductForDiscount.discountApplied) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Este producto ya tiene un descuento aplicado.",
        });
        setSelectedProductForDiscount(null);
        return;
      }
    } else {
      // Intentando aplicar descuento global
      if (
        appliedDiscounts.some(
          (d) => d.description && !d.description.includes("venta")
        )
      ) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail:
            "Ya existe un descuento sobre un producto, no se puede añadir otro descuento.",
        });
        return;
      }
    }
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
    setFinalSaleModalOpen(true);
  };

  const handleCloseFinalSaleModal = () => {
    setFinalSaleModalOpen(false);
    setSelectedMethods([]);
    setAmounts({ efectivo: "", tarjeta: "", bizum: "" });
    setChangeAmount(0);
  };

  const handleConfirmSale = async () => {
    // Validación: Si no hay ningún método de pago seleccionado, se muestra error y se detiene la función.
    if (selectedMethods.length === 0) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Debe seleccionar al menos un método de pago.",
      });
      return;
    }
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

    await finalizeSale(
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
          orderOrigin = "mayret",
        }) => {
          showAlert("Venta finalizada correctamente", true);
          setTicketOrderId(orderId);
          setTicketOrderOrigin(orderOrigin);
          setGiftTicketTM(giftTicket);
          setChangeAmount(changeAmount);
          setTicketModalOpen(true);
          setPrintOnOpen(print);

          // Si se generó un vale descuento, activar el modal (no mostrar botón en el layout principal)
          if (newCartRuleCode) {
            setNewCartRuleCode(newCartRuleCode);
            setVoucherPrintOptionModalVisible(true);
          }
          // Limpiar carrito y descuentos y asignar el cliente por defecto
          setCartItems([]);
          clearDiscounts();
          resetToDefaultClientAndAddress();

          setSelectedMethods([]);
          setAmounts({ efectivo: "", tarjeta: "", bizum: "" });
          setChangeAmount(0);
          setGiftTicket(false);
          setFinalSaleModalOpen(false);
          setIsDevolution(false);
          setIsDiscount(false);
          // Limpiar los valores originales de pago en CartContext
          setOriginalPaymentMethods([]);
          setOriginalPaymentAmounts({});
        },
        onError: (error) => {
          showAlert("Error al finalizar la venta: " + error.message, false);
          alert("Error al finalizar la venta.");
        },
      },
      true
    );
  };

  // Cantidad total introducida en los métodos de pago
  const totalEntered = Object.values(amounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  // Agregar variable para ignorar métodos originales si total > 0
  const ignoreOriginalPayments = total > 0;

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
    if (isDevolution && !ignoreOriginalPayments) {
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
          ? total
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
    if (
      isDevolution &&
      !ignoreOriginalPayments &&
      method !== "vale" &&
      originalPaymentAmounts[method]
    ) {
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
    setChangeAmount(newChange);
  };

  // Mostrar mensaje de vale descuento si total es negativo y sin métodos de pago seleccionados
  // Voucher se genera solo si total < 0 y no se selecciona ningún método
  const voucherMessage = selectedMethods.includes("vale")
    ? `Se va a generar un vale descuento de ${Math.abs(total).toFixed(2)} €`
    : "";

  // Actualizamos la función para marcar el descuento aplicado en un producto
  const updateProductDiscount = (idStockAvailable, newDiscountedPrice) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id_stock_available === idStockAvailable) {
          // Redondear el nuevo precio unitario a 2 decimales
          const newPriceRounded = Number(newDiscountedPrice.toFixed(2));
          // Calcular el descuento asegurando que no sea negativo
          const discountAmount = Math.max(
            0,
            item.final_price_incl_tax - newPriceRounded
          );
          return {
            ...item,
            reduction_amount_tax_incl: newPriceRounded,
            discountApplied: true,
            discountAmount,
          };
        }
        return item;
      })
    );
  };

  // Función para actualizar productos según el descuento aplicado
  const updateDiscountsForIdentifier = useCallback(
    (discObj) => {
      if (discObj.description.includes("producto")) {
        // Descuento sobre producto específico
        const match = discObj.description.match(
          /producto\s+([^\s]+)\s+generado/
        );
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
                item.final_price_incl_tax *
                (1 - discObj.reduction_percent / 100);
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
            prevItems.map((item) => {
              const newPrice = Math.max(
                0,
                item.final_price_incl_tax - discountPerUnit
              );
              return {
                ...item,
                reduction_amount_tax_incl: newPrice,
                discountApplied: true,
                discountAmount: item.final_price_incl_tax - newPrice,
              };
            })
          );
        } else if (discObj.reduction_percent > 0) {
          setCartItems((prevItems) =>
            prevItems.map((item) => {
              const newPrice =
                item.final_price_incl_tax *
                (1 - discObj.reduction_percent / 100);
              return {
                ...item,
                reduction_amount_tax_incl: Math.max(0, newPrice),
                discountApplied: true,
                discountAmount:
                  item.final_price_incl_tax - Math.max(0, newPrice),
              };
            })
          );
        }
      }
    },
    [cartItems, setCartItems]
  );

  // Escuchar evento global para aplicar descuento directo
  useEffect(() => {
    const handleGlobalDiscount = (e) => {
      updateDiscountsForIdentifier(e.detail);
    };
    window.addEventListener("globalDiscountApplied", handleGlobalDiscount);
    return () => {
      window.removeEventListener("globalDiscountApplied", handleGlobalDiscount);
    };
  }, [updateDiscountsForIdentifier]);

  const handleDiscountApplied = (discObj) => {
    const isGlobal =
      discObj.description && discObj.description.includes("venta");
    const hasProductDiscount = appliedDiscounts.some(
      (d) => d.description && !d.description.includes("venta")
    );
    const hasGlobalDiscount = appliedDiscounts.some(
      (d) => d.description && d.description.includes("venta")
    );

    if (isGlobal && hasProductDiscount) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          "Ya existe un descuento sobre un producto, no se puede añadir otro descuento.",
      });
      return;
    }
    if (!isGlobal && hasGlobalDiscount) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail:
          "Ya existe un descuento sobre el total de la venta, no se puede añadir otro descuento.",
      });
      return;
    }
    if (
      !isGlobal &&
      selectedProductForDiscount &&
      selectedProductForDiscount.discountApplied
    ) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "El producto ya tiene un descuento aplicado.",
      });
      return;
    }

    addDiscount(discObj);
    if (!selectedProductForDiscount) {
      updateDiscountsForIdentifier(discObj);
    }
    setIsDiscount(true);
    setIsDiscountModalOpen(false);
  };

  // Agregar variable para definir los métodos de pago según modo de devolución
  const paymentMethods = isDevolution
    ? ["efectivo", "tarjeta", "bizum", "vale"]
    : ["efectivo", "tarjeta", "bizum"];

  const isCompact = useIsCompact();

  // Definir los labels originales
  const labels = {
    devoluciones: "Devoluciones",
    reimprimir: "Reimprimir",
    descuento: "Descuento",
    finalizar: "Finalizar Venta",
  };

  useEffect(() => {
    if (ticketOrderId) {
      (async () => {
        try {
          const API_BASE_URL = getApiBaseUrl();
          const orderData = await apiFetch(`${API_BASE_URL}/get_order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_order: ticketOrderId,
              origin: "mayret",
            }),
          });
          if (!orderData || !orderData.order_details) {
            console.error("Error: datos de la orden incompletos");
          } else {
            setOrderDataForPrint(orderData);
            const response = await generateTicket(
              "print",
              orderData,
              configData,
              employeesDict,
              giftTicket
            );
            if (response.success) {
              console.log("Ticket impreso remotamente correctamente");
            } else if (response.manual) {
              setManualPdfDataUrl(response.pdfDataUrl);
              setPrintOptionModalVisible(true);
            } else {
              console.error("Error al imprimir ticket:", response.message);
            }
          }
        } catch (err) {
          console.error("Error en la consulta get_order:", err);
        } finally {
          setTicketOrderId(null);
        }
      })();
    }
  }, [ticketOrderId, configData, employeesDict, apiFetch, giftTicket]);

  // Función para imprimir de forma manual
  const handleManualPrint = () => {
    if (manualPdfDataUrl) {
      const printWindow = window.open("", "_blank"); // abrir ventana vacía
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>Vista Previa del PDF</title></head>
           <body style="margin:0">
             <iframe width="100%" height="100%" src="${manualPdfDataUrl}" frameborder="0"></iframe>
           </body></html>`
        );
        printWindow.document.close();
        printWindow.focus();
        setPrintOptionModalVisible(false);
      } else {
        console.warn("No se pudo abrir la ventana de previsualización");
      }
    }
  };

  // Función para reintentar impresión remota
  const handleRetryPrint = async () => {
    if (orderDataForPrint) {
      try {
        const response = await generateTicket(
          "print",
          orderDataForPrint,
          configData,
          employeesDict,
          giftTicket
        );
        if (response.success) {
          console.log("Reimpresión remota exitosa");
          setPrintOptionModalVisible(false);
        } else if (response.manual) {
          setManualPdfDataUrl(response.pdfDataUrl);
          // El modal permanece abierto para nueva elección
        } else {
          console.error(
            "Error al reintentar imprimir ticket:",
            response.message
          );
        }
      } catch (err) {
        console.error("Error al reintentar impresión:", err);
      }
    }
  };

  // NUEVAS funciones para imprimir vale de forma manual y reintentar
  const handleVoucherManualPrint = () => {
    if (voucherManualPdfDataUrl) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          `<html><head><title>Vista Previa del PDF - Vale</title></head>
           <body style="margin:0">
             <iframe width="100%" height="100%" src="${voucherManualPdfDataUrl}" frameborder="0"></iframe>
           </body></html>`
        );
        printWindow.document.close();
        printWindow.focus();
        setVoucherPrintOptionModalVisible(false);
      } else {
        console.warn(
          "No se pudo abrir la ventana de previsualización para el vale"
        );
      }
    }
  };

  const handleVoucherRetryPrint = async () => {
    if (newCartRuleCode) {
      try {
        const API_BASE_URL = getApiBaseUrl();
        const voucherResp = await apiFetch(
          `${API_BASE_URL}/get_cart_rule?code=${newCartRuleCode}`,
          { method: "GET" }
        );
        const voucherResponse = await generateDiscountVoucherTicket(
          "print",
          voucherResp,
          {},
          {}
        );
        if (voucherResponse.success) {
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "Vale descuento impreso correctamente",
          });
          setNewCartRuleCode(null);
          setVoucherPrintOptionModalVisible(false);
        } else if (voucherResponse.manual) {
          setVoucherManualPdfDataUrl(voucherResponse.pdfDataUrl);
          setVoucherPrintOptionModalVisible(true);
        } else {
          console.error(
            "Error al reintentar impresión del vale:",
            voucherResponse.message
          );
        }
      } catch (err) {
        console.error("Error al reintentar impresión del vale:", err);
      }
    }
  };

  useEffect(() => {
    if (cartRuleModalOpen && newCartRuleCode) {
      (async () => {
        const ticketData = { cartRuleCode: newCartRuleCode };
        const response = await generateTicket(
          "print",
          ticketData,
          configData,
          employeesDict
        );
        if (!response.success) {
          console.error("Error al imprimir vale:", response.message);
        }
        setCartRuleModalOpen(false);
      })();
    }
  }, [cartRuleModalOpen, newCartRuleCode, configData, employeesDict]);

  // Nueva función para abrir caja (ticket vacío)
  const handleOpenCashRegister = async () => {
    try {
      await openCashRegister("print", configData, employeesDict);
    } catch (error) {
      console.error("Error en openCashRegister:", error);
    }
  };

  return (
    <div
      className="h-full flex flex-col p-3 relative"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      <Toast ref={toast} position="top-center" />
      {/* Primera fila de botones */}
      <div className="flex gap-2">
        <Button
          label={isCompact ? "" : labels.devoluciones}
          icon="pi pi-undo"
          className={`p-button w-full ${isCompact ? "p-button-icon-only" : ""}`}
          style={{
            flex: 1,
            width: "50px",
            height: "50px",
          }}
          onClick={openReturnsModal}
        />
        <Button
          label={isCompact ? "" : labels.descuento}
          icon="pi pi-percentage"
          className={`p-button w-full ${isCompact ? "p-button-icon-only" : ""}`}
          style={{
            flex: 1,
            width: "50px",
            height: "50px",
          }}
          onClick={handleDescuentoClick}
        />
        <Button
          label={isCompact ? "" : labels.reimprimir}
          icon="pi pi-print"
          className={`p-button w-full ${isCompact ? "p-button-icon-only" : ""}`}
          style={{
            flex: 1,
            width: "50px",
            height: "50px",
          }}
          onClick={openReprintModal}
        />
      </div>

      {/* Botones agrupados en una fila de 3 columnas */}
      <div className="flex gap-2 mt-2">
        <Button
          label={
            isCompact ? "" : isLoading ? "Procesando..." : labels.finalizar
          }
          icon="pi pi-check"
          className={`p-button-primary w-full ${
            isCompact ? "p-button-icon-only" : ""
          }`}
          style={{
            flex: 1,
            height: "50px",
            fontSize: "1.25rem",
          }}
          disabled={cartItems.length === 0 || isLoading}
          onClick={handleFinalSale}
        />
        <Button
          icon="pi pi-plus"
          tooltip="Añadir manualmente"
          tooltipOptions={{ position: "top" }}
          className={`p-button-icon-only p-button-sm`}
          style={{ width: "50px" }}
          onClick={handleAddManual}
        />
        <Button
          icon="pi pi-inbox"
          tooltip="Abrir caja"
          tooltipOptions={{ position: "top" }}
          className={`p-button-icon-only p-button-sm`}
          style={{ width: "50px" }}
          disabled={isLoading}
          onClick={handleOpenCashRegister}
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
                total >= 0 && method === "vale"
                  ? null
                  : method === "vale"
                  ? `Generar vale descuento`
                  : method.charAt(0).toUpperCase() + method.slice(1);
              if (label === null) {
                return null;
              }
              const disabled =
                isDevolution && !ignoreOriginalPayments
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
            label={
              isLoading ? (
                <span>
                  Procesando...{" "}
                  <i
                    className="pi pi-spinner pi-spin"
                    style={{ marginLeft: "0.5rem" }}
                  ></i>
                </span>
              ) : (
                labels.finalizar
              )
            }
            className="p-button-success mt-3"
            style={{ padding: "1rem", fontSize: "1.125rem" }}
            disabled={
              (!isRectification &&
                Math.max(0, displayTotal) > 0 &&
                Math.abs(totalEntered < Math.max(0, displayTotal)) > 0.01) ||
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
        cartTotal={total}
      />
      <ManualProductModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAddProduct={handleAddProduct}
      />
      <Dialog
        header="Error de impresión"
        visible={printOptionModalVisible}
        onHide={() => setPrintOptionModalVisible(false)}
        modal
        draggable={false}
        resizable={false}
        style={{ marginBottom: "150px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <span>
            La impresión del ticket ha fallado. ¿Deseas imprimirlo manualmente o
            reintentar?
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "start",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button label="Imprimir manual" onClick={handleManualPrint} />
            <Button label="Reintentar" onClick={handleRetryPrint} />
          </div>
        </div>
      </Dialog>
      {/* NUEVO modal para vale descuento */}
      <Dialog
        header="Error de impresión del vale"
        visible={voucherPrintOptionModalVisible}
        onHide={() => setVoucherPrintOptionModalVisible(false)}
        modal
        draggable={false}
        resizable={false}
        style={{ marginBottom: "500px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <span>
            La impresión del vale ha fallado. ¿Deseas imprimirlo manualmente o
            reintentar?
          </span>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
            <Button
              label="Imprimir manual"
              onClick={handleVoucherManualPrint}
            />
            <Button label="Reintentar" onClick={handleVoucherRetryPrint} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default SalesCardActions;
