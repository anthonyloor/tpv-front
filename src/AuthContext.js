import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shopId, setShopId] = useState(null);
  const [shopName, setShopName] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState('');

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
