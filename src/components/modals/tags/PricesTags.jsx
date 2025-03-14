// src/components/modal/tags/PricesTags.jsx

import { useState, useEffect, useRef, useContext } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { useApiFetch } from "../../../components/utils/useApiFetch";
import { AuthContext } from "../../../contexts/AuthContext";
import useProductSearch from "../../../hooks/useProductSearch"; // nuevo
import JsBarcode from "jsbarcode";
import { TabView, TabPanel } from "primereact/tabview";

export default function PricesTags({
  isOpen,
  onHide,
  widthPercent = "40%",
  heightPercent = "65%",
}) {
  const { shopId, idProfile } = useContext(AuthContext);
  const apiFetch = useApiFetch();

  // Estados locales para el diálogo de cantidad e impresión
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityPrint, setQuantityPrint] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef(null);

  // Nuevos estados para previsualización de etiquetas
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [barcodesReady, setBarcodesReady] = useState(false);
  const previewContainerRef = useRef(null); // nuevo

  // Agregar estado para almacenar los datos de las etiquetas
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
      console.log("DEBUG: Producto seleccionado para carrito:", selected);
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

  const productsWithGroup = flatProducts
    .map((product) => ({
      ...product,
      group: product.id_control_stock
        ? "Productos con seguimiento"
        : "Productos sin seguimiento",
    }))
    .sort((a, b) => a.group.localeCompare(b.group));

  // Nueva lógica para agrupar por (id_product, id_product_attribute, id_shop)_control_stock === null)
  const groupedByProduct = {};
  productsWithGroup.forEach((product) => {
    const key = `${product.id_product}-${
      product.id_product_attribute || "null"
    }-${product.id_shop}`;
    if (!groupedByProduct[key]) {
      // Siempre asignamos el producto base tal cual nos llega
      groupedByProduct[key] = { base: product, tracking: [] };
    }
    if (product.id_control_stock !== null) {
      groupedByProduct[key].tracking.push(product);
    }
  });

  const finalNoTracking = [];
  const finalTracking = [];
  for (const key in groupedByProduct) {
    const group = groupedByProduct[key];
    if (group.base) {
      // Si la cantidad del base es EXACTAMENTE igual al número de registros tracking, no se muestra el base
      if (Number(group.base.quantity) !== group.tracking.length) {
        finalNoTracking.push({
          ...group.base,
          trackingCount: group.tracking.length,
        });
      }
    }
    group.tracking.forEach((rec) => finalTracking.push(rec));
  }

  // Logs de depuración
  console.log("groupedByProduct:", groupedByProduct);
  console.log("finalNoTracking:", finalNoTracking);
  console.log("finalTracking:", finalTracking);

  // Función para abrir el diálogo de cantidad de impresión
  const openQuantityDialog = () => {
    if (!selectedProduct) return;
    setQuantityPrint(1);
    setIsGenerating(false);
    setShowQuantityDialog(true);
  };

  // Estado y función de diálogo para cantidad (similares al código previo)
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const handleConfirmQuantity = async () => {
    if (!selectedProduct) return;

    console.log("DEBUG: selectedProduct antes de payload:", selectedProduct);
    setIsGenerating(true);
    try {
      let ean13 =
        selectedProduct.ean13_combination ||
        selectedProduct.ean13_combination_0 ||
        "0000000000000";
      if (ean13.length < 13) {
        ean13 = ean13.padStart(13, "0");
      } else if (ean13.length > 13) {
        ean13 = ean13.substring(0, 13);
      }
      const payload = {
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
      console.log("DEBUG: Payload para get_product_price_tag:", payload);
      let response = await apiFetch(
        "https://apitpv.anthonyloor.com/get_product_price_tag",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      console.log("DEBUG: Respuesta de get_product_price_tag:", response);
      if (!Array.isArray(response)) {
        response = [response];
      }
      // Se espera que la respuesta tenga una propiedad "tags"
      const tags = response[0].tags || [];
      setTagsData(tags);
      let labelsHtml = "";
      // Se generan tantas etiquetas como elementos tenga tags
      tags.forEach((tag, i) => {
        // Concatenar ean13 e id_control_stock para construir el valor único
        const newEan = tag.ean13 + "'" + tag.id_control_stock;
        labelsHtml += `
          <div class="label" style=" margin-bottom:15px;">
            <div class="product-name" style="margin:0; padding:0; font-weight:bold;">
              <span class="product-name" style="margin:0; font-size: 18px;">${
                selectedProduct.product_name
              }</span>
            </div>
            <div class="content-row" style="display:inline-flex; margin-top:5px;">
              <div class="barcode-column" style="display:flex; flex-direction:column;">
                <svg id="barcode-${i}"></svg>
                <div style="margin-top:5px; text-align:center; font-size:18px; color:#999;">
              <i class="pi pi-link"></i> ${newEan}
            </div>
              </div>
              <div class="info-column" style="display:flex; flex-direction:column;font-weight:bold;">
                <span class="combination" style="margin:0; width:70px; text-align:center; font-size: 18px;">
                  ${
                    selectedProduct.combination_name
                      ? selectedProduct.combination_name.replace(
                          /-/,
                          "<br />-----<br />"
                        )
                      : ""
                  }
                </span>
                <div class="price" style="margin:0; padding:10px 0 0 5px; width:80px; font-size: 18px;">
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
        const newEan = tag.ean13 + "'" + tag.id_control_stock;
        console.log(
          `Generando código de barras para elemento barcode-${i} con valor ${newEan}`
        );
        try {
          JsBarcode(elem, newEan, {
            format: "code128",
            width: 2,
            height: 80,
            displayValue: false,
            fontSize: 18,
            margin: 4,
            textPosition: "bottom",
            textAlign: "center",
            rotation: 0,
          });
          // Se ajusta el ancho del SVG a 220px y se deja el alto de forma automática
          elem.style.width = "235px";
          elem.style.height = "auto";
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
            @page { size: 62mm 29mm; margin: 2; }
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
          width: widthPercent,
          height: heightPercent,
          minWidth: "800px",
          minHeight: "500px",
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
                      >
                        <Column
                          selectionMode="single"
                          headerStyle={{ width: "3em" }}
                        />
                        <Column
                          header="Nombre"
                          body={(rowData) => rowData.product_name}
                        />
                        <Column
                          header="Combinación"
                          body={(rowData) => rowData.combination_name || ""}
                        />
                        <Column
                          header="Precio"
                          body={(rowData) =>
                            rowData.price ? rowData.price.toFixed(2) + " €" : ""
                          }
                        />
                        <Column
                          header="EAN13"
                          body={(rowData) =>
                            rowData.ean13_combination ||
                            rowData.ean13_combination_0 ||
                            ""
                          }
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
                        selectionMode="single"
                        selection={selectedProduct}
                        onSelectionChange={(e) => setSelectedProduct(e.value)}
                        dataKey="id_product_attribute"
                        scrollable
                        emptyMessage="No hay resultados"
                      >
                        <Column
                          selectionMode="single"
                          headerStyle={{ width: "3em" }}
                        />
                        <Column
                          header="Nombre"
                          body={(rowData) => rowData.product_name}
                        />
                        <Column
                          header="Combinación"
                          body={(rowData) => rowData.combination_name || ""}
                        />
                        <Column
                          header="Precio"
                          body={(rowData) =>
                            rowData.price ? rowData.price.toFixed(2) + " €" : ""
                          }
                        />
                        <Column
                          header="EAN13"
                          body={(rowData) => (
                            <>
                              <i className="pi pi-link"></i>{" "}
                              {(rowData.ean13_combination ||
                                rowData.ean13_combination_0) +
                                "'" +
                                rowData.id_control_stock}
                            </>
                          )}
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
              label="Imprimir etiquetas"
              icon="pi pi-print"
              onClick={openQuantityDialog}
              disabled={!selectedProduct}
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
