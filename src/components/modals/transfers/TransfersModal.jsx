// src/components/modals/transfers/TransfersModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../Modal';
import TransferForm from './TransferForm';
import { useApiFetch } from '../../utils/useApiFetch';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const TransfersModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();

  // Vistas => 'list', 'selectType', 'form'
  const [currentView, setCurrentView] = useState('list');

  // Movimientos (después de filtrar).
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Movimiento seleccionado (para editar/ver).
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [movementType, setMovementType] = useState(null); // 'traspaso','entrada','salida'

  // Selección de la tabla (checkboxes).
  const [selectedMovements, setSelectedMovements] = useState([]);

  // Guardamos el resultado "crudo" de la API para luego filtrar localmente (para Title, Type, Status).
  const [unfilteredMovements, setUnfilteredMovements] = useState([]);

  // ---- Filtros ----
  // Regla: Si `filterId` != '', bloqueamos los campos de fecha, título, tipo, estado.
  //        Si `filterDateFrom` o `filterDateTo` != '', bloqueamos el id.
  const [filterId, setFilterId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  // Filtros de “titulo, tipo, estado” se aplican localmente al array devuelto por la api de rangos.
  const [filterTitle, setFilterTitle] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // --- Lógica principal de "Buscar" ---
  const handleSearch = async () => {
    setLoading(true);
    setSelectedMovements([]); // limpia selección en la tabla

    try {
      // 1) Si filterId !== '' => /get_warehouse_movement
      if (filterId.trim() !== '') {
        // Llamamos a la API de un solo movimiento
        const url = `https://apitpv.anthonyloor.com/get_warehouse_movement?id_warehouse_movement=${encodeURIComponent(filterId.trim())}`;
        const data = await apiFetch(url, { method: 'GET' });

        // data en tu backend devuelves array con 1 elemento, o algo similar
        if (Array.isArray(data) && data.length > 0) {
          setUnfilteredMovements(data);
        } else {
          // Si no hay data => array vacío
          setUnfilteredMovements([]);
        }

        // Tras obtenerlo, no aplicamos “filtro local por Título, Tipo, Estado”,
        // porque estos están bloqueados en este modo. 
        // Pero si quisieras, podrías aplicarlos igual. Lo dejaremos vacío.
        setMovements(unfilteredMovements);

      } else {
        // 2) Sino => user rellena dateFrom/dateTo => /get_warehouse_movements con date1, date2
        // La API solo filtrará por rango de fechas, y devolverá hasta 50 movimientos.
        // Luego localFilter por Title, Type, Status.
        const body = {};
        if (filterDateFrom) body.data1 = filterDateFrom;
        if (filterDateTo) body.data2 = filterDateTo;

        const data = await apiFetch('https://apitpv.anthonyloor.com/get_warehouse_movements', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        if (Array.isArray(data)) {
          setUnfilteredMovements(data);
        } else {
          setUnfilteredMovements([]);
          console.error('[TransfersModal] Respuesta inesperada:', data);
        }

        // Aplica un filtrado local con “Título, Tipo, Estado”
        // Espera a la respuesta y luego filtras:
        // para asegurarte de filtrar en el array recien llegado, 
        // lo metemos en un "temporary" antes de setUnfilteredMovements:
        const localFiltered = localFilterData(
          data || [],
          filterTitle,
          filterType,
          filterStatus
        );
        setMovements(localFiltered);
      }
    } catch (error) {
      console.error('[TransfersModal] handleSearch error:', error);
      setUnfilteredMovements([]);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  // Función de filtrado local para Título, Tipo, Estado
  const localFilterData = (arr, title, type, status) => {
    let result = [...arr];

    if (title.trim() !== '') {
      // Filtrado "like"
      const lower = title.toLowerCase();
      result = result.filter(mov =>
        mov.description.toLowerCase().includes(lower)
      );
    }
    if (type !== '') {
      result = result.filter(mov => mov.type === type);
    }
    if (status !== '') {
      result = result.filter(mov => mov.status === status);
    }

    return result;
  };

  // 3) “Refrescar”: Limpiamos todos los filtros y pedimos los últimos 50 por default
  const handleRefresh = async () => {
    setLoading(true);
    resetFilters();
    setSelectedMovements([]);

    try {
      // Llamada sin body => ultima info (las ultimas 50)
      const data = await apiFetch('https://apitpv.anthonyloor.com/get_warehouse_movements', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (Array.isArray(data)) {
        setUnfilteredMovements(data);
        setMovements(data);
      } else {
        setUnfilteredMovements([]);
        setMovements([]);
      }
    } catch (error) {
      console.error('[TransfersModal] handleRefresh error:', error);
      setUnfilteredMovements([]);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  // 4) Función para resetear todos los filtros
  const resetFilters = () => {
    setFilterId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterTitle('');
    setFilterType('');
    setFilterStatus('');
  };

  // 5) Al abrir el modal => vista 'list', refrescamos la info sin filtros
  useEffect(() => {
    if (isOpen) {
      setCurrentView('list');
      handleRefresh(); // trae las últimas 50
    }
  }, [isOpen]);

  // 6) Selección de una fila => form
  const handleRowSelect = (movement) => {
    setSelectedMovement(movement);
    setMovementType(movement.type || 'traspaso');
    setCurrentView('form');
  };

  // 7) Botones en la parte superior de la tabla
  const handleCreateTransfer = () => {
    setSelectedMovement(null);
    setMovementType(null);
    setCurrentView('selectType');
  };

  const handlePrintSummary = () => {
    if (selectedMovements.length === 0) {
      alert('No hay movimientos seleccionados para imprimir.');
      return;
    }
    alert(`Imprimir resumen de ${selectedMovements.length} movimientos (pendiente).`);
  };

  const handleDeleteTransfer = () => {
    if (selectedMovements.length === 0) {
      alert('No hay movimientos seleccionados para eliminar.');
      return;
    }
    alert(`Eliminar ${selectedMovements.length} movimientos (pendiente).`);
  };

  // 8) “selectType” => 'form'
  const selectMovementType = (type) => {
    setMovementType(type);
    setSelectedMovement(null);
    setCurrentView('form');
  };

  // 9) Botón “Atrás”
  const goBack = () => {
    setCurrentView('list');
    setSelectedMovement(null);
    setMovementType(null);
  };

  // Para la tabla con checkboxes y paginación
  const renderMovementList = () => {
    // Lógica para habilitar/deshabilitar inputs en los filtros
    const disableById = filterId.trim() !== ''; // si ID está relleno => block date y (title, type, status)
    const disableByDate = filterDateFrom || filterDateTo; // si fecha => block ID

    return (
      <div>
        {/* Barra superior */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-2">
            <button
              onClick={handleCreateTransfer}
              className="bg-blue-500 text-white px-3 py-2 rounded"
            >
              + Crear Traspaso
            </button>
            <button
              onClick={handlePrintSummary}
              className="bg-gray-300 px-3 py-2 rounded"
            >
              Imprimir Resumen
            </button>
            <button
              onClick={handleDeleteTransfer}
              className="bg-red-500 text-white px-3 py-2 rounded"
            >
              Eliminar Traspaso
            </button>
            <button
              onClick={handleRefresh}
              className="bg-gray-300 px-3 py-2 rounded"
            >
              Refrescar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-3 mb-3 border border-gray-200 rounded">
          <div className="grid grid-cols-6 gap-4">
            {/* ID */}
            <div>
              <label className="block text-sm font-semibold mb-1">ID Movimiento</label>
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={filterId}
                onChange={(e) => {
                  setFilterId(e.target.value);
                  if (e.target.value.trim()) {
                    // Si el usuario comienza a meter ID, deshabilitamos las fechas
                    setFilterDateFrom('');
                    setFilterDateTo('');
                    setFilterTitle('');
                    setFilterType('');
                    setFilterStatus('');
                  }
                }}
              />
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-semibold mb-1">Fecha Desde</label>
              <input
                type="date"
                className="border p-2 rounded w-full"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  if (e.target.value) {
                    // Al meter fecha => limpias ID
                    setFilterId('');
                  }
                }}
                disabled={disableById}
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-semibold mb-1">Fecha Hasta</label>
              <input
                type="date"
                className="border p-2 rounded w-full"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  if (e.target.value) {
                    // Limpias ID
                    setFilterId('');
                  }
                }}
                disabled={disableById}
              />
            </div>

            {/* Titulo */}
            <div>
              <label className="block text-sm font-semibold mb-1">Título</label>
              <input
                type="text"
                className="border p-2 rounded w-full"
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                disabled={disableById} // si ID está relleno => no se puede usar Título
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-semibold mb-1">Tipo</label>
              <select
                className="border p-2 rounded w-full"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                disabled={disableById}
              >
                <option value="">(Todos)</option>
                <option value="traspaso">Traspaso</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-semibold mb-1">Estado</label>
              <select
                className="border p-2 rounded w-full"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                disabled={disableById}
              >
                <option value="">(Todos)</option>
                <option value="En creacion">En creacion</option>
                <option value="Enviado">Enviado</option>
                <option value="Recibido">Recibido</option>
                <option value="En revision">En revision</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>

          <div className="mt-3 text-right">
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Separador */}
        <hr className="my-3 border-gray-300" />

        {/* Tabla */}
        <DataTable
          value={movements}
          loading={loading}
          selection={selectedMovements}
          onSelectionChange={(e) => setSelectedMovements(e.value)}
          selectionMode="checkbox"
          paginator
          rows={8}
          emptyMessage={loading ? 'Cargando...' : 'No hay movimientos.'}
          onRowClick={(e) => handleRowSelect(e.data)}
          className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
          <Column field="id_warehouse_movement" header="ID" style={{ width: '70px' }} />
          <Column field="date_add" header="Fecha" style={{ width: '120px' }} />
          <Column field="description" header="Título" style={{ minWidth: '150px' }} />
          <Column field="type" header="Tipo" style={{ width: '100px' }} />
          <Column field="status" header="Estado" style={{ width: '100px' }} />
        </DataTable>
      </div>
    );
  };

  // Vista 'selectType'
  const renderSelectType = () => {
    return (
      <div>
        <button
          onClick={goBack}
          className="bg-gray-300 px-3 py-1 rounded mb-3"
        >
          Atrás
        </button>
        <h2 className="text-xl font-bold mb-4">Selecciona el tipo de movimiento</h2>
        <div className="space-y-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
            onClick={() => selectMovementType('traspaso')}
          >
            Traspaso entre Tiendas
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
            onClick={() => selectMovementType('entrada')}
          >
            Entrada de Mercadería
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded w-full"
            onClick={() => selectMovementType('salida')}
          >
            Salida de Mercadería
          </button>
        </div>
      </div>
    );
  };

  // Vista 'form'
  const renderForm = () => {
    return (
      <div>
        <button
          onClick={goBack}
          className="bg-gray-300 px-3 py-1 rounded mb-3"
        >
          Atrás
        </button>
        <TransferForm
          movementData={selectedMovement}
          type={movementType}
          onSave={() => {
            // tras guardar => recarga la info por defecto (últimos 50)
            handleRefresh();
            setCurrentView('list');
          }}
        />
      </div>
    );
  };

  // Render final
  let content = null;
  if (currentView === 'list') {
    content = renderMovementList();
  } else if (currentView === 'selectType') {
    content = renderSelectType();
  } else if (currentView === 'form') {
    content = renderForm();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Mercadería"
      size="3xl"
      height="tall"
    >
      {content}
    </Modal>
  );
};

export default TransfersModal;