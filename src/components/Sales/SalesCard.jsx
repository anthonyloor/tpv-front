// src/components/Sales/SalesCard.jsx

import React, { useState, useContext, useEffect, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import { SplitButton } from "primereact/splitbutton";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";

import { ClientContext } from "../../contexts/ClientContext";
import { ConfigContext } from "../../contexts/ConfigContext";
import { CartContext } from "../../contexts/CartContext";

import ParkedCartsModal from "../modals/parked/ParkedCartsModal";
import AddressModal from "../modals/customer/AddressModal";
import ClientInfoDialog from "../modals/customer/ClientInfoDialog";
import CustomerStepperModal from "../modals/customer/CustomerStepperModal";
import CreateCustomerModal from "../modals/customer/CreateCustomerModal";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

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

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] =
    useState(false);
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [isClientInfoOpen, setIsClientInfoOpen] = useState(false);
  const [isParkedCartsModalOpen, setIsParkedCartsModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [ticketName, setTicketName] = useState("");
  const defaultClientId = configData?.id_customer_default;

  const isDefaultClient =
    selectedClient?.id_customer &&
    defaultClientId &&
    selectedClient.id_customer === defaultClientId;

  const clientLabel = isDefaultClient
    ? "Cliente TPV"
    : selectedClient.full_name || "Seleccionar Cliente";

  // Al hacer clic en el label
  const handleClientSplitButtonClick = () => {
    if (isDefaultClient) {
      // Abrir stepper 2 pasos
      setIsStepperOpen(true);
    } else {
      // Abrir info
      setIsClientInfoOpen(true);
    }
  };

  // Menú: “Buscar Cliente”
  const handleSearchClient = () => {
    setIsStepperOpen(true);
  };

  // Callback final del Stepper (step 0->1-> done)
  const handleStepperSelectClientAndAddress = (cli, addr) => {
    const newClient = {
      id_customer: cli.id_customer,
      firstname: cli.firstname,
      lastname: cli.lastname,
      full_name: `${cli.firstname} ${cli.lastname}`,
    };
    setSelectedClient(newClient);
    setSelectedAddress(addr);
    localStorage.setItem("selectedClient", JSON.stringify(newClient));
    localStorage.setItem("selectedAddress", JSON.stringify(addr));
    setIsStepperOpen(false);
  };

  // Botón de crear cliente (dentro del Stepper)
  const handleCreateNewCustomer = () => {
    // Cerrar stepper, abrir CreateCustomer
    setIsStepperOpen(false);
    setIsCreateCustomerModalOpen(true);
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
    setIsCreateCustomerModalOpen(false);
  };

  const handleParkCart = () => {
    if (cartItems.length === 0) {
      alert("No hay productos en el carrito para aparcar.");
      return;
    }
    setIsNameModalOpen(true);
  };

  const handleSaveParkedCart = () => {
    if (ticketName.trim() === "") {
      alert("Introduce un nombre para el ticket.");
      return;
    }
    saveCurrentCartAsParked(ticketName.trim());
    setTicketName("");
    setIsNameModalOpen(false);
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
    setIsParkedCartsModalOpen(false);
  };
  const handleDeleteCart = (cartId) => {
    if (window.confirm("¿Estás seguro de eliminar este ticket aparcado?")) {
      deleteParkedCart(cartId);
    }
  };
  // === CALCULOS TOTALES

  const subtotalProducts = cartItems.reduce((sum, item) => {
    const subprice =
      item.discountApplied &&
      item.reduction_amount_tax_incl < item.final_price_incl_tax
        ? item.reduction_amount_tax_incl
        : item.final_price_incl_tax;
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
    console.log("item", item);
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
  const removeProductDiscount = (idStockAvailable) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id_stock_available === idStockAvailable
          ? {
              ...item,
              reduction_amount_tax_incl: 0, // se establece a 0
              discountApplied: false,
              discountAmount: 0,
            }
          : item
      )
    );
    const product = cartItems.find(
      (item) => item.id_stock_available === idStockAvailable
    );
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
        icon="pi pi-times"
        className="p-button p-button-text"
        onClick={() => onRemoveProduct(rowData.id_stock_available)}
      />
    );
  };

  const expandedRows = cartItems.filter(
    (item) => item.discountApplied && item.discountAmount > 0
  );

  const rowExpansionTemplate = (data) => (
    <div style={{ backgroundColor: "var(--surface-50)" }}>
      <div className="flex justify-between items-center">
        <span>
          <strong>Descuento aplicado: </strong>
          {(data.discountAmount * data.quantity).toFixed(2)} €
        </span>
        <Button
          icon="pi pi-times"
          className="p-button-rounded p-button-danger p-button-text"
          tooltip="Quitar descuento"
          onClick={() => removeProductDiscount(data.id_stock_available)}
        />
      </div>
    </div>
  );

  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleRowClick = (e) => {
    if (
      selectedProduct &&
      selectedProduct.id_stock_available === e.data.id_stock_available
    ) {
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

  // Función para definir clase en la fila seleccionada
  const rowClassName = (data) =>
    selectedProduct &&
    data.id_stock_available === selectedProduct.id_stock_available
      ? "selected-row"
      : "";

  // Agregar filtro para descuentos globales (sobre venta) donde disc.description incluya "venta"
  const globalDiscounts = appliedDiscounts.filter(
    (disc) => disc.description && disc.description.includes("venta")
  );

  // Agregar antes del return la obtención del descuento global (solo se permite uno)
  const globalDiscount = globalDiscounts.length > 0 ? globalDiscounts[0] : null;

  return (
    <div
      className="h-full flex flex-col p-3 relative"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <SplitButton
            label={clientLabel}
            icon="pi pi-users"
            onClick={handleClientSplitButtonClick}
            model={[
              {
                label: "Buscar cliente",
                icon: "pi pi-search",
                command: handleSearchClient,
              },
              {
                label: "Cambiar dirección",
                icon: "pi pi-map-marker",
                command: () => setIsAddressModalOpen(true),
              },
              {
                label: "Cliente por defecto",
                icon: "pi pi-refresh",
                command: resetToDefaultClientAndAddress,
              },
            ]}
            className="w-full"
          />
        </div>
        <div>
          <SplitButton
            label="Tickets"
            tooltip="Ver tickets aparcados"
            tooltipOptions={{ position: "bottom" }}
            icon="pi pi-receipt"
            onClick={() => setIsParkedCartsModalOpen(true)}
            model={[
              {
                label: "Tickets Aparcados",
                icon: "pi pi-list",
                command: () => setIsParkedCartsModalOpen(true),
              },
              {
                label: "Guardar Ticket",
                icon: "pi pi-file-plus",
                command: handleParkCart,
              },
              {
                label: "Borrar Ticket",
                icon: "pi pi-trash",
                command: handleClearCart,
              },
            ]}
            className="p-button-warning"
          />
        </div>
      </div>

      <Divider style={{ borderColor: "var(--surface-border)" }} />

      <div className="flex-1 overflow-auto relative">
        {cartItems.length > 0 ? (
          <>
            <DataTable
              value={cartItems}
              dataKey="id_stock_available"
              expandedRows={expandedRows}
              rowExpansionTemplate={rowExpansionTemplate}
              selectionMode="single"
              selection={selectedProduct}
              onRowClick={handleRowClick}
              rowClassName={rowClassName}
              className="custom-cell-padding"
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
                header=""
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
                style={{ width: "3%", textAlign: "center" }}
              />
              <Column
                field="product_name"
                header="Producto"
                style={{ width: "50%" }}
              />
              <Column
                header="Precio Und"
                body={(rowData) => {
                  if (rowData.reference_combination === "rectificacion")
                    return "-";
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
              />
              <Column
                header="Total"
                body={(rowData) => {
                  if (rowData.reference_combination === "rectificacion")
                    return "-";
                  if (isDevolution) {
                    const originalTotal =
                      rowData.price_incl_tax * rowData.quantity;
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
                      Number(rowData.reduction_amount_tax_incl) *
                      rowData.quantity;
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
                style={{ width: "13%", textAlign: "center" }}
              />
              <Column
                field="quantity"
                header="Cant."
                body={(rowData) =>
                  rowData.reference_combination === "rectificacion"
                    ? "-"
                    : rowData.quantity
                }
                style={{ textAlign: "center" }}
              />
              <Column
                body={actionBodyTemplate}
                style={{ textAlign: "center" }}
              />
            </DataTable>
          </>
        ) : (
          <p>No hay productos en el ticket.</p>
        )}
      </div>

      <div
        className="mt-4 pt-4 border-t"
        style={{ borderColor: "var(--surface-border)" }}
      >
        <div className="flex justify-between items-center">
          <span className="text-xl font-medium">Subtotal Productos:</span>
          <span className="text-xl font-bold">
            {subtotalProducts.toFixed(2)} €
          </span>
        </div>
        {appliedDiscounts.length > 0 && (
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
        isOpen={isParkedCartsModalOpen}
        onClose={() => setIsParkedCartsModalOpen(false)}
        parkedCarts={parkedCarts}
        onLoadCart={handleLoadCart}
        onDeleteCart={handleDeleteCart}
      />

      {/* =========== NOMBRE TICKET APARCADO =========== */}
      <Dialog
        header="Guardar Ticket Aparcado"
        visible={isNameModalOpen}
        onHide={() => setIsNameModalOpen(false)}
        modal
        style={{ width: "30vw", backgroundColor: "var(--surface-0)" }}
      >
        <div className="p-4" style={{ color: "var(--text-color)" }}>
          <label className="block font-semibold mb-2">Nombre del Ticket:</label>
          <input
            type="text"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            className="w-full p-2 border rounded mb-4"
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
              onClick={() => setIsNameModalOpen(false)}
            />
            <Button
              label="Guardar"
              className="p-button-success"
              onClick={handleSaveParkedCart}
            />
          </div>
        </div>
      </Dialog>

      {/* =========== MODAL ADDRESS (por si solo cambias dirección) =========== */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        clientId={selectedClient?.id_customer}
        handleSelectAddress={(addr) => {
          setSelectedAddress(addr);
          setIsAddressModalOpen(false);
          localStorage.setItem("selectedAddress", JSON.stringify(addr));
        }}
      />

      {/* =========== MODAL INFO CLIENTE =========== */}
      <ClientInfoDialog
        isOpen={isClientInfoOpen}
        onClose={() => setIsClientInfoOpen(false)}
        client={selectedClient}
      />

      {/* =========== MODAL STEPPER (2 pasos) =========== */}
      <CustomerStepperModal
        isOpen={isStepperOpen}
        onClose={() => setIsStepperOpen(false)}
        onSelectClientAndAddress={handleStepperSelectClientAndAddress}
        onCreateNewCustomer={handleCreateNewCustomer}
      />

      {/* =========== MODAL CREAR CLIENTE + DIRECCIÓN =========== */}
      <CreateCustomerModal
        isOpen={isCreateCustomerModalOpen}
        onClose={() => setIsCreateCustomerModalOpen(false)}
        onComplete={handleCreateNewCustomerComplete}
      />
    </div>
  );
}

export default SalesCard;
