// src/hooks/useDiscounts.jsx
import { useState, useEffect } from 'react';

export default function useDiscounts() {
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Función para generar una clave única para los descuentos basado en la tienda
  const getDiscountsKey = (shopId) => `discounts_shop_${shopId}`;

  // 1) Cargar los descuentos desde localStorage al montar
  useEffect(() => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      const discountsKey = getDiscountsKey(storedShop.id_shop);
      const storedDiscounts = localStorage.getItem(discountsKey);
      if (storedDiscounts) {
        try {
          const parsed = JSON.parse(storedDiscounts);
          setAppliedDiscounts(parsed);
        } catch (err) {
          console.error('[useDiscounts] Error parseando descuentos:', err);
        }
      }
    }
    setIsInitialLoad(false); // Marca que la carga inicial ha finalizado
  }, []);

  // 2) Guardar los descuentos en localStorage cada vez que cambien, excepto durante la carga inicial
  useEffect(() => {
    if (isInitialLoad) return;
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      const discountsKey = getDiscountsKey(storedShop.id_shop);
      localStorage.setItem(discountsKey, JSON.stringify(appliedDiscounts));
    }
  }, [appliedDiscounts, isInitialLoad]);

  // Función para limpiar completamente los descuentos (por ejemplo, al borrar ticket)
  const clearDiscounts = () => {
    setAppliedDiscounts([]);
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      localStorage.removeItem(getDiscountsKey(storedShop.id_shop));
    }
  };

  // Agregar un nuevo descuento
  const addDiscount = (discountObj) => {
    // discountObj debería ser { code, reduction_amount, reduction_percent, etc. }
    setAppliedDiscounts((prev) => [...prev, discountObj]);
  };

  // Eliminar un descuento por índice
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