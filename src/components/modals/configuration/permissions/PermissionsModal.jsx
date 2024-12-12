// src/components/modals/configuration/permissions/PermissionsModal.jsx
import React, { useState } from 'react';

const PermissionsModal = ({ onClose, empleadoActual, setPermisosGlobal }) => {
  const [permisos, setPermisos] = useState({
    "Vendedor TPV": { "acceso_ejecutar": "Denegado" },
    "Encargado": { "acceso_ejecutar": "Permitido" },
    "Admin": { "acceso_ejecutar": "Permitido" }
  });

  const handlePermisoChange = (rol, accion, permiso) => {
    setPermisos((prevPermisos) => ({
      ...prevPermisos,
      [rol]: { ...prevPermisos[rol], [accion]: permiso }
    }));
  };

  const handleGuardarPermisos = () => {
    setPermisosGlobal(permisos);
    alert('Permisos actualizados correctamente');
    onClose();
  };

  return (
    <div>
      {/* Título eliminado, ahora el título principal se maneja en el modal padre */}
      {empleadoActual?.nivel_permisos === 'Admin' ? (
        <div className="space-y-4">
          {['Vendedor TPV', 'Encargado', 'Admin'].map((rol) => (
            <div key={rol} className="space-y-4">
              <h3 className="font-bold">{rol}</h3>
              <div className="flex justify-between items-center">
                <span>Acceso al botón "Ejecutar"</span>
                <select
                  className="border rounded p-2"
                  value={permisos[rol]?.acceso_ejecutar || 'Denegado'}
                  onChange={(e) => handlePermisoChange(rol, 'acceso_ejecutar', e.target.value)}
                >
                  <option value="Denegado">Denegado</option>
                  <option value="Permitido">Permitido</option>
                </select>
              </div>
            </div>
          ))}
          <button className="bg-blue-500 text-white px-4 py-2 rounded mt-4" onClick={handleGuardarPermisos}>
            Guardar Permisos
          </button>
        </div>
      ) : (
        <p className="text-red-500">No tienes permisos para modificar la configuración.</p>
      )}
    </div>
  );
};

export default PermissionsModal;