import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../modals/Modal';
import TransferForm from '../modals/transfers/TransferForm'; // Importamos el formulario de traspaso
import PermisosModal from '../modals/configuration/permissions/PermissionsModal'; // Importamos el modal de permisos
import TicketConfigModal from '../modals/configuration/printers/TicketConfigModal'; // Importamos el nuevo modal de configuración de tickets
import empleadosData from '../../data/empleados.json'; // Importamos los datos de empleados
import { AuthContext } from '../../AuthContext';

// Inicializamos los permisos en memoria
const permisosIniciales = {
  "Vendedor TPV": {
    "acceso_ejecutar": "Denegado"
  },
  "Encargado": {
    "acceso_ejecutar": "Permitido"
  },
  "Admin": {
    "acceso_ejecutar": "Permitido"
  }
};

const NavbarCard = () => {
  const [isModalOpen, setModalOpen] = useState(false); // Control del modal abierto/cerrado
  const [currentView, setCurrentView] = useState('main'); // Control de vista actual ('main', 'traspasos', 'entrada', 'salida', etc.)
  const [empleadoActual, setEmpleadoActual] = useState(null); // Estado para almacenar el empleado actual
  const [permisosGlobal, setPermisosGlobal] = useState(permisosIniciales); // Estado para manejar los permisos globales
  const { setIsAuthenticated, setShopId, setEmployeeId, setEmployeeName, setShopName } = useContext(AuthContext);
  const navigate = useNavigate();

  const shop = JSON.parse(localStorage.getItem('shop'));
  const employee = JSON.parse(localStorage.getItem('employee'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employee');
    localStorage.removeItem('shop');
    setIsAuthenticated(false);
    setShopId(null);
    setEmployeeId(null);
    setEmployeeName(null);
    setShopName(null);
    navigate(`/${shop.route}`);
  };
  

  useEffect(() => {
    // Simulamos que el empleado actual es el Admin cargando su información desde empleados.json
    const empleadoAdmin = empleadosData.find(emp => emp.nivel_permisos === 'Admin');
    setEmpleadoActual(empleadoAdmin);
  }, []);

  // Función para cerrar el modal
  const closeModal = () => {
    setModalOpen(false);
    setCurrentView('main'); // Volvemos a la vista principal del modal
  };

  // Función para abrir la vista de selección dentro del modal
  const openTransferView = () => {
    setModalOpen(true); // Abrimos el modal
  };

  // Función para abrir la vista de configuración
  const openConfigView = () => {
    setModalOpen(true);
    setCurrentView('config'); // Cambiamos a la vista de configuración
  };

  // Función para seleccionar la vista dentro del modal
  const selectView = (view) => {
    setCurrentView(view); // Cambiamos a la vista seleccionada
  };

  // Función para volver a la vista anterior
  const goBack = () => {
    if (currentView === 'permisos' || currentView === 'impresoras') {
      setCurrentView('config');
    } else if (currentView === 'ticketConfig' || currentView === 'etiquetaPrecios') {
      setCurrentView('impresoras');
    } else {
      setCurrentView('main');
    }
  };

  return (
    <div className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">{shop ? shop.name : 'Tienda'} TPV</h1>
      <div>
        <span className="font-semibold text-gray-700 mr-4">
          Empleado: {employee ? employee.employee_name : 'Empleado'}
        </span>
      </div>

      <div className="space-x-4">
        {/* Botón único de Traspasos */}
        <button className="text-black hover:text-gray-600" onClick={openTransferView}>
          Traspasos
        </button>
        <button className="text-black hover:text-gray-600">Etiquetas</button>
        <button className="text-black hover:text-gray-600">Caja</button>
        {/* Botón para abrir la configuración */}
        <button className="text-black hover:text-gray-600" onClick={openConfigView}>
          Configuración
        </button>
        <button
        onClick={handleLogout}
        className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors duration-200"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Modal para gestionar traspasos, entradas o salidas */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {currentView === 'main' && (
          <div className="transition-opacity duration-300 ease-in-out">
            <h2 className="text-xl font-bold mb-4">Gestión de Mercadería</h2>
            <div className="space-y-4">
              {/* Opciones para seleccionar tipo de operación */}
              <button className="bg-blue-500 text-white px-4 py-2 rounded w-full" onClick={() => selectView('traspasos')}>
                Traspasos entre Tiendas
              </button>
              <button className="bg-green-500 text-white px-4 py-2 rounded w-full" onClick={() => selectView('entrada')}>
                Entrada de Mercadería
              </button>
              <button className="bg-red-500 text-white px-4 py-2 rounded w-full" onClick={() => selectView('salida')}>
                Salida de Mercadería
              </button>
            </div>
          </div>
        )}

        {/* Modal de Configuración */}
        {currentView === 'config' && (
          <div className="transition-opacity duration-300 ease-in-out">
            <h2 className="text-xl font-bold mb-4">Configuración</h2>
            <div className="space-y-4">
              {/* Botones para cada opción de configuración */}
              <button className="bg-gray-300 text-black px-4 py-2 rounded w-full" onClick={() => selectView('permisos')}>
                Permisos
              </button>
              <button className="bg-gray-300 text-black px-4 py-2 rounded w-full" onClick={() => selectView('impresoras')}>
                Impresoras
              </button>
              <button className="bg-gray-300 text-black px-4 py-2 rounded w-full">Inventario</button>
            </div>
          </div>
        )}

        {/* Modal para gestionar permisos */}
        {currentView === 'permisos' && (
          <PermisosModal onClose={closeModal} empleadoActual={empleadoActual} setPermisosGlobal={setPermisosGlobal} />
        )}

        {/* Modal para Impresoras */}
        {currentView === 'impresoras' && (
          <div className="transition-opacity duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={goBack}>
                Atrás
              </button>
              <h2 className="text-xl font-bold">Impresoras</h2>
              <div className="invisible">Placeholder</div>
            </div>
            <div className="space-y-4">
              <button className="bg-gray-300 text-black px-4 py-2 rounded w-full" onClick={() => selectView('ticketConfig')}>
                Tickets al Cliente
              </button>
              <button className="bg-gray-300 text-black px-4 py-2 rounded w-full">
                Etiqueta Precios
              </button>
            </div>
          </div>
        )}

        {/* Modal para configurar Tickets al Cliente */}
        {currentView === 'ticketConfig' && (
          <TicketConfigModal onClose={closeModal} goBack={goBack} />
        )}

        {/* Componente TransferForm dependiendo del tipo de operación con botón Atrás alineado */}
        {['traspasos', 'entrada', 'salida'].includes(currentView) && (
          <div className="transition-opacity duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <button className="bg-gray-300 text-black px-4 py-2 rounded" onClick={goBack}>
                Atrás
              </button>
              <div className="invisible">Placeholder</div>
            </div>
            <TransferForm type={currentView} onSave={closeModal} permisosUsuario={empleadoActual?.nivel_permisos} permisosGlobal={permisosGlobal} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NavbarCard;
