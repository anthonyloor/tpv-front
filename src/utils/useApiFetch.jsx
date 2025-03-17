// src/components/utils/useApiFetch.jsx

import { useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useApiFetch = () => {
  const { handleSessionExpired } = useContext(AuthContext);
  const token = localStorage.getItem('token');

  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        handleSessionExpired();
        const data = await response.json();
        return Promise.reject({ status: response.status, message: data.message });
      }

      const data = await response.json();

      if (!response.ok) {
        return Promise.reject({ status: response.status, message: data.message });
      }

      return data;
    } catch (error) {
      throw error;
    }
  }, [token, handleSessionExpired]);

  return apiFetch;
};