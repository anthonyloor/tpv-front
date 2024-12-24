// src/components/modals/reports/SalesReportModal.jsx
import React from 'react';
import Modal from '../modals/Modal';
import SalesReportSearch from './SalesReportSearch';

const SalesReportModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reporte de Ventas" size="2xl" height="tall">
      <SalesReportSearch />
    </Modal>
  );
};

export default SalesReportModal;