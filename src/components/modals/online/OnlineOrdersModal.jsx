import React, { useState, useEffect, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useApiFetch } from "../../utils/useApiFetch";
import { AuthContext } from "../../../contexts/AuthContext";
import { toast } from "sonner";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";

const OnlineOrdersModal = ({ isOpen, onClose }) => {
  const apiFetch = useApiFetch();
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { shopId } = useContext(AuthContext);

  // Obtención una sola vez de los diccionarios
  const shopsDict = useShopsDictionary();
  const employeesDict = useEmployeesDictionary();

  const ShopNameCell = ({ id_shop }) => (
    <span>{shopsDict[id_shop] || id_shop}</span>
  );
  const EmployeeNameCell = ({ id_employee }) => (
    <span>{employeesDict[id_employee] || id_employee}</span>
  );

  // Función para formatear fecha => dd-mm-yyyy hh:mm
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return dateString; // Si no es fecha válida, devuelves la cadena original

    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = dateObj.getFullYear();

    const hh = String(dateObj.getHours()).padStart(2, "0");
    const min = String(dateObj.getMinutes()).padStart(2, "0");

    return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
  };

  useEffect(() => {
    if (isOpen) {
      loadOnlineOrders();
      setSearchedOrder(null);
      setSearchOrderId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadOnlineOrders = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch(
        "https://apitpv.anthonyloor.com/get_shop_orders",
        {
          method: "POST",
          body: JSON.stringify({ origin: "all", id_shop: 1 }),
        }
      );
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar las órdenes online.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchOrder = async () => {
    if (!searchOrderId.trim()) return;
    try {
      setIsLoading(true);
      const data = await apiFetch(
        `https://apitpv.anthonyloor.com/get_order?id_order=${encodeURIComponent(
          searchOrderId.trim()
        )}`,
        { method: "GET" }
      );
      if (data) {
        setSearchedOrder(data);
      } else {
        toast.error("No se encontró el pedido.");
      }
    } catch (error) {
      toast.error("Error al buscar el pedido.");
    } finally {
      setIsLoading(false);
    }
  };

  const ordersToDisplay = searchedOrder ? [searchedOrder] : orders;

  return (
    <Dialog
      header="Pedidos Online"
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{
        width: "50vw",
        height: "65vh",
        minWidth: "850px",
        minHeight: "650px",
      }}
    >
      <div className="p-3">
        {/* Sección de búsqueda */}
        <div className="flex gap-2 mb-3">
          <InputText
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchOrder();
            }}
            placeholder="Número de pedido"
            className="flex-1"
          />
          <Button
            label="Buscar"
            onClick={handleSearchOrder}
            disabled={isLoading || !searchOrderId.trim()}
          />
        </div>
        {/* DataTable con órdenes */}
        <DataTable
          value={ordersToDisplay}
          loading={isLoading}
          emptyMessage="No hay pedidos para mostrar."
          paginator
          rows={10}
        >
          <Column
            field="id_order"
            header="# Pedido"
            style={{ width: "5px", textAlign: "center" }}
          />
          <Column
            header="Fecha"
            body={(row) => formatDate(row.date_add)}
            style={{ width: "130px", textAlign: "center" }}
          />
          <Column
            header="ID Cliente"
            field="id_customer"
            style={{ width: "5px", textAlign: "center" }}
          />
          <Column
            header="ID Dirección"
            field="id_address_delivery"
            style={{ width: "5px", textAlign: "center" }}
          />
          <Column
            field="payment"
            header="Forma de pago"
            style={{ width: "100px", textAlign: "center" }}
          />
          <Column
            field="total_paid"
            header="Total (€)"
            body={(data) => Number(data.total_paid)?.toFixed(2)}
            style={{ width: "50px", textAlign: "center" }}
          />
          <Column
            field="current_state"
            header="Estado"
            style={{ width: "5px", textAlign: "center" }}
          />
          <Column
            field="origin"
            header="Origen"
            body={(row) => {
              const color =
                row.origin === "mayret" ? "bg-blue-500" : "bg-green-500";
              return (
                <span className={`text-white py-1 px-2 rounded ${color}`}>
                  {row.origin}
                </span>
              );
            }}
            style={{ width: "5px", textAlign: "center" }}
          />
        </DataTable>
      </div>
    </Dialog>
  );
};

export default OnlineOrdersModal;
