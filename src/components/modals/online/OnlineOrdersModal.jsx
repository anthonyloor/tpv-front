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

const OnlineOrdersModal = ({
  isOpen,
  onClose,
  widthPercent = "50%",
  heightPercent = "60%",
}) => {
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
        width: widthPercent,
        height: heightPercent,
        minWidth: "800px",
        minHeight: "500px",
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
          emptyMessage="No hay órdenes para mostrar."
          paginator
          rows={10}
        >
          <Column field="id_order" header="# Ticket" />
          <Column field="date_add" header="Fecha" />
          <Column field="id_shop" header="Tienda" body={() => "Online"} />
          <Column
            header="Empleado"
            body={(row) => <EmployeeNameCell id_employee={row.id_employee} />}
          />
          <Column field="payment" header="Forma de pago" />
          <Column
            field="total_paid"
            header="Total (€)"
            body={(data) => Number(data.total_paid)?.toFixed(2)}
            style={{ textAlign: "right" }}
          />
          <Column field="origin" header="Origen" />
        </DataTable>
      </div>
    </Dialog>
  );
};

export default OnlineOrdersModal;
