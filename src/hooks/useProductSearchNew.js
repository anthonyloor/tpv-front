import { useState, useRef } from "react";
import { playSound } from "../utils/playSound";
import useProductApi from "./useProductApi";

const isValidProduct = (product) =>
  product.ean13_combination !== null || product.ean13_combination_0 !== null;

const filterProductsForShop = (products, shopId) => {
  if (shopId === "all") return products;
  return products.filter((p) => Number(p.id_shop) === Number(shopId));
};

export default function useProductSearchNew({
  shopId,
  allowOutOfStockSales,
  onAddProduct,
  onAddDiscount,
  selectedClient,
}) {
  const { searchProducts, getControlStock } = useProductApi();
  const [groupedProducts, setGroupedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productToConfirm, setProductToConfirm] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [foreignConfirmDialogOpen, setForeignConfirmDialogOpen] = useState(false);
  const [foreignProductCandidate, setForeignProductCandidate] = useState(null);
  const [soldLabelConfirmDialogOpen, setSoldLabelConfirmDialogOpen] = useState(false);
  const [soldLabelProductCandidate, setSoldLabelProductCandidate] = useState(null);
  const toast = useRef(null);

  const groupProductsByName = (products) => {
    const valid = products.filter(isValidProduct);
    return valid.reduce((acc, prod) => {
      const key = `${prod.id_product_attribute || prod.id_product}`;
      const stock = {
        shop_name: prod.shop_name,
        id_shop: prod.id_shop,
        quantity: prod.quantity,
        id_stock_available: prod.id_stock_available,
      };
      if (prod.id_control_stock) {
        stock.control_stock = stock.control_stock || [];
        stock.control_stock.push({
          id_control_stock: prod.id_control_stock,
          active_control_stock: prod.active_control_stock,
        });
      }
      let group = acc.find((g) => g.groupKey === key);
      if (!group) {
        acc.push({
          groupKey: key,
          product_name: prod.product_name,
          image_url: prod.image_url,
          combinations: [ { ...prod, stocks: [stock] } ],
        });
      } else {
        let combo = group.combinations.find(
          (c) => c.id_product_attribute === prod.id_product_attribute && c.id_product === prod.id_product
        );
        if (!combo) {
          group.combinations.push({ ...prod, stocks: [stock] });
        } else {
          const exist = combo.stocks.find((s) => s.id_stock_available === stock.id_stock_available);
          if (exist) {
            exist.control_stock = [...(exist.control_stock || []), ...(stock.control_stock || [])];
          } else {
            combo.stocks.push(stock);
          }
        }
      }
      return acc;
    }, []);
  };

  const addProductToCart = (product) => {
    let currentStock = null;
    if (Array.isArray(product.stocks)) {
      currentStock = product.stocks.find((s) => s.id_shop === shopId);
    } else {
      currentStock = {
        shop_name: product.shop_name,
        id_shop: product.id_shop,
        quantity: product.quantity,
        id_stock_available: product.id_stock_available,
      };
    }

    const stockQty = currentStock ? currentStock.quantity : 0;
    if (!allowOutOfStockSales && stockQty <= 0) {
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
      id_stock_available: currentStock.id_stock_available,
      product_name: product.combination_name
        ? `${product.reference_combination} - ${product.combination_name}`
        : product.product_name,
      combination_name: product.combination_name,
      reference_combination: product.reference_combination,
      ean13_combination: product.id_product_attribute ? product.ean13_combination : product.ean13_combination_0,
      price_incl_tax: product.price,
      final_price_incl_tax: product.price,
      image_url: product.image_url,
      quantity: 1,
      shop_name: product.shop_name,
      id_shop: shopId,
      id_control_stock: product.id_control_stock,
    };

    onAddProduct(productForCart, stockQty, (exceeds) => {
      if (exceeds) {
        setProductToConfirm(productForCart);
        setConfirmModalOpen(true);
      } else {
        toast.current.show({ severity: "success", summary: "Éxito", detail: "Producto añadido al ticket." });
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
      const ean13ApostropheRegex = /^(\d{13})(\d+)$/;

      if (ean13ApostropheRegex.test(searchTerm)) {
        const [, eanCode, controlId] = searchTerm.match(ean13ApostropheRegex);
        const products = await searchProducts(eanCode, selectedClient.id_default_group);
        const controls = await getControlStock(eanCode);
        const matched = controls.find((c) => String(c.id_control_stock) === controlId);
        if (!matched) {
          toast.current.show({ severity: "error", summary: "Error", detail: "ID control stock no existe." });
          playSound("error");
          return;
        }
        const prod = products.find(
          (p) => Number(p.id_product) === Number(matched.id_product) &&
                  Number(p.id_product_attribute) === Number(matched.id_product_attribute)
        );
        if (!prod) {
          toast.current.show({ severity: "error", summary: "Error", detail: "Producto no encontrado." });
          playSound("error");
          return;
        }
        prod.id_control_stock = matched.id_control_stock;
        prod.active_control_stock = matched.active;
        const filtered = filterProductsForShop([prod], shopId);
        const groups = groupProductsByName(filtered);
        if (filtered.length === 1 && matched.active) {
          addProductToCart(filtered[0]);
          setGroupedProducts([]);
          return groups;
        }
        if (!matched.active) {
          setSoldLabelProductCandidate(filtered[0]);
          setSoldLabelConfirmDialogOpen(true);
          setGroupedProducts([]);
          return;
        }
        setGroupedProducts(groups);
        return groups;
      }

      const products = await searchProducts(searchTerm, selectedClient.id_default_group);
      const valid = products.map((p) => ({ ...p, id_product_attribute: p.id_product_attribute || 0 }));
      const filtered = filterProductsForShop(valid.filter(isValidProduct), shopId);
      const groups = groupProductsByName(filtered);
      if (filtered.length === 1 && ean13Regex.test(searchTerm)) {
        addProductToCart(filtered[0]);
        setGroupedProducts([]);
      } else {
        setGroupedProducts(groups);
      }
      return groups;
    } catch (err) {
      console.error("Error en la búsqueda de productos:", err);
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
      toast.current.show({ severity: "success", summary: "Éxito", detail: "Producto sin stock añadido al ticket." });
      playSound("success");
      setConfirmModalOpen(false);
      setProductToConfirm(null);
    }
  };

  const handleForeignConfirmAdd = () => {
    if (foreignProductCandidate) {
      addProductToCart(foreignProductCandidate);
      toast.current.show({ severity: "success", summary: "Éxito", detail: "Producto añadido al ticket." });
      playSound("success");
      setForeignConfirmDialogOpen(false);
      setForeignProductCandidate(null);
    }
  };

  const handleForeignCancelAdd = () => {
    setForeignConfirmDialogOpen(false);
    setForeignProductCandidate(null);
  };

  const handleSoldLabelConfirmAdd = () => {
    if (soldLabelProductCandidate) {
      addProductToCart(soldLabelProductCandidate);
      toast.current.show({ severity: "success", summary: "Éxito", detail: "Producto con etiqueta ya vendida añadido al ticket." });
      setSoldLabelConfirmDialogOpen(false);
      setSoldLabelProductCandidate(null);
    }
  };

  const handleSoldLabelCancelAdd = () => {
    setSoldLabelConfirmDialogOpen(false);
    setSoldLabelProductCandidate(null);
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
    foreignConfirmDialogOpen,
    foreignProductCandidate,
    handleForeignConfirmAdd,
    handleForeignCancelAdd,
    soldLabelConfirmDialogOpen,
    soldLabelProductCandidate,
    handleSoldLabelConfirmAdd,
    handleSoldLabelCancelAdd,
    toast,
  };
}

