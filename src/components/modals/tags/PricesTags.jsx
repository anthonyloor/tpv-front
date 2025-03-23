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
  const previewContainerRef = useRef(null); // nuevo
  const [tagsData, setTagsData] = useState([]);

  // Usar el hook de búsqueda (se usa onAddProduct para actualizar el producto seleccionado)
  const { groupedProducts, isLoading, handleSearch } = useProductSearch({
    apiFetch,
    shopId,
    allowOutOfStockSales: true,
    onAddProduct: (prod) => {
      const filteredStocks = prod.stocksﬁ
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
  });

  // Al abrir el diálogo, reiniciar estados y enfocar el input
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedProduct(null);
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

  const flatProducts = groupedProducts
    .reduce((acc, group) => {
      const combos = group.combinations
        .filter((combo) => Number(combo.id_shop) === Number(shopId))
        .map((combo) => ({
          ...combo,
          fullName: `${group.product_name} ${
            combo.combination_name || ""
          }`.trim(),
        }));
      return acc.concat(combos);
    }, [])
    .sort((a, b) => a.product_name.localeCompare(b.product_name));

  console.log("Productos planos:", flatProducts);

  const productsWithGroup = flatProducts
    .map((product) => ({
      ...product,
      group: product.id_control_stock
        ? "Productos con seguimiento"
        : "Productos sin seguimiento",
    }))
    .sort((a, b) => a.group.localeCompare(b.group));

  const finalNoTracking = productsWithGroup.filter((p) => !p.id_control_stock);
  const finalTracking = productsWithGroup.filter((p) => p.id_control_stock);

  // Logs de depuración
  console.log("finalNoTracking:", finalNoTracking);
  console.log("finalTracking:", finalTracking);

  // Función para abrir el diálogo de cantidad de impresión
  const openQuantityDialog = () => {
    // Permitir abrir si hay selección única o múltiples tracking
    if (
      !selectedProduct &&
      (!selectedTrackingProducts || selectedTrackingProducts.length === 0)
    )
      return;
    setQuantityPrint(1);
    setIsGenerating(false);
    setShowQuantityDialog(true);
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
        }));
        setTagsData(tags);
        let labelsHtml = "";
        const labelStyle =
          "box-sizing:border-box; margin-top:15px;margin-left:15px; page-break-after: always; break-after: page;";
        tags.forEach((tag, i) => {
          const newEan = tag.ean13 + "-" + tag.id_control_stock;
          labelsHtml += `
            <div class="label" style="${labelStyle}">
              <div class="product-name" style="margin:0; padding:0; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                <span style="font-size: 18px;">${
                  selectedTrackingProducts[0].product_name
                }</span>
              </div>
              <div class="content-row" style="display:inline-flex; margin-top:5px;">
                <div class="barcode-column" style="display:flex; flex-direction:column;">
                  <svg id="barcode-${i}"></svg>
                  <div style="margin-top:5px; text-align:center; font-family: 'Arial', sans-serif; font-size:18px; color:#999; font-weight: bold;">
                    <i className="pi pi-link"></i> ${newEan}
                  </div>
                </div>
                <div class="info-column" style="display:flex; flex-direction:column;font-weight:bold;">
                  <span class="combination" style="margin:0; width:70px; text-align:center; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                    ${
                      selectedTrackingProducts[0].combination_name
                        ? selectedTrackingProducts[0].combination_name.replace(
                            /-/,
                            "<br />-----<br />"
                          )
                        : ""
                    }
                  </span>
                  <div class="price" style="margin:0; padding:10px 0 0 5px; width:80px; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                    ${
                      selectedTrackingProducts[0].price
                        ? selectedTrackingProducts[0].price.toFixed(2) + " €"
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
            { ean13: info.ean13, id_control_stock: info.id_control_stock },
          ];
          setTagsData(tags);
          let labelsHtml = "";
          tags.forEach((tag, i) => {
            const newEan = tag.ean13 + "-" + tag.id_control_stock;
            labelsHtml += `
              <div class="label" style="margin-bottom:15px;margin-top:15px;margin-left:10px;">
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
                    <span class="combination" style="margin:0; width:70px; text-align:center; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                      ${
                        selectedProduct.combination_name
                          ? selectedProduct.combination_name.replace(
                              /-/,
                              "<br />-----<br />"
                            )
                          : ""
                      }
                    </span>
                    <div class="price" style="margin:0; padding:10px 0 0 5px; width:80px; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                      ${
                        selectedProduct.price
                          ? selectedProduct.price.toFixed(2) + " €"
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
            labelsHtml += `
              <div class="label" style="${labelStyle}">
                <div class="product-name" style="margin:0; padding:0; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                  <span style="font-size: 18px;">${
                    selectedProduct.product_name
                  }</span>
                </div>
                <div class="content-row" style="display:inline-flex; margin-top:5px;">
                  <div class="barcode-column" style="display:flex; flex-direction:column;">
                    <svg id="barcode-${i}"></svg>
                    <div style="margin-top:5px; text-align:center; font-family: 'Arial', sans-serif; font-size:18px; color:#999; font-weight: bold;">
                      <i className="pi pi-link"></i> ${newEan}
                    </div>
                  </div>
                  <div class="info-column" style="display:flex; flex-direction:column;font-weight:bold;">
                    <span class="combination" style="margin:0; width:70px; text-align:center; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                      ${
                        selectedProduct.combination_name
                          ? selectedProduct.combination_name.replace(
                              /-/,
                              "<br />-----<br />"
                            )
                          : ""
                      }
                    </span>
                    <div class="price" style="margin:0; padding:10px 0 0 5px; width:80px; font-family: 'Arial', sans-serif; font-size: 18px; font-weight: bold;">
                      ${
                        selectedProduct.price
                          ? selectedProduct.price.toFixed(2) + " €"
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

  const handleGenerateBarcodes = () => {
    console.log("Iniciando generación de códigos de barras");
    // Se genera un código de barras por cada etiqueta en tagsData
    tagsData.forEach((tag, i) => {
      const elem = previewContainerRef.current
        ? previewContainerRef.current.querySelector(`#barcode-${i}`)
        : null;
      if (elem) {
        // Concatenar ean13 e id_control_stock para formar el valor a codificar
        const newEan = tag.ean13 + "" + tag.id_control_stock;
        console.log(
          `Generando código de barras para elemento barcode-${i} con valor ${newEan}`
        );
        try {
          JsBarcode(elem, newEan, {
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
          elem.style.height = "70px";
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
    const printWindow = window.open("", "_blank", "width=600,height=400");
    printWindow.document.write(`
      <html>
        <head>
          <style>
            @page { size: 62mm 32mm; margin: 1mm; }
            body { margin: 0; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <>
      <Dialog
        header="Etiquetas de Producto"
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
      >
        <div className="p-4">
          <div className="mb-4 flex items-center">
            <InputText
              ref={inputRef}
              placeholder="Buscar por referencia o EAN13..."
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
                          body={(rowData) =>
                            rowData.price ? rowData.price.toFixed(2) + " €" : ""
                          }
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
                          body={(rowData) => (
                            <>
                              {rowData.quantity}
                              {rowData.trackingCount
                                ? ` | ${rowData.trackingCount} `
                                : ""}
                              {rowData.trackingCount && (
                                <i className="pi pi-link"></i>
                              )}
                            </>
                          )}
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
                {finalTracking.length > 0 && (
                  <TabPanel header="Productos con seguimiento">
                    {finalTracking.length > 0 ? (
                      <DataTable
                        value={finalTracking}
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
                          body={(rowData) =>
                            rowData.price ? rowData.price.toFixed(2) + " €" : ""
                          }
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
                              <i className="pi pi-link"></i>{" "}
                              {(rowData.ean13_combination ||
                                rowData.ean13_combination_0) +
                                "-" +
                                rowData.id_control_stock}
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
          <div className="mt-4 flex justify-end">
            <Button
              label={
                selectedProduct?.id_control_stock
                  ? "Reimprimir etiquetas"
                  : "Imprimir etiquetas"
              }
              icon="pi pi-print"
              onClick={openQuantityDialog}
              disabled={
                !selectedProduct &&
                (!selectedTrackingProducts ||
                  selectedTrackingProducts.length === 0)
              }
            />
          </div>
        </div>
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
    </>
  );
}
