import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shopId, setShopId] = useState(null);
  const [shopName, setShopName] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  // Nuevo estado para sesión expirada
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  // Función para manejar sesión expirada
  const handleSessionExpired = () => {
    setIsSessionExpired(true);
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
        isSessionExpired,
        setIsSessionExpired,
        handleSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;