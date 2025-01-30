// src/components/modals/transfers/TransfersModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../Modal';
import TransferForm from './TransferForm';
import { useApiFetch } from '../../utils/useApiFetch';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const TransfersModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();

  // Para controlar la vista actual
  // - 'list': muestra la tabla de movimientos
  // - 'selectType': muestra los 3 botones (Traspaso, Entrada, Salida)
  // - 'form': muestra el TransferForm
  const [currentView, setCurrentView] = useState('list');

  // Movimientos (traspasos) recientes
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Almacena info si se selecciona un movimiento
  const [selectedMovement, setSelectedMovement] = useState(null);

  // Para saber qué tipo de traspaso/entrada/salida se desea crear
  const [movementType, setMovementType] = useState(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      // Llamas a tu endpoint
      const data = await apiFetch('https://apitpv.anthonyloor.com/get_warehouse_movements', {
        method: 'GET',
      });
      // Ajusta según la estructura real de la respuesta:
      // si la API te devuelve un array directo, o un objeto {status:'OK', data:[...]} etc.
      if (Array.isArray(data)) {
        setMovements(data);
      } else {
        console.error('[TransfersModal] Respuesta inesperada:', data);
      }
    } catch (error) {
      console.error('[TransfersModal] Error al obtener movimientos:', error);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // Llama a la API cuando se abra el modal, para cargar la lista
  useEffect(() => {
    if (isOpen) {
      setCurrentView('list');  // Por si reabren y estaba en otra vista
      fetchMovements();
    }
  }, [isOpen, fetchMovements]);

  // ---- Botones de la parte superior (list view) ----

  const handleCreateTransfer = () => {
    // Al pulsar "Crear Traspaso":
    // 1) Ponemos currentView = 'selectType'
    // 2) Aún no definimos movementType hasta que elija uno de los 3 botones
    setSelectedMovement(null);
    setMovementType(null);
    setCurrentView('selectType');
  };

  const handlePrintSummary = () => {
    alert('Imprimir resumen de movimientos (lógica tuya).');
  };

  const handleDeleteTransfer = () => {
    alert('Eliminar un traspaso (seleccionar alguno, o ver tu propia lógica).');
  };

  // ---- Cuando hacen click en una fila de la tabla ----
  const handleRowSelect = (movement) => {
    // Abrimos TransferForm con sus datos
    console.log('[TransfersModal]: ', movement);
    setSelectedMovement(movement);
    setMovementType(movement.type || 'traspaso'); // O en tu caso si la API indica el type
    setCurrentView('form');
  };

  // ---- Para la “selección de tipo” ----
  const selectMovementType = (type) => {
    // type: 'traspasos', 'entrada', 'salida' (o 'traspaso' en singular, ajústalo a tu gusto)
    setMovementType(type);
    // No hay movimiento seleccionado => nuevo
    setSelectedMovement(null);
    setCurrentView('form');
  };

  // ---- Botón "Atrás" en la vista 'form' o 'selectType' ----
  const goBack = () => {
    // Si estamos en 'form' => volvemos a 'list'
    // Si estamos en 'selectType' => también volvemos a 'list'
    setCurrentView('list');
    setSelectedMovement(null);
    setMovementType(null);
  };

  // ---- Render de la barra y la tabla ----
  const renderMovementList = () => {
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
          </div>
        </div>

        {/* Tabla paginada con PrimeReact u otra */}
        <DataTable
          value={movements}
          loading={loading}
          paginator
          rows={8}
          emptyMessage={loading ? 'Cargando...' : 'No hay movimientos.'}
          onRowClick={(e) => handleRowSelect(e.data)}
          className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
        >
          <Column
            field="id_warehouse_movement"
            header="ID"
            style={{ width: '70px' }}
          />
          <Column
            field="date_add"
            header="Fecha"
            style={{ width: '120px' }}
          />
          <Column
            field="description"
            header="Título"
            style={{ minWidth: '150px' }}
          />
          <Column
            field="type"
            header="Tipo"
            style={{ width: '100px' }}
          />
          <Column
            field="status"
            header="Estado"
            style={{ width: '100px' }}
          />
        </DataTable>
      </div>
    );
  };

  // ---- Render de los 3 botones (Traspaso, Entrada, Salida) ----
  const renderSelectType = () => {
    return (
      <div>
        {/* Botón "Atrás" */}
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

  // ---- Render del formulario ----
  const renderForm = () => {
    return (
      <div>
        {/* Botón "Atrás" */}
        <button
          onClick={goBack}
          className="bg-gray-300 px-3 py-1 rounded mb-3"
        >
          Atrás
        </button>
        {/* TransferForm con la lógica actual */}
        <TransferForm
          // Si es un movimiento existente => pasamos movementData
          movementData={selectedMovement}
          // O si es nuevo => pasamos type
          type={movementType}
          onSave={() => {
            // Una vez guardado => volver a la lista
            fetchMovements();
            setCurrentView('list');
          }}
        />
      </div>
    );
  };

  // ---- Render principal según currentView ----
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