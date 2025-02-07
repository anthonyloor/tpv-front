// src/components/Sales/SalesCard.jsx

import React, { useState, useContext } from "react";
import ParkedCartsModal from "../modals/parked/ParkedCartsModal";
import Modal from "../modals/Modal";
import { ClientContext } from "../../contexts/ClientContext";
import AddressModal from "../modals/customer/AddressModal";
import ClientModal from "../modals/customer/CustomerModal";
import CreateCustomerModal from "../modals/customer/CreateCustomerModal";
import { SplitButton } from "primereact/splitbutton";

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
  // -- ESTADOS para las lógicas de cliente y dirección (antes en NavbarCard) --
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

  // Manejo de modals aparcar ticket
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

  // ------------------ Lógica movida del Navbar: Cliente y Dirección ------------------
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
  // -------------------------------------------------------------------------------

  return (
    <div className="p-4 h-full flex flex-col relative">
      {/* Cabecera: CLIENTE / DIRECCIÓN (movido desde Navbar) + Botones aparcar */}
      <div className="mb-4 flex items-center justify-between">
        {/* -- Bloque Cliente y Dirección -- */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{selectedClient.full_name}</span>
          <button
            className="bg-gray-200 p-2 rounded"
            onClick={() => setIsClientModalOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="h-5 w-5"
            >
              <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122Z" />
            </svg>
          </button>

          {selectedClient.id_customer !== 0 && (
            <button
              className="bg-gray-200 p-2 rounded font-bold text-black"
              onClick={resetToDefaultClientAndAddress}
            >
              P
            </button>
          )}

          {selectedClient.id_customer !== 0 && (
            <>
              <span className="font-semibold">
                {selectedAddress ? selectedAddress.alias : "Sin dirección"}
              </span>
              <button
                className="bg-gray-200 p-2 rounded"
                onClick={() => setIsAddressModalOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                >
                  <path d="M12 2.25C7.168 2.25 3.25 6.168 3.25 11c0 6.1 7.034 10.993 8.377 11.78a.75.75 0 1 0 .746 0C13.716 21.993 20.75 17.1 20.75 11c0-4.832-3.918-8.75-8.75-8.75zm0 13a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* -- Botones de aparcar adaptados -- */}
        <div className="flex space-x-2">
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

      {/* Lista de productos */}
      <div className="relative z-10 flex-grow overflow-auto">
        <h4 className="font-bold text-lg mb-2">Productos en el Ticket</h4>
        {cartItems.length > 0 ? (
          <ul className="space-y-2">
            {cartItems.map((item) => {
              const totalItem = item.final_price_incl_tax * item.quantity;
              const isHighlighted = item.id_stock_available === recentlyAddedId;
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
                    <div>P/U: {item.final_price_incl_tax.toFixed(2)} €</div>
                    <div className="font-semibold">
                      Total: {totalItem.toFixed(2)} €
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0 flex space-x-2">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => onDecreaseProduct(item.id_stock_available)}
                    >
                      -
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => onRemoveProduct(item.id_stock_available)}
                    >
                      X
                    </button>
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
                      <div className="text-xs text-gray-600">({disc.code})</div>
                    )}
                  </div>
                  <div className="text-right md:text-left md:w-32 font-semibold">
                    {label}
                  </div>
                  <div className="mt-2 md:mt-0 flex space-x-2">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => removeDiscountByIndex(index)}
                    >
                      Quitar
                    </button>
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
          <label className="block mb-2 font-semibold">Nombre del Ticket:</label>
          <input
            type="text"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            className="w-full border rounded p-2 mb-4"
            placeholder="Introduce un nombre para el ticket"
          />
          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-300 text-black px-4 py-2 rounded"
              onClick={() => setIsNameModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={handleSaveParkedCart}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* MODALES MOVIDOS DEL NAVBAR (CLIENTE Y DIRECCIÓN) */}
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
            // Manejar selección automática del cliente y dirección
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
