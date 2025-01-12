// src/components/modals/cashRegister/CloseCashRegisterModal.jsx

import React from 'react';
import Modal from '../Modal';
import CloseCashRegisterForm from './CloseCashRegisterForm';

const CloseCashRegisterModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cierre de Caja"
      size="lg"
      height="tall"
    >
      <CloseCashRegisterForm onClose={onClose} />
    </Modal>
  );
};

export default CloseCashRegisterModal;