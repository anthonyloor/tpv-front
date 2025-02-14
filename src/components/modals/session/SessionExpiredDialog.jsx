// src/components/modals/session/SessionExpiredDialog.jsx

import React, { useContext } from "react";
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
    localStorage.removeItem("dailyPin");
    localStorage.removeItem("pinExpiration");

    setIsAuthenticated(false);
    setIsSessionExpired(false);
    navigate(`/${shopRoute}`);
  };

  return (
    <Dialog
      header="Sesión Expirada"
      visible={isSessionExpired}
      onHide={() => {}}
      modal
      closable={false}
      style={{ width: "25rem", backgroundColor: "var(--surface-0)" }}
    >
      <div className="text-center">
        <p className="mb-6">
          La sesión del empleado ha expirado. Por favor, inicia sesión de nuevo.
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
