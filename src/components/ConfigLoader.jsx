// ConfigLoader.jsx
import React, { useEffect, useState, useContext } from 'react';
import ConfigModal from './modals/config/ConfigModal';
import { useApiFetch } from '../components/utils/useApiFetch';
import { ConfigContext } from '../contexts/ConfigContext';

function ConfigLoader() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { configData, setConfigData } = useContext(ConfigContext);

  const apiFetch = useApiFetch();

  useEffect(() => {
    // Si ya tenemos la configuración, no hacemos nada
    if (configData) {
      return;
    }

    // Cargamos la licencia desde localStorage
    const licenseData = JSON.parse(localStorage.getItem('licenseData'));

    if (!licenseData || !licenseData.licenseKey) {
      console.error('No se encontró la licencia en localStorage');
      return;
    }

    apiFetch(`https://apitpv.anthonyloor.com/get_config_tpv?license=${licenseData.licenseKey}`)
      .then((data) => {
        if (data.error === 'Configuration not found') {
          setShowConfigModal(true);
        } else {
          // Guardamos la configuración en el contexto
          setConfigData(data);
          console.log('Config Data:', data);
        }
      })
      .catch((error) => {
        console.error('Error al obtener la configuración:', error);
      });
  }, [apiFetch, configData, setConfigData]);

  const handleConfigSubmit = (config) => {
    // Agregamos la licencia al config
    const licenseData = JSON.parse(localStorage.getItem('licenseData'));
    const configToSend = {
      ...config,
      license: licenseData.licenseKey,
    };

    apiFetch('https://apitpv.anthonyloor.com/create_config_tpv', {
      method: 'POST',
      body: JSON.stringify(configToSend),
    })
      .then((data) => {
        if (data.status === 'success' && data.message === 'TPV Config created successfully') {
          // Guardamos la configuración en el contexto
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