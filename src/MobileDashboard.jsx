// src/MobileDashboard.jsx
import React, { useState } from 'react';
import TransfersModal from './components/modals/transfers/TransfersModal';
// ... etc

export default function MobileDashboard() {
  const [showTransfers, setShowTransfers] = useState(false);

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold">Panel Móvil</h1>

      <button
        className="bg-blue-500 text-white px-3 py-2 rounded mt-2 mr-2"
        onClick={() => setShowTransfers(true)}
      >
        Gestión de Movimientos
      </button>

      {/* Abrir modales si showTransfers o showStock */}
      {showTransfers && (
        <TransfersModal
          isOpen={true}
          onClose={() => setShowTransfers(false)}
        />
      )}
    </div>
  );
}