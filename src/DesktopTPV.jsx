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
    <div className="grid grid-cols-3 grid-rows-[auto,1fr,1fr,1fr,auto] gap-2 p-2 h-screen">
      <div className="col-span-3 bg-white shadow row-span-1 rounded-lg">
        <NavbarCard />
      </div>
      {/* SalesCard => col=1, row-span=3 */}
      <div className="col-span-1 row-span-3 row-start-2 bg-white shadow overflow-auto rounded-lg">
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

      {/* div3 => ProductSearchCard => col-span-2, row-span=3, row-start=2 */}
      <div className="col-span-2 row-span-3 row-start-2 bg-white shadow overflow-auto rounded-lg">
        <ProductSearchCard
          onAddProduct={handleAddProduct}
          onAddDiscount={addDiscount}
          onClickProduct={(product) => setSelectedProductForStock(product)}
        />
      </div>

      {/* div4 => Botones/Acciones de SalesCard => col=1, row-start=5 */}
      <div className="col-span-1 row-start-5 bg-white shadow rounded-lg">
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

      {/* div5 => Panel de stock en tiendas => col-span-2, row-start=5 */}
      <div className="col-span-2 row-start-5 bg-white shadow p-2 rounded-lg">
        <StoreStockPanel product={selectedProductForStock} />
      </div>
    </div>
  );
}

export default DesktopTPV;