// src/components/Navbar/NavbarCard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ClientContext } from '../../contexts/ClientContext';

// Importar los modales existentes
import ClientModal from '../modals/customer/CustomerModal';
import AddressModal from '../modals/customer/AddressModal';
import TransfersModal from '../modals/transfers/TransfersModal';
import ConfigurationModal from '../modals/configuration/ConfigurationModal';
import SalesReportModal from '../reports/SalesReportModal';
import CloseCashRegisterModal from '../modals/cashRegister/CloseCashRegisterModal'; // Importar el nuevo modal

const NavbarCard = () => {
  const [isTransfersModalOpen, setTransfersModalOpen] = useState(false);
  const [isConfigurationModalOpen, setConfigurationModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSalesReportModalOpen, setIsSalesReportModalOpen] = useState(false);
  const [isCashRegisterModalOpen, setIsCashRegisterModalOpen] = useState(false);

  const navigate = useNavigate();

  const { idProfile, handleLogout, openCloseCashModal, setOpenCloseCashModal} = useContext(AuthContext);
  const { selectedClient, setSelectedClient, selectedAddress, setSelectedAddress, resetToDefaultClientAndAddress } = useContext(ClientContext);

  const shop = JSON.parse(localStorage.getItem('shop'));
  const employee = JSON.parse(localStorage.getItem('employee'));

  const handleLogoutClick = () => {
    handleLogout();
    navigate(`/${shop.route}`);
  };

  useEffect(() => {
    if (openCloseCashModal) {
      setIsCashRegisterModalOpen(true);
      setOpenCloseCashModal(false); // lo reseteamos para no abrirlo siempre
    }
  }, [openCloseCashModal, setOpenCloseCashModal]);

  const handleCloseCashRegisterModal = () => {
    setIsCashRegisterModalOpen(false);
  };

  const handleSelectClientAndAddress = (client, address) => {
    const clientData = {
      id_customer: client.id_customer,
      firstname: client.firstname,
      lastname: client.lastname,
      full_name: `${client.firstname} ${client.lastname}`,
    };
    setSelectedClient(clientData);
    setSelectedAddress(address);
    setIsClientModalOpen(false);

    localStorage.setItem('selectedClient', JSON.stringify(clientData));
    localStorage.setItem('selectedAddress', JSON.stringify(address));
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setIsAddressModalOpen(false);

    localStorage.setItem('selectedAddress', JSON.stringify(address));
  };

  const handleOpenSalesReport = () => {
    setIsSalesReportModalOpen(true);
  };

  const handleOpenCashRegister = () => {
    setIsCashRegisterModalOpen(true);
  };

  return (
    <div className="bg-white shadow p-4 flex items-center justify-between">
      {/* Logo o nombre de la tienda */}
      <h1 className="text-xl font-semibold">{shop ? shop.name : 'Tienda'} TPV</h1>

      {/* Cliente seleccionado y acciones */}
      <div className="flex items-center space-x-2">
        <span className="font-semibold">{selectedClient.full_name}</span>
        <button
          className="bg-gray-200 p-2 rounded"
          onClick={() => setIsClientModalOpen(true)}
        >
          {/* Ícono de usuario */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122Z" />
          </svg>
        </button>
        {selectedClient.id_customer !== 0 && (
          <button
            className="bg-gray-200 p-2 rounded font-bold text-black"
            onClick={resetToDefaultClientAndAddress}
          >
            P
          </button>
        )}
        {selectedClient.id_customer !== 0 && (
          <>
            <span className="font-semibold">
              {selectedAddress ? selectedAddress.alias : 'Sin dirección'}
            </span>
            <button
              className="bg-gray-200 p-2 rounded"
              onClick={() => setIsAddressModalOpen(true)}
            >
              {/* Ícono de dirección */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M12 2.25C7.168 2.25 3.25 6.168 3.25 11c0 6.1 7.034 10.993 8.377 11.78a.75.75 0 1 0 .746 0C13.716 21.993 20.75 17.1 20.75 11c0-4.832-3.918-8.75-8.75-8.75zm0 13a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5z"/>
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="border-l h-6 mx-4"></div>

      {/* Opciones de navegación */}
      <div className="flex items-center space-x-4">
        {/* Condicionalmente renderizar el botón "Transfers" solo si idProfile === 1 */}
        {idProfile === 1 && (
          <button className="text-black hover:text-gray-600" onClick={() => setTransfersModalOpen(true)}>
            Transferencias
          </button>
        )}
        <button className="text-black hover:text-gray-600">Labels</button>
        <button className="text-black hover:text-gray-600" onClick={handleOpenCashRegister}>Caja</button>
        <button className="text-black hover:text-gray-600" onClick={() => setConfigurationModalOpen(true)}>
        Configuración
        </button>

        {/* Botón para Sales Report - Solo para Administradores */}
        {idProfile === 1 && (
          <button className="text-black hover:text-gray-600" onClick={handleOpenSalesReport}>
            Reportes de Ventas
          </button>
        )}
      </div>

      <div className="border-l h-6 mx-4"></div>

      {/* Información del empleado y logout */}
      <div className="flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Z"/>
          <path d="M8.5 9.75a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0Z"/>
        </svg>
        <span className="font-semibold text-gray-700">
          {employee ? employee.employee_name : 'Empleado'}
        </span>
        <button onClick={handleLogoutClick} className="text-black hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"/>
          </svg>
        </button>
      </div>

      {/* Modales Existentes */}
      <TransfersModal
        isOpen={isTransfersModalOpen}
        onClose={() => setTransfersModalOpen(false)}
      />

      <ConfigurationModal
        isOpen={isConfigurationModalOpen}
        onClose={() => setConfigurationModalOpen(false)}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        handleSelectClientAndAddress={handleSelectClientAndAddress}
      />

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        clientId={selectedClient.id_customer}
        handleSelectAddress={handleSelectAddress}
        shop={shop}
      />

      {/* Modal para Reporte de Ventas */}
      <SalesReportModal
        isOpen={isSalesReportModalOpen}
        onClose={() => setIsSalesReportModalOpen(false)}
      />

      {/* Modal para Cierre de Caja */}
      <CloseCashRegisterModal
        isOpen={isCashRegisterModalOpen}
        onClose={handleCloseCashRegisterModal}
      />
    </div>
  );
};

export default NavbarCard;