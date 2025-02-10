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
      <div style={{ fontStyle: "italic", color: "var(--text-secondary)" }}>
        Haz clic en un producto para ver su stock en cada tienda
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h4 style={{ fontWeight: "bold", marginBottom: "1rem" }}>
        Stock para: {product.product_name}
      </h4>
      <div className="p-d-flex p-flex-wrap" style={{ gap: "1rem" }}>
        {shops.map((shop) => {
          const qty = stocksByShop[shop.id_shop] ?? 0;
          return (
            <Card
              key={shop.id_shop}
              title={shop.name}
              style={{ width: "12rem", padding: "0.5rem" }}
              className="p-shadow-2"
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {qty}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default StoreStockPanel;
