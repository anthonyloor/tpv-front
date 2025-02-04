// src/components/modals/transfers/TransferForm.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ProductSearchCardForTransfer from './ProductSearchCardForTransfer';
import { useApiFetch } from '../../utils/useApiFetch';

const TransferForm = ({ type, onSave, permisosUsuario, permisosGlobal, movementData }) => {
  const [productsToTransfer, setProductsToTransfer] = useState([]);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedOriginStore, setSelectedOriginStore] = useState('');
  const [selectedDestinationStore, setSelectedDestinationStore] = useState('');
  const [originShopName, setOriginShopName] = useState('');
  const [destinationShopName, setDestinationShopName] = useState('');
  const [permisoEjecutar, setPermisoEjecutar] = useState('Denegado');
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [errorLoadingShops, setErrorLoadingShops] = useState(null);
  const [description, setDescription] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [movementStatus, setMovementStatus] = useState('En creacion');
  const [employeeId, setEmployeeId] = useState(null);

  const apiFetch = useApiFetch();

  // Determinar si es movimiento nuevo o edición
  const isNewMovement = !movementData; // true si no existe movementData
  // Tomar status actual (si no hay movementData => 'En creacion')
  const currentStatus = movementData?.status || 'En creacion';

  // 1) Cargar lista de tiendas al montar
  useEffect(() => {
    const loadShops = async () => {
      try {
        setIsLoadingShops(true);
        const data = await apiFetch('https://apitpv.anthonyloor.com/shops', {
          method: 'GET',
        });
        const filteredData = data.filter((shop) => shop.id_shop !== 1); // tu filtro
        setShops(filteredData);
      } catch (error) {
        console.error('Error loading shops:', error);
        setErrorLoadingShops(error.message || 'Error al cargar tiendas');
      } finally {
        setIsLoadingShops(false);
      }
    };
    loadShops();
  }, [apiFetch]);

  // Efecto: asignar el nombre de la tienda origen si está seleccionada
  useEffect(() => {
    if (shops.length > 0 && selectedOriginStore) {
      const shopObj = shops.find(
        (s) => String(s.id_shop) === String(selectedOriginStore)
      );
      setOriginShopName(shopObj ? shopObj.name : '');
    } else {
      setOriginShopName('');
    }
  }, [shops, selectedOriginStore]);

  // Efecto: asignar el nombre de la tienda destino si está seleccionada
  useEffect(() => {
    if (shops.length > 0 && selectedDestinationStore) {
      const shopObj = shops.find(
        (s) => String(s.id_shop) === String(selectedDestinationStore)
      );
      setDestinationShopName(shopObj ? shopObj.name : '');
    } else {
      setDestinationShopName('');
    }
  }, [shops, selectedDestinationStore]);

  // El usuario cambia manualmente la tienda origen
  const handleChangeOriginStore = (e) => {
    setSelectedOriginStore(e.target.value);
  };

  // El usuario cambia manualmente la tienda destino
  const handleChangeDestinationStore = (e) => {
    setSelectedDestinationStore(e.target.value);
  };

  // 2) Si es movimiento nuevo => asignar tienda local por defecto
  useEffect(() => {
    if (isNewMovement) {
      const storedShop = JSON.parse(localStorage.getItem('shop'));
      if (storedShop && storedShop.id_shop) {
        if (type === 'salida' || type === 'traspaso') {
          setSelectedOriginStore(String(storedShop.id_shop));
        } else if (type === 'entrada') {
          setSelectedDestinationStore(String(storedShop.id_shop));
        }
      }
    }
  }, [isNewMovement, type]);

  // 3) Permisos
  useEffect(() => {
    if (permisosGlobal && permisosUsuario) {
      setPermisoEjecutar(permisosGlobal[permisosUsuario]?.acceso_ejecutar || 'Denegado');
    }
  }, [permisosUsuario, permisosGlobal]);

  // 4) Si movementData existe => precargar
  useEffect(() => {
    if (movementData) {
      setDescription(movementData.description || '');
      if (movementData.id_shop_origin) {
        setSelectedOriginStore(String(movementData.id_shop_origin));
      }
      if (movementData.id_shop_destiny) {
        setSelectedDestinationStore(String(movementData.id_shop_destiny));
      }
      if (!isNewMovement) {
        if (Array.isArray(movementData.movement_details)) {
          const loadedProducts = movementData.movement_details.map((md) => {
            const quantity = md.sent_quantity || md.recived_quantity || 0;
            return {
              id_warehouse_movement_detail: md.id_warehouse_movement_detail,
              id_product_attribute: md.id_product_attribute || 0,
              id_product: md.id_product || 0,
              product_name: md.product_name || '',
              ean13: md.ean13 || '',
              quantity,
            };
          });
          setProductsToTransfer(loadedProducts);
        }
      }
    }
  }, [isNewMovement, movementData]);

  useEffect(() => {
    if (isNewMovement) {
      // Fecha = hoy
      setCreateDate(new Date().toISOString().split('T')[0]);
      setEmployeeId(JSON.parse(localStorage.getItem('employee') || '{}').id_employee || null);
    } else {
      // Movimiento existente => cargar date_add, status, employee
      if (movementData.date_add) {
        // si date_add = "2025-02-10 14:23:00", tomamos la parte YYYY-MM-DD
        const onlyDate = movementData.date_add.split(' ')[0];
        setCreateDate(onlyDate);
      }
      setMovementStatus(movementData.status || 'En creacion');
      setEmployeeId(movementData.employee || null);
    }
  }, [isNewMovement, movementData]);

  // Saber si la tienda origen y destino son iguales (en 'traspaso')
  const isSameStoreSelected =
    selectedOriginStore === selectedDestinationStore && type === 'traspaso';

  // Podemos editar si:
  // - es nuevo O ya existe con status = "En creacion"
  // - y no son la misma tienda en caso de traspaso
  const canEditProducts =
    (currentStatus.toLowerCase() === 'en creacion') || isNewMovement;

  // Añadir producto
  const handleAddProduct = (product) => {
    if (!canEditProducts) return;

    setProductsToTransfer((prev) => {
      const existing = prev.find(
        (p) => p.id_product_attribute === product.id_product_attribute
      );
      if (existing) {
        const newQty = existing.quantity + 1;
        if (newQty > existing.stockOrigin) {
          toast.error('No dispones de más stock para añadir.');
          return prev;
        }
        return prev.map((p) => {
          if (p.id_product_attribute === product.id_product_attribute) {
            return { ...p, quantity: newQty };
          }
          return p;
        });
      } else {
        if (product.quantity > product.stockOrigin) {
          toast.error('No dispones de más stock.');
          product.quantity = product.stockOrigin;
        }
        // Al final, indicamos el id_product_attribute recién añadido
        setRecentlyAddedId(product.id_product_attribute);
        return [...prev, product];
      }
    });
  };

  // Cambiar cantidad manualmente
  const handleQuantityChange = (id_product_attribute, newQty) => {
    if (!canEditProducts) return;

    setProductsToTransfer((prev) =>
      prev.map((p) => {
        if (p.id_product_attribute === id_product_attribute) {
          let val = parseInt(newQty, 10) || 0;
          if (val > p.stockOrigin) {
            toast.error('No dispones de más stock para añadir.');
            val = p.stockOrigin;
          }
          return { ...p, quantity: val };
        }
        return p;
      })
    );
  };

  // Eliminar producto
  const handleRemoveProduct = (id_product_attribute) => {
    if (!canEditProducts) return;

    setProductsToTransfer((prev) =>
      prev.filter((p) => p.id_product_attribute !== id_product_attribute)
    );
  };

  // Controlar botón (si no hay productos, deshabilitar)
  const noProducts = productsToTransfer.length === 0;

  // buildMovementsDetails => a partir de productsToTransfer
  const buildMovementsDetails = () => {
    return productsToTransfer.map((prod) => {
      const detail = {
        id_warehouse_movement_detail: prod.id_warehouse_movement_detail || null,
        id_product: prod.id_product,
        id_product_attribute: prod.id_product_attribute,
        product_name: prod.product_name,
        ean13: prod.ean13 || '',
      };
      // Dependiendo del type => recived o sent
      if (type === 'entrada') {
        detail.recived_quantity = prod.quantity;
      } else {
        // 'salida' o 'traspaso'
        detail.sent_quantity = prod.quantity;
      }
      return detail;
    });
  };

  // Crear => create_warehouse_movement
  const handleSaveCreate = async () => {
    const employee = JSON.parse(localStorage.getItem('employee') || '{}');
    const id_employee = employee.id_employee || null;

    const payload = {
      description,
      type,
      id_employee,
    };
    // Asignar tiendas
    if (type === 'entrada') {
      payload.id_shop_destiny = parseInt(selectedDestinationStore, 10);
    } else if (type === 'salida') {
      payload.id_shop_origin = parseInt(selectedOriginStore, 10);
    } else if (type === 'traspaso') {
      payload.id_shop_origin = parseInt(selectedOriginStore, 10);
      payload.id_shop_destiny = parseInt(selectedDestinationStore, 10);
    }
    // Detalles
    payload.movements_details = buildMovementsDetails();

    try {
      await apiFetch('https://apitpv.anthonyloor.com/create_warehouse_movement', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('Movimiento creado con éxito');
      if (onSave) onSave();
    } catch (error) {
      console.error('Error creando movimiento:', error);
      toast.error('Error al crear el movimiento');
    }
  };

  // Actualizar => update_warehouse_movement
  const handleUpdateMovement = async (newStatus) => {
    const idWarehouseMovement = movementData.id_warehouse_movement || null;

    // Armar body con la info base
    const payload = {
      id_warehouse_movement: idWarehouseMovement,
      description,
      status: newStatus,
      type: movementData.type, // redundante, si la API lo requiere
      id_shop_origin: movementData.id_shop_origin,
      id_shop_destiny: movementData.id_shop_destiny,
      movement_details: [],
    };

    // Si estamos en "En creacion" => permitimos mandar la nueva info
    if (currentStatus.toLowerCase() === 'en creacion') {
      payload.movement_details = buildMovementsDetails();
    } else {
      // en estado Enviado / Recibido / etc.
      // la API tal vez no necesite movement_details, o sí
      payload.movement_details = buildMovementsDetails();
      if (
        newStatus === 'Recibido' ||
        newStatus === 'En revision' ||
        newStatus === 'Finalizar'
      ) {
        payload.modify_reason = '';
      }
    }

    try {
      await apiFetch('https://apitpv.anthonyloor.com/update_warehouse_movement', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(`Movimiento actualizado (estado = ${newStatus}).`);
      if (onSave) onSave();
    } catch (error) {
      console.error('Error al actualizar movimiento:', error);
      toast.error('Error al actualizar movimiento');
    }
  };

  // Render del botón principal (Guardar/Actualizar) y otros
  const renderMainButton = () => {
    if (isNewMovement) {
      // Creación
      return (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          disabled={isSameStoreSelected || noProducts}
          onClick={handleSaveCreate}
        >
          Guardar
        </button>
      );
    } else {
      // Edición => depende de currentStatus
      const st = currentStatus.toLowerCase();

      if (st === 'en creacion') {
        // 2 botones: "Actualizar" => status se mantiene "En creacion"
        // y "Enviar" => status => "Enviado"
        return (
          <div className="flex gap-2 w-full">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
              disabled={isSameStoreSelected || noProducts}
              onClick={() => handleUpdateMovement('En creacion')}
            >
              Actualizar
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded flex-1"
              disabled={isSameStoreSelected || noProducts}
              onClick={() => handleUpdateMovement('Enviado')}
            >
              Enviar
            </button>
          </div>
        );
      } else if (st === 'enviado') {
        // No se puede editar => "Marcar como Recibido"
        return (
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
            onClick={() => handleUpdateMovement('Recibido')}
          >
            Marcar como Recibido
          </button>
        );
      } else if (st === 'recibido') {
        // Botón => "Revisar"
        return (
          <button
            className="bg-orange-500 text-white px-4 py-2 rounded w-full"
            onClick={() => handleUpdateMovement('En revision')}
          >
            Revisar
          </button>
        );
      } else if (st === 'en revision') {
        // Botón => "Finalizar"
        return (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
            onClick={() => handleUpdateMovement('Finalizar')}
          >
            Finalizar
          </button>
        );
      } else {
        // "finalizar" o "finalizado", sin más acciones
        return (
          <button className="bg-gray-400 text-white px-4 py-2 rounded w-full" disabled>
            Sin acciones
          </button>
        );
      }
    }
  };

  // Determinar título interno:
  let formTitle = '';
  if (isNewMovement) {
    // Crear
    formTitle = `Crear movimiento: ${
      type === 'traspaso'
        ? 'Traspaso'
        : type === 'entrada'
        ? 'Entrada'
        : 'Salida'
    }`;
  } else {
    // Editar => segun movementData.type
    const t = movementData.type;
    if (t === 'traspaso') formTitle = 'Traspaso entre tiendas';
    else if (t === 'entrada') formTitle = 'Entrada de mercadería';
    else if (t === 'salida') formTitle = 'Salida de mercadería';
  }

  // can we edit store selects?
  const canEditStores = isNewMovement; // si es nuevo => sí, si es edición => no

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="text-xl font-bold mb-4">{formTitle}</div>

      <div className="grid grid-cols-2 gap-4">
        {/* Columna 1: Fecha + Estado + Empleado */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Fecha Creación</label>
            <input
              className="border rounded w-full p-2"
              type="date"
              value={createDate}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Estado</label>
            <input
              className="border rounded w-full p-2"
              type="text"
              value={movementStatus}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">ID Empleado</label>
            <input
              className="border rounded w-full p-2"
              type="text"
              value={employeeId || ''}
              readOnly
            />
          </div>
        </div>

        {/* Columna 2: Descripción + Fecha */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Descripción</label>
            <input
              className="border rounded w-full p-2"
              type="text"
              placeholder="Ej: Traspaso ropa navidad"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isNewMovement && currentStatus.toLowerCase() !== 'en creacion'}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Fecha</label>
            <input
              className="border rounded w-full p-2"
              type="date"
              disabled
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Columna 2: según type => origen/destino */}
        <div className="space-y-4">
          {type === 'traspaso' && (
            <>
              <div>
                <label className="block text-sm font-bold mb-2">Tienda Origen</label>
                {isLoadingShops ? (
                  <p>Cargando tiendas...</p>
                ) : errorLoadingShops ? (
                  <p className="text-red-500">{errorLoadingShops}</p>
                ) : (
                  <select
                    className="border rounded w-full p-2"
                    value={selectedOriginStore}
                    onChange={handleChangeOriginStore}
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
                <label className="block text-sm font-bold mb-2">Tienda Destino</label>
                {isLoadingShops ? (
                  <p>Cargando tiendas...</p>
                ) : errorLoadingShops ? (
                  <p className="text-red-500">{errorLoadingShops}</p>
                ) : (
                  <select
                    className="border rounded w-full p-2"
                    value={selectedDestinationStore}
                    onChange={handleChangeDestinationStore}
                    disabled={!canEditStores}
                  >
                    <option value="">Selecciona una tienda</option>
                    {shops
                      .filter(
                        (shop) => shop.id_shop.toString() !== selectedOriginStore
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
            </>
          )}

          {type === 'entrada' && (
            <div>
              <label className="block text-sm font-bold mb-2">
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
                  onChange={handleChangeDestinationStore}
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

          {type === 'salida' && (
            <div>
              <label className="block text-sm font-bold mb-2">Tienda Origen</label>
              {isLoadingShops ? (
                <p>Cargando tiendas...</p>
              ) : errorLoadingShops ? (
                <p className="text-red-500">{errorLoadingShops}</p>
              ) : (
                <select
                  className="border rounded w-full p-2"
                  value={selectedOriginStore}
                  onChange={handleChangeOriginStore}
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

      {/* Si es nuevo => o si el estado es "En creacion" => permitir ProductSearchCardForTransfer */}
      {((isNewMovement) || currentStatus.toLowerCase() === 'en creacion') && (
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
          {type === 'traspaso'
            ? 'Productos a Traspasar'
            : type === 'entrada'
            ? 'Productos a Ingresar'
            : 'Productos a Retirar'}
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
            {productsToTransfer.map((product, index) => {
              const eanString = product.ean13 || '';
              return (
                <tr key={`${product.id_product_attribute}_${index}`} >
                  <td className="py-2 px-4 border-b">
                    {/* product_name + combination_name + EAN */}
                    <div>
                      {product.product_name}
                      {product.combination_name
                        ? ` - ${product.combination_name}`
                        : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      EAN: {eanString || '--'}
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
            {productsToTransfer.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No hay productos seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botones */}
      <div className="mt-6 flex gap-4">{renderMainButton()}</div>
    </div>
  );
};

export default TransferForm;