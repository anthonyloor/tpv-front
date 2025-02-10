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
    <div
      className="p-grid"
      style={{ height: "100vh", padding: "0.5rem", gap: "0.5rem" }}
    >
      {/* Fila 1: Navbar (fila completa) */}
      <div
        className="p-col-12"
        style={{
          backgroundColor: "white",
          borderRadius: "0.5rem",
          boxShadow: "var(--shadow-2)",
        }}
      >
        <NavbarCard />
      </div>

      {/* Fila 2: SalesCard (1/3) y ProductSearchCard (2/3) */}
      <div
        className="p-col-12"
        style={{
          flex: 1,
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <div
          className="p-col-4"
          style={{
            backgroundColor: "white",
            borderRadius: "0.5rem",
            boxShadow: "var(--shadow-2)",
            overflowY: "auto",
          }}
        >
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
        <div
          className="p-col-8"
          style={{
            backgroundColor: "white",
            borderRadius: "0.5rem",
            boxShadow: "var(--shadow-2)",
            overflowY: "auto",
          }}
        >
          <ProductSearchCard
            onAddProduct={handleAddProduct}
            onAddDiscount={addDiscount}
            onClickProduct={(product) => setSelectedProductForStock(product)}
          />
        </div>
      </div>

      {/* Fila 3: SalesCardActions (1/3) y StoreStockPanel (2/3) */}
      <div
        className="p-col-12"
        style={{
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <div
          className="p-col-4"
          style={{
            backgroundColor: "white",
            borderRadius: "0.5rem",
            boxShadow: "var(--shadow-2)",
          }}
        >
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
        <div
          className="p-col-8"
          style={{
            backgroundColor: "white",
            borderRadius: "0.5rem",
            boxShadow: "var(--shadow-2)",
            padding: "0.5rem",
          }}
        >
          <StoreStockPanel product={selectedProductForStock} />
        </div>
      </div>
    </div>
  );
}

export default DesktopTPV;
