// NavbarCard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../modals/Modal';
import TransferForm from '../modals/transfers/TransferForm'; // Importamos el formulario de traspaso
import PermisosModal from '../modals/configuration/permissions/PermissionsModal'; // Importamos el modal de permisos
import TicketConfigModal from '../modals/configuration/printers/TicketConfigModal'; // Importamos el nuevo modal de configuración de tickets
import empleadosData from '../../data/empleados.json'; // Importamos los datos de empleados
import { AuthContext } from '../../AuthContext';
import ClientModal from '../modals/customer/CustomerModal'; // Importamos el nuevo componente

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

  // Estado para el cliente seleccionado y el modal de clientes
  const [selectedClient, setSelectedClient] = useState({ id_customer: 0, firstname: '', lastname: '', full_name: 'Cliente genérico' });
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

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

  // Función para manejar la selección de un cliente desde el modal
  const handleSelectClient = (client) => {
    setSelectedClient({
      id_customer: client.id_customer,
      firstname: client.firstname,
      lastname: client.lastname,
      full_name: `${client.firstname} ${client.lastname}`,
    });
  };

  const handleResetClient = () => {
    setSelectedClient({ id_customer: 0, firstname: '', lastname: '', full_name: 'Cliente genérico' });
  };

  return (
    <div className="bg-white shadow p-4 flex items-center justify-between">
      {/* Logo o nombre de la tienda */}
      <h1 className="text-xl font-semibold">{shop ? shop.name : 'Tienda'} TPV</h1>

      {/* Opciones de navegación */}

      {/* Cliente seleccionado y botones */}
      <div className="flex items-center space-x-2">
        <span className="font-semibold">
          {selectedClient.full_name}
        </span>
        {/* Botón para gestionar clientes */}
        <button
          className="bg-gray-200 p-2 rounded"
          onClick={() => setIsClientModalOpen(true)}
        >
          {/* Ícono de usuario */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
          </svg>
        </button>
        {/* Botón 'P' para volver al cliente predeterminado */}
        {selectedClient.id_customer !== 0 && (
          <button
            className="bg-gray-200 p-2 rounded font-bold text-black"
            onClick={handleResetClient}
          >
            P
          </button>
        )}
      </div>

      {/* Separador */}
      <div className="border-l h-6 mx-4"></div>

      <div className="flex items-center space-x-4">
        {/* Botones de navegación */}
        <button className="text-black hover:text-gray-600" onClick={openTransferView}>
          Traspasos
        </button>
        <button className="text-black hover:text-gray-600">Etiquetas</button>
        <button className="text-black hover:text-gray-600">Caja</button>
        <button className="text-black hover:text-gray-600" onClick={openConfigView}>
          Configuración
        </button>
      </div>

      {/* Separador */}
      <div className="border-l h-6 mx-4"></div>

      {/* Información del empleado y logout */}
      <div className="flex items-center space-x-2">
        {/* Ícono de usuario */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
       </svg>
        <span className="font-semibold text-gray-700">
          {employee ? employee.employee_name : 'Empleado'}
        </span>
        {/* Botón de cerrar sesión */}
        <button onClick={handleLogout} className="text-black hover:text-gray-600">
          {/* Ícono de cerrar sesión */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>


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

      {/* Modal para gestionar clientes */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        handleSelectClient={handleSelectClient}
      />
    </div>
  );
};

export default NavbarCard;
