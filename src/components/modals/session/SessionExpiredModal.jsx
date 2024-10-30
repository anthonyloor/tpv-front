import React from 'react';
import Modal from '../Modal'; // Asegúrate de ajustar la ruta si tu Modal está en otra ubicación
import { useContext } from 'react';
import { AuthContext } from '../../../AuthContext';
import { useNavigate } from 'react-router-dom';

const SessionExpiredModal = () => {
  const { isSessionExpired, setIsSessionExpired, setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const shop = JSON.parse(localStorage.getItem('shop'));
  const shopRoute = shop ? shop.route : '';

  const handleRelogin = () => {
    // Limpiamos los datos de autenticación
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    localStorage.removeItem('shop');
    localStorage.removeItem('selectedClient');
    localStorage.removeItem('selectedAddress');
    localStorage.removeItem('configData');

    setIsAuthenticated(false);
    setIsSessionExpired(false);

    // Redirigimos al inicio de sesión de la tienda actual
    navigate(`/${shopRoute}`);
  };

  if (!isSessionExpired) {
    return null;
  }

  return (
    <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Sesión Expirada</h2>
        <p className="mb-6">
          La sesión del empleado ha expirado. Por favor, inicia sesión de nuevo.
        </p>
        <button
          onClick={handleRelogin}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Iniciar Sesión
        </button>
      </div>
    </Modal>
  );
};

export default SessionExpiredModal;
