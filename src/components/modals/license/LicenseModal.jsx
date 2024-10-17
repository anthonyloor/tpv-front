// LicenseModal.jsx
import React, { useState } from 'react';

function LicenseModal({ onClose }) {
  const [licenseKey, setLicenseKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    /*if (licenseKey.length < 17) {
      alert('La clave de licencia debe tener al menos 10 caracteres.');
      return;
    }*/
    // Aquí puedes añadir validaciones adicionales si lo deseas
    localStorage.setItem('licenseKey', licenseKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">Activar Licencia</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            <span className="text-gray-700">Ingresa tu clave de licencia:</span>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full py-2 px-4 mt-4 rounded-md text-white font-semibold bg-indigo-600 hover:bg-indigo-700"
          >
            Activar
          </button>
        </form>
      </div>
    </div>
  );
}

export default LicenseModal;
