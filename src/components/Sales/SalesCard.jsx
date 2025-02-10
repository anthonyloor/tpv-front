// src/components/Sales/SalesCard.jsx

import React, { useState, useContext } from "react";
import ParkedCartsModal from "../modals/parked/ParkedCartsModal";
import Modal from "../modals/Modal";
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

  // Estados para los modals de ticket aparcado
  const [isParkedCartsModalOpen, setIsParkedCartsModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [ticketName, setTicketName] = useState("");

  // Subtotales y totales
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

  // Lógica de Cliente y Dirección (movida del Navbar)
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
    <div className="p-4 h-full flex flex-col relative">
      {/* Cabecera: SplitButton de Cliente / Dirección y SplitButton de Tickets */}
      <div className="mb-4 flex items-center justify-between">
        {/* SplitButton para Cliente / Dirección */}
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
        />

        {/* SplitButton de Tickets */}
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

      <Divider className="border-t" />

      {/* Lista de productos */}
      <div className="relative z-10 flex-grow overflow-auto">
        <h4 className="font-bold text-lg mb-2">Productos en el Ticket</h4>
        {cartItems.length > 0 ? (
          <ul className="space-y-2">
            {cartItems.map((item) => {
              const totalItem = item.final_price_incl_tax * item.quantity;
              const isHighlighted =
                item.id_stock_available === recentlyAddedId;
              return (
                <li
                  key={item.id_stock_available}
                  className={`border p-2 rounded flex flex-col md:flex-row md:justify-between md:items-center ${
                    isHighlighted ? "animate-product" : ""
                  }`}
                >
                  <div>
                    <span className="font-bold">{item.quantity}x </span>
                    {item.product_name} {item.combination_name}
                  </div>
                  <div className="text-right md:text-left md:w-32">
                    <div>
                      P/U: {item.final_price_incl_tax.toFixed(2)} €
                    </div>
                    <div className="font-semibold">
                      Total: {totalItem.toFixed(2)} €
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0 flex space-x-2">
                    <Button
                      label="-"
                      className="p-button-danger"
                      onClick={() =>
                        onDecreaseProduct(item.id_stock_available)
                      }
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
        <div className="mt-4 bg-green-50 p-3 rounded">
          <h4 className="font-bold text-lg mb-2">Descuentos Aplicados</h4>
          <ul className="space-y-2">
            {appliedDiscounts.map((disc, index) => {
              const label =
                disc.reduction_percent > 0
                  ? `${disc.reduction_percent}%`
                  : `${disc.reduction_amount?.toFixed(2) || "0.00"} €`;
              return (
                <li
                  key={index}
                  className="p-2 border rounded flex flex-col md:flex-row md:justify-between md:items-center"
                >
                  <div>
                    <div className="font-bold">{disc.name || disc.code}</div>
                    {disc.code && disc.name && (
                      <div className="text-xs text-gray-600">
                        ({disc.code})
                      </div>
                    )}
                  </div>
                  <div className="text-right md:text-left md:w-32 font-semibold">
                    {label}
                  </div>
                  <div className="mt-2 md:mt-0 flex space-x-2">
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
      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-xl font-medium">Subtotal Productos:</span>
          <span className="text-xl font-bold">
            {subtotalProducts.toFixed(2)} €
          </span>
        </div>
        {appliedDiscounts.length > 0 && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-xl font-medium">Total Descuentos:</span>
            <span className="text-xl font-bold text-red-600">
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

      {/* MODAL TICKETS APARCADOS */}
      <ParkedCartsModal
        isOpen={isParkedCartsModalOpen}
        onClose={() => setIsParkedCartsModalOpen(false)}
        parkedCarts={parkedCarts}
        onLoadCart={handleLoadCart}
        onDeleteCart={handleDeleteCart}
      />

      {/* MODAL INTRODUCIR NOMBRE DEL TICKET */}
      <Modal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        title="Guardar Ticket Aparcado"
        showCloseButton
      >
        <div className="p-4">
          <label className="block mb-2 font-semibold">
            Nombre del Ticket:
          </label>
          <input
            type="text"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            className="w-full border rounded p-2 mb-4"
            placeholder="Introduce un nombre para el ticket"
          />
          <div className="flex justify-end space-x-2">
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
      </Modal>

      {/* MODALES DE CLIENTE Y DIRECCIÓN */}
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