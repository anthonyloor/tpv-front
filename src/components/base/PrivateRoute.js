// src/components/base/PrivateRoute.jsx
import React, { useContext } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const { shopRoute } = useParams();

  // Si no está autenticado, redirigimos al login de la tienda actual
  if (!isAuthenticated) {
    return <Navigate to={`/${shopRoute}`} replace />;
  }

  // Si está autenticado, mostramos el contenido
  return children;
};

export default PrivateRoute;