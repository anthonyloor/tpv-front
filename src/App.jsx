// src/App.jsx

import React, { useEffect, useContext, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
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
import { useTokenExpiryWarning } from "./hooks/useTokenExpiryWarning";

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
  const tokenToastShownRef = useRef(false);

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

  const TokenCountdownToast = ({ duration = 300000 }) => {
    const [remaining, setRemaining] = useState(duration);

    useEffect(() => {
      const interval = setInterval(() => {
        setRemaining((prev) => Math.max(prev - 1000, 0));
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    const formatTime = (ms) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      return `${minutes}:${seconds}`;
    };

    const progress = Math.floor(((duration - remaining) / duration) * 100);

    return (
      <section className="flex p-3 gap-3 w-full fadeindown">
        <i className="pi pi-clock text-primary-500 text-2xl"></i>
        <div className="flex flex-column gap-3 w-full">
          <p className="m-0 font-semibold text-base">
            La sesión se cerrará en {formatTime(remaining)}
          </p>
          <div className="flex flex-column gap-2">
            <ProgressBar value={progress} showValue={false} />
          </div>
        </div>
      </section>
    );
  };

  const handleTokenExpiryWarning = (remainingMs) => {
    if (remainingMs <= 0 && toast.current) {
      toast.current.clear("token-warning");
      return;
    }
    if (!tokenToastShownRef.current && toast.current) {
      toast.current.show({
        id: "token-warning",
        sticky: true,
        content: ({ message }) => <TokenCountdownToast />,
        style: {
          backgroundColor: "var(--surface-0)",
          borderRadius: "10px",
        },
      });
      tokenToastShownRef.current = true;
    }
  };

  useTokenExpiryWarning(handleTokenExpiryWarning, 5);

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
            path="/pueblonuevo"
            element={<LoginPage shopRoute="pueblonuevo" />}
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
