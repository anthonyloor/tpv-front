// src/hooks/useCart.js
import { useState } from 'react';

export default function useCart(allowOutOfStockSales) {
  const [cartItems, setCartItems] = useState([]);
  const [lastAction, setLastAction] = useState(null);

  const handleAddProduct = (product, stockQuantity, exceedsStockCallback, forceAdd = false) => {
    const existingProduct = cartItems.find((item) => item.id_stock_available === product.id_stock_available);
    const maxQuantity = stockQuantity ?? Infinity;
    const newQuantity = existingProduct ? existingProduct.quantity + 1 : 1;

    if (newQuantity > maxQuantity && !forceAdd) {
      if (!allowOutOfStockSales) {
        alert('No puedes añadir más de la cantidad disponible');
        return;
      } else {
        if (exceedsStockCallback) exceedsStockCallback(true);
        return;
      }
    }

    const tax_rate = product.tax_rate !== undefined ? product.tax_rate : 0.21;
    const price_excl_tax = product.price_incl_tax / (1 + tax_rate);
    const final_price_excl_tax = product.final_price_incl_tax / (1 + tax_rate);

    setCartItems((prevItems) => {
      if (existingProduct) {
        return prevItems.map((item) =>
          item.id_stock_available === product.id_stock_available
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            ...product,
            quantity: 1,
            price_excl_tax: parseFloat(price_excl_tax.toFixed(2)),
            final_price_excl_tax: parseFloat(final_price_excl_tax.toFixed(2)),
            unit_price_tax_excl: parseFloat(final_price_excl_tax.toFixed(2)),
            tax_rate,
          },
        ];
      }
    });

    setLastAction({ id: product.id_stock_available, action: 'add', timestamp: Date.now() });
  };

  const handleDecreaseProduct = (idStockAvailable) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.id_stock_available === idStockAvailable
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

    setLastAction({ id: idStockAvailable, action: 'decrease', timestamp: Date.now() });
  };

  const handleRemoveProduct = (idStockAvailable) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id_stock_available !== idStockAvailable));
  };

  return {
    cartItems,
    setCartItems,
    lastAction,
    handleAddProduct,
    handleRemoveProduct,
    handleDecreaseProduct,
  };
}