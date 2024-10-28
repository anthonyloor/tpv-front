import React, { useState, useContext, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import NavbarCard from './components/base/NavbarCard.jsx';
import SalesCard from './components/base/SalesCard.jsx';
import ProductSearchCard from './components/base/ProductSearchCard.jsx';
import PinPage from './components/pages/PinPage.jsx';
import LoginPage from './components/pages/LoginPage.jsx';
import NotFoundPage from './components/pages/NotFoundPage.jsx';
import { AuthContext } from './AuthContext';
import PrivateRoute from './PrivateRoute.js';
import ConfigLoader from './components/ConfigLoader.jsx'; // Importa el ConfigLoader

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const { isAuthenticated, setIsAuthenticated, setShopId, setEmployeeId, setEmployeeName, setShopName } = useContext(AuthContext);
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

  // Función para añadir productos al ticket, verificando la cantidad máxima disponible
  const handleAddProduct = (
    product,
    stockQuantity,
    allowOutOfStockSales,
    exceedsStockCallback,
    forceAdd = false
  ) => {
    const existingProduct = cartItems.find(
      (item) => item.id_stock_available === product.id_stock_available
    );

    const maxQuantity =
      stockQuantity !== null && stockQuantity !== undefined ? stockQuantity : Infinity;

    let newQuantity = existingProduct ? existingProduct.quantity + 1 : 1;

    if (newQuantity > maxQuantity && !forceAdd) {
      if (!allowOutOfStockSales) {
        alert('No puedes añadir más de la cantidad disponible');
        return;
      } else {
        // Si se permite vender sin stock, llamamos al callback para mostrar el modal
        if (exceedsStockCallback) exceedsStockCallback(true);
        return;
      }
    }

    // Obtener la tasa de impuestos del producto o usar un valor predeterminado
    const tax_rate = product.tax_rate !== undefined ? product.tax_rate : 0.21; // 21% por defecto
    const price_excl_tax = product.price_incl_tax / (1 + tax_rate);
    const final_price_excl_tax = product.final_price_incl_tax / (1 + tax_rate);

    // Ahora actualizamos el carrito
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
            quantity: 1,
            price_incl_tax: product.price_incl_tax,
            final_price_incl_tax: product.final_price_incl_tax,
            price_excl_tax: parseFloat(price_excl_tax.toFixed(2)),
            final_price_excl_tax: parseFloat(final_price_excl_tax.toFixed(2)),
            unit_price_tax_excl: parseFloat(final_price_excl_tax.toFixed(2)),
            tax_rate: tax_rate,
          },
        ];
      }
    });

    // Establecemos la última acción para la animación en SalesCard
    setLastAction({
      id: product.id_stock_available,
      action: 'add',
      timestamp: Date.now(),
    });
  };

    /// Reducir la cantidad de un producto
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

    // Establecemos la última acción para la animación en SalesCard
    setLastAction({
      id: idStockAvailable,
      action: 'decrease',
      timestamp: Date.now(),
    });
  };

  // Eliminar un producto completamente del ticket
  const handleRemoveProduct = (idStockAvailable) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id_stock_available !== idStockAvailable)
    );
  };


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
        {/* Ruta protegida para la aplicación principal */}
        <Route
          path="/:shopRoute/app"
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
                  />
                </div>
                <div className="w-full md:w-2/3">
                  <ProductSearchCard onAddProduct={handleAddProduct} />
                </div>
              </div>
            </PrivateRoute>
          }
        />
        {/* Ruta para manejar páginas no encontradas */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;