// src/hooks/useCart.jsx

import { useState, useEffect } from 'react';

export default function useCart(allowOutOfStockSales) {
  const [cartItems, setCartItems] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const getCartKey = (shopId) => `cart_shop_${shopId}`;
  const getParkedCartsKey = (shopId) => `parked_carts_shop_${shopId}`;

  useEffect(() => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      const storedCart = localStorage.getItem(getCartKey(storedShop.id_shop));
      if (storedCart) setCartItems(JSON.parse(storedCart));
    }
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      localStorage.setItem(getCartKey(storedShop.id_shop), JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialLoad]);

  const saveCurrentCartAsParked = (name = null) => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (!storedShop) {
      alert('No se ha encontrado la tienda.');
      return;
    }
    const parkedCarts = JSON.parse(localStorage.getItem(getParkedCartsKey(storedShop.id_shop))) || [];
    const timestamp = new Date().toISOString();
    const cartName = name || `Ticket ${new Date().toLocaleString()}`;
    const newParkedCart = {
      id: `${storedShop.id_shop}_${Date.now()}`,
      name: cartName,
      items: cartItems,
      savedAt: timestamp,
    };
    parkedCarts.push(newParkedCart);
    localStorage.setItem(getParkedCartsKey(storedShop.id_shop), JSON.stringify(parkedCarts));
    alert('Carrito aparcado exitosamente.');
  };

  const getParkedCarts = () => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (!storedShop) return [];
    return JSON.parse(localStorage.getItem(getParkedCartsKey(storedShop.id_shop))) || [];
  };

  const loadParkedCart = (cartId) => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (!storedShop) {
      alert('No se ha encontrado la tienda.');
      return;
    }
    const parkedCarts = JSON.parse(localStorage.getItem(getParkedCartsKey(storedShop.id_shop))) || [];
    const cartToLoad = parkedCarts.find((cart) => cart.id === cartId);
    if (cartToLoad) {
      setCartItems(cartToLoad.items);
      alert(`Carrito "${cartToLoad.name}" cargado.`);
    } else {
      alert('Carrito no encontrado.');
    }
  };

  const deleteParkedCart = (cartId) => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (!storedShop) {
      alert('No se ha encontrado la tienda.');
      return;
    }
    let parkedCarts = JSON.parse(localStorage.getItem(getParkedCartsKey(storedShop.id_shop))) || [];
    parkedCarts = parkedCarts.filter((cart) => cart.id !== cartId);
    localStorage.setItem(getParkedCartsKey(storedShop.id_shop), JSON.stringify(parkedCarts));
    alert('Carrito aparcado eliminado.');
  };

  const handleAddProduct = (product, stockQuantity, exceedsStockCallback, forceAdd = false, quantity = 1) => {
    const existingProduct = cartItems.find(
      (item) => item.id_stock_available === product.id_stock_available
    );
    const maxQuantity = stockQuantity ?? Infinity;
    const newQuantity = existingProduct ? existingProduct.quantity + quantity : quantity;

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
            quantity: quantity,
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
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id_stock_available !== idStockAvailable)
    );
  };

  return {
    cartItems,
    setCartItems,
    lastAction,
    handleAddProduct,
    handleRemoveProduct,
    handleDecreaseProduct,
    saveCurrentCartAsParked,
    getParkedCarts,
    loadParkedCart,
    deleteParkedCart,
  };
}