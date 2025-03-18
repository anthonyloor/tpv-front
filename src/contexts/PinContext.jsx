// src/contexts/PinContext.jsx

import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

export const PinContext = createContext();
const PIN_VALIDITY_DURATION = 15 * 60 * 1000;

const PinProvider = ({ children }) => {
  const [dailyPin, setDailyPin] = useState("");
  const timerRef = useRef(null);

  const generatePin = useCallback(() => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const hour = now.getHours();
    const minute = now.getMinutes();
    const rawPin = 3041 * day * month * (hour + minute + 1);
    const computedPin = (rawPin % 10000).toString().padStart(4, "0");

    setDailyPin(computedPin);

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
