// src/components/Stock/StoreStockPanel.jsx

import React, { useEffect, useState, useContext } from "react";
import { useApiFetch } from "../../utils/useApiFetch";
import { AuthContext } from "../../contexts/AuthContext";
import { Card } from "primereact/card";
import getApiBaseUrl from "../../utils/getApiBaseUrl";

function StoreStockPanel({ product }) {
  const apiFetch = useApiFetch();
  const [shops, setShops] = useState([]);
  const [stocksByShop, setStocksByShop] = useState({});
  const { idProfile } = useContext(AuthContext);
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/shops`, { method: "GET" })
      .then((res) => {
        const data = res.filter((s) => s.id_shop !== 1);
        if (idProfile === 1) {
          const filtered = data.filter((s) => s.id_shop !== 1);
          setShops(filtered);
        } else {
          const filtered = data.filter((s) => s.id_shop !== 13 && s.id_shop !== 1);
          setShops(filtered);
        }
      })
      .catch((err) => console.error("Error al cargar tiendas:", err));
  }, [apiFetch, idProfile, API_BASE_URL]);

  // Calcular stocksByShop en base al product.stocks
  useEffect(() => {
    if (!product || !product.stocks) {
      setStocksByShop({});
      return;
    }
    const map = {};
    product.stocks.forEach((s) => {
      map[s.id_shop] = s.quantity;
    });
    setStocksByShop(map);
  }, [product]);

  // Construir el subtítulo (o parte final) con combination
  const combinationLabel = product?.combination_name
    ? ` - ${product.combination_name}`
    : "";

  // Título principal => si no hay product => Stock de: —
  const mainTitle = product
    ? `Stock de: ${product.product_name}${combinationLabel}`
    : "Stock de: —";

  return (
    <div
      className="h-full flex flex-col p-3 relative"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      <span className="font-bold text-lg m-2">{mainTitle}</span>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-3">
          {shops.map((shop) => {
            const displayName = shop.name;
            const qty = stocksByShop[shop.id_shop] ?? 0;
            return (
              <Card key={shop.id_shop} className="shadow-2 border-round">
                <div className="flex flex-col gap-1">
                  <div className="text-lg font-semibold">
                    {displayName}: {qty}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StoreStockPanel;
