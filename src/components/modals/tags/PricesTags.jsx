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

export default function PricesTags({
  isOpen,
  onHide,
  widthPercent = "40%",
  heightPercent = "65%",
}) {
  const { shopId } = useContext(AuthContext);
  const apiFetch = useApiFetch();

  // Estados locales para el diálogo de cantidad e impresión
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityPrint, setQuantityPrint] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef(null);

  // Usar el hook de búsqueda (se usa onAddProduct para actualizar el producto seleccionado)
  const {
    groupedProducts,
    isLoading,
    handleSearch,
    addProductToCart, // en este caso no se usará para agregar, sino para actualizar selección si se quiere
    handleCancelAdd,
    handleConfirmAdd,
  } = useProductSearch({
    apiFetch,
    shopId,
    // Permitir impresión aun sin stock (según requerimiento, se puede ajustar)
    allowOutOfStockSales: true,
    onAddProduct: (
      prod,
      stockQuantity,
      exceedsStockCallback,
      forceAdd,
      qty
    ) => {
      setSelectedProduct(prod);
    },
    onAddDiscount: () => {},
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

  // Aplanar grupos para alimentar el DataTable (similar a ProductSearchCard)
  const flatProducts = groupedProducts
    .reduce((acc, group) => {
      const combos = group.combinations.map((combo) => ({
        ...combo,
        fullName: `${group.product_name} ${
          combo.combination_name || ""
        }`.trim(),
      }));
      return acc.concat(combos);
    }, [])
    .sort((a, b) => a.product_name.localeCompare(b.product_name));

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
    setIsGenerating(true);
    try {
      const ean13 =
        selectedProduct.ean13_combination ||
        selectedProduct.ean13_combination_0 ||
        "0000000000000";
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <title>Etiquetas de Producto</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
              /* ...existing styles... */
            </style>
          </head>
          <body>
            <div class="print-button">
              <button onclick="window.print()">Imprimir</button>
              <button class="close" onclick="window.close()">Cerrar</button>
            </div>`;
      for (let i = 0; i < quantityPrint; i++) {
        htmlContent += `
          <div class="label">
            <div class="product-name">${selectedProduct.fullName}</div>
            <div class="barcode-row">
              <div class="barcode-container">
                <svg class="barcode" id="barcode-${i}"></svg>
              </div>
              <div class="combination">${
                selectedProduct.combination_name || ""
              }</div>
            </div>
            <div class="footer-row">
              <span>${ean13}</span>
              <span>${
                selectedProduct.price
                  ? selectedProduct.price.toFixed(2) + " €"
                  : ""
              }</span>
            </div>
          </div>
        `;
      }
      htmlContent += `
            <script>
              document.addEventListener('DOMContentLoaded', function() {
                let ean13 = "${ean13}";
                if (ean13.length < 13) {
                  ean13 = ean13.padStart(13, '0');
                } else if (ean13.length > 13) {
                  ean13 = ean13.substring(0, 13);
                }
                for (let i = 0; i < ${quantityPrint}; i++) {
                  try {
                    JsBarcode("#barcode-" + i, ean13, {
                      format: "EAN13",
                      width: 2,
                      height: 50,
                      displayValue: true,
                      fontSize: 12,
                      margin: 0
                    });
                  } catch (error) {
                    console.error("Error generando código de barras:", error);
                    document.getElementById("barcode-" + i).insertAdjacentHTML('afterend', 
                      '<div style="color: red; font-size: 10px;">Error al generar código de barras</div>');
                  }
                }
              });
            </script>
          </body>
        </html>`;
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
      } else {
        alert("Por favor, permite las ventanas emergentes para esta página.");
      }
    } catch (error) {
      console.error("Error al generar etiquetas:", error);
      alert("Error al generar las etiquetas. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
      setShowQuantityDialog(false);
    }
  };

  return (
    <>
      {/* ...existing code... */}
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
            <DataTable
              value={flatProducts}
              groupField="product_name"
              selectionMode="single"
              selection={selectedProduct}
              onSelectionChange={(e) => setSelectedProduct(e.value)}
              dataKey="id_product_attribute"
              scrollable
              emptyMessage="No hay resultados"
            >
              <Column selectionMode="single" headerStyle={{ width: "3em" }} />
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
                  rowData.ean13_combination || rowData.ean13_combination_0 || ""
                }
              />
              <Column
                header="Cantidad"
                body={(rowData) => {
                  const current = rowData.stocks
                    ? rowData.stocks.find(
                        (stock) => Number(stock.id_shop) === Number(shopId)
                      )
                    : null;
                  return current ? current.quantity : rowData.quantity;
                }}
              />
            </DataTable>
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
    </>
  );
}
