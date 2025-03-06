import React, { createContext, useState } from "react";

export const DevolutionContext = createContext();

export const DevolutionProvider = ({ children }) => {
  const [isDevolution, setIsDevolution] = useState(false);
  const [originalPaymentMethods, setOriginalPaymentMethods] = useState([]);
  const [originalPaymentAmounts, setOriginalPaymentAmounts] = useState({});

  return (
    <DevolutionContext.Provider
      value={{
        isDevolution,
        setIsDevolution,
        originalPaymentMethods,
        setOriginalPaymentMethods,
        originalPaymentAmounts,
        setOriginalPaymentAmounts,
      }}
    >
      {children}
    </DevolutionContext.Provider>
  );
};
