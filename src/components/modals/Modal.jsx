// src/components/modals/Modal.jsx
import React, { useState, useEffect } from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  showCloseButton = true, 
  showBackButton = false, 
  onBack, 
  title = '',
  size = 'sm', // Tamaño ancho predeterminado
  height = 'small', // Tamaño altura predeterminado
  showSeparator = true, // Mostrar barra separadora por defecto
}) => {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setVisible(false);
      const timeout = setTimeout(() => {
        setVisible(true);
      }, 10);
      return () => clearTimeout(timeout);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const handleTransitionEnd = (e) => {
    if (e.target === e.currentTarget && e.propertyName === 'opacity' && !isOpen) {
      setMounted(false);
    }
  };

  if (!mounted) return null;

  const sizeClasses = {
    xs: 'w-[20%]', // 20% del ancho de la pantalla
    sm: 'w-[30%]',
    md: 'w-[40%]',
    lg: 'w-[50%]',
    xl: 'w-[60%]',
    '2xl': 'w-[70%]',
    '3xl': 'w-[80%]',
    full: 'w-[100%]', // Pantalla completa
  };

  const heightClasses = {
    default: 'h-auto', // Altura predeterminada (depende del contenido)
    small: 'h-1/4',
    md: 'h-2/4',
    tall: 'h-3/4', // Alto (3/4 de la pantalla)
    full: 'h-full', // Pantalla completa (altura)
  };

  return (
    <div
      className={`
        fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 
        transition-opacity duration-300 ease-in-out
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className={`
          bg-white rounded-lg shadow-lg p-6 ${sizeClasses[size]} ${heightClasses[height]} 
          transition-transform duration-300 ease-in-out overflow-auto
        `}
      >
        {/* Barra superior */}
        <div className="flex items-center justify-between mb-2">
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

        {/* Línea separadora */}
        {showSeparator && <hr className="my-2 border-gray-300" />}
        
        {/* Contenido del modal */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;