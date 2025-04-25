// src/components/modals/transfers/TransfersModal.jsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { Dialog } from "primereact/dialog";
import TransferForm from "./TransferForm";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { AuthContext } from "../../../contexts/AuthContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { SplitButton } from "primereact/splitbutton";
import { addLocale, FilterMatchMode } from "primereact/api";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";
import { ProgressSpinner } from "primereact/progressspinner";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";

// Definir filtros iniciales para global y para cada columna
const initialFilters = {
  id_warehouse_movement: { value: null, matchMode: FilterMatchMode.EQUALS },
  date_add: { value: null, matchMode: FilterMatchMode.CONTAINS },
  description: { value: null, matchMode: FilterMatchMode.CONTAINS },
  type: { value: null, matchMode: FilterMatchMode.CONTAINS },
  shops: { value: null, matchMode: FilterMatchMode.CONTAINS },
  employee: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status: { value: null, matchMode: FilterMatchMode.CONTAINS },
};

const TransfersModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const shopsDict = useShopsDictionary();
  const employeesDict = useEmployeesDictionary();
  const API_BASE_URL = getApiBaseUrl();
  const toast = useRef(null);
  const { idProfile, shopId } = useContext(AuthContext);
  const EmployeeNameCell = ({ id_employee }) => (
    <span>{employeesDict[id_employee] || id_employee}</span>
  );
  const splitButtonContainerRef = useRef(null);
  const formRef = useRef(null);
  const [footerContent, setFooterContent] = useState(null);

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

  // Vistas => 'list', 'form'
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

  // Filtros avanzados
  const [filters, setFilters] = useState(initialFilters);
  // Para mostrar/ocultar contenedor de filtros
  const [showFilters, setShowFilters] = useState(true);

  // DataTable ref
  const dt = useRef(null);

  // Nuevo estado para el loading del formulario
  const [formLoading, setFormLoading] = useState(false);

  // Reset filtros
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
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
        body: JSON.stringify({}),
      });
      if (Array.isArray(data)) {
        const filteredData =
          idProfile === 1
            ? data
            : data.filter(
                (mov) =>
                  Number(mov.id_shop_origin) === Number(shopId) ||
                  Number(mov.id_shop_destiny) === Number(shopId)
              );
        const formattedData = filteredData.map((mov) => ({
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
  }, [apiFetch, resetFilters, API_BASE_URL, idProfile, shopId]);

  useEffect(() => {
    if (isOpen) {
      setCurrentView("list");
      handleRefresh();
    }
  }, [isOpen, handleRefresh]);

  // Crear el arreglo de acciones para el SplitButton
  const createMovementItems = [
    {
      label: "Traspaso",
      icon: "pi pi-arrow-right-arrow-left",
      command: () => {
        selectMovementType("traspaso");
      },
    },
    {
      label: "Entrada",
      icon: "pi pi-download",
      command: () => {
        selectMovementType("entrada");
      },
    },
    {
      label: "Salida",
      icon: "pi pi-upload",
      command: () => {
        selectMovementType("salida");
      },
    },
  ];

  // Header con buscador global y botón Clear
  const renderHeader = () => {
    return (
      <div className="flex justify-content-between items-center">
        <div className="flex flex-wrap gap-2">
          <div ref={splitButtonContainerRef}>
            <SplitButton
              model={createMovementItems}
              label="Crear"
              onClick={(e) => {
                if (splitButtonContainerRef.current) {
                  const menuButton =
                    splitButtonContainerRef.current.querySelector(
                      ".p-splitbutton-menubutton"
                    );
                  if (menuButton) {
                    menuButton.click();
                  }
                }
              }}
            />
          </div>
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
        <div className="flex flex-wrap gap-2">
          <Button
            tooltip="Exportar PDF"
            tooltipOptions={{ position: "top" }}
            icon="pi pi-file-pdf"
            className="p-button-help"
            onClick={exportPdf}
            disabled={selectedMovements.length === 0}
          />
          <Button
            tooltip="Mostrar/Ocultar filtros"
            tooltipOptions={{ position: "top" }}
            icon={showFilters ? "pi pi-filter-slash" : "pi pi-filter"}
            onClick={() => setShowFilters((prev) => !prev)}
          />
        </div>
      </div>
    );
  };

  // Doble click => abrir detalle
  const handleRowDoubleClick = async (movement) => {
    try {
      setLoading(true);
      const data = await apiFetch(
        `${API_BASE_URL}/get_warehouse_movement?id_warehouse_movement=${movement.id_warehouse_movement}`,
        { method: "GET" }
      );
      if (
        idProfile !== 1 &&
        !(
          Number(data.id_shop_origin) === Number(shopId) ||
          Number(data.id_shop_destiny) === Number(shopId)
        )
      ) {
        toast.current.show({
          severity: "error",
          summary: "Acceso denegado",
          detail: "No tiene acceso a este movimiento.",
        });
        return;
      }
      setSelectedMovement(data);
      setMovementType(data.type || "traspaso");
      setCurrentView("form");
    } catch (error) {
      console.error("Error al obtener detalles del movimiento:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo cargar el detalle del movimiento",
      });
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

  const handleDeleteTransfer = () => {
    if (selectedMovements.length === 0) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No hay movimientos seleccionados para eliminar.",
      });
      return;
    }
    confirmDialog({
      message: `¿Seguro que desea borrar ${selectedMovements.length} movimiento(s)?`,
      header: "Confirmación de eliminación",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sí",
      acceptClassName: "p-button-danger",
      rejectClassName: "p-button-secondary",
      rejectLabel: "No",
      accept: async () => {
        try {
          for (const movement of selectedMovements) {
            await apiFetch(`${API_BASE_URL}/delete_warehouse_movement`, {
              method: "POST",
              body: JSON.stringify({
                id_warehouse_movement: movement.id_warehouse_movement,
              }),
            });
          }
          toast.current.show({
            severity: "success",
            summary: "Éxito",
            detail: "Movimiento(s) borrado(s) con éxito.",
          });
          setSelectedMovements([]);
          handleRefresh();
        } catch (error) {
          console.error("Error al borrar movimiento:", error);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Error al borrar movimiento(s).",
          });
        }
      },
      reject: () => {
        // No se realiza acción si se rechaza la confirmación
      },
    });
  };

  const selectMovementType = (newType) => {
    setMovementType(newType);
    setSelectedMovement(null);
    setCurrentView("form");
  };

  const handleFormSave = async (action) => {
    if (action === "created" || action === "executed") {
      // Para creación o ejecución: cerrar modal y refrescar lista
      setCurrentView("list");
      setSelectedMovement(null);
      setMovementType(null);
      handleRefresh();
    } else if (action === "updated") {
      // Para actualización: refrescar detalle sin cerrar formulario
      if (selectedMovement && selectedMovement.id_warehouse_movement) {
        setFormLoading(true);
        try {
          const url = `${API_BASE_URL}/get_warehouse_movement?id_warehouse_movement=${selectedMovement.id_warehouse_movement}`;
          const data = await apiFetch(url, { method: "GET" });
          // Filtrar localmente según tienda actual
          if (
            idProfile !== 1 &&
            !(
              Number(data.id_shop_origin) === Number(shopId) ||
              Number(data.id_shop_destiny) === Number(shopId)
            )
          ) {
            toast.current.show({
              severity: "error",
              summary: "Acceso denegado",
              detail: "No tiene acceso a este movimiento.",
            });
            return;
          }
          setSelectedMovement(data);
        } catch (error) {
          console.error("Error al actualizar detalle del movimiento:", error);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Error al actualizar el movimiento",
          });
        } finally {
          setFormLoading(false);
        }
      }
    }
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
          head = [["Producto", "Cod. Barras", "Seguimiento", "Cant. Enviada"]];
          body = (data.movement_details || []).map((detail) => [
            detail.product_name,
            detail.ean13,
            detail.id_control_stock,
            detail.sent_quantity,
          ]);
        } else if (data.type === "entrada") {
          doc.text(`Tienda: ${shopDestinyName}`, 40, 125);
          head = [["Producto", "Cod. Barras", "Seguimiento", "Cant. Recibida"]];
          body = (data.movement_details || []).map((detail) => [
            detail.product_name,
            detail.ean13,
            detail.id_control_stock,
            detail.recived_quantity,
          ]);
        } else if (data.type === "salida") {
          doc.text(`Tienda: ${shopOriginName}`, 40, 125);
          head = [["Producto", "Cod. Barras", "Seguimiento", "Cant. Enviada"]];
          body = (data.movement_details || []).map((detail) => [
            detail.product_name,
            detail.ean13,
            detail.id_control_stock,
            detail.sent_quantity,
          ]);
        }
        // Calcular la suma total de la cantidad
        const totalQuantity = body.reduce(
          (sum, row) => sum + (Number(row[3]) || 0),
          0
        );
        doc.autoTable({
          startY: 140,
          head,
          body,
          foot: [
            [
              {
                content: "Total Productos:",
                colSpan: 3,
                styles: { halign: "right" },
              },
              totalQuantity,
            ],
          ],
          showFoot: "lastPage",
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

  // Render principal del "list"
  const renderMovementList = () => {
    // Crear campo "shops" concatenando el nombre de ambas tiendas
    const augmentedMovements = movements.map((m) => ({
      ...m,
      shops: `${shopsDict[m.id_shop_origin] || m.id_shop_origin}\n${
        shopsDict[m.id_shop_destiny] || m.id_shop_destiny
      }`,
    }));

    const header = renderHeader();

    return (
      <div>
        <DataTable
          ref={dt}
          value={augmentedMovements}
          loading={loading}
          scrollable
          dataKey="id_warehouse_movement"
          selectionMode="multiple"
          metaKeySelection={false}
          selection={selectedMovements}
          paginator
          rows={8}
          rowsPerPageOptions={[8, 15, 30]}
          emptyMessage={loading ? "Cargando..." : "No hay movimientos."}
          className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
          onRowClick={(e) => handleRowClick(e.data)}
          onRowDoubleClick={(e) => handleRowDoubleClick(e.data)}
          filterDisplay={showFilters ? "row" : undefined}
          filters={filters}
          onFilter={(e) => setFilters(e.filters)}
          header={header}
        >
          <Column
            selectionMode="multiple"
            style={{ width: "1px", height: "55px", textAlign: "center" }}
          />
          <Column
            field="id_warehouse_movement"
            header="ID"
            filter={showFilters}
            filterMatchMode="contains"
            showFilterMenu={false}
            style={{ width: "100px", textAlign: "center" }}
            alignHeader={"center"}
          />
          <Column
            field="date_add"
            header="Fecha creación"
            filter={showFilters}
            filterMatchMode="contains"
            showFilterMenu={false}
            style={{ width: "150px", textAlign: "center" }}
            alignHeader={"center"}
          />
          <Column
            field="description"
            header="Título"
            filter={showFilters}
            filterMatchMode="contains"
            showFilterMenu={false}
            style={{ width: "325px" }}
          />
          <Column
            field="type"
            header="Tipo"
            filter={showFilters}
            filterMatchMode="contains"
            showFilterMenu={false}
            style={{ width: "100px" }}
            alignHeader={"center"}
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
            field="total_quantity"
            header="Total Prod."
            filter={showFilters}
            filterMatchMode="contains"
            showFilterMenu={false}
            style={{ width: "50px", textAlign: "center" }}
            alignHeader={"center"}
          />
          <Column
            field="shops"
            header="Tiendas"
            filter={showFilters}
            filterMatchMode="contains"
            showFilterMenu={false}
            style={{ width: "125px", textAlign: "center" }}
            alignHeader={"center"}
            body={(rowData) => {
              return (
                <div className="flex flex-col">
                  <span>
                    {shopsDict[rowData.id_shop_origin] ||
                      rowData.id_shop_origin}
                  </span>
                  <span>
                    {shopsDict[rowData.id_shop_destiny] ||
                      rowData.id_shop_destiny}
                  </span>
                </div>
              );
            }}
          />
          <Column
            field="employee"
            header="Empleado"
            filter={showFilters}
            filterMatchMode="contains"
            showFilterMenu={false}
            style={{ width: "125px", textAlign: "center" }}
            alignHeader={"center"}
            body={(rowData) => (
              <EmployeeNameCell id_employee={rowData.employee} />
            )}
          />
          <Column
            field="status"
            header="Estado"
            filter={showFilters}
            filterMatchMode="contains"
            showFilterMenu={false}
            style={{ width: "100px", textAlign: "center" }}
            alignHeader={"center"}
            body={(rowData) => {
              let statusColor = "#5ab5ff"; // Default: En creacion
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

  // Vista: Formulario TransferForm
  const renderForm = () => {
    return (
      <div>
        {formLoading ? (
          <ProgressSpinner />
        ) : (
          <TransferForm
            ref={formRef}
            movementData={selectedMovement}
            type={movementType}
            onSave={handleFormSave}
            hideFooter={true}
            onFooterChange={(footer) => setFooterContent(footer)}
          />
        )}
      </div>
    );
  };

  // Título del Dialog
  let modalTitle = "";
  if (currentView === "list") {
    modalTitle = "Gestión de Stock";
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
  } else if (currentView === "form") {
    content = renderForm();
  }

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={isOpen}
        onHide={onClose}
        header={dialogHeader}
        draggable={false}
        resizable={false}
        closable={false}
        modal
        footer={currentView === "form" ? footerContent : null}
        style={{
          maxWidth: "70vw",
          maxHeight: "85vh",
          width: "65vw",
          height: "80vh",
        }}
      >
        {content}
      </Dialog>
      <ConfirmDialog />{" "}
    </>
  );
};

export default TransfersModal;
