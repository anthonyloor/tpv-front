// src/components/modals/Modal.jsx
import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  showCloseButton = true, 
  showBackButton = false, 
  onBack, 
  title = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-500 ease-in-out">
      <div className="bg-white rounded-lg shadow-lg w-1/2 h-1/2 relative transform transition-transform duration-500 ease-in-out overflow-auto p-6">
        
        {/* Barra superior */}
        <div className="flex items-center justify-between mb-4">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="bg-gray-200 hover:bg-gray-300 text-black px-3 py-1 rounded"
            >
              Atrás
            </button>
          ) : (
            <div className="w-12"></div>
          )}

          <h2 className="font-bold text-xl text-center flex-grow text-black">
            {title}
          </h2>

          {showCloseButton ? (
            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-black px-3 py-1 rounded"
            >
              Cerrar
            </button>
          ) : (
            <div className="w-12"></div>
          )}
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