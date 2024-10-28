import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={location.pathname} />;
  }

  return children;
};

export default PrivateRoute;