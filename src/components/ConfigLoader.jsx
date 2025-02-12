// src/components/ConfigLoader.jsx

import React, { useEffect, useState, useContext } from "react";
import { useApiFetch } from "./utils/useApiFetch";
import { ConfigContext } from "../contexts/ConfigContext";
import ConfigNotFoundDialog from "./modals/config/ConfigNotFoundDialog";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

function ConfigLoader() {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showConfigConfirmDialog, setShowConfigConfirmDialog] = useState(false);
  const [configError, setConfigError] = useState("");
  const { configData, setConfigData } = useContext(ConfigContext);
  const apiFetch = useApiFetch();

  useEffect(() => {
    if (configData) return;
    const licenseData = JSON.parse(localStorage.getItem("licenseData"));
    if (!licenseData || !licenseData.licenseKey) return;
    apiFetch(
      `https://apitpv.anthonyloor.com/get_config_tpv?license=${licenseData.licenseKey}`
    )
      .then((data) => {
        if (data.error === "Configuration not found") {
          // Mostrar confirmación para crear la configuración
          setShowConfigConfirmDialog(true);
        } else {
          setConfigData(data);
          console.log("Config Data:", data);
        }
      })
      .catch((error) => {
        console.error("Error al obtener la configuración:", error);
      });
  }, [apiFetch, configData, setConfigData]);

  const handleConfigSubmit = (newConfig) => {
    const licenseData = JSON.parse(localStorage.getItem("licenseData"));
    const configToSend = {
      ...newConfig,
      license: licenseData.licenseKey,
    };
    apiFetch("https://apitpv.anthonyloor.com/create_config_tpv", {
      method: "POST",
      body: JSON.stringify(configToSend),
    })
      .then((data) => {
        if (
          data.status === "success" &&
          data.message === "TPV Config created successfully"
        ) {
          setConfigData(configToSend);
          setShowConfigDialog(false);
          console.log("Config Data:", configToSend);
        } else {
          setConfigError(
            data.message || data.error || "Error al crear la configuración"
          );
        }
      })
      .catch((error) => {
        console.error("Error al crear la configuración:", error);
        setConfigError("Error al crear la configuración");
      });
  };

  // Diálogo de confirmación: no se puede cerrar ni mover
  const confirmFooter = (
    <div className="flex justify-end">
      <Button
        label="Crear"
        icon="pi pi-cog"
        className="p-button-primary"
        onClick={() => {
          setShowConfigConfirmDialog(false);
          setShowConfigDialog(true);
        }}
      />
    </div>
  );

  return (
    <>
      {showConfigConfirmDialog && (
        <Dialog
          header="Configuración no encontrada"
          visible={true}
          modal
          closable={false}
          draggable={false}
          resizable={false}
          style={{ width: "30rem", backgroundColor: "var(--surface-0)" }}
          footer={confirmFooter}
        >
          <div className="p-4">
            <p className="mb-4 text-center">
              No se encontró la configuración del TPV. Continua para crearla.
            </p>
          </div>
        </Dialog>
      )}
      {showConfigDialog && (
        <ConfigNotFoundDialog
          isOpen={true}
          onClose={() => {}}
          onConfigSubmit={handleConfigSubmit}
          errorMessage={configError}
          closable={false}
          draggable={false}
          resizable={false}
        />
      )}
    </>
  );
}

export default ConfigLoader;
