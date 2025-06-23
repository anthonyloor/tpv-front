import { useCallback } from "react";
import { useApiFetch } from "../utils/useApiFetch";
import getApiBaseUrl from "../utils/getApiBaseUrl";

/**
 * Provides a helper to retrieve addresses for a customer.
 * Filters deleted/inactive ones and sorts by last update.
 */
export const useAddresses = () => {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

  const getAddresses = useCallback(
    async (customerId, origin) => {
      try {
        const payload = { id_customer: customerId };
        if (origin) payload.origin = origin;
        const data = await apiFetch(`${API_BASE_URL}/get_addresses`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!Array.isArray(data)) return [];
        return data
          .filter((a) => !a.deleted && a.active)
          .sort((a, b) => new Date(b.date_upd) - new Date(a.date_upd));
      } catch (err) {
        console.error("Error al obtener direcciones:", err);
        return [];
      }
    },
    [apiFetch, API_BASE_URL]
  );

  const createAddress = useCallback(
    async (customerId, addressData) => {
      try {
        const payload = { ...addressData, id_customer: customerId };
        const data = await apiFetch(`${API_BASE_URL}/create_address`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        return data;
      } catch (err) {
        console.error("Error al crear dirección:", err);
        return null;
      }
    },
    [apiFetch, API_BASE_URL]
  );

  return { getAddresses, createAddress };
};

export default useAddresses;
