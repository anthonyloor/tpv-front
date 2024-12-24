// src/contexts/PinContext.jsx
import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';

export const PinContext = createContext();

const PIN_VALIDITY_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos

const PinProvider = ({ children }) => {
  const [dailyPin, setDailyPin] = useState('');
  const timerRef = useRef(null); // Usar useRef para almacenar el ID del timer

  // Función para generar un PIN de 4 dígitos totalmente aleatorio
  const generatePin = useCallback(() => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString(); // Genera un PIN entre 1000 y 9999
    setDailyPin(pin);
    const expiration = Date.now() + PIN_VALIDITY_DURATION;
    localStorage.setItem('dailyPin', pin);
    localStorage.setItem('pinExpiration', expiration.toString());

    // Limpiar cualquier timer existente
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Configurar un timer para regenerar el PIN después de 1 hora
    timerRef.current = setTimeout(() => {
      generatePin();
    }, PIN_VALIDITY_DURATION);
  }, []);

  // Función para regenerar el PIN inmediatamente (usado al verificarlo)
  const regeneratePin = useCallback(() => {
    generatePin();
  }, [generatePin]);

  // Función para invalidar el PIN (opcional, similar a regeneratePin)
  const invalidatePin = useCallback(() => {
    generatePin();
  }, [generatePin]);

  // Al montar el proveedor, verificar si hay un PIN válido en localStorage
  useEffect(() => {
    const storedPin = localStorage.getItem('dailyPin');
    const storedExpiration = localStorage.getItem('pinExpiration');

    if (storedPin && storedExpiration) {
      const expiration = parseInt(storedExpiration, 10);
      if (Date.now() < expiration) {
        setDailyPin(storedPin);
        const timeLeft = expiration - Date.now();

        // Configurar el timer con el tiempo restante
        timerRef.current = setTimeout(() => {
          generatePin();
        }, timeLeft);
        return () => clearTimeout(timerRef.current);
      }
    }

    // Si no hay PIN válido, generar uno nuevo
    generatePin();

    // Limpiar el timer al desmontar
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [generatePin]);

  return (
    <PinContext.Provider value={{ dailyPin, regeneratePin, invalidatePin }}>
      {children}
    </PinContext.Provider>
  );
};

export default PinProvider;