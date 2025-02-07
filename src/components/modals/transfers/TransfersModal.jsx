import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import TransferForm from './TransferForm';
import { useApiFetch } from '../../utils/useApiFetch';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const TransfersModal = ({ isOpen, onClose, inlineMode = false }) => {
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

  // Guardamos data sin filtrar
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

  // Al abrir => list => refrescar
  useEffect(() => {
    if (isOpen) {
      setCurrentView('list');
      handleRefresh();
    }
  }, [isOpen]);

  // Refrescar => sin filtros
  const handleRefresh = async () => {
    resetFilters();
    setLoading(true);
    setSelectedMovements([]);
    try {
      const data = await apiFetch('https://apitpv.anthonyloor.com/get_warehouse_movements', {
        method: 'POST',
        body: JSON.stringify({}), // últimas 50
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

  // Reset filtros
  const resetFilters = () => {
    setFilterId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterTitle('');
    setFilterType('');
    setFilterStatus('');
  };

  // Buscar con filtros
  const handleSearch = async () => {
    setLoading(true);
    setSelectedMovements([]);
    try {
      if (filterId.trim() !== '') {
        // get_warehouse_movement ?id=...
        const url = `https://apitpv.anthonyloor.com/get_warehouse_movement?id_warehouse_movement=${encodeURIComponent(
          filterId.trim()
        )}`;
        const data = await apiFetch(url, { method: 'GET' });
        if (data && !Array.isArray(data)) {
          setUnfilteredMovements([data]);
          setMovements([data]);
        } else if (Array.isArray(data)) {
          setUnfilteredMovements(data);
          setMovements(data);
        } else {
          setUnfilteredMovements([]);
          setMovements([]);
        }
      } else {
        // get_warehouse_movements con date1, date2
        const body = {};
        if (filterDateFrom) body.data1 = filterDateFrom;
        if (filterDateTo) body.data2 = filterDateTo;

        const data = await apiFetch('https://apitpv.anthonyloor.com/get_warehouse_movements', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (Array.isArray(data)) {
          setUnfilteredMovements(data);
          const localFiltered = localFilterData(data, filterTitle, filterType, filterStatus);
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

  // Filtrado local
  const localFilterData = (arr, title, type, status) => {
    let result = [...arr];
    if (title.trim() !== '') {
      const lower = title.toLowerCase();
      result = result.filter((mov) =>
        (mov.description || '').toLowerCase().includes(lower)
      );
    }
    if (type !== '') {
      result = result.filter((mov) => mov.type === type);
    }
    if (status !== '') {
      result = result.filter(
        (mov) => (mov.status || '').toLowerCase() === status.toLowerCase()
      );
    }
    return result;
  };

  // Doble click => abrir el detalle (llamar a get_warehouse_movement)
  const handleRowDoubleClick = async (movement) => {
    try {
      setLoading(true);
      const data = await apiFetch(
        `https://apitpv.anthonyloor.com/get_warehouse_movement?id_warehouse_movement=${movement.id_warehouse_movement}`,
        { method: 'GET' }
      );
      setSelectedMovement(data);
      setMovementType(data.type || 'traspaso');
      setCurrentView('form');
    } catch (error) {
      console.error('Error al obtener detalles del movimiento:', error);
      alert('No se pudo cargar el detalle del movimiento');
    } finally {
      setLoading(false);
    }
  };

  // Single click => alternar en selectedMovements
  const handleRowClick = (movement) => {
    let _selected = [...selectedMovements];
    const index = _selected.findIndex(
      (m) => m.id_warehouse_movement === movement.id_warehouse_movement
    );
    if (index >= 0) {
      // Quitar
      _selected.splice(index, 1);
    } else {
      // Agregar
      _selected.push(movement);
    }
    setSelectedMovements(_selected);
  };

  // Botones
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

  const selectMovementType = (newType) => {
    setMovementType(newType);
    setSelectedMovement(null);
    setCurrentView('form');
  };

  const handleFormSave = () => {
    handleRefresh();
    setCurrentView('list');
  };

  // --- Render subpantallas ---
  const renderMovementList = () => {
    // Lógica para habilitar/deshabilitar
    const disableById = filterId.trim() !== '';
    const disableByDate = !!(filterDateFrom || filterDateTo);
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
                <option value="En creacion">En creacion</option>
                <option value="Enviado">Enviado</option>
                <option value="Recibido">Recibido</option>
                <option value="En revision">En revision</option>
                <option value="Finalizado">Finalizado</option>
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
              Eliminar
            </button>
            <button
              onClick={handleRefresh}
              className="bg-gray-300 px-3 py-2 rounded"
            >
              Refrescar
            </button>
          </div>
          <div>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="bg-indigo-500 text-white px-3 py-2 rounded"
            >
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
          </div>
        </div>

        {renderFilters()}
        <hr className="my-3 border-gray-300" />

        <DataTable
          value={movements}
          loading={loading}
          dataKey="id_warehouse_movement"
          selectionMode="multiple"
          metaKeySelection={false}  // Para toggle con click normal
          selection={selectedMovements}
          onSelectionChange={(e) => setSelectedMovements(e.value)}
          paginator
          rows={8}
          emptyMessage={loading ? 'Cargando...' : 'No hay movimientos.'}
          className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
          onRowClick={(e) => handleRowClick(e.data)}  // Click => toggle selection
          onRowDoubleClick={(e) => handleRowDoubleClick(e.data)} // DblClick => abrir
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
          <Column field="id_warehouse_movement" header="ID" style={{ width: '70px' }} />
          <Column field="date_add" header="Fecha" style={{ width: '120px' }} />
          <Column field="description" header="Título" style={{ minWidth: '150px' }} />
          <Column field="type" header="Tipo" style={{ width: '100px' }} />
          <Column field="status" header="Estado" style={{ width: '120px' }} />
        </DataTable>
      </div>
    );
  };

  const renderSelectType = () => {
    return (
      <div>
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

  const renderForm = () => {
    return (
      <div>
        <TransferForm
          movementData={selectedMovement}
          type={movementType}
          onSave={handleFormSave}
        />
      </div>
    );
  };

  // Título modal
  let modalTitle = '';
  if (currentView === 'list') {
    modalTitle = 'Gestión de Stock';
  } else if (currentView === 'selectType') {
    modalTitle = 'Crear Movimiento';
  } else if (currentView === 'form') {
    if (!selectedMovement) {
      const t = movementType || 'traspaso';
      modalTitle = `Crear Movimiento: ${
        t === 'traspaso' ? 'Traspaso' : t === 'entrada' ? 'Entrada' : 'Salida'
      }`;
    } else {
      const t = selectedMovement.type;
      if (t === 'traspaso') modalTitle = 'Traspaso entre tiendas';
      else if (t === 'entrada') modalTitle = 'Entrada de mercadería';
      else if (t === 'salida') modalTitle = 'Salida de mercadería';
      else modalTitle = 'Movimiento';
    }
  }

  let content = null;
  if (currentView === 'list') {
    content = renderMovementList();
  } else if (currentView === 'selectType') {
    content = renderSelectType();
  } else if (currentView === 'form') {
    content = renderForm();
  }

  const showBackButton = currentView !== 'list';

  const handleBack = () => {
    setCurrentView('list');
    setSelectedMovement(null);
    setMovementType(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      inlineMode={inlineMode}
      title={modalTitle}
      showBackButton={showBackButton}
      onBack={handleBack}
      size="3xl"
      height="tall"
    >
      {content}
    </Modal>
  );
};

export default TransfersModal;