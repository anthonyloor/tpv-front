import { useState, useRef } from "react";
import getApiBaseUrl from "../utils/getApiBaseUrl";
import { playSound } from "../utils/playSound";

const isValidProduct = (product) =>
  product.ean13_combination !== null || product.ean13_combination_0 !== null;

const filterProductsForShop = (products, shopId) => {
  if (shopId === "all") return products;
  return products.filter(
    (product) => Number(product.id_shop) === Number(shopId)
  );
};

const groupProducts = (products) => {
  const validProducts = products.filter(isValidProduct);
  return validProducts.reduce((acc, product) => {
    const productStock = {
      shop_name: product.shop_name,
      id_shop: product.id_shop,
      quantity: product.quantity,
      id_stock_available: product.id_stock_available,
    };
    const groupKey = `${product.id_product_attribute || product.id_product}`;
    let group = acc.find((g) => g.groupKey === groupKey);
    if (group) {
      let combination = group.combinations.find(
        (c) =>
          c.id_product_attribute === product.id_product_attribute &&
          c.id_product === product.id_product
      );
      if (combination) {
        const existingStock = combination.stocks.find(
          (s) => s.id_stock_available === productStock.id_stock_available
        );
        if (!existingStock) {
          combination.stocks.push(productStock);
        }
      } else {
        group.combinations.push({ ...product, stocks: [productStock] });
      }
    } else {
      acc.push({
        groupKey,
        product_name: product.product_name,
        image_url: product.image_url,
        combinations: [{ ...product, stocks: [productStock] }],
      });
    }
    return acc;
  }, []);
};

const useProductSearchOptimized = ({
  apiFetch,
  shopId,
  allowOutOfStockSales,
  onAddProduct,
  onAddDiscount,
  idProfile,
  selectedClient,
}) => {
  const [groupedProducts, setGroupedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productToConfirm, setProductToConfirm] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const API_BASE_URL = getApiBaseUrl();
  const toast = useRef(null);

  const fetchProducts = async (payload) => {
    const results = await apiFetch(`${API_BASE_URL}/product_search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return results.map((p) => ({
      ...p,
      id_product_attribute: p.id_product_attribute || 0,
    }));
  };

  const fetchControlStock = async (ean13) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/get_controll_stock_filtered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ean13 }),
      });
      return Array.isArray(res) ? res : [];
    } catch (err) {
      if (err.status === 404) return [];
      throw err;
    }
  };

  const attachControlStock = async (groups) => {
    const uniqueEans = new Set();
    groups.forEach((g) =>
      g.combinations.forEach((c) => {
        const ean = c.id_product_attribute
          ? c.ean13_combination
          : c.ean13_combination_0;
        if (ean) uniqueEans.add(ean);
      })
    );

    const controlData = {};
    await Promise.all(
      Array.from(uniqueEans).map(async (ean) => {
        controlData[ean] = await fetchControlStock(ean);
      })
    );

    groups.forEach((g) => {
      g.combinations.forEach((c) => {
        const ean = c.id_product_attribute
          ? c.ean13_combination
          : c.ean13_combination_0;
        const controls = controlData[ean] || [];
        controls.forEach((ctrl) => {
          const stock = c.stocks.find(
            (s) => Number(s.id_shop) === Number(ctrl.id_shop)
          );
          if (stock) {
            stock.control_stock = stock.control_stock || [];
            stock.control_stock.push({
              id_control_stock: ctrl.id_control_stock,
              active_control_stock: ctrl.active,
            });
          }
        });
      });
    });
    return groups;
  };

  const addProductToCart = (product) => {
    let currentShopStock = null;
    if (Array.isArray(product.stocks)) {
      currentShopStock = product.stocks.find(
        (stock) => stock.id_shop === shopId
      );
    } else {
      currentShopStock = {
        shop_name: product.shop_name,
        id_shop: product.id_shop,
        quantity: product.quantity,
        id_stock_available: product.id_stock_available,
      };
    }
    const stockQuantity = currentShopStock ? currentShopStock.quantity : 0;
    if (!allowOutOfStockSales && stockQuantity <= 0) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Sin stock disponible. No se permite la venta sin stock.",
      });
      return;
    }
    const productForCart = {
      id_product: product.id_product,
      id_product_attribute: product.id_product_attribute,
      id_stock_available: currentShopStock.id_stock_available,
      product_name: product.combination_name
        ? `${product.reference_combination} - ${product.combination_name}`
        : product.product_name,
      combination_name: product.combination_name,
      reference_combination: product.reference_combination,
      ean13_combination: product.id_product_attribute
        ? product.ean13_combination
        : product.ean13_combination_0,
      price_incl_tax: product.price,
      final_price_incl_tax: product.price,
      image_url: product.image_url,
      quantity: 1,
      shop_name: product.shop_name,
      id_shop: shopId,
      id_control_stock: product.id_control_stock,
    };

    onAddProduct(productForCart, stockQuantity, (exceedsStock) => {
      if (exceedsStock) {
        setProductToConfirm(productForCart);
        setConfirmModalOpen(true);
      } else {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Producto añadido al ticket.",
        });
        playSound("success");
      }
    });
  };

  const handleSearch = async (searchTerm) => {
    if (!searchTerm) {
      setGroupedProducts([]);
      return;
    }
    setIsLoading(true);
    try {
      const ean13Regex = /^\d{13}$/;
      const ean13Apos = /^(\d{13})(\d+)$/;
      if (ean13Regex.test(searchTerm)) {
        const payload = {
          search_term: searchTerm,
          id_default_group: selectedClient.id_default_group,
        };
        let results = await fetchProducts(payload);
        const filtered = filterProductsForShop(results, shopId);
        let groups = groupProducts(filtered);
        setGroupedProducts(groups);
        groups = await attachControlStock(groups);
        setGroupedProducts([...groups]);
        if (filtered.length === 1) {
          addProductToCart(filtered[0]);
          setGroupedProducts([]);
        }
        return groups;
      }
      if (ean13Apos.test(searchTerm)) {
        const [, eanCode, controlId] = searchTerm.match(ean13Apos);
        const payload = {
          search_term: eanCode,
          id_default_group: selectedClient.id_default_group,
        };
        const results = await fetchProducts(payload);
        const controls = await fetchControlStock(eanCode);
        const match = controls.find(
          (c) => Number(c.id_control_stock) === Number(controlId)
        );
        if (!match) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "ID control stock no existe.",
          });
          playSound("error");
          return;
        }
        const prod = results.find(
          (p) =>
            Number(p.id_product) === Number(match.id_product) &&
            Number(p.id_product_attribute) ===
              Number(match.id_product_attribute) &&
            Number(p.id_shop) === Number(match.id_shop)
        );
        if (!prod) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Producto no encontrado.",
          });
          playSound("error");
          return;
        }
        prod.id_control_stock = match.id_control_stock;
        prod.active_control_stock = match.active;
        const groups = groupProducts([prod]);
        attachControlStock(groups); // ensures stock added
        if (match.active) {
          addProductToCart(prod);
          setGroupedProducts([]);
          return groups;
        } else {
          setGroupedProducts(groups);
          return groups;
        }
      }
      const payload = {
        search_term: searchTerm,
        id_default_group: selectedClient.id_default_group,
      };
      const results = await fetchProducts(payload);
      const filtered = filterProductsForShop(results, shopId);
      let groups = groupProducts(filtered);
      setGroupedProducts(groups);
      groups = await attachControlStock(groups);
      setGroupedProducts([...groups]);
      return groups;
    } catch (error) {
      console.error("Error en la búsqueda optimizada:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setConfirmModalOpen(false);
    setProductToConfirm(null);
  };

  const handleConfirmAdd = () => {
    if (productToConfirm) {
      onAddProduct(productToConfirm, null, null, true, 1);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto sin stock añadido al ticket.",
      });
      playSound("success");
      setConfirmModalOpen(false);
      setProductToConfirm(null);
    }
  };

  return {
    groupedProducts,
    isLoading,
    confirmModalOpen,
    productToConfirm,
    handleSearch,
    addProductToCart,
    handleCancelAdd,
    handleConfirmAdd,
    toast,
  };
};

export default useProductSearchOptimized;
