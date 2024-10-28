// ConfigLoader.jsx
import React, { useEffect, useState } from 'react';
import ConfigModal from './modals/config/ConfigModal';

function ConfigLoader() {
  const [configData, setConfigData] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [licenseData, setLicenseData] = useState(() => {
    const data = localStorage.getItem('licenseData');
    return data ? JSON.parse(data) : null;
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!licenseData || !licenseData.licenseKey) {
      console.error('No se encontró la licencia en localStorage');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No se encontró el token JWT en localStorage');
      return;
    }

    fetch(`https://apitpv.anthonyloor.com/get_config_tpv?license=${licenseData.licenseKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((response) => {
        return response.json().then((data) => {
          return { status: response.status, data };
        });
      })
      .then(({ status, data }) => {
        if (status === 200) {
          if (data.error === 'Configuration not found') {
            setShowConfigModal(true);
          } else {
            // Asumimos que recibimos los datos de configuración
            setConfigData(data);
            console.log('Config Data:', data);
          }
        } else {
          console.error('Respuesta inesperada:', data);
        }
      })
      .catch((error) => {
        console.error('Error al obtener la configuración:', error);
      });
  }, [licenseData]);

  const handleConfigSubmit = (config) => {
    // Agregar la licencia al config
    const configToSend = {
      ...config,
      license: licenseData.licenseKey,
    };

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No se encontró el token JWT en localStorage');
      setErrorMessage('Error de autenticación. Por favor, inicia sesión de nuevo.');
      return;
    }

    fetch('https://apitpv.anthonyloor.com/create_config_tpv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(configToSend),
    })
      .then((response) => {
        return response.json().then((data) => {
          return { status: response.status, data };
        });
      })
      .then(({ status, data }) => {
        if (
          status === 201 &&
          data.status === 'success' &&
          data.message === 'TPV Config created successfully'
        ) {
          setConfigData(configToSend);
          setShowConfigModal(false);
          console.log('Config Data:', configToSend);
        } else {
          setErrorMessage(data.message || data.error || 'Error al crear la configuración');
        }
      })
      .catch((error) => {
        console.error('Error al crear la configuración:', error);
        setErrorMessage('Error al crear la configuración');
      });
  };

  if (showConfigModal) {
    return <ConfigModal onSubmit={handleConfigSubmit} errorMessage={errorMessage} />;
  }

  return null;
}

export default ConfigLoader;
