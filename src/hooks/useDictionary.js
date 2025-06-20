import { useState, useEffect } from "react";
import { useApiFetch } from "../utils/useApiFetch";
import getApiBaseUrl from "../utils/getApiBaseUrl";

/**
 * Generic hook to fetch a dictionary of entities.
 * @param {string} endpoint API endpoint suffix without base URL.
 * @param {string} keyProp Object property to use as dictionary key.
 * @param {string} valueProp Object property to use as dictionary value.
 */
export const useDictionary = (endpoint, keyProp, valueProp) => {
  const apiFetch = useApiFetch();
  const [dict, setDict] = useState({});
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiFetch(`${API_BASE_URL}/${endpoint}`, { method: "GET" });
        if (Array.isArray(data)) {
          const newDict = {};
          data.forEach((item) => {
            newDict[item[keyProp]] = item[valueProp];
          });
          setDict(newDict);
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
      }
    };
    fetchData();
  }, [apiFetch, API_BASE_URL, endpoint, keyProp, valueProp]);

  return dict;
};

