import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { useScreenResolution } from "../../../hooks/useScreenResolution";
import { jwtDecode } from "jwt-decode";

const VersionInfoModal = ({ isOpen, onClose, version }) => {
  const { screenWidth, screenHeight, innerWidth, innerHeight } =
    useScreenResolution();

  const [remainingTime, setRemainingTime] = useState(0);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {
    const updateRemaining = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const expTime = decoded.exp * 1000;
          const now = Date.now();
          const diff = expTime - now;
          setRemainingTime(diff > 0 ? diff : 0);
        } catch (error) {
          console.error("Error decoding token:", error);
          setRemainingTime(0);
        }
      }
    };
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Dialog
      header="Información TPV-LP"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{
        maxWidth: "30vw",
        maxHeight: "30vh",
        width: "25vw",
        height: "28vh",
      }}
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
        <p>
          <strong>Tiempo restante de sesión:</strong>{" "}
          {formatTime(remainingTime)}
        </p>
      </div>
    </Dialog>
  );
};

export default VersionInfoModal;
