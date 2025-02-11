// src/App.jsx

import React, { useEffect, useContext, useState } from "react";
import { Toaster } from "sonner";
import { Routes, Route, useNavigate } from "react-router-dom";
import PinPage from "./components/pages/PinPage";
import LoginPage from "./components/pages/LoginPage";
import NotFoundPage from "./components/pages/NotFoundPage";
import { AuthContext } from "./contexts/AuthContext";
import PrivateRoute from "./components/base/PrivateRoute";
import ConfigLoader from "./components/ConfigLoader";
import SessionExpiredModal from "./components/modals/session/SessionExpiredModal";
import { isMobile } from "react-device-detect";
import MobileDashboard from "./MobileDashboard";
import DesktopTPV from "./DesktopTPV";
import { ProgressSpinner } from "primereact/progressspinner";

function App() {
  const {
    setIsAuthenticated,
    setShopId,
    setEmployeeId,
    setEmployeeName,
    setIdProfile,
    setShopName,
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isShopLoaded, setIsShopLoaded] = useState(false);

  useEffect(() => {
    const storedShop = JSON.parse(localStorage.getItem("shop"));
    const storedEmployee = JSON.parse(localStorage.getItem("employee"));
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
  }, [
    setIsAuthenticated,
    setShopId,
    setShopName,
    setEmployeeId,
    setEmployeeName,
    setIdProfile,
  ]);

  useEffect(() => {
    if (!isShopLoaded) return;
    const currentPath = window.location.pathname.split("/")[1];
    const storedShop = JSON.parse(localStorage.getItem("shop"));
    // Lista de rutas que no deben ser redirigidas
    const excludedRoutes = ["pin"]; // Añade otras rutas si es necesario
    // Si la ruta actual no está en la lista de excluidas y no coincide con la ruta de la tienda, redirigir
    if (
      storedShop &&
      !excludedRoutes.includes(currentPath) &&
      currentPath !== storedShop.route
    ) {
      navigate(`/${storedShop.route}/app`);
    }
  }, [navigate, isShopLoaded]);

  if (!isShopLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "var(--surface-200)" }}
    >
      <Toaster position="top-center" expand={true} />
      <Routes>
        {/* Rutas de login */}
        <Route
          path="/penaprieta8"
          element={<LoginPage shopRoute="penaprieta8" />}
        />
        <Route
          path="/bravomurillo205"
          element={<LoginPage shopRoute="bravomurillo205" />}
        />
        <Route
          path="/alcala397"
          element={<LoginPage shopRoute="alcala397" />}
        />
        <Route path="/bodega" element={<LoginPage shopRoute="bodega" />} />
        <Route
          path="/mayretmodacolombiana"
          element={<LoginPage shopRoute="mayretmodacolombiana" />}
        />
        <Route path="/pin" element={<PinPage />} />

        {/* Ruta principal protegida */}
        <Route
          path="/:shopRoute/app"
          element={
            <PrivateRoute>
              <SessionExpiredModal />
              <ConfigLoader />
              {isMobile ? <MobileDashboard /> : <DesktopTPV />}
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
