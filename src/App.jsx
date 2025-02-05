// App.jsx

import React, { useEffect, useContext, useState } from 'react';
import { Toaster } from 'sonner';
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
import useDiscounts from './hooks/useDiscounts';
import SalesCardActions from './components/Sales/SalesCardActions';
import StoreStockPanel from './components/Stock/StoreStockPanel';
import 'primereact/resources/themes/md-light-indigo/theme.css'; // Tema Material
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { isMobile } from 'react-device-detect'; // <-- 1) importamos isMobile
import MobileDashboard from './MobileDashboard'; // <-- 2) importamos tu UI móvil

function App() {
  const { setIsAuthenticated, setShopId, setEmployeeId, setEmployeeName, setIdProfile, setShopName } = useContext(AuthContext);
  const { configData } = useContext(ConfigContext);
  const allowOutOfStockSales = configData ? configData.allow_out_of_stock_sales : false;
  const navigate = useNavigate();
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [isShopLoaded, setIsShopLoaded] = useState(false);

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
      setIsShopLoaded(true);
    } else {
      setIsShopLoaded(true);
    }
  }, [setIsAuthenticated, setShopId, setShopName, setEmployeeId, setEmployeeName, setIdProfile]);

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

  useEffect(() => {
    if (!isShopLoaded) return;
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
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }
  
  if (isMobile) {
    // Si es móvil => devolvemos la UI de móvil (MobileDashboard)
    return (
      <MobileDashboard />
    );
  }

  // 4) Si NO es móvil => devolvemos la UI de siempre (TPV de escritorio)
  return (
    <div className="bg-gray-light min-h-screen flex flex-col">
      <Toaster position="top-center" expand={true} />
      <Routes>
        {/* Rutas de login */}
        <Route path="/penaprieta8" element={<LoginPage shopRoute="penaprieta8" />} />
        <Route path="/bravomurillo205" element={<LoginPage shopRoute="bravomurillo205" />} />
        <Route path="/alcala397" element={<LoginPage shopRoute="alcala397" />} />
        <Route path="/bodega" element={<LoginPage shopRoute="bodega" />} />
        <Route path="/mayretmodacolombiana" element={<LoginPage shopRoute="mayretmodacolombiana" />} />
        <Route path="/pin" element={<PinPage />} />

        {/* Ruta principal protegida */}
        <Route path="/:shopRoute/app"
          element={
            <PrivateRoute>
              <SessionExpiredModal />
              <ConfigLoader />
              <div className="grid grid-cols-3 grid-rows-[auto,1fr,1fr,1fr,auto] gap-2 p-2 h-screen">
                {/* div1 => NavBarCard => col-span-3, row=1 */}
                <div className="col-span-3 bg-white shadow row-span-1 rounded-lg">
                  <NavbarCard />
                </div>
                {/* div2 => SalesCard (contenido principal, SIN sus botones de abajo) => col=1, row-span=3, row-start=2 */}
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