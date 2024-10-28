// LicenseModal.jsx
import React, { useState } from 'react';

function LicenseModal({ onSubmit, errorMessage }) {
  const [licenseKey, setLicenseKey] = useState('');

  const handleLicenseSubmit = () => {
    onSubmit(licenseKey);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Ingrese su Licencia</h2>
        {errorMessage && (
          <div className="mb-4 text-red-500 text-center">{errorMessage}</div>
        )}
        <input
          type="text"
          placeholder="Licencia"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <div className="flex justify-end">
          <button
            onClick={handleLicenseSubmit}
            disabled={!licenseKey}
            className={`py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
              !licenseKey
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Verificar Licencia
          </button>
        </div>
      </div>
    </div>
  );
}

export default LicenseModal;
