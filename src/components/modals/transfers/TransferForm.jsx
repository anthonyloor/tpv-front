// src/components/modals/transfers/TransferForm.jsx

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { toast } from "sonner";
import ProductSearchCardForTransfer from "./ProductSearchCardForTransfer";
import { useApiFetch } from "../../utils/useApiFetch";
import { Steps } from "primereact/steps";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const TransferForm = ({ type, onSave, movementData }) => {
  const [productsToTransfer, setProductsToTransfer] = useState([]);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedOriginStore, setSelectedOriginStore] = useState(null);
  const [selectedDestinationStore, setSelectedDestinationStore] =
    useState(null);
  const [originShopName, setOriginShopName] = useState("");
  const [destinationShopName, setDestinationShopName] = useState("");
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [errorLoadingShops, setErrorLoadingShops] = useState(null);
  const { employeeId, shopId } = useContext(AuthContext);
  const [description, setDescription] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [movementStatus, setMovementStatus] = useState("En creacion");
  const [employeeIdV, setEmployeeId] = useState(null);

  const apiFetch = useApiFetch();

  const isNewMovement = !movementData;
  const currentStatus = movementData?.status || "En creacion";

  const stepItems =
    type && type.toLowerCase() === "traspaso"
      ? [
          { label: "En creacion" },
          { label: "Enviado" },
          { label: "Recibido" },
          { label: "En revision" },
          { label: "Ejecutado" },
        ]
      : [{ label: "En creacion" }, { label: "Ejecutado" }];

  const activeIndex =
    movementData && movementData.status
      ? stepItems.findIndex(
          (item) =>
            item.label.toLowerCase() === movementData.status.toLowerCase()
        )
      : 0;

  useEffect(() => {
    const loadShops = async () => {
      try {
        setIsLoadingShops(true);
        const data = await apiFetch("https://apitpv.anthonyloor.com/shops", {
          method: "GET",
        });
        const filteredData = data.filter((shop) => shop.id_shop !== 1);
        setShops(filteredData);
      } catch (error) {
        console.error("Error al cargar tiendas:", error);
        setErrorLoadingShops(error.message || "Error al cargar tiendas");
      } finally {
        setIsLoadingShops(false);
      }
    };
    loadShops();
  }, [apiFetch]);

  useEffect(() => {
    if (shops.length > 0 && selectedOriginStore) {
      const shopObj = shops.find(
        (s) => String(s.id_shop) === String(selectedOriginStore)
      );
      setOriginShopName(shopObj ? shopObj.name : "");
    } else {
      setOriginShopName("");
    }
  }, [shops, selectedOriginStore]);

  useEffect(() => {
    if (shops.length > 0 && selectedDestinationStore) {
      const shopObj = shops.find(
        (s) => String(s.id_shop) === String(selectedDestinationStore)
      );
      setDestinationShopName(shopObj ? shopObj.name : "");
    } else {
      setDestinationShopName("");
    }
  }, [shops, selectedDestinationStore]);

  useEffect(() => {
    if (isNewMovement) {
      if (shopId) {
        if (type === "salida" || type === "traspaso") {
          setSelectedOriginStore(String(shopId));
        } else if (type === "entrada") {
          setSelectedDestinationStore(String(shopId));
        }
      }
    }
  }, [isNewMovement, type, shopId]);

  useEffect(() => {
    if (movementData) {
      setDescription(movementData.description || "");
      if (movementData.id_shop_origin) {
        setSelectedOriginStore(String(movementData.id_shop_origin));
      }
      if (movementData.id_shop_destiny) {
        setSelectedDestinationStore(String(movementData.id_shop_destiny));
      }
    }
  }, [movementData]);

  useEffect(() => {
    if (isNewMovement) {
      setCreateDate(new Date().toISOString().split("T")[0]);
      setEmployeeId(employeeId);
    } else {
      if (movementData?.date_add) {
        const onlyDate = movementData.date_add.split(" ")[0];
        setCreateDate(onlyDate);
      }
      setMovementStatus(movementData?.status || "En creacion");
      setEmployeeId(movementData?.employee);

      if (Array.isArray(movementData.movement_details)) {
        const loadedProducts = movementData.movement_details.map((md) => {
          const quantity = md.sent_quantity || md.recived_quantity || 0;
          return {
            id_warehouse_movement_detail: md.id_warehouse_movement_detail,
            id_product: md.id_product,
            id_product_attribute: md.id_product_attribute,
            product_name: md.product_name,
            ean13: md.ean13 || "",
            quantity,
            stockOrigin: md.stock_origin,
          };
        });
        setProductsToTransfer(loadedProducts);
      }
    }
  }, [isNewMovement, movementData, employeeId]);

  const isSameStoreSelected =
    type === "traspaso" &&
    selectedOriginStore &&
    selectedDestinationStore &&
    selectedOriginStore === selectedDestinationStore;

  const canEditProducts =
    isNewMovement || movementStatus.toLowerCase() === "en creacion";

  const handleAddProduct = (product) => {
    if (!canEditProducts) return;

    setProductsToTransfer((prev) => {
      const maxStock = product.stockOrigin;
      if (product.quantity > maxStock) {
        toast.error("No dispones de más stock para añadir.");
        return prev;
      }

      const existing = prev.find(
        (p) => p.id_product_attribute === product.id_product_attribute
      );
      if (existing) {
        const newQty = existing.quantity + product.quantity;
        if (newQty > maxStock) {
          toast.error("No dispones de más stock para añadir.");
          return prev;
        }
        setRecentlyAddedId(product.id_product_attribute);
        return prev.map((p) =>
          p.id_product_attribute === product.id_product_attribute
            ? { ...p, quantity: newQty }
            : p
        );
      } else {
        setRecentlyAddedId(product.id_product_attribute);
        return [...prev, product];
      }
    });
  };

  const handleQuantityChange = (id_product_attribute, newQty) => {
    if (!canEditProducts) return;

    setProductsToTransfer((prev) => {
      const found = prev.find(
        (p) => p.id_product_attribute === id_product_attribute
      );
      if (!found) return prev;
      const maxStock = found.stockOrigin;

      let val = parseInt(newQty, 10) || 1;
      if (val > maxStock) {
        toast.error("No dispones de más stock para añadir.");
        return prev;
      }
      return prev.map((p) =>
        p.id_product_attribute === id_product_attribute
          ? { ...p, quantity: val }
          : p
      );
    });
  };

  const handleRemoveProduct = (id_product_attribute) => {
    if (!canEditProducts) return;
    setProductsToTransfer((prev) =>
      prev.filter((p) => p.id_product_attribute !== id_product_attribute)
    );
  };

  const buildMovementsDetails = () => {
    return productsToTransfer.map((prod) => {
      const detail = {
        id_warehouse_movement_detail: prod.id_warehouse_movement_detail || null,
        id_product: prod.id_product,
        id_product_attribute: prod.id_product_attribute,
        product_name: prod.product_name,
        ean13: prod.ean13 || "",
      };
      if (type === "entrada") {
        detail.recived_quantity = prod.quantity;
      } else {
        detail.sent_quantity = prod.quantity;
      }
      return detail;
    });
  };

  const handleSaveCreate = async () => {
    try {
      const payload = {
        description,
        type,
        employeeId,
      };
      if (type === "entrada") {
        payload.id_shop_destiny = parseInt(selectedDestinationStore, 10);
      } else if (type === "salida") {
        payload.id_shop_origin = parseInt(selectedOriginStore, 10);
      } else if (type === "traspaso") {
        payload.id_shop_origin = parseInt(selectedOriginStore, 10);
        payload.id_shop_destiny = parseInt(selectedDestinationStore, 10);
      }
      payload.movements_details = buildMovementsDetails();

      await apiFetch(
        "https://apitpv.anthonyloor.com/create_warehouse_movement",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      toast.success("Movimiento creado con éxito");
      if (onSave) onSave();
    } catch (error) {
      console.error("Error creando movimiento:", error);
      toast.error("Error al crear el movimiento");
    }
  };

  const handleUpdateMovement = async () => {
    if (!movementData?.id_warehouse_movement) return;

    const currentDate = new Date().toLocaleString();
    const payload = {
      id_warehouse_movement: movementData.id_warehouse_movement,
      description,
      status: "En creacion",
      type: movementData.type,
      id_shop_origin: movementData.id_shop_origin,
      id_shop_destiny: movementData.id_shop_destiny,
      movement_details: buildMovementsDetails(),
      modify_reason: `${currentDate} - Movimiento actualizado a En creacion \n${
        movementData.modify_reason || ""
      }`,
    };

    try {
      await apiFetch(
        "https://apitpv.anthonyloor.com/update_warehouse_movement",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      toast.success("Movimiento actualizado (En creacion).");
      if (onSave) onSave();
    } catch (error) {
      console.error("Error al actualizar movimiento:", error);
      toast.error("Error al actualizar movimiento");
    }
  };

  const handleExecuteMovement = async () => {
    if (!movementData?.id_warehouse_movement) return;

    try {
      const payload = {
        id_warehouse_movement: movementData.id_warehouse_movement,
      };
      await apiFetch(
        "https://apitpv.anthonyloor.com/execute_warehouse_movement",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      toast.success("Movimiento ejecutado con éxito.");
      if (onSave) onSave();
    } catch (error) {
      console.error("Error al ejecutar movimiento:", error);
      toast.error("Error al ejecutar movimiento");
    }
  };

  const handleUpdateMovementStatus = async (newStatus) => {
    if (!movementData?.id_warehouse_movement) return;
    const currentDate = new Date().toLocaleString();
    const payload = {
      id_warehouse_movement: movementData.id_warehouse_movement,
      description,
      status: newStatus,
      type: movementData.type,
      id_shop_origin: movementData.id_shop_origin,
      id_shop_destiny: movementData.id_shop_destiny,
      movement_details: buildMovementsDetails(),
      modify_reason: `${currentDate} - Movimiento actualizado a ${newStatus} \n${
        movementData.modify_reason || ""
      }`,
    };

    try {
      await apiFetch(
        "https://apitpv.anthonyloor.com/update_warehouse_movement",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      toast.success(`Movimiento actualizado (estado = ${newStatus}).`);
      if (onSave) onSave();
    } catch (error) {
      console.error("Error al actualizar movimiento:", error);
      toast.error("Error al actualizar movimiento");
    }
  };

  const noProducts = productsToTransfer.length === 0;
  const isSameStore = isSameStoreSelected;
  const st = currentStatus.toLowerCase();

  const renderMainButton = () => {
    if (isNewMovement) {
      return (
        <Button
          label="Guardar"
          className="w-full"
          disabled={isSameStore || noProducts}
          onClick={handleSaveCreate}
        />
      );
    }

    if (st === "en creacion") {
      if (type === "traspaso") {
        return (
          <div className="flex gap-2 w-full">
            <Button
              label="Actualizar"
              className="p-button-secondary w-1/2"
              disabled={isSameStore || noProducts}
              onClick={handleUpdateMovement}
            />
            <Button
              label="Enviar"
              className="p-button-success w-1/2"
              disabled={isSameStore || noProducts}
              onClick={() => handleUpdateMovementStatus("Enviado")}
            />
          </div>
        );
      } else if (type === "entrada" || type === "salida") {
        return (
          <div className="flex gap-2 w-full">
            <Button
              label="Actualizar"
              className="p-button-secondary w-1/2"
              disabled={noProducts}
              onClick={handleUpdateMovement}
            />
            <Button
              label="Ejecutar"
              className="p-button-primary w-1/2"
              disabled={noProducts}
              onClick={handleExecuteMovement}
            />
          </div>
        );
      }
    }

    if (st === "enviado" && type === "traspaso") {
      return (
        <Button
          label="Marcar como Recibido"
          className="w-full p-button-warning"
          onClick={() => handleUpdateMovementStatus("Recibido")}
        />
      );
    }

    if (st === "recibido" && type === "traspaso") {
      return (
        <Button
          label="Revisar"
          className="w-full p-button-help"
          onClick={() => handleUpdateMovementStatus("En revision")}
        />
      );
    }

    if (st === "en revision" && type === "traspaso") {
      return (
        <Button
          label="Ejecutar"
          className="w-full p-button-primary"
          disabled={noProducts}
          onClick={handleExecuteMovement}
        />
      );
    }

    return (
      <Button
        label="Sin acciones"
        className="w-full p-button-secondary"
        disabled
      />
    );
  };

  let formTitle = "";
  if (isNewMovement) {
    formTitle = `Crear movimiento: ${
      type === "traspaso"
        ? "Traspaso"
        : type === "entrada"
        ? "Entrada"
        : "Salida"
    }`;
  } else {
    if (type === "traspaso") {
      formTitle = "Traspaso entre tiendas";
    } else if (type === "entrada") {
      formTitle = "Entrada de mercadería";
    } else if (type === "salida") {
      formTitle = "Salida de mercadería";
    }
  }

  const canEditStores = isNewMovement;

  const shopDropdownOptions = shops.map((shop) => ({
    label: shop.name,
    value: String(shop.id_shop),
  }));

  const destinationShopDropdownOptions = shops
    .filter((s) => String(s.id_shop) !== String(selectedOriginStore))
    .map((shop) => ({
      label: shop.name,
      value: String(shop.id_shop),
    }));

  const productTableColumns = [
    { field: "product_name", header: "Producto" },
    { field: "quantity", header: "Cantidad", body: quantityBodyTemplate },
    { field: "action", header: "", body: actionBodyTemplate },
  ];

  function quantityBodyTemplate(rowData) {
    return (
      <InputNumber
        value={rowData.quantity}
        onValueChange={(e) =>
          handleQuantityChange(rowData.id_product_attribute, e.value)
        }
        min={1}
        disabled={!canEditProducts}
      />
    );
  }

  function actionBodyTemplate(rowData) {
    return (
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger"
        onClick={() => handleRemoveProduct(rowData.id_product_attribute)}
        disabled={!canEditProducts}
      />
    );
  }

  return (
    <div className="p-2">
      <div className="mb-6">
        <Steps
          model={stepItems}
          activeIndex={activeIndex}
          readOnly
          className="m-0"
        />{" "}
        {/* Quitamos margen */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 3 columnas */}
        <div>
          <label className="block text-sm font-medium mb-2">Descripción</label>
          <InputText
            placeholder="Ej: Traspaso ropa navidad"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={
              !isNewMovement && currentStatus.toLowerCase() !== "en creacion"
            }
            className="w-full"
          />
        </div>
        {type === "traspaso" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Tienda Origen
              </label>
              {isLoadingShops ? (
                <p>Cargando tiendas...</p>
              ) : errorLoadingShops ? (
                <p className="text-red-500">{errorLoadingShops}</p>
              ) : (
                <Dropdown
                  value={selectedOriginStore}
                  options={shopDropdownOptions}
                  onChange={(e) => setSelectedOriginStore(e.value)}
                  placeholder="Selecciona una tienda"
                  className="w-full"
                  disabled={!canEditStores}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Tienda Destino
              </label>
              {isLoadingShops ? (
                <p>Cargando tiendas...</p>
              ) : errorLoadingShops ? (
                <p className="text-red-500">{errorLoadingShops}</p>
              ) : (
                <Dropdown
                  value={selectedDestinationStore}
                  options={destinationShopDropdownOptions}
                  onChange={(e) => setSelectedDestinationStore(e.value)}
                  placeholder="Selecciona una tienda"
                  className="w-full"
                  disabled={!canEditStores}
                />
              )}
              {isSameStoreSelected && (
                <p className="text-red-500">
                  La tienda origen y destino no pueden ser la misma.
                </p>
              )}
            </div>
          </>
        )}
        {type === "entrada" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Tienda Destino
            </label>
            {isLoadingShops ? (
              <p>Cargando tiendas...</p>
            ) : errorLoadingShops ? (
              <p className="text-red-500">{errorLoadingShops}</p>
            ) : (
              <Dropdown
                value={selectedDestinationStore}
                options={shopDropdownOptions}
                onChange={(e) => setSelectedDestinationStore(e.value)}
                placeholder="Selecciona una tienda"
                className="w-full"
                disabled={!canEditStores}
              />
            )}
          </div>
        )}
        {type === "salida" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Tienda Origen
            </label>
            {isLoadingShops ? (
              <p>Cargando tiendas...</p>
            ) : errorLoadingShops ? (
              <p className="text-red-500">{errorLoadingShops}</p>
            ) : (
              <Dropdown
                value={selectedOriginStore}
                options={shopDropdownOptions}
                onChange={(e) => setSelectedOriginStore(e.value)}
                placeholder="Selecciona una tienda"
                className="w-full"
                disabled={!canEditStores}
              />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {" "}
        {/* Nueva fila */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Fecha Creación
          </label>
          <InputText value={createDate} readOnly className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">ID Empleado</label>
          <InputText value={employeeIdV || ""} readOnly className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Tipo Movimiento
          </label>
          <InputText value={type} readOnly className="w-full" />
        </div>
      </div>

      {(isNewMovement || currentStatus.toLowerCase() === "en creacion") && (
        <ProductSearchCardForTransfer
          onAddProduct={handleAddProduct}
          selectedOriginStore={selectedOriginStore}
          selectedDestinationStore={selectedDestinationStore}
          type={type}
          originShopName={originShopName}
          destinationShopName={destinationShopName}
        />
      )}

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">
          {type === "traspaso"
            ? "Productos a Traspasar"
            : type === "entrada"
            ? "Productos a Ingresar"
            : "Productos a Retirar"}
        </h3>
        <DataTable value={productsToTransfer} responsiveLayout="scroll">
          {productTableColumns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
            />
          ))}
        </DataTable>
      </div>

      <div className="mt-6 flex gap-4">{renderMainButton()}</div>
    </div>
  );
};

export default TransferForm;
