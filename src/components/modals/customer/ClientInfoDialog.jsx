// src/components/modals/customer/ClientInfoDialog.jsx

import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import useLastOrders from "../../../hooks/useLastOrders";

export default function ClientInfoDialog({ isOpen, onClose, client }) {
  const { getLastOrdersByCustomer } = useLastOrders();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      if (!isOpen || !client) {
        setOrders([]);
        return;
      }
      setLoading(true);
      const data = await getLastOrdersByCustomer(client.id_customer);
      setOrders(data);
      setLoading(false);
    };
    loadOrders();
  }, [isOpen, client, getLastOrdersByCustomer]);

  if (!client) {
    return null;
  }

  const fullName = `${client.firstname} ${client.lastname}`;

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      header="Información del Cliente"
      style={{ width: "50vw" }}
      modal
    >
      <div className="p-3">
        <h2 className="text-xl font-bold mb-4">{fullName}</h2>
        <p className="mb-4">ID Cliente: {client.id_customer}</p>

        <h3 className="text-lg font-semibold mb-2">Últimas Ventas</h3>
        <DataTable
          value={orders}
          emptyMessage={loading ? "" : "Sin ventas"}
          className="p-datatable-sm p-datatable-gridlines"
        >
          <Column
            field="id_order"
            header="# Ticket"
            style={{ width: "80px", textAlign: "center" }}
          />
          <Column
            field="date_add"
            header="Fecha"
            style={{ width: "170px", textAlign: "center" }}
          />
          <Column
            field="total_paid"
            header="Total (€)"
            body={(row) => (row.total_paid ? row.total_paid.toFixed(2) : "-")}
            style={{ width: "100px", textAlign: "center" }}
          />
        </DataTable>
      </div>
    </Dialog>
  );
}

