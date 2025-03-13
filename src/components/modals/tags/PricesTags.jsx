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

export default function PricesTags({ isOpen, onHide }) {
  const { shopId } = useContext(AuthContext);

  // Estados principales
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Para el diálogo de confirmar cantidad
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [quantityPrint, setQuantityPrint] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const apiFetch = useApiFetch();
  const inputRef = useRef(null);

  // Al abrir este diálogo principal, reiniciar estados
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setIsLoading(false);
      setResults([]);
      setSelectedProduct(null);
      setShowQuantityDialog(false);
      setQuantityPrint(1);
      setIsGenerating(false);

      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  // === 1) BÚSQUEDA DE PRODUCTOS =======================================================
  const groupProductsByProductName = (products) => {
    // Agrupa productos por product_name
    const valid = products.filter(
      (p) =>
        p.id_product_attribute !== null ||
        p.ean13_combination !== null ||
        p.ean13_combination_0 !== null
    );
    return valid.reduce((acc, prod) => {
      const existing = acc.find((g) => g.product_name === prod.product_name);
      const shopStock = {
        id_shop: prod.id_shop,
        quantity: prod.quantity,
        id_stock_available: prod.id_stock_available,
      };
      if (existing) {
        const existingComb = existing.combinations.find(
          (c) => c.id_product_attribute === prod.id_product_attribute
        );
        if (existingComb) {
          existingComb.stocks.push(shopStock);
        } else {
          existing.combinations.push({ ...prod, stocks: [shopStock] });
        }
      } else {
        acc.push({
          product_name: prod.product_name,
          image_url: prod.image_url,
          combinations: [{ ...prod, stocks: [shopStock] }],
        });
      }
      return acc;
    }, []);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    apiFetch(
      `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
        searchTerm
      )}`,
      { method: "GET" }
    )
      .then((resp) => {
        const grouped = groupProductsByProductName(resp);
        // Aplana
        const flat = [];
        grouped.forEach((g) => {
          g.combinations.forEach((comb) => {
            flat.push({
              ...comb,
              fullName: `${g.product_name} ${
                comb.combination_name || ""
              }`.trim(),
            });
          });
        });
        setResults(flat);
      })
      .catch((err) => {
        console.error("Error buscando producto:", err);
      })
      .finally(() => setIsLoading(false));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // === 2) AL PULSAR "IMPRIMIR ETIQUETAS" EN EL DIALOG PRINCIPAL =======================
  const openQuantityDialog = () => {
    if (!selectedProduct) return;
    setShowQuantityDialog(true);
  };

  // === 3) CONFIRMAR LA CANTIDAD Y GENERAR ETIQUETAS EN NUEVA VENTANA ==================
  const handleConfirmQuantity = async () => {
    if (!selectedProduct) return;

    setIsGenerating(true);

    try {
      // Comentamos la llamada a get_product_price_tag para no perderla
      /*
      const payload = {
        quantity_print: quantityPrint,
        id_control_stock: selectedProduct.id_control_stock
          ? selectedProduct.id_control_stock
          : null,
        ean13:
          selectedProduct.ean13_combination ||
          selectedProduct.ean13_combination_0 ||
          "",
        id_product: selectedProduct.id_product,
        id_product_attribute: selectedProduct.id_product_attribute,
        id_shop: selectedProduct.id_shop,
        quantity: selectedProduct.quantity,
      };
      
      let response = await apiFetch(
        "https://apitpv.anthonyloor.com/get_product_price_tag",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      
      // Aseguramos que response sea arreglo
      if (!Array.isArray(response)) { 
        response = [response]; 
      }
      */

      // Obtenemos el EAN13 del producto seleccionado
      const ean13 =
        selectedProduct.ean13_combination ||
        selectedProduct.ean13_combination_0 ||
        "0000000000000"; // EAN13 por defecto si no hay ninguno

      // Generamos el HTML para la ventana de impresión
      // Usaremos JsBarcode para generar los códigos de barras directamente en la ventana
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <title>Etiquetas de Producto</title>
            <!-- Incluimos JsBarcode desde CDN -->
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              .label {
                border: 1px solid #000;
                padding: 5mm;
                margin-bottom: 10mm;
                width: 90mm;
                height: 29mm;
                box-sizing: border-box;
                page-break-after: always;
              }
              .product-name { 
                font-size: 14px; 
                font-weight: bold; 
                margin-bottom: 2mm;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .barcode-row { 
                display: flex; 
                align-items: center;
                margin-bottom: 2mm;
              }
              .barcode-container { 
                width: 40mm; 
              }
              svg.barcode {
                width: 100%;
                height: auto;
              }
              .combination { 
                margin-left: 3mm; 
                font-size: 12px;
              }
              .footer-row { 
                display: flex; 
                justify-content: space-between; 
                font-size: 14px;
              }
              .print-button {
                margin-bottom: 20px;
              }
              .print-button button {
                padding: 8px 16px;
                margin-right: 10px;
                cursor: pointer;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
              }
              .print-button button.close {
                background-color: #f44336;
              }
              @media print {
                body {
                  padding: 0;
                }
                .label {
                  border: none;
                  margin-bottom: 0;
                }
                .print-button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-button">
              <button onclick="window.print()">Imprimir</button>
              <button class="close" onclick="window.close()">Cerrar</button>
            </div>`;

      // Generamos un div para cada etiqueta
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

      // Añadimos el script para generar los códigos de barras con JsBarcode
      htmlContent += `
            <script>
              // Función para generar los códigos de barras cuando el DOM esté listo
              document.addEventListener('DOMContentLoaded', function() {
                // Aseguramos que el EAN13 tenga 13 dígitos
                let ean13 = "${ean13}";
                if (ean13.length < 13) {
                  ean13 = ean13.padStart(13, '0');
                } else if (ean13.length > 13) {
                  ean13 = ean13.substring(0, 13);
                }
                
                // Generamos los códigos de barras para cada etiqueta
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

      // Abrimos una nueva ventana y escribimos el HTML
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Enfocamos la ventana para que el usuario la vea
        printWindow.focus();
      } else {
        alert("Por favor, permite las ventanas emergentes para esta página.");
      }
    } catch (error) {
      console.error("Error al generar etiquetas:", error);
      alert("Error al generar las etiquetas. Por favor, inténtelo de nuevo.");
    } finally {
      setIsGenerating(false);
      setShowQuantityDialog(false);
    }
  };

  // Nueva plantilla para mostrar la cantidad filtrada por tienda actual
  const quantityBodyTemplate = (rowData) => {
    const currentStock = rowData.stocks
      ? rowData.stocks.find((stock) => stock.id_shop === shopId)
      : null;
    return currentStock ? currentStock.quantity : rowData.quantity;
  };

  // === Render principal ===============================================================

  return (
    <>
      {/* 1) DIALOG PRINCIPAL */}
      <Dialog
        header="Etiquetas de Producto"
        visible={isOpen}
        onHide={onHide}
        modal
        draggable={false}
        resizable={false}
      >
        <div className="p-4">
          {/* Búsqueda */}
          <div className="mb-4 flex items-center">
            <InputText
              ref={inputRef}
              placeholder="Buscar por referencia o EAN13..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
              onKeyDown={handleKeyDown}
              className="w-full"
            />
            <Button
              icon="pi pi-search"
              onClick={handleSearch}
              className="ml-2"
            />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <ProgressSpinner />
            </div>
          ) : (
            <DataTable
              value={results}
              responsiveLayout="scroll"
              selectionMode="single"
              selection={selectedProduct}
              onSelectionChange={(e) => setSelectedProduct(e.value)}
              emptyMessage="No hay resultados"
            >
              <Column selectionMode="single" headerStyle={{ width: "3em" }} />
              <Column
                header="Nombre Completo"
                body={(rowData) => rowData.fullName}
              />
              <Column
                header="Precio"
                body={(rowData) =>
                  rowData.price ? rowData.price.toFixed(2) + " €" : ""
                }
                style={{ textAlign: "right" }}
              />
              <Column
                header="EAN13"
                body={(rowData) =>
                  rowData.ean13_combination || rowData.ean13_combination_0 || ""
                }
              />
              <Column
                header="Cantidad"
                body={quantityBodyTemplate}
                style={{ textAlign: "right" }}
              />
            </DataTable>
          )}
          {/* Botón para "Imprimir etiquetas" => abre diálogo de cantidad */}
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

      {/* 2) DIALOG PARA CONFIRMAR CANTIDAD */}
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
