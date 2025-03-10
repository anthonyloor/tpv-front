import React, { createContext, useState, useEffect } from "react";

const initialPaymentMethods =
  JSON.parse(localStorage.getItem("originalPaymentMethods")) || [];
const initialPaymentAmounts =
  JSON.parse(localStorage.getItem("originalPaymentAmounts")) || {};

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [isDevolution, setIsDevolution] = useState(false);
  const [originalPaymentMethods, setOriginalPaymentMethods] = useState(
    initialPaymentMethods
  );
  const [originalPaymentAmounts, setOriginalPaymentAmounts] = useState(
    initialPaymentAmounts
  );
  const [isDiscount, setIsDiscount] = useState(
    localStorage.getItem("isDiscount") === "true"
  );

  useEffect(() => {
    localStorage.setItem(
      "originalPaymentMethods",
      JSON.stringify(originalPaymentMethods)
    );
  }, [originalPaymentMethods]);

  useEffect(() => {
    localStorage.setItem(
      "originalPaymentAmounts",
      JSON.stringify(originalPaymentAmounts)
    );
  }, [originalPaymentAmounts]);

  useEffect(() => {
    localStorage.setItem("isDiscount", isDiscount.toString());
  }, [isDiscount]);

  return (
    <CartContext.Provider
      value={{
        isDevolution,
        setIsDevolution,
        originalPaymentMethods,
        setOriginalPaymentMethods,
        originalPaymentAmounts,
        setOriginalPaymentAmounts,
        isDiscount,
        setIsDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
