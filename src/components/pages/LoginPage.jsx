// src/components/pages/LoginPage.jsx

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LicenseModal from '../modals/license/LicenseModal';
import OpenPosModal from '../modals/pos/OpenPosModal';

// Mapeo de ruta a tienda
const routeToShopInfo = {
  penaprieta8: { name: 'Peña Prieta', id_shop: 11 },
  bravomurillo205: { name: 'Bravo Murillo', id_shop: 9 },
  alcala397: { name: 'Pueblo Nuevo', id_shop: 14 },
  bodega: { name: 'Bodega', id_shop: 13 },
  mayretmodacolombiana: { name: 'Mayret Moda Colombiana', id_shop: 1 },
};

// Inverso: id_shop => shopRoute
const idShopToRoute = {};
for (const route in routeToShopInfo) {
  const shopData = routeToShopInfo[route];
  idShopToRoute[shopData.id_shop] = route;
}

function LoginPage({ shopRoute }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Contexto de autenticación
  const {
    isAuthenticated,
    setIsAuthenticated,
    setIsSessionExpired,
    setShopId,
    setEmployeeId,
    setEmployeeName,
    setIdProfile,
    setShopName,
  } = useContext(AuthContext);

  // Para navegación y tienda actual
  const navigate = useNavigate();
  const [shopInfo, setShopInfo] = useState(null);
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(false);

  // Estado de licencia
  const [licenseData, setLicenseData] = useState(() => {
    const data = localStorage.getItem('licenseData');
    return data ? JSON.parse(data) : null;
  });
  const [hasLicense, setHasLicense] = useState(!!licenseData);
  const [showLicenseModal, setShowLicenseModal] = useState(!hasLicense);
  const [isValidatingLicense, setIsValidatingLicense] = useState(false);
  const [licenseErrorMessage, setLicenseErrorMessage] = useState('');

  // Estado para el modal de POS
  const [showOpenPosModal, setShowOpenPosModal] = useState(false);
  const [posErrorMessage, setPosErrorMessage] = useState('');

  // **Estado para mostrar spinner en el botón de "Iniciar Sesión"**
  const [loginLoading, setLoginLoading] = useState(false);

  // Cargar la tienda y la lista de empleados
  const proceedToLoadShopAndEmployees = useCallback(() => {
    setIsLoadingShopInfo(true);
    const shopData = routeToShopInfo[shopRoute];
    if (!shopData) {
      setShopInfo(null);
      setIsLoadingShopInfo(false);
      return;
    }

    setShopInfo({ ...shopData, route: shopRoute });
    setShopId(shopData.id_shop);
    setShopName(shopData.name);

    fetch('https://apitpv.anthonyloor.com/employees')
      .then((response) => response.json())
      .then((data) => {
        setEmployees(data);
      })
      .catch((error) => console.error('Error al obtener empleados:', error))
      .finally(() => {
        setIsLoadingShopInfo(false);
      });
  }, [shopRoute, setShopId, setShopName]);

  // Validar licencia
  const validateLicense = useCallback(
    (key, idShop) => {
      setIsValidatingLicense(true);
      const shopData = routeToShopInfo[shopRoute];
      if (!shopData) {
        setLicenseErrorMessage('La tienda no existe. Por favor, verifica la URL.');
        setIsValidatingLicense(false);
        return;
      }

      const requestBody = {
        license: key,
        id_shop: idShop || shopData.id_shop,
      };

      fetch('https://apitpv.anthonyloor.com/license_check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then((response) => {
          return response.json().then((data) => {
            if (!response.ok) {
              const error = { status: response.status, message: data.message };
              return Promise.reject(error);
            }
            return data;
          });
        })
        .then((data) => {
          if (data.status === 'OK' && data.message === 'License actived') {
            const newLicenseData = {
              licenseKey: key,
              id_shop: shopData.id_shop,
            };
            localStorage.setItem('licenseData', JSON.stringify(newLicenseData));
            setLicenseData(newLicenseData);
            setHasLicense(true);
            setShowLicenseModal(false);
            proceedToLoadShopAndEmployees();
          } else if (data.status === 'OK' && data.message === 'License already in use') {
            const storedLicenseData = JSON.parse(localStorage.getItem('licenseData'));
            if (storedLicenseData && storedLicenseData.licenseKey === key) {
              setHasLicense(true);
              setShowLicenseModal(false);
              proceedToLoadShopAndEmployees();
            } else {
              setLicenseErrorMessage('La licencia ya está en uso en otro dispositivo.');
              setHasLicense(false);
              setShowLicenseModal(true);
            }
          } else {
            const error = {
              status: 500,
              message: data.message || 'Respuesta inesperada del servidor',
            };
            return Promise.reject(error);
          }
        })
        .catch((error) => {
          console.error('Error al verificar la licencia:', error);

          if (error.status === 400) {
            setLicenseErrorMessage('La licencia es requerida. Por favor, ingresa una licencia válida.');
          } else if (error.status === 403) {
            setLicenseErrorMessage('La licencia ha expirado.');
          } else if (error.status === 404) {
            if (error.message === 'License not found') {
              setLicenseErrorMessage('La licencia no existe. Por favor, verifica tu licencia.');
            } else {
              setLicenseErrorMessage('Error con la licencia. Por favor, verifica tu licencia.');
            }
          } else {
            setLicenseErrorMessage('Error al verificar la licencia. Inténtalo de nuevo.');
          }

          setHasLicense(false);
          setShowLicenseModal(true);
        })
        .finally(() => {
          setIsValidatingLicense(false);
        });
    },
    [shopRoute, proceedToLoadShopAndEmployees]
  );

  useEffect(() => {
    if (licenseData) {
      const storedIdShop = licenseData.id_shop;
      const currentShopData = routeToShopInfo[shopRoute];
      if (currentShopData && storedIdShop !== currentShopData.id_shop) {
        const correctShopRoute = idShopToRoute[storedIdShop];
        if (correctShopRoute) {
          navigate(`/${correctShopRoute}`);
        } else {
          console.error('No se encontró la ruta correspondiente al id_shop almacenado.');
        }
      } else {
        setHasLicense(true);
        setShowLicenseModal(false);
        if (!shopInfo) {
          validateLicense(licenseData.licenseKey, licenseData.id_shop);
        }
      }
    } else {
      setHasLicense(false);
      setShowLicenseModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseData, shopRoute, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/${shopRoute}/app`);
    }
  }, [isAuthenticated, navigate, shopRoute]);

  const handleLicenseSubmit = (key) => {
    setLicenseErrorMessage('');
    validateLicense(key);
  };

  // Verificar sesión POS
  const checkPOSSession = () => {
    const licenseData = JSON.parse(localStorage.getItem('licenseData'));
    if (!licenseData || !licenseData.licenseKey) {
      setErrorMessage('No se encontró la licencia. Por favor, inicie sesión de nuevo.');
      return;
    }

    const token = localStorage.getItem('token');
    fetch(`https://apitpv.anthonyloor.com/check_pos_session?license=${licenseData.licenseKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'OK') {
          setIsAuthenticated(true);
          navigate(`/${shopRoute}/app`);
        } else {
          setShowOpenPosModal(true);
        }
      })
      .catch((error) => {
        console.error('Error al verificar la sesión de POS:', error);
        setErrorMessage('Error al verificar la sesión de POS. Inténtalo de nuevo.');
      });
  };

  // Abrir sesión POS
  const openPosSession = (initCash) => {
    const licenseData = JSON.parse(localStorage.getItem('licenseData'));
    if (!licenseData || !licenseData.licenseKey) {
      setPosErrorMessage('No se encontró la licencia. Por favor, inicie sesión de nuevo.');
      return;
    }

    const token = localStorage.getItem('token');
    fetch('https://apitpv.anthonyloor.com/open_pos_session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        id_shop: shopInfo.id_shop,
        id_employee: selectedEmployee.id_employee,
        init_cash: initCash,
        license: licenseData.licenseKey,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'OK') {
          setIsAuthenticated(true);
          setShowOpenPosModal(false);
          navigate(`/${shopRoute}/app`);
        } else {
          setPosErrorMessage(data.message || 'Error al abrir la sesión de POS.');
        }
      })
      .catch((error) => {
        console.error('Error al abrir la sesión de POS:', error);
        setPosErrorMessage('Error al abrir la sesión de POS. Inténtalo de nuevo.');
      });
  };

  const handleOpenPosSubmit = (initCash) => {
    setPosErrorMessage('');
    openPosSession(initCash);
  };

  // **Manejamos el login con spinner**
  const handleLogin = () => {
    setLoginLoading(true); // Activar spinner

    fetch('https://apitpv.anthonyloor.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_employee: selectedEmployee?.id_employee,
        password: password,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            setErrorMessage('Contraseña incorrecta. Inténtalo de nuevo.');
          } else {
            setErrorMessage('Error al iniciar sesión. Inténtalo de nuevo.');
          }
          return Promise.reject(response);
        }
        return response.json();
      })
      .then((data) => {
        if (data.token) {
          setEmployeeId(selectedEmployee.id_employee);
          setEmployeeName(selectedEmployee.employee_name);
          setIdProfile(selectedEmployee.id_profile);
          localStorage.setItem('token', data.token);
          localStorage.setItem('employee', JSON.stringify(selectedEmployee));
          localStorage.setItem('shop', JSON.stringify(shopInfo));
          setIsSessionExpired(false);
          // Verificamos la sesión de POS
          checkPOSSession();
        } else {
          setErrorMessage('Error al iniciar sesión. Inténtalo de nuevo.');
        }
      })
      .catch((error) => {
        // Mostramos un error genérico si no es 401
        if (error.status !== 401) {
          console.error('Error al iniciar sesión:', error);
          setErrorMessage('Error al iniciar sesión. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        // Aquí se ejecuta siempre, con éxito o error
        setLoginLoading(false); // Desactivar spinner
      });
  };

  // Manejo de estados de carga
  if (showLicenseModal) {
    return (
      <LicenseModal
        onSubmit={handleLicenseSubmit}
        errorMessage={licenseErrorMessage}
      />
    );
  }
  if (showOpenPosModal) {
    return (
      <OpenPosModal
        onSubmit={handleOpenPosSubmit}
        errorMessage={posErrorMessage}
      />
    );
  }
  if (isValidatingLicense || isLoadingShopInfo || !shopInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-gray-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <p>{isValidatingLicense ? 'Verificando licencia...' : 'Cargando...'}</p>
        </div>
      </div>
    );
  }
  if (shopInfo === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-6">Tienda no encontrada</h1>
          <p>La tienda que estás buscando no existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Iniciar Sesión - {shopInfo.name}
        </h1>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Selecciona un Empleado</h2>
          <div className="grid grid-cols-2 gap-4">
            {employees.map((employee) => (
              <button
                key={employee.id_employee}
                onClick={() => setSelectedEmployee(employee)}
                className={`py-2 px-4 rounded-md border transition-colors duration-200 ${
                  selectedEmployee &&
                  selectedEmployee.id_employee === employee.id_employee
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-100'
                }`}
              >
                {employee.employee_name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Introduce tu Contraseña</h2>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
          />
        </div>

        {errorMessage && (
          <div className="mb-4 text-red-500 text-center">{errorMessage}</div>
        )}

        {/* Botón con spinner de carga */}
        <button
          onClick={handleLogin}
          disabled={!selectedEmployee || !password || loginLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
            (!selectedEmployee || !password || loginLoading)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loginLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white inline-block mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Iniciando...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;