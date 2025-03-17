import { useState, useEffect } from "react";
import { useApiFetch } from "../utils/useApiFetch";
import getApiBaseUrl from "../utils/getApiBaseUrl";

export const useShopsDictionary = () => {
  const apiFetch = useApiFetch();
  const [shopsDict, setShopsDict] = useState({});
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await apiFetch(`${API_BASE_URL}/shops`, { method: "GET" });
        if (Array.isArray(data)) {
          const dict = {};
          data.forEach((shop) => {
            dict[shop.id_shop] = shop.name;
          });
          setShopsDict(dict);
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
      }
    };
    fetchShops();
  }, [apiFetch, API_BASE_URL]);

  return shopsDict;
};
