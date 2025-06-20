import { useDictionary } from "./useDictionary";

export const useEmployeesDictionary = () =>
  useDictionary("employees", "id_employee", "employee_name");

