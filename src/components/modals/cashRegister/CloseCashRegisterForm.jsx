// src/components/modals/cashRegister/CloseCashRegisterForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext'; // Ajusta la ruta a tu AuthContext
import { useNavigate } from 'react-router-dom';
import SalesReportModal from '../../reports/SalesReportModal';
import { useApiFetch } from '../../../components/utils/useApiFetch';

const CloseCashRegisterForm = ({ onClose }) => {
  const [numberOfSales, setNumberOfSales] = useState(0);
  const [totalSalesTPV, setTotalSalesTPV] = useState(0.0);
  const [totalSalesStore, setTotalSalesStore] = useState('');

  // Valores reales obtenidos de la API
  const [fetchedTotalCash, setFetchedTotalCash] = useState(0.0);
  const [fetchedTotalCard, setFetchedTotalCard] = useState(0.0);
  const [fetchedTotalBizum, setFetchedTotalBizum] = useState(0.0);

  // Valores introducidos por el usuario
  const [inputTotalCash, setInputTotalCash] = useState('');
  const [inputTotalCard, setInputTotalCard] = useState('');
  const [inputTotalBizum, setInputTotalBizum] = useState('');

  const [isCloseButtonDisabled, setIsCloseButtonDisabled] = useState(true);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);

  const apiFetch = useApiFetch();

  // OBTENER handleLogout del AuthContext
  // para usar la misma lógica que en NavbarCard
  const navigate = useNavigate();
  const { handleLogout } = useContext(AuthContext);
  const shop = JSON.parse(localStorage.getItem('shop'));

  // Obtener la licencia del localStorage
  const licenseData = localStorage.getItem('licenseData')
    ? JSON.parse(localStorage.getItem('licenseData'))
    : null;
  const license = licenseData?.licenseKey;

  // Obtener el empleado del localStorage (suponiendo que guardas su info ahí)
  const employee = JSON.parse(localStorage.getItem('employee'));
  const id_employee = employee ? employee.id_employee : null;

  // Cargar datos desde /get_report_amounts al montar el componente
  useEffect(() => {
    const fetchReportAmounts = async () => {
      try {
        // Ajusta la URL a la de tu backend
        const data = await apiFetch(`https://apitpv.anthonyloor.com/get_report_amounts?license=${license}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (data.status === 'OK') {
          const totalCashNum = parseFloat(data.total_cash);
          const totalCardNum = parseFloat(data.total_card);
          const totalBizumNum = parseFloat(data.total_bizum);

          setFetchedTotalCash(totalCashNum);
          setFetchedTotalCard(totalCardNum);
          setFetchedTotalBizum(totalBizumNum);

          // Número de ventas y total en TPV (ejemplo dummy)
          const dummyNumberOfSales = 10;
          const dummyTotalSalesTPV = totalCashNum + totalCardNum + totalBizumNum;
          setNumberOfSales(dummyNumberOfSales);
          setTotalSalesTPV(dummyTotalSalesTPV);
        } else {
          alert(data.message || 'No se pudo obtener el reporte de caja');
        }
      } catch (error) {
        console.error('Error fetching report amounts:', error);
      }
    };

    if (license) {
      fetchReportAmounts();
    }
  }, [license, apiFetch]);

  // Validar que todos los campos introducidos coincidan con lo obtenido de la API
  useEffect(() => {
    const cashMatches = parseFloat(inputTotalCash) === fetchedTotalCash;
    const cardMatches = parseFloat(inputTotalCard) === fetchedTotalCard;
    const bizumMatches = parseFloat(inputTotalBizum) === fetchedTotalBizum;
    const salesMatches = parseFloat(totalSalesStore) === parseFloat(totalSalesTPV);

    if (cashMatches && cardMatches && bizumMatches && salesMatches) {
      setIsCloseButtonDisabled(false);
    } else {
      setIsCloseButtonDisabled(true);
    }
  }, [
    inputTotalCash,
    inputTotalCard,
    inputTotalBizum,
    totalSalesStore,
    fetchedTotalCash,
    fetchedTotalCard,
    fetchedTotalBizum,
    totalSalesTPV
  ]);

  const handleInputChange = (e) => {
    setTotalSalesStore(e.target.value);
  };

  const handleInputTotalCashChange = (e) => {
    setInputTotalCash(e.target.value);
  };

  const handleInputTotalCardChange = (e) => {
    setInputTotalCard(e.target.value);
  };

  const handleInputTotalBizumChange = (e) => {
    setInputTotalBizum(e.target.value);
  };

  const handleCloseSalesReport = () => {
    setIsSalesReportOpen(false);
  };

  const handleOpenSalesReport = () => {
    setIsSalesReportOpen(true);
  };

  // Cerrar la caja y luego cerrar sesión de empleado
  const handleCloseCashRegister = async () => {
    try {
      const data = await apiFetch('https://apitpv.anthonyloor.com/close_pos_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license: license,
          id_employee: id_employee
        })
      });

      if (data.status === 'OK') {
        alert('Cierre de caja realizado exitosamente.');
        onClose(); 
        // Cerrar sesión del empleado (AuthContext)
        handleLogout();
        // Después, redirigir
        navigate(`/${shop.route}`);
      } else {
        alert(data.message || 'No se pudo cerrar la caja.');
      }
    } catch (error) {
      console.error('Error al cerrar la caja:', error);
      alert('Error al cerrar la caja.');
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Resumen de Ventas */}
        <div>
          <p><strong>Número de Ventas:</strong> {numberOfSales}</p>
          <p><strong>TOTAL VENTAS TPV:</strong> {Number(totalSalesTPV).toFixed(2)} €</p>
        </div>

        {/* Campo para Total de Ventas Tienda */}
        <div>
          <label
            htmlFor="totalSalesStore"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total de Ventas Tienda
          </label>
          <input
            type="number"
            id="totalSalesStore"
            value={totalSalesStore}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ingresa el total de ventas de la tienda"
          />
        </div>

        {/* Inputs para Totales (Efectivo, Tarjeta, Bizum) */}
        <div>
          <label
            htmlFor="inputTotalCash"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total Efectivo (debe coincidir con {fetchedTotalCash.toFixed(2)} €)
          </label>
          <input
            type="number"
            id="inputTotalCash"
            value={inputTotalCash}
            onChange={handleInputTotalCashChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 mb-4"
            placeholder={`Ingresa el total efectivo exacto: ${fetchedTotalCash.toFixed(2)}`}
          />

          <label
            htmlFor="inputTotalCard"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total Tarjeta (debe coincidir con {fetchedTotalCard.toFixed(2)} €)
          </label>
          <input
            type="number"
            id="inputTotalCard"
            value={inputTotalCard}
            onChange={handleInputTotalCardChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 mb-4"
            placeholder={`Ingresa el total tarjeta exacto: ${fetchedTotalCard.toFixed(2)}`}
          />

          <label
            htmlFor="inputTotalBizum"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total Bizum (debe coincidir con {fetchedTotalBizum.toFixed(2)} €)
          </label>
          <input
            type="number"
            id="inputTotalBizum"
            value={inputTotalBizum}
            onChange={handleInputTotalBizumChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 mb-4"
            placeholder={`Ingresa el total bizum exacto: ${fetchedTotalBizum.toFixed(2)}`}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleOpenSalesReport}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Reporte de Ventas
          </button>
          <button
            onClick={handleCloseCashRegister}
            disabled={isCloseButtonDisabled}
            className={`px-4 py-2 rounded ${
              isCloseButtonDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Cerrar Caja
          </button>
        </div>
      </div>

      {/* Modal para Reporte de Ventas */}
      {isSalesReportOpen && (
        <SalesReportModal onClose={handleCloseSalesReport} />
      )}
    </>
  );
};

export default CloseCashRegisterForm;