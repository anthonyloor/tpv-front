// src/components/base/PrivateRoute.jsx

import React, { useContext } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const { shopRoute } = useParams();

  if (!isAuthenticated) {
    return <Navigate to={`/${shopRoute}`} replace />;
  }
  return children;
};

export default PrivateRoute;