// LoginPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import LicenseModal from '../modals/license/LicenseModal'; // Importamos el LicenseModal

const routeToShopInfo = {
  penaprieta8: { name: 'Peña Prieta', id_shop: 11 },
  bravomurillo205: { name: 'Bravo Murillo', id_shop: 9 },
  alcala397: { name: 'Pueblo Nuevo', id_shop: 14 },
  bodega: { name: 'Bodega', id_shop: 13 },
  mayretmodacolombiana: { name: 'Mayret Moda Colombiana', id_shop: 1 },
};

// Crear un mapeo inverso de id_shop a shopRoute
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
  const {
    isAuthenticated,
    setIsAuthenticated,
    setShopId,
    setEmployeeId,
    setEmployeeName,
    setShopName,
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const [shopInfo, setShopInfo] = useState(null); // Inicializado como null
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(false);

  // Estado para controlar la licencia
  const [licenseData, setLicenseData] = useState(() => {
    const data = localStorage.getItem('licenseData');
    return data ? JSON.parse(data) : null;
  });
  const [hasLicense, setHasLicense] = useState(!!licenseData);
  const [showLicenseModal, setShowLicenseModal] = useState(!hasLicense);
  const [isValidatingLicense, setIsValidatingLicense] = useState(false);
  const [licenseErrorMessage, setLicenseErrorMessage] = useState(''); // Estado para mensajes de error de licencia

  // Función para cargar la tienda y empleados
  const proceedToLoadShopAndEmployees = useCallback(() => {
    setIsLoadingShopInfo(true);
    const shopData = routeToShopInfo[shopRoute];
    if (!shopData) {
      setShopInfo(null);
      setIsLoadingShopInfo(false);
      return;
    }

    // Establecer información de la tienda
    setShopInfo({ ...shopData, route: shopRoute });
    setShopId(shopData.id_shop);
    setShopName(shopData.name);

    // Cargar empleados
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

  // Función para validar la licencia
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
            // La licencia se activó correctamente
            const newLicenseData = {
              licenseKey: key,
              id_shop: shopData.id_shop,
            };
            localStorage.setItem('licenseData', JSON.stringify(newLicenseData));
            setLicenseData(newLicenseData);
            setHasLicense(true);
            setShowLicenseModal(false); // Cerramos el modal
            proceedToLoadShopAndEmployees();
          } else if (data.status === 'OK' && data.message === 'License already in use') {
            // La licencia ya está en uso
            const storedLicenseData = JSON.parse(localStorage.getItem('licenseData'));
            if (storedLicenseData && storedLicenseData.licenseKey === key) {
              // La licencia es la misma que tenemos, procedemos
              // No actualizamos licenseData, ya que es el mismo
              setHasLicense(true);
              setShowLicenseModal(false); // Cerramos el modal
              proceedToLoadShopAndEmployees();
            } else {
              // Licencia en uso y no es la misma, mostramos error
              setLicenseErrorMessage('La licencia ya está en uso en otro dispositivo.');
              setHasLicense(false);
              setShowLicenseModal(true);
            }
          } else {
            // Respuesta inesperada
            const error = {
              status: 500,
              message: data.message || 'Respuesta inesperada del servidor',
            };
            return Promise.reject(error);
          }
        })
        .catch((error) => {
          console.error('Error al verificar la licencia:', error);

          // Manejo de errores según el código de estado y mensaje
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

          // Mostrar el LicenseModal con el mensaje de error
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
        // El id_shop no coincide, redirigir a la ruta correcta
        // Encontrar el shopRoute correspondiente al storedIdShop
        const correctShopRoute = idShopToRoute[storedIdShop];
        if (correctShopRoute) {
          navigate(`/${correctShopRoute}`);
        } else {
          // Si no encontramos la ruta correcta, manejar el error
          console.error('No se encontró la ruta de la tienda correspondiente al id_shop almacenado.');
        }
      } else {
        // El id_shop coincide, proceder
        setHasLicense(true);
        setShowLicenseModal(false);
        if (!shopInfo) {
          // Validamos la licencia solo si no hemos cargado la shopInfo aún
          validateLicense(licenseData.licenseKey, licenseData.id_shop);
        }
      }
    } else {
      // No hay licenseData, mostrar el modal de licencia
      setHasLicense(false);
      setShowLicenseModal(true);
    }
    // Eliminamos validateLicense de las dependencias para evitar bucles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseData, shopRoute, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/${shopRoute}/app`);
    }
  }, [isAuthenticated, navigate, shopRoute]);

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  // Función que se llama cuando el usuario envía la licencia desde el modal
  const handleLicenseSubmit = (key) => {
    // Validar la licencia
    setLicenseErrorMessage(''); // Limpiamos cualquier mensaje de error anterior
    validateLicense(key);
  };

  // Si no hay licencia o hay un error, mostramos el modal
  if (showLicenseModal) {
    return (
      <LicenseModal
        onSubmit={handleLicenseSubmit}
        errorMessage={licenseErrorMessage}
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

  const handleLogin = () => {
    fetch('https://apitpv.anthonyloor.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_employee: selectedEmployee.id_employee,
        password: password,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          // Manejar errores de autenticación
          if (response.status === 401) {
            setErrorMessage('Contraseña incorrecta. Inténtalo de nuevo.');
          } else {
            setErrorMessage('Error al iniciar sesión. Inténtalo de nuevo.');
          }
          // Rechazar la promesa para evitar continuar con el parsing de JSON
          return Promise.reject(response);
        }
        // Si la respuesta es exitosa, parsear el JSON
        return response.json();
      })
      .then((data) => {
        // Manejar la respuesta exitosa
        if (data.token) {
          setIsAuthenticated(true);
          setEmployeeId(selectedEmployee.id_employee);
          setEmployeeName(selectedEmployee.employee_name);
          localStorage.setItem('token', data.token);
          localStorage.setItem('employee', JSON.stringify(selectedEmployee));
          localStorage.setItem('shop', JSON.stringify(shopInfo));
          navigate(`/${shopRoute}/app`);
        } else {
          setErrorMessage('Error al iniciar sesión. Inténtalo de nuevo.');
        }
      })
      .catch((error) => {
        if (error.status !== 401) {
          console.error('Error al iniciar sesión:', error);
          setErrorMessage('Error al iniciar sesión. Inténtalo de nuevo.');
        }
        // Ya manejamos el error 401 anteriormente
      });
  };

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
                onClick={() => handleEmployeeSelect(employee)}
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

        <button
          onClick={handleLogin}
          disabled={!selectedEmployee || !password}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
            !selectedEmployee || !password
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          Iniciar Sesión
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
