// src/components/modals/transfers/TransferForm.jsx

import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { toast } from "sonner";
import ProductSearchCardForTransfer from "./ProductSearchCardForTransfer";
import { useApiFetch } from "../../utils/useApiFetch";
import { Steps } from "primereact/steps";

const TransferForm = ({ type, onSave, movementData }) => {
  const [productsToTransfer, setProductsToTransfer] = useState([]);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedOriginStore, setSelectedOriginStore] = useState("");
  const [selectedDestinationStore, setSelectedDestinationStore] = useState("");
  const [originShopName, setOriginShopName] = useState("");
  const [destinationShopName, setDestinationShopName] = useState("");
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [errorLoadingShops, setErrorLoadingShops] = useState(null);
  const { employeeId, shopId } = useContext(AuthContext);
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

  // Calcular activeIndex usando el status del movimiento, se asume que movementData.status existe
  const activeIndex =
    movementData && movementData.status
      ? stepItems.findIndex(
          (item) =>
            item.label.toLowerCase() === movementData.status.toLowerCase()
        )
      : 0;

  // Datos del movimiento
  const [description, setDescription] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [movementStatus, setMovementStatus] = useState("En creacion");
  const [employeeIdV, setEmployeeId] = useState(null);

  const apiFetch = useApiFetch();

  const isNewMovement = !movementData;
  const currentStatus = movementData?.status || "En creacion";

  // 1) Carga de tiendas
  useEffect(() => {
    const loadShops = async () => {
      try {
        setIsLoadingShops(true);
        const data = await apiFetch("https://apitpv.anthonyloor.com/shops", {
          method: "GET",
        });
        // Filtramos tienda con id=1 si no la quieres
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

  // 2) Asignar nombre de tienda al cambiar selectedOriginStore
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

  // 3) Asignar nombre de tienda al cambiar selectedDestinationStore
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

  // 4) Si es movimiento nuevo => asignamos tienda local por defecto
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

  // 5) Carga de datos del movimiento si existe
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

  // 6) Fecha, status y empleado
  useEffect(() => {
    if (isNewMovement) {
      // Fecha = hoy
      setCreateDate(new Date().toISOString().split("T")[0]);
      setEmployeeId(employeeId);
    } else {
      // Movimiento existente
      if (movementData?.date_add) {
        const onlyDate = movementData.date_add.split(" ")[0];
        setCreateDate(onlyDate);
      }
      setMovementStatus(movementData?.status || "En creacion");
      setEmployeeId(movementData?.employee);

      // Cargar los detalles del movimiento
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

  // Saber si la tienda origen y destino son iguales (solo para traspaso)
  const isSameStoreSelected =
    type === "traspaso" &&
    selectedOriginStore &&
    selectedDestinationStore &&
    selectedOriginStore === selectedDestinationStore;

  // Podemos editar productos si: es nuevo o status = 'En creacion'
  const canEditProducts =
    isNewMovement || movementStatus.toLowerCase() === "en creacion";

  // Añadir producto => si no hay suficiente stock, no se añade
  const handleAddProduct = (product) => {
    if (!canEditProducts) return;

    setProductsToTransfer((prev) => {
      // 1) Comprobar stock
      const maxStock = product.stockOrigin;
      if (product.quantity > maxStock) {
        toast.error("No dispones de más stock para añadir.");
        // No se agrega
        return prev;
      }

      // 2) Buscar si ya existe
      const existing = prev.find(
        (p) => p.id_product_attribute === product.id_product_attribute
      );
      if (existing) {
        const newQty = existing.quantity + product.quantity;
        if (newQty > maxStock) {
          toast.error("No dispones de más stock para añadir.");
          return prev;
        }
        // Actualizar
        setRecentlyAddedId(product.id_product_attribute);
        return prev.map((p) =>
          p.id_product_attribute === product.id_product_attribute
            ? { ...p, quantity: newQty }
            : p
        );
      } else {
        // Producto nuevo
        setRecentlyAddedId(product.id_product_attribute); // Animar la nueva fila
        return [...prev, product];
      }
    });
  };

  // Cambiar cantidad => si excede stockOrigin => no se actualiza
  const handleQuantityChange = (id_product_attribute, newQty) => {
    if (!canEditProducts) return;

    setProductsToTransfer((prev) => {
      const found = prev.find(
        (p) => p.id_product_attribute === id_product_attribute
      );
      if (!found) return prev; // no lo halló
      const maxStock = found.stockOrigin;

      let val = parseInt(newQty, 10) || 1;
      if (val > maxStock) {
        toast.error("No dispones de más stock para añadir.");
        return prev; // no se actualiza
      }
      // Actualizar
      return prev.map((p) =>
        p.id_product_attribute === id_product_attribute
          ? { ...p, quantity: val }
          : p
      );
    });
  };

  // Eliminar producto
  const handleRemoveProduct = (id_product_attribute) => {
    if (!canEditProducts) return;
    setProductsToTransfer((prev) =>
      prev.filter((p) => p.id_product_attribute !== id_product_attribute)
    );
  };
  // Construir movements_details
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
        // 'salida' o 'traspaso'
        detail.sent_quantity = prod.quantity;
      }
      return detail;
    });
  };

  // Crear => POST create_warehouse_movement
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

  // Actualizar => POST update_warehouse_movement
  // Mantiene status "En creacion"
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

  // Ejecutar => POST execute_warehouse_movement, solo si 'entrada' o 'salida'
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

  // Para traspaso => Enviar / Recibido / En revision / Finalizar
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

  // Render principal de botones en la parte inferior
  const noProducts = productsToTransfer.length === 0;
  const isSameStore = isSameStoreSelected;
  const st = currentStatus.toLowerCase();

  const renderMainButton = () => {
    // 1) Si es nuevo => solo "Guardar"
    if (isNewMovement) {
      return (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          disabled={isSameStore || noProducts}
          onClick={handleSaveCreate}
        >
          Guardar
        </button>
      );
    }

    // 2) Movimiento existente
    if (st === "en creacion") {
      if (type === "traspaso") {
        // "Actualizar" => mantiene En creacion
        // "Enviar" => pasa a Enviado
        return (
          <div className="flex gap-2 w-full">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded flex-1"
              disabled={isSameStore || noProducts}
              onClick={handleUpdateMovement}
            >
              Actualizar
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded flex-1"
              disabled={isSameStore || noProducts}
              onClick={() => handleUpdateMovementStatus("Enviado")}
            >
              Enviar
            </button>
          </div>
        );
      } else if (type === "entrada" || type === "salida") {
        // "Actualizar" + "Ejecutar"
        return (
          <div className="flex gap-2 w-full">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded flex-1"
              disabled={noProducts}
              onClick={handleUpdateMovement}
            >
              Actualizar
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
              disabled={noProducts}
              onClick={handleExecuteMovement}
            >
              Ejecutar
            </button>
          </div>
        );
      }
    }

    // 3) Si es "Enviado" => solo para traspaso => "Marcar Recibido"
    if (st === "enviado" && type === "traspaso") {
      return (
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
          onClick={() => handleUpdateMovementStatus("Recibido")}
        >
          Marcar como Recibido
        </button>
      );
    }

    // 4) "Recibido" => "Revisar" (traspaso)
    if (st === "recibido" && type === "traspaso") {
      return (
        <button
          className="bg-orange-500 text-white px-4 py-2 rounded w-full"
          onClick={() => handleUpdateMovementStatus("En revision")}
        >
          Revisar
        </button>
      );
    }

    // 5) "En revision" => "Finalizar" (traspaso)
    if (st === "en revision" && type === "traspaso") {
      return (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
          disabled={noProducts}
          onClick={handleExecuteMovement}
        >
          Ejecutar
        </button>
      );
    }

    // 6) Si estado final o no encaja: sin acciones
    return (
      <button
        className="bg-gray-400 text-white px-4 py-2 rounded w-full"
        disabled
      >
        Sin acciones
      </button>
    );
  };

  // Título interno
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

  // ¿Podemos editar selects de tienda?
  const canEditStores = isNewMovement;

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="text-xl font-bold mb-4">{formTitle}</div>

      <div className="grid grid-cols-2 gap-4">
        {/* Columna 1: Fecha + Estado + Empleado */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">
              Fecha Creación
            </label>
            <input
              className="border rounded w-full p-2"
              type="date"
              value={createDate}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">ID Empleado</label>
            <input
              className="border rounded w-full p-2"
              type="text"
              value={employeeIdV || ""}
              readOnly
            />
          </div>
        </div>

        {/* Columna 2: Descripción + Fecha */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Descripción</label>
            <input
              className="border rounded w-full p-2"
              type="text"
              placeholder="Ej: Traspaso ropa navidad"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={
                !isNewMovement && currentStatus.toLowerCase() !== "en creacion"
              }
            />
          </div>
          {type === "traspaso" && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-bold mb-1">
                  Tienda Origen
                </label>
                {isLoadingShops ? (
                  <p>Cargando tiendas...</p>
                ) : errorLoadingShops ? (
                  <p className="text-red-500">{errorLoadingShops}</p>
                ) : (
                  <select
                    className="border rounded w-full p-2"
                    value={selectedOriginStore}
                    onChange={(e) => setSelectedOriginStore(e.target.value)}
                    disabled={!canEditStores}
                  >
                    <option value="">Selecciona una tienda</option>
                    {shops.map((shop) => (
                      <option key={shop.id_shop} value={shop.id_shop}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">
                  Tienda Destino
                </label>
                {isLoadingShops ? (
                  <p>Cargando tiendas...</p>
                ) : errorLoadingShops ? (
                  <p className="text-red-500">{errorLoadingShops}</p>
                ) : (
                  <select
                    className="border rounded w-full p-2"
                    value={selectedDestinationStore}
                    onChange={(e) =>
                      setSelectedDestinationStore(e.target.value)
                    }
                    disabled={!canEditStores}
                  >
                    <option value="">Selecciona una tienda</option>
                    {shops
                      .filter(
                        (s) => String(s.id_shop) !== String(selectedOriginStore)
                      )
                      .map((shop) => (
                        <option key={shop.id_shop} value={shop.id_shop}>
                          {shop.name}
                        </option>
                      ))}
                  </select>
                )}
                {isSameStoreSelected && (
                  <p className="text-red-500">
                    La tienda origen y destino no pueden ser la misma.
                  </p>
                )}
              </div>
            </div>
          )}

          {type === "entrada" && (
            <div>
              <label className="block text-sm font-bold mb-1">
                Tienda Destino
              </label>
              {isLoadingShops ? (
                <p>Cargando tiendas...</p>
              ) : errorLoadingShops ? (
                <p className="text-red-500">{errorLoadingShops}</p>
              ) : (
                <select
                  className="border rounded w-full p-2"
                  value={selectedDestinationStore}
                  onChange={(e) => setSelectedDestinationStore(e.target.value)}
                  disabled={!canEditStores}
                >
                  <option value="">Selecciona una tienda</option>
                  {shops.map((shop) => (
                    <option key={shop.id_shop} value={shop.id_shop}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {type === "salida" && (
            <div>
              <label className="block text-sm font-bold mb-1">
                Tienda Origen
              </label>
              {isLoadingShops ? (
                <p>Cargando tiendas...</p>
              ) : errorLoadingShops ? (
                <p className="text-red-500">{errorLoadingShops}</p>
              ) : (
                <select
                  className="border rounded w-full p-2"
                  value={selectedOriginStore}
                  onChange={(e) => setSelectedOriginStore(e.target.value)}
                  disabled={!canEditStores}
                >
                  <option value="">Selecciona una tienda</option>
                  {shops.map((shop) => (
                    <option key={shop.id_shop} value={shop.id_shop}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="my-4">
        <Steps readOnly model={stepItems} activeIndex={activeIndex} />
      </div>

      {/* Si es nuevo o (estado=en creacion) => renderizar el ProductSearchCard */}
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

      {/* Tabla de productos */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">
          {type === "traspaso"
            ? "Productos a Traspasar"
            : type === "entrada"
            ? "Productos a Ingresar"
            : "Productos a Retirar"}
        </h3>
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Producto</th>
              <th className="py-2 px-4 border-b text-left">Cantidad</th>
              <th className="py-2 px-4 border-b text-left"></th>
            </tr>
          </thead>
          <tbody>
            {productsToTransfer.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No hay productos seleccionados.
                </td>
              </tr>
            )}

            {productsToTransfer.map((product, index) => {
              const rowClass =
                product.id_product_attribute === recentlyAddedId
                  ? "animate-product"
                  : "";
              const eanString = product.ean13 || "";

              return (
                <tr
                  key={`${product.id_product_attribute}_${index}`}
                  className={rowClass}
                >
                  <td className="py-2 px-4 border-b">
                    <div>
                      {product.product_name}
                      {product.combination_name
                        ? ` - ${product.combination_name}`
                        : ""}
                    </div>
                    <div className="text-xs text-gray-500">
                      EAN: {eanString || "--"}
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <input
                      type="number"
                      min="1"
                      className="border rounded w-16 p-1"
                      value={product.quantity}
                      onChange={(e) =>
                        handleQuantityChange(
                          product.id_product_attribute,
                          e.target.value
                        )
                      }
                      disabled={!canEditProducts}
                    />
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() =>
                        handleRemoveProduct(product.id_product_attribute)
                      }
                      disabled={!canEditProducts}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Botones finales */}
      <div className="mt-6 flex gap-4">{renderMainButton()}</div>
    </div>
  );
};

export default TransferForm;
