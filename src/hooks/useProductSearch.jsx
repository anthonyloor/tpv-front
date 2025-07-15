import { useState, useRef } from "react";
import getApiBaseUrl from "../utils/getApiBaseUrl";
import { playSound } from "../utils/playSound";

// Funciones helper agregadas para refactorizar el filtrado
const isValidProduct = (product) =>
  product.ean13_combination !== null || product.ean13_combination_0 !== null;

const filterProductsForShop = (products, shopId) => {
  console.log("Filtrando productos para la tienda:", shopId);
  if (shopId === "all") return products;
  return products.filter(
    (product) => Number(product.id_shop) === Number(shopId)
  );
};

const useProductSearch = ({
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
  const [foreignConfirmDialogOpen, setForeignConfirmDialogOpen] =
    useState(false);
  const [foreignProductCandidate, setForeignProductCandidate] = useState(null);
  const [soldLabelConfirmDialogOpen, setSoldLabelConfirmDialogOpen] =
    useState(false);
  const [soldLabelProductCandidate, setSoldLabelProductCandidate] =
    useState(null);
  const API_BASE_URL = getApiBaseUrl();
  const toast = useRef(null);

  const groupProductsByProductName = (products, strategy = "ean") => {
    console.log("Agrupando productos. Productos recibidos:", products);
    const validProducts = products.filter(isValidProduct);
    return validProducts.reduce((acc, product) => {
      const productStock = {
        shop_name: product.shop_name,
        id_shop: product.id_shop,
        quantity: product.quantity,
        id_stock_available: product.id_stock_available,
      };
      if (product.id_control_stock) {
        productStock.control_stock = productStock.control_stock || [];
        productStock.control_stock.push({
          id_control_stock: product.id_control_stock,
          active_control_stock: product.active_control_stock,
        });
      }
      const groupKey = `${product.id_product_attribute || product.id_product}`;
      let group = acc.find((grp) => grp.groupKey === groupKey);
      if (group) {
        let combination = group.combinations.find(
          (comb) =>
            comb.id_product_attribute === product.id_product_attribute &&
            comb.id_product === product.id_product
        );
        if (combination) {
          let existingStock = combination.stocks.find(
            (stock) =>
              stock.id_stock_available === productStock.id_stock_available
          );
          if (existingStock) {
            existingStock.control_stock = [
              ...(existingStock.control_stock || []),
              ...(productStock.control_stock || []),
            ];
          } else {
            combination.stocks.push(productStock);
          }
        } else {
          group.combinations.push({
            ...product,
            stocks: [productStock],
          });
        }
      } else {
        acc.push({
          groupKey,
          product_name: product.product_name,
          image_url: product.image_url,
          combinations: [
            {
              ...product,
              stocks: [productStock],
            },
          ],
        });
      }
      return acc;
    }, []);
  };

  // Nueva función auxiliar para obtener productos (evita código duplicado)
  const fetchProducts = async (payload) => {
    let results = await apiFetch(`${API_BASE_URL}/product_search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return results.map((product) => ({
      ...product,
      id_product_attribute: product.id_product_attribute || 0,
    }));
  };

  // Obtener control stock por código de barras y actualizar groupedProducts
  const fetchControlStock = async (ean13) => {
    let list = [];
    try {
      list = await apiFetch(`${API_BASE_URL}/get_controll_stock_filtered`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ean13 }),
      });
    } catch (error) {
      if (error.status === 404) {
        list = [];
      } else {
        console.error("Error fetching control stock:", error);
        return;
      }
    }
    if (!Array.isArray(list)) list = [];
    setGroupedProducts((prev) =>
      prev.map((group) => ({
        ...group,
        combinations: group.combinations.map((comb) => {
          const code = comb.id_product_attribute
            ? comb.ean13_combination
            : comb.ean13_combination_0;
          if (code !== ean13) return comb;
          const updatedStocks = comb.stocks.map((stock) => {
            const matches = list.filter(
              (cs) => Number(cs.id_shop) === Number(stock.id_shop)
            );
            if (matches.length === 0) {
              return { ...stock, control_stock: [] };
            }
            return {
              ...stock,
              control_stock: matches.map((cs) => ({
                id_control_stock: cs.id_control_stock,
                active_control_stock: cs.active,
              })),
            };
          });
          return { ...comb, stocks: updatedStocks };
        }),
      }))
    );
  };

  // Función para agregar el producto al carrito
  const addProductToCart = (product) => {
    console.log("Product to add to cart:", product);
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

  // Función principal de búsqueda
  const handleSearch = async (
    searchTerm,
    forStock = false,
    forEan13 = false
  ) => {
    // Si es búsqueda para stock, garantizar que searchTerm tenga 13 dígitos
    if (forStock && searchTerm.length < 13) {
      searchTerm = searchTerm.padStart(13, "0");
    }
    // Agregar log para ver cuándo se invoca la búsqueda para stock
    console.log(
      "useProductSearch.handleSearch invoked. forStock:",
      forStock,
      "forEan13:",
      forEan13,
      "searchTerm:",
      searchTerm
    );
    if (!searchTerm) {
      setGroupedProducts([]);
      return;
    }

    // Caso vale descuento (inicia con "#")
    if (searchTerm.startsWith("#")) {
      setIsLoading(true);
      try {
        const code = searchTerm.slice(1);
        const data = await apiFetch(
          `${API_BASE_URL}/get_cart_rule?code=${encodeURIComponent(code)}`,
          { method: "GET" }
        );
        if (!data.active) {
          alert("Vale descuento no válido, motivo: no activo");
          return;
        }
        const client = JSON.parse(localStorage.getItem("selectedClient"));
        if (
          client &&
          data.id_customer &&
          client.id_customer !== data.id_customer
        ) {
          alert(
            "Vale descuento no válido, motivo: no pertenece al cliente seleccionado"
          );
          return;
        }
        const licenseData = JSON.parse(localStorage.getItem("licenseData"));
        const currentShopId = Number(licenseData?.id_shop);
        const allowedShops =
          data?.restrictions?.shop || data?.restrictions?.shops || [];
        if (
          Array.isArray(allowedShops) &&
          allowedShops.length > 0 &&
          !allowedShops
            .map((s) => Number(s.id_shop ?? s.id))
            .includes(currentShopId)
        ) {
          alert(
            "Vale descuento no válido, motivo: no disponible en esta tienda"
          );
          return;
        }
        // Leer el carrito para calcular el total actual
        let currentCartTotal = 0;
        const shopId = licenseData?.id_shop;
        const cartRaw = localStorage.getItem(`cart_shop_${shopId}`);
        if (cartRaw) {
          const parsedCart = JSON.parse(cartRaw);          
          if (parsedCart && parsedCart.items) {
            currentCartTotal = parsedCart.items.reduce(
              (sum, item) => sum + item.final_price_incl_tax * item.quantity,
              0
            );
          }
        }
        // Crear objeto descuento para toda la venta (global)
        const discObj = {
          name: data.name || "",
          description: data.description ? data.description + " venta" : "venta",
          code: data.code || "",
          reduction_amount: data.reduction_amount
            ? Math.min(data.reduction_amount, currentCartTotal)
            : 0,
          reduction_percent: data.reduction_percent || 0,
        };
        if (data && onAddDiscount) {
          onAddDiscount(discObj);
          // Disparar evento para actualizar el descuento global en el carrito
          window.dispatchEvent(
            new CustomEvent("globalDiscountApplied", { detail: discObj })
          );
        }
        setGroupedProducts([]);
      } catch (error) {
        console.error("Error al buscar vale descuento:", error);
        alert("Error al buscar el vale. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      // Expresiones regulares para EAN13 y EAN13 con apóstrofe
      const ean13Regex = /^\d{13}$/;
      const ean13ApostropheRegex = /^(\d{13})(\d+)$/;

      if (ean13Regex.test(searchTerm)) {
        const payload = {
          search_term: searchTerm,
          id_default_group: selectedClient.id_default_group,
        };
        let results = await fetchProducts(payload);
        let validResults = results.filter(
          (product) =>
            product.ean13_combination !== null ||
            product.ean13_combination_0 !== null
        );
        // Eliminar duplicados
        const uniqueMap = new Map();
        validResults = forStock
          ? validResults
          : validResults.filter((product) => {
              const key = `${product.id_product}_${product.id_product_attribute}_${product.id_stock_available}_${product.id_shop}`;
              if (!uniqueMap.has(key)) {
                uniqueMap.set(key, true);
                return true;
              }
              return false;
            });

        console.log("EAN13 search - resultados filtrados:", validResults);
        const filtered = filterProductsForShop(validResults, shopId);
        const groups = groupProductsByProductName(
          filtered,
          forStock ? "idcontrolstock" : "ean"
        );
        console.log("EAN13 search - grouped products:", groups);
        if (filtered.length === 1 && !forStock) {
          addProductToCart(filtered[0]);
          setGroupedProducts([]);
        }
        return groups;
      }
      if (ean13ApostropheRegex.test(searchTerm)) {
        const [, eanCode, controlId] = searchTerm.match(ean13ApostropheRegex);
        console.log(
          "EAN13 con apóstrofe - código EAN:",
          eanCode,
          "ID control stock:",
          controlId
        );
        const payload = {
          search_term: eanCode,
          id_default_group: selectedClient.id_default_group,
        };
        let results = await fetchProducts(payload);
        if (results.length === 0) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Producto no encontrado.",
          });
          playSound("error");
          return;
        }

        // Obtener la información de control stock para el EAN
        let controlList = [];
        try {
          controlList = await apiFetch(
            `${API_BASE_URL}/get_controll_stock_filtered`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ean13: eanCode }),
            }
          );
        } catch (err) {
          if (err.status === 404) {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: "ID control stock no existe.",
            });
            playSound("error");
            return;
          }
          console.error("Error fetching control stock:", err);
          playSound("error");
          return;
        }
        const matchList = Array.isArray(controlList) ? controlList : [];
        const controlMatch = matchList.find(
          (c) => Number(c.id_control_stock) === Number(controlId)
        );
        if (!controlMatch) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "ID control stock no existe.",
          });
          playSound("error");
          return;
        }

        let validResults = results.filter(
          (p) => Number(p.id_shop) === Number(controlMatch.id_shop)
        );
        validResults = validResults.map((p) => ({
          ...p,
          id_control_stock: controlMatch.id_control_stock,
          active_control_stock: controlMatch.active,
        }));

        const filtered = forEan13
          ? validResults
          : filterProductsForShop(validResults, shopId);
        const groups = groupProductsByProductName(filtered, "idcontrolstock");
        if (filtered.length === 1 && controlMatch.active) {
          addProductToCart(filtered[0]);
          setGroupedProducts([]);
          return groups;
        } else if (validResults.length > 0) {
          if (controlMatch.active) {
            setForeignProductCandidate(validResults[0]);
            setForeignConfirmDialogOpen(true);
            setGroupedProducts([]);
          } else {
            setSoldLabelProductCandidate(validResults[0]);
            setSoldLabelConfirmDialogOpen(true);
            setGroupedProducts([]);
          }
        } else {
          setGroupedProducts(groups);
          return groups;
        }
      }

      // Rama búsqueda normal
      const payload = {
        search_term: searchTerm,
        id_default_group: selectedClient.id_default_group,
      };
      let results = await fetchProducts(payload);
      let validResults = results.filter(isValidProduct);
      if (forEan13) {
        const groups = groupProductsByProductName(validResults, "ean");
        console.log("Búsqueda normal - grouped products:", groups);
        setGroupedProducts(groups);
        return groups;
      } else {
        const filtered = filterProductsForShop(validResults, shopId);
        const groups = groupProductsByProductName(filtered, "ean");
        console.log("Búsqueda normal - grouped products:", groups);
        setGroupedProducts(groups);
        return groups;
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para el modal de confirmación
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

  // NUEVAS funciones para el diálogo de confirmación de productos de otra tienda
  const handleForeignConfirmAdd = () => {
    if (foreignProductCandidate) {
      addProductToCart(foreignProductCandidate);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto añadido al ticket.",
      });
      playSound("success");
      setForeignConfirmDialogOpen(false);
      setForeignProductCandidate(null);
    }
  };

  const handleForeignCancelAdd = () => {
    setForeignConfirmDialogOpen(false);
    setForeignProductCandidate(null);
  };

  // Nuevas funciones para el diálogo de "Producto con etiqueta ya vendida. ¿deseas venderlo?"
  const handleSoldLabelConfirmAdd = () => {
    if (soldLabelProductCandidate) {
      // Usar addProductToCart para que se construya el producto correctamente
      addProductToCart(soldLabelProductCandidate);
      toast.current.show({
        severity: "success",
        summary: "Éxito",
        detail: "Producto con etiqueta ya vendida añadido al ticket.",
      });
      setSoldLabelConfirmDialogOpen(false);
      setSoldLabelProductCandidate(null);
    }
  };

  const handleSoldLabelCancelAdd = () => {
    setSoldLabelConfirmDialogOpen(false);
    setSoldLabelProductCandidate(null);
  };

  const handleConfirmQuantity = async (payload) => {
    let response = await apiFetch(`${API_BASE_URL}/get_product_price_tag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("DEBUG: Respuesta de get_product_price_tag:", response);
    let tags = [];
    if (Array.isArray(response)) {
      if (response[0].tags !== undefined) {
        tags = response[0].tags;
      } else {
        tags = response;
      }
    } else {
      if (response.printed !== undefined) {
        tags = [response];
      } else {
        tags = [];
      }
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
    handleConfirmQuantity,
    foreignConfirmDialogOpen,
    foreignProductCandidate,
    handleForeignConfirmAdd,
    handleForeignCancelAdd,
    soldLabelConfirmDialogOpen,
    soldLabelProductCandidate,
    handleSoldLabelConfirmAdd,
    handleSoldLabelCancelAdd,
    fetchControlStock,
    toast,
  };
};

export default useProductSearch;
