// src/components/modals/session/SessionExpiredModal.jsx
import React, { useContext } from 'react';
import Modal from '../Modal';
import { AuthContext } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SessionExpiredModal = () => {
  const { isSessionExpired, setIsSessionExpired, setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const shop = JSON.parse(localStorage.getItem('shop'));
  const shopRoute = shop ? shop.route : '';

  const handleRelogin = () => {
    // Limpiar datos de autenticación
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    localStorage.removeItem('shop');
    localStorage.removeItem('selectedClient');
    localStorage.removeItem('selectedAddress');
    localStorage.removeItem('configData');
    localStorage.removeItem('dailyPin');
    localStorage.removeItem('pinExpiration');

    setIsAuthenticated(false);
    setIsSessionExpired(false); // Restablecer estado

    /// Redirigimos al inicio de sesión de la tienda actual
    navigate(`/${shopRoute}`);
  };

  if (!isSessionExpired) {
    return null;
  }

  return (
    <Modal isOpen={true} onClose={() => {}} showCloseButton={false} showSeparator={false} size="sm" height="default">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Sesión Expirada</h2>
        <p className="mb-6">
          La sesión del empleado ha expirado. Por favor, inicia sesión de nuevo.
        </p>
        <button
          onClick={handleRelogin}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Aceptar
        </button>
      </div>
    </Modal>
  );
};

export default SessionExpiredModal;