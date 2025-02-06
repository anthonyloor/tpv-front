// src/hooks/useCart.jsx

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function useCart(allowOutOfStockSales) {
  const [cartItems, setCartItems] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const { shopId } = useContext(AuthContext);

  const getCartKey = (shopId) => `cart_shop_${shopId}`;
  const getParkedCartsKey = (shopId) => `parked_carts_shop_${shopId}`;

  useEffect(() => {
    if (shopId) {
      const storedCart = localStorage.getItem(getCartKey(shopId));
      if (storedCart) setCartItems(JSON.parse(storedCart));
    }
    setIsInitialLoad(false);
  }, [shopId]);

  useEffect(() => {
    if (isInitialLoad) return;
    if (shopId) {
      localStorage.setItem(getCartKey(shopId), JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialLoad, shopId]);

  const saveCurrentCartAsParked = (name = null) => {
    if (!shopId) {
      alert("No se ha encontrado la tienda.");
      return;
    }
    const parkedCarts =
      JSON.parse(localStorage.getItem(getParkedCartsKey(shopId))) || [];
    const timestamp = new Date().toISOString();
    const cartName = name || `Ticket ${new Date().toLocaleString()}`;
    const newParkedCart = {
      id: `${shopId}_${Date.now()}`,
      name: cartName,
      items: cartItems,
      savedAt: timestamp,
    };
    parkedCarts.push(newParkedCart);
    localStorage.setItem(
      getParkedCartsKey(shopId),
      JSON.stringify(parkedCarts)
    );
    alert("Carrito aparcado exitosamente.");
  };

  const getParkedCarts = () => {
    if (!shopId) return [];
    return JSON.parse(localStorage.getItem(getParkedCartsKey(shopId))) || [];
  };

  const loadParkedCart = (cartId) => {
    if (!shopId) {
      alert("No se ha encontrado la tienda.");
      return;
    }
    const parkedCarts =
      JSON.parse(localStorage.getItem(getParkedCartsKey(shopId))) || [];
    const cartToLoad = parkedCarts.find((cart) => cart.id === cartId);
    if (cartToLoad) {
      setCartItems(cartToLoad.items);
      alert(`Carrito "${cartToLoad.name}" cargado.`);
    } else {
      alert("Carrito no encontrado.");
    }
  };

  const deleteParkedCart = (cartId) => {
    if (!shopId) {
      alert("No se ha encontrado la tienda.");
      return;
    }
    let parkedCarts =
      JSON.parse(localStorage.getItem(getParkedCartsKey(shopId))) || [];
    parkedCarts = parkedCarts.filter((cart) => cart.id !== cartId);
    localStorage.setItem(
      getParkedCartsKey(shopId),
      JSON.stringify(parkedCarts)
    );
    alert("Carrito aparcado eliminado.");
  };

  const handleAddProduct = (
    product,
    stockQuantity,
    exceedsStockCallback,
    forceAdd = false,
    quantity = 1
  ) => {
    const existingProduct = cartItems.find(
      (item) => item.id_stock_available === product.id_stock_available
    );
    const maxQuantity = stockQuantity ?? Infinity;
    const newQuantity = existingProduct
      ? existingProduct.quantity + quantity
      : quantity;

    if (newQuantity > maxQuantity && !forceAdd) {
      if (!allowOutOfStockSales) {
        alert("No puedes añadir más de la cantidad disponible");
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
        // Actualizar cantidad
        return prevItems.map((item) =>
          item.id_stock_available === product.id_stock_available
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Agregar producto nuevo
        return [
          ...prevItems,
          {
            ...product,
            quantity,
            price_excl_tax: parseFloat(price_excl_tax.toFixed(2)),
            final_price_excl_tax: parseFloat(final_price_excl_tax.toFixed(2)),
            unit_price_tax_excl: parseFloat(final_price_excl_tax.toFixed(2)),
            tax_rate,
          },
        ];
      }
    });

    // Avisar callback que no se superó stock
    if (exceedsStockCallback) exceedsStockCallback(false);

    // Marcar el producto como recién añadido, para la animación
    setRecentlyAddedId(product.id_stock_available);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 2000);

    // Registrar la acción
    setLastAction({
      id: product.id_stock_available,
      action: "add",
      timestamp: Date.now(),
    });
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
    setLastAction({
      id: idStockAvailable,
      action: "decrease",
      timestamp: Date.now(),
    });
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
    // Exporta recentlyAddedId para que el componente de ticket (SalesCard) aplique la animación
    recentlyAddedId,
  };
}
