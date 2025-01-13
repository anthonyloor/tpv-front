// src/App.js
import React, { useEffect, useContext, useState } from 'react';
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
import useDiscounts from './hooks/useDiscounts';  // Importar useDiscounts

// PrimeReact
import 'primereact/resources/themes/md-light-indigo/theme.css'; // Tema Material
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

function App() {
  const { setIsAuthenticated, setShopId, setEmployeeId, setEmployeeName, setIdProfile, setShopName } = useContext(AuthContext);
  const { configData } = useContext(ConfigContext);
  const allowOutOfStockSales = configData ? configData.allow_out_of_stock_sales : false;
  const navigate = useNavigate();

  // Estado para indicar si el shop ya ha sido cargado
  const [isShopLoaded, setIsShopLoaded] = useState(false);

  // Cargar autenticación y datos de la tienda
  useEffect(() => {
    const storedShop = JSON.parse(localStorage.getItem('shop'));
    const storedEmployee = JSON.parse(localStorage.getItem('employee'));

    if (storedShop && storedEmployee) {
      setIsAuthenticated(true);
      setShopId(storedShop.id_shop);
      setShopName(storedShop.name);
      setEmployeeId(storedEmployee.id_employee);
      setEmployeeName(storedEmployee.employee_name);
      setIdProfile(storedEmployee.id_profile);
      setIsShopLoaded(true); // Indicar que el shop ha sido cargado
    } else {
      setIsShopLoaded(true); // Incluso si no hay shop, continuar
    }
  }, [setIsAuthenticated, setShopId, setShopName, setEmployeeId, setEmployeeName, setIdProfile]);

  // Cargar el carrito después de que el shop ha sido cargado
  const {
    cartItems,
    setCartItems,
    lastAction,
    handleAddProduct,
    handleRemoveProduct,
    handleDecreaseProduct,
    saveCurrentCartAsParked, // Nueva función
    getParkedCarts,           // Nueva función
    loadParkedCart,           // Nueva función
    deleteParkedCart,         // Nueva función
  } = useCart(allowOutOfStockSales);

  const {
    appliedDiscounts,
    addDiscount,
    removeDiscountByIndex,
    clearDiscounts,
  } = useDiscounts();

  useEffect(() => {
    if (!isShopLoaded) return; // Esperar hasta que el shop esté cargado
    const currentPath = window.location.pathname.split('/')[1];
    const storedShop = JSON.parse(localStorage.getItem('shop'));
  
    // Lista de rutas que no deben ser redirigidas
    const excludedRoutes = ['pin']; // Añade otras rutas si es necesario
  
    // Si la ruta actual no está en la lista de excluidas y no coincide con la ruta de la tienda, redirigir
    if (storedShop && !excludedRoutes.includes(currentPath) && currentPath !== storedShop.route) {
      navigate(`/${storedShop.route}/app`);
    }
  }, [navigate, isShopLoaded]);

  if (!isShopLoaded) {
    // Opcional: Puedes mostrar un spinner o un mensaje de carga aquí
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="bg-gray-light min-h-screen flex flex-col">
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
              <SessionExpiredModal />
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
                    saveCurrentCartAsParked={saveCurrentCartAsParked} // Pasar la función
                    getParkedCarts={getParkedCarts}                     // Pasar la función
                    loadParkedCart={loadParkedCart}                     // Pasar la función
                    deleteParkedCart={deleteParkedCart}                 // Pasar la función
                    // Pasar props de descuentos a SalesCard
                    appliedDiscounts={appliedDiscounts}
                    addDiscount={addDiscount}
                    removeDiscountByIndex={removeDiscountByIndex}
                    clearDiscounts={clearDiscounts}
                  />
                </div>
                <div className="w-full md:w-2/3">
                  <ProductSearchCard
                  onAddProduct={handleAddProduct}
                  onAddDiscount={addDiscount}
                  />
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