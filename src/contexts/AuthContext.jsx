// src/contexts/AuthContext.jsx
import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shopId, setShopId] = useState(null);
  const [shopName, setShopName] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [idProfile, setIdProfile] = useState(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const handleSessionExpired = () => {
    setIsSessionExpired(true);
  };

  // La función cierra sesión limpiando storage y estados,
  // pero NO llama a navigate
  const handleLogout = () => {
    // Lógica para limpiar datos de sesión
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    localStorage.removeItem('shop');
    localStorage.removeItem('selectedClient');
    localStorage.removeItem('selectedAddress');

    // Resetea los estados
    setIsAuthenticated(false);
    setShopId(null);
    setShopName('');
    setEmployeeId(null);
    setEmployeeName('');
    setIdProfile(null);
    setIsSessionExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        shopId,
        setShopId,
        shopName,
        setShopName,
        employeeId,
        setEmployeeId,
        employeeName,
        setEmployeeName,
        idProfile,
        setIdProfile,
        isSessionExpired,
        setIsSessionExpired,
        handleSessionExpired,
        // Exportamos handleLogout sin navigate
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;