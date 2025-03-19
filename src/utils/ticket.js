import createPdf from "./createPdf.js";
import JsBarcode from "jsbarcode";

// Se actualiza la función para recibir orderData y config como parámetros
const generateTicket = async (
  output,
  orderData,
  config,
  employeesDict = {}
) => {
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
    // Si product_reference existe y se encuentra en product_name, mostrar desde allí
    if (
      item.product_reference &&
      item.product_name.includes(item.product_reference)
    ) {
      const pos = item.product_name.indexOf(item.product_reference);
      displayName = item.product_name.substring(pos);
    }
    productTableBody.push([
      { text: displayName, style: "tProductsBody" },
      {
        text: item.product_quantity.toString(),
        style: "tProductsBody",
        alignment: "center",
      },
      {
        text: item.unit_price_tax_incl.toFixed(2),
        style: "tProductsBody",
        alignment: "right",
      },
      {
        text: item.total_price_tax_incl.toFixed(2),
        style: "tProductsBody",
        alignment: "right",
      },
    ]);
  });

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
        employeesDict[orderData.id_employee]
          ? employeesDict[orderData.id_employee]
          : "N/A"
      }`,
      style: "tHeaderValue",
      margin: [0, 6, 15, 0],
    },
    // Tabla de productos
    {
      margin: [0, 10, 15, 0],
      table: {
        widths: ["45%", "13%", "17%", "20%"],
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
        body: [
          [
            { text: "SUBTOTAL:", style: "tTotals" },
            { text: "0€", style: "tTotals", alignment: "right" },
          ],
          [
            { text: "I.V.A (21%):", style: "tTotals" },
            {
              text: (orderData.total_paid * 0.21).toFixed(2),
              style: "tTotals",
              alignment: "right",
            },
          ],
          [
            { text: "TOTAL:", style: "tTotals" },
            {
              text: orderData.total_paid.toFixed(2),
              style: "tTotals",
              alignment: "right",
            },
          ],
        ],
      },
      layout: "noBorders",
    },
    // Forma de pago
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
              text: orderData.payment_amounts?.total_cash?.toString() || "0",
              style: "tTotals",
              alignment: "right",
            },
            {
              text: orderData.payment_amounts?.total_card?.toString() || "0",
              style: "tTotals",
              alignment: "right",
            },
            {
              text: orderData.payment_amounts?.total_bizum?.toString() || "0",
              style: "tTotals",
              alignment: "right",
            },
          ],
        ],
      },
      layout: "noBorders",
    },
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

  const pdfDefinition = { content, defaultStyle: { fontSize: 14 } };
  const response = await createPdf(pdfDefinition, output);
  return response;
};

export default generateTicket;
