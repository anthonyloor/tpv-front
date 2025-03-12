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

  // Construir tabla de productos (adaptado al ejemplo)
  const productTableBody = [
    [{ text: "PRODUCTO", colSpan: 4, style: "tProductsHeader" }, {}, {}, {}],
    [
      { text: "CANT.", style: "tProductsHeader" },
      { text: "UM", style: "tProductsHeader", alignment: "center" },
      { text: "PRECIO", style: "tProductsHeader", alignment: "right" },
      { text: "TOTAL", style: "tProductsHeader", alignment: "right" },
    ],
  ];
  orderData.order_details.forEach((item) => {
    productTableBody.push([
      {
        text: `${item.product_id} - ${item.product_name}`,
        style: "tProductsBody",
        colSpan: 4,
      },
      {},
      {},
      {},
    ]);
    productTableBody.push([
      {
        text: item.product_quantity.toString(),
        style: "tProductsBody",
        alignment: "center",
      },
      { text: "UND", style: "tProductsBody", alignment: "center" },
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
      image: null,
      fit: [141.73, 56.692],
      alignment: "center",
    },
    // Encabezados de config en mayúsculas
    ...(config.ticket_text_header_1
      ? [
          {
            text: config.ticket_text_header_1.toUpperCase(),
            style: "header",
            margin: [0, 10, 0, 0],
          },
        ]
      : []),
    ...(config.ticket_text_header_2
      ? [
          {
            text: config.ticket_text_header_2.toUpperCase(),
            style: "header",
          },
        ]
      : []),
    // Datos: fecha y hora extraída de date_add
    {
      margin: [0, 10, 0, 0],
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
      text: `CLIENTE: ${orderData.id_customer}`,
      style: "tHeaderValue",
      margin: [0, 10, 0, 0],
    },
    {
      text: "EMPLEADO: SOPORTE TÉCNICO",
      style: "tHeaderValue",
      margin: [0, 2, 0, 0],
    },
    // Tabla de productos
    {
      margin: [0, 10, 0, 0],
      table: {
        widths: ["20%", "20%", "30%", "30%"],
        headerRows: 2,
        body: productTableBody,
      },
      layout: {
        hLineWidth: (i, node) => (i === 2 ? 0.5 : 0),
        vLineWidth: () => 0,
        hLineColor: () => "#f2f0f0",
        paddingTop: (i, node) => (i % 2 === 0 ? 10 : 1),
      },
    },
    // Tabla de totales
    {
      margin: [0, 10, 0, 0],
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
    { text: "FORMA DE PAGO:", style: "tTotals", margin: [0, 10, 0, 0] },
    {
      margin: [0, 2, 0, 0],
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
    // Nota de pie (si existen)
    ...(config.ticket_text_footer_1
      ? [
          {
            text: config.ticket_text_footer_1,
            style: "text",
            alignment: "center",
            margin: [0, 5, 0, 0],
          },
        ]
      : []),
    ...(config.ticket_text_footer_2
      ? [
          {
            text: config.ticket_text_footer_2,
            style: "text",
            alignment: "center",
            margin: [0, 2, 0, 0],
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
          margin: [0, 10, 0, 3],
        },
        {
          text: "Ticket ID: " + orderData.id_order,
          style: "text",
          alignment: "center",
        },
      ],
    },
  ];

  const response = await createPdf({ content }, output);
  return response;
};

export default generateTicket;
