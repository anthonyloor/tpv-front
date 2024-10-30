// src/utils/useApiFetch.js

import { useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import { apiFetch } from './apiFetch';

export const useApiFetch = () => {
  const { handleSessionExpired } = useContext(AuthContext);

  const customFetch = (url, options = {}) => {
    return apiFetch(url, options).catch((error) => {
      if (error.status === 401) {
        handleSessionExpired(); // Actualizamos el estado de sesión expirada
      }
      throw error;
    });
  };

  return customFetch;
};
