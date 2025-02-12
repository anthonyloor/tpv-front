// src/components/Sales/SalesCard.jsx

import React, { useState, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { SplitButton } from "primereact/splitbutton";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";

import { ClientContext } from "../../contexts/ClientContext";
import { ConfigContext } from "../../contexts/ConfigContext";

import ParkedCartsModal from "../modals/parked/ParkedCartsModal";
import AddressModal from "../modals/customer/AddressModal";
import ClientInfoDialog from "../modals/customer/ClientInfoDialog";
import CustomerStepperModal from "../modals/customer/CustomerStepperModal";
import CreateCustomerModal from "../modals/customer/CreateCustomerModal";

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
}) {
  // === CONTEXTS
  const { configData } = useContext(ConfigContext);
  const {
    selectedClient,
    setSelectedClient,
    selectedAddress,
    setSelectedAddress,
    resetToDefaultClientAndAddress,
  } = useContext(ClientContext);

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
  const subtotalProducts = cartItems.reduce(
    (sum, item) => sum + item.final_price_incl_tax * item.quantity,
    0
  );
  let totalDiscounts = 0;
  appliedDiscounts.forEach((disc) => {
    if (disc.reduction_percent > 0) {
      totalDiscounts += (subtotalProducts * disc.reduction_percent) / 100;
    } else if (disc.reduction_amount > 0) {
      totalDiscounts += Math.min(subtotalProducts, disc.reduction_amount);
    }
  });
  const total = subtotalProducts - totalDiscounts;

  const shop = JSON.parse(localStorage.getItem("shop"));

  return (
    <div
      className="h-full flex flex-col p-3 relative"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-4 gap-4">
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

      {/* LISTA PRODUCTOS */}
      <div className="flex-1 overflow-auto relative">
        <h4 className="font-bold text-lg mb-2">Productos en el Ticket</h4>
        {cartItems.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {cartItems.map((item) => {
              const totalItem = item.final_price_incl_tax * item.quantity;
              const isHighlighted = item.id_stock_available === recentlyAddedId;

              return (
                <li
                  key={item.id_stock_available}
                  className="border p-3 flex flex-col gap-2 rounded"
                  style={{
                    borderColor: "var(--surface-border)",
                    backgroundColor: isHighlighted
                      ? "var(--primary-color)"
                      : "var(--surface-0)",
                    color: isHighlighted ? "#fff" : "var(--text-color)",
                  }}
                >
                  <div>
                    <strong>{item.quantity}x</strong> {item.product_name}{" "}
                    {item.combination_name}
                  </div>
                  <div className="text-right">
                    <div>P/U: {item.final_price_incl_tax.toFixed(2)} €</div>
                    <div className="font-bold">
                      Total: {totalItem.toFixed(2)} €
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Button
                      label="-"
                      className="p-button-danger"
                      onClick={() => onDecreaseProduct(item.id_stock_available)}
                    />
                    <Button
                      label="X"
                      className="p-button-danger"
                      onClick={() => onRemoveProduct(item.id_stock_available)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No hay productos en el ticket.</p>
        )}
      </div>

      {/* DESCUENTOS */}
      {appliedDiscounts.length > 0 && (
        <div
          className="p-3 rounded mt-4"
          style={{
            backgroundColor: "var(--surface-50)",
            color: "var(--text-color)",
          }}
        >
          <h4 className="font-bold text-lg mb-2">Descuentos Aplicados</h4>
          <ul className="flex flex-col gap-2">
            {appliedDiscounts.map((disc, index) => {
              const label =
                disc.reduction_percent > 0
                  ? `${disc.reduction_percent}%`
                  : `${disc.reduction_amount?.toFixed(2) || "0.00"} €`;

              return (
                <li
                  key={index}
                  className="border rounded p-3 flex flex-col gap-2"
                  style={{
                    borderColor: "var(--surface-border)",
                    backgroundColor: "var(--surface-0)",
                  }}
                >
                  <div>
                    <strong>{disc.name || disc.code}</strong>
                    {disc.code && disc.name && (
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        ({disc.code})
                      </div>
                    )}
                  </div>
                  <div className="text-right font-bold">{label}</div>
                  <div>
                    <Button
                      label="Quitar"
                      className="p-button-danger"
                      onClick={() => removeDiscountByIndex(index)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* TOTALES */}
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
            {Math.max(0, total).toFixed(2)} €
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
        shop={shop}
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
