import React from "react";
import { Dialog } from "primereact/dialog";
import { useScreenResolution } from "../../../hooks/useScreenResolution";

const VersionInfoModal = ({ isOpen, onClose, version }) => {
  const { screenWidth, screenHeight, innerWidth, innerHeight } =
    useScreenResolution();

  return (
    <Dialog
      header="Información de la Versión y Resolución"
      visible={isOpen}
      onHide={onClose}
      modal
      style={{ width: "50vw" }}
    >
      <div>
        <p>
          <strong>Versión TPV:</strong> {version || "N/A"}
        </p>
        <p>
          <strong>Resolución de pantalla (screen):</strong> {screenWidth} x{" "}
          {screenHeight}
        </p>
        <p>
          <strong>Dimensiones de la ventana (inner):</strong> {innerWidth} x{" "}
          {innerHeight}
        </p>
      </div>
    </Dialog>
  );
};

export default VersionInfoModal;
