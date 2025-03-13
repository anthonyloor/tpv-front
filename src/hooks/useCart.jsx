// src/hooks/useCart.jsx

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import { toast } from "sonner";

export default function useCart(allowOutOfStockSales) {
  const [cartItems, setCartItems] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const { shopId } = useContext(AuthContext);
  const { isDevolution, setIsDevolution, isDiscount, setIsDiscount } =
    useContext(CartContext);

  const getCartKey = (shopId) => `cart_shop_${shopId}`;
  const getParkedCartsKey = (shopId) => `parked_carts_shop_${shopId}`;

  useEffect(() => {
    if (shopId) {
      const storageKey = getCartKey(shopId);
      let storedCart = localStorage.getItem(storageKey);
      if (!storedCart) {
        // Asigna valor por defecto si no hay carrito guardado
        const defaultCart = {
          items: [],
          isDevolution: false,
          isDiscount: false,
        };
        localStorage.setItem(storageKey, JSON.stringify(defaultCart));
        storedCart = JSON.stringify(defaultCart);
      }
      const cartData = JSON.parse(storedCart);
      setCartItems(cartData.items || []);
      setIsDevolution(cartData.isDevolution || false);
      setIsDiscount(cartData.isDiscount || false);
    }
    setIsInitialLoad(false);
  }, [shopId, setIsDevolution, setIsDiscount]);

  useEffect(() => {
    if (isInitialLoad) return;
    if (shopId) {
      localStorage.setItem(
        getCartKey(shopId),
        JSON.stringify({ items: cartItems, isDevolution, isDiscount })
      );
    }
  }, [cartItems, isDevolution, isDiscount, isInitialLoad, shopId]);

  const saveCurrentCartAsParked = (name = null, extraData = null) => {
    if (!shopId) {
      toast.error("No se ha encontrado la tienda.");
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
      extra: extraData,
    };
    parkedCarts.push(newParkedCart);
    localStorage.setItem(
      getParkedCartsKey(shopId),
      JSON.stringify(parkedCarts)
    );
    toast.success("Carrito guardado.");
  };

  const getParkedCarts = () => {
    if (!shopId) return [];
    return JSON.parse(localStorage.getItem(getParkedCartsKey(shopId))) || [];
  };

  const loadParkedCart = (cartId) => {
    if (!shopId) {
      toast.error("No se ha encontrado la tienda.");
      return;
    }
    const parkedCarts =
      JSON.parse(localStorage.getItem(getParkedCartsKey(shopId))) || [];
    const cartToLoad = parkedCarts.find((cart) => cart.id === cartId);
    if (cartToLoad) {
      setCartItems(cartToLoad.items);
      toast.success(`Carrito "${cartToLoad.name}" cargado.`);
    } else {
      toast.error("No se ha encontrado el carrito.");
    }
  };

  const deleteParkedCart = (cartId) => {
    if (!shopId) {
      toast.error("No se ha encontrado la tienda.");
      return;
    }
    let parkedCarts =
      JSON.parse(localStorage.getItem(getParkedCartsKey(shopId))) || [];
    parkedCarts = parkedCarts.filter((cart) => cart.id !== cartId);
    localStorage.setItem(
      getParkedCartsKey(shopId),
      JSON.stringify(parkedCarts)
    );
    toast.success("Ticket guardado eliminado.");
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
        toast.error("No puedes añadir más de la cantidad disponible");
        return;
      } else {
        if (exceedsStockCallback) exceedsStockCallback(true);
        return;
      }
    }

    setCartItems((prevItems) => {
      if (existingProduct) {
        const newQty = existingProduct.quantity + quantity;
        // Si ya existe un descuento aplicado, mantener el precio descontado proporcionalmente
        const updatedDiscountedPrice =
          existingProduct.reduction_amount_tax_incl; // O recalcúlalo según la regla de negocio
        return prevItems.map((item) =>
          item.id_stock_available === product.id_stock_available
            ? {
                ...item,
                quantity: newQty,
                reduction_amount_tax_incl: updatedDiscountedPrice,
              }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            ...product,
            quantity,
            reduction_amount_tax_incl:
              typeof product.reduction_amount_tax_incl !== "undefined"
                ? product.reduction_amount_tax_incl
                : 0,
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
    const product = cartItems.find(
      (item) => item.id_stock_available === idStockAvailable
    );
    if (
      isDevolution &&
      (product?.reference_combination === "rectificacion" ||
        product?.quantity < 0)
    ) {
      // Si se elimina un producto devolutivo, se limpia todo el carrito y se restablece el modo devolución
      setCartItems([]);
      setIsDevolution(false);
      setIsDiscount(false);
    } else {
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id_stock_available !== idStockAvailable)
      );
      setIsDiscount(false);
    }
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
