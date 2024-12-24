// src/components/modals/reports/SalesReportSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useApiFetch } from '../../components/utils/useApiFetch';

const SalesReportSearch = () => {
  const apiFetch = useApiFetch();
  const licenseData = localStorage.getItem('licenseData') ? JSON.parse(localStorage.getItem('licenseData')) : null;
  const license = licenseData?.licenseKey;

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const isSearchDisabled = !dateFrom || !dateTo;

  const tableRef = useRef(); // Referencia para la impresión

  const handleSearch = async () => {
    if (!dateFrom || !dateTo) return;

    setLoading(true);
    setOrders([]);

    // Construir fechas con horas
    const dateFromWithTime = `${dateFrom} 00:00:00`;
    const dateToWithTime = `${dateTo} 23:59:59`;

    try {
      const data = await apiFetch('https://apitpv.anthonyloor.com/get_sale_report_orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license: license,
          date1: dateFromWithTime,
          date2: dateToWithTime
        })
      });

      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        alert('No se recibieron datos de la API o el formato no es el esperado');
      }
    } catch (error) {
      console.error('Error fetching sale report orders:', error);
      alert('Error obteniendo reporte de ventas.');
    } finally {
      setLoading(false);
    }
  };

  // Lanzar la búsqueda automáticamente cuando ambas fechas estén seleccionadas
  useEffect(() => {
    if (dateFrom && dateTo) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  // Calcular totales globales
  const totalCash = orders.reduce((acc, order) => acc + (order.total_cash || 0), 0);
  const totalCard = orders.reduce((acc, order) => acc + (order.total_card || 0), 0);
  const totalBizum = orders.reduce((acc, order) => acc + (order.total_bizum || 0), 0);

  const showBizumColumn = totalBizum > 0;

  // Crear una lista plana de todas las líneas de producto
  const allProductLines = orders.flatMap(order => 
    order.order_details.map(detail => ({
      date_add: order.date_add,
      id_order: order.id_order,
      id_customer: order.id_customer,
      product_name: detail.product_name,
      product_quantity: detail.product_quantity,
      unit_price: detail.unit_price_tax_incl,
      total_paid: order.total_paid,
      total_cash: order.total_cash,
      total_card: order.total_card,
      total_bizum: order.total_bizum,
      payment: order.payment,
    }))
  );

  return (
    <div className="p-4 space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex items-end space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearchDisabled || loading}
          className={`px-4 py-2 rounded ${
            isSearchDisabled || loading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Resultados */}
      {allProductLines.length > 0 && (
        <div className="overflow-x-auto space-y-8" ref={tableRef}>
          {/* Tabla principal con todos los productos */}
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border">Fecha Compra</th>
                <th className="py-2 px-4 border">Ticket</th>
                <th className="py-2 px-4 border">Cliente</th>
                <th className="py-2 px-4 border">Producto</th>
                <th className="py-2 px-4 border">Und.</th>
                <th className="py-2 px-4 border">Precio Und. (€)</th>
                <th className="py-2 px-4 border">Método Pago</th>
                <th className="py-2 px-4 border">Efectivo (€)</th>
                <th className="py-2 px-4 border">Tarjeta (€)</th>
                {showBizumColumn && <th className="py-2 px-4 border">Bizum (€)</th>}
                <th className="py-2 px-4 border">Total Pago (€)</th>
              </tr>
            </thead>
            <tbody>
              {allProductLines.map((line, index) => (
                <tr key={index} className="text-center">
                  <td className="py-2 px-4 border">{line.date_add}</td>
                  <td className="py-2 px-4 border">{line.id_order}</td>
                  <td className="py-2 px-4 border">{line.id_customer}</td>
                  <td className="py-2 px-4 border text-left">{line.product_name}</td>
                  <td className="py-2 px-4 border">{line.product_quantity}</td>
                  <td className="py-2 px-4 border">{line.unit_price.toFixed(2)} €</td>
                  <td className="py-2 px-4 border">{line.payment}</td>
                  <td className="py-2 px-4 border">{line.total_cash.toFixed(2)} €</td>
                  <td className="py-2 px-4 border">{line.total_card.toFixed(2)} €</td>
                  {showBizumColumn && <td className="py-2 px-4 border">{line.total_bizum.toFixed(2)} €</td>}
                  <td className="py-2 px-4 border">{line.total_paid.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tabla de totales globales */}
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border">Total Efectivo (€)</th>
                  <th className="py-2 px-4 border">Total Tarjeta (€)</th>
                  {showBizumColumn && <th className="py-2 px-4 border">Total Bizum (€)</th>}
                </tr>
              </thead>
              <tbody>
                <tr className="text-center">
                  <td className="py-2 px-4 border">{totalCash.toFixed(2)} €</td>
                  <td className="py-2 px-4 border">{totalCard.toFixed(2)} €</td>
                  {showBizumColumn && <td className="py-2 px-4 border">{totalBizum.toFixed(2)} €</td>}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {allProductLines.length === 0 && !loading && (dateFrom && dateTo) && (
        <div className="text-center mt-4">No hay resultados para el rango de fechas seleccionado.</div>
      )}
    </div>
  );
};

export default SalesReportSearch;