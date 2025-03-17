import { useState, useEffect } from "react";
import { useApiFetch } from "../utils/useApiFetch";
import getApiBaseUrl from "../utils/getApiBaseUrl";

export const useEmployeesDictionary = () => {
  const apiFetch = useApiFetch();
  const [employeesDict, setEmployeesDict] = useState({});
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await apiFetch(`${API_BASE_URL}/employees`, {
          method: "GET",
        });
        if (Array.isArray(data)) {
          const dict = {};
          data.forEach((emp) => {
            dict[emp.id_employee] = emp.employee_name;
          });
          setEmployeesDict(dict);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, [apiFetch, API_BASE_URL]);

  return employeesDict;
};
