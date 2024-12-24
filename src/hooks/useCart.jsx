// src/hooks/useCart.js
import { useState, useEffect } from 'react';

export default function useCart(allowOutOfStockSales) {
  const [cartItems, setCartItems] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Bandera para la carga inicial

  // Función para generar una clave única para el carrito basado en la tienda
  const getCartKey = (shopId) => `cart_shop_${shopId}`;
  const getParkedCartsKey = (shopId) => `parked_carts_shop_${shopId}`;

  // Cargar el carrito desde localStorage al montar el hook
  useEffect(() => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      const storedCart = localStorage.getItem(getCartKey(storedShop.id_shop));
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    }
    setIsInitialLoad(false); // Marca que la carga inicial ha finalizado
  }, []);

  // Guardar el carrito en localStorage cada vez que cartItems cambie, excepto durante la carga inicial
  useEffect(() => {
    if (isInitialLoad) return; // Evitar guardar durante la carga inicial
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (storedShop) {
      localStorage.setItem(getCartKey(storedShop.id_shop), JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialLoad]);

  // Función para guardar el carrito actual como un carrito aparcado
  const saveCurrentCartAsParked = (name = null) => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (!storedShop) {
      alert('No se ha encontrado la tienda en la configuración.');
      return;
    }

    const parkedCarts = JSON.parse(localStorage.getItem(getParkedCartsKey(storedShop.id_shop))) || [];

    const timestamp = new Date().toISOString();
    const cartName = name || `Ticket ${new Date().toLocaleString()}`;

    const newParkedCart = {
      id: `${storedShop.id_shop}_${Date.now()}`, // ID único
      name: cartName,
      items: cartItems,
      savedAt: timestamp,
    };

    parkedCarts.push(newParkedCart);
    localStorage.setItem(getParkedCartsKey(storedShop.id_shop), JSON.stringify(parkedCarts));

    alert('Carrito aparcado exitosamente.');
  };

  // Función para obtener la lista de carritos aparcados
  const getParkedCarts = () => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (!storedShop) return [];
    return JSON.parse(localStorage.getItem(getParkedCartsKey(storedShop.id_shop))) || [];
  };

  // Función para cargar un carrito aparcado
  const loadParkedCart = (cartId) => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (!storedShop) {
      alert('No se ha encontrado la tienda en la configuración.');
      return;
    }

    const parkedCarts = JSON.parse(localStorage.getItem(getParkedCartsKey(storedShop.id_shop))) || [];
    const cartToLoad = parkedCarts.find((cart) => cart.id === cartId);

    if (cartToLoad) {
      setCartItems(cartToLoad.items);
      alert(`Carrito "${cartToLoad.name}" cargado exitosamente.`);
    } else {
      alert('Carrito no encontrado.');
    }
  };

  // Función para eliminar un carrito aparcado
  const deleteParkedCart = (cartId) => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    if (!storedShop) {
      alert('No se ha encontrado la tienda en la configuración.');
      return;
    }

    let parkedCarts = JSON.parse(localStorage.getItem(getParkedCartsKey(storedShop.id_shop))) || [];
    parkedCarts = parkedCarts.filter((cart) => cart.id !== cartId);
    localStorage.setItem(getParkedCartsKey(storedShop.id_shop), JSON.stringify(parkedCarts));

    alert('Carrito aparcado eliminado.');
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