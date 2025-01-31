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

  // Movimientos
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Movimiento seleccionado (para editar/ver).
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [movementType, setMovementType] = useState(null);

  // Checkboxes (selección múltiple)
  const [selectedMovements, setSelectedMovements] = useState([]);

  // Guardamos data sin filtrar por Título,Tipo,Estado
  const [unfilteredMovements, setUnfilteredMovements] = useState([]);

  // Filtros
  const [filterId, setFilterId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterTitle, setFilterTitle] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Para mostrar/ocultar contenedor de filtros
  const [showFilters, setShowFilters] = useState(false);

  // ---------------------------------------------------------------------
  // LÓGICA PRINCIPAL DE BÚSQUEDA
  // ---------------------------------------------------------------------
  const handleSearch = async () => {
    setLoading(true);
    setSelectedMovements([]);

    try {
      // 1) si filterId => llama a GET /get_warehouse_movement
      if (filterId.trim() !== '') {
        const url = `https://apitpv.anthonyloor.com/get_warehouse_movement?id_warehouse_movement=${encodeURIComponent(filterId.trim())}`;
        const data = await apiFetch(url, { method: 'GET' });

        if (Array.isArray(data) && data.length > 0) {
          setUnfilteredMovements(data);
          // En este caso “bloqueas” la lógica de filtrar local Título/Tipo/Estado,
          // pero si quisieras, podrías filtrar local de igual forma.
          setMovements(data);
        } else {
          setUnfilteredMovements([]);
          setMovements([]);
        }
      } else {
        // 2) sino => /get_warehouse_movements con date1, date2
        const body = {};
        if (filterDateFrom) body.data1 = filterDateFrom;
        if (filterDateTo) body.data2 = filterDateTo;

        const data = await apiFetch('https://apitpv.anthonyloor.com/get_warehouse_movements', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        if (Array.isArray(data)) {
          setUnfilteredMovements(data);
          // Aplicar filtrado local Título, Tipo, Estado
          const localFiltered = localFilterData(
            data,
            filterTitle,
            filterType,
            filterStatus
          );
          setMovements(localFiltered);
        } else {
          setUnfilteredMovements([]);
          setMovements([]);
        }
      }
    } catch (error) {
      console.error('[TransfersModal] handleSearch error:', error);
      setUnfilteredMovements([]);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado local Título, Tipo, Estado
  const localFilterData = (arr, title, type, status) => {
    let result = [...arr];
    if (title.trim() !== '') {
      const lower = title.toLowerCase();
      result = result.filter(mov => mov.description.toLowerCase().includes(lower));
    }
    if (type !== '') {
      result = result.filter(mov => mov.type === type);
    }
    if (status !== '') {
      result = result.filter(mov => mov.status === status);
    }
    return result;
  };

  // Refrescar => sin filtros
  const handleRefresh = async () => {
    resetFilters();
    setLoading(true);
    setSelectedMovements([]);
    try {
      const data = await apiFetch('https://apitpv.anthonyloor.com/get_warehouse_movements', {
        method: 'POST',
        body: JSON.stringify({}), // sin body => últimas 50
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

  // Limpiar todos los filtros
  const resetFilters = () => {
    setFilterId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterTitle('');
    setFilterType('');
    setFilterStatus('');
  };

  // Al abrir => list => handleRefresh
  useEffect(() => {
    if (isOpen) {
      setCurrentView('list');
      handleRefresh();
    }
  }, [isOpen]);

  // ---------------------------------------------------------------------
  // FUNCIONES EVENTOS
  // ---------------------------------------------------------------------
  const handleRowSelect = (movement) => {
    setSelectedMovement(movement);
    setMovementType(movement.type || 'traspaso');
    setCurrentView('form');
  };

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

  const selectMovementType = (type) => {
    setMovementType(type);
    setSelectedMovement(null);
    setCurrentView('form');
  };

  const goBack = () => {
    setCurrentView('list');
    setSelectedMovement(null);
    setMovementType(null);
  };

  // ---------------------------------------------------------------------
  // RENDER DE LA VISTA "LIST"
  // ---------------------------------------------------------------------
  const renderMovementList = () => {
    // Lógica para habilitar/deshabilitar
    const disableById = filterId.trim() !== '';
    const disableByDate = !!(filterDateFrom || filterDateTo);

    // container de Filtros (desplegable)
    const renderFilters = () => {
      if (!showFilters) return null;

      return (
        <div className="bg-white p-3 mb-3 border border-gray-200 rounded">
          <div className="grid grid-cols-6 gap-4">
            {/* ID */}
            <div className="relative">
              <label className="block text-sm font-semibold mb-1">ID Movimiento</label>
              <input
                type="text"
                className="border p-2 rounded w-full pr-7"
                value={filterId}
                onChange={(e) => {
                  setFilterId(e.target.value);
                  if (e.target.value.trim()) {
                    // Se rellena ID => vaciamos fecha/título/tipo/estado
                    setFilterDateFrom('');
                    setFilterDateTo('');
                    setFilterTitle('');
                    setFilterType('');
                    setFilterStatus('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                // si se rellena fecha => se bloquea => disabled=disableByDate
                disabled={disableByDate}
              />
              {/* Botón x para limpiar */}
              {filterId && (
                <button
                  className="absolute right-1 top-8 text-gray-500"
                  onClick={() => setFilterId('')}
                >
                  x
                </button>
              )}
            </div>

            {/* Fecha Desde */}
            <div className="relative">
              <label className="block text-sm font-semibold mb-1">Fecha Desde</label>
              <input
                type="date"
                className="border p-2 rounded w-full pr-7"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  if (e.target.value) {
                    // Se rellena => limpiamos ID
                    setFilterId('');
                  }
                }}
                disabled={disableById}
              />
              {filterDateFrom && (
                <button
                  className="absolute right-1 top-8 text-gray-500"
                  onClick={() => setFilterDateFrom('')}
                >
                  x
                </button>
              )}
            </div>

            {/* Fecha Hasta */}
            <div className="relative">
              <label className="block text-sm font-semibold mb-1">Fecha Hasta</label>
              <input
                type="date"
                className="border p-2 rounded w-full pr-7"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  if (e.target.value) {
                    setFilterId('');
                  }
                }}
                disabled={disableById}
              />
              {filterDateTo && (
                <button
                  className="absolute right-1 top-8 text-gray-500"
                  onClick={() => setFilterDateTo('')}
                >
                  x
                </button>
              )}
            </div>

            {/* Título */}
            <div className="relative">
              <label className="block text-sm font-semibold mb-1">Título</label>
              <input
                type="text"
                className="border p-2 rounded w-full pr-7"
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                disabled={disableById}
              />
              {filterTitle && (
                <button
                  className="absolute right-1 top-8 text-gray-500"
                  onClick={() => setFilterTitle('')}
                >
                  x
                </button>
              )}
            </div>

            {/* Tipo */}
            <div className="relative">
              <label className="block text-sm font-semibold mb-1">Tipo</label>
              <select
                className="border p-2 rounded w-full pr-7"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                disabled={disableById}
              >
                <option value="">(Todos)</option>
                <option value="traspaso">Traspaso</option>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
              {filterType && (
                <button
                  className="absolute right-1 top-8 text-gray-500"
                  onClick={() => setFilterType('')}
                >
                  x
                </button>
              )}
            </div>

            {/* Estado */}
            <div className="relative">
              <label className="block text-sm font-semibold mb-1">Estado</label>
              <select
                className="border p-2 rounded w-full pr-7"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                disabled={disableById}
              >
                <option value="">(Todos)</option>
                <option value="en creacion">En creacion</option>
                <option value="enviado">Enviado</option>
                <option value="recibido">Recibido</option>
                <option value="en revision">En revision</option>
                <option value="finalizado">Finalizado</option>
              </select>
              {filterStatus && (
                <button
                  className="absolute right-1 top-8 text-gray-500"
                  onClick={() => setFilterStatus('')}
                >
                  x
                </button>
              )}
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
      );
    };

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
          {/* Botón para mostrar/ocultar contenedor de filtros */}
          <div>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="bg-indigo-500 text-white px-3 py-2 rounded"
            >
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
          </div>
        </div>

        {/* Filtros condicionales */}
        {renderFilters()}

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

  // ---------------------------------------------------------------------
  // RENDER SELECT TYPE
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // RENDER FORM
  // ---------------------------------------------------------------------
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
            handleRefresh();
            setCurrentView('list');
          }}
        />
      </div>
    );
  };

  // ---------------------------------------------------------------------
  // RENDER PRINCIPAL
  // ---------------------------------------------------------------------
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