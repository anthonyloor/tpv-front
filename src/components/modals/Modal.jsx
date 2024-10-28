import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null; // No mostrar nada si el modal está cerrado

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-500 ease-in-out">
      <div className="bg-white rounded-lg shadow-lg p-6 w-2/4 relative transform transition-transform duration-500 ease-in-out">
        <div className="absolute top-2 right-4">
          <button
            className="text-black text-2xl hover:text-gray-700"
            style={{ marginTop: '10px', marginRight: '15px', lineHeight: '3rem', fontSize: '2rem' }}
            onClick={onClose}
            aria-label="Cerrar"
          >
            x
          </button>
        </div>
        {/* Contenido del modal */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
