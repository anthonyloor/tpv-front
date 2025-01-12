// src/components/modals/parked/ParkedCartsModal.jsx

import React from 'react';
import Modal from '../Modal';

const ParkedCartsModal = ({
  isOpen,
  onClose,
  parkedCarts,
  onLoadCart,
  onDeleteCart,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tickets Aparcados" size="md" height="md">
      <div className="p-4">
        {parkedCarts.length === 0 ? (
          <p>No hay carritos aparcados.</p>
        ) : (
          <ul>
            {parkedCarts.map((cart) => (
              <li key={cart.id} className="mb-4 border-b pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{cart.name}</h4>
                    <p className="text-sm text-gray-500">
                      Guardado el: {new Date(cart.savedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                      onClick={() => onLoadCart(cart.id)}
                    >
                      Cargar Ticket
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() => onDeleteCart(cart.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

export default ParkedCartsModal;