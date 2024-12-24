import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import AuthProvider from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ClientProvider } from './contexts/ClientContext';
import { BrowserRouter as Router } from 'react-router-dom';
import PinProvider from './contexts/PinContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
      <ConfigProvider>
      <ClientProvider>
      <PinProvider>
        <App />
        </PinProvider>
      </ClientProvider>
        </ConfigProvider>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();