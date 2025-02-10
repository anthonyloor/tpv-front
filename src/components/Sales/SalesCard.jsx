// src/components/Sales/SalesCard.jsx

import React, { useState, useContext } from "react";
import ParkedCartsModal from "../modals/parked/ParkedCartsModal";
import { Dialog } from "primereact/dialog";
import { ClientContext } from "../../contexts/ClientContext";
import AddressModal from "../modals/customer/AddressModal";
import ClientModal from "../modals/customer/CustomerModal";
import CreateCustomerModal from "../modals/customer/CreateCustomerModal";
import { SplitButton } from "primereact/splitbutton";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";

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
  // Estados para cliente y dirección
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);

  const {
    selectedClient,
    setSelectedClient,
    selectedAddress,
    setSelectedAddress,
    resetToDefaultClientAndAddress,
  } = useContext(ClientContext);

  // Estados para modales de ticket aparcado
  const [isParkedCartsModalOpen, setIsParkedCartsModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [ticketName, setTicketName] = useState("");

  // Cálculos de totales
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

  // Funciones para aparcar ticket
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

  // ParkedCarts
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

  // Lógica de Cliente y Dirección
  const shop = JSON.parse(localStorage.getItem("shop"));

  const handleCreateNewCustomer = () => {
    setShowCreateCustomerModal(true);
  };

  const handleSelectClientAndAddress = (client, address) => {
    const clientData = {
      id_customer: client.id_customer,
      firstname: client.firstname,
      lastname: client.lastname,
      full_name: `${client.firstname} ${client.lastname}`,
    };
    setSelectedClient(clientData);
    setSelectedAddress(address);
    setIsClientModalOpen(false);
    localStorage.setItem("selectedClient", JSON.stringify(clientData));
    localStorage.setItem("selectedAddress", JSON.stringify(address));
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setIsAddressModalOpen(false);
    localStorage.setItem("selectedAddress", JSON.stringify(address));
  };

  return (
    <div
      className="p-p-4"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Cabecera: SplitButton de Cliente/Dirección y Tickets */}
      <div className="p-d-flex p-jc-between p-ai-center p-mb-4">
        <div style={{ flex: 1, marginRight: "1rem" }}>
          <SplitButton
            label={selectedClient.full_name}
            icon="pi pi-users"
            model={[
              {
                label: "Cambiar cliente",
                icon: "pi pi-users",
                command: () => setIsClientModalOpen(true),
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
            className="p-button"
            style={{ width: "100%" }}
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

      <Divider />

      {/* Lista de productos */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        <h4
          style={{
            fontWeight: "bold",
            fontSize: "1.125rem",
            marginBottom: "0.5rem",
          }}
        >
          Productos en el Ticket
        </h4>
        {cartItems.length > 0 ? (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {cartItems.map((item) => {
              const totalItem = item.final_price_incl_tax * item.quantity;
              const isHighlighted = item.id_stock_available === recentlyAddedId;
              return (
                <li
                  key={item.id_stock_available}
                  style={{
                    border: "1px solid var(--surface-border)",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    backgroundColor: isHighlighted
                      ? "var(--primary-color)"
                      : "white",
                    color: isHighlighted ? "white" : "inherit",
                  }}
                >
                  <div>
                    <strong>{item.quantity}x</strong> {item.product_name}{" "}
                    {item.combination_name}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>P/U: {item.final_price_incl_tax.toFixed(2)} €</div>
                    <div style={{ fontWeight: "bold" }}>
                      Total: {totalItem.toFixed(2)} €
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
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

      {/* Descuentos aplicados */}
      {appliedDiscounts.length > 0 && (
        <div
          style={{
            marginTop: "1rem",
            backgroundColor: "var(--surface-100)",
            padding: "1rem",
            borderRadius: "0.5rem",
          }}
        >
          <h4
            style={{
              fontWeight: "bold",
              fontSize: "1.125rem",
              marginBottom: "0.5rem",
            }}
          >
            Descuentos Aplicados
          </h4>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {appliedDiscounts.map((disc, index) => {
              const label =
                disc.reduction_percent > 0
                  ? `${disc.reduction_percent}%`
                  : `${disc.reduction_amount?.toFixed(2) || "0.00"} €`;
              return (
                <li
                  key={index}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "0.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <strong>{disc.name || disc.code}</strong>
                    {disc.code && disc.name && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ({disc.code})
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", fontWeight: "bold" }}>
                    {label}
                  </div>
                  <div style={{ marginTop: "0.5rem" }}>
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

      {/* Totales */}
      <div
        style={{
          marginTop: "1rem",
          borderTop: "1px solid var(--surface-border)",
          paddingTop: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "1.25rem", fontWeight: 500 }}>
            Subtotal Productos:
          </span>
          <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
            {subtotalProducts.toFixed(2)} €
          </span>
        </div>
        {appliedDiscounts.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1.25rem", fontWeight: 500 }}>
              Total Descuentos:
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "var(--red-500)",
              }}
            >
              {totalDiscounts.toFixed(2)} €
            </span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "0.5rem",
          }}
        >
          <span style={{ fontSize: "2rem", fontWeight: "bold" }}>TOTAL:</span>
          <span style={{ fontSize: "2rem", fontWeight: 800 }}>
            {Math.max(0, total).toFixed(2)} €
          </span>
        </div>
      </div>

      {/* Modal: Tickets Aparcados */}
      <ParkedCartsModal
        isOpen={isParkedCartsModalOpen}
        onClose={() => setIsParkedCartsModalOpen(false)}
        parkedCarts={parkedCarts}
        onLoadCart={handleLoadCart}
        onDeleteCart={handleDeleteCart}
      />

      {/* Modal: Introducir nombre del ticket */}
      <Dialog
        header="Guardar Ticket Aparcado"
        visible={isNameModalOpen}
        onHide={() => setIsNameModalOpen(false)}
        modal
        style={{ width: "30vw" }}
      >
        <div style={{ padding: "1rem" }}>
          <label
            style={{
              marginBottom: "0.5rem",
              fontWeight: 600,
              display: "block",
            }}
          >
            Nombre del Ticket:
          </label>
          <input
            type="text"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid var(--surface-border)",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
            placeholder="Introduce un nombre para el ticket"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
            }}
          >
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

      {/* Modales de Cliente y Dirección */}
      {isClientModalOpen && (
        <ClientModal
          isOpen={true}
          onClose={() => setIsClientModalOpen(false)}
          handleSelectClientAndAddress={handleSelectClientAndAddress}
          onCreateNewCustomer={handleCreateNewCustomer}
        />
      )}

      {showCreateCustomerModal && (
        <CreateCustomerModal
          isOpen={true}
          onClose={() => setShowCreateCustomerModal(false)}
          onComplete={(newClient, newAddress) => {
            // Selección automática del cliente y dirección
            handleSelectClientAndAddress(newClient, newAddress);
          }}
        />
      )}

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        clientId={selectedClient.id_customer}
        handleSelectAddress={handleSelectAddress}
        shop={shop}
      />
    </div>
  );
}

export default SalesCard;
