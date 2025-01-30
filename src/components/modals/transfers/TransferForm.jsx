// src/components/modals/transfers/TransferForm.jsx

import React, { useState, useEffect } from 'react';
import ProductSearchCardForTransfer from './ProductSearchCardForTransfer';
import { useApiFetch } from '../../utils/useApiFetch';

const TransferForm = ({ type, onSave, permisosUsuario, permisosGlobal, movementData }) => {
  const [productsToTransfer, setProductsToTransfer] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedOriginStore, setSelectedOriginStore] = useState('');
  const [selectedDestinationStore, setSelectedDestinationStore] = useState('');
  const [permisoEjecutar, setPermisoEjecutar] = useState('Denegado');
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [errorLoadingShops, setErrorLoadingShops] = useState(null);
  const apiFetch = useApiFetch();

  // Texto descriptivo del movimiento
  const [description, setDescription] = useState('');

  // 1) Cargar la lista de tiendas al montar
  useEffect(() => {
    const loadShops = async () => {
      try {
        setIsLoadingShops(true);
        const data = await apiFetch('https://apitpv.anthonyloor.com/shops', { method: 'GET' });
        const filteredData = data.filter((shop) => shop.id_shop !== 1);
        setShops(filteredData);
      } catch (error) {
        console.error('Error loading shops:', error);
        setErrorLoadingShops(error.message || 'Error al cargar las tiendas');
      } finally {
        setIsLoadingShops(false);
      }
    };
    loadShops();
  }, [apiFetch]);

  // 2) Si `movementData` es nulo => estamos creando uno nuevo => 
  //    asignar la tienda local al origen/destino según "type"
  useEffect(() => {
    if (!movementData) {
      const storedShop = JSON.parse(localStorage.getItem('shop'));
      if (storedShop && storedShop.id_shop) {
        if (type === 'salida' || type === 'traspaso') {
          setSelectedOriginStore(String(storedShop.id_shop));
        } else if (type === 'entrada') {
          setSelectedDestinationStore(String(storedShop.id_shop));
        }
      }
    }
  }, [movementData, type]);

  // 3) Permisos globales
  useEffect(() => {
    if (permisosGlobal && permisosUsuario) {
      setPermisoEjecutar(permisosGlobal[permisosUsuario]?.acceso_ejecutar || 'Denegado');
    }
  }, [permisosUsuario, permisosGlobal]);

  // 4) Si `movementData` existe => precargar la info
  useEffect(() => {
    if (movementData) {
      setDescription(movementData.description || '');
      if (movementData.id_shop_origin) {
        setSelectedOriginStore(String(movementData.id_shop_origin));
      }
      if (movementData.id_shop_destiny) {
        setSelectedDestinationStore(String(movementData.id_shop_destiny));
      }

      // Convertir movement_details en productsToTransfer
      if (Array.isArray(movementData.movement_details)) {
        const loadedProducts = movementData.movement_details.map((md) => {
          // Suponiendo: en 'traspaso' y 'salida' la cantidad se registra en "sent_quantity"
          // y en 'entrada' la cantidad se registra en "recived_quantity"
          const quantity = md.sent_quantity || md.recived_quantity || 0;
          return {
            id_product_attribute: md.id_warehouse_movement_detail,
            product_name: md.product_name,
            quantity
          };
        });
        setProductsToTransfer(loadedProducts);
      }
    }
  }, [movementData]);

  // Guardar (crear/editar)
  const handleSave = () => {
    if (movementData?.id_warehouse_movement) {
      console.log('[TransferForm] Editar movimiento:', movementData.id_warehouse_movement);
      // TODO: Llamada a tu API p.ej. update_warehouse_movement
    } else {
      console.log('[TransferForm] Crear nuevo movimiento');
      // TODO: Llamada a tu API p.ej. create_warehouse_movement
    }

    if (onSave) onSave();
  };

  // Añadir producto
  const handleAddProduct = (product) => {
    setProductsToTransfer((prev) => {
      const existing = prev.find((p) => p.id_product_attribute === product.id_product_attribute);
      if (existing) {
        return prev.map((p) =>
          p.id_product_attribute === product.id_product_attribute
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  // Cambiar cantidad
  const handleQuantityChange = (id_product_attribute, newQty) => {
    setProductsToTransfer((prev) =>
      prev.map((p) =>
        p.id_product_attribute === id_product_attribute
          ? { ...p, quantity: parseInt(newQty, 10) }
          : p
      )
    );
  };

  // Eliminar producto
  const handleRemoveProduct = (id_product_attribute) => {
    setProductsToTransfer((prev) =>
      prev.filter((p) => p.id_product_attribute !== id_product_attribute)
    );
  };

  // Saber si la tienda origen y destino son iguales (en 'traspaso')
  const isSameStoreSelected =
    selectedOriginStore === selectedDestinationStore && type === 'traspaso';

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Columna 1: Descripción + Fecha */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Descripción</label>
            <input
              className="border rounded w-full p-2"
              type="text"
              placeholder="Ej: Traspaso ropa navidad"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                    onChange={(e) => setSelectedOriginStore(e.target.value)}
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
                    onChange={(e) => setSelectedDestinationStore(e.target.value)}
                  >
                    <option value="">Selecciona una tienda</option>
                    {shops
                      .filter((shop) => shop.id_shop.toString() !== selectedOriginStore)
                      .map((shop) => (
                        <option key={shop.id_shop} value={shop.id_shop}>
                          {shop.name}
                        </option>
                      ))}
                  </select>
                )}
                {isSameStoreSelected && (
                  <p className="text-red-500">La tienda origen y destino no pueden ser la misma.</p>
                )}
              </div>
            </>
          )}

          {type === 'entrada' && (
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
                  onChange={(e) => setSelectedDestinationStore(e.target.value)}
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
                  onChange={(e) => setSelectedOriginStore(e.target.value)}
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

      {/* ProductSearchCardForTransfer => solo si movementData es null (nuevo) */}
      {!movementData && (
        <ProductSearchCardForTransfer
          onAddProduct={handleAddProduct}
          selectedOriginStore={selectedOriginStore}
          selectedDestinationStore={selectedDestinationStore}
          type={type}
        />
      )}

      {/* Tabla de productos */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold">Productos a Traspasar:</h3>
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Producto</th>
              <th className="py-2 px-4 border-b text-left">Cantidad</th>
              <th className="py-2 px-4 border-b text-left"></th>
            </tr>
          </thead>
          <tbody>
            {productsToTransfer.map((product, index) => (
              <tr key={index}>
                <td className="py-2 px-4 border-b">{product.product_name}</td>
                <td className="py-2 px-4 border-b">
                  <input
                    type="number"
                    min="1"
                    className="border rounded w-12 p-1"
                    value={product.quantity}
                    onChange={(e) => handleQuantityChange(product.id_product_attribute, e.target.value)}
                  />
                </td>
                <td className="py-2 px-4 border-b">
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => handleRemoveProduct(product.id_product_attribute)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
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

      {/* Botones Guardar / Ejecutar */}
      <div className="mt-6 flex gap-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          onClick={handleSave}
          disabled={isSameStoreSelected}
        >
          Guardar
        </button>
        {permisoEjecutar === 'Permitido' && (
          <button
            className="bg-green-500 text-white px-4 py-2 rounded w-full"
            onClick={() => {
              alert('Ejecutar Traspaso (o Entrada / Salida)');
              // tu lógica
            }}
            disabled={isSameStoreSelected}
          >
            Ejecutar
          </button>
        )}
      </div>
    </div>
  );
};

export default TransferForm;