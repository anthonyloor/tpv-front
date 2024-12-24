// src/components/pages/PinPage.jsx
import React, { useContext, useEffect, useState } from 'react';
import { PinContext } from '../../contexts/PinContext';
import { AuthContext } from '../../contexts/AuthContext';
import Modal from '../modals/Modal';
import { useNavigate } from 'react-router-dom';

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
        navigate('/app');
      }, 5000); // Redirigir después de 5 segundos

      return () => clearTimeout(timer);
    }
  }, [idProfile, navigate]);

  if (idProfile !== 1) {
    return (
      <Modal
        isOpen={showAccessDeniedModal}
        onClose={() => {}}
        title="Acceso Denegado"
        showCloseButton={false}
      >
        <div className="p-4">
          <p>No tienes permisos para acceder a esta página. Serás redirigido en 5 segundos.</p>
        </div>
      </Modal>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-sm mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-4">PIN Diario</h2>
      <p className="text-center text-3xl font-bold">{dailyPin}</p>
      <p className="mt-4 text-sm text-gray-600">Este PIN se actualiza cada vez que se utiliza o cada hora.</p>
      <button
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={regeneratePin}
      >
        Regenerar PIN
      </button>
    </div>
  );
};

export default PinPage;