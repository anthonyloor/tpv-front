import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import AuthProvider from './AuthContext';
import { ConfigProvider } from './ConfigContext';
import { ClientProvider } from './ClientContext';
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
      <ConfigProvider>
      <ClientProvider>
        <App />
      </ClientProvider>
        </ConfigProvider>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();