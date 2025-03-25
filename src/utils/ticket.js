import createPdf from "./createPdf.js";
import JsBarcode from "jsbarcode";

// Se actualiza la función para recibir orderData y config como parámetros
const generateTicket = async (output, orderData, config, employeesDict) => {
  if (!orderData) {
    return {
      success: false,
      content: null,
      message: "No se proporcionaron datos de la orden.",
    };
  }

  // Construir tabla de productos en una sola fila de cabecera
  const productTableBody = [
    [
      { text: "PRODUCTO", style: "tProductsHeader" },
      { text: "UND", style: "tProductsHeader", alignment: "center" },
      { text: "PRECIO", style: "tProductsHeader", alignment: "right" },
      { text: "TOTAL", style: "tProductsHeader", alignment: "right" },
    ],
  ];
  orderData.order_details.forEach((item) => {
    let displayName = item.product_name;
    if (
      item.product_reference &&
      item.product_name.includes(item.product_reference)
    ) {
      const pos = item.product_name.indexOf(item.product_reference);
      displayName = item.product_name.substring(pos);
    }

    // Calcular precios unitarios
    const unitPrice = item.unit_price_tax_incl;
    const hasDiscount = item.reduction_amount_tax_incl !== 0;
    const finalUnitPrice = hasDiscount
      ? item.reduction_amount_tax_incl
      : unitPrice;

    // Construir texto para precio unitario (condicional)
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

    const quantity = item.product_quantity;
    const totalOriginal = unitPrice * quantity;
    const totalFinal = finalUnitPrice * quantity;

    // Construir texto para total del producto (condicional)
    const totalText = hasDiscount
      ? [
          { text: totalOriginal.toFixed(2) + " €", decoration: "lineThrough" },
          "\n",
          {
            text: totalFinal.toFixed(2) + " €",
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
  });

  // Calcular totales para la tabla final
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

  //const totalAfterDiscount = subtotal - totalDiscounts;
  const totalAfterDiscount = orderData.total_paid;

  // Calculate IVA (VAT) from total_paid (tax included amount)
  // Formula: IVA = total_paid - (total_paid / (1 + IVA_RATE))
  const iva = orderData.total_paid - orderData.total_paid / 1.21;

  // Alternative calculation if total_paid_tax_excl is available and accurate
  // const iva = orderData.total_paid - orderData.total_paid_tax_excl;

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
  const totalsBody = [
    [
      { text: "SUBTOTAL:", style: "tTotals" },
      {
        text: subtotal.toFixed(2) + " €",
        style: "tTotals",
        alignment: "right",
      },
    ],
  ];
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

  const content = [
    ...(config.ticket_logo_base64
      ? [
          {
            image: config.ticket_logo_base64,
            fit: [141.73, 56.692],
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
        widths: ["45%", "14%", "22%", "19%"],
        headerRows: 1,
        body: productTableBody,
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 0,
        hLineColor: () => "#f2f0f0",
        paddingTop: (i, node) => (i === 0 ? 10 : 5),
      },
    },
    // Tabla de totales
    {
      margin: [0, 10, 20, 0],
      table: {
        widths: ["50%", "50%"],
        body: totalsBody,
      },
      layout: "noBorders",
    },
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

  return await createPdf(pdfDefinition, output);
};
