import { useCallback } from 'react';

export const useApiFetch = () => {
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
  }, [token]); // Memoizamos apiFetch dependiendo del token

  return apiFetch;
};
