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
  const [openCloseCashModal, setOpenCloseCashModal] = useState(false);

  const handleSessionExpired = () => {
    setIsSessionExpired(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    localStorage.removeItem('shop');
    localStorage.removeItem('selectedClient');
    localStorage.removeItem('selectedAddress');

    setIsAuthenticated(false);
    setShopId(null);
    setShopName('');
    setEmployeeId(null);
    setEmployeeName('');
    setIdProfile(null);
    setIsSessionExpired(false);
    setOpenCloseCashModal(false);
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
        handleLogout,
        openCloseCashModal,
        setOpenCloseCashModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;