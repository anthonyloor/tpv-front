import { useCallback } from "react";
import { useApiFetch } from "../utils/useApiFetch";
import getApiBaseUrl from "../utils/getApiBaseUrl";

export const useLastOrders = () => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

  const getLastOrdersByCustomer = useCallback(
    async (customerId) => {
      try {
        const payload = { id_customer: customerId, origin: "all" };
        const data = await apiFetch(
          `${API_BASE_URL}/get_last_orders_by_customer`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("Error al obtener últimas ventas:", err);
        return [];
      }
    },
    [apiFetch, API_BASE_URL]
  );

  return { getLastOrdersByCustomer };
};

export default useLastOrders;
