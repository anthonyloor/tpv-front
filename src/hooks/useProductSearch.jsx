import { useState } from "react";
import { toast } from "sonner";
import getApiBaseUrl from "../utils/getApiBaseUrl";

// Funciones helper agregadas para refactorizar el filtrado
const isValidProduct = (product) =>
  (product.ean13_combination !== null ||
    product.ean13_combination_0 !== null) &&
  product.id_product_attribute !== null;

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
      let groupKey;
      if (strategy === "idcontrolstock") {
        groupKey = `${product.id_product_attribute}_${product.id_control_stock}`;
      } else {
        groupKey = `${product.id_product_attribute}`;
      }
      let group = acc.find((grp) => grp.groupKey === groupKey);
      if (group) {
        if (strategy !== "idcontrolstock") {
          let combination = group.combinations.find(
            (comb) => comb.id_control_stock === product.id_control_stock
          );
          if (combination) {
            combination.stocks.push(productStock);
          } else {
            group.combinations.push({
              ...product,
              stocks: [productStock],
            });
          }
        } else {
          group.combinations[0].stocks.push(productStock);
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
      toast.error("Sin stock disponible. No se permite la venta sin stock.");
      return;
    }
    const productForCart = {
      id_product: product.id_product,
      id_product_attribute: product.id_product_attribute,
      id_stock_available: currentShopStock.id_stock_available,
      product_name: product.product_name,
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
        toast.success("Producto añadido al ticket");
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
        // Leer el carrito para calcular el total actual
        let currentCartTotal = 0;
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

    // Expresiones regulares para EAN13
    const ean13Regex = /^\d{13}$/;
    const ean13ApostropheRegex = /^(\d{13})(\d+)$/;

    // Caso búsqueda por EAN13
    if (ean13Regex.test(searchTerm)) {
      setIsLoading(true);
      try {
        // Cambiado: enviar JSON en lugar de query param
        const payload = {
          search_term: searchTerm,
          id_default_group: selectedClient.id_default_group,
        };
        let results = await apiFetch(`${API_BASE_URL}/product_search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        let validResults = results
          .filter(
            (product) =>
              product.ean13_combination !== null ||
              product.ean13_combination_0 !== null
          )
          .map((product) => {
            const { id_control_stock, active_control_stock, ...rest } = product;
            return rest;
          });
        const uniqueMap = new Map();
        validResults = validResults.filter((product) => {
          const key = `${product.id_product}_${product.id_product_attribute}_${product.id_stock_available}_${product.id_shop}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, true);
            return true;
          }
          return false;
        });

        console.log("EAN13 search - valid results filtrados:", validResults);
        const filteredForCurrentShop = filterProductsForShop(
          validResults,
          shopId
        );
        console.log(
          "EAN13 search - filtered for current shop (shopId:",
          shopId,
          "):",
          filteredForCurrentShop
        );
        const groups = groupProductsByProductName(
          filteredForCurrentShop,
          "ean"
        );
        console.log("EAN13 search - grouped products:", groups);
        if (filteredForCurrentShop.length === 1 && !forStock) {
          addProductToCart(filteredForCurrentShop[0]);
          setGroupedProducts([]);
        }
        return groups;
      } catch (error) {
        console.error("Error en la búsqueda por EAN13:", error);
        alert("Error al buscar producto por EAN13. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Caso búsqueda por EAN13 con apóstrofe
    if (ean13ApostropheRegex.test(searchTerm)) {
      setIsLoading(true);
      try {
        const [, eanCode, controlId] = searchTerm.match(ean13ApostropheRegex);
        // Cambiado: enviar JSON en lugar de query param
        const payload = {
          search_term: eanCode,
          id_default_group: selectedClient.id_default_group,
        };
        let results = await apiFetch(`${API_BASE_URL}/product_search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (results.length === 0) {
          toast.error("Producto no encontrado.");
          return;
        }
        console.log("EAN13 apostrophe search - results:", results);
        let validResults = results.filter(
          (p) => Number(p.id_control_stock) === Number(controlId)
        );
        if (validResults.length === 0 && results.length > 0) {
          toast.error("ID control stock no existe.");
          return;
        }
        console.log(
          "EAN13 apostrophe search - validResults tras filtrado:",
          validResults
        );
        const filteredForCurrentShop = filterProductsForShop(
          validResults,
          shopId
        );
        console.log(
          "EAN13 apostrophe - filtered for current shop:",
          filteredForCurrentShop
        );
        const prod = groupProductsByProductName(
          filteredForCurrentShop,
          "idcontrolstock"
        );
        if (
          filteredForCurrentShop.length === 1 &&
          filteredForCurrentShop[0].active_control_stock
        ) {
          addProductToCart(filteredForCurrentShop[0]);
          setGroupedProducts([]);
          return prod;
        } else if (validResults.length > 0) {
          if (validResults[0].active_control_stock) {
            // Mostrar modal/dialog de venta de producto en tienda distinta (control stock activo)
            setForeignProductCandidate(validResults[0]);
            setForeignConfirmDialogOpen(true);
            setGroupedProducts([]);
          } else {
            // Mostrar dialog de confirmación: "Producto con etiqueta ya vendida. ¿deseas venderlo?"
            console.log(validResults[0]);
            setSoldLabelProductCandidate(validResults[0]);
            setSoldLabelConfirmDialogOpen(true);
            setGroupedProducts([]);
          }
        } else {
          const groups = groupProductsByProductName(
            filteredForCurrentShop,
            "apostrophe"
          );
          console.log("EAN13 apostrophe search - grouped products:", groups);
          setGroupedProducts(groups);
          return groups;
        }
      } catch (error) {
        console.error("Error en la búsqueda por EAN13 con apóstrofe:", error);
        alert(
          "Error al buscar producto por EAN13 con apóstrofe. Inténtalo de nuevo."
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Búsqueda normal
    setIsLoading(true);
    try {
      // Cambiado: enviar JSON en lugar de query param
      const payload = {
        search_term: searchTerm,
        id_default_group: selectedClient.id_default_group,
      };
      let results = await apiFetch(`${API_BASE_URL}/product_search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let validResults = results.filter(isValidProduct);
      console.log("Búsqueda normal - valid results filtrados:", validResults);
      if (forEan13) {
        const groups = groupProductsByProductName(validResults, "ean");
        console.log("Búsqueda normal - grouped products:", groups);
        setGroupedProducts(groups);
        return groups;
      } else {
        const filteredForCurrentShop = filterProductsForShop(
          validResults,
          shopId
        );
        console.log(
          "Búsqueda normal - filtered for current shop (shopId:",
          shopId,
          "):",
          filteredForCurrentShop
        );
        const groups = groupProductsByProductName(
          filteredForCurrentShop,
          "ean"
        );
        console.log("Búsqueda normal - grouped products:", groups);
        setGroupedProducts(groups);
        return groups;
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      alert("Error al buscar productos. Inténtalo de nuevo más tarde.");
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
      toast.success("Producto sin stock añadido al ticket");
      setConfirmModalOpen(false);
      setProductToConfirm(null);
    }
  };

  // NUEVAS funciones para el diálogo de confirmación de productos de otra tienda
  const handleForeignConfirmAdd = () => {
    if (foreignProductCandidate) {
      addProductToCart(foreignProductCandidate);
      toast.success("Producto añadido al ticket");
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
      toast.success("Producto con etiqueta ya vendida añadido al ticket");
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
  };
};

export default useProductSearch;
