// src/components/modals/session/SessionExpiredDialog.jsx

import React, { useContext, useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { AuthContext } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const SessionExpiredDialog = () => {
  const { isSessionExpired, setIsSessionExpired, setIsAuthenticated } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const shop = JSON.parse(localStorage.getItem("shop"));
  const shopRoute = shop ? shop.route : "";

  const handleRelogin = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employee");
    localStorage.removeItem("shop");
    localStorage.removeItem("selectedClient");
    localStorage.removeItem("selectedAddress");
    localStorage.removeItem("configData");

    setIsAuthenticated(false);
    setIsSessionExpired(false);
    navigate(`/${shopRoute}`);
  };

  const [countdown, setCountdown] = useState(5);
  useEffect(() => {
    if (isSessionExpired) {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleRelogin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSessionExpired]);

  return (
    <Dialog
      header="Sesión Expirada"
      visible={isSessionExpired}
      onHide={() => {}}
      draggable={false}
      modal
      closable={false}
      style={{ width: "25rem", backgroundColor: "var(--surface-0)" }}
    >
      <div className="text-center">
        <p className="mb-6">
          La sesión del empleado ha expirado. La aplicación se cerrará en{" "}
          {countdown} {countdown === 1 ? "segundo" : "segundos"}.
        </p>
        <Button
          label="Aceptar"
          icon="pi pi-check"
          className="p-button-primary"
          onClick={handleRelogin}
        />
      </div>
    </Dialog>
  );
};

export default SessionExpiredDialog;
