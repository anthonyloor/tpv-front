// src/components/modals/transfers/TransfersModal.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import Modal from "../Modal";
import TransferForm from "./TransferForm";
import { useApiFetch } from "../../utils/useApiFetch";

// PrimeReact
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";

const TransfersModal = ({ isOpen, onClose, inlineMode = false }) => {
  const apiFetch = useApiFetch();

  // Vistas => 'list', 'selectType', 'form'
  const [currentView, setCurrentView] = useState("list");

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
  const [filterId, setFilterId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Para mostrar/ocultar contenedor de filtros
  const [showFilters, setShowFilters] = useState(false);

  // Referencia para DataTable (CSV export)
  const dt = useRef(null);

  // Reset filtros
  const resetFilters = useCallback(() => {
    setFilterId("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterTitle("");
    setFilterType("");
    setFilterStatus("");
  }, []);

  // Refrescar => sin filtros
  const handleRefresh = useCallback(async () => {
    resetFilters();
    setLoading(true);
    setSelectedMovements([]);

    const formatDate = (dateStr) => {
      if (!dateStr) return dateStr;
      const [datePart, timePart] = dateStr.split(" ");
      if (!datePart || !timePart) return dateStr;
      const [year, month, day] = datePart.split("-");
      const [hour, minute] = timePart.split(":");
      return `${day}-${month}-${year} ${hour}:${minute}`;
    };

    try {
      const data = await apiFetch(
        "https://apitpv.anthonyloor.com/get_warehouse_movements",
        {
          method: "POST",
          body: JSON.stringify({}), // últimas 50
        }
      );
      if (Array.isArray(data)) {
        // Formateamos los campos de fecha si vienen informados
        const formattedData = data.map((mov) => ({
          ...mov,
          date_add: formatDate(mov.date_add),
          date_excute: formatDate(mov.date_excute),
          date_modified: formatDate(mov.date_modified),
          date_recived: formatDate(mov.date_recived),
        }));
        setUnfilteredMovements(formattedData);
        setMovements(formattedData);
      } else {
        setUnfilteredMovements([]);
        setMovements([]);
      }
    } catch (error) {
      console.error("[TransfersModal] handleRefresh error:", error);
      setUnfilteredMovements([]);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, resetFilters]);

  // Al abrir => list => refrescar
  useEffect(() => {
    if (isOpen) {
      setCurrentView("list");
      handleRefresh();
    }
  }, [isOpen, handleRefresh]);

  // Buscar con filtros
  const handleSearch = async () => {
    setLoading(true);
    setSelectedMovements([]);
    try {
      if (filterId.trim() !== "") {
        // get_warehouse_movement ?id=...
        const url = `https://apitpv.anthonyloor.com/get_warehouse_movement?id_warehouse_movement=${encodeURIComponent(
          filterId.trim()
        )}`;
        const data = await apiFetch(url, { method: "GET" });
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
        const body = {};
        if (filterDateFrom) body.data1 = filterDateFrom;
        if (filterDateTo) body.data2 = filterDateTo;

        const data = await apiFetch(
          "https://apitpv.anthonyloor.com/get_warehouse_movements",
          {
            method: "POST",
            body: JSON.stringify(body),
          }
        );
        if (Array.isArray(data)) {
          setUnfilteredMovements(data);
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
      console.error("[TransfersModal] handleSearch error:", error);
      setUnfilteredMovements([]);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado local
  const localFilterData = (arr, title, type, status) => {
    let result = [...arr];
    if (title.trim() !== "") {
      const lower = title.toLowerCase();
      result = result.filter((mov) =>
        (mov.description || "").toLowerCase().includes(lower)
      );
    }
    if (type !== "") {
      result = result.filter((mov) => mov.type === type);
    }
    if (status !== "") {
      result = result.filter(
        (mov) => (mov.status || "").toLowerCase() === status.toLowerCase()
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
        { method: "GET" }
      );
      setSelectedMovement(data);
      setMovementType(data.type || "traspaso");
      setCurrentView("form");
    } catch (error) {
      console.error("Error al obtener detalles del movimiento:", error);
      alert("No se pudo cargar el detalle del movimiento");
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
    setCurrentView("selectType");
  };

  const handleDeleteTransfer = () => {
    if (selectedMovements.length === 0) {
      alert("No hay movimientos seleccionados para eliminar.");
      return;
    }
    alert(`Eliminar ${selectedMovements.length} movimientos (pendiente).`);
  };

  const selectMovementType = (newType) => {
    setMovementType(newType);
    setSelectedMovement(null);
    setCurrentView("form");
  };

  const handleFormSave = () => {
    handleRefresh();
    setCurrentView("list");
  };

  const exportPdf = () => {
    import("jspdf").then(({ default: JsPDF }) => {
      import("jspdf-autotable").then(() => {
        const doc = new JsPDF("p", "pt");
        const head = [["ID", "Fecha", "Título", "Tipo", "Estado"]];
        const body = selectedMovements.map((mov) => [
          mov.id_warehouse_movement,
          mov.date_add,
          mov.description,
          mov.type,
          mov.status,
        ]);
        doc.autoTable({ head, body });
        doc.save("movimientos.pdf");
      });
    });
  };

  // === Secciones de UI con prime react

  // Toolbar => parte izquierda
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label=""
          icon="pi pi-plus"
          severity="success"
          onClick={handleCreateTransfer}
        />
        <Button
          label=""
          icon="pi pi-trash"
          severity="danger"
          onClick={handleDeleteTransfer}
          disabled={selectedMovements.length === 0}
        />
        <Button label="" icon="pi pi-refresh" onClick={handleRefresh} />
      </div>
    );
  };

  // Toolbar => parte derecha
  const rightToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label=""
          icon="pi pi-file-pdf"
          className="p-button-help"
          onClick={exportPdf}
        />
        <Button
          icon={showFilters ? "pi pi-filter-slash" : "pi pi-filter"}
          onClick={() => setShowFilters((prev) => !prev)}
        />
      </div>
    );
  };

  // Render principal del "list" => la DataTable con toolbar
  const renderMovementList = () => {
    const disableById = filterId.trim() !== "";
    const disableByDate = !!(filterDateFrom || filterDateTo);

    // Sección de Filtros
    const renderFilters = () => {
      if (!showFilters) return null;
      return (
        <div className="bg-white p-3 mb-3 border border-gray-200 rounded">
          <div className="grid grid-cols-6 gap-4">
            {/* ID */}
            <div className="relative">
              <label className="block text-sm font-semibold mb-1">
                ID Movimiento
              </label>
              <input
                type="text"
                className="border p-2 rounded w-full pr-7"
                value={filterId}
                onChange={(e) => {
                  setFilterId(e.target.value);
                  if (e.target.value.trim()) {
                    // Se rellena ID => vaciamos fecha/título/tipo/estado
                    setFilterDateFrom("");
                    setFilterDateTo("");
                    setFilterTitle("");
                    setFilterType("");
                    setFilterStatus("");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                disabled={disableByDate}
              />
              {filterId && (
                <button
                  className="absolute right-1 top-8 text-gray-500"
                  onClick={() => setFilterId("")}
                >
                  x
                </button>
              )}
            </div>

            {/* Fecha Desde */}
            <div className="relative">
              <label className="block text-sm font-semibold mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                className="border p-2 rounded w-full pr-7"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  if (e.target.value) {
                    setFilterId("");
                  }
                }}
                disabled={disableById}
              />
              {filterDateFrom && (
                <button
                  className="absolute right-1 top-8 text-gray-500"
                  onClick={() => setFilterDateFrom("")}
                >
                  x
                </button>
              )}
            </div>

            {/* Fecha Hasta */}
            <div className="relative">
              <label className="block text-sm font-semibold mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                className="border p-2 rounded w-full pr-7"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  if (e.target.value) {
                    setFilterId("");
                  }
                }}
                disabled={disableById}
              />
              {filterDateTo && (
                <button
                  className="absolute right-1 top-8 text-gray-500"
                  onClick={() => setFilterDateTo("")}
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
                  onClick={() => setFilterTitle("")}
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
                  onClick={() => setFilterType("")}
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
                  onClick={() => setFilterStatus("")}
                >
                  x
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 text-right">
            <Button label="Buscar" icon="pi pi-search" onClick={handleSearch} />
          </div>
        </div>
      );
    };

    return (
      <div>
        {/* Toolbar con los botones de crear, imprimir, eliminar, refrescar + export CSV */}
        <Toolbar
          className="mb-4"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

        {renderFilters()}
        {/* Botón para ocultar/mostrar el panel de filtros */}

        <DataTable
          ref={dt}
          value={movements}
          loading={loading}
          scrollable
          scrollHeight="540px"
          dataKey="id_warehouse_movement"
          selectionMode="multiple"
          metaKeySelection={false} // Para toggle con click normal
          selection={selectedMovements}
          onSelectionChange={(e) => setSelectedMovements(e.value)}
          paginator
          rows={12}
          rowsPerPageOptions={[12, 20, 30]}
          emptyMessage={loading ? "Cargando..." : "No hay movimientos."}
          className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
          onRowClick={(e) => handleRowClick(e.data)} // Click => toggle selection
          onRowDoubleClick={(e) => handleRowDoubleClick(e.data)} // DblClick => abrir
          // Podrías añadir un "globalFilter" si quisieras un input global
        >
          <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
          <Column
            field="id_warehouse_movement"
            header="ID"
            style={{ width: "70px" }}
            sortable
          />
          <Column
            field="date_add"
            header="Fecha creación"
            style={{ width: "150px" }}
            sortable
          />
          <Column
            field="description"
            header="Título"
            style={{ minWidth: "150px" }}
          />
          <Column
            field="type"
            header="Tipo"
            style={{ width: "100px" }}
            body={(rowData) =>
              rowData.type
                ? rowData.type.charAt(0).toUpperCase() + rowData.type.slice(1)
                : ""
            }
          />
          <Column field="status" header="Estado" style={{ width: "120px" }} />
        </DataTable>
      </div>
    );
  };

  // Vista: Seleccionar tipo de movimiento (traspaso, entrada, salida)
  const renderSelectType = () => {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">
          Selecciona el tipo de movimiento
        </h2>
        <div className="space-y-4">
          <Button
            label="Traspaso entre Tiendas"
            icon="pi pi-directions-alt"
            className="w-full"
            onClick={() => selectMovementType("traspaso")}
          />
          <Button
            label="Entrada de Mercadería"
            icon="pi pi-download"
            className="w-full p-button-success"
            onClick={() => selectMovementType("entrada")}
          />
          <Button
            label="Salida de Mercadería"
            icon="pi pi-upload"
            className="w-full p-button-danger"
            onClick={() => selectMovementType("salida")}
          />
        </div>
      </div>
    );
  };

  // Vista: Formulario de TransferForm
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
  let modalTitle = "";
  if (currentView === "list") {
    modalTitle = "Gestión de Stock";
  } else if (currentView === "selectType") {
    modalTitle = "Crear Movimiento";
  } else if (currentView === "form") {
    if (!selectedMovement) {
      const t = movementType || "traspaso";
      modalTitle = `Crear Movimiento: ${
        t === "traspaso" ? "Traspaso" : t === "entrada" ? "Entrada" : "Salida"
      }`;
    } else {
      const t = selectedMovement.type;
      if (t === "traspaso") modalTitle = "Traspaso entre tiendas";
      else if (t === "entrada") modalTitle = "Entrada de mercadería";
      else if (t === "salida") modalTitle = "Salida de mercadería";
      else modalTitle = "Movimiento";
    }
  }

  const showBackButton = currentView !== "list";

  const handleBack = () => {
    setCurrentView("list");
    setSelectedMovement(null);
    setMovementType(null);
  };

  let content = null;
  if (currentView === "list") {
    content = renderMovementList();
  } else if (currentView === "selectType") {
    content = renderSelectType();
  } else if (currentView === "form") {
    content = renderForm();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      inlineMode={inlineMode}
      title={modalTitle}
      showBackButton={showBackButton}
      onBack={handleBack}
      size="3xl"
      height="xl"
    >
      {content}
    </Modal>
  );
};

export default TransfersModal;
