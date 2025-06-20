// src/components/modals/transfers/TransferForm.jsx

import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { Toast } from "primereact/toast";
import ProductSearchCardForTransfer from "./ProductSearchCardForTransfer";
import { useApiFetch } from "../../../utils/useApiFetch";
import { Steps } from "primereact/steps";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { useEmployeesDictionary } from "../../../hooks/useEmployeesDictionary";
import { FloatLabel } from "primereact/floatlabel";
import { OverlayPanel } from "primereact/overlaypanel";
import JsBarcode from "jsbarcode";
import useProductSearch from "../../../hooks/useProductSearch";
import { ClientContext } from "../../../contexts/ClientContext";
import { generatePriceLabels } from "../../../utils/generatePriceLabels";
import { formatShortDate } from "../../../utils/dateUtils";

const TransferForm = forwardRef(
  ({ type, onSave, movementData, onFooterChange }, ref) => {
    const toast = useRef(null);
    const successSoundRef = useRef(new Audio("/sounds/beep-ok.mp3"));
    const errorSoundRef = useRef(new Audio("/sounds/beep-ko.mp3"));

    const playSound = (soundType) => {
      if (soundType === "success") {
        successSoundRef.current.play().catch((err) => console.error(err));
      } else {
        errorSoundRef.current.play().catch((err) => console.error(err));
      }
    };

    const [productsToTransfer, setProductsToTransfer] = useState([]);
    const productsRef = useRef(productsToTransfer);
    useEffect(() => {
      productsRef.current = productsToTransfer;
    }, [productsToTransfer]);
    const [recentlyAddedId, setRecentlyAddedId] = useState(null);
    const [shops, setShops] = useState([]);
    const [selectedOriginStore, setSelectedOriginStore] = useState(null);
    const [selectedDestinationStore, setSelectedDestinationStore] =
      useState(null);
    const [originShopName, setOriginShopName] = useState("");
    const [destinationShopName, setDestinationShopName] = useState("");
    const [isLoadingShops, setIsLoadingShops] = useState(true);
    const [errorLoadingShops, setErrorLoadingShops] = useState(null);
    const { employeeId, shopId } = useContext(AuthContext);
    const [description, setDescription] = useState("");
    const [createDate, setCreateDate] = useState("");
    const [movementStatus, setMovementStatus] = useState("en creacion");
    const [employeeIdV, setEmployeeId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const API_BASE_URL = getApiBaseUrl();
    const { selectedClient } = useContext(ClientContext);

    const apiFetch = useApiFetch();
    const { idProfile } = useContext(AuthContext);

    const isNewMovement = !movementData;
    const currentStatus = movementData?.status || "en creacion";

    const stepItems =
      type && type.toLowerCase() === "traspaso"
        ? [
            { label: "En creacion" },
            { label: "Enviado" },
            { label: "Recibido" },
            { label: "En revision" },
            { label: "Ejecutado" },
          ]
        : [{ label: "En creacion" }, { label: "Ejecutado" }];

    const activeIndex =
      movementData && movementData.status
        ? stepItems.findIndex(
            (item) =>
              item.label.toLowerCase() === movementData.status.toLowerCase()
          )
        : 0;

    const [controlStocksState, setControlStocksState] = useState([]);
    const overlayPanelControlStock = useRef(null);

    useEffect(() => {
      const loadShops = async () => {
        try {
          setIsLoadingShops(true);
          const data = await apiFetch(`${API_BASE_URL}/shops`, {
            method: "GET",
          });
          const filteredData = data.filter((shop) => shop.id_shop !== 1);
          setShops(filteredData);
        } catch (error) {
          console.error("Error al cargar tiendas:", error);
          setErrorLoadingShops(error.message || "Error al cargar tiendas");
        } finally {
          setIsLoadingShops(false);
        }
      };
      loadShops();
    }, [apiFetch, API_BASE_URL]);

    useEffect(() => {
      if (shops.length > 0 && selectedOriginStore) {
        const shopObj = shops.find(
          (s) => String(s.id_shop) === String(selectedOriginStore)
        );
        setOriginShopName(shopObj ? shopObj.name : "");
      } else {
        setOriginShopName("");
      }
    }, [shops, selectedOriginStore]);

    useEffect(() => {
      if (shops.length > 0 && selectedDestinationStore) {
        const shopObj = shops.find(
          (s) => String(s.id_shop) === String(selectedDestinationStore)
        );
        setDestinationShopName(shopObj ? shopObj.name : "");
      } else {
        setDestinationShopName("");
      }
    }, [shops, selectedDestinationStore]);

    useEffect(() => {
      if (isNewMovement) {
        if (shopId) {
          if (type === "salida" || type === "traspaso") {
            setSelectedOriginStore(String(shopId));
          } else if (type === "entrada") {
            setSelectedDestinationStore(String(shopId));
          }
        }
      }
    }, [isNewMovement, type, shopId]);

    useEffect(() => {
      if (movementData) {
        console.log("movementData", movementData);
        setDescription(movementData.description || "");
        if (movementData.id_shop_origin) {
          setSelectedOriginStore(String(movementData.id_shop_origin));
        }
        if (movementData.id_shop_destiny) {
          setSelectedDestinationStore(String(movementData.id_shop_destiny));
        }
      }
    }, [movementData]);

    useEffect(() => {
      if (isNewMovement) {
        setCreateDate(new Date().toISOString().split("T")[0]);
        setEmployeeId(employeeId);
      } else {
        if (movementData?.date_add) {
          const onlyDate = movementData.date_add.split(" ")[0];
          setCreateDate(onlyDate);
        }
        setMovementStatus(movementData?.status || "en creacion");
        setEmployeeId(movementData?.employee);
        if (
          movementData.status &&
          movementData.status.toLowerCase() === "en revision"
        ) {
          if (Array.isArray(movementData.movement_details)) {
            const loadedProducts = movementData.movement_details.map((md) => {
              const quantity = md.sent_quantity || md.recived_quantity || 0;
              return {
                id_warehouse_movement_detail: md.id_warehouse_movement_detail,
                id_product: md.id_product,
                id_product_attribute: md.id_product_attribute,
                id_control_stock: md.id_control_stock,
                product_name: md.product_name,
                ean13: md.ean13 || "",
                quantity,
                stock_origin: md.stock_origin,
                stock_destiny: md.stock_destiny,
                recived_quantity: md.recived_quantity || 0,
                status: md.status || "revisando",
              };
            });
            setProductsToTransfer(loadedProducts);
          }
        } else if (Array.isArray(movementData.movement_details)) {
          const loadedProducts = movementData.movement_details.map((md) => {
            const quantity = md.sent_quantity || md.recived_quantity || 0;
            return {
              id_warehouse_movement_detail: md.id_warehouse_movement_detail,
              id_product: md.id_product,
              id_product_attribute: md.id_product_attribute,
              id_control_stock: md.id_control_stock,
              product_name: md.product_name,
              ean13: md.ean13 || "",
              quantity,
              stock_origin: md.stock_origin,
              stock_destiny: md.stock_destiny,
              control_stocks: md.control_stocks || [],
            };
          });
          setProductsToTransfer(loadedProducts);
        }
      }
    }, [isNewMovement, movementData, employeeId]);

    useEffect(() => {
      if (recentlyAddedId) {
        setTimeout(() => {
          const rowElement = document.querySelector("tr.animate-product");
          if (rowElement) {
            rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          setRecentlyAddedId(null);
        }, 100);
      }
    }, [recentlyAddedId]);

    const isSameStoreSelected =
      type === "traspaso" &&
      selectedOriginStore &&
      selectedDestinationStore &&
      selectedOriginStore === selectedDestinationStore;

    const canEditProducts =
      isNewMovement || movementStatus.toLowerCase() === "en creacion";

    const barcodeBodyTemplate = (rowData) => {
      if (
        type === "entrada" &&
        movementData &&
        movementData.status.toLowerCase() === "ejecutado" &&
        rowData.control_stocks &&
        rowData.control_stocks.length > 0
      ) {
        return (
          <div style={{ width: "100px" }}>
            <span>{rowData.ean13}</span>
            <i
              className="pi pi-link ml-1"
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                setControlStocksState(rowData.control_stocks);
                overlayPanelControlStock.current.toggle(e);
              }}
            />
          </div>
        );
      }
      if (rowData.id_control_stock) {
        return (
          <>
            <span style={{ width: "100px" }}>
              {rowData.ean13} - {rowData.id_control_stock}{" "}
              <i className="pi pi-link" />
            </span>
          </>
        );
      }
      return <span style={{ width: "100px" }}>{rowData.ean13}</span>;
    };

    const getNonStockKey = (product) => {
      return product.uniqueId || product.id_product_attribute;
    };

    const handleAddProduct = (product) => {
      if (!canEditProducts) return;

      setProductsToTransfer((prev) => {
        if (product.id_control_stock) {
          const exists = prev.find(
            (p) => p.id_control_stock === product.id_control_stock
          );
          if (exists) {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: "Producto con control de stock ya añadido.",
            });
            playSound("error");
            return prev;
          }
          setRecentlyAddedId(product.id_product_attribute);
          playSound("success");
          return [...prev, product];
        }
        const key = product.uniqueId || product.id_product_attribute;
        const existing = prev.find(
          (p) => !p.id_control_stock && getNonStockKey(p) === key
        );
        const maxStock = product.stock_origin;
        if (existing) {
          const newQty = existing.quantity + product.quantity;
          // ...existing logs...
          if (newQty > maxStock) {
            if (idProfile === 1) {
              toast.current.show({
                severity: "warn",
                summary: "Advertencia",
                detail: `No hay suficiente stock en origen. Se añade igualmente.`,
              });
              setRecentlyAddedId(existing.id_product_attribute);
              playSound("success");
              return prev.map((p) =>
                getNonStockKey(p) === key ? { ...p, quantity: newQty } : p
              );
            } else {
              toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "No dispones de más stock para añadir.",
              });
              playSound("error");
              return prev;
            }
          }
          setRecentlyAddedId(product.id_product_attribute);
          playSound("success");
          return prev.map((p) =>
            getNonStockKey(p) === key ? { ...p, quantity: newQty } : p
          );
        } else {
          setRecentlyAddedId(product.id_product_attribute);
          playSound("success");
          return [...prev, product];
        }
      });
    };

    const handleQuantityChange = (uniqueId, newQty) => {
      if (!canEditProducts) return;
      setProductsToTransfer((prev) => {
        const found = prev.find((p) => getNonStockKey(p) === uniqueId);
        if (!found) return prev;
        let val = parseInt(newQty, 10) || 1;
        // Sólo restringir stock si el tipo no es 'entrada'
        if (type !== "entrada") {
          const maxStock = found.stock_origin;
          if (val > maxStock) {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: "No dispones de más stock para añadir.",
            });
            return prev;
          }
        }
        return prev.map((p) =>
          getNonStockKey(p) === uniqueId ? { ...p, quantity: val } : p
        );
      });
    };

    const handleRemoveProduct = async (uniqueId) => {
      const productToRemove = productsToTransfer.find(
        (p) => getNonStockKey(p) === uniqueId
      );
      if (!canEditProducts) return;
      if (productToRemove && productToRemove.id_warehouse_movement_detail) {
        try {
          await apiFetch(`${API_BASE_URL}/delete_warehouse_movement_detail`, {
            method: "POST",
            body: JSON.stringify({
              id_warehouse_movement_detail:
                productToRemove.id_warehouse_movement_detail,
            }),
          });
        } catch (error) {
          console.error("Error al eliminar movement detail:", error);
        }
      }
      setProductsToTransfer((prev) =>
        prev.filter((p) => getNonStockKey(p) !== uniqueId)
      );
    };

    const buildMovementsDetails = (overrideStatus) => {
      const effectiveStatus = overrideStatus ? overrideStatus : movementStatus;
      let productStatus =
        effectiveStatus.toLowerCase() === "en revision"
          ? "revisando"
          : effectiveStatus.toLowerCase() === "ejecutado"
          ? "ok"
          : "creado";

      return productsRef.current.map((prod) => {
        const detail = {
          id_warehouse_movement_detail:
            prod.id_warehouse_movement_detail || null,
          id_product: prod.id_product,
          id_product_attribute: prod.id_product_attribute,
          id_control_stock: prod.id_control_stock,
          product_name: prod.product_name,
          ean13: prod.ean13 || "",
          status: prod.status || productStatus,
          stock_origin: prod.stock_origin,
          stock_destiny: prod.stock_destiny,
        };
        console.log("prod", prod);
        if (type === "entrada") {
          detail.recived_quantity = prod.quantity;
        } else if (type === "salida") {
          detail.sent_quantity = prod.quantity;
        } else if (type === "traspaso") {
          detail.sent_quantity = prod.quantity;
          detail.recived_quantity = prod.recived_quantity || 0;
        }
        console.log("detail", detail);
        console.log("Current products to transfer:", productsRef.current);
        return detail;
      });
    };

    const handleSaveCreate = async () => {
      if (isSubmitting) return;
      if (!description.trim()) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "La descripción es obligatoria.",
        });
        playSound("error");
        return;
      }
      setIsSubmitting(true);
      try {
        const payload = {
          description,
          type,
          id_employee: employeeId,
        };
        if (type === "entrada") {
          payload.id_shop_destiny = parseInt(selectedDestinationStore, 10);
        } else if (type === "salida") {
          payload.id_shop_origin = parseInt(selectedOriginStore, 10);
        } else if (type === "traspaso") {
          payload.id_shop_origin = parseInt(selectedOriginStore, 10);
          payload.id_shop_destiny = parseInt(selectedDestinationStore, 10);
        }
        payload.movements_details = buildMovementsDetails();

        await apiFetch(`${API_BASE_URL}/create_warehouse_movement`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento creado con éxito",
        });
        setTimeout(() => {
          if (onSave) onSave("created");
        }, 500);
      } catch (error) {
        console.error("Error creando movimiento:", error);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al crear el movimiento",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleUpdateMovement = async () => {
      if (isSubmitting) return;
      if (!movementData?.id_warehouse_movement) return;
      if (!description.trim()) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "La descripción es obligatoria.",
        });
        playSound("error");
        return;
      }
      setIsSubmitting(true);

      const currentDate = new Date().toLocaleString();
      const payload = {
        id_warehouse_movement: movementData.id_warehouse_movement,
        description,
        status: "En creacion",
        type: movementData.type,
        id_shop_origin: movementData.id_shop_origin,
        id_shop_destiny: movementData.id_shop_destiny,
        movement_details: buildMovementsDetails(),
        modify_reason: `${currentDate} - Movimiento actualizado a En creacion \n${
          movementData.modify_reason || ""
        }`,
      };

      try {
        await apiFetch(`${API_BASE_URL}/update_warehouse_movement`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento actualizado (En creacion).",
        });
        setTimeout(() => {
          if (onSave) onSave("updated");
        }, 500);
      } catch (error) {
        console.error("Error al actualizar movimiento:", error);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al actualizar movimiento",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleExecuteMovement = async () => {
      if (isSubmitting) return;
      if (!movementData?.id_warehouse_movement) return;
      if (!description.trim()) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "La descripción es obligatoria.",
        });
        playSound("error");
        return;
      }
      setIsSubmitting(true);

      try {
        const payload = {
          id_warehouse_movement: movementData.id_warehouse_movement,
          movement_details: buildMovementsDetails("ejecutado"),
        };
        await apiFetch(`${API_BASE_URL}/execute_warehouse_movement`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Movimiento ejecutado con éxito.",
        });
        setTimeout(() => {
          if (onSave) onSave("executed");
        }, 500);
      } catch (error) {
        console.error("Error al ejecutar movimiento:", error);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al ejecutar movimiento",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleUpdateMovementStatus = async (newStatus) => {
      if (isSubmitting) return;
      console.log("movementData", movementData);
      if (!movementData?.id_warehouse_movement) return;
      if (!description.trim()) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "La descripción es obligatoria.",
        });
        playSound("error");
        return;
      }
      setIsSubmitting(true);
      const currentDate = new Date().toLocaleString();
      const payload = {
        id_warehouse_movement: movementData.id_warehouse_movement,
        description,
        status: newStatus,
        type: movementData.type,
        id_shop_origin: movementData.id_shop_origin,
        id_shop_destiny: movementData.id_shop_destiny,
        movement_details: buildMovementsDetails(newStatus),
        modify_reason: `${currentDate} - Movimiento actualizado a ${newStatus} \n${
          movementData.modify_reason || ""
        }`,
      };

      try {
        await apiFetch(`${API_BASE_URL}/update_warehouse_movement`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: `Movimiento actualizado (estado = ${newStatus}).`,
        });
        setTimeout(() => {
          if (onSave) onSave("updated");
        }, 500);
      } catch (error) {
        console.error("Error al actualizar movimiento:", error);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al actualizar movimiento",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleRevisionScan = (selectedProducts) => {
      // Si no llega ningún producto, se muestra error.
      if (!selectedProducts || selectedProducts.length === 0) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "No se encontró el producto con el código especificado.",
        });
        playSound("error");
        return;
      }
      const prod = selectedProducts;
      if (!prod || !prod.ean13) {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "El producto no tiene EAN13 definido.",
        });
        playSound("error");
        return;
      }

      setProductsToTransfer((prev) => {
        const index = prev.findIndex((p) => {
          if (prod.id_control_stock) {
            return (
              p.ean13 === prod.ean13 &&
              p.id_control_stock === prod.id_control_stock
            );
          } else {
            return !p.id_control_stock && p.ean13 === prod.ean13;
          }
        });
        if (index >= 0) {
          const updated = [...prev];
          const currentReceived = updated[index].recived_quantity || 0;
          if (currentReceived >= updated[index].quantity) {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: "Producto ya escaneado o cantidad máxima alcanzada.",
            });
            playSound("error");
            return prev;
          } else {
            const newReceived = currentReceived + 1;
            updated[index] = {
              ...updated[index],
              recived_quantity: newReceived,
              status:
                newReceived >= updated[index].quantity
                  ? "revisado"
                  : "revisando",
            };
            console.log("Producto actualizado:", updated[index]);
            setRecentlyAddedId(updated[index].id_product_attribute);
            playSound("success");
            console.log("Producto actualizado correctamente:", updated);
            return updated;
          }
        } else {
          // Si no se encuentra, mostrar error y no se agrega el producto
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Producto no encontrado en la tabla para revisión.",
          });
          playSound("error");
          return prev;
        }
      });
      console.log("Estado actual de los productos:", productsToTransfer);
    };

    // Reemplazar la definición de handlePrintLabels por:
    const { handleSearch } = useProductSearch({
      apiFetch,
      shopId,
      allowOutOfStockSales: true,
      onAddProduct: () => {},
      idProfile,
      selectedClient,
    });
    const handlePrintLabels = async () => {
      // Filtrar productos con seguimiento
      const productsToPrint = productsToTransfer.filter(
        (detail) => detail.control_stocks && detail.control_stocks.length > 0
      );
      if (productsToPrint.length === 0) {
        toast.current.show({
          severity: "warn",
          summary: "Advertencia",
          detail: "No hay productos con seguimiento para imprimir.",
        });
        return;
      }

      // Obtener detalles para cada producto usando handleSearch
      const detailedData = await Promise.all(
        productsToPrint.map(async (detail) => {
          const groups = await handleSearch(detail.ean13);
          let productInfo = {};
          if (
            groups &&
            groups.length > 0 &&
            groups[0].combinations &&
            groups[0].combinations.length > 0
          ) {
            productInfo = groups[0].combinations[0];
            // Si product_name contiene "Victoria Secret", se elimina esa parte
            if (
              productInfo.product_name &&
              productInfo.product_name.includes("Victoria Secret")
            ) {
              productInfo.product_name = productInfo.product_name
                .replace(/Victoria Secret/g, "")
                .replace(/\s+/g, " ")
                .trim();
            }
            // Aplicar transformación al property "combination_name"
            if (productInfo.combination_name) {
              if (productInfo.combination_name.includes("2XL - 40 - Piel")) {
                productInfo.combination_name =
                  productInfo.combination_name.replace(
                    "2XL - 40 - Piel",
                    "2XL - Piel"
                  );
              }
              if (productInfo.combination_name.includes("XL - 38 - Piel")) {
                productInfo.combination_name =
                  productInfo.combination_name.replace(
                    "XL - 38 - Piel",
                    "XL - Piel"
                  );
              }
            }
          }
          return { detail, productInfo };
        })
      );

      // Nueva sección: llamar a get_product_price_tag para cada control_stock
      const payloadItems = detailedData.flatMap(({ detail, productInfo }) =>
        detail.control_stocks.map((cs) => ({
          detail,
          productInfo,
          cs,
          payload: {
            ean13: detail.ean13,
            id_control_stock: cs.id_control_stock,
          },
        }))
      );
      const responses = await Promise.all(
        payloadItems.map(({ payload, detail, productInfo, cs }) =>
          apiFetch(`${API_BASE_URL}/get_product_price_tag`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then((tagInfo) => ({ detail, productInfo, cs, tagInfo }))
        )
      );
      const tagMap = {};
      responses.forEach(({ detail, cs, tagInfo }) => {
        const key = (detail.ean13 || "") + "-" + cs.id_control_stock;
        tagMap[key] = tagInfo;
      });

      console.log("Tag map obtenido de get_product_price_tag:", tagMap);

      // Generar HTML de etiquetas usando generatePriceLabels pasando tagMap en options
      const labelsHtml = generatePriceLabels(detailedData, { tagMap });
      const pageStyle =
        "@page { size: 62mm 32mm; margin: 1mm; } body { margin: 0; }";
      const printWindow = window.open("", "_blank", "width=600,height=400");
      printWindow.document.write(`
		<html>
		  <head>
			<style>${pageStyle}</style>
		  </head>
		  <body>${labelsHtml}</body>
		</html>
		`);
      printWindow.document.close();
      printWindow.addEventListener("load", () => {
        detailedData.forEach(({ detail }, dataIndex) => {
          detail.control_stocks.forEach((cs, csIndex) => {
            const barcodeId = `barcode-${dataIndex}-${csIndex}`;
            const svgElem = printWindow.document.getElementById(barcodeId);
            if (svgElem) {
              try {
                JsBarcode(
                  svgElem,
                  (detail.ean13 || "") + "" + cs.id_control_stock,
                  {
                    format: "code128",
                    width: 2,
                    height: 100,
                    displayValue: false,
                    fontSize: 18,
                    margin: 4,
                    textPosition: "bottom",
                    textAlign: "center",
                    rotation: 0,
                  }
                );
                svgElem.style.width = "230px";
                svgElem.style.height = "75px";
              } catch (err) {
                console.error("Error generando código de barras:", err);
              }
            }
          });
        });
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      });
    };

    const canExecute =
      productsToTransfer.length > 0 &&
      productsToTransfer.every(
        (p) =>
          (p.recived_quantity || 0) === p.quantity && p.status === "revisado"
      );

    const noProducts = productsToTransfer.length === 0;
    const isSameStore = isSameStoreSelected;
    const st = currentStatus.toLowerCase();

    const memoRenderMainButton = useCallback(() => {
      if (isNewMovement) {
        return (
          <Button
            label="Guardar"
            className="w-full"
            disabled={isSameStore || noProducts || isSubmitting}
            loading={isSubmitting}
            onClick={handleSaveCreate}
          />
        );
      }

      if (
        type === "traspaso" &&
        (st === "enviado" || st === "recibido" || st === "en revision")
      ) {
        if (idProfile === 1) {
          return (
            <div className="flex gap-2 w-full">
              {st === "enviado" && (
                <Button
                  label="Marcar como Recibido"
                  className="w-1/2 p-button-warning"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  onClick={() => handleUpdateMovementStatus("Recibido")}
                />
              )}
              {st === "recibido" && (
                <Button
                  label="Revisar"
                  className="w-1/2 p-button-help"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  onClick={() => handleUpdateMovementStatus("En revision")}
                />
              )}
              {st === "en revision" && (
                <Button
                  label="Guardar"
                  className="w-1/2"
                  disabled={isSameStore || noProducts || isSubmitting}
                  loading={isSubmitting}
                  onClick={() => handleUpdateMovementStatus("En revision")}
                />
              )}
              <Button
                label="Ejecutar"
                className="w-1/2 p-button-primary"
                disabled={
                  isSubmitting ||
                  (st === "en revision" ? !canExecute : isSameStore || noProducts)
                }
                loading={isSubmitting}
                onClick={handleExecuteMovement}
              />
            </div>
          );
        } else {
          if (st === "enviado") {
            return (
              <Button
                label="Marcar como Recibido"
                className="w-full p-button-warning"
                disabled={
                  isSubmitting ||
                  String(shopId) !== String(selectedDestinationStore)
                }
                loading={isSubmitting}
                onClick={() => handleUpdateMovementStatus("Recibido")}
              />
            );
          } else if (st === "recibido") {
            return (
              <Button
                label="Revisar"
                className="w-full p-button-help"
                disabled={isSubmitting}
                loading={isSubmitting}
                onClick={() => handleUpdateMovementStatus("En revision")}
              />
            );
          } else if (st === "en revision") {
            return (
              <div className="flex gap-2 w-full">
                <Button
                  label="Guardar"
                  className="w-full"
                  disabled={isSameStore || noProducts || isSubmitting}
                  loading={isSubmitting}
                  onClick={() => handleUpdateMovementStatus("En revision")}
                />
                <Button
                  label="Ejecutar"
                  className="w-full p-button-primary"
                  disabled={isSubmitting || !canExecute}
                  loading={isSubmitting}
                  onClick={handleExecuteMovement}
                />
              </div>
            );
          }
        }
      }

      if (st === "en creacion") {
        if (type === "traspaso") {
          if (idProfile === 1) {
            return (
              <div className="flex gap-2 w-full">
                <Button
                  label="Guardar"
                  className="p-button-secondary w-1/2"
                  disabled={noProducts || isSubmitting}
                  loading={isSubmitting}
                  onClick={handleUpdateMovement}
                />
                <Button
                  label="Enviar"
                  className="p-button-success w-1/2"
                  disabled={noProducts || isSubmitting}
                  loading={isSubmitting}
                  onClick={() => handleUpdateMovementStatus("Enviado")}
                />
              </div>
            );
          } else {
            return (
              <div className="flex gap-2 w-full">
                <Button
                  label="Guardar"
                  className="p-button-secondary w-1/2"
                  disabled={isSameStore || noProducts || isSubmitting}
                  loading={isSubmitting}
                  onClick={handleUpdateMovement}
                />
                <Button
                  label="Enviar"
                  className="p-button-success w-1/2"
                  disabled={isSameStore || noProducts || isSubmitting}
                  loading={isSubmitting}
                  onClick={() => handleUpdateMovementStatus("Enviado")}
                />
              </div>
            );
          }
        } else if (type === "entrada" || type === "salida") {
          return (
            <div className="flex gap-2 w-full">
              <Button
                label="Guardar"
                className="p-button-secondary w-1/2"
                disabled={noProducts || isSubmitting}
                loading={isSubmitting}
                onClick={handleUpdateMovement}
              />
              {idProfile === 1 && (
                <Button
                  label="Ejecutar"
                  className="p-button-primary w-1/2"
                  disabled={noProducts || isSubmitting}
                  loading={isSubmitting}
                  onClick={handleExecuteMovement}
                />
              )}
            </div>
          );
        }
      }

      return (
        <Button
          label="Sin acciones"
          className="w-full p-button-secondary"
          disabled
        />
      );
    }, [
      canExecute,
      handleExecuteMovement,
      handleUpdateMovement,
      handleUpdateMovementStatus,
      idProfile,
      isNewMovement,
      isSameStore,
      noProducts,
      selectedDestinationStore,
      shopId,
      st,
      type,
      description,
      isSubmitting,
    ]);

    useImperativeHandle(ref, () => ({
      getFooter: () => memoRenderMainButton(),
    }));

    // Agregar una parte que dependa de la cantidad revisada para forzar el re-render del footer.
    const revisionKey = productsToTransfer
      .map((p) => p.recived_quantity || 0)
      .join("-");
    const computedFooterKey = `${
      productsToTransfer.length
    }-${movementStatus}-${isSameStoreSelected}-${!noProducts}-${type}-${idProfile}-${revisionKey}-${description}-${isSubmitting}`;
    const footerKeyRef = useRef("");
    useEffect(() => {
      if (onFooterChange) {
        if (footerKeyRef.current !== computedFooterKey) {
          const newFooter = memoRenderMainButton();
          onFooterChange(newFooter);
          footerKeyRef.current = computedFooterKey;
        }
      }
    }, [computedFooterKey, onFooterChange, memoRenderMainButton]);

    let formTitle = "";
    if (isNewMovement) {
      formTitle = `Crear movimiento: ${
        type === "traspaso"
          ? "Traspaso"
          : type === "entrada"
          ? "Entrada"
          : "Salida"
      }`;
    } else {
      if (type === "traspaso") {
        formTitle = "Traspaso entre tiendas";
      } else if (type === "entrada") {
        formTitle = "Entrada de mercadería";
      } else if (type === "salida") {
        formTitle = "Salida de mercadería";
      }
    }

    const canEditStores = isNewMovement;

    const shopDropdownOptions = shops.map((shop) => ({
      label: shop.name,
      value: String(shop.id_shop),
    }));

    const destinationShopDropdownOptions = shops
      .filter((s) => String(s.id_shop) !== String(selectedOriginStore))
      .map((shop) => ({
        label: shop.name,
        value: String(shop.id_shop),
      }));

    const productTableColumns = [
      { field: "product_name", header: "Producto" },
      { field: "barcode", header: "Cod. Barras", body: barcodeBodyTemplate },
      { field: "quantity", header: "Cantidad", body: quantityBodyTemplate },
      { field: "action", header: "", body: actionBodyTemplate },
    ];

    // Para traspasos, modificamos las columnas según el estado
    if (type === "traspaso") {
      if (currentStatus.toLowerCase() === "en revision") {
        // En revisión: mostrar "Cantidad Enviada" y "Cantidad recibida"
        productTableColumns[2].header = "Cantidad Enviada";
        productTableColumns.splice(3, 0, {
          field: "recived_quantity",
          header: "Cantidad recibida",
          body: revisionBodyTemplate,
        });
      } else {
        // Modo normal: siempre mostrar Stock Origen y Stock Destino
        productTableColumns[2].header = "Cantidad Enviada";
        productTableColumns.splice(3, 0, {
          field: "stock_origin",
          header: "Stock Origen",
          body: (rowData) => rowData.stock_origin ?? "-",
        });
        productTableColumns.splice(4, 0, {
          field: "stock_destiny",
          header: "Stock Destino",
          body: (rowData) => rowData.stock_destiny ?? "-",
        });
      }
    }

    function quantityBodyTemplate(rowData) {
      return (
        <InputNumber
          value={rowData.quantity}
          onValueChange={(e) =>
            handleQuantityChange(
              rowData.uniqueId
                ? rowData.uniqueId
                : rowData.id_product_attribute,
              e.value
            )
          }
          min={1}
          disabled={!isNewMovement} // Editable solo en creación
        />
      );
    }

    function actionBodyTemplate(rowData) {
      return (
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger"
          onClick={() =>
            handleRemoveProduct(
              rowData.id_warehouse_movement_detail
                ? rowData.uniqueId
                  ? rowData.uniqueId
                  : rowData.id_product_attribute
                : rowData.id_product_attribute
            )
          }
          disabled={!canEditProducts}
        />
      );
    }

    function getAdaptiveGreenStyle(isDarkMode) {
      return isDarkMode
        ? { backgroundColor: "#14532d", color: "#d1fae5" }
        : { backgroundColor: "#d1fae5", color: "#14532d" };
    }

    function revisionBodyTemplate(rowData) {
      const revCount = rowData.recived_quantity || 0;
      const isDarkMode = document.body.classList.contains("p-darkmode");
      const style =
        revCount === rowData.quantity ? getAdaptiveGreenStyle(isDarkMode) : {};
      return (
        <InputText value={revCount} readOnly className="w-full" style={style} />
      );
    }

    const employeesDict = useEmployeesDictionary();
    const totalQuantity = productsToTransfer.reduce(
      (acc, product) => acc + (product.quantity || 0),
      0
    );


    return (
      <div className="p-2">
        <div className="transfer-form-content">
          <Toast ref={toast} position="top-center" />
          <div className="mb-6">
            <Steps model={stepItems} activeIndex={activeIndex} readOnly />{" "}
          </div>

          {type === "entrada" &&
            movementData &&
            movementData.status.toLowerCase() === "ejecutado" && (
              <div className="mb-4">
                <Button
                  label="Imprimir etiquetas"
                  icon="pi pi-print"
                  onClick={handlePrintLabels}
                />
              </div>
            )}

          <div className="card flex flex-column md:flex-row gap-3">
            <div className="p-inputgroup flex-1">
              <FloatLabel>
                <label>
                  Descripción <span className="text-red-500">*</span>
                </label>
                <InputText
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={
                    !isNewMovement &&
                    currentStatus.toLowerCase() !== "en creacion"
                  }
                />
              </FloatLabel>
            </div>

            {type !== "entrada" && (
              <div className="p-inputgroup flex-1">
                {type === "traspaso" || type === "salida" ? (
                  isLoadingShops ? (
                    <p>Cargando tiendas...</p>
                  ) : errorLoadingShops ? (
                    <p className="text-red-500">{errorLoadingShops}</p>
                  ) : (
                    <FloatLabel>
                      <label>Tienda Origen</label>
                      <Dropdown
                        showClear
                        value={selectedOriginStore}
                        options={shopDropdownOptions}
                        onChange={(e) => setSelectedOriginStore(e.value)}
                        disabled={!canEditStores}
                      />
                    </FloatLabel>
                  )
                ) : (
                  <FloatLabel>
                    <label>Tienda Origen</label>
                    <Dropdown value={selectedOriginStore || ""} />
                  </FloatLabel>
                )}
              </div>
            )}

            {type !== "salida" && (
              <div className="p-inputgroup flex-1">
                {type === "traspaso" || type === "entrada" ? (
                  isLoadingShops ? (
                    <p>Cargando tiendas...</p>
                  ) : errorLoadingShops ? (
                    <p className="text-red-500">{errorLoadingShops}</p>
                  ) : (
                    <FloatLabel>
                      <label>Tienda Destino</label>
                      <Dropdown
                        showClear
                        value={selectedDestinationStore}
                        options={
                          type === "traspaso"
                            ? destinationShopDropdownOptions
                            : shopDropdownOptions
                        }
                        onChange={(e) => setSelectedDestinationStore(e.value)}
                        disabled={!canEditStores}
                      />
                    </FloatLabel>
                  )
                ) : (
                  <FloatLabel>
                    <label>Tienda Destino</label>
                    <Dropdown value={selectedDestinationStore || ""} />
                  </FloatLabel>
                )}
              </div>
            )}
          </div>

          <div className="card flex flex-column md:flex-row gap-3 mt-6">
            <div className="p-inputgroup flex-1">
              <FloatLabel>
                <label>Fecha creación</label>
                <InputText value={formatShortDate(createDate)} readOnly />
              </FloatLabel>
            </div>
            <div className="p-inputgroup flex-1">
              <FloatLabel>
                <label>Empleado</label>
                <InputText
                  value={employeesDict[employeeIdV] || employeeIdV || ""}
                  readOnly
                />
              </FloatLabel>
            </div>
            <div className="p-inputgroup flex-1">
              <FloatLabel>
                <label>Tipo Movimiento</label>
                <InputText value={type} readOnly />
              </FloatLabel>
            </div>
          </div>

          {(isNewMovement ||
            ["en creacion", "en revision"].includes(
              currentStatus.toLowerCase()
            )) && (
            <ProductSearchCardForTransfer
              onAddProduct={
                currentStatus.toLowerCase() === "en revision"
                  ? handleRevisionScan
                  : handleAddProduct
              }
              selectedOriginStore={selectedOriginStore}
              selectedDestinationStore={selectedDestinationStore}
              type={type}
              originShopName={originShopName}
              destinationShopName={destinationShopName}
            />
          )}

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">
              {type === "traspaso"
                ? "Productos a Traspasar"
                : type === "entrada"
                ? "Productos a Ingresar"
                : "Productos a Retirar"}
              {""}
              {`: ${totalQuantity}`}
            </h3>
            <DataTable
              value={productsToTransfer}
              responsiveLayout="scroll"
              rowClassName={(rowData) =>
                rowData.id_product_attribute === recentlyAddedId
                  ? "animate-product"
                  : ""
              }
            >
              {productTableColumns.map((col) => (
                <Column
                  key={col.field}
                  field={col.field}
                  header={col.header}
                  body={col.body}
                />
              ))}
            </DataTable>
          </div>
        </div>
        <OverlayPanel
          ref={overlayPanelControlStock}
          style={{ maxWidth: "200px" }}
        >
          {controlStocksState.map((cs, index) => (
            <div key={index} className="p-1">
              <strong>Seguimiento:</strong> {cs.id_control_stock}
            </div>
          ))}
        </OverlayPanel>
      </div>
    );
  }
);

export default TransferForm;
