import createPdf from "./createPdf.js";
import JsBarcode from "jsbarcode";

// Agregamos un helper común para impresión remota:
const attemptRemotePrint = async (pdfDefinition) => {
  // Intentar generar PDF en base64
  try {
    const ticketResponse = await createPdf(pdfDefinition, "b64");
    if (ticketResponse.success && ticketResponse.content) {
      const printResponse = await fetch("http://localhost:3001/imprimir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64pdf: ticketResponse.content,
          printerName: "POS-80C",
        }),
      });
      if (printResponse.ok) {
        // Se pudo imprimir remotamente
        return {
          success: true,
          remote: true,
          message: "Impresión remota exitosa",
        };
      }
    }
  } catch (err) {
    console.warn("Error en impresión remota:", err);
  }
  // Si falla, se retorna null para proceder con la previsualización normal.
  return null;
};

// Se actualiza la función para recibir orderData, config, employeesDict y ticketGift
const generateTicket = async (
  output,
  orderData,
  config,
  employeesDict,
  ticketGift = false
) => {
  if (!orderData) {
    return {
      success: false,
      content: null,
      message: "No se proporcionaron datos de la orden.",
    };
  }

  // Cargar logo desde /logo-fajas-maylu.png y convertirlo a DataURL (base64) con control de error
  let logoDataUrl = "";
  try {
    const response = await fetch("/logo-fajas-maylu.png");
    if (response.ok) {
      const blob = await response.blob();
      logoDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (typeof logoDataUrl !== "string" || !logoDataUrl.startsWith("data:")) {
        console.warn("Logo no válido, se omitirá en el ticket.");
        logoDataUrl = "";
      }
    } else {
      console.warn("No se pudo cargar el logo, status:", response.status);
    }
  } catch (err) {
    console.warn("Error al cargar el logo:", err);
    logoDataUrl = "";
  }

  // Construir tabla de productos según tipo de ticket
  const productTableBody = [];
  if (ticketGift) {
    productTableBody.push([
      { text: "PRODUCTO", style: "tProductsHeader" },
      { text: "UND", style: "tProductsHeader", alignment: "center" },
    ]);
  } else {
    productTableBody.push([
      { text: "PRODUCTO", style: "tProductsHeader" },
      { text: "UND", style: "tProductsHeader", alignment: "center" },
      { text: "PRECIO", style: "tProductsHeader", alignment: "right" },
      { text: "TOTAL", style: "tProductsHeader", alignment: "right" },
    ]);
  }

  orderData.order_details.forEach((item) => {
    let displayName = item.product_name;
    if (
      item.product_reference &&
      item.product_name.includes(item.product_reference)
    ) {
      const pos = item.product_name.indexOf(item.product_reference);
      displayName = item.product_name.substring(pos);
    }

    const quantity = item.product_quantity;
    if (ticketGift) {
      // Para ticket regalo se ocultan columnas de precios y totales
      productTableBody.push([
        { text: displayName, style: "tProductsBody" },
        {
          text: quantity.toString(),
          style: "tProductsBody",
          alignment: "center",
        },
      ]);
    } else {
      // Calcular precios unitarios y formato condicional (ticket normal)
      const unitPrice = item.unit_price_tax_incl;
      const hasDiscount = item.reduction_amount_tax_incl !== 0;
      const finalUnitPrice = hasDiscount
        ? item.reduction_amount_tax_incl
        : unitPrice;

      const unitPriceText = hasDiscount
        ? [
            { text: unitPrice.toFixed(2) + " €", decoration: "lineThrough" },
            "\n",
            {
              text: finalUnitPrice.toFixed(2) + " €",
              color: "var(--red-500)",
              bold: true,
            },
          ]
        : unitPrice.toFixed(2) + " €";

      const totalOriginal = unitPrice * quantity;
      const totalText = hasDiscount
        ? [
            {
              text: totalOriginal.toFixed(2) + " €",
              decoration: "lineThrough",
            },
            "\n",
            {
              text: (finalUnitPrice * quantity).toFixed(2) + " €",
              color: "var(--red-500)",
              bold: true,
            },
          ]
        : totalOriginal.toFixed(2) + " €";

      productTableBody.push([
        { text: displayName, style: "tProductsBody" },
        {
          text: quantity.toString(),
          style: "tProductsBody",
          alignment: "center",
        },
        { text: unitPriceText, style: "tProductsBody", alignment: "right" },
        { text: totalText, style: "tProductsBody", alignment: "right" },
      ]);
    }
  });

  // Calcular totales (ticket normal)
  const dateObj = new Date(orderData.date_add);
  const formattedDate = dateObj.toLocaleDateString("es-ES");
  const formattedTime = dateObj.toLocaleTimeString("es-ES");

  const generateBarcodeDataUrl = (text) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "code128",
      width: 1,
      height: 30,
      displayValue: false,
      margin: 2,
      rotation: 0,
    });
    return canvas.toDataURL("image/png");
  };
  let totalsBody = [];
  if (!ticketGift) {
    const subtotal = orderData.order_details.reduce((sum, item) => {
      return sum + item.unit_price_tax_incl * item.product_quantity;
    }, 0);

    const totalDiscounts = orderData.order_details.reduce((sum, item) => {
      if (item.reduction_amount_tax_incl !== 0) {
        return (
          sum +
          (item.unit_price_tax_incl - item.reduction_amount_tax_incl) *
            item.product_quantity
        );
      }
      return sum;
    }, 0);

    const totalAfterDiscount = orderData.total_paid;
    const iva = orderData.total_paid - orderData.total_paid / 1.21;

    totalsBody.push([
      { text: "SUBTOTAL:", style: "tTotals" },
      {
        text: subtotal.toFixed(2) + " €",
        style: "tTotals",
        alignment: "right",
      },
    ]);
    if (totalDiscounts !== 0) {
      totalsBody.push([
        { text: "TOTAL DESCUENTOS:", style: "tTotals" },
        {
          text: totalDiscounts.toFixed(2) + " €",
          style: "tTotals",
          alignment: "right",
        },
      ]);
    }
    if (orderData.id_shop === 1 || orderData.id_shop === 13) {
      totalsBody.push([
        { text: "ENVIO:", style: "tTotals" },
        {
          text: (orderData.total_shipping || 0).toFixed(2) + " €",
          style: "tTotals",
          alignment: "right",
        },
      ]);
    }
    totalsBody.push(
      [
        { text: "I.V.A (21%):", style: "tTotals" },
        { text: iva.toFixed(2) + " €", style: "tTotals", alignment: "right" },
      ],
      [
        { text: "TOTAL:", style: "tTotals" },
        {
          text: totalAfterDiscount.toFixed(2) + " €",
          style: "tTotals",
          alignment: "right",
        },
      ]
    );
  }

  // Construir el contenido del ticket
  const content = [
    ...(logoDataUrl
      ? [
          {
            image: logoDataUrl,
            //fit: [141.73, 56.692],
            fit: [170.07, 70.86],
            alignment: "center",
          },
        ]
      : []),
    // Encabezados de config en mayúsculas y negrita
    ...(config.ticket_text_header_1
      ? [
          {
            text: config.ticket_text_header_1.toUpperCase(),
            style: "header",
            margin: [0, 10, 10, 0],
            bold: true,
          },
        ]
      : []),
    ...(config.ticket_text_header_2
      ? [
          {
            text: config.ticket_text_header_2.toUpperCase(),
            style: "header",
            bold: true,
          },
        ]
      : []),
    // Datos: fecha y hora extraída de date_add
    {
      margin: [0, 10, 15, 0],
      table: {
        widths: ["50%", "50%"],
        body: [
          [
            { text: "FECHA:", style: "tHeaderLabel" },
            { text: formattedDate, style: "tHeaderValue" },
          ],
          [
            { text: "HORA:", style: "tHeaderLabel" },
            { text: formattedTime, style: "tHeaderValue" },
          ],
        ],
      },
      layout: "noBorders",
    },
    // Cliente, Direccion y Empleado
    {
      text: `CLIENTE: ${
        Number(orderData.id_customer) === Number(config.id_customer_default)
          ? "TPV"
          : orderData.customer_name
      }`,
      style: "tHeaderValue",
      margin: [0, 2, 15, 0],
    },
    {
      text: `DIRECCION: ${orderData.address_delivery_name}`,
      style: "tHeaderValue",
      margin: [0, 2, 15, 0],
    },
    {
      text: `EMPLEADO: ${
        orderData.id_shop === 1 || orderData.id_shop === 13
          ? "ONLINE"
          : employeesDict[orderData.id_employee]
          ? employeesDict[orderData.id_employee]
          : "TPV"
      }`,
      style: "tHeaderValue",
      margin: [0, 5, 15, 0],
    },
    // Tabla de productos
    {
      margin: [0, 10, 15, 0],
      table: {
        widths: [
          "42%",
          ticketGift ? "58%" : "14%",
          ...(ticketGift ? [] : ["22%", "22%"]),
        ],
        headerRows: 1,
        body: productTableBody,
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 0,
        hLineColor: () => "#000000",
        paddingTop: (i, node) => (i === 0 ? 10 : 5),
      },
    },
    // Incluir tabla de totales solo para ticket normal
    ...(!ticketGift
      ? [
          {
            margin: [0, 10, 20, 0],
            table: {
              widths: ["50%", "50%"],
              body: totalsBody,
            },
            layout: "noBorders",
          },
        ]
      : []),
    // Forma de pago
    ...(orderData.id_shop === 1 || orderData.id_shop === 13
      ? [
          {
            text: `FORMA DE PAGO: ${orderData.payment || ""}`,
            style: "tTotals",
            margin: [0, 10, 15, 0],
          },
        ]
      : [
          { text: "FORMA DE PAGO:", style: "tTotals", margin: [0, 10, 15, 0] },
          {
            margin: [0, 2, 15, 0],
            table: {
              widths: ["33%", "33%", "33%"],
              body: [
                [
                  { text: "EFECTIVO:", style: "tTotals" },
                  { text: "TARJETA:", style: "tTotals" },
                  { text: "BIZUM:", style: "tTotals" },
                ],
                [
                  {
                    text:
                      orderData.payment_amounts?.total_cash?.toString() || "0",
                    style: "tTotals",
                    alignment: "right",
                  },
                  {
                    text:
                      orderData.payment_amounts?.total_card?.toString() || "0",
                    style: "tTotals",
                    alignment: "right",
                  },
                  {
                    text:
                      orderData.payment_amounts?.total_bizum?.toString() || "0",
                    style: "tTotals",
                    alignment: "right",
                  },
                ],
              ],
            },
            layout: "noBorders",
          },
        ]),
    // Nota de pie (si existen) con mayúsculas y negrita
    ...(config.ticket_text_footer_1
      ? [
          {
            text: config.ticket_text_footer_1.toUpperCase(),
            style: "text",
            alignment: "center",
            margin: [0, 5, 15, 0],
            bold: true,
          },
        ]
      : []),
    ...(config.ticket_text_footer_2
      ? [
          {
            text: config.ticket_text_footer_2.toUpperCase(),
            style: "text",
            alignment: "center",
            margin: [0, 2, 15, 0],
            bold: true,
          },
        ]
      : []),
    {
      stack: [
        {
          image: generateBarcodeDataUrl(orderData.id_order.toString()),
          alignment: "center",
          margin: [0, 10, 10, 3],
        },
        {
          text: "#" + orderData.id_order,
          style: "text",
          fontSize: 14,
          alignment: "center",
        },
      ],
    },
  ];

  const pdfDefinition = {
    content,
    defaultStyle: { font: "Arial", fontSize: 14 },
  };
  // Si se está llamando en modo “print”, intentar impresión remota
  if (output === "print") {
    const remoteResult = await attemptRemotePrint(pdfDefinition);
    if (remoteResult) return remoteResult;
  }
  const response = await createPdf(pdfDefinition, output);
  return response;
};

export default generateTicket;

// Nueva función para generar ticket de cierre de caja
export const generateClosureTicket = async (
  output,
  closureData,
  config,
  employeesDict,
  employeeName
) => {
  // Formatear fechas
  const formattedOpenDate = new Date(closureData.date_add).toLocaleString(
    "es-ES"
  );
  const formattedCloseDate = new Date(closureData.date_close).toLocaleString(
    "es-ES"
  );

  const content = [
    // Encabezados de config en mayúsculas y negrita
    ...(config.ticket_text_header_1
      ? [
          {
            text: config.ticket_text_header_1.toUpperCase(),
            style: "header",
            margin: [0, 10, 10, 0],
            bold: true,
          },
        ]
      : []),
    ...(config.ticket_text_header_2
      ? [
          {
            text: config.ticket_text_header_2.toUpperCase(),
            style: "header",
            bold: true,
          },
        ]
      : []),
    // Fechas de apertura y cierre y empleados
    {
      margin: [0, 10, 15, 0],
      table: {
        widths: ["50%", "50%"],
        body: [
          [
            { text: "TIENDA:", style: "tHeaderLabel" },
            { text: closureData.shop_name || "N/A", style: "tHeaderValue" },
          ],
          [
            { text: "FECHA APERTURA:", style: "tHeaderLabel" },
            { text: formattedOpenDate, style: "tHeaderValue" },
          ],
          [
            { text: "EMPLEADO APERTURA:", style: "tHeaderLabel" },
            {
              text: employeesDict[Number(closureData.employee_open)]
                ? employeesDict[Number(closureData.employee_open)]
                : "TPV",
              style: "tHeaderValue",
            },
          ],
          [
            { text: "FECHA CIERRE:", style: "tHeaderLabel" },
            { text: formattedCloseDate, style: "tHeaderValue" },
          ],
          [
            { text: "EMPLEADO CIERRE:", style: "tHeaderLabel" },
            { text: employeeName, style: "tHeaderValue" },
          ],
        ],
      },
      layout: "noBorders",
    },
    // Tabla de totales e información
    {
      margin: [0, 10, 15, 0],
      table: {
        widths: ["50%", "50%"],
        body: [
          [
            { text: "TOTAL EFECTIVO:", style: "tTotals" },
            {
              text: closureData.total_cash.toFixed(2) + " €",
              style: "tTotals",
              alignment: "right",
            },
          ],
          [
            { text: "TOTAL TARJETA:", style: "tTotals" },
            {
              text: closureData.total_card.toFixed(2) + " €",
              style: "tTotals",
              alignment: "right",
            },
          ],
          [
            { text: "TOTAL BIZUM:", style: "tTotals" },
            {
              text: closureData.total_bizum.toFixed(2) + " €",
              style: "tTotals",
              alignment: "right",
            },
          ],
          [
            { text: "TOTAL:", style: "tTotals" },
            {
              text: closureData.total.toFixed(2) + " €",
              style: "tTotals",
              alignment: "right",
            },
          ],
          [
            { text: "IVA (parte):", style: "tTotals" },
            {
              text: closureData.iva.toFixed(2) + " €",
              style: "tTotals",
              alignment: "right",
            },
          ],
        ],
      },
      layout: "noBorders",
    },
    // Recuadro con Firma
    {
      margin: [0, 10, 15, 0],
      table: {
        widths: ["100%"],
        body: [
          [
            {
              text: "\n\nFirma: __________________________",
              style: "text",
              alignment: "center",
              border: [true, true, true, true],
            },
          ],
        ],
      },
    },
  ];

  const pdfDefinition = {
    content,
    info: {
      title: "Ticket Cierre de Caja",
      author: config.author || "TPV",
      subject: "ticket cierre",
    },
    styles: {
      header: { fontSize: 8, bold: true, alignment: "center" },
      tHeaderLabel: { fontSize: 8, alignment: "right" },
      tHeaderValue: { fontSize: 8, bold: true },
      tTotals: { fontSize: 8, bold: true, alignment: "right" },
      text: { fontSize: 8, alignment: "center" },
    },
    pageMargins: [5.66, 5.66, 5.66, 5.66],
  };
  if (output === "print") {
    const remoteResult = await attemptRemotePrint(pdfDefinition);
    if (remoteResult) return remoteResult;
  }
  return await createPdf(pdfDefinition, output);
};

export const generateDiscountVoucherTicket = async (
  output,
  voucherData,
  config,
  employeesDict
) => {
  // voucherData debe incluir: reduction_amount, date_add, date_from, date_to, code,
  // y opcionalmente: customer_name, address_delivery, employee_name.

  // Cargar logo desde /logo-fajas-maylu.png y convertirlo a DataURL (base64)
  let logoDataUrl = "";
  try {
    const response = await fetch("/logo-fajas-maylu.png");
    if (response.ok) {
      const blob = await response.blob();
      logoDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (typeof logoDataUrl !== "string" || !logoDataUrl.startsWith("data:")) {
        logoDataUrl = "";
      }
    }
  } catch (err) {
    logoDataUrl = "";
  }

  // Función interna para generar código de barras con formato code128 en lugar de code126
  const generateBarcodeDataUrlCode126 = (text) => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "code128", // se cambió de "code126" a "code128"
      width: 1,
      height: 30,
      displayValue: false,
      margin: 2,
      rotation: 0,
    });
    return canvas.toDataURL("image/png");
  };

  // Formatear fechas
  const dateAdd = new Date(voucherData.date_add).toLocaleString("es-ES");
  const dateFrom = new Date(voucherData.date_from).toLocaleDateString("es-ES");
  const dateTo = new Date(voucherData.date_to).toLocaleDateString("es-ES");

  // Construir contenido del ticket
  const content = [
    // Logo
    ...(logoDataUrl
      ? [
          {
            image: logoDataUrl,
            fit: [170.07, 70.86],
            alignment: "center",
          },
        ]
      : []),
    // Cabeceras con fecha, cliente, dirección y empleado
    {
      text: "VALE DESCUENTO",
      style: "header",
      alignment: "center",
      margin: [0, 10, 0, 5],
      bold: true,
    },
    {
      margin: [0, 5, 0, 5],
      table: {
        widths: ["50%", "50%"],
        body: [
          [
            { text: "FECHA:", style: "tHeaderLabel" },
            { text: dateAdd, style: "tHeaderValue" },
          ],
          [
            { text: "CLIENTE:", style: "tHeaderLabel" },
            { text: voucherData.customer_name || "TPV", style: "tHeaderValue" },
          ],
          [
            { text: "DIRECCIÓN:", style: "tHeaderLabel" },
            {
              text: voucherData.address_delivery || "N/A",
              style: "tHeaderValue",
            },
          ],
          [
            { text: "EMPLEADO:", style: "tHeaderLabel" },
            { text: voucherData.employee_name || "TPV", style: "tHeaderValue" },
          ],
        ],
      },
      layout: "noBorders",
    },
    // Línea separadora
    {
      text: "------------------------------",
      alignment: "center",
      margin: [0, 5, 0, 5],
    },
    // Datos del vale
    {
      margin: [0, 5, 0, 5],
      table: {
        widths: ["50%", "50%"],
        body: [
          [
            { text: "IMPORTE VALE:", style: "tTotals" },
            {
              text: voucherData.reduction_amount.toFixed(2) + " €",
              style: "tTotals",
              alignment: "right",
            },
          ],
          [
            { text: "CREACIÓN VALE:", style: "tTotals" },
            { text: dateAdd, style: "tTotals", alignment: "right" },
          ],
          [
            { text: "VALIDEZ:", style: "tTotals" },
            {
              text: `Desde ${dateFrom} hasta ${dateTo}`,
              style: "tTotals",
              alignment: "right",
            },
          ],
        ],
      },
      layout: "noBorders",
    },
    // Línea separadora
    {
      text: "------------------------------",
      alignment: "center",
      margin: [0, 5, 0, 5],
    },
    // Código de barras con formato code126
    {
      stack: [
        {
          image: generateBarcodeDataUrlCode126(voucherData.code),
          alignment: "center",
          margin: [0, 5, 0, 5],
        },
        { text: voucherData.code, style: "text", alignment: "center" },
      ],
    },
  ];

  const pdfDefinition = {
    content,
    info: {
      title: "Ticket Vale Descuento",
      author: config.author || "TPV",
      subject: "ticket vale",
    },
    styles: {
      header: { fontSize: 10, bold: true, alignment: "center" },
      tHeaderLabel: { fontSize: 8, alignment: "right" },
      tHeaderValue: { fontSize: 8, bold: true },
      tTotals: { fontSize: 8, bold: true, alignment: "right" },
      text: { fontSize: 8, alignment: "center" },
    },
    pageMargins: [5.66, 5.66, 5.66, 5.66],
  };
  if (output === "print") {
    const remoteResult = await attemptRemotePrint(pdfDefinition);
    if (remoteResult) return remoteResult;
  }
  const response = await createPdf(pdfDefinition, output);
  return response;
};

export const openCashRegister = async (output, config, employeesDict) => {
  const content = [
    { text: "Open Cash Register", alignment: "center", fontSize: 10 },
  ];
  const pdfDefinition = {
    content,
    defaultStyle: { font: "Arial", fontSize: 10 },
  };
  // Si se llama en modo "print", se intenta la impresión remota
  if (output === "print") {
    const remoteResult = await attemptRemotePrint(pdfDefinition);
    if (remoteResult) return remoteResult;
  }
  const response = await createPdf(pdfDefinition, output);
  return response;
};
