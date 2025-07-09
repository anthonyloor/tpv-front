// src/components/Stock/StoreStockPanel.jsx

import React, { useEffect, useState, useContext, useRef } from "react";
import { useApiFetch } from "../../utils/useApiFetch";
import { AuthContext } from "../../contexts/AuthContext";
import getApiBaseUrl from "../../utils/getApiBaseUrl";
import { OverlayPanel } from "primereact/overlaypanel";
import ControlStockModal from "../modals/controlStock/ControlStockModal";

function StoreStockPanel({ product }) {
  const apiFetch = useApiFetch();
  const [shops, setShops] = useState([]);
  const [stocksByShop, setStocksByShop] = useState({});
  const { idProfile, shopId } = useContext(AuthContext);
  const API_BASE_URL = getApiBaseUrl();

  const [trackingList, setTrackingList] = useState([]);
  const overlayPanelRef = useRef(null);
  const [controlStockModalOpen, setControlStockModalOpen] = useState(false);
  const [controlStockQuery, setControlStockQuery] = useState("");

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/shops`, { method: "GET" })
      .then((res) => {
        const data = res.filter((s) => s.id_shop !== 1);
        if (idProfile === 1) {
          const filtered = data.filter((s) => s.id_shop !== 1);
          setShops(filtered);
        } else {
          const filtered = data.filter((s) => s.id_shop === shopId);
          setShops(filtered);
        }
      })
      .catch((err) => console.error("Error al cargar tiendas:", err));
  }, [apiFetch, idProfile, API_BASE_URL, shopId]);

  // Calcular stocksByShop según product.stocks
  useEffect(() => {
    if (!product || !product.stocks) {
      setStocksByShop({});
      setTrackingList([]);
      return;
    }
    const map = {};
    product.stocks.forEach((s) => {
      map[s.id_shop] = s;
    });
    setStocksByShop(map);
  }, [product]);

  // Función para abrir el overlay panel en cada tienda
  const handleStoreTrackingClick = (event, shopId) => {
    const stock = product.stocks.find(
      (s) => Number(s.id_shop) === Number(shopId)
    );
    const details = stock && stock.control_stock ? stock.control_stock : [];
    setTrackingList(details);
    overlayPanelRef.current.toggle(event);
  };

  const handleTrackingItemClick = (id) => {
    if (idProfile !== 1) return;
    setControlStockQuery(String(id));
    setControlStockModalOpen(true);
    overlayPanelRef.current.hide();
  };

  if (!product) {
    return (
      <div
        className="h-full flex items-center justify-center p-3"
        style={{
          backgroundColor: "var(--surface-0)",
          color: "var(--text-color)",
        }}
      >
        <span>Seleccione un producto para ver stock</span>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col p-3"
      style={{
        backgroundColor: "var(--surface-0)",
        color: "var(--text-color)",
      }}
    >
      {/* Grid adaptado con estilo similar a SalesCardActions */}
      <div className="flex flex-wrap gap-2">
        {shops.map((shop) => {
          const displayName = shop.name;
          const stock = stocksByShop[shop.id_shop];
          const qty = stock ? stock.quantity : 0;
          const hasTracking =
            stock && stock.control_stock && stock.control_stock.length > 0;
          return (
            <div
              key={shop.id_shop}
              className="justify-center p-3 shadow-2 border-round flex flex-col gap-1 align-items-center"
              style={{
                flex: 1,
                width: "50px",
                height: "100px",
              }}
            >
              <span className="font-semibold text-lg">{displayName}</span>
              <span className="mt-1 text-xl font-bold">{qty}</span>
              {hasTracking && (
                <i
                  className="pi pi-link"
                  style={{
                    cursor: "pointer",
                    opacity: 1,
                  }}
                  onClick={(e) => handleStoreTrackingClick(e, shop.id_shop)}
                ></i>
              )}
            </div>
          );
        })}
      </div>
      <OverlayPanel ref={overlayPanelRef}>
        {trackingList.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2"
            style={{
              cursor: idProfile === 1 ? "pointer" : "default",
              opacity: 1,
            }}
            onClick={() =>
              idProfile === 1 && handleTrackingItemClick(item.id_control_stock)
            }
          >
            <span className="flex items-center">
              {item.id_control_stock}
              <i className="pi pi-link" style={{ marginLeft: "0.5rem" }}></i>
            </span>
            <i
              className={`pi ${
                item.active_control_stock ? "pi-check" : "pi-times"
              }`}
              style={{
                color: item.active_control_stock ? "green" : "red",
              }}
            ></i>
          </div>
        ))}
      </OverlayPanel>
      <ControlStockModal
        isOpen={controlStockModalOpen}
        onClose={() => setControlStockModalOpen(false)}
        initialQuery={controlStockQuery}
      />
    </div>
  );
}

export default StoreStockPanel;
