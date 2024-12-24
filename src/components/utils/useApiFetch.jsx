import { useCallback, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';

export const useApiFetch = () => {
  const { handleSessionExpired } = useContext(AuthContext);
  const token = localStorage.getItem('token');

  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token inválido o expirado
        // Llamamos a handleSessionExpired para mostrar el modal y forzar el re-login
        handleSessionExpired();

        const data = await response.json();
        const error = { status: response.status, message: data.message };
        return Promise.reject(error);
      }

      const data = await response.json();

      if (!response.ok) {
        const error = { status: response.status, message: data.message };
        return Promise.reject(error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }, [token, handleSessionExpired]); // Añadimos handleSessionExpired a las dependencias

  return apiFetch;
};