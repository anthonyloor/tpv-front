import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';

const routeToShopName = {
  penaprieta8: 'Peña Prieta',
  bravomurillo205: 'Bravo Murillo',
  alcala397: 'Pueblo Nuevo',
  bodega: 'Bodega',
  mayretmodacolombiana: 'Mayret Moda Colombiana',
};

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
  const [shopInfo, setShopInfo] = useState(); // Inicializado como undefined
  const [isLoadingShopInfo, setIsLoadingShopInfo] = useState(true);

  useEffect(() => {
    setIsLoadingShopInfo(true);
    const shopName = routeToShopName[shopRoute];
    if (!shopName) {
      setShopInfo(null);
      setIsLoadingShopInfo(false);
      return;
    }

    fetch('https://apitpv.anthonyloor.com/shops')
      .then((response) => response.json())
      .then((shopsData) => {
        const shop = shopsData.find((s) => s.name === shopName);
        if (shop) {
          setShopInfo({ ...shop, route: shopRoute });
          setShopId(shop.id_shop);
          setShopName(shop.name);
        } else {
          setShopInfo(null);
        }
      })
      .catch((error) => {
        console.error('Error al obtener tiendas:', error);
        setShopInfo(null);
      })
      .finally(() => {
        setIsLoadingShopInfo(false);
      });
  }, [shopRoute, setShopId, setShopName]);

  useEffect(() => {
    if (shopInfo) {
      fetch('https://apitpv.anthonyloor.com/employees')
        .then((response) => response.json())
        .then((data) => {
          setEmployees(data);
        })
        .catch((error) => console.error('Error al obtener empleados:', error));
    }
  }, [shopInfo]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/${shopRoute}/app`);
    }
  }, [isAuthenticated, navigate, shopRoute]);

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };

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

  if (isLoadingShopInfo) {
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
          <p>Cargando...</p>
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
