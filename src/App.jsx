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
      (item) => item.id_product_attribute === product.id_product_attribute
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

    // Ahora actualizamos el carrito
    setCartItems((prevItems) => {
      if (existingProduct) {
        return prevItems.map((item) =>
          item.id_product_attribute === product.id_product_attribute
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });

    // Establecemos la última acción para la animación en SalesCard
    setLastAction({
      id: product.id_product_attribute,
      action: 'add',
      timestamp: Date.now(),
    });
  };

  // Función para reducir la cantidad de un producto o eliminarlo si llega a 0
  const handleDecreaseProduct = (idProductAttribute) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) =>
          item.id_product_attribute === idProductAttribute
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

    // Establecemos la última acción para la animación en SalesCard
    setLastAction({
      id: idProductAttribute,
      action: 'decrease',
      timestamp: Date.now(),
    });
  };

  // Función para eliminar un producto completamente del ticket
  const handleRemoveProduct = (idProductAttribute) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id_product_attribute !== idProductAttribute)
    );
  };

  return (
    <div className="bg-gray-light min-h-screen flex flex-col">
      {/* Mostrar NavbarCard solo si el usuario está autenticado */}
      {isAuthenticated && <NavbarCard />}

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
              <div className="flex flex-col md:flex-row flex-grow p-4 space-y-4 md:space-y-0 md:space-x-4">
                <div className="w-full md:w-2/5">
                  <SalesCard
                    cartItems={cartItems}
                    setCartItems={setCartItems}
                    onRemoveProduct={handleRemoveProduct}
                    onDecreaseProduct={handleDecreaseProduct}
                    lastAction={lastAction}
                  />
                </div>
                <div className="w-full md:w-3/5">
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