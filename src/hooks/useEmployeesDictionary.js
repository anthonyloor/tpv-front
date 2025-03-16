import { useState, useEffect } from "react";
import { useApiFetch } from "../components/utils/useApiFetch";

export const useEmployeesDictionary = () => {
  const apiFetch = useApiFetch();
  const [employeesDict, setEmployeesDict] = useState({});

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await apiFetch(
          "https://apitpv.anthonyloor.com/employees",
          { method: "GET" }
        );
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
  }, [apiFetch]);

  return employeesDict;
};
