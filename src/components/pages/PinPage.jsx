import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { useApiFetch } from "../../utils/useApiFetch";
import getApiBaseUrl from "../../utils/getApiBaseUrl";

const PinPage = () => {
  const { idProfile, employeeId } = useContext(AuthContext);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [pin, setPin] = useState(null);
  const navigate = useNavigate();
  const apiFetch = useApiFetch();

  const fetchPin = async () => {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await apiFetch(`${API_BASE_URL}/get_pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_employee_request: employeeId }),
      });
      if (response && response.pin) {
        setPin(response.pin);
      }
    } catch (error) {
      console.error("Error fetching pin:", error);
    }
  };

  useEffect(() => {
    if (idProfile !== 1) {
      setShowAccessDeniedModal(true);
      const timer = setTimeout(() => {
        setShowAccessDeniedModal(false);
        navigate("/app");
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      fetchPin();
    }
  }, [idProfile, navigate, employeeId]);

  if (idProfile !== 1) {
    return (
      <Dialog
        visible={showAccessDeniedModal}
        onHide={() => {}}
        header="Acceso Denegado"
        modal
        closable={false}
        draggable={false}
        resizable={false}
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
      <p className="text-center text-3xl font-bold">{pin}</p>
      <Button
        label="Regenerar PIN"
        className="mt-4 w-full"
        onClick={fetchPin}
      />
    </div>
  );
};

export default PinPage;
