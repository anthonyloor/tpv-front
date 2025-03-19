import createPdf from "./createPdf.js";

// Se actualiza la función para recibir orderData y config como parámetros
const generateTicket = async (output, orderData, config) => {
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

  const content = [
    // LOGO
    {
      image:
        "data:image/png;base64,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AAASUVORK5CYII=", //Logo

      fit: [141.73, 56.692],
      alignment: "center",
    },
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
      margin: [0, 10, 10, 0],
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
    // Cliente y Empleado
    {
      text: `CLIENTE: ${orderData.customer_name}`,
      style: "tHeaderValue",
      margin: [0, 10, 10, 0],
    },
    {
      text: `EMPLEADO: ${orderData.id_employee}`,
      style: "tHeaderValue",
      margin: [0, 2, 10, 0],
    },
    // Tabla de productos
    {
      margin: [0, 10, 10, 0],
      table: {
        widths: ["50%", "15%", "17.5%", "17.5%"],
        headerRows: 1,
        body: productTableBody,
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => "#f2f0f0",
        paddingTop: (i, node) => (i === 0 ? 10 : 5),
      },
    },
    // Tabla de totales
    {
      margin: [0, 10, 10, 0],
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
    { text: "FORMA DE PAGO:", style: "tTotals", margin: [0, 10, 10, 0] },
    {
      margin: [0, 2, 10, 0],
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
            margin: [0, 5, 10, 0],
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
            margin: [0, 2, 10, 0],
            bold: true,
          },
        ]
      : []),
    // Se sustituye el QR por uno que contenga el id_order
    {
      stack: [
        {
          qr: orderData.id_order.toString(),
          fit: 115,
          alignment: "center",
          eccLevel: "Q",
          margin: [0, 10, 10, 3],
        },
        {
          text: "Ticket ID: " + orderData.id_order,
          style: "text",
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
