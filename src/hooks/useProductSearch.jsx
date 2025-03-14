import { useState } from "react";
import { toast } from "sonner";

const useProductSearch = ({
  apiFetch,
  shopId,
  allowOutOfStockSales,
  onAddProduct,
  onAddDiscount,
  idProfile,
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

  // Función para agrupar productos por nombre
  const groupProductsByProductName = (products) => {
    console.log("Agrupando productos. Productos recibidos:", products);
    const validProducts = products.filter(
      (product) =>
        (product.ean13_combination !== null ||
          product.ean13_combination_0 !== null) &&
        product.id_product_attribute !== null
    );
    return validProducts.reduce((acc, product) => {
      const existingGroup = acc.find(
        (group) => group.product_name === product.product_name
      );
      const productStock = {
        shop_name: product.shop_name,
        id_shop: product.id_shop,
        quantity: product.quantity,
        id_stock_available: product.id_stock_available,
      };
      if (existingGroup) {
        const existingCombination = existingGroup.combinations.find(
          (combination) =>
            combination.id_product_attribute === product.id_product_attribute
        );
        if (existingCombination) {
          existingCombination.stocks.push(productStock);
        } else {
          existingGroup.combinations.push({
            ...product,
            stocks: [productStock],
          });
        }
      } else {
        acc.push({
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
  const handleSearch = async (searchTerm) => {
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
          `https://apitpv.anthonyloor.com/get_cart_rule?code=${encodeURIComponent(
            code
          )}`,
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
    const ean13ApostropheRegex = /^(\d{13})'(\d+)$/;

    // Caso búsqueda por EAN13
    if (ean13Regex.test(searchTerm)) {
      setIsLoading(true);
      try {
        let results = await apiFetch(
          `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
            searchTerm
          )}`,
          { method: "GET" }
        );
        let validResults = results.filter(
          (product) =>
            (product.ean13_combination !== null ||
              product.ean13_combination_0 !== null) &&
            product.id_product_attribute !== null
        );
        if (idProfile !== 1) {
          validResults = validResults.filter(
            (product) => product.id_shop !== 1
          );
        }
        validResults = validResults.map((product) => {
          const { id_control_stock, ...rest } = product;
          return rest;
        });
        console.log("EAN13 search - valid results filtrados:", validResults);
        const filteredForCurrentShop = validResults.filter(
          (product) => product.id_shop === shopId
        );
        console.log(
          "EAN13 search - filtered for current shop (shopId:",
          shopId,
          "):",
          filteredForCurrentShop
        );
        const groups = groupProductsByProductName(filteredForCurrentShop);
        console.log("EAN13 search - grouped products:", groups);
        setGroupedProducts(groups);
        if (filteredForCurrentShop.length === 1) {
          addProductToCart(filteredForCurrentShop[0]);
          setGroupedProducts([]);
        }
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
        let results = await apiFetch(
          `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
            eanCode
          )}`,
          { method: "GET" }
        );
        console.log("EAN13 apostrophe search - results:", results);
        let validResults = results.filter(
          (p) =>
            (p.ean13_combination === eanCode ||
              p.ean13_combination_0 === eanCode) &&
            `${p.id_control_stock}` === controlId
        );
        if (validResults.length === 0) {
          toast.error("Este producto no existe.");
          return;
        }
        if (idProfile !== 1) {
          validResults = validResults.filter(
            (product) => product.id_shop !== 1
          );
        }
        console.log(
          "EAN13 apostrophe search - validResults tras filtrado:",
          validResults
        );
        const filteredForCurrentShop = validResults.filter(
          (product) => product.id_shop === shopId
        );
        console.log(
          "EAN13 apostrophe - filtered for current shop:",
          filteredForCurrentShop
        );
        if (
          filteredForCurrentShop.length === 1 &&
          filteredForCurrentShop[0].active_control_stock
        ) {
          addProductToCart(filteredForCurrentShop[0]);
          setGroupedProducts([]);
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
          const groups = groupProductsByProductName(filteredForCurrentShop);
          console.log("EAN13 apostrophe search - grouped products:", groups);
          setGroupedProducts(groups);
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
      let results = await apiFetch(
        `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
          searchTerm
        )}`,
        { method: "GET" }
      );
      let validResults = results.filter(
        (product) =>
          (product.ean13_combination !== null ||
            product.ean13_combination_0 !== null) &&
          product.id_product_attribute !== null
      );
      console.log("Búsqueda normal - valid results:", validResults);
      if (idProfile !== 1) {
        validResults = validResults.filter((product) => product.id_shop !== 1);
      }
      console.log("Búsqueda normal - valid results filtrados:", validResults);
      const filteredForCurrentShop = validResults.filter(
        (product) => product.id_shop === shopId
      );
      console.log(
        "Búsqueda normal - filtered for current shop (shopId:",
        shopId,
        "):",
        filteredForCurrentShop
      );
      const groups = groupProductsByProductName(filteredForCurrentShop);
      console.log("Búsqueda normal - grouped products:", groups);
      setGroupedProducts(groups);
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
    let response = await apiFetch(
      "https://apitpv.anthonyloor.com/get_product_price_tag",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
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
