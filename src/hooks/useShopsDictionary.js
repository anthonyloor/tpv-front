import { useState, useEffect } from "react";
import { useApiFetch } from "../components/utils/useApiFetch";

export const useShopsDictionary = () => {
  const apiFetch = useApiFetch();
  const [shopsDict, setShopsDict] = useState({});

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await apiFetch("https://apitpv.anthonyloor.com/shops", { method: "GET" });
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
  }, [apiFetch]);

  return shopsDict;
};
