// src/components/reports/SalesReportSearch.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ConfigContext } from '../../contexts/ConfigContext';
import { useApiFetch } from '../../components/utils/useApiFetch';

// PrimeReact
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const SalesReportSearch = () => {
  const apiFetch = useApiFetch();
  const { configData } = useContext(ConfigContext);

  const licenseData = localStorage.getItem('licenseData') 
    ? JSON.parse(localStorage.getItem('licenseData'))
    : null;
  const license = licenseData?.licenseKey;

  // Fechas
  const today = new Date().toISOString().split('T')[0]; // Formato yyyy-mm-dd
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  // 2. Botones rápidos para fechas
  const setDaysAgo = (days) => {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - days);
    const pastDateStr = pastDate.toISOString().split('T')[0];
    setDateFrom(pastDateStr);
    setDateTo(today);
  };

  // Datos y loading
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Configurar paginación en la DataTable
  const [rows] = useState(15);  // por defecto 15

  // Para aplanar las líneas de producto
  const allProductLines = orders.flatMap((order) =>
    order.order_details.map((detail) => ({
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

  // Función para formatear fecha => dd-mm-yyyy hh:mm
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return dateString; // Si no es fecha válida, devuelves la cadena original

    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();

    const hh = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');

    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  };

  // Mostrar cliente => "TPV" si coincide con configData.id_customer_default, en otro caso el id
  const getCustomerDisplay = (id_customer) => {
    if (configData?.id_customer_default && id_customer === configData.id_customer_default) {
      return 'TPV';
    }
    return id_customer;
  };

  // Unificar métodos de pago
  const getPaymentMethodsString = (line) => {
    const methods = [];
    if (line.total_cash > 0) methods.push(`Efectivo: ${line.total_cash.toFixed(2)} €`);
    if (line.total_card > 0) methods.push(`Tarjeta: ${line.total_card.toFixed(2)} €`);
    if (line.total_bizum > 0) methods.push(`Bizum: ${line.total_bizum.toFixed(2)} €`);
    return methods.join(', ');
  };

  // Calcular totales globales
  const totalCash = orders.reduce((acc, order) => acc + (order.total_cash || 0), 0);
  const totalCard = orders.reduce((acc, order) => acc + (order.total_card || 0), 0);
  const totalBizum = orders.reduce((acc, order) => acc + (order.total_bizum || 0), 0);
  const showBizumColumn = totalBizum > 0;

  // Buscar
  const handleSearch = async () => {
    if (!dateFrom || !dateTo) return;
    setLoading(true);
    setOrders([]);

    const dateFromWithTime = `${dateFrom} 00:00:00`;
    const dateToWithTime = `${dateTo} 23:59:59`;

    try {
      const data = await apiFetch('https://apitpv.anthonyloor.com/get_sale_report_orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license,
          date1: dateFromWithTime,
          date2: dateToWithTime,
        }),
      });

      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        alert('No se recibieron datos o el formato no es el esperado');
      }
    } catch (error) {
      console.error('Error en la búsqueda de reporte de ventas:', error);
      alert('Error obteniendo reporte de ventas.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar automáticamente al seleccionar ambas fechas
  useEffect(() => {
    if (dateFrom && dateTo) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

// (1) Filtrar todos los lines que contienen rectificación
const rectOrderIds = new Set(
  allProductLines
    .filter((line) => line.product_name?.trim().toLowerCase().startsWith('rectificaci\u00f3n del ticket #'))
    .map((line) => line.id_order)
);

const rectificationGroups = [...rectOrderIds].map((ordId) => {
  const linesOfThisOrder = allProductLines.filter((ln) => ln.id_order === ordId);
  const rectLine = linesOfThisOrder.find((ln) =>
    ln.product_name?.trim().toLowerCase().startsWith('rectificaci\u00f3n del ticket #')
  );

  return {
    id_order: ordId,
    date_add: rectLine?.date_add || '',
    id_customer: rectLine?.id_customer,
    product_name: rectLine?.product_name,
    product_quantity: rectLine?.product_quantity,
    lines: linesOfThisOrder,
  };
});

// (3) rowExpansionTemplate para rectificaciones
const rowExpansionTemplate = (rowData) => {
  const linesReturned = rowData.lines.filter((ln) => {
    const name = ln.product_name?.trim().toLowerCase() || '';
    return !name.startsWith('rectificaci\u00f3n del ticket #');
  });

  if (linesReturned.length === 0) {
    return <div className="p-2"><em>No hay productos devueltos en este ticket.</em></div>;
  }

  return (
    <div className="p-2 bg-gray-50 border rounded">
      <DataTable
        value={linesReturned}
        className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
        responsiveLayout="scroll"
      >
        <Column header="Fecha" body={(ln) => formatDate(ln.date_add)} style={{ width: '170px' }} />
        <Column header="Ticket" field="id_order" style={{ width: '80px' }} />
        <Column header="Cliente" body={(ln) => getCustomerDisplay(ln.id_customer)} style={{ width: '80px' }} />
        <Column header="Producto" field="product_name" />
        <Column header="Cant." field="product_quantity" style={{ textAlign: 'right', width: '70px' }} />
        <Column header="P/U (€)" body={(ln) => ln.unit_price.toFixed(2)} style={{ textAlign: 'right', width: '100px' }} />
        <Column header="Métodos de pago" body={(ln) => getPaymentMethodsString(ln)} style={{ minWidth: '140px' }} />
        <Column header="Total Pago (€)" body={(ln) => ln.total_paid.toFixed(2) + ' €'} style={{ textAlign: 'right', width: '120px' }} />
      </DataTable>
    </div>
  );
};

// Estado para expansión de filas de rectificaciones
const [expandedRows, setExpandedRows] = useState({});

// Para la tabla principal, con paginación interna
const displayData = loading 
? new Array(rows).fill(null).map((_, idx) => ({
    id_order: `skeleton-${idx}`,
    id_customer: '',
    product_name: 'Cargando...',
    product_quantity: 0,
    unit_price: 0,
    total_paid: 0,
    total_cash: 0,
    total_card: 0,
    total_bizum: 0,
    payment: '',
  }))
: allProductLines;

  return (
    <div className="p-4 space-y-6">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-end space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none 
                       focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:outline-none 
                       focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Botones rápidos en fila horizontal */}
        <div className="flex space-x-2">
          <button onClick={() => setDaysAgo(1)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">1 día</button>
          <button onClick={() => setDaysAgo(7)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">7 días</button>
          <button onClick={() => setDaysAgo(15)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">15 días</button>
          <button onClick={() => setDaysAgo(30)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">30 días</button>
        </div>

      </div>

      {/* DataTable con PrimeReact */}
      <div className="border border-gray-200 rounded-lg">

      <DataTable
  value={displayData}
  paginator
  rows={rows}
  rowsPerPageOptions={[15, 20, 30, 50]}
  className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
  scrollable
  scrollHeight="400px"
  emptyMessage={loading ? '' : 'No hay resultados'}
>
  <Column
    header="Fecha Compra"
    style={{ width: '170px' }}
    body={(line) => {
      if (loading) {
        return <div className="animate-pulse bg-gray-200 h-3 w-32 rounded" />;
      }
      return formatDate(line.date_add);
    }}
  />
  <Column
    header="Ticket"
    style={{ width: '80px' }}
    field="id_order"
    body={(line) => {
      if (loading) {
        return <div className="animate-pulse bg-gray-200 h-3 w-16 rounded mx-auto" />;
      }
      return line.id_order;
    }}
  />
  <Column
    header="Cliente"
    style={{ width: '80px' }}
    body={(line) => {
      if (loading) {
        return <div className="animate-pulse bg-gray-200 h-3 w-12 rounded mx-auto" />;
      }
      return getCustomerDisplay(line.id_customer);
    }}
  />
  <Column
    header="Producto"
    field="product_name"
    style={{ minWidth: '180px' }}
    body={(line) => {
      if (loading) {
        return <div className="animate-pulse bg-gray-200 h-3 w-32 rounded" />;
      }
      return line.product_name;
    }}
  />
  <Column
    header="Und."
    field="product_quantity"
    style={{ width: '70px', textAlign: 'right' }}
    body={(line) => {
      if (loading) {
        return <div className="animate-pulse bg-gray-200 h-3 w-8 rounded ml-auto" />;
      }
      return line.product_quantity;
    }}
  />
  <Column
    header="Precio Und. (€)"
    style={{ width: '110px', textAlign: 'right' }}
    body={(line) => {
      if (loading) {
        return <div className="animate-pulse bg-gray-200 h-3 w-12 rounded ml-auto" />;
      }
      return line.unit_price.toFixed(2) + ' €';
    }}
  />
  <Column
    header="Métodos de pago"
    style={{ minWidth: '140px' }}
    body={(line) => {
      if (loading) {
        return <div className="animate-pulse bg-gray-200 h-3 w-40 rounded" />;
      }
      return getPaymentMethodsString(line);
    }}
  />
  <Column
    header="Total Pago (€)"
    style={{ width: '120px', textAlign: 'right' }}
    body={(line) => {
      if (loading) {
        return <div className="animate-pulse bg-gray-200 h-3 w-12 rounded ml-auto" />;
      }
      return line.total_paid.toFixed(2) + ' €';
    }}
  />
</DataTable>

      </div>

      {/* (2) Tabla secundaria: "Rectificaciones" */}
      {rectificationGroups.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-2">
          <h2 className="text-lg font-semibold mb-2 text-indigo-600">
            Cambios y Devoluciones
          </h2>

          <DataTable
            value={rectificationGroups}
            className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
            dataKey="id_order"
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={rowExpansionTemplate}
            emptyMessage="No hay rectificaciones"
          >
            <Column
              expander
              style={{ width: '3rem' }}
            />

            <Column
              header="Ticket (Rectificación)"
              field="id_order"
              style={{ width: '120px' }}
            />
            <Column
              header="Fecha"
              body={(rowData) => formatDate(rowData.date_add)}
              style={{ width: '170px' }}
            />
            <Column
              header="Cliente"
              body={(rowData) => getCustomerDisplay(rowData.id_customer)}
              style={{ width: '80px' }}
            />
            <Column
              header="Producto"
              field="product_name"
              style={{ minWidth: '180px' }}
            />
            <Column
              header="Cant."
              field="product_quantity"
              style={{ width: '70px', textAlign: 'right' }}
            />
          </DataTable>
        </div>
      )}

      {/* Totales globales si hay datos */}
      {orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100 text-base text-gray-700">
              <tr>
                <th className="py-2 px-4 border">Total Efectivo (€)</th>
                <th className="py-2 px-4 border">Total Tarjeta (€)</th>
                {showBizumColumn && <th className="py-2 px-4 border">Total Bizum (€)</th>}
              </tr>
            </thead>
            <tbody>
              <tr className="text-center divide-y divide-gray-200">
                <td className="py-2 px-4 border">{totalCash.toFixed(2)} €</td>
                <td className="py-2 px-4 border">{totalCard.toFixed(2)} €</td>
                {showBizumColumn && <td className="py-2 px-4 border">{totalBizum.toFixed(2)} €</td>}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesReportSearch;