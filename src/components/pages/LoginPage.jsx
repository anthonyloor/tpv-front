// LoginPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage({ shopRoute }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { isAuthenticated, setIsAuthenticated, setShopId, setEmployeeId, setEmployeeName, setShopName } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const [shopInfo, setShopInfo] = useState(null);

  // Mapeo de rutas de tiendas a nombres de tiendas
  const routeToShopName = {
    penaprieta8: 'Peña Prieta',
    bravomurillo205: 'Bravo Murillo',
    alcala397: 'Pueblo Nuevo',
    bodega: 'Bodega',
    MayretModaColombiana: 'Mayret Moda Colombiana',
  };

  // Mapeo de tiendas a empleados
  const storeEmployees = {
    'Peña Prieta': [1, 2],
    'Bravo Murillo': [5, 16],
    'Pueblo Nuevo': [25, 30],
    'Bodega': [31, 32],
    'Mayret Moda Colombiana': [37, 38],
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const shopName = routeToShopName[shopRoute];
    if (!shopName) {
      setShopInfo(null);
      return;
    }

    // Obtener la información de la tienda desde la API
    fetch('https://apitpv.anthonyloor.com/shops')
      .then((response) => response.json())
      .then((shopsData) => {
        const shop = shopsData.find((s) => s.name === shopName);
        if (shop) {
          setShopInfo(shop);
          setShopId(shop.id_shop);
          setShopName(shop.name);
        } else {
          setShopInfo(null);
        }
      })
      .catch((error) => {
        console.error('Error al obtener tiendas:', error);
        setShopInfo(null);
      });
  }, [shopRoute, setShopId, setShopName]);

  useEffect(() => {
    if (shopInfo) {
      // Obtener empleados y filtrar por tienda
      fetch('https://apitpv.anthonyloor.com/employees')
        .then((response) => response.json())
        .then((data) => {
          const employeesForStore = data.filter((employee) =>
            storeEmployees[shopInfo.name]?.includes(employee.id_employee)
          );
          setEmployees(employeesForStore);
        })
        .catch((error) => console.error('Error al obtener empleados:', error));
    }
  }, [shopInfo]);

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleLogin = () => {
    // Simulación de comprobación de contraseña
    if (password !== '1234') {
      setErrorMessage('Contraseña incorrecta. Inténtalo de nuevo.');
      return;
    }

    // Inicio de sesión exitoso (simulado)
    setIsAuthenticated(true);
    setEmployeeId(selectedEmployee.id_employee);
    setEmployeeName(selectedEmployee.employee_name);
    navigate('/');
  };

  if (shopInfo === null) {
    // Tienda no encontrada o aún cargando
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

        {/* Sección de Empleados */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Selecciona un Empleado</h2>
          <div className="grid grid-cols-2 gap-4">
            {employees.map((employee) => (
              <button
                key={employee.id_employee}
                onClick={() => handleEmployeeSelect(employee)}
                className={`py-2 px-4 rounded-md border transition-colors duration-200 ${
                  selectedEmployee && selectedEmployee.id_employee === employee.id_employee
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-100'
                }`}
              >
                {employee.employee_name}
              </button>
            ))}
          </div>
        </div>

        {/* Campo de Contraseña */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Introduce tu Contraseña</h2>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password" // Evita que el navegador recuerde la contraseña
          />
        </div>

        {/* Mensaje de error */}
        {errorMessage && (
          <div className="mb-4 text-red-500 text-center">
            {errorMessage}
          </div>
        )}

        {/* Botón de Iniciar Sesión */}
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
