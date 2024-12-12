// src/App.js
import React, { useEffect, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import NavbarCard from './components/Navbar/NavbarCard';
import SalesCard from './components/Sales/SalesCard';
import ProductSearchCard from './components/ProductSearch/ProductSearchCard';
import PinPage from './components/pages/PinPage';
import LoginPage from './components/pages/LoginPage';
import NotFoundPage from './components/pages/NotFoundPage';
import { AuthContext } from './contexts/AuthContext';
import PrivateRoute from './components/base/PrivateRoute';
import ConfigLoader from './components/ConfigLoader';
import SessionExpiredModal from './components/modals/session/SessionExpiredModal';
import { ConfigContext } from './contexts/ConfigContext';
import useCart from './hooks/useCart';

function App() {
  const { setIsAuthenticated, setShopId, setEmployeeId, setEmployeeName, setShopName } = useContext(AuthContext);
  const { configData } = useContext(ConfigContext);
  const allowOutOfStockSales = configData ? configData.allow_out_of_stock_sales : false;
  const {
    cartItems,
    setCartItems,
    lastAction,
    handleAddProduct,
    handleRemoveProduct,
    handleDecreaseProduct
  } = useCart(allowOutOfStockSales);
  const navigate = useNavigate();

  useEffect(() => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    const storedEmployee = JSON.parse(localStorage.getItem('employee'));

    if (storedShop && storedEmployee) {
      setIsAuthenticated(true);
      setShopId(storedShop.id_shop);
      setShopName(storedShop.name);
      setEmployeeId(storedEmployee.id_employee);
      setEmployeeName(storedEmployee.employee_name);
    }
  }, [setIsAuthenticated, setShopId, setShopName, setEmployeeId, setEmployeeName]);

  useEffect(() => {
    const currentPath = window.location.pathname.split('/')[1];
    const storedShop = JSON.parse(localStorage.getItem('shop'));

    if (storedShop && currentPath !== storedShop.route) {
      navigate(`/${storedShop.route}/app`);
    }
  }, [navigate]);

  return (
    <div className="bg-gray-light min-h-screen flex flex-col">
      <SessionExpiredModal />
      <Routes>
        {/* Rutas para cada tienda */}
        <Route path="/penaprieta8" element={<LoginPage shopRoute="penaprieta8" />} />
        <Route path="/bravomurillo205" element={<LoginPage shopRoute="bravomurillo205" />} />
        <Route path="/alcala397" element={<LoginPage shopRoute="alcala397" />} />
        <Route path="/bodega" element={<LoginPage shopRoute="bodega" />} />
        <Route path="/mayretmodacolombiana" element={<LoginPage shopRoute="mayretmodacolombiana" />} />
        <Route path="/pin" element={<PinPage />} />
        <Route path="/:shopRoute/app"
          element={
            <PrivateRoute>
              <ConfigLoader />
              <NavbarCard />
              <div className="flex flex-col md:flex-row flex-grow p-4 space-y-4 md:space-y-0 md:space-x-4">
                <div className="w-full md:w-1/3">
                  <SalesCard
                    cartItems={cartItems}
                    setCartItems={setCartItems}
                    onRemoveProduct={handleRemoveProduct}
                    onDecreaseProduct={handleDecreaseProduct}
                    lastAction={lastAction}
                    handleAddProduct={handleAddProduct}
                  />
                </div>
                <div className="w-full md:w-2/3">
                  <ProductSearchCard onAddProduct={handleAddProduct} />
                </div>
              </div>
            </PrivateRoute>
          }
        />
        <Route path="/:shopRoute" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;