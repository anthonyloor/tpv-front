// src/App.jsx

import React, { useEffect, useContext, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { Routes, Route, useNavigate } from "react-router-dom";
import PinPage from "./components/pages/PinPage";
import LoginPage from "./components/pages/LoginPage";
import { AuthContext } from "./contexts/AuthContext";
import PrivateRoute from "./components/base/PrivateRoute";
import ConfigLoader from "./components/ConfigLoader";
import SessionExpiredDialog from "./components/modals/session/SessionExpiredDialog";
import VersionUpdateDialog from "./components/modals/session/VersionUpdateDialog";
import { isMobile } from "react-device-detect";
import MobileDashboard from "./MobileDashboard";
import DesktopTPV from "./DesktopTPV";
import { ProgressSpinner } from "primereact/progressspinner";
import { useTheme, applyTheme } from "./components/ThemeSwitcher";

function App() {
  const {
    setIsAuthenticated,
    setShopId,
    setEmployeeId,
    setEmployeeName,
    setIdProfile,
    setShopName,
  } = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isShopLoaded, setIsShopLoaded] = useState(false);
  const [showVersionUpdate, setShowVersionUpdate] = useState(false);
  const currentVersion = useRef(null);
  const toast = useRef(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch("/version-lp.json", { cache: "no-store" });
        const data = await response.json();

        if (!currentVersion.current) {
          currentVersion.current = data.version;
        } else if (currentVersion.current !== data.version) {
          setShowVersionUpdate(true);
        }
      } catch (err) {
        console.error("Error comprobando versión:", err);
      }
    };

    const interval = setInterval(checkVersion, 60 * 1000); // cada 60 segundos
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  if (!isShopLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col min-h-screen"
        style={{ backgroundColor: "var(--surface-200)" }}
      >
        <Toast ref={toast} />
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
                <SessionExpiredDialog />
                <ConfigLoader />
                {isMobile ? <MobileDashboard /> : <DesktopTPV />}
              </PrivateRoute>
            }
          />
          <Route path="/:shopRoute" element={<LoginPage />} />

          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
      {showVersionUpdate && (
        <VersionUpdateDialog
          visible={showVersionUpdate}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}

export default App;
