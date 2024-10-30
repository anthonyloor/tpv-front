// src/utils/apiFetch.js

export const apiFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
  
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  
    return fetch(url, {
      ...options,
      headers,
    })
      .then((response) => {
        if (response.status === 401) {
          // Token inválido o expirado
          return response.json().then((data) => {
            const error = { status: response.status, message: data.message };
            return Promise.reject(error);
          });
        }
  
        return response.json().then((data) => {
          if (!response.ok) {
            const error = { status: response.status, message: data.message };
            return Promise.reject(error);
          }
          return data;
        });
      })
      .catch((error) => {
        throw error;
      });
  };
  