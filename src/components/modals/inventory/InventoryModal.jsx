import React, { useState, useEffect, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { useApiFetch } from "../../../utils/useApiFetch";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { ConfigContext } from "../../../contexts/ConfigContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { useShopsDictionary } from "../../../hooks/useShopsDictionary";

const InventoryModal = ({ isOpen, onClose, shop }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();
  const { configData } = useContext(ConfigContext);
  const shopsDict = useShopsDictionary();
  const { shopId } = useContext(AuthContext);
  // Estado para la tienda seleccionada; iniciamos con la tienda del prop
  const [selectedShop, setSelectedShop] = useState(shop.id_shop || shopId);

  // Convertir el diccionario en un array de opciones para el Dropdown
  const shopsOptions = Object.keys(shopsDict).map((key) => ({
    id: key,
    name: shopsDict[key],
  }));

  // Se re-fetch el inventario cuando el modal se abre o cambia la tienda seleccionada
  useEffect(() => {
    if (isOpen && selectedShop) {
      const fetchInventory = async () => {
        try {
          const data = await apiFetch(`${API_BASE_URL}/get_stock_report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              license: configData.license,
              search_term: "all",
              value: "",
              id_shop: selectedShop.id || selectedShop,
            }),
          });
          let validResults = data.filter(
            (product) =>
              product.ean13_combination !== null ||
              product.ean13_combination_0 !== null
          );
          // Filter out products with specific reference_combination values
          const filteredData = validResults.filter(
            (item) =>
              ![
                "BOLSA",
                "ENVIO",
                "CAMBIO",
                "Totebag Pequeña",
                "Totebag Grande",
              ].includes(item.reference_combination)
          );
          console.log("Inventario:", filteredData);
          setInventoryData(filteredData);
        } catch (err) {
          console.error("Error obteniendo inventario:", err);
          setInventoryData([]);
        }
      };
      fetchInventory();
    }
  }, [isOpen, selectedShop, apiFetch, API_BASE_URL, configData.license]);

  // Actualizar el header con el nombre de la tienda seleccionada
  const headerText = `Inventario ${
    shopsDict[selectedShop.id] || shopsDict[selectedShop]
  }`;

  let multiSortMeta = [];
  multiSortMeta.push({ field: "reference_combination", order: 1 });
  multiSortMeta.push({ field: "combination_name", order: 2 });

  return (
    <Dialog
      visible={isOpen}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
      style={{ width: "70vw", height: "70vh", overflow: "auto" }}
      header={headerText}
    >
      {/* Selección de tienda */}
      <div className="p-field" style={{ marginBottom: "1rem" }}>
        <label htmlFor="shop-select">Selecciona la tienda:</label>
        <Dropdown
          id="shop-select"
          value={selectedShop}
          options={shopsOptions}
          onChange={(e) => setSelectedShop(e.value)}
          optionLabel="name"
          placeholder="Elige una tienda"
        />
      </div>
      <DataTable
        value={inventoryData}
        paginator
        multiSortMeta={multiSortMeta}
        sortMode="multiple"
        rows={10}
        emptyMessage="No hay datos de inventario."
      >
        <Column
          header="Referencia"
          field="reference_combination"
          sortable
          style={{
            width: "100px",
            textAlign: "center",
            padding: "1rem 0.3rem",
          }}
          alignHeader={"center"}
        />
        <Column
          header="Combinación"
          field="combination_name"
          sortable
          body={(rowData) =>
            rowData.combination_name && rowData.combination_name !== ""
              ? rowData.combination_name
              : rowData.product_name
          }
          style={{
            width: "100px",
            textAlign: "center",
            padding: "1rem 0.3rem",
          }}
          alignHeader={"center"}
        />
        <Column
          header="Cod. Barras"
          body={(rowData) =>
            rowData.ean13_combination || rowData.ean13_combination_0
          }
          style={{
            width: "100px",
            textAlign: "center",
            padding: "1rem 0.3rem",
          }}
          alignHeader={"center"}
        />
        <Column
          header="Precio"
          body={(rowData) =>
            rowData.price ? rowData.price.toFixed(2) + " €" : ""
          }
          style={{
            width: "50px",
            textAlign: "center",
            padding: "1rem 0.3rem",
          }}
          alignHeader={"center"}
        />
        <Column
          header="Cantidad"
          field="quantity"
          sortable
          style={{
            width: "50px",
            textAlign: "center",
            padding: "1rem 0.3rem",
          }}
          alignHeader={"center"}
        />
      </DataTable>
    </Dialog>
  );
};

export default InventoryModal;
