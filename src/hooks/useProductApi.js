import { useCallback } from "react";
import { useApiFetch } from "../utils/useApiFetch";
import getApiBaseUrl from "../utils/getApiBaseUrl";

/**
 * Hook that centralizes API calls related to products.
 */
export default function useProductApi() {
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

  const searchProducts = useCallback(
    async (searchTerm, idDefaultGroup) => {
      const payload = { search_term: searchTerm, id_default_group: idDefaultGroup };
      const data = await apiFetch(`${API_BASE_URL}/product_search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return Array.isArray(data) ? data : [];
    },
    [apiFetch, API_BASE_URL]
  );

  const getControlStock = useCallback(
    async (ean13) => {
      const payload = { ean13 };
      const data = await apiFetch(`${API_BASE_URL}/get_controll_stock_filtered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return Array.isArray(data) ? data : [];
    },
    [apiFetch, API_BASE_URL]
  );

  return { searchProducts, getControlStock };
}

