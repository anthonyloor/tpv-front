// src/components/modal/PricesTags.jsx

import React, { useState, useRef, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { useApiFetch } from "../../../components/utils/useApiFetch";

const PricesTags = ({ isOpen, onHide }) => {
  // Estados existentes
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // Nuevos estados
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [quantityPrint, setQuantityPrint] = useState(1);

  const inputRef = useRef(null);
  const apiFetch = useApiFetch();

  // Al abrir el modal se reinician los estados y se enfoca el input
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setResults([]);
      setSelectedProduct(null);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  // Función de agrupación similar a ProductSearchCard
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

  // Función de búsqueda que aplica el filtrado y la agrupación
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const response = await apiFetch(
        `https://apitpv.anthonyloor.com/product_search?b=${encodeURIComponent(
          searchTerm
        )}`,
        { method: "GET" }
      );
      // Aplica filtrado de productos válidos y agrúpalos
      const groupedProducts = groupProductsByProductName(response);
      // Aplana los grupos en una lista única y añade la propiedad fullName
      const flatProducts = groupedProducts.reduce((acc, group) => {
        const combos = group.combinations.map((combo) => ({
          ...combo,
          fullName: `${group.product_name} ${
            combo.combination_name || ""
          }`.trim(),
        }));
        return acc.concat(combos);
      }, []);
      setResults(flatProducts);
    } catch (error) {
      console.error("Error buscando producto:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Permite buscar al presionar Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Nueva función para confirmar impresión
  const handlePrintConfirm = async () => {
    if (!selectedProduct) return;
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
    console.log("Confirmando impresión, payload:", payload);
    try {
      let response = await apiFetch(
        "https://apitpv.anthonyloor.com/get_product_price_tag",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      // Aseguramos que response sea arreglo
      if (!Array.isArray(response)) { response = [response]; }
      // Se arma el texto de código de barras para cada etiqueta
      // usaremos el ean13 concatenado con "'" + id_control_stock si existe
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <title>Vista Etiquetas</title>
            <!-- Incluir bwip‑js vía CDN -->
            <script src="https://unpkg.com/bwip-js@latest/dist/bwip-js-min.js"></script>
            <style>
              .label {
                border: 1px solid #000;
                padding: 5px;
                margin: 10px;
                width: 60mm;
                height: 28mm;
                font-family: Arial, sans-serif;
              }
              .line1 { font-size: 14px; font-weight: bold; }
              .line2 { display: flex; align-items: center; }
              .barcode-container { width: 40mm; }
              .combination { margin-left: 5px; }
              .line3 { text-align: right; font-size: 16px; margin-top: 5px; }
            </style>
          </head>
          <body>`;
      response.forEach((label, index) => {
        // Generamos el texto del barcode: si id_control_stock existe, concatenar "'" + id_control_stock
        const barcodeText = label.id_control_stock 
          ? label.ean13 + "'" + label.id_control_stock 
          : label.ean13;
        htmlContent += `
          <div class="label">
            <div class="line1">${selectedProduct.fullName}</div>
            <div class="line2">
              <div id="barcode-${index}" class="barcode-container"></div>
              <div class="combination">${selectedProduct.combination_name || ""}</div>
            </div>
            <div class="line3">${selectedProduct.price ? selectedProduct.price.toFixed(2) + " €" : ""}</div>
          </div>
        `;
      });
      htmlContent += `
            <script>
              document.addEventListener('DOMContentLoaded', function() {
                const labels = document.querySelectorAll('.label');
                labels.forEach((element, index) => {
                  // Obtenemos el texto del barcode para cada etiqueta desde el array de respuesta
                  // Usamos el mismo valor que generamos en el HTML para simplificar 
                  const barcodeData = element.querySelector('.barcode-container').id === "barcode-" + index 
                    ? responseData[index].ean13 + (responseData[index].id_control_stock ? "'" + responseData[index].id_control_stock : "") 
                    : "";
                  // Para evitar complicaciones, usaremos el mismo valor almacenado en un atributo data en cada contenedor
                  // Mejor: en el HTML, grabamos data-barcode en el contenedor:
                  // Como alternativa, reconstruimos el valor aquí:
                  let txt = element.querySelector('.barcode-container').getAttribute('data-barcode');
                  if (!txt) { txt = ""; }
                  BwipJS.toSVG({
                    bcid: 'ean13',
                    text: txt,
                    scale: 3,
                    height: 10,
                    includetext: true,
                    textxalign: 'center'
                  }, function(err, svg) {
                    if (!err) {
                      element.querySelector('.barcode-container').innerHTML = svg;
                    } else {
                      console.error("Error generando barcode:", err);
                    }
                  });
                });
              });
              // Para pasar la data de la respuesta al script, inyectamos la variable responseData
              var responseData = ${JSON.stringify(response)};
              // Además, asignamos el atributo data-barcode a cada contenedor
              document.addEventListener('DOMContentLoaded', function() {
                responseData.forEach((item, index) => {
                  const container = document.getElementById("barcode-" + index);
                  if (container) {
                    const txt = item.id_control_stock ? item.ean13 + "'" + item.id_control_stock : item.ean13;
                    container.setAttribute("data-barcode", txt);
                  }
                });
              });
            </script>
          </body>
        </html>`;
      const printWindow = window.open("", "_blank", "width=800,height=600");
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (error) {
      console.error("Error al solicitar impresión:", error);
    } finally {
      setShowPrintModal(false);
    }
  };

  // Plantillas para las columnas de la tabla
  const fullNameBodyTemplate = (rowData) => rowData.fullName;
  const priceBodyTemplate = (rowData) =>
    rowData.price ? rowData.price.toFixed(2) + " €" : "";
  const eanBodyTemplate = (rowData) =>
    rowData.ean13_combination || rowData.ean13_combination_0 || "";
  const quantityBodyTemplate = (rowData) => rowData.quantity;

  return (
    <Dialog
      header="Etiquetas"
      visible={isOpen}
      onHide={onHide}
      modal
      style={{ width: "50vw" }}
      draggable={false}
      resizable={false}
    >
      <div className="p-4">
        <div className="mb-4 flex items-center">
          <InputText
            ref={inputRef}
            placeholder="Buscar producto por referencia o EAN13..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
          <Button icon="pi pi-search" onClick={handleSearch} className="ml-2" />
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center">
            <ProgressSpinner />
          </div>
        ) : (
          // Modificación: se añade selección a la DataTable
          <DataTable
            value={results}
            responsiveLayout="scroll"
            selectionMode="single"
            selection={selectedProduct}
            onSelectionChange={(e) => setSelectedProduct(e.value)}
          >
            <Column selectionMode="single" headerStyle={{ width: "3em" }} />
            <Column header="Nombre Completo" body={fullNameBodyTemplate} />
            <Column
              header="Precio"
              body={priceBodyTemplate}
              style={{ textAlign: "right" }}
            />
            <Column header="EAN13" body={eanBodyTemplate} />
            <Column
              header="Cantidad"
              body={quantityBodyTemplate}
              style={{ textAlign: "right" }}
            />
          </DataTable>
        )}
        {/* Botón para imprimir etiquetas */}
        <div className="mt-4">
          <Button
            label="Imprimir etiquetas"
            onClick={() => {
              console.log("Producto seleccionado:", selectedProduct);
              setShowPrintModal(true);
            }}
            disabled={!selectedProduct}
          />
        </div>
      </div>

      {/* Modal para solicitar número de etiquetas a imprimir */}
      <Dialog
        header="Número de etiquetas a imprimir"
        visible={showPrintModal}
        onHide={() => setShowPrintModal(false)}
        modal
      >
        <div className="p-4">
          <InputText
            type="number"
            value={quantityPrint}
            onChange={(e) => setQuantityPrint(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-4 flex justify-end">
            <Button label="Confirmar" onClick={handlePrintConfirm} />
          </div>
        </div>
      </Dialog>
    </Dialog>
  );
};

export default PricesTags;
