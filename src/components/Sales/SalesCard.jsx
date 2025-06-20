// src/components/Sales/SalesCard.jsx

import React, { useState, useContext, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";

import { ClientContext } from "../../contexts/ClientContext";
import { ConfigContext } from "../../contexts/ConfigContext";
import { CartContext } from "../../contexts/CartContext";
import { AuthContext } from "../../contexts/AuthContext";
import PinValidationModal from "../modals/pin/PinValidationModal";

import ParkedCartsModal from "../modals/parked/ParkedCartsModal";
import AddressModal from "../modals/customer/AddressModal";
import ClientInfoDialog from "../modals/customer/ClientInfoDialog";
import CustomerStepperModal from "../modals/customer/CustomerStepperModal";
import CreateCustomerModal from "../modals/customer/CreateCustomerModal";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useIsCompact } from "../../utils/responsive";
import useToggle from "../../hooks/useToggle";

function SalesCard({
  cartItems,
  setCartItems,
  onRemoveProduct,
  onDecreaseProduct,
  appliedDiscounts,
  removeDiscountByIndex,
  clearDiscounts,
  recentlyAddedId,
  saveCurrentCartAsParked,
  getParkedCarts,
  loadParkedCart,
  deleteParkedCart,
  setSelectedProductForDiscount,
  selectedProductForDiscount,
  onTotalsChange = () => {},
  isEditing,
  setIsEditing,
}) {
  const { configData } = useContext(ConfigContext);
  const {
    selectedClient,
    setSelectedClient,
    selectedAddress,
    setSelectedAddress,
    resetToDefaultClientAndAddress,
  } = useContext(ClientContext);
  const {
    isDevolution,
    setIsDevolution,
    isDiscount,
    setIsDiscount,
    setOriginalPaymentMethods,
    setOriginalPaymentAmounts,
  } = useContext(CartContext);
  const { idProfile } = useContext(AuthContext);

  const addressModal = useToggle();
  const createCustomerModal = useToggle();
  const stepperModal = useToggle();
  const clientInfoModal = useToggle();
  const parkedCartsModal = useToggle();
  const nameModal = useToggle();
  const [ticketName, setTicketName] = useState(null);
  const pinModal = useToggle();
  const defaultClientId = configData?.id_customer_default;

  const isDefaultClient =
    selectedClient?.id_customer &&
    defaultClientId &&
    selectedClient.id_customer === defaultClientId;

  const clientLabel = selectedClient.full_name || "Seleccionar Cliente";

  const isCompact = useIsCompact();

  // Al hacer clic en el label
  const handleClientSplitButtonClick = () => {
    if (isDefaultClient) {
      // Abrir stepper 2 pasos
      stepperModal.open();
    } else {
      // Abrir info
      clientInfoModal.open();
    }
  };

  // Menú: “Buscar Cliente”
  const handleSearchClient = () => {
    stepperModal.open();
  };

  // Callback final del Stepper (step 0->1-> done)
  const handleStepperSelectClientAndAddress = (cli, addr) => {
    const newClient = {
      id_customer: cli.id_customer,
      id_default_group: cli.id_default_group,
      firstname: cli.firstname,
      lastname: cli.lastname,
      full_name: `${cli.firstname} ${cli.lastname}`,
    };
    setSelectedClient(newClient);
    setSelectedAddress(addr);
    localStorage.setItem("selectedClient", JSON.stringify(newClient));
    localStorage.setItem("selectedAddress", JSON.stringify(addr));
    stepperModal.close();
  };

  // Botón de crear cliente (dentro del Stepper)
  const handleCreateNewCustomer = () => {
    // Cerrar stepper, abrir CreateCustomer
    stepperModal.close();
    createCustomerModal.open();
  };

  // Una vez creado, se asigna
  const handleCreateNewCustomerComplete = (newClient, newAddress) => {
    const cliData = {
      id_customer: newClient.id_customer,
      firstname: newClient.firstname,
      lastname: newClient.lastname,
      full_name: `${newClient.firstname} ${newClient.lastname}`,
    };
    setSelectedClient(cliData);
    setSelectedAddress(newAddress);
    localStorage.setItem("selectedClient", JSON.stringify(cliData));
    localStorage.setItem("selectedAddress", JSON.stringify(newAddress));
    createCustomerModal.close();
  };

  const handleParkCart = () => {
    if (cartItems.length === 0) {
      alert("No hay productos en el carrito para aparcar.");
      return;
    }
    nameModal.open();
  };

  const handleSaveParkedCart = () => {
    if (ticketName.trim() === "") {
      alert("Introduce un nombre para el ticket.");
      return;
    }
    const extraData = {
      items: cartItems,
      discounts: appliedDiscounts,
      totals: {
        subtotal: subtotalProducts,
        totalDiscounts: totalDiscounts,
        total: total,
      },
    };
    saveCurrentCartAsParked(ticketName.trim(), extraData);
    setTicketName("");
    nameModal.close();
    handleClearCart();
  };

  const handleClearCart = () => {
    setCartItems([]);
    clearDiscounts();
    setIsDevolution(false);
    setIsDiscount(false);
    setSelectedProductForDiscount(null);
    setOriginalPaymentMethods([]);
    setOriginalPaymentAmounts({});
  };
  const parkedCarts = getParkedCarts();
  const handleLoadCart = (cartId) => {
    loadParkedCart(cartId);
    parkedCartsModal.close();
  };
  const handleDeleteCart = (cartId) => {
    if (window.confirm("¿Estás seguro de eliminar este ticket aparcado?")) {
      deleteParkedCart(cartId);
    }
  };

  const handleEditTicket = () => {
    if (!isEditing) {
      if (idProfile === 1) {
        const input = document.querySelector(
          'input[placeholder="Buscar por referencia o código de barras..."]'
        );
        if (input) input.blur();
        setIsEditing(true);
      } else {
        pinModal.open();
      }
    } else {
      setIsEditing(false);
    }
  };

  const handlePinSuccess = () => {
    const input = document.querySelector(
      'input[placeholder="Buscar por referencia o código de barras..."]'
    );
    if (input) input.blur();
    setIsEditing(true);
    pinModal.close();
  };

  const handlePriceChange = (id, value) => {
    setCartItems((prev) =>
      prev.map((item) =>
        getRowKey(item) === id
          ? { ...item, final_price_incl_tax: Number(value) }
          : item
      )
    );
  };

  const handleQuantityChange = (id, value) => {
    setCartItems((prev) =>
      prev.map((item) =>
        getRowKey(item) === id ? { ...item, quantity: Number(value) } : item
      )
    );
  };
  // === CALCULOS TOTALES

  const subtotalProducts = cartItems.reduce((sum, item) => {
    const subprice = item.final_price_incl_tax;
    return sum + subprice * item.quantity;
  }, 0);

  const totalDiscounts = cartItems.reduce((sum, item) => {
    // Only add discount amounts for products that actually have discounts applied
    if (item.discountApplied && item.discountAmount > 0) {
      return sum + item.discountAmount * item.quantity;
    }
    return sum;
  }, 0);

  const total = cartItems.reduce((sum, item) => {
    const price =
      item.discountApplied &&
      item.reduction_amount_tax_incl < item.final_price_incl_tax
        ? item.reduction_amount_tax_incl
        : item.final_price_incl_tax;
    return sum + price * item.quantity;
  }, 0);

  useEffect(() => {
    onTotalsChange({
      subtotal: subtotalProducts,
      total,
      totalDiscounts,
    });
  }, [
    cartItems,
    appliedDiscounts,
    subtotalProducts,
    total,
    totalDiscounts,
    onTotalsChange,
  ]);

  // Función para quitar descuento aplicado a un producto y eliminar el descuento en appliedDiscounts
  const removeProductDiscount = (uniqueId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        getRowKey(item) === uniqueId
          ? {
              ...item,
              reduction_amount_tax_incl: 0, // se establece a 0
              discountApplied: false,
              discountAmount: 0,
            }
          : item
      )
    );
    const product = cartItems.find((item) => getRowKey(item) === uniqueId);
    if (product) {
      // Utilizamos id_product y id_product_attribute para formar el identificador, en minúsculas
      const identifier =
        product.id_product && product.id_product_attribute
          ? `${product.id_product}-${product.id_product_attribute}`.toLowerCase()
          : "";
      appliedDiscounts.forEach((disc, index) => {
        if (disc.description) {
          const descLower = disc.description.toLowerCase();
          if (
            descLower.includes("producto") &&
            descLower.includes(identifier)
          ) {
            removeDiscountByIndex(index);
          }
        }
      });
    }
  };

  // Función para quitar el descuento global; se busca su índice en appliedDiscounts y se elimina,
  // y actualiza todos los productos para fijar su campo reduction_amount_tax_incl a 0.
  const removeGlobalDiscount = () => {
    const globalDiscount = appliedDiscounts.find(
      (disc) => disc.description && disc.description.includes("venta")
    );
    if (globalDiscount) {
      const idx = appliedDiscounts.findIndex((disc) => disc === globalDiscount);
      if (idx >= 0) {
        removeDiscountByIndex(idx);
      }
    }
    // Actualizar todos los productos: quitar el precio descuento y reduction_amount_tax_incl a 0
    setCartItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        reduction_amount_tax_incl: 0,
        discountApplied: false,
        discountAmount: 0,
      }))
    );
  };

  const actionBodyTemplate = (rowData) => {
    // Botón X: más grande, sin fondo; se aplica estilo para modo claro y oscuro (usa variables CSS)
    return (
      <Button
        tooltip="Eliminar"
        tooltipOptions={{ position: "right" }}
        icon="pi pi-times"
        className="p-button p-button-text"
        onClick={() => onRemoveProduct(getRowKey(rowData))}
      />
    );
  };

  const expandedRows = cartItems.filter(
    (item) => item.discountApplied && item.discountAmount > 0
  );

  const rowExpansionTemplate = (data) => (
    <div style={{ padding: "0rem 0rem 0rem 2rem " }}>
      <div className="flex justify-between items-center">
        <span>
          <strong>Descuento aplicado: </strong>
          {(data.discountAmount * data.quantity).toFixed(2)} €
        </span>
        <Button
          icon="pi pi-times"
          className="p-button-rounded p-button-danger p-button-text"
          tooltip="Quitar descuento"
          tooltipOptions={{ position: "right" }}
          onClick={() => removeProductDiscount(getRowKey(data))}
        />
      </div>
    </div>
  );

  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleRowClick = (e) => {
    if (selectedProduct && getRowKey(selectedProduct) === getRowKey(e.data)) {
      setSelectedProduct(null);
      setSelectedProductForDiscount(null);
    } else {
      setSelectedProduct(e.data);
      setSelectedProductForDiscount(e.data);
    }
  };

  useEffect(() => {
    if (!selectedProductForDiscount) {
      setSelectedProduct(null);
    }
  }, [selectedProductForDiscount]);

  // Efecto para resaltar el producto recién añadido
  useEffect(() => {
    if (recentlyAddedId) {
      const newProd = cartItems.find(
        (item) => getRowKey(item) === recentlyAddedId
      );
      if (newProd) {
        setSelectedProduct(newProd);
      }
    }
  }, [recentlyAddedId, cartItems]);

  // Función para definir clase en la fila seleccionada
  const rowClassName = (data) =>
    selectedProduct && getRowKey(data) === getRowKey(selectedProduct)
      ? "selected-row"
      : "";

  // Agregar filtro para descuentos globales (sobre venta) donde disc.description incluya "venta"
  const globalDiscounts = appliedDiscounts.filter(
    (disc) => disc.description && disc.description.includes("venta")
  );

  // Agregar antes del return la obtención del descuento global (solo se permite uno)
  const globalDiscount = globalDiscounts.length > 0 ? globalDiscounts[0] : null;

  // Agregar función helper para obtener el key único
  const getRowKey = (item) =>
    item.id_control_stock ? item.id_control_stock : item.id_stock_available;

  // Generar una lista con key dinámica para la DataTable
  const cartItemsWithKey = cartItems.map((item) => ({
    ...item,
    uniqueId: getRowKey(item),
  }));

  return (
    <div
      className="h-full flex flex-col p-3 relative"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      <div className="flex justify-between items-center gap-4">
        <div className="flex space-x-2 flex-1">
          <Button icon="pi pi-search" onClick={handleSearchClient} />
          <Button
            label={isCompact ? "" : clientLabel}
            icon="pi pi-users"
            tooltip={isCompact ? clientLabel : ""}
            tooltipOptions={isCompact ? { position: "top" } : {}}
            className={isCompact ? "" : "w-1/2"}
            onClick={handleClientSplitButtonClick}
          />
          <Button
            icon="pi pi-refresh"
            tooltip="Cliente por defecto"
            tooltipOptions={{ position: "top" }}
            onClick={resetToDefaultClientAndAddress}
          />
        </div>
        <div>
          <div className="flex space-x-2">
          <Button
            icon={isEditing ? "pi pi-save" : "pi pi-pencil"}
            tooltip={isEditing ? "Guardar edición" : "Editar Ticket"}
            tooltipOptions={{ position: "top" }}
            severity="warning"
            onClick={handleEditTicket}
          />
          <Button
            icon="pi pi-file-plus"
            tooltip="Guardar Ticket"
            tooltipOptions={{ position: "top" }}
            severity="warning"
            onClick={handleParkCart}
          />
            <Button
              label={isCompact ? "" : "Tickets"}
              tooltip={isCompact ? "Tickets" : ""}
              tooltipOptions={isCompact ? { position: "top" } : {}}
              icon="pi pi-list"
              severity="warning"
              onClick={() => setIsParkedCartsModalOpen(true)}
            />
            <Button
              icon="pi pi-trash"
              tooltip="Borrar Ticket"
              tooltipOptions={{ position: "top" }}
              severity="warning"
              onClick={handleClearCart}
            />
          </div>
        </div>
      </div>

      <Divider style={{ borderColor: "var(--surface-border)" }} />

      <div className="flex-1 overflow-auto relative">
        <DataTable
          value={cartItemsWithKey}
          dataKey="uniqueId"
          expandedRows={expandedRows}
          rowExpansionTemplate={rowExpansionTemplate}
          selectionMode="single"
          selection={selectedProduct}
          onRowClick={handleRowClick}
          rowClassName={rowClassName}
          className="custom-cell-padding"
          emptyMessage=" "
          footer={
            globalDiscount ? (
              <div className="p-datatable-footer flex justify-between items-center">
                <span>
                  Descuento de{" "}
                  {globalDiscount.reduction_percent
                    ? `${globalDiscount.reduction_percent}%`
                    : `${globalDiscount.reduction_amount} €`}{" "}
                  sobre la venta
                </span>
                <Button
                  icon="pi pi-times"
                  className="p-button-rounded p-button-danger p-button-text"
                  tooltip="Quitar descuento global"
                  onClick={removeGlobalDiscount}
                />
              </div>
            ) : null
          }
        >
          <Column
            body={(rowData) => (
              <i
                className={
                  rowData.id_stock_available ===
                  selectedProduct?.id_stock_available
                    ? "pi pi-circle-on"
                    : "pi pi-circle-off"
                }
              />
            )}
            style={{ width: "1%", textAlign: "center" }}
            alignHeader={"center"}
          />
          <Column
            field="id_control_stock"
            headerClassName="pi pi-link"
            style={{ display: "table-cell", width: "1%", textAlign: "center" }}
            alignHeader={"center"}
          />
          <Column
            body={(rowData) => {
              const hasCombination =
                rowData.product_name.includes("Talla") &&
                rowData.product_name.includes("Color");
              if (
                hasCombination &&
                rowData.reference_combination &&
                (!rowData.combination_name || rowData.combination_name === null)
              ) {
                const colorMatch =
                  rowData.product_name.match(/Color\s*:\s*([^-]+)/);
                const sizeMatch =
                  rowData.product_name.match(/Talla\s*:\s*(\S+)/);
                const color = colorMatch
                  ? colorMatch[1].trim().replace(/,$/, "")
                  : "";
                const size = sizeMatch
                  ? sizeMatch[1].trim().replace(/,$/, "")
                  : "";
                return `${rowData.reference_combination} - ${color} - ${size}`;
              }
              return rowData.product_name;
            }}
            header="Producto"
            style={{ width: "40%", textAlign: "left" }}
            alignHeader={"left"}
          />
          <Column
            header="Precio Und"
            body={(rowData) => {
              if (rowData.reference_combination === "rectificacion") return "-";
              if (isEditing) {
                return (
                  <InputNumber
                    value={rowData.final_price_incl_tax}
                    onValueChange={(e) =>
                      handlePriceChange(rowData.uniqueId, e.value)
                    }
                    min={0}
                    mode="currency"
                    currency="EUR"
                    locale="es-ES"
                  />
                );
              }
              if (isDevolution) {
                const originalPrice = rowData.price_incl_tax;
                if (
                  rowData.reduction_amount_tax_incl &&
                  rowData.reduction_amount_tax_incl !== 0 &&
                  rowData.reduction_amount_tax_incl < originalPrice
                ) {
                  return (
                    <div>
                      <span
                        style={{
                          textDecoration: "line-through",
                          fontSize: "0.85em",
                          opacity: "0.8",
                        }}
                      >
                        {originalPrice.toFixed(2)} €
                      </span>
                      <br />
                      <span
                        style={{
                          color: "var(--red-500)",
                          fontWeight: "bold",
                        }}
                      >
                        {rowData.reduction_amount_tax_incl.toFixed(2)} €
                      </span>
                    </div>
                  );
                } else {
                  return `${originalPrice.toFixed(2)} €`;
                }
              } else {
                const originalPrice = rowData.final_price_incl_tax;
                if (
                  rowData.discountApplied &&
                  rowData.reduction_amount_tax_incl < originalPrice
                ) {
                  return (
                    <div>
                      <span
                        style={{
                          textDecoration: "line-through",
                          fontSize: "0.85em",
                          opacity: "0.8",
                        }}
                      >
                        {originalPrice.toFixed(2)} €
                      </span>
                      <br />
                      <span
                        style={{
                          color: "var(--red-500)",
                          fontWeight: "bold",
                        }}
                      >
                        {rowData.reduction_amount_tax_incl.toFixed(2)} €
                      </span>
                    </div>
                  );
                } else {
                  return `${originalPrice.toFixed(2)} €`;
                }
              }
            }}
            style={{ width: "20%", textAlign: "center" }}
            alignHeader={"center"}
          />
          <Column
            header="Total"
            body={(rowData) => {
              if (rowData.reference_combination === "rectificacion") return "-";
              if (isDevolution) {
                const originalTotal = rowData.price_incl_tax * rowData.quantity;
                if (
                  rowData.reduction_amount_tax_incl &&
                  rowData.reduction_amount_tax_incl !== 0 &&
                  rowData.reduction_amount_tax_incl < rowData.price_incl_tax
                ) {
                  const discountedTotal =
                    rowData.reduction_amount_tax_incl * rowData.quantity;
                  return (
                    <div>
                      <span
                        style={{
                          textDecoration: "line-through",
                          fontSize: "0.85em",
                          opacity: "0.8",
                        }}
                      >
                        {originalTotal.toFixed(2)} €
                      </span>
                      <br />
                      <span
                        style={{
                          color: "var(--red-500)",
                          fontWeight: "bold",
                        }}
                      >
                        {discountedTotal.toFixed(2)} €
                      </span>
                    </div>
                  );
                } else {
                  return `${originalTotal.toFixed(2)} €`;
                }
              } else {
                const unitPrice = Number(rowData.final_price_incl_tax);
                const originalTotal = unitPrice * rowData.quantity;
                const discountedTotal =
                  Number(rowData.reduction_amount_tax_incl) * rowData.quantity;
                if (
                  rowData.discountApplied &&
                  rowData.reduction_amount_tax_incl <
                    rowData.final_price_incl_tax
                ) {
                  return (
                    <div>
                      <span
                        style={{
                          textDecoration: "line-through",
                          fontSize: "0.85em",
                          opacity: "0.8",
                        }}
                      >
                        {originalTotal.toFixed(2)} €
                      </span>
                      <br />
                      <span
                        style={{
                          color: "var(--red-500)",
                          fontWeight: "bold",
                        }}
                      >
                        {discountedTotal.toFixed(2)} €
                      </span>
                    </div>
                  );
                } else {
                  return `${originalTotal.toFixed(2)} €`;
                }
              }
            }}
            style={{ width: "20%", textAlign: "center" }}
            alignHeader={"center"}
          />
          <Column
            field="quantity"
            header="Cant."
            body={(rowData) =>
              rowData.reference_combination === "rectificacion" ? (
                "-"
              ) : isEditing ? (
                <InputNumber
                  value={rowData.quantity}
                  onValueChange={(e) =>
                    handleQuantityChange(rowData.uniqueId, e.value)
                  }
                  min={0}
                />
              ) : (
                rowData.quantity
              )
            }
            style={{ width: "5%", textAlign: "center" }}
            alignHeader={"center"}
          />
          <Column
            body={actionBodyTemplate}
            style={{ width: "1%", textAlign: "right" }}
            alignHeader={"right"}
          />
        </DataTable>
      </div>

      <Divider style={{ borderColor: "var(--surface-border)" }} />

      <div className="mt-2" style={{ borderColor: "var(--surface-border)" }}>
        <div className="flex justify-between items-center">
          <span className="text-xl font-medium">Subtotal Productos:</span>
          <span className="text-xl font-bold">
            {subtotalProducts.toFixed(2)} €
          </span>
        </div>
        {totalDiscounts > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-xl font-medium">Total Descuentos:</span>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--red-500)" }}
            >
              {totalDiscounts.toFixed(2)} €
            </span>
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <span className="text-2xl font-bold">TOTAL:</span>
          <span className="text-2xl font-extrabold">
            {Math.max(total).toFixed(2)} €
          </span>
        </div>
      </div>

      {/* =========== TICKETS APARCADOS =========== */}
      <ParkedCartsModal
        isOpen={parkedCartsModal.isOpen}
        onClose={parkedCartsModal.close}
        parkedCarts={parkedCarts}
        onLoadCart={handleLoadCart}
        onDeleteCart={handleDeleteCart}
      />

      {/* =========== NOMBRE TICKET APARCADO =========== */}
      <Dialog
        header="Guardar Ticket"
        visible={nameModal.isOpen}
        onHide={nameModal.close}
        modal
        draggable={false}
        resizable={false}
        style={{
          minWidth: "20%",
          minHeight: "20%",
        }}
      >
        <div className="p-4" style={{ color: "var(--text-color)" }}>
          <label className="block font-semibold mb-2">Nombre del Ticket:</label>
          <InputText
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            className="w-full p-2 mb-4"
            style={{
              borderColor: "var(--surface-border)",
              backgroundColor: "var(--surface-50)",
              color: "var(--text-color)",
            }}
            placeholder="Introduce un nombre para el ticket"
          />
          <div className="flex justify-end gap-2">
            <Button
              label="Cancelar"
              className="p-button-secondary"
              onClick={nameModal.close}
            />
            <Button
              label="Guardar"
              className="p-button-success"
              onClick={handleSaveParkedCart}
            />
          </div>
        </div>
      </Dialog>

      <PinValidationModal
        isOpen={pinModal.isOpen}
        onClose={pinModal.close}
        onSuccess={handlePinSuccess}
        reason="edición ticket"
      />

      {/* =========== MODAL ADDRESS (por si solo cambias dirección) =========== */}
      <AddressModal
        isOpen={addressModal.isOpen}
        onClose={addressModal.close}
        clientId={selectedClient?.id_customer}
        handleSelectAddress={(addr) => {
          setSelectedAddress(addr);
          addressModal.close();
          localStorage.setItem("selectedAddress", JSON.stringify(addr));
        }}
      />

      {/* =========== MODAL INFO CLIENTE =========== */}
      <ClientInfoDialog
        isOpen={clientInfoModal.isOpen}
        onClose={clientInfoModal.close}
        client={selectedClient}
      />

      {/* =========== MODAL STEPPER (2 pasos) =========== */}
      <CustomerStepperModal
        isOpen={stepperModal.isOpen}
        onClose={stepperModal.close}
        onSelectClientAndAddress={handleStepperSelectClientAndAddress}
        onCreateNewCustomer={handleCreateNewCustomer}
      />

      {/* =========== MODAL CREAR CLIENTE + DIRECCIÓN =========== */}
      <CreateCustomerModal
        isOpen={createCustomerModal.isOpen}
        onClose={createCustomerModal.close}
        onComplete={handleCreateNewCustomerComplete}
      />
    </div>
  );
}

export default SalesCard;
