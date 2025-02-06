// src/hooks/useDiscounts.jsx

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function useDiscounts() {
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { shopId } = useContext(AuthContext);

  const getDiscountsKey = (shopId) => `discounts_shop_${shopId}`;

  useEffect(() => {
    if (shopId) {
      const discountsKey = getDiscountsKey(shopId);
      const storedDiscounts = localStorage.getItem(discountsKey);
      if (storedDiscounts) {
        try {
          setAppliedDiscounts(JSON.parse(storedDiscounts));
        } catch (err) {
          console.error("[useDiscounts] Error parseando descuentos:", err);
        }
      }
    }
    setIsInitialLoad(false);
  }, [shopId]);

  useEffect(() => {
    if (isInitialLoad) return;
    if (shopId) {
      const discountsKey = getDiscountsKey(shopId);
      localStorage.setItem(discountsKey, JSON.stringify(appliedDiscounts));
    }
  }, [appliedDiscounts, isInitialLoad, shopId]);

  const clearDiscounts = () => {
    setAppliedDiscounts([]);
    if (shopId) {
      localStorage.removeItem(getDiscountsKey(shopId));
    }
  };

  const addDiscount = (discountObj) => {
    setAppliedDiscounts((prev) => [...prev, discountObj]);
  };

  const removeDiscountByIndex = (index) => {
    setAppliedDiscounts((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    appliedDiscounts,
    setAppliedDiscounts,
    addDiscount,
    removeDiscountByIndex,
    clearDiscounts,
  };
}
