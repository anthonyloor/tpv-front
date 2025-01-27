// src/components/Stock/StoreStockPanel.jsx
import React, { useEffect, useState } from 'react';
import { useApiFetch } from '../../components/utils/useApiFetch';

function StoreStockPanel({ product }) {
  const apiFetch = useApiFetch();
  const [shops, setShops] = useState([]);
  const [stocksByShop, setStocksByShop] = useState({});

  useEffect(() => {
    // Cargamos la lista de tiendas al montar
    apiFetch('https://apitpv.anthonyloor.com/shops', { method: 'GET' })
      .then((data) => setShops(data))
      .catch((err) => console.error('Error al cargar tiendas:', err));
  }, [apiFetch]);

  useEffect(() => {
    if (!product) {
      setStocksByShop({});
      return;
    }
    if (product.stocks) {
      const map = {};
      product.stocks.forEach((s) => {
        map[s.id_shop] = s.quantity;
      });
      setStocksByShop(map);
    } else {
      // si no tenemos la info en product.stocks, podrías hacer fetch a otro endpoint,
      // p.e. `apiFetch('/product_stock_by_shops?id='+product.id_product)` 
      // y luego setStocksByShop(...) 
    }
  }, [product]);

  if (!product) {
    return (
      <div className="text-gray-500 italic">
        Haz clic en un producto para ver su stock en cada tienda
      </div>
    );
  }

  return (
    <div className="p-4 ">
      <h4 className="font-bold mb-2">Stock para: {product.product_name}</h4>
      <div className="flex flex-wrap gap-3">
        {shops.map((shop) => {
          const qty = stocksByShop[shop.id_shop] ?? 0;
          return (
            <div key={shop.id_shop} className="border p-2 rounded w-36">
              <div className="font-semibold text-sm mb-1">{shop.name}</div>
              <div className="text-lg font-bold">{qty}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StoreStockPanel;