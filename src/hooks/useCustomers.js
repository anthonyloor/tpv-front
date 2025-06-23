import { useCallback } from "react";
import { useApiFetch } from "../utils/useApiFetch";
import getApiBaseUrl from "../utils/getApiBaseUrl";

export const useCustomers = () => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

  const getAllCustomers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/get_all_customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Error al obtener clientes");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Error al obtener clientes:", err);
      return null;
    }
  }, [API_BASE_URL]);

  const getFilteredCustomers = useCallback(
    async ({ filter = "", id_customer, origin = "mayret" } = {}) => {
      try {
        const payload = { filter, origin };
        if (id_customer) payload.id_customer = id_customer;
        const data = await apiFetch(`${API_BASE_URL}/get_customers_filtered`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Error al buscar clientes:", err);
        return null;
      }
    },
    [apiFetch, API_BASE_URL]
  );

  return { getAllCustomers, getFilteredCustomers };
};

export default useCustomers;
