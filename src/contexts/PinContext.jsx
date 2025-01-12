// src/contexts/PinContext.jsx

import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';

export const PinContext = createContext();
const PIN_VALIDITY_DURATION = 60 * 60 * 1000;

const PinProvider = ({ children }) => {
  const [dailyPin, setDailyPin] = useState('');
  const timerRef = useRef(null);

  const generatePin = useCallback(() => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setDailyPin(pin);
    const expiration = Date.now() + PIN_VALIDITY_DURATION;
    localStorage.setItem('dailyPin', pin);
    localStorage.setItem('pinExpiration', expiration.toString());

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      generatePin();
    }, PIN_VALIDITY_DURATION);
  }, []);

  const regeneratePin = useCallback(() => {
    generatePin();
  }, [generatePin]);

  const invalidatePin = useCallback(() => {
    generatePin();
  }, [generatePin]);

  useEffect(() => {
    const storedPin = localStorage.getItem('dailyPin');
    const storedExpiration = localStorage.getItem('pinExpiration');

    if (storedPin && storedExpiration) {
      const expiration = parseInt(storedExpiration, 10);
      if (Date.now() < expiration) {
        setDailyPin(storedPin);
        const timeLeft = expiration - Date.now();
        timerRef.current = setTimeout(() => {
          generatePin();
        }, timeLeft);
        return () => clearTimeout(timerRef.current);
      }
    }
    generatePin();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [generatePin]);

  return (
    <PinContext.Provider value={{ dailyPin, regeneratePin, invalidatePin }}>
      {children}
    </PinContext.Provider>
  );
};

export default PinProvider;