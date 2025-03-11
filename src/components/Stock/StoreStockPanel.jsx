// src/components/Stock/StoreStockPanel.jsx

import React, { useEffect, useState, useContext } from "react";
import { useApiFetch } from "../../components/utils/useApiFetch";
import { AuthContext } from "../../contexts/AuthContext";
import { Card } from "primereact/card";

function StoreStockPanel({ product }) {
  const apiFetch = useApiFetch();
  const [shops, setShops] = useState([]);
  const [stocksByShop, setStocksByShop] = useState({});
  const { idProfile } = useContext(AuthContext);

  // Cargar todas las tiendas; filtrar si no admin
  useEffect(() => {
    apiFetch("https://apitpv.anthonyloor.com/shops", { method: "GET" })
      .then((data) => {
        if (idProfile === 1) {
          // Admin => ve todas
          setShops(data);
        } else {
          // Filtra id_shop=1 y 2
          const filtered = data.filter(
            (s) => s.id_shop !== 1 && s.id_shop !== 2
          );
          setShops(filtered);
        }
      })
      .catch((err) => console.error("Error al cargar tiendas:", err));
  }, [apiFetch, idProfile]);

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
            const displayName = shop.id_shop === 1 ? "Online" : shop.name;
            const qty = stocksByShop[shop.id_shop] ?? 0;
            return (
              <Card
                key={shop.id_shop}
                className="shadow-2 border-round"
                style={{
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-color)",
                  width: "18%",
                }}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {displayName}: <span className="text-2xl">{qty}</span>
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
