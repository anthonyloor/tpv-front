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
  size = 'sm',  // controla el ancho
  height = 'small',  // controla el alto
  showSeparator = true,
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
    // Cuando termina la transición de opacidad y el modal está cerrado, desmontamos
    if (e.target === e.currentTarget && e.propertyName === 'opacity' && !isOpen) {
      setMounted(false);
    }
  };

  // Si no debe montarse, no renderizamos nada
  if (!mounted) return null;

  // Clases de Tailwind para el ancho
  const sizeClasses = {
    xs: 'w-full max-w-xs',   
    sm: 'w-full max-w-sm',   
    md: 'w-full max-w-md',   
    lg: 'w-full max-w-xl',   // ~1280px
    xl: 'w-full max-w-2xl',
    '2xl': 'w-full max-w-3xl',
    '3xl': 'w-full max-w-4xl',
    '4xl': 'w-full max-w-5xl',
    '5xl': 'w-full max-w-6xl',
    '6xl': 'w-full max-w-7xl',
    full: 'w-full max-w-none',
  };

  // Clases de Tailwind para el alto
  // Por ejemplo, puedes usar fracciones de la pantalla (vh) o 'max-h' con un valor
  const heightClasses = {
    default: 'h-auto',          // Se ajusta al contenido
    sm: 'max-h-[50vh]',         // Máximo 50% del alto de la pantalla
    md: 'max-h-[70vh]',         // Máximo ~70% 
    tall: 'max-h-[80vh]',       // 
    full: 'h-full max-h-none',  // Toma todo el alto
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
          bg-white rounded-lg shadow-lg p-6 overflow-auto
          ${sizeClasses[size] || sizeClasses.lg}
          ${heightClasses[height] || heightClasses.default}
          transition-transform duration-300 ease-in-out
        `}
      >
        {/* Barra superior con título y botones */}
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
        {showSeparator && <hr className="my-2 border-gray-300 mb-5" />}
        
        {/* Contenido */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;