// src/hooks/useDiscounts.jsx

import { useState, useEffect } from 'react';

export default function useDiscounts() {
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const getDiscountsKey = (shopId) => `discounts_shop_${shopId}`;

  useEffect(() => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      const discountsKey = getDiscountsKey(storedShop.id_shop);
      const storedDiscounts = localStorage.getItem(discountsKey);
      if (storedDiscounts) {
        try {
          setAppliedDiscounts(JSON.parse(storedDiscounts));
        } catch (err) {
          console.error('[useDiscounts] Error parseando descuentos:', err);
        }
      }
    }
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      const discountsKey = getDiscountsKey(storedShop.id_shop);
      localStorage.setItem(discountsKey, JSON.stringify(appliedDiscounts));
    }
  }, [appliedDiscounts, isInitialLoad]);

  const clearDiscounts = () => {
    setAppliedDiscounts([]);
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      localStorage.removeItem(getDiscountsKey(storedShop.id_shop));
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