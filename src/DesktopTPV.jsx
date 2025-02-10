// src/DesktopTPV.jsx

import React, { useState, useContext } from "react";
import NavbarCard from "./components/Navbar/NavbarCard";
import SalesCard from "./components/Sales/SalesCard";
import ProductSearchCard from "./components/ProductSearch/ProductSearchCard";
import SalesCardActions from "./components/Sales/SalesCardActions";
import StoreStockPanel from "./components/Stock/StoreStockPanel";
import useCart from "./hooks/useCart";
import useDiscounts from "./hooks/useDiscounts";
import { ConfigContext } from "./contexts/ConfigContext";

function DesktopTPV() {
  const { configData } = useContext(ConfigContext);
  const allowOutOfStockSales = configData
    ? configData.allow_out_of_stock_sales
    : false;

  const {
    cartItems,
    setCartItems,
    handleAddProduct,
    handleRemoveProduct,
    handleDecreaseProduct,
    saveCurrentCartAsParked,
    getParkedCarts,
    loadParkedCart,
    deleteParkedCart,
    recentlyAddedId,
  } = useCart(allowOutOfStockSales);

  const {
    appliedDiscounts,
    addDiscount,
    removeDiscountByIndex,
    clearDiscounts,
  } = useDiscounts();

  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  return (
    <div className="flex flex-col min-h-screen p-2 gap-2">
      {/* Fila 1: Navbar */}
      <div className="w-full">
        <NavbarCard />
      </div>

      {/* Fila 2: SalesCard (1/3) + ProductSearchCard (2/3) */}
      <div className="flex flex-auto gap-2">
        <div className="w-1/3 bg-white rounded shadow-md overflow-y-auto">
          <SalesCard
            cartItems={cartItems}
            setCartItems={setCartItems}
            onRemoveProduct={handleRemoveProduct}
            onDecreaseProduct={handleDecreaseProduct}
            saveCurrentCartAsParked={saveCurrentCartAsParked}
            getParkedCarts={getParkedCarts}
            loadParkedCart={loadParkedCart}
            deleteParkedCart={deleteParkedCart}
            appliedDiscounts={appliedDiscounts}
            removeDiscountByIndex={removeDiscountByIndex}
            clearDiscounts={clearDiscounts}
            recentlyAddedId={recentlyAddedId}
          />
        </div>
        <div className="w-2/3 bg-white rounded shadow-md overflow-y-auto">
          <ProductSearchCard
            onAddProduct={handleAddProduct}
            onAddDiscount={addDiscount}
            onClickProduct={(product) => setSelectedProductForStock(product)}
          />
        </div>
      </div>

      {/* Fila 3: SalesCardActions (1/3) + StoreStockPanel (2/3) */}
      <div className="flex gap-2">
        <div className="w-1/3 bg-white rounded shadow-md">
          <SalesCardActions
            cartItems={cartItems}
            setCartItems={setCartItems}
            appliedDiscounts={appliedDiscounts}
            addDiscount={addDiscount}
            removeDiscountByIndex={removeDiscountByIndex}
            clearDiscounts={clearDiscounts}
            handleAddProduct={handleAddProduct}
          />
        </div>
        <div className="w-2/3 bg-white rounded shadow-md p-2">
          <StoreStockPanel product={selectedProductForStock} />
        </div>
      </div>
    </div>
  );
}

export default DesktopTPV;
