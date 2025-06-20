import React, { useState, useEffect, useRef } from "react";
import useToggle from "../../../hooks/useToggle";
import useAddresses from "../../../hooks/useAddresses";
import { Dialog } from "primereact/dialog";
import { Steps } from "primereact/steps";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import CreateCustomerModal from "./CreateCustomerModal";
import CreateAddressModal from "./CreateAddressModal";
import { useApiFetch } from "../../../utils/useApiFetch";
import { Toast } from "primereact/toast";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";

export default function CustomerStepperModal({
  isOpen,
  onClose,
  onSelectClientAndAddress,
  widthPercent = "50%",
  heightPercent = "71%",
}) {
  const [activeIndex, setActiveIndex] = useState(0); // 0 => Cliente, 1 => Dirección
  const toast = useRef(null);
  const apiFetch = useApiFetch();

  // Listas de datos
  const [clients, setClients] = useState([]);
  const [addresses, setAddresses] = useState([]);

  // Selecciones
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Dirección de “tienda” (opcional)
  const [storeAddress, setStoreAddress] = useState(null);

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Control refs
  const dt = useRef(null);

  // Para abrir/cerrar modales “crear”
  const showCreateCustomerModal = useToggle();
  const showCreateAddressModal = useToggle();

  const API_BASE_URL = getApiBaseUrl();

  // Al abrir este wizard
  useEffect(() => {
    if (isOpen) {
      resetStepper();
      fetchAllClients();
    }
  }, [isOpen]);

  const resetStepper = () => {
    setActiveIndex(0);
    setSearchTerm("");
    setSelectedRow(null);
    setSelectedClient(null);
    setAddresses([]);
    setStoreAddress(null);
    setErrorMessage("");
  };

  // ================== FECTHS ==================
  const fetchAllClients = () => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/get_all_customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener clientes");
        return res.json();
      })
      .then((data) => {
        setClients(data);
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("No se pudieron cargar los clientes.");
      });
  };

  const fetchFilteredClients = async (filter) => {
    try {
      const data = await apiFetch(`${API_BASE_URL}/get_customers_filtered`, {
        method: "POST",
        body: JSON.stringify({ filter, origin: "mayret" }),
      });
      setClients(data);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      if (
        (error.status && error.status === 404) ||
        (error instanceof SyntaxError &&
          error.message.includes("Unexpected token"))
      ) {
        setClients([]);
        setErrorMessage("");
      } else {
        setErrorMessage("Error al buscar clientes.");
        setClients([]);
      }
    }
  };

  const { getAddresses } = useAddresses();

  const fetchAddressesForClient = async (client) => {
    const data = await getAddresses(client.id_customer, client.origin);
    setAddresses(data);
  };

  const stepsItems = [
    { label: "Seleccionar Cliente" },
    { label: "Seleccionar Dirección" },
  ];

  const renderCustomHeader = () => (
    <div className="flex justify-between items-center">
      {/* Botón “Atrás” en el step de direcciones */}
      {activeIndex === 1 && (
        <Button
          icon="pi pi-arrow-left"
          className="p-button-text p-button-sm mr-2"
          onClick={() => setActiveIndex(0)}
          tooltip="Atrás"
          tooltipOptions={{ position: "bottom" }}
        />
      )}
      {/* La “X” la genera PrimeReact automáticamente a la derecha */}
    </div>
  );

  const onClientDoubleClick = (cli) => {
    setSelectedRow(cli);
    setSelectedClient(cli);
    fetchAddressesForClient(cli);
    setActiveIndex(1);
  };

  const renderStepClient = () => (
    <div className="p-4">
      {/* Toolbar: Crear/Editar/Eliminar + Refrescar */}
      <Toolbar
        left={
          <div className="flex items-center gap-2">
            <Button
              icon="pi pi-user-plus"
              severity="success"
              tooltip="Crear Cliente"
              tooltipOptions={{ position: "bottom" }}
              onClick={showCreateCustomerModal.open}
            />
            <Button
              icon="pi pi-pencil"
              tooltip="Editar Cliente"
              tooltipOptions={{ position: "bottom" }}
              disabled={!selectedRow}
              onClick={() => {
                if (selectedRow) alert(`Editar ID: ${selectedRow.id_customer}`);
              }}
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              tooltip="Eliminar Cliente"
              tooltipOptions={{ position: "bottom" }}
              disabled={!selectedRow}
              onClick={() => {
                if (selectedRow)
                  alert(`Eliminar ID: ${selectedRow.id_customer}`);
              }}
            />
          </div>
        }
        right={
          <Button
            icon="pi pi-refresh"
            tooltip="Refrescar"
            tooltipOptions={{ position: "bottom" }}
            onClick={() => {
              setSearchTerm("");
              fetchAllClients();
              setSelectedRow(null);
            }}
          />
        }
        className="mb-3"
      />

      {/* Campo Buscar */}
      <div className="mb-3">
        <span className="p-input-icon-left w-full">
          <div className="p-input-icon-left">
            <i className="pi pi-search absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none" />
          </div>
          <InputText
            placeholder="Buscar cliente..."
            className="w-full pl-9 pr-9"
            value={searchTerm}
            onChange={(e) => {
              const val = e.target.value;
              setSearchTerm(val);
              if (!val.trim()) {
                fetchAllClients();
              } else if (val.length >= 3) {
                fetchFilteredClients(val);
              }
            }}
          />
        </span>
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm mb-2">{errorMessage}</p>
      )}

      <DataTable
        ref={dt}
        value={clients}
        dataKey="id_customer"
        selectionMode="single"
        selection={selectedRow}
        onSelectionChange={(e) => setSelectedRow(e.value)}
        onRowDoubleClick={(e) => onClientDoubleClick(e.data)}
        scrollable
        scrollHeight="450px"
        paginator
        rows={10}
        rowsPerPageOptions={[10, 20, 30]}
        emptyMessage="Sin resultados"
        className="p-datatable-sm p-datatable-striped p-datatable-gridlines"
      >
        <Column field="id_customer" header="ID" style={{ width: "60px" }} />
        <Column
          field="date_add"
          header="Fecha"
          style={{ width: "125px", textAlign: "center" }}
        />
        <Column field="firstname" header="Nombre" />
        <Column field="lastname" header="Apellidos" />
        <Column field="phone" header="Teléfono" />
        <Column field="email" header="Correo" />
        <Column field="origin" header="Origen" style={{ width: "120px" }} />
      </DataTable>
    </div>
  );

  const handleSelectAddress = (addr) => {
    if (!selectedClient) return;
    onSelectClientAndAddress?.(selectedClient, addr);
    onClose?.();
  };

  const renderStepAddress = () => (
    <div className="p-4">
      {/* Botón “Crear Dirección” */}
      {selectedClient && (
        <div className="mb-3 flex justify-end">
          <Button
            label="Nueva Dirección"
            icon="pi pi-plus"
            onClick={showCreateAddressModal.open}
          />
        </div>
      )}

      <div className="grid gap-3">
        {/* Dirección de tienda */}
        {storeAddress && (
          <Card
            title={storeAddress.alias}
            subTitle={storeAddress.address1}
            style={{ cursor: "pointer" }}
            className="mb-2"
            onClick={() => handleSelectAddress(storeAddress)}
          >
            <p className="m-0">
              {storeAddress.postcode} {storeAddress.city}
            </p>
            <p className="m-0">{storeAddress.phone}</p>
          </Card>
        )}
        {/* Resto de direcciones */}
        {addresses.map((addr) => (
          <Card
            key={addr.id_address}
            title={addr.alias}
            subTitle={`${addr.address1} ${addr.address2 || ""}`}
            style={{ cursor: "pointer" }}
            className="mb-2"
            onClick={() => handleSelectAddress(addr)}
          >
            <p className="m-0">
              {addr.postcode} {addr.city}
            </p>
            <p className="m-0">{addr.phone}</p>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (activeIndex === 0) return renderStepClient();
    return renderStepAddress();
  };

  const handleHideDialog = () => {
    onClose?.();
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={isOpen}
        onHide={handleHideDialog}
        header={renderCustomHeader()}
        draggable={false}
        resizable={false}
        closable={true}
        modal
        style={{
          width: widthPercent,
          height: heightPercent,
          minWidth: "1000px",
          minHeight: "750px",
        }}
      >
        <Steps
          model={stepsItems}
          activeIndex={activeIndex}
          onSelect={(e) => setActiveIndex(e.index)}
        />
        <div className="mt-4">{renderCurrentStep()}</div>
      </Dialog>

      {showCreateCustomerModal.isOpen && (
        <CreateCustomerModal
          isOpen
          onClose={showCreateCustomerModal.close}
          onComplete={(newClient, newAddr) => {
            // Asigna el cliente y la dirección en curso
            setSelectedClient({ ...newClient });
            if (newAddr) {
              // Puedes guardarlo en un estado si se requiere
              setStoreAddress(newAddr);
            }
            // Muestra las toas de PrimeReact indicando que fueron creados
            toast.current.show({
              severity: "success",
              summary: "Éxito",
              detail: "Cliente creado",
              life: 3000,
            });
            if (newAddr) {
              toast.current.show({
                severity: "success",
                summary: "Éxito",
                detail: "Dirección creada",
                life: 3000,
              });
            }
            // Llama al callback para notificar al componente padre y cierra el modal
            onSelectClientAndAddress(newClient, newAddr);
            onClose();
            showCreateCustomerModal.close();
            // Recarga la tabla de clientes (si es necesario)
            fetchAllClients();
          }}
        />
      )}

      {showCreateAddressModal.isOpen && (
        <CreateAddressModal
          isOpen
          onClose={showCreateAddressModal.close}
          clientId={selectedClient?.id_customer}
          firstname={selectedClient?.firstname}
          lastname={selectedClient?.lastname}
          onAddressCreated={(newAddr) => {
            showCreateAddressModal.close();
            // Recargamos direcciones
            if (selectedClient) fetchAddressesForClient(selectedClient);
          }}
        />
      )}
    </>
  );
}
