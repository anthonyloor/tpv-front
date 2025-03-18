import React, { useContext, useEffect, useState } from "react";
import { PinContext } from "../../contexts/PinContext";
import { AuthContext } from "../../contexts/AuthContext";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";

const PinPage = () => {
  const { dailyPin, regeneratePin } = useContext(PinContext);
  const { idProfile } = useContext(AuthContext);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (idProfile !== 1) {
      setShowAccessDeniedModal(true);
      const timer = setTimeout(() => {
        setShowAccessDeniedModal(false);
        navigate("/app");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [idProfile, navigate]);

  if (idProfile !== 1) {
    return (
      <Dialog
        visible={showAccessDeniedModal}
        onHide={() => {}}
        header="Acceso Denegado"
        modal
        closable={false}
      >
        <div className="p-4">
          <p>
            No tienes permisos para acceder a esta página. Serás redirigido en 5
            segundos.
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <div className="rounded-lg shadow p-2 max-w-sm mx-auto">
      <h2 className="text-2xl font-bold mb-4">PIN Diario</h2>
      <p className="text-center text-3xl font-bold">{dailyPin}</p>
      <p className="mt-4 text-sm text-gray-600">
        Este PIN se actualiza cada 5 minutos.
      </p>
      <Button
        label="Regenerar PIN"
        className="mt-4 w-full"
        onClick={regeneratePin}
      />
    </div>
  );
};

export default PinPage;
