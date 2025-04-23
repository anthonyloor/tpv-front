// src/components/modal/tags/PricesTags.jsx

import { useState, useEffect, useRef, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { useApiFetch } from "../../../utils/useApiFetch";
import { AuthContext } from "../../../contexts/AuthContext";
import useProductSearch from "../../../hooks/useProductSearch";
import JsBarcode from "jsbarcode";
import { TabView, TabPanel } from "primereact/tabview";
import getApiBaseUrl from "../../../utils/getApiBaseUrl";
import { Checkbox } from "primereact/checkbox";
import DiscountModal from "../discount/DiscountModal";
import ActionResultDialog from "../../common/ActionResultDialog";
import { ClientContext } from "../../../contexts/ClientContext";
import { OverlayPanel } from "primereact/overlaypanel";

export default function PricesTags({ isOpen, onHide }) {
  const { shopId, idProfile } = useContext(AuthContext);
  const apiFetch = useApiFetch();
  const API_BASE_URL = getApiBaseUrl();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedTrackingProducts, setSelectedTrackingProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityPrint, setQuantityPrint] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [barcodesReady, setBarcodesReady] = useState(false);
  const previewContainerRef = useRef(null);
  const [tagsData, setTagsData] = useState([]);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountPrices, setDiscountPrices] = useState({});
  const [showDiscountVoucherModal, setShowDiscountVoucherModal] =
    useState(false);
  const [voucherData, setVoucherData] = useState([]); // nuevo estado para descuentos desde etiquetas
  const [actionDialogVisible, setActionDialogVisible] = useState(false);
  const [actionDialogMessage, setActionDialogMessage] = useState(
    "Generando descuento..."
  );
  const [actionDialogSuccess, setActionDialogSuccess] = useState(true);
  const { selectedClient } = useContext(ClientContext);

  const [nonTrackingOverlayData, setNonTrackingOverlayData] = useState([]);
  const overlayPanelNonTrackingRef = useRef(null);

  const handleDiscountPriceChange = (key, value) => {
    setDiscountPrices((prev) => ({ ...prev, [key]: value }));
  };

  // Usar el hook de búsqueda (se usa onAddProduct para actualizar el producto seleccionado)
  const { groupedProducts, isLoading, handleSearch } = useProductSearch({
    apiFetch,
    shopId,
    allowOutOfStockSales: true,
    onAddProduct: (prod) => {
      const filteredStocks = prod.stocks
        ? prod.stocks.filter(
            (stock) => Number(stock.id_shop) === Number(shopId)
          )
        : [];
      const actualShopId =
        filteredStocks.length > 0 ? filteredStocks[0].id_shop : shopId;
      const selected = {
        ...prod,
        stocks: filteredStocks,
        id_shop: actualShopId,
      };
      setSelectedProduct(selected);
    },
    onAddDiscount: () => {},
    idProfile,
    selectedClient,
  });

  // Al abrir el diálogo, reiniciar estados y enfocar el input
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedProduct(null);
      setSelectedTrackingProducts([]);
      setQuantityPrint(1);
      setIsGenerating(false);
      if (inputRef.current) inputRef.current.focus();
    }
  }, [isOpen]);

  // Al presionar "Enter", invocar búsqueda del hook
  const onInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(searchTerm);
    }
  };

  // Reemplazamos la construcción de flatProducts usando flatMap para adaptarse al nuevo formato:
  const flatProducts = groupedProducts.flatMap((group) =>
    // Sólo se consideran las combinaciones pertenecientes a la tienda actual
    group.combinations
      .filter((combo) => Number(combo.id_shop) === Number(shopId))
      .map((combo) => ({
        ...combo,
        fullName: `${group.product_name} ${
          combo.combination_name || ""
        }`.trim(),
      }))
  );

  const productsWithGroup = flatProducts
    .flatMap((product) => {
      if (
        product.stocks &&
        product.stocks.length > 0 &&
        product.stocks.some((stock) => stock.control_stock?.length > 0)
      ) {
        // Crear un registro por cada id_control_stock dentro de cada stock.control_stock
        return product.stocks.flatMap((stock) =>
          stock.control_stock.map((cs) => ({
            ...product,
            id_control_stock: cs.id_control_stock,
            active_control_stock: cs.active_control_stock,
            group: "Productos con seguimiento",
          }))
        );
      } else {
        // Si no hay control_stock, se considera como producto sin seguimiento
        return {
          ...product,
          group: "Productos sin seguimiento",
        };
      }
    })
    .sort((a, b) => a.group.localeCompare(b.group));

  const finalNoTracking = productsWithGroup
    .reduce((unique, item) => {
      const key = `${item.id_product}_${item.id_product_attribute}_${
        item.id_shop || ""
      }`;
      if (!unique.some((u) => u.uniqueKey === key)) {
        // Contar registros con id_control_stock para el mismo key
        const trackingCount = productsWithGroup.filter((p) => {
          const pKey = `${p.id_product}_${p.id_product_attribute}_${
            p.id_shop || ""
          }`;
          return pKey === key && p.id_control_stock;
        }).length;
        // Remover id_control_stock y active_control_stock, y agregar trackingCount
        const { id_control_stock, active_control_stock, ...rest } = item;
        unique.push({ ...rest, uniqueKey: key, trackingCount });
      }
      return unique;
    }, [])
    .map(({ uniqueKey, ...rest }) => rest);

  const finalTrackingDetailed = productsWithGroup
    .filter((p) => p.id_control_stock && p.active_control_stock)
    .map((product) => ({
      ...product,
      stocks: product.stocks?.map((stock) => ({
        ...stock,
        control_stock: stock.control_stock?.filter(
          (cs) => cs.active_control_stock
        ),
      })),
    }));

  // Función para abrir el diálogo o llamar directamente para imprimir según el tipo de producto
  const openQuantityDialog = () => {
    // Si hay productos con seguimiento seleccionados, llamar directamente a la API
    if (selectedTrackingProducts && selectedTrackingProducts.length > 0) {
      handleConfirmQuantity();
    } else if (selectedProduct) {
      // Para productos sin seguimiento se solicita la cantidad
      setQuantityPrint(1);
      setIsGenerating(false);
      setShowQuantityDialog(true);
    }
  };

  // Estado y función de diálogo para cantidad (similares al código previo)
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const handleConfirmQuantity = async () => {
    setIsGenerating(true);
    try {
      // Casos múltiples para productos con seguimiento
      if (selectedTrackingProducts && selectedTrackingProducts.length > 0) {
        const responses = await Promise.all(
          selectedTrackingProducts.map(async (prod) => {
            let ean13 =
              prod.ean13_combination ||
              prod.ean13_combination_0 ||
              "0000000000000";
            ean13 =
              ean13.length < 13
                ? ean13.padStart(13, "0")
                : ean13.substring(0, 13);
            const payload = {
              id_control_stock: prod.id_control_stock,
              ean13: ean13,
            };
            const res = await apiFetch(
              `${API_BASE_URL}/get_product_price_tag`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              }
            );
            return Array.isArray(res) ? res[0] || res : res;
          })
        );
        // Combinar respuestas para generar etiquetas
        const tags = responses.map((info) => ({
          ean13: info.ean13,
          id_control_stock: info.id_control_stock,
          price: selectedTrackingProducts.find(
            (p) => p.id_control_stock === info.id_control_stock
          ).price,
        }));
        setTagsData(tags);
        let labelsHtml = "";
        const labelStyle =
          "box-sizing:border-box; margin-top:15px;margin-left:15px; page-break-after: always; break-after: page;";
        tags.forEach((tag, i) => {
          const newEan = tag.ean13 + "-" + tag.id_control_stock;
          // Buscar el nuevo precio para el registro (si existe) o usar el original.
          const key = tag.id_control_stock;
          const newPrice =
            discountEnabled && discountPrices[key]
              ? discountPrices[key]
              : tag.price;
          labelsHtml += `
            <div class="label" style="${labelStyle}">
              <div class="product-name" style="margin:0; padding:0; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
              <span style="font-size: 18px;">${selectedTrackingProducts[
                i
              ].product_name
                .split(" ")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ")}</span>
              </div>
              <div class="content-row" style="display:inline-flex; margin-top:5px;">
              <div class="barcode-column" style="display:flex; flex-direction:column;">
                <svg id="barcode-${i}"></svg>
                <div style="margin-top:5px; text-align:center; font-family: 'Arial', sans-serif; font-size:18px; color:#999; font-weight: bold;">
                <i className="pi pi-link"></i> ${newEan}
                </div>
              </div>
              <div class="info-column" style="display:flex; flex-direction:column;font-weight:bold;">
                <span class="combination" style="margin:0; text-align:center; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                ${
                  selectedTrackingProducts[i].combination_name
                    ? selectedTrackingProducts[i].combination_name.replace(
                        /-/,
                        "<br />-----<br />"
                      )
                    : ""
                }
                </span>
                  <div class="price" style="margin:0; padding:10px 0px 0px 0px; width:90px; text-align:center; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                ${
                  discountEnabled
                    ? `<span style="text-decoration: line-through;font-size: 12px;">${
                        tag.price ? tag.price + " €" : ""
                      }</span>
                     <span style="color:red;font-size: 18px; font-weight: bold;">${newPrice} €</span>`
                    : tag.price
                    ? tag.price + " €"
                    : ""
                }
                </div>
              </div>
              </div>
            </div>
            `;
        });
        setPreviewHtml(labelsHtml);
        setBarcodesReady(false);
        setShowPreviewDialog(true);
      }
      // Caso de producto único (sin seguimiento o con seguimiento seleccionado de forma individual)
      else if (selectedProduct) {
        console.log("selectedProduct:", selectedProduct);
        let ean13 =
          selectedProduct.ean13_combination ||
          selectedProduct.ean13_combination_0 ||
          "0000000000000";
        ean13 =
          ean13.length < 13 ? ean13.padStart(13, "0") : ean13.substring(0, 13);
        let payload;
        if (selectedProduct.id_control_stock) {
          payload = {
            id_control_stock: selectedProduct.id_control_stock,
            ean13:
              selectedProduct.ean13_combination ||
              selectedProduct.ean13_combination_0 ||
              "",
          };
        } else {
          payload = {
            quantity_print: quantityPrint,
            id_control_stock: null,
            ean13:
              selectedProduct.ean13_combination ||
              selectedProduct.ean13_combination_0 ||
              "",
            id_product: selectedProduct.id_product,
            id_product_attribute: selectedProduct.id_product_attribute,
            product_name: selectedProduct.product_name,
            id_shop: selectedProduct.id_shop,
            quantity: selectedProduct.quantity,
          };
        }
        console.log("DEBUG: Payload para get_product_price_tag:", payload);
        let response = await apiFetch(`${API_BASE_URL}/get_product_price_tag`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("DEBUG: Respuesta de get_product_price_tag:", response);
        const labelStyle =
          "box-sizing:border-box; margin-top:15px;margin-left:15px; page-break-after: always; break-after: page;";
        if (selectedProduct.id_control_stock) {
          let info = Array.isArray(response)
            ? response[0] || response
            : response;
          const tags = [
            {
              ean13: info.ean13,
              id_control_stock: info.id_control_stock,
              price: info.price,
            },
          ];
          setTagsData(tags);
          let labelsHtml = "";
          tags.forEach((tag, i) => {
            const newEan = tag.ean13 + "-" + tag.id_control_stock;
            const key = selectedProduct.id_product_attribute;
            const newPrice =
              discountEnabled && discountPrices[key]
                ? discountPrices[key]
                : tag.price;
            labelsHtml += `
              <div class="label" style="${labelStyle}">
                <div class="product-name" style="margin:0; padding:0; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                  <span style="font-size: 18px;">${selectedProduct.product_name
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ")}</span>
                </div>
                <div class="content-row" style="display:inline-flex; margin-top:5px;">
                  <div class="barcode-column" style="display:flex; flex-direction:column;">
                    <svg id="barcode-${i}"></svg>
                    <div style="margin-top:5px; text-align:center; font-family: 'Arial', sans-serif; font-size:18px; color:#999; font-weight: bold;">
                      <i className="pi pi-link"></i> ${newEan}
                    </div>
                  </div>
                  <div class="info-column" style="display:flex; flex-direction:column;font-weight:bold;">
                <span class="combination" style="margin:0; text-align:center; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                      ${
                        selectedProduct.combination_name
                          ? selectedProduct.combination_name.replace(
                              /-/,
                              "<br />-----<br />"
                            )
                          : ""
                      }
                    </span>
                  <div class="price" style="margin:0; padding:10px 0px 0px 0px; width:90px; text-align:center; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                  ${
                    discountEnabled
                      ? `<span style="text-decoration: line-through;font-size: 12px;">${
                          selectedProduct.price
                            ? selectedProduct.price + " €"
                            : ""
                        }</span>
                       <span style="color:red;font-size: 18px; font-weight: bold;">${newPrice} €</span>`
                      : selectedProduct.price
                      ? selectedProduct.price + " €"
                      : ""
                  }
                    </div>
                  </div>
                </div>
              </div>
            `;
          });
          setPreviewHtml(labelsHtml);
          setBarcodesReady(false);
          setShowPreviewDialog(true);
        } else {
          if (!Array.isArray(response)) {
            response = [response];
          }
          const tags = response[0].tags || [];
          setTagsData(tags);
          let labelsHtml = "";
          tags.forEach((tag, i) => {
            const newEan = tag.ean13 + "-" + tag.id_control_stock;
            const key = selectedProduct.id_product_attribute;
            const newPrice =
              discountEnabled && discountPrices[key]
                ? discountPrices[key]
                : selectedProduct.price;
            labelsHtml += `
              <div class="label" style="${labelStyle}">
                <div class="product-name" style="margin:0; padding:0; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                  <span style="font-size: 18px;">${selectedProduct.product_name
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(" ")}</span>
                </div>
                <div class="content-row" style="display:inline-flex; margin-top:5px;">
                  <div class="barcode-column" style="display:flex; flex-direction:column;">
                    <svg id="barcode-${i}"></svg>
                    <div style="margin-top:5px; text-align:center; font-family: 'Arial', sans-serif; font-size:18px; color:#999; font-weight: bold;">
                      <i className="pi pi-link"></i> ${newEan}
                    </div>
                  </div>
                  <div class="info-column" style="display:flex; flex-direction:column;font-weight:bold;">
                <span class="combination" style="margin:0; text-align:center; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                      ${
                        selectedProduct.combination_name
                          ? selectedProduct.combination_name.replace(
                              /-/,
                              "<br />-----<br />"
                            )
                          : ""
                      }
                    </span>
                  <div class="price" style="margin:0; padding:10px 0px 0px 0px; width:90px; text-align:center; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                    ${
                      discountEnabled
                        ? `<span style="text-decoration: line-through;font-size: 12px;">${
                            selectedProduct.price
                              ? selectedProduct.price + " €"
                              : ""
                          }</span>
                         <span style="color:red;font-size: 18px; font-weight: bold;">${newPrice} €</span>`
                        : selectedProduct.price
                        ? selectedProduct.price + " €"
                        : ""
                    }
                    </div>
                  </div>
                </div>
              </div>
            `;
          });
          setPreviewHtml(labelsHtml);
          setBarcodesReady(false);
          setShowPreviewDialog(true);
        }
      }
    } catch (error) {
      console.error("Error al generar etiquetas:", error);
      alert("Error al generar las etiquetas. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
      setShowQuantityDialog(false);
    }
  };

  // Función para recibir los datos de descuento (vales) desde DiscountModal
  const handleDiscountVoucherReceived = (discountRules) => {
    // Mostrar diálogo de acción con spinner
    setActionDialogVisible(true);
    setActionDialogMessage("Descuento generado, generando códigos...");
    // Guardar el arreglo recibido (discountRules es ahora un array)
    setVoucherData(discountRules);
    // Construir HTML con etiquetas solo con código de barras usando el campo code
    let labelsHtml = "";
    const labelStyle =
      "box-sizing:border-box; margin-top:15px;margin-left:10px; page-break-after: always; break-after: page;";
    discountRules.forEach((rule, i) => {
      labelsHtml += `
        <div class="label" style="${labelStyle}">
          <div class="barcode-column" style="display:flex; flex-direction:column;">
            <svg id="voucher-barcode-${i}"></svg>
          </div>
          <div class="info-column" style="text-align:center; font-family: 'Arial', sans-serif; font-size: 14px;">
            ${rule.code}
          </div>
        </div>
      `;
    });
    setPreviewHtml(labelsHtml);
    setBarcodesReady(false);
    setShowPreviewDialog(true);
    // Ocultar el diálogo de acción luego de generar las etiquetas (después de 1.2s)
    setTimeout(() => {
      setActionDialogVisible(false);
    }, 1200);
  };

  const handleGenerateBarcodes = () => {
    console.log("Iniciando generación de códigos de barras");
    if (voucherData.length > 0) {
      // Generar códigos de barras para las etiquetas de descuento (vales)
      voucherData.forEach((rule, i) => {
        const elem = previewContainerRef.current
          ? previewContainerRef.current.querySelector(`#voucher-barcode-${i}`)
          : null;
        if (elem) {
          try {
            JsBarcode(elem, rule.code, {
              format: "code128",
              displayValue: false,
              fontSize: 18,
              margin: 2,
              textPosition: "bottom",
              textAlign: "center",
              rotation: 0,
            });
            elem.style.width = "175px";
            elem.style.height = "60px";
          } catch (error) {
            console.error("Error generando código de barras:", error);
            elem.insertAdjacentHTML(
              "afterend",
              '<div style="color: red; font-size: 12px;">Error al generar código de barras</div>'
            );
          }
        } else {
          console.error(`Elemento voucher-barcode-${i} no encontrado`);
        }
      });
    } else {
      // ...existing código para etiquetas de productos...
      tagsData.forEach((tag, i) => {
        const elem = previewContainerRef.current
          ? previewContainerRef.current.querySelector(`#barcode-${i}`)
          : null;
        if (elem) {
          try {
            JsBarcode(elem, tag.ean13 + "" + tag.id_control_stock, {
              format: "code128",
              width: 2,
              height: 100,
              displayValue: false,
              fontSize: 18,
              margin: 4,
              textPosition: "bottom",
              textAlign: "center",
              rotation: 0,
            });
            elem.style.width = "230px";
            elem.style.height = "75px";
          } catch (error) {
            console.error("Error generando código de barras:", error);
            elem.insertAdjacentHTML(
              "afterend",
              '<div style="color: red; font-size: 12px;">Error al generar código de barras</div>'
            );
          }
        } else {
          console.error(`Elemento barcode-${i} no encontrado`);
        }
      });
    }
    console.log("Finalizada generación de códigos de barras");
    setBarcodesReady(true);
  };

  useEffect(() => {
    if (showPreviewDialog && previewHtml) {
      const tryGenerate = () => {
        if (previewContainerRef.current) {
          console.log("previewContainerRef disponible, generando códigos");
          handleGenerateBarcodes();
        } else {
          console.log("previewContainerRef no disponible, reintentando...");
          setTimeout(tryGenerate, 300);
        }
      };
      tryGenerate();
    }
  }, [showPreviewDialog, previewHtml]);

  // Nueva función para imprimir únicamente la parte de la etiqueta en tamaño 62mm x 29mm
  const handlePrint = () => {
    const printContents = previewContainerRef.current.innerHTML;
    // Si existen datos de vales, se usa un tamaño de 40mm x 30mm
    const pageStyle =
      voucherData.length > 0
        ? "@page { size: 40mm 30mm; margin: 1mm; } body { margin: 0; }"
        : "@page { size: 62mm 32mm; margin: 1mm; } body { margin: 0; }";
    const printWindow = window.open("", "_blank", "width=600,height=400");
    printWindow.document.write(`
      <html>
        <head>
          <style>${pageStyle}</style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Footer fijo para los botones
  const dialogFooter = (
    <div className="flex justify-between items-center gap-3">
      <Button
        label="Etiquetas con vales descuento"
        icon="pi pi-tag"
        className="p-button-info"
        onClick={() => setShowDiscountVoucherModal(true)}
      />
      <div className="flex items-center gap-3">
        <Checkbox
          inputId="discountCheckbox"
          checked={discountEnabled}
          onChange={(e) => setDiscountEnabled(e.checked)}
        />
        <label htmlFor="discountCheckbox">Precios con oferta</label>
        <Button
          label={
            selectedProduct?.id_control_stock ||
            selectedTrackingProducts.length > 0
              ? "Reimprimir etiquetas"
              : "Imprimir etiquetas"
          }
          icon="pi pi-print"
          onClick={openQuantityDialog}
          disabled={
            !selectedProduct &&
            (!selectedTrackingProducts || selectedTrackingProducts.length === 0)
          }
        />
      </div>
    </div>
  );

  const handleNonTrackingClick = (event, rowData) => {
    // Aplanar todos los control_stock de cada stock disponible
    const trackingArr = rowData.stocks
      ? rowData.stocks.flatMap((stock) => stock.control_stock || [])
      : [];
    setNonTrackingOverlayData(trackingArr);
    overlayPanelNonTrackingRef.current.toggle(event);
  };

  return (
    <>
      <Dialog
        header="Generar etiquetas de producto"
        visible={isOpen}
        onHide={onHide}
        modal
        draggable={false}
        resizable={false}
        style={{
          maxWidth: "60vw",
          maxHeight: "70vh",
          minWidth: "950px",
          minHeight: "650px",
          width: "50vw",
          height: "65vh",
        }}
        footer={dialogFooter}
      >
        <div className="p-4" style={{ overflowY: "auto", maxHeight: "100%" }}>
          <div className="mb-4 flex items-center">
            <InputText
              ref={inputRef}
              placeholder="Buscar por referencia"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
              onKeyDown={onInputKeyDown}
              className="w-full"
            />
            <Button
              icon="pi pi-search"
              onClick={() => handleSearch(searchTerm)}
              className="ml-2"
            />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <ProgressSpinner />
            </div>
          ) : (
            <>
              <TabView>
                {finalNoTracking.length > 0 && (
                  <TabPanel header="Productos sin seguimiento">
                    {finalNoTracking.length > 0 ? (
                      <DataTable
                        value={finalNoTracking}
                        selectionMode="single"
                        selection={selectedProduct}
                        onSelectionChange={(e) => setSelectedProduct(e.value)}
                        dataKey="id_product_attribute"
                        scrollable
                        emptyMessage="No hay resultados"
                        tableStyle={{ width: "100%" }}
                      >
                        <Column
                          selectionMode="single"
                          style={{
                            width: "5px",
                            textAlign: "center",
                            padding: "1rem 0.3rem",
                          }}
                          alignHeader={"center"}
                        />
                        <Column
                          header="Nombre"
                          body={(rowData) => rowData.product_name}
                          style={{
                            width: "200px",
                            textAlign: "left",
                            padding: "1rem 1rem 1rem 0.5rem",
                          }}
                          alignHeader={"left"}
                        />
                        <Column
                          header="Combinación"
                          body={(rowData) => rowData.combination_name || ""}
                          style={{
                            width: "100px",
                            textAlign: "center",
                          }}
                          alignHeader={"center"}
                        />
                        <Column
                          header="Precio"
                          body={(rowData) => {
                            if (discountEnabled) {
                              const key = rowData.id_product_attribute;
                              return (
                                <>
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {rowData.price
                                      ? rowData.price.toFixed(2) + " €"
                                      : ""}
                                  </span>
                                  <InputText
                                    value={discountPrices[key] ?? rowData.price}
                                    onChange={(e) =>
                                      handleDiscountPriceChange(
                                        key,
                                        e.target.value
                                      )
                                    }
                                    style={{ color: "red" }}
                                  />
                                </>
                              );
                            }
                            return rowData.price
                              ? rowData.price.toFixed(2) + " €"
                              : "";
                          }}
                          style={{
                            width: "90px",
                            textAlign: "center",
                          }}
                          alignHeader={"center"}
                        />
                        <Column
                          header="Cod. Barras"
                          body={(rowData) =>
                            rowData.ean13_combination ||
                            rowData.ean13_combination_0 ||
                            ""
                          }
                          style={{
                            width: "100px",
                            textAlign: "center",
                          }}
                          alignHeader={"center"}
                        />
                        <Column
                          header="Cantidad"
                          body={(rowData) => {
                            // Calcular el total de control_stock activos en todas las entradas de stocks
                            const controlCount = rowData.stocks
                              ? rowData.stocks.reduce(
                                  (acc, stock) =>
                                    acc +
                                    (stock.control_stock
                                      ? stock.control_stock.filter(
                                          (cs) => cs.active_control_stock
                                        ).length
                                      : 0),
                                  0
                                )
                              : 0;
                            return (
                              <>
                                {rowData.quantity}
                                {controlCount > 0 ? ` | ${controlCount}` : ""}
                                {controlCount > 0 && (
                                  <i
                                    className="pi pi-link"
                                    style={{
                                      cursor: "pointer",
                                      marginLeft: "0.5rem",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNonTrackingClick(e, rowData);
                                    }}
                                  ></i>
                                )}
                              </>
                            );
                          }}
                          style={{
                            width: "25px",
                            textAlign: "center",
                          }}
                          alignHeader={"center"}
                        />
                      </DataTable>
                    ) : (
                      <p>No hay registros</p>
                    )}
                  </TabPanel>
                )}
                {finalTrackingDetailed.length > 0 && (
                  <TabPanel header="Productos con seguimiento">
                    {finalTrackingDetailed.length > 0 ? (
                      <DataTable
                        value={finalTrackingDetailed}
                        selectionMode="multiple"
                        selection={selectedTrackingProducts}
                        onSelectionChange={(e) =>
                          setSelectedTrackingProducts(e.value)
                        }
                        dataKey="id_control_stock"
                        scrollable
                        emptyMessage="No hay resultados"
                        tableStyle={{ width: "100%" }}
                      >
                        <Column
                          selectionMode="multiple"
                          style={{
                            width: "5px",
                            textAlign: "center",
                            padding: "1rem 0.3rem",
                          }}
                          alignHeader={"center"}
                        />
                        <Column
                          header="Nombre"
                          body={(rowData) => rowData.product_name}
                          style={{
                            width: "200px",
                            textAlign: "left",
                            padding: "1rem 1rem 1rem 0.5rem",
                          }}
                          alignHeader={"left"}
                        />
                        <Column
                          header="Combinación"
                          body={(rowData) => rowData.combination_name || ""}
                          style={{
                            width: "100px",
                            textAlign: "center",
                          }}
                          alignHeader={"center"}
                        />
                        <Column
                          header="Precio"
                          body={(rowData) => {
                            if (discountEnabled) {
                              const key = rowData.id_control_stock;
                              return (
                                <>
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {rowData.price
                                      ? rowData.price.toFixed(2) + " €"
                                      : ""}
                                  </span>
                                  <InputText
                                    value={discountPrices[key] ?? rowData.price}
                                    onChange={(e) =>
                                      handleDiscountPriceChange(
                                        key,
                                        e.target.value
                                      )
                                    }
                                    style={{ color: "red" }}
                                  />
                                </>
                              );
                            }
                            return rowData.price
                              ? rowData.price.toFixed(2) + " €"
                              : "";
                          }}
                          style={{
                            width: "90px",
                            textAlign: "center",
                          }}
                          alignHeader={"center"}
                        />
                        <Column
                          header="Cod. Barras"
                          body={(rowData) => (
                            <>
                              {(rowData.ean13_combination ||
                                rowData.ean13_combination_0) +
                                "-" +
                                rowData.id_control_stock}{" "}
                              <i className="pi pi-link"></i>
                            </>
                          )}
                          style={{
                            width: "100px",
                            textAlign: "center",
                          }}
                          alignHeader={"center"}
                        />
                      </DataTable>
                    ) : (
                      <p>No hay registros</p>
                    )}
                  </TabPanel>
                )}
              </TabView>
            </>
          )}
        </div>

        <OverlayPanel ref={overlayPanelNonTrackingRef}>
          {nonTrackingOverlayData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex items-center">
                {item.id_control_stock}
                <i className="pi pi-link" style={{ marginLeft: "0.5rem" }}></i>
              </span>
              <i
                className={`pi ${
                  item.active_control_stock ? "pi-check" : "pi-times"
                }`}
                style={{
                  color: item.active_control_stock ? "green" : "red",
                }}
              ></i>
            </div>
          ))}
        </OverlayPanel>
      </Dialog>

      <Dialog
        header="Número de etiquetas a imprimir"
        visible={showQuantityDialog}
        onHide={() => !isGenerating && setShowQuantityDialog(false)}
        modal
        draggable={false}
        resizable={false}
        closable={!isGenerating}
      >
        <div className="p-4">
          <label className="block mb-2">Cantidad de etiquetas:</label>
          <InputText
            type="number"
            value={quantityPrint}
            onChange={(e) =>
              setQuantityPrint(Math.max(1, Number(e.target.value)))
            }
            className="w-full"
            min="1"
            disabled={isGenerating}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button
              label="Cancelar"
              className="p-button-secondary"
              onClick={() => setShowQuantityDialog(false)}
              disabled={isGenerating}
            />
            <Button
              label="Confirmar"
              icon="pi pi-check"
              onClick={handleConfirmQuantity}
              loading={isGenerating}
              loadingIcon="pi pi-spinner pi-spin"
            />
          </div>
        </div>
      </Dialog>
      <Dialog
        header="Previsualización de Etiquetas"
        visible={showPreviewDialog}
        onHide={() => setShowPreviewDialog(false)}
        modal
        draggable={false}
        resizable={false}
        style={{
          maxWidth: "30vw",
          maxHeight: "70vh",
        }}
      >
        <div
          ref={previewContainerRef}
          className="labels-preview"
          style={{ border: "1px solid" }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
        {(!previewHtml || previewHtml.trim() === "") && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <ProgressSpinner />
          </div>
        )}
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <Button label="Imprimir" icon="pi pi-print" onClick={handlePrint} />
          <Button label="Cerrar" onClick={() => setShowPreviewDialog(false)} />
        </div>
      </Dialog>
      {showDiscountVoucherModal && (
        <DiscountModal
          isOpen={showDiscountVoucherModal}
          onClose={() => setShowDiscountVoucherModal(false)}
          fromEtiquetas={true}
          onDiscountApplied={handleDiscountVoucherReceived}
          onProductDiscountApplied={() => {}}
          targetProduct={null}
          cartTotal={0}
        />
      )}
      <ActionResultDialog
        visible={actionDialogVisible}
        onClose={() => setActionDialogVisible(false)}
        success={actionDialogSuccess}
        message={actionDialogMessage}
      />
    </>
  );
}
