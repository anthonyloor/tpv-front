import { useDictionary } from "./useDictionary";

export const useShopsDictionary = () =>
  useDictionary("shops", "id_shop", "name");

