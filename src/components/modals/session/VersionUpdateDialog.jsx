import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";

const VersionUpdateDialog = ({ visible, onUpdate }) => {
  const [counter, setCounter] = useState(5);

  useEffect(() => {
    if (visible) {
      setCounter(5);
      const interval = setInterval(() => {
        setCounter((prevCounter) => {
          if (prevCounter <= 1) {
            clearInterval(interval);
            onUpdate();
            return 0;
          }
          return prevCounter - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [visible, onUpdate]);

  return (
    <Dialog
      header="Nueva versión disponible"
      visible={visible}
      onHide={() => {}}
      draggable={false}
      modal
      closable={false}
      style={{ width: "25rem", backgroundColor: "var(--surface-0)" }}
    >
      <div className="text-center">
        <p className="mb-6">
          🔄 Nueva versión detectada. La página se actualizará en {counter}{" "}
          {counter === 1 ? "segundo" : "segundos"} o bien haz clic en
          "Actualizar".
        </p>
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          className="p-button-primary"
          onClick={onUpdate}
        />
      </div>
    </Dialog>
  );
};

export default VersionUpdateDialog;
