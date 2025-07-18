// src/components/modals/Modal.jsx

import React, { useState, useEffect } from "react";

const Modal = ({
  isOpen,
  onClose,
  children,
  showCloseButton = true,
  showBackButton = false,
  onBack,
  title = "",
  size = "sm",
  height = "small",
  showSeparator = true,
  inlineMode = false,
}) => {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timeout = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timeout);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const handleTransitionEnd = (e) => {
    if (
      e.target === e.currentTarget &&
      e.propertyName === "opacity" &&
      !isOpen
    ) {
      setMounted(false);
    }
  };

  if (!mounted) return null;
  if (!isOpen) return null;
  if (inlineMode) {
    return (
      <div className="w-full h-full bg-white overflow-y-auto pointer-events-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          {showBackButton && (
            <button onClick={onBack} className="text-blue-500">
              Atrás
            </button>
          )}
          <h2 className="font-bold text-xl flex-grow text-center">{title}</h2>
          {showCloseButton && (
            <button onClick={onClose} className="text-blue-500">
              Cerrar
            </button>
          )}
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    );
  }

  // MODO OVERLAY (escritorio, etc.)
  const sizeClasses = {
    xs: "w-full max-w-xs",
    sm: "w-full max-w-sm",
    md: "w-full max-w-md",
    lg: "w-full max-w-xl",
    xl: "w-full max-w-2xl",
    "2xl": "w-full max-w-3xl",
    "3xl": "w-full max-w-4xl",
    "4xl": "w-full max-w-5xl",
    "5xl": "w-full max-w-6xl",
    "6xl": "w-full max-w-7xl",
    full: "w-full max-w-none",
  };

  const heightClasses = {
    default: "h-auto",
    xs: "min-h-[20vh] max-h-[30vh]",
    sm: "min-h-[30vh] max-h-[50vh]",
    md: "min-h-[40vh] max-h-[70vh]",
    lg: "min-h-[50vh] max-h-[85vh]",
    xl: "min-h-[60vh] max-h-[95vh]",
    full: "h-full max-h-none",
  };

  return (
    <div
      className={`
        fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50
        transition-opacity duration-300 ease-in-out
        ${visible ? "opacity-100" : "opacity-0"}
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
        {/* Cabecera */}
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

          <h2 className="font-bold text-xl flex-grow text-center">{title}</h2>

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

        {showSeparator && <hr className="my-2 border-gray-300 mb-5" />}

        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
