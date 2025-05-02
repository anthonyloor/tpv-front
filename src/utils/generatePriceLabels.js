export function generatePriceLabels(detailedData, options = {}) {
  // Opciones para aplicar descuentos si están habilitados
  const { discountEnabled = false, discountPrices = {} } = options;
  const labelStyle =
    "box-sizing:border-box; margin-top:15px;margin-left:15px; page-break-after: always; break-after: page;";
  let labelsHtml = "";
  detailedData.forEach(({ detail, productInfo }, i) => {
    // Formatear el nombre del producto en title case
    const prodName = (productInfo.product_name || "")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    // Obtener la combinación y reemplazar "-" por la separación requerida
    let combination = productInfo.combination_name || "";
    if (combination) {
      combination = combination.replace(/-/g, "<br />-----<br />");
    }
    // Generar una etiqueta por cada control_stock en detail.control_stocks
    if (detail.control_stocks && detail.control_stocks.length > 0) {
      detail.control_stocks.forEach((cs, csIndex) => {
        const barcodeText = (detail.ean13 || "") + "-" + cs.id_control_stock;
        const basePrice = productInfo.price || detail.price || "";
        const tagPrice = basePrice ? basePrice + " €" : "";
        const key = detail.id_product_attribute;
        const newPrice =
          discountEnabled && discountPrices[key]
            ? `<span style="text-decoration: line-through;font-size: 12px;">${tagPrice}</span>
             <span style="color:red;font-size: 18px; font-weight: bold;">${discountPrices[key]} €</span>`
            : tagPrice;
        labelsHtml += `
          <div class="label" style="${labelStyle}">
            <div class="product-name" style="margin:0; padding:0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">
              <span style="font-size: 18px;">${prodName}</span>
            </div>
            <div class="content-row" style="display:inline-flex; margin-top:5px;">
              <div class="barcode-column" style="display:flex; flex-direction:column;">
                <svg id="barcode-${i}-${csIndex}"></svg>
                <div style="margin-top:5px; text-align:center; font-family: Arial, sans-serif; font-size:18px; color:#999; font-weight: bold;">
                  <i class="pi pi-link"></i> ${barcodeText}
                </div>
              </div>
              <div class="info-column" style="display:flex; flex-direction:column;font-weight:bold;">
                <span class="combination" style="margin:0; text-align:center; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">
                  ${combination}
                </span>
                <div class="price" style="margin:0; padding:10px 0px 0px 0px; width:90px; text-align:center; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold;">
                  ${newPrice}
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }
  });
  return labelsHtml;
}
