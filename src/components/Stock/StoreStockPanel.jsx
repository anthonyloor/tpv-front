// src/components/Stock/StoreStockPanel.jsx

import React, { useEffect, useState } from "react";
import { useApiFetch } from "../../components/utils/useApiFetch";
import { Card } from "primereact/card";

function StoreStockPanel({ product }) {
  const apiFetch = useApiFetch();
  const [shops, setShops] = useState([]);
  const [stocksByShop, setStocksByShop] = useState({});

  useEffect(() => {
    apiFetch("https://apitpv.anthonyloor.com/shops", { method: "GET" })
      .then((data) => setShops(data))
      .catch((err) => console.error("Error al cargar tiendas:", err));
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
    }
  }, [product]);

  if (!product) {
    return (
      <div className="italic" style={{ color: "var(--text-secondary)" }}>
        Haz clic en un producto para ver su stock en cada tienda
      </div>
    );
  }

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      <h4 className="font-bold mb-3">Stock para: {product.product_name}</h4>
      <div className="flex flex-wrap gap-4">
        {shops.map((shop) => {
          const qty = stocksByShop[shop.id_shop] ?? 0;
          return (
            <Card
              key={shop.id_shop}
              title={shop.name}
              className="p-shadow-2 w-48"
              style={{
                backgroundColor: "var(--surface-card)",
                color: "var(--text-color)",
              }}
            >
              <div className="text-center text-2xl font-bold">{qty}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default StoreStockPanel;
