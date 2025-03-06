import { useState } from "react";
import { toast } from "sonner";

const useProductSearch = ({
  apiFetch,
  shopId,
  allowOutOfStockSales,
  onAddProduct,
  onAddDiscount,
}) => {
  const [groupedProducts, setGroupedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productToConfirm, setProductToConfirm] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Función para agrupar productos por nombre
  const groupProductsByProductName = (products) => {
    const validProducts = products.filter(
      (product) =>
        product.id_product_attribute !== null ||
        product.ean13_combination !== null ||
        product.ean13_combination_0 !== null
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
      product_name: `${product.product_name} ${product.combination_name}`,
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
        if (client && data.id_customer && client.id_customer !== data.id_customer) {
          alert("Vale descuento no válido, motivo: no pertenece al cliente seleccionado");
          return;
        }
        if (data && onAddDiscount) {
          const discObj = {
            name: data.name || "",
            description: data.description || "",
            code: data.code || "",
            reduction_amount: data.reduction_amount || 0,
            reduction_percent: data.reduction_percent || 0,
          };
          onAddDiscount(discObj);
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
        const results = await apiFetch(
          `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
            searchTerm
          )}`,
          { method: "GET" }
        );
        const validResults = results.filter(
          (product) =>
            product.id_product_attribute !== null ||
            product.ean13_combination !== null ||
            product.ean13_combination_0 !== null
        );
        const filteredForCurrentShop = validResults.filter(
          (product) => product.id_shop === shopId
        );
        const groups = groupProductsByProductName(validResults);
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
        const results = await apiFetch(
          `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
            eanCode
          )}`,
          { method: "GET" }
        );
        const validResults = results.filter(
          (p) =>
            (p.ean13_combination === eanCode ||
              p.ean13_combination_0 === eanCode) &&
            `${p.id_control_stock}` === controlId
        );
        if (validResults.length === 1) {
          addProductToCart(validResults[0]);
          setGroupedProducts([]);
        } else {
          const groups = groupProductsByProductName(validResults);
          setGroupedProducts(groups);
        }
      } catch (error) {
        console.error("Error en la búsqueda por EAN13 con apóstrofe:", error);
        alert("Error al buscar producto por EAN13 con apóstrofe. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Búsqueda normal
    setIsLoading(true);
    try {
      const results = await apiFetch(
        `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
          searchTerm
        )}`,
        { method: "GET" }
      );
      const validResults = results.filter(
        (product) =>
          product.id_product_attribute !== null ||
          product.ean13_combination !== null ||
          product.ean13_combination_0 !== null
      );
      const groups = groupProductsByProductName(validResults);
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

  return {
    groupedProducts,
    isLoading,
    confirmModalOpen,
    productToConfirm,
    handleSearch,
    addProductToCart,
    handleCancelAdd,
    handleConfirmAdd,
  };
};

export default useProductSearch;