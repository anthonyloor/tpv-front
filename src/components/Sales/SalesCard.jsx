// src/components/Sales/SalesCard.jsx
import React, { useState } from 'react';
import ParkedCartsModal from '../modals/parked/ParkedCartsModal';
import Modal from '../modals/Modal';

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
  // --- ESTADOS solo para aparcar ticket ---
  const [isParkedCartsModalOpen, setIsParkedCartsModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [ticketName, setTicketName] = useState('');

  // Subtotal
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
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // --- FUNCIONES de aparcar y borrar ticket ---
  const handleParkCart = () => {
    if (cartItems.length === 0) {
      alert('No hay productos en el carrito para aparcar.');
      return;
    }
    setIsNameModalOpen(true);
  };

  const handleSaveParkedCart = () => {
    if (ticketName.trim() === '') {
      alert('Introduce un nombre para el ticket.');
      return;
    }
    saveCurrentCartAsParked(ticketName.trim());
    setTicketName('');
    setIsNameModalOpen(false);
    handleClearCart();
  };

  const handleClearCart = () => {
    setCartItems([]);
    clearDiscounts();
  };

  // tickets aparcados
  const parkedCarts = getParkedCarts();
  const handleLoadCart = (cartId) => {
    loadParkedCart(cartId);
    setIsParkedCartsModalOpen(false);
  };
  const handleDeleteCart = (cartId) => {
    if (window.confirm('¿Estás seguro de eliminar este ticket aparcado?')) {
      deleteParkedCart(cartId);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col relative">
      {/* Cabecera: número items y botones de aparcar/borrar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="bg-orange-500 text-white px-3 py-1 rounded-full">
          {totalItems}
        </div>
        <div className="flex space-x-2">
          {/* Botón Tickets aparcados */}
          <button
            className="bg-yellow-500 text-white p-2 rounded"
            onClick={() => setIsParkedCartsModalOpen(true)}
          >
            Tickets Aparcados
          </button>
          <button className="bg-gray-200 p-2 rounded" onClick={handleParkCart}>
            Guardar Ticket
          </button>
          <button className="bg-gray-200 p-2 rounded" onClick={handleClearCart}>
            Borrar Ticket
          </button>
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
                    isHighlighted ? 'animate-product' : ''
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
              const label = disc.reduction_percent > 0
                ? `${disc.reduction_percent}%`
                : `${disc.reduction_amount?.toFixed(2) || '0.00'} €`;
              return (
                <li
                  key={index}
                  className="p-2 border rounded flex flex-col md:flex-row md:justify-between md:items-center"
                >
                  <div>
                    <div className="font-bold">
                      {disc.name || disc.code}
                    </div>
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
          <span className="text-xl font-bold">{subtotalProducts.toFixed(2)} €</span>
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

      {/* MODALS RELACIONADOS CON TICKETS APARCADOS */}
      <ParkedCartsModal
        isOpen={isParkedCartsModalOpen}
        onClose={() => setIsParkedCartsModalOpen(false)}
        parkedCarts={parkedCarts}
        onLoadCart={handleLoadCart}
        onDeleteCart={handleDeleteCart}
      />

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
            <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={() => setIsNameModalOpen(false)}>
              Cancelar
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleSaveParkedCart}>
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SalesCard;