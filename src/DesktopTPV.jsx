// src/DesktopTPV.jsx

import React, { useContext, useState, useCallback } from "react";
import { ConfigContext } from "./contexts/ConfigContext";
import NavbarCard from "./components/Navbar/NavbarCard";
import SalesCard from "./components/Sales/SalesCard";
import ProductSearchCard from "./components/ProductSearch/ProductSearchCard";
import SalesCardActions from "./components/Sales/SalesCardActions";
import StoreStockPanel from "./components/Stock/StoreStockPanel";
import useCart from "./hooks/useCart";
import useDiscounts from "./hooks/useDiscounts";
import { Toast } from "primereact/toast";

function DesktopTPV() {
  const { configData } = useContext(ConfigContext);
  const allowOutOfStockSales = configData?.allow_out_of_stock_sales || false;

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
    toast,
  } = useCart(allowOutOfStockSales);

  const {
    appliedDiscounts,
    addDiscount,
    removeDiscountByIndex,
    clearDiscounts,
  } = useDiscounts();

  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [selectedProductForDiscount, setSelectedProductForDiscount] =
    useState(null);
  const [totals, setTotals] = useState({
    subtotal: 0,
    total: 0,
    totalDiscounts: 0,
  });

  const handleTotalsChange = useCallback(
    ({ subtotal, total, totalDiscounts }) => {
      setTotals({ subtotal, total, totalDiscounts });
    },
    []
  );

  return (
    <>
      <Toast ref={toast} position="top-center" />
      <div className="flex flex-col h-screen overflow-hidden p-2 gap-2">
        <header className="flex-none">
          <NavbarCard />
        </header>
        <main className="flex flex-col flex-1 gap-2 overflow-auto">
          <div className="flex-1 flex overflow-hidden rounded gap-2">
            <div className="flex-1 flex-col w-[35%] shadow rounded overflow-hidden">
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
                setSelectedProductForDiscount={setSelectedProductForDiscount}
                onTotalsChange={handleTotalsChange}
              />
            </div>
            <div className="flex-2 flex-col w-[65%] rounded shadow overflow-hidden">
              <ProductSearchCard
                onAddProduct={handleAddProduct}
                onAddDiscount={addDiscount}
                onClickProduct={setSelectedProductForStock}
              />
            </div>
          </div>
        </main>
        <footer className="flex-none flex gap-2 overflow-auto rounded">
          <div className="flex-1 flex-col w-[35%] shadow rounded overflow-hidden">
            <SalesCardActions
              cartItems={cartItems}
              setCartItems={setCartItems}
              appliedDiscounts={appliedDiscounts}
              addDiscount={addDiscount}
              removeDiscountByIndex={removeDiscountByIndex}
              clearDiscounts={clearDiscounts}
              handleAddProduct={handleAddProduct}
              selectedProductForDiscount={selectedProductForDiscount}
              setSelectedProductForDiscount={setSelectedProductForDiscount}
              subtotal={totals.subtotal}
              total={totals.total}
              totalDiscounts={totals.totalDiscounts}
            />
          </div>
          <div className="flex-2 flex-col w-[65%] rounded shadow overflow-hidden">
            <StoreStockPanel product={selectedProductForStock} />
          </div>
        </footer>
      </div>
    </>
  );
}

export default DesktopTPV;
