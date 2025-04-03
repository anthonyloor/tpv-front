// src/components/modals/transfers/TransfersModal.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog } from "primereact/dialog";
import TransferForm from "./TransferForm";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";

// PrimeReact
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { addLocale } from "primereact/api";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";

const TransfersModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const shopsDict = useShopsDictionary();
  const employeesDict = useEmployeesDictionary();
  const API_BASE_URL = getApiBaseUrl();

  const ShopNameCell = ({ id_shop }) => (
    <span>{shopsDict[id_shop] || id_shop}</span>
  );
  const EmployeeNameCell = ({ id_employee }) => (
    <span>{employeesDict[id_employee] || id_employee}</span>
  );

  // Definir el locale global "es" al montar el componente
  useEffect(() => {
    addLocale("es", {
      firstDayOfWeek: 1,
      showMonthAfterYear: true,
      dayNames: [
        "domingo",
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado",
      ],
      dayNamesShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
      dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"],
      monthNames: [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ],
      monthNamesShort: [
        "ene",
        "feb",
        "mar",
        "abr",
        "may",
        "jun",
        "jul",
        "ago",
        "sep",
        "oct",
        "nov",
        "dic",
      ],
      today: "Hoy",
      clear: "Borrar",
    });
  }, []);

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

  // DataTable ref
  const dt = useRef(null);

  // Opciones para Dropdown
  const typeOptions = [
    { label: "(Todos)", value: "" },
    { label: "Traspaso", value: "traspaso" },
    { label: "Entrada", value: "entrada" },
    { label: "Salida", value: "salida" },
  ];
  const statusOptions = [
    { label: "(Todos)", value: "" },
    { label: "En creacion", value: "En creacion" },
    { label: "Enviado", value: "Enviado" },
    { label: "Recibido", value: "Recibido" },
    { label: "En revision", value: "En revision" },
    { label: "Ejecutado", value: "Ejecutado" },
  ];

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
      const data = await apiFetch(`${API_BASE_URL}/get_warehouse_movements`, {
        method: "POST",
        body: JSON.stringify({}), // últimas 50
      });
      if (Array.isArray(data)) {
        // Formateamos campos de fecha
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
  }, [apiFetch, resetFilters, API_BASE_URL]);

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
        // buscar 1 movement
        const url = `${API_BASE_URL}/get_warehouse_movement?id_warehouse_movement=${encodeURIComponent(
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

        const data = await apiFetch(`${API_BASE_URL}/get_warehouse_movements`, {
          method: "POST",
          body: JSON.stringify(body),
        });
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

  // Doble click => abrir detalle
  const handleRowDoubleClick = async (movement) => {
    try {
      setLoading(true);
      const data = await apiFetch(
        `${API_BASE_URL}/get_warehouse_movement?id_warehouse_movement=${movement.id_warehouse_movement}`,
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

  // Selección multiple con single click
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

  // Botones de la toolbar
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

  // Modificar exportPdf para usar los diccionarios y mostrar nombres en vez de IDs
  const exportPdf = async () => {
    for (const mov of selectedMovements) {
      try {
        const data = await apiFetch(
          `${API_BASE_URL}/get_warehouse_movement?id_warehouse_movement=${mov.id_warehouse_movement}`,
          { method: "GET" }
        );
        const { default: JsPDF } = await import("jspdf");
        await import("jspdf-autotable");
        const doc = new JsPDF("p", "pt");

        // Utilizar los diccionarios para obtener los nombres
        const employeeName = employeesDict[data.employee] || data.employee;
        const shopOriginName =
          shopsDict[data.id_shop_origin] || data.id_shop_origin;
        const shopDestinyName =
          shopsDict[data.id_shop_destiny] || data.id_shop_destiny;

        doc.setFontSize(14);
        doc.text(
          `Movimiento ${
            data.type.charAt(0).toUpperCase() + data.type.slice(1)
          } #${data.id_warehouse_movement}`,
          40,
          40
        );
        doc.setFontSize(12);
        doc.text(`${data.description || "N/A"}`, 40, 60);
        doc.setFontSize(10);
        doc.text(`Empleado: ${employeeName}`, 40, 75);
        doc.text(`Fecha creación: ${data.date_add}`, 40, 85);
        doc.text(`Fecha ejecución: ${data.date_excute}`, 40, 95);
        doc.text(`Estado: ${data.status}`, 40, 110);

        // Construir tabla de detalles según el tipo
        let head, body;
        if (data.type === "traspaso") {
          doc.text(
            `Origen: ${shopOriginName} - Destino: ${shopDestinyName}`,
            40,
            125
          );
          head = [
            ["Producto", "Cod. Barras", "ID Control Stock", "Cant. Enviada"],
          ];
          body = (data.movement_details || []).map((detail) => [
            detail.product_name,
            detail.ean13,
            detail.id_control_stock,
            detail.sent_quantity,
          ]);
        } else if (data.type === "entrada") {
          doc.text(`Tienda: ${shopDestinyName}`, 40, 125);
          head = [
            ["Producto", "Cod. Barras", "ID Control Stock", "Cant. Recibida"],
          ];
          body = (data.movement_details || []).map((detail) => [
            detail.product_name,
            detail.ean13,
            detail.id_control_stock,
            detail.recived_quantity,
          ]);
        } else if (data.type === "salida") {
          doc.text(`Tienda: ${shopOriginName}`, 40, 125);
          head = [
            ["Producto", "Cod. Barras", "ID Control Stock", "Cant. Enviada"],
          ];
          body = (data.movement_details || []).map((detail) => [
            detail.product_name,
            detail.ean13,
            detail.id_control_stock,
            detail.sent_quantity,
          ]);
        }
        doc.autoTable({
          startY: 140,
          head,
          body,
          theme: "grid",
        });
        doc.save(`Movimiento_${data.id_warehouse_movement}.pdf`);
      } catch (error) {
        console.error(
          "Error generando PDF para el movimiento",
          mov.id_warehouse_movement,
          error
        );
      }
    }
  };

  // Toolbar => parte izquierda
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          tooltip="Crear movimiento"
          tooltipOptions={{ position: "top" }}
          icon="pi pi-plus"
          severity="success"
          onClick={handleCreateTransfer}
        />
        <Button
          tooltip="Eliminar selección"
          tooltipOptions={{ position: "top" }}
          icon="pi pi-trash"
          severity="danger"
          onClick={handleDeleteTransfer}
          disabled={selectedMovements.length === 0}
        />
        <Button
          icon="pi pi-refresh"
          tooltip="Refrescar"
          tooltipOptions={{ position: "top" }}
          onClick={handleRefresh}
        />
      </div>
    );
  };

  // Toolbar => parte derecha
  const rightToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          tooltip="Exportar PDF"
          tooltipOptions={{ position: "top" }}
          icon="pi pi-file-pdf"
          className="p-button-help"
          onClick={exportPdf}
        />
        <Button
          tooltip="Mostrar/ocultar filtros"
          tooltipOptions={{ position: "top" }}
          icon={showFilters ? "pi pi-filter-slash" : "pi pi-filter"}
          onClick={() => setShowFilters((prev) => !prev)}
        />
      </div>
    );
  };

  // Render principal del "list"
  const renderMovementList = () => {
    const disableById = filterId.trim() !== "";
    const disableByDate = !!(filterDateFrom || filterDateTo);

    const renderFilters = () => {
      if (!showFilters) return null;
      return (
        <Toolbar
          className="mb-4"
          left={
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* ID Movimiento */}
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">
                  ID Movimiento
                </label>
                <InputText
                  className="w-full rounded dark:bg-gray-700 dark:text-white"
                  value={filterId}
                  onChange={(e) => {
                    setFilterId(e.target.value);
                    if (e.target.value.trim()) {
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
              </div>
              {/* Título */}
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">
                  Título
                </label>
                <InputText
                  className="w-full rounded dark:bg-gray-700 dark:text-white"
                  value={filterTitle}
                  onChange={(e) => setFilterTitle(e.target.value)}
                  disabled={disableById}
                />
              </div>
              {/* Fecha Desde */}
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">
                  Fecha Desde
                </label>
                <Calendar
                  className="w-full rounded dark:bg-gray-700 dark:text-white"
                  value={filterDateFrom}
                  onChange={(e) => {
                    setFilterDateFrom(e.value);
                    if (e.value) setFilterId("");
                  }}
                  dateFormat="dd-mm-yy"
                  showIcon
                  disabled={disableById}
                  locale="es"
                />
              </div>
              {/* Fecha Hasta */}
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">
                  Fecha Hasta
                </label>
                <Calendar
                  className="w-full rounded dark:bg-gray-700 dark:text-white"
                  value={filterDateTo}
                  onChange={(e) => {
                    setFilterDateTo(e.value);
                    if (e.value) setFilterId("");
                  }}
                  dateFormat="dd-mm-yy"
                  showIcon
                  disabled={disableById}
                  locale="es"
                />
              </div>
              {/* Tipo */}
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">Tipo</label>
                <Dropdown
                  className="w-full rounded dark:bg-gray-700 dark:text-white"
                  value={filterType}
                  style={{ minWidth: "250px" }}
                  options={typeOptions}
                  onChange={(e) => setFilterType(e.value)}
                  disabled={disableById}
                />
              </div>
              {/* Estado */}
              <div className="relative">
                <label className="block text-sm font-semibold mb-1">
                  Estado
                </label>
                <Dropdown
                  className="w-full rounded dark:bg-gray-700 dark:text-white"
                  value={filterStatus}
                  style={{ minWidth: "250px" }}
                  options={statusOptions}
                  onChange={(e) => setFilterStatus(e.value)}
                  disabled={disableById}
                />
              </div>
            </div>
          }
          right={
            <div className="flex gap-2">
              <Button
                label="Filtrar"
                icon="pi pi-search"
                onClick={handleSearch}
              />
              <Button
                label="Limpiar filtros"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={() => {
                  resetFilters();
                  handleSearch();
                }}
              />
            </div>
          }
        />
      );
    };

    return (
      <div>
        <Toolbar
          className="mb-4"
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
        />

        {renderFilters()}

        <DataTable
          ref={dt}
          value={movements}
          loading={loading}
          scrollable
          scrollHeight="650px"
          dataKey="id_warehouse_movement"
          selectionMode="multiple"
          metaKeySelection={false}
          selection={selectedMovements}
          onSelectionChange={(e) => setSelectedMovements(e.value)}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 15, 30]}
          emptyMessage={loading ? "Cargando..." : "No hay movimientos."}
          className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
          onRowClick={(e) => handleRowClick(e.data)}
          onRowDoubleClick={(e) => handleRowDoubleClick(e.data)}
        >
          <Column selectionMode="multiple" headerStyle={{ width: "1px" }} />
          <Column
            field="id_warehouse_movement"
            header="ID"
            style={{ width: "25px", textAlign: "center" }}
          />
          <Column
            field="date_add"
            header="Fecha"
            style={{ width: "125px", textAlign: "center" }}
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
            body={(rowData) => {
              let iconClass = "";
              if (rowData.type === "traspaso") {
                iconClass = "pi pi-arrow-right-arrow-left";
              } else if (rowData.type === "entrada") {
                iconClass = "pi pi-download";
              } else if (rowData.type === "salida") {
                iconClass = "pi pi-upload";
              }
              const typeText =
                rowData.type &&
                rowData.type.charAt(0).toUpperCase() + rowData.type.slice(1);
              return (
                <div className="flex flex-col items-center">
                  <span>{typeText}</span>
                  <i className={iconClass} />
                </div>
              );
            }}
          />
          <Column
            header="Tiendas"
            style={{ width: "125px" }}
            body={(rowData) => {
              return (
                <div className="flex flex-col">
                  <span>
                    <ShopNameCell id_shop={rowData.id_shop_origin} />
                  </span>
                  <span>
                    <ShopNameCell id_shop={rowData.id_shop_destiny} />
                  </span>
                </div>
              );
            }}
          />
          <Column
            header="Empleado"
            style={{ width: "125px" }}
            body={(rowData) => (
              <EmployeeNameCell id_employee={rowData.employee} />
            )}
          />
          <Column
            field="status"
            header="Estado"
            style={{ width: "125px" }}
            body={(rowData) => {
              let statusColor = "#5ab5ff"; // Default: En creación
              switch (rowData.status) {
                case "En creacion":
                  statusColor = "#5ab5ff";
                  break;
                case "Enviado":
                  statusColor = "#f45eca";
                  break;
                case "Recibido":
                  statusColor = "#ffed00";
                  break;
                case "En revision":
                  statusColor = "#ff9100";
                  break;
                case "Ejecutado":
                  statusColor = "#50ef19";
                  break;
                default:
                  break;
              }
              return (
                <span
                  className="p-tag"
                  style={{ backgroundColor: statusColor }}
                >
                  {rowData.status}
                </span>
              );
            }}
          />
        </DataTable>
      </div>
    );
  };

  // Vista: Seleccionar tipo
  const renderSelectType = () => {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">
          Selecciona el tipo de movimiento
        </h2>
        <div className="space-y-4">
          <Button
            label="Traspaso entre Tiendas"
            icon="pi pi-arrow-right-arrow-left"
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

  // Vista: Formulario TransferForm
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

  // Título del Dialog
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

  // Cabecera personalizada del diálogo
  const dialogHeader = () => {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="w-[100px]">
          {" "}
          {/* Espacio fijo para el botón atrás */}
          {showBackButton && (
            <Button
              icon="pi pi-arrow-left"
              className="p-button-text"
              onClick={handleBack}
            />
          )}
        </div>
        <span className="font-bold text-xl flex-1 text-center">
          {modalTitle}
        </span>
        <div className="w-[100px] flex justify-end">
          <Button
            icon="pi pi-times"
            className="p-button-text"
            onClick={onClose}
          />
        </div>
      </div>
    );
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
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header={dialogHeader}
      draggable={false}
      resizable={false}
      closable={false}
      modal
      style={{
        maxWidth: "1250px",
        maxHeight: "950px",
        minWidth: "900px",
        minHeight: "700px",
        width: "45vw",
        height: "70vh",
      }}
    >
      {content}
    </Dialog>
  );
};

export default TransfersModal;
